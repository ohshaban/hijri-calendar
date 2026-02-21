import db from '../db.js'

export function requireAuth(c, next) {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Authentication required' }, 401)
  }

  const token = authHeader.slice(7)
  const now = Math.floor(Date.now() / 1000)

  const session = db.prepare(
    'SELECT * FROM sessions WHERE token = ? AND expires_at > ?'
  ).get(token, now)

  if (!session) {
    return c.json({ error: 'Invalid or expired session' }, 401)
  }

  c.set('email', session.email)
  c.set('sessionId', session.id)
  return next()
}
