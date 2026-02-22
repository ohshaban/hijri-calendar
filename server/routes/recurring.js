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
  const { title, description, hijriMonth, hijriDay, originYear, remindTime } = await c.req.json()

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

  db.prepare(
    `INSERT INTO recurring_events (id, email, title, description, hijri_month, hijri_day, origin_year, remind_time, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(id, email, title, description || '', hijriMonth, hijriDay, originYear, remindTime || '09:00', now)

  const event = db.prepare('SELECT * FROM recurring_events WHERE id = ?').get(id)

  // Generate first reminder instance
  generateReminderForEvent(event)

  return c.json({ recurringEvent: event }, 201)
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
