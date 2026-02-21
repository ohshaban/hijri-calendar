import Database from 'better-sqlite3'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dbPath = join(__dirname, 'data', 'hilal.db')

const db = new Database(dbPath)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS otp_codes (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    attempts INTEGER DEFAULT 0,
    used INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at INTEGER NOT NULL,
    created_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reminders (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT DEFAULT '',
    hijri_date TEXT NOT NULL,
    gregorian_date TEXT NOT NULL,
    remind_at INTEGER NOT NULL,
    sent INTEGER DEFAULT 0,
    cancelled INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_reminders_due
    ON reminders(remind_at) WHERE sent = 0 AND cancelled = 0;
  CREATE INDEX IF NOT EXISTS idx_reminders_email
    ON reminders(email);
  CREATE INDEX IF NOT EXISTS idx_otp_email
    ON otp_codes(email);
  CREATE INDEX IF NOT EXISTS idx_sessions_token
    ON sessions(token);
`)

export default db
