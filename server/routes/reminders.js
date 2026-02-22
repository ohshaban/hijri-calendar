import { Hono } from 'hono'
import { randomUUID } from 'crypto'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'

const reminders = new Hono()

// All routes require authentication
reminders.use('*', requireAuth)

// GET /api/reminders
reminders.get('/', (c) => {
  const email = c.get('email')
  const rows = db.prepare(
    'SELECT * FROM reminders WHERE email = ? AND cancelled = 0 ORDER BY remind_at ASC'
  ).all(email)
  return c.json({ reminders: rows })
})

// POST /api/reminders
reminders.post('/', async (c) => {
  const email = c.get('email')
  const { title, description, hijriDate, gregorianDate, remindAt } = await c.req.json()

  if (!title || !hijriDate || !gregorianDate || !remindAt) {
    return c.json({ error: 'Title, hijriDate, gregorianDate, and remindAt are required' }, 400)
  }

  if (title.length > 200) {
    return c.json({ error: 'Title must be under 200 characters' }, 400)
  }

  const remindAtTs = Math.floor(new Date(remindAt).getTime() / 1000)
  if (isNaN(remindAtTs) || remindAtTs < Math.floor(Date.now() / 1000)) {
    return c.json({ error: 'Remind time must be in the future' }, 400)
  }

  const id = randomUUID()
  const now = Math.floor(Date.now() / 1000)

  db.prepare(
    `INSERT INTO reminders (id, email, title, description, hijri_date, gregorian_date, remind_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, email, title, description || '', hijriDate, gregorianDate, remindAtTs, now)

  const reminder = db.prepare('SELECT * FROM reminders WHERE id = ?').get(id)
  return c.json({ reminder }, 201)
})

// PUT /api/reminders/:id
reminders.put('/:id', async (c) => {
  const email = c.get('email')
  const { id } = c.req.param()
  const { title, description, remindAt } = await c.req.json()

  const reminder = db.prepare(
    'SELECT * FROM reminders WHERE id = ? AND email = ? AND cancelled = 0'
  ).get(id, email)

  if (!reminder) {
    return c.json({ error: 'Reminder not found' }, 404)
  }

  if (reminder.sent) {
    return c.json({ error: 'Cannot edit a sent reminder' }, 400)
  }

  const updates = []
  const params = []

  if (title !== undefined) {
    if (!title || title.length > 200) {
      return c.json({ error: 'Title must be 1-200 characters' }, 400)
    }
    updates.push('title = ?')
    params.push(title)
  }

  if (description !== undefined) {
    updates.push('description = ?')
    params.push(description)
  }

  if (remindAt !== undefined) {
    const remindAtTs = Math.floor(new Date(remindAt).getTime() / 1000)
    if (isNaN(remindAtTs) || remindAtTs < Math.floor(Date.now() / 1000)) {
      return c.json({ error: 'Remind time must be in the future' }, 400)
    }
    updates.push('remind_at = ?')
    params.push(remindAtTs)
  }

  if (updates.length === 0) {
    return c.json({ error: 'No fields to update' }, 400)
  }

  params.push(id)
  db.prepare(`UPDATE reminders SET ${updates.join(', ')} WHERE id = ?`).run(...params)

  const updated = db.prepare('SELECT * FROM reminders WHERE id = ?').get(id)
  return c.json({ reminder: updated })
})

// DELETE /api/reminders/:id
reminders.delete('/:id', (c) => {
  const email = c.get('email')
  const { id } = c.req.param()

  const reminder = db.prepare(
    'SELECT * FROM reminders WHERE id = ? AND email = ?'
  ).get(id, email)

  if (!reminder) {
    return c.json({ error: 'Reminder not found' }, 404)
  }

  db.prepare('UPDATE reminders SET cancelled = 1 WHERE id = ?').run(id)
  return c.json({ message: 'Reminder cancelled' })
})

export default reminders
