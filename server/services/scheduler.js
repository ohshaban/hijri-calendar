import cron from 'node-cron'
import { randomUUID } from 'crypto'
import db from '../db.js'
import { sendReminderEmail } from './email.js'

// Handle @umalqura/core ESM import in Node
let uq
async function getUq() {
  if (uq) return uq
  const mod = (await import('@umalqura/core')).default
  uq = mod.default || mod
  return uq
}

function clampDay(year, month, day, uqFn) {
  const d = uqFn(year, month, 1)
  const maxDay = d.daysInMonth
  return Math.min(day, maxDay)
}

// Create a UTC timestamp for a given date/time in a specific timezone
function dateInTimezone(gregDate, hours, minutes, timezone) {
  // Build an ISO string for the date at the given time
  const y = gregDate.getFullYear()
  const m = String(gregDate.getMonth() + 1).padStart(2, '0')
  const d = String(gregDate.getDate()).padStart(2, '0')
  const dateStr = `${y}-${m}-${d}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`

  try {
    // Use Intl to find the UTC offset for this timezone at this date/time
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false,
    })

    // Create a date assuming UTC, then adjust by the timezone offset
    const utcDate = new Date(`${dateStr}Z`)
    const parts = formatter.formatToParts(utcDate)
    const getPart = (type) => parseInt(parts.find(p => p.type === type)?.value || '0')

    // The formatted time in the target timezone tells us what time it is there when it's dateStr in UTC
    // We need the reverse: what UTC time corresponds to dateStr in the target timezone
    // offset = localTime - utcTime => utcTime = localTime - offset
    const localInTz = new Date(
      getPart('year'), getPart('month') - 1, getPart('day'),
      getPart('hour'), getPart('minute'), getPart('second')
    )
    const offsetMs = localInTz.getTime() - utcDate.getTime()
    // The actual UTC time for the desired local time is: desired - offset
    const targetUtc = new Date(`${dateStr}Z`)
    targetUtc.setTime(targetUtc.getTime() - offsetMs)
    return targetUtc
  } catch {
    // Invalid timezone — fall back to treating time as UTC
    return new Date(`${dateStr}Z`)
  }
}

function findNextOccurrenceYear(hijriMonth, hijriDay, uqFn) {
  const today = uqFn(new Date())
  const currentYear = today.hy
  const currentMonth = today.hm
  const currentDay = today.hd

  // If the date is still ahead this year, use current year
  if (hijriMonth > currentMonth || (hijriMonth === currentMonth && hijriDay > currentDay)) {
    return currentYear
  }
  // Otherwise, next year
  return currentYear + 1
}

export function generateReminderForEvent(event) {
  getUq().then(uqFn => {
    try {
      const targetYear = findNextOccurrenceYear(event.hijri_month, event.hijri_day, uqFn)
      const clampedDay = clampDay(targetYear, event.hijri_month, event.hijri_day, uqFn)

      // Check for duplicate
      const existing = db.prepare(
        `SELECT id FROM reminders WHERE recurring_event_id = ? AND hijri_date LIKE ? AND cancelled = 0`
      ).get(event.id, `${targetYear}-%`)

      if (existing) return

      const hijriDateStr = `${targetYear}-${String(event.hijri_month).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`
      const gregDate = uqFn(targetYear, event.hijri_month, clampedDay).date
      const gregDateStr = gregDate.toISOString().split('T')[0]

      const [hours, minutes] = (event.remind_time || '09:00').split(':').map(Number)
      const remindDate = dateInTimezone(gregDate, hours, minutes, event.timezone || 'UTC')
      const remindAtTs = Math.floor(remindDate.getTime() / 1000)

      const id = randomUUID()
      const now = Math.floor(Date.now() / 1000)

      db.prepare(
        `INSERT INTO reminders (id, email, title, description, hijri_date, gregorian_date, remind_at, created_at, recurring_event_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(id, event.email, event.title, event.description || '', hijriDateStr, gregDateStr, remindAtTs, now, event.id)

      console.log(`Generated recurring reminder ${id} for event ${event.id} on ${hijriDateStr}`)
    } catch (err) {
      console.error(`Error generating reminder for recurring event ${event.id}:`, err)
    }
  })
}

async function generateRecurringReminders() {
  try {
    const uqFn = await getUq()
    const events = db.prepare('SELECT * FROM recurring_events WHERE active = 1').all()

    for (const event of events) {
      const targetYear = findNextOccurrenceYear(event.hijri_month, event.hijri_day, uqFn)
      const clampedDay = clampDay(targetYear, event.hijri_month, event.hijri_day, uqFn)

      // Check for existing reminder for this event + target year
      const existing = db.prepare(
        `SELECT id FROM reminders WHERE recurring_event_id = ? AND hijri_date LIKE ? AND cancelled = 0`
      ).get(event.id, `${targetYear}-%`)

      if (existing) continue

      const hijriDateStr = `${targetYear}-${String(event.hijri_month).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`
      const gregDate = uqFn(targetYear, event.hijri_month, clampedDay).date
      const gregDateStr = gregDate.toISOString().split('T')[0]

      const [hours, minutes] = (event.remind_time || '09:00').split(':').map(Number)
      const remindDate = dateInTimezone(gregDate, hours, minutes, event.timezone || 'UTC')
      const remindAtTs = Math.floor(remindDate.getTime() / 1000)

      const id = randomUUID()
      const now = Math.floor(Date.now() / 1000)

      db.prepare(
        `INSERT INTO reminders (id, email, title, description, hijri_date, gregorian_date, remind_at, created_at, recurring_event_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(id, event.email, event.title, event.description || '', hijriDateStr, gregDateStr, remindAtTs, now, event.id)

      console.log(`Generated recurring reminder ${id} for event ${event.id} on ${hijriDateStr}`)
    }
  } catch (err) {
    console.error('Error generating recurring reminders:', err)
  }
}

export function startScheduler() {
  // Run every minute to check for due reminders
  cron.schedule('* * * * *', async () => {
    const now = Math.floor(Date.now() / 1000)
    const dueReminders = db.prepare(
      'SELECT * FROM reminders WHERE remind_at <= ? AND sent = 0 AND cancelled = 0'
    ).all(now)

    for (const reminder of dueReminders) {
      const success = await sendReminderEmail(
        reminder.email,
        reminder.title,
        reminder.description,
        reminder.hijri_date
      )
      if (success) {
        db.prepare('UPDATE reminders SET sent = 1 WHERE id = ?').run(reminder.id)
        console.log(`Sent reminder ${reminder.id} to ${reminder.email}`)
      }
    }
  })

  // Generate recurring reminders daily at midnight
  cron.schedule('0 0 * * *', () => {
    generateRecurringReminders()
  })

  // Clean up expired OTP codes every hour
  cron.schedule('0 * * * *', () => {
    const now = Math.floor(Date.now() / 1000)
    const result = db.prepare('DELETE FROM otp_codes WHERE expires_at < ?').run(now)
    if (result.changes > 0) {
      console.log(`Cleaned up ${result.changes} expired OTP codes`)
    }
    // Clean up expired sessions
    const sessions = db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(now)
    if (sessions.changes > 0) {
      console.log(`Cleaned up ${sessions.changes} expired sessions`)
    }
  })

  // Run once on startup
  generateRecurringReminders()

  console.log('Scheduler started')
}
