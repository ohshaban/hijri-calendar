# Umami Analytics Setup (Self-Hosted)

Self-hosted [Umami v3](https://umami.is) on the same VPS as the Hilal Calendar app.

## Stack

- **Umami v3.0.3** — privacy-focused, cookie-free analytics
- **PostgreSQL** — Umami's database (separate from the app's SQLite)
- **pm2** — process manager (runs alongside `hilal-api`)
- **Caddy** — reverse proxy with auto-TLS at `analytics.hilalshaban.com`

## Installation Steps

### 1. PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo -u postgres psql
```

```sql
CREATE USER umami WITH PASSWORD '<password>';
CREATE DATABASE umami OWNER umami;
\q
```

### 2. Clone & Build Umami

```bash
cd /home/ubuntu
git clone https://github.com/umami-is/umami.git
cd umami

# Install pnpm if not already installed
npm install -g pnpm
pnpm install
```

Create `/home/ubuntu/umami/.env`:

```
DATABASE_URL=postgresql://umami:<password>@localhost:5432/umami
APP_SECRET=<generate with: openssl rand -base64 32>
TRACKER_SCRIPT_NAME=analytics.js
DISABLE_TELEMETRY=1
```

`TRACKER_SCRIPT_NAME=analytics.js` renames the tracker from `umami.js` to avoid ad blockers.

```bash
pnpm build
```

### 3. Run with pm2

Port 3003 (port 3000 is used by evntful.app):

```bash
pm2 start "PORT=3003 pnpm start" --name umami --cwd /home/ubuntu/umami
pm2 save
```

### 4. Caddy Config

Added to `/etc/caddy/Caddyfile`:

```
analytics.hilalshaban.com {
    encode gzip
    reverse_proxy localhost:3003
}
```

```bash
sudo caddy reload --config /etc/caddy/Caddyfile
```

### 5. DNS

Add an A record in your DNS provider:

- **Name**: `analytics`
- **Type**: A
- **Value**: `15.204.199.113`

Caddy auto-provisions the TLS certificate once DNS resolves.

### 6. Tracking Script

Added to `index.html`:

```html
<script defer src="https://analytics.hilalshaban.com/analytics.js"
        data-website-id="9d603e07-fa7a-429e-8d1f-5030366681d6"></script>
```

## Admin Access

- **URL**: https://analytics.hilalshaban.com
- **Default credentials**: `admin` / `umami` (change immediately after first login)

## Useful Commands

```bash
# Check status
pm2 status umami

# View logs
pm2 logs umami

# Restart
pm2 restart umami

# Update Umami
cd /home/ubuntu/umami
git pull
pnpm install
pnpm build
pm2 restart umami
```

## Notes

- Umami warns about `output: standalone` in Next.js config — this is harmless when using `pnpm start`
- The "Failed to find Server Action" errors in logs are from stale browser sessions after rebuilds — they resolve on their own
- Website ID `9d603e07-fa7a-429e-8d1f-5030366681d6` was created via the Umami API on initial setup
