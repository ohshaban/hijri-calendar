# Hilal Calendar

A Hijri (Islamic) calendar web application with email reminders. Users can browse an interactive Hijri calendar, view notable Islamic dates, set one-time reminders for future dates, and create recurring annual reminders for anniversaries and significant life events. Built with Vue 3 + Tailwind CSS on the frontend and Hono + SQLite on the backend.

**Live at [hilalshaban.com](https://hilalshaban.com)**

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Environment Variables](#environment-variables)
- [Running Locally](#running-locally)
- [How It Works](#how-it-works)
  - [Authentication](#authentication)
  - [Calendar & Hijri Dates](#calendar--hijri-dates)
  - [One-Time Reminders](#one-time-reminders)
  - [Recurring Annual Reminders](#recurring-annual-reminders)
  - [Scheduler](#scheduler)
  - [Email](#email)
  - [Internationalization (i18n)](#internationalization-i18n)
- [Database Schema](#database-schema)
- [API Reference](#api-reference)
- [Production Deployment](#production-deployment)
- [Common Tasks](#common-tasks)
- [Troubleshooting](#troubleshooting)
- [License](#license)

---

## Features

- Interactive Hijri calendar with month/year navigation
- Notable Islamic dates highlighted on the calendar (Ramadan, Eid, Ashura, etc.)
- Bilingual interface: English and Arabic with full RTL support
- Dark mode with system preference detection
- Passwordless email authentication (OTP-based)
- One-time email reminders for specific Hijri dates
- Recurring annual reminders for anniversaries (e.g. wedding on 15 Sha'ban 1440 -- get reminded every year)
- Automatic Hijri-to-Gregorian date conversion via the Umm al-Qura calendar

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend framework | [Vue 3](https://vuejs.org/) (Composition API, `<script setup>`) | Reactive UI components |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) | Utility-first CSS |
| Build tool | [Vite](https://vite.dev/) | Dev server with HMR + production bundler |
| Backend framework | [Hono](https://hono.dev/) | Lightweight HTTP framework for Node.js |
| Database | [SQLite](https://sqlite.org/) via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) | Embedded database, no external server needed |
| Hijri dates | [@umalqura/core](https://github.com/nickvdyck/umalqura-core) | Umm al-Qura Hijri calendar conversions |
| Email | [Resend](https://resend.com/) | Transactional email API for OTPs and reminders |
| Scheduler | [node-cron](https://github.com/node-cron/node-cron) | Cron-based background jobs |
| Process manager | [PM2](https://pm2.io/) | Production process management |
| Reverse proxy | [Caddy](https://caddyserver.com/) | HTTPS termination and static file serving |

---

## Project Structure

```
calendar/
├── index.html                  # HTML entry point
├── package.json                # Dependencies and scripts
├── vite.config.js              # Vite config (Vue plugin, Tailwind, dev proxy)
├── .env                        # Environment variables (not committed)
├── .env.example                # Template for .env
│
├── server/                     # Backend (Node.js, runs on port 3002)
│   ├── index.js                # Hono app setup, middleware, route mounting
│   ├── db.js                   # SQLite database init + schema
│   ├── middleware/
│   │   └── auth.js             # Bearer token authentication middleware
│   ├── routes/
│   │   ├── auth.js             # OTP request, verify, logout, session check
│   │   ├── reminders.js        # CRUD for one-time reminders
│   │   └── recurring.js        # CRUD for recurring annual events
│   ├── services/
│   │   ├── email.js            # Resend email sending (OTP + reminder emails)
│   │   └── scheduler.js        # Cron jobs: send due reminders, generate recurring instances, cleanup
│   └── data/
│       └── hilal.db            # SQLite database file (auto-created, not committed)
│
├── src/                        # Frontend (Vue 3 SPA)
│   ├── main.js                 # App bootstrap (language, dark mode restore)
│   ├── App.vue                 # Root component (layout, modals, state wiring)
│   ├── style.css               # Tailwind imports + custom base styles
│   ├── components/
│   │   ├── CalendarHeader.vue  # Month/year navigation + dropdowns
│   │   ├── CalendarGrid.vue    # 7-column grid with day cells
│   │   ├── DayCell.vue         # Individual day: Hijri number, Gregorian, Islamic event, reminder dots
│   │   ├── TodayInfo.vue       # "Today is X Hijri" banner
│   │   ├── AuthModal.vue       # Email + OTP sign-in flow
│   │   ├── ReminderModal.vue   # Create reminder form (one-time or recurring)
│   │   └── ReminderList.vue    # View all reminders + recurring events
│   ├── composables/
│   │   ├── useCalendar.js      # Calendar state: current month/year, day generation
│   │   ├── useAuth.js          # Auth state: login, logout, session check
│   │   └── useReminders.js     # Reminders + recurring events state and API calls
│   └── utils/
│       ├── hijri.js            # Hijri date helpers (toHijri, toGregorian, daysInMonth, formatting)
│       ├── islamicDates.js     # Notable Islamic dates lookup table
│       ├── api.js              # HTTP client (fetch wrapper with auth headers)
│       └── i18n.js             # Translation strings (EN/AR) and language state
│
└── dist/                       # Production build output (not committed)
```

---

## Prerequisites

- **Node.js v20+** (the project uses Vite 7 which requires Node 20.19+)
- **npm** (comes with Node.js)
- A **Resend** account and API key for sending emails (free tier works for development)

### Installing Node.js

If you're on a fresh machine, use [nvm](https://github.com/nvm-sh/nvm) (Node Version Manager):

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash

# Restart your shell, then install Node 20
nvm install 20
nvm alias default 20

# Verify
node --version   # Should print v20.x.x
```

---

## Local Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/ohshaban/hijri-calendar.git
cd hijri-calendar

# 2. Install dependencies
npm install

# 3. Create your environment file
cp .env.example .env
# Then edit .env and add your Resend API key (see next section)
```

---

## Environment Variables

Create a `.env` file in the project root (or copy `.env.example`):

```env
RESEND_API_KEY=re_xxxxx        # Required. Get one at https://resend.com
PORT=3002                      # Optional. API server port (default: 3002)
```

**Notes:**
- Without a valid `RESEND_API_KEY`, the server will crash on startup. You can get a free key at [resend.com](https://resend.com/signup).
- On Resend's free tier, you can only send to the email address associated with your account. To send to other addresses, verify a custom domain in Resend's dashboard.

---

## Running Locally

You need **two terminals** -- one for the API server and one for the Vite dev server:

### Terminal 1: Start the API server

```bash
npm run server
# or equivalently: node server/index.js
```

This starts the Hono API server on `http://localhost:3002`. You should see:

```
Scheduler started
Hilal API server running on port 3002
```

### Terminal 2: Start the Vite dev server

```bash
npm run dev
```

This starts the frontend dev server on `http://localhost:5173` with hot module replacement (HMR). Open this URL in your browser.

**How the dev proxy works:** Vite is configured (in `vite.config.js`) to proxy all `/api/*` requests to `http://localhost:3002`. This means the frontend and backend work together seamlessly during development without CORS issues.

---

## How It Works

### Authentication

The app uses **passwordless email authentication** via one-time passwords (OTPs):

1. User enters their email address.
2. Server generates a random 6-digit code, hashes it with SHA-256, stores it in the `otp_codes` table, and sends the plaintext code via Resend.
3. User enters the code. Server verifies the hash, and if correct, creates a session (UUID token stored in `sessions` table, 24-hour expiry).
4. The token is stored in `localStorage` on the client and sent as a `Bearer` token in the `Authorization` header for all subsequent API requests.

**Rate limiting:** Max 3 OTP requests per email per hour, 5 verification attempts per code. There's also a global IP-based rate limiter (10 req/min for auth, 60 req/min for other API routes).

**Files:** `server/routes/auth.js`, `server/middleware/auth.js`, `src/composables/useAuth.js`, `src/components/AuthModal.vue`

### Calendar & Hijri Dates

The calendar uses the **Umm al-Qura** calendar system (the official calendar of Saudi Arabia) via the `@umalqura/core` library. Key operations:

- `uq(new Date())` -- convert a Gregorian JS Date to Hijri (year, month, day)
- `uq(year, month, day)` -- create a Hijri date, access `.date` for the Gregorian `Date` object
- `uq(year, month, 1).daysInMonth` -- get number of days in a Hijri month (29 or 30)

The calendar grid is a computed 7-column layout. Each day cell shows the Hijri day number, the corresponding Gregorian date, and any notable Islamic date (from a static lookup table in `islamicDates.js`).

**Files:** `src/utils/hijri.js`, `src/utils/islamicDates.js`, `src/composables/useCalendar.js`, `src/components/CalendarGrid.vue`, `src/components/DayCell.vue`

### One-Time Reminders

A user clicks on a calendar day, fills in a title, optional description, and time, and the app creates a reminder:

- The frontend sends the Hijri date string (e.g. `1447-09-05`), Gregorian date string, and a full `remindAt` ISO timestamp.
- The server stores it in the `reminders` table with `remind_at` as a Unix timestamp.
- The scheduler checks every minute for due reminders (`remind_at <= now AND sent = 0 AND cancelled = 0`) and sends an email via Resend.

**Files:** `server/routes/reminders.js`, `src/composables/useReminders.js`, `src/components/ReminderModal.vue`, `src/components/ReminderList.vue`

### Recurring Annual Reminders

For events like wedding anniversaries or birthdays that recur every Hijri year:

1. User clicks a day, enables the "Recurring annual reminder" toggle, and fills in the form.
2. A row is created in `recurring_events` with the Hijri month, day, origin year (informational), and preferred remind time.
3. The system immediately generates a concrete `reminders` row for the **next upcoming occurrence** (this year if the date hasn't passed, otherwise next year).
4. A daily scheduler job scans all active recurring events and generates reminder instances for the upcoming year if one doesn't already exist.
5. When a reminder is sent, the next year's instance is generated on the next scheduler run.

**Edge cases handled:**
- **Day clamping:** Hijri months alternate between 29-30 days. If an event is on day 30 but a given year's month only has 29 days, it's clamped to day 29.
- **Duplicate prevention:** Before generating, the system checks if a reminder for that `recurring_event_id` + Hijri year already exists.

**Files:** `server/routes/recurring.js`, `server/services/scheduler.js`

### Scheduler

The scheduler (`server/services/scheduler.js`) runs three cron jobs:

| Schedule | Job | Description |
|----------|-----|-------------|
| `* * * * *` (every minute) | Send due reminders | Finds unsent, uncancelled reminders where `remind_at <= now` and sends emails |
| `0 0 * * *` (daily at midnight) | Generate recurring reminders | Creates next-year reminder instances for active recurring events |
| `0 * * * *` (every hour) | Cleanup | Deletes expired OTP codes and sessions |

The recurring reminder generator also runs once on server startup.

### Email

All emails are sent via [Resend](https://resend.com). The `server/services/email.js` module exports two functions:

- `sendOtpEmail(to, code)` -- sends the 6-digit verification code
- `sendReminderEmail(to, title, description, hijriDate)` -- sends the reminder notification

Both use simple inline-styled HTML templates. The sender address defaults to `Hilal Calendar <noreply@hilalshaban.com>` (overridable via `FROM_EMAIL` env var).

### Internationalization (i18n)

The app supports **English** and **Arabic** with full RTL layout support:

- Translations are stored as a plain object in `src/utils/i18n.js`.
- The `useLang()` composable provides `t(key)` for translation lookup, `lang` for the current language, and `isRtl`/`dir` for layout direction.
- Language preference is persisted in `localStorage`.
- Arabic uses the "Noto Naskh Arabic" font; English uses "Inter".
- Arabic-Indic numerals (٠١٢٣٤٥٦٧٨٩) are used when the language is Arabic.

---

## Database Schema

The SQLite database is stored at `server/data/hilal.db` and is auto-created on first server start. It uses WAL mode for concurrent reads.

### `otp_codes`

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | UUID |
| email | TEXT | User email (lowercase) |
| code_hash | TEXT | SHA-256 hash of the 6-digit code |
| expires_at | INTEGER | Unix timestamp (10-minute expiry) |
| attempts | INTEGER | Verification attempts (max 5) |
| used | INTEGER | 0 or 1 |
| created_at | INTEGER | Unix timestamp |

### `sessions`

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | UUID |
| email | TEXT | User email |
| token | TEXT UNIQUE | Bearer token (UUID) |
| expires_at | INTEGER | Unix timestamp (24-hour expiry) |
| created_at | INTEGER | Unix timestamp |

### `reminders`

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | UUID |
| email | TEXT | User email |
| title | TEXT | Reminder title (max 200 chars) |
| description | TEXT | Optional description |
| hijri_date | TEXT | e.g. `1447-09-05` |
| gregorian_date | TEXT | e.g. `2026-02-22` |
| remind_at | INTEGER | Unix timestamp for when to send |
| sent | INTEGER | 0 or 1 |
| cancelled | INTEGER | 0 or 1 |
| created_at | INTEGER | Unix timestamp |
| recurring_event_id | TEXT | FK to `recurring_events.id` (NULL for one-time reminders) |

### `recurring_events`

| Column | Type | Description |
|--------|------|-------------|
| id | TEXT PK | UUID |
| email | TEXT | User email |
| title | TEXT | Event title |
| description | TEXT | Optional description |
| hijri_month | INTEGER | 1-12 |
| hijri_day | INTEGER | 1-30 |
| origin_year | INTEGER | The Hijri year of the original event (informational) |
| remind_time | TEXT | Time of day to remind, e.g. `09:00` |
| active | INTEGER | 1 = active, 0 = deactivated |
| created_at | INTEGER | Unix timestamp |

---

## API Reference

All API routes are prefixed with `/api`. Authenticated routes require a `Authorization: Bearer <token>` header.

### Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/request-otp` | No | Send OTP to email. Body: `{ "email": "..." }` |
| POST | `/api/auth/verify-otp` | No | Verify OTP. Body: `{ "email": "...", "code": "123456" }`. Returns `{ "token": "..." }` |
| POST | `/api/auth/logout` | No | Invalidate session |
| GET | `/api/auth/me` | No | Check session. Returns `{ "authenticated": true/false, "email": "..." }` |

### Reminders

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/reminders` | Yes | List user's reminders (non-cancelled) |
| POST | `/api/reminders` | Yes | Create a reminder. Body: `{ "title", "description", "hijriDate", "gregorianDate", "remindAt" }` |
| DELETE | `/api/reminders/:id` | Yes | Cancel a reminder (soft delete) |

### Recurring Events

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/recurring` | Yes | List user's active recurring events |
| POST | `/api/recurring` | Yes | Create a recurring event. Body: `{ "title", "description", "hijriMonth", "hijriDay", "originYear", "remindTime" }` |
| DELETE | `/api/recurring/:id` | Yes | Deactivate event + cancel all unsent reminder instances |

### Utility

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | No | Health check. Returns `{ "status": "ok" }` |

---

## Production Deployment

The production server at hilalshaban.com runs on an Ubuntu VPS with this setup:

### Architecture

```
Internet
  │
  ▼
Caddy (HTTPS, auto-TLS)
  ├── /api/*  →  reverse_proxy localhost:3002  (Hono API via PM2)
  └── /*      →  static files from dist/       (Vite build output)
```

### Build and deploy

```bash
# Build the frontend
npm run build

# Restart the API server
pm2 restart hilal-api
```

### PM2 setup (first time)

The API server is managed by PM2. The initial setup was:

```bash
# Start the server with --env-file for loading .env
pm2 start server/index.js --name hilal-api --interpreter node --node-args="--env-file=.env"

# Save the process list so it restarts on reboot
pm2 save

# Set up PM2 to start on system boot
pm2 startup
```

Useful PM2 commands:

```bash
pm2 list                    # Show running processes
pm2 logs hilal-api          # Tail logs (stdout + stderr)
pm2 logs hilal-api --lines 50  # Show last 50 lines
pm2 restart hilal-api       # Restart after code changes
pm2 show hilal-api          # Detailed process info
```

### Caddy config

Caddy handles HTTPS (automatic Let's Encrypt certificates) and serves the built frontend as static files. The config lives at `/etc/caddy/Caddyfile`:

```caddyfile
hilalshaban.com {
    encode gzip

    handle /api/* {
        reverse_proxy localhost:3002
    }

    handle {
        root * /home/ubuntu/hilal/calendar/dist
        try_files {path} /index.html
        file_server
    }
}
```

### Full deploy workflow

```bash
cd /home/ubuntu/hilal/calendar

# Pull latest changes
git pull

# Install any new dependencies
npm install

# Build frontend
npm run build

# Restart API
pm2 restart hilal-api
```

---

## Common Tasks

### Add a new translation key

Edit `src/utils/i18n.js`. Add the key to both the `en` and `ar` objects:

```js
// In the en object:
myNewKey: 'English text',

// In the ar object:
myNewKey: 'النص العربي',
```

Use it in a component: `{{ t('myNewKey') }}`

### Add a new API route

1. Create a new file in `server/routes/` (follow the pattern in `reminders.js`).
2. Import and mount it in `server/index.js`:
   ```js
   import myRoute from './routes/myroute.js'
   app.route('/api/myroute', myRoute)
   ```
3. Add the `requireAuth` middleware if the route needs authentication.

### Add a new frontend component

1. Create a `.vue` file in `src/components/`.
2. Use `<script setup>` with the Composition API.
3. Import and use it in `App.vue` or another parent component.
4. All Tailwind classes work out of the box -- no configuration needed.

### Inspect the database

```bash
# Open the SQLite database
sqlite3 server/data/hilal.db

# Example queries
.tables
SELECT * FROM reminders WHERE sent = 0;
SELECT * FROM recurring_events WHERE active = 1;
SELECT * FROM sessions ORDER BY created_at DESC LIMIT 5;
.quit
```

### Reset the database

Delete the database file and restart the server. Tables are auto-created on startup:

```bash
rm server/data/hilal.db*
pm2 restart hilal-api
```

---

## Troubleshooting

### Server crashes with "Missing API key"

You need a Resend API key in your `.env` file. Sign up at [resend.com](https://resend.com) and add `RESEND_API_KEY=re_xxxxx` to `.env`.

### `npm run build` fails with "Node.js version" error

Vite 7 requires Node.js 20.19+. Check your version with `node --version`. If you're using nvm:

```bash
nvm install 20
nvm alias default 20
```

### `@umalqura/core` import issues in Node.js

The library's ESM export has a quirk in Node.js where the default export is double-wrapped. The server code handles this with:

```js
const mod = (await import('@umalqura/core')).default
const uq = mod.default || mod
```

This pattern is already in `server/services/scheduler.js`. The frontend import (`import uq from '@umalqura/core'`) works as-is because Vite handles it.

### Emails not sending on free Resend tier

On Resend's free tier, you can only send to your own email. To send to other addresses, you need to verify a domain in the Resend dashboard and update the `FROM_EMAIL` in your `.env` if needed.

### Port 3002 already in use

Either stop the existing process or change the `PORT` in `.env`:

```bash
# Find what's using the port
lsof -i :3002

# Or change the port
echo "PORT=3003" >> .env
```

---

## License

Apache License 2.0. See [LICENSE](LICENSE) for details.
