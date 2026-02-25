import { Hono } from 'hono'
import { randomUUID } from 'crypto'
import db from '../db.js'
import { requireAuth } from '../middleware/auth.js'
import { generateReminderForEvent } from '../services/scheduler.js'

const recurring = new Hono()

recurring.use('*', requireAuth)

// GET /api/recurring
recurring.get('/', (c) => {
  const email = c.get('email')
  const rows = db.prepare(
    'SELECT * FROM recurring_events WHERE email = ? AND active = 1 ORDER BY created_at DESC'
  ).all(email)
  return c.json({ recurringEvents: rows })
})

// POST /api/recurring
recurring.post('/', async (c) => {
  const email = c.get('email')
  const { title, description, hijriMonth, hijriDay, originYear, remindTime, timezone, remindDaysBefore } = await c.req.json()

  if (!title || !hijriMonth || !hijriDay || !originYear) {
    return c.json({ error: 'title, hijriMonth, hijriDay, and originYear are required' }, 400)
  }

  if (title.length > 200) {
    return c.json({ error: 'Title must be under 200 characters' }, 400)
  }

  if (hijriMonth < 1 || hijriMonth > 12 || hijriDay < 1 || hijriDay > 30) {
    return c.json({ error: 'Invalid Hijri month or day' }, 400)
  }

  const id = randomUUID()
  const now = Math.floor(Date.now() / 1000)

  const daysBefore = Math.max(0, Math.min(30, parseInt(remindDaysBefore) || 0))
  db.prepare(
    `INSERT INTO recurring_events (id, email, title, description, hijri_month, hijri_day, origin_year, remind_time, timezone, remind_days_before, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, email, title, description || '', hijriMonth, hijriDay, originYear, remindTime || '09:00', timezone || 'UTC', daysBefore, now)

  const event = db.prepare('SELECT * FROM recurring_events WHERE id = ?').get(id)

  // Generate first reminder instance
  generateReminderForEvent(event)

  return c.json({ recurringEvent: event }, 201)
})

// PUT /api/recurring/:id
recurring.put('/:id', async (c) => {
  const email = c.get('email')
  const { id } = c.req.param()
  const { title, description, remindTime, remindDaysBefore } = await c.req.json()

  const event = db.prepare(
    'SELECT * FROM recurring_events WHERE id = ? AND email = ? AND active = 1'
  ).get(id, email)

  if (!event) {
    return c.json({ error: 'Recurring event not found' }, 404)
  }

  const updates = []
  const params = []

  if (title !== undefined) {
    if (!title || title.length > 200) return c.json({ error: 'Title must be 1-200 characters' }, 400)
    updates.push('title = ?')
    params.push(title)
  }
  if (description !== undefined) {
    updates.push('description = ?')
    params.push(description)
  }
  if (remindTime !== undefined) {
    updates.push('remind_time = ?')
    params.push(remindTime)
  }
  if (remindDaysBefore !== undefined) {
    updates.push('remind_days_before = ?')
    params.push(Math.max(0, Math.min(30, parseInt(remindDaysBefore) || 0)))
  }

  if (updates.length === 0) return c.json({ error: 'No fields to update' }, 400)

  params.push(id)
  db.prepare(`UPDATE recurring_events SET ${updates.join(', ')} WHERE id = ?`).run(...params)

  // Cancel unsent instances and regenerate with new settings
  db.prepare('UPDATE reminders SET cancelled = 1 WHERE recurring_event_id = ? AND sent = 0').run(id)
  const updated = db.prepare('SELECT * FROM recurring_events WHERE id = ?').get(id)
  generateReminderForEvent(updated)

  return c.json({ recurringEvent: updated })
})

// DELETE /api/recurring/:id
recurring.delete('/:id', (c) => {
  const email = c.get('email')
  const { id } = c.req.param()

  const event = db.prepare(
    'SELECT * FROM recurring_events WHERE id = ? AND email = ?'
  ).get(id, email)

  if (!event) {
    return c.json({ error: 'Recurring event not found' }, 404)
  }

  // Deactivate the event
  db.prepare('UPDATE recurring_events SET active = 0 WHERE id = ?').run(id)

  // Cancel all unsent reminder instances
  db.prepare(
    'UPDATE reminders SET cancelled = 1 WHERE recurring_event_id = ? AND sent = 0'
  ).run(id)

  return c.json({ message: 'Recurring event deleted' })
})

export default recurring
