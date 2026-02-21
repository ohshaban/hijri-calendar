import cron from 'node-cron'
import db from '../db.js'
import { sendReminderEmail } from './email.js'

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

  console.log('Scheduler started')
}
