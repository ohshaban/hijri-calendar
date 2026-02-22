const BASE = '/api'

function getToken() {
  return localStorage.getItem('hilal_token')
}

function authHeaders() {
  const token = getToken()
  const headers = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`
  return headers
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: authHeaders(),
    ...options,
  })
  const data = await res.json()
  if (!res.ok) throw { status: res.status, ...data }
  return data
}

// Auth
export async function requestOtp(email) {
  return request('/auth/request-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function verifyOtp(email, code) {
  const data = await request('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  })
  if (data.token) {
    localStorage.setItem('hilal_token', data.token)
    localStorage.setItem('hilal_email', data.email)
  }
  return data
}

export async function checkAuth() {
  try {
    return await request('/auth/me')
  } catch {
    return { authenticated: false }
  }
}

export async function logout() {
  try {
    await request('/auth/logout', { method: 'POST' })
  } finally {
    localStorage.removeItem('hilal_token')
    localStorage.removeItem('hilal_email')
  }
}

// Reminders
export async function getReminders() {
  return request('/reminders')
}

export async function createReminder(data) {
  return request('/reminders', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deleteReminder(id) {
  return request(`/reminders/${id}`, { method: 'DELETE' })
}

// Recurring Events
export async function getRecurringEvents() {
  return request('/recurring')
}

export async function createRecurringEvent(data) {
  return request('/recurring', { method: 'POST', body: JSON.stringify(data) })
}

export async function deleteRecurringEvent(id) {
  return request(`/recurring/${id}`, { method: 'DELETE' })
}
