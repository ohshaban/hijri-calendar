import { Hono } from 'hono'
import { createHash, randomInt, randomUUID } from 'crypto'
import db from '../db.js'
import { sendOtpEmail } from '../services/email.js'

const auth = new Hono()

function hashCode(code) {
  return createHash('sha256').update(code).digest('hex')
}

// Rate limit check: max 3 OTP requests per email per hour
function checkOtpRateLimit(email) {
  const oneHourAgo = Math.floor(Date.now() / 1000) - 3600
  const count = db.prepare(
    'SELECT COUNT(*) as count FROM otp_codes WHERE email = ? AND created_at > ?'
  ).get(email, oneHourAgo)
  return count.count < 3
}

// POST /api/auth/request-otp
auth.post('/request-otp', async (c) => {
  const { email } = await c.req.json()

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return c.json({ error: 'Valid email is required' }, 400)
  }

  const normalizedEmail = email.toLowerCase().trim()

  if (!checkOtpRateLimit(normalizedEmail)) {
    return c.json({ error: 'Too many OTP requests. Please try again later.' }, 429)
  }

  // Invalidate any existing unused OTPs for this email
  db.prepare(
    'UPDATE otp_codes SET used = 1 WHERE email = ? AND used = 0'
  ).run(normalizedEmail)

  const code = String(randomInt(100000, 999999))
  const id = randomUUID()
  const now = Math.floor(Date.now() / 1000)

  db.prepare(
    'INSERT INTO otp_codes (id, email, code_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(id, normalizedEmail, hashCode(code), now + 600, now) // 10 min expiry

  try {
    await sendOtpEmail(normalizedEmail, code)
    return c.json({ message: 'OTP sent to your email' })
  } catch (err) {
    return c.json({ error: 'Failed to send OTP. Please try again.' }, 500)
  }
})

// POST /api/auth/verify-otp
auth.post('/verify-otp', async (c) => {
  const { email, code } = await c.req.json()

  if (!email || !code) {
    return c.json({ error: 'Email and code are required' }, 400)
  }

  const normalizedEmail = email.toLowerCase().trim()
  const now = Math.floor(Date.now() / 1000)

  const otp = db.prepare(
    'SELECT * FROM otp_codes WHERE email = ? AND used = 0 AND expires_at > ? ORDER BY created_at DESC LIMIT 1'
  ).get(normalizedEmail, now)

  if (!otp) {
    return c.json({ error: 'No valid OTP found. Please request a new one.' }, 400)
  }

  // Check attempts
  if (otp.attempts >= 5) {
    db.prepare('UPDATE otp_codes SET used = 1 WHERE id = ?').run(otp.id)
    return c.json({ error: 'Too many attempts. Please request a new code.' }, 429)
  }

  // Increment attempts
  db.prepare('UPDATE otp_codes SET attempts = attempts + 1 WHERE id = ?').run(otp.id)

  if (hashCode(code) !== otp.code_hash) {
    const remaining = 4 - otp.attempts
    return c.json({ error: `Invalid code. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.` }, 400)
  }

  // Mark OTP as used
  db.prepare('UPDATE otp_codes SET used = 1 WHERE id = ?').run(otp.id)

  // Create session (24h expiry)
  const sessionId = randomUUID()
  const token = randomUUID()

  db.prepare(
    'INSERT INTO sessions (id, email, token, expires_at, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(sessionId, normalizedEmail, token, now + 86400, now)

  return c.json({ token, email: normalizedEmail })
})

// POST /api/auth/logout
auth.post('/logout', async (c) => {
  const authHeader = c.req.header('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token)
  }
  return c.json({ message: 'Logged out' })
})

// GET /api/auth/me - check if session is valid
auth.get('/me', (c) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ authenticated: false })
  }

  const token = authHeader.slice(7)
  const now = Math.floor(Date.now() / 1000)
  const session = db.prepare(
    'SELECT email FROM sessions WHERE token = ? AND expires_at > ?'
  ).get(token, now)

  if (!session) {
    return c.json({ authenticated: false })
  }

  return c.json({ authenticated: true, email: session.email })
})

export default auth
