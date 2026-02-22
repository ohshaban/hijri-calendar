import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import auth from './routes/auth.js'
import reminders from './routes/reminders.js'
import recurring from './routes/recurring.js'
import { startScheduler } from './services/scheduler.js'

const app = new Hono()

app.use('/api/*', cors({
  origin: ['https://hilalshaban.com', 'http://localhost:5173'],
  allowMethods: ['GET', 'POST', 'DELETE'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

// Simple in-memory rate limiter
const rateLimitStore = new Map()

function rateLimit(windowMs, maxRequests) {
  return async (c, next) => {
    const key = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown'
    const now = Date.now()
    const windowStart = now - windowMs

    let entry = rateLimitStore.get(key)
    if (!entry) {
      entry = []
      rateLimitStore.set(key, entry)
    }

    // Remove old entries
    while (entry.length > 0 && entry[0] < windowStart) entry.shift()

    if (entry.length >= maxRequests) {
      return c.json({ error: 'Too many requests' }, 429)
    }

    entry.push(now)
    return next()
  }
}

// Clean up rate limit store every 5 minutes
setInterval(() => {
  const cutoff = Date.now() - 300000
  for (const [key, entries] of rateLimitStore) {
    const filtered = entries.filter(t => t > cutoff)
    if (filtered.length === 0) rateLimitStore.delete(key)
    else rateLimitStore.set(key, filtered)
  }
}, 300000)

app.use('/api/auth/*', rateLimit(60000, 10))
app.use('/api/*', rateLimit(60000, 60))

app.route('/api/auth', auth)
app.route('/api/reminders', reminders)
app.route('/api/recurring', recurring)

app.get('/api/health', (c) => c.json({ status: 'ok' }))

const port = parseInt(process.env.PORT || '3002')

startScheduler()

serve({ fetch: app.fetch, port }, () => {
  console.log(`Hilal API server running on port ${port}`)
})
