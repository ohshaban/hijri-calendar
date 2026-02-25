# Hilal Calendar - Gaps & Next Steps

## Audit: Plan vs Implementation

### Completed (matches plan)
- [x] Node 20 upgrade (went beyond plan: v20 instead of planned v20 via NodeSource)
- [x] Project structure (matches plan layout)
- [x] SQLite schema (all 3 tables + indexes)
- [x] OTP auth (request, verify, logout, /me endpoint)
- [x] Reminder CRUD (create, list, delete)
- [x] Auth middleware (Bearer token)
- [x] Resend email integration (OTP + reminder templates)
- [x] node-cron scheduler (1-min polling + hourly cleanup)
- [x] Rate limiting (IP-based general + auth-specific + per-email OTP limit)
- [x] Calendar grid (7-col month view, Hijri primary + Gregorian secondary)
- [x] Day cell with today highlight, Islamic date labels, reminder dots
- [x] Month navigation (prev/next arrows, month+year dropdowns)
- [x] Today button
- [x] Notable Islamic dates (14 dates across all 12 months)
- [x] Language toggle (EN/AR with localStorage persistence)
- [x] Dark mode toggle (with localStorage + system preference detection)
- [x] Auth modal (email step → OTP step)
- [x] Reminder creation modal
- [x] Reminder list with status indicators + delete
- [x] Tailwind styling (teal/amber/emerald palette, Inter + Noto Naskh Arabic)
- [x] Caddy config with API proxy + SPA fallback
- [x] pm2 process management
- [x] Git + GitHub
- [x] Recurring annual reminders (recurring_events table, scheduler, frontend toggle)
- [x] Comprehensive README.md

### Improvements over plan
- Used Hono instead of Express (faster, smaller, better for Node 20)
- Used Vite 7 + Tailwind v4 instead of Vite 4 + Tailwind 3 (newer, stable)
- Added /api/auth/me endpoint (not in plan but useful for session checking)

### Previously resolved
- ~~Resend domain verification~~, ~~Mobile header overflow~~, ~~Arabic numerals~~
- ~~Toast notifications~~, ~~Loading skeleton~~, ~~Keyboard navigation~~, ~~Empty month padding~~
- ~~Responsive cells~~, ~~Year range~~, ~~Month transitions~~, ~~PWA~~, ~~Timezone~~, ~~Reminder edit~~, ~~Delete confirmation~~
- ~~Mobile detail panel~~, ~~Tap icon hint~~, ~~Header button sizing~~, ~~Date/time formatting~~
- ~~Categorize reminders~~, ~~Gregorian-to-Hijri lookup~~, ~~Advance reminders~~, ~~Edit recurring~~
- ~~App info menu~~

---

## New TODO List

### P0 — UX polish (quick wins, high impact)

**1. Mobile selected-day detail panel**
Show events and reminders for the selected day below the calendar grid on mobile.
Currently on small screens, cells only show the Hijri number and reminder dots — no
event names or details are visible. When a day is selected, render a panel beneath the
grid listing: Islamic event label (if any), reminder titles, and recurring event matches.
This gives mobile users a way to see what's on a day without opening a modal.
- Files: `CalendarGrid.vue`, possibly a new `DayDetail.vue` component
- Depends on: selected day state already exists in `CalendarGrid.vue`

**2. "Tap to remind" icon hint + mobile visibility**
Replace the text-only "tap to set reminder" with a small tap/hand icon (inline SVG) +
short label. Currently hidden below 480px via `hidden xs:block`. Make it visible on all
screen sizes since mobile users need the hint most. Keep it compact — icon only on very
small screens, icon + text on larger.
- Files: `DayCell.vue`

**3. Consistent header button sizing on mobile**
The dark mode and language toggle buttons use `p-2` while the reminders button uses
`p-2 sm:px-3 sm:py-1.5`. Standardize all icon-only mobile buttons to the same
dimensions (e.g. `w-9 h-9 flex items-center justify-center`). Also change the Arabic→
English toggle label from "A" to "En" for clarity.
- Files: `App.vue`

**4. Date/time formatting in My Reminders modal**
Make formatting consistent across the reminder list:
- Dates: use full month name (e.g. "25 February 2026" not "Feb 25, 2026")
- Times: use 12-hour format everywhere (e.g. "9:00 AM" not "09:00")
- Apply to both one-time reminders and recurring events
- Files: `ReminderList.vue`

### P1 — Features (medium effort, meaningful value)

**5. Expand year range to 1350–1550 AH**
Covers ~100 years in each direction. Currently 1400–1500. Update the year dropdown in
`CalendarHeader.vue`. May need to verify `@umalqura/core` supports years this far out —
test edge cases at boundaries.
- Files: `CalendarHeader.vue`

**6. Categorize reminders: Recurring / Upcoming / Past**
Restructure the My Reminders modal into three collapsible sections:
- **Recurring Events** (existing section, keep as-is with amber styling)
- **Upcoming** — unsent reminders where `remind_at > now`
- **Past** — sent reminders, collapsed by default
Add a "Clear past" button that bulk-deletes sent reminders to reduce clutter.
Needs a new backend endpoint or batch-cancel approach.
- Files: `ReminderList.vue`, possibly `server/routes/reminders.js` for bulk clear

**7. Gregorian-to-Hijri date lookup**
Add a small input (in the header or as a popover) where the user types or picks a
Gregorian date and the calendar navigates to the corresponding Hijri month/day, with
that day selected. Useful for "what Hijri date is my birthday?" type lookups.
- Files: new `DateConverter.vue` component, `App.vue`, `useCalendar.js`
- Uses: `toHijri()` from `hijri.js` already exists

**8. Advance reminder for recurring events**
Allow recurring events to send a reminder N days before the actual date (e.g. 1, 3, 7,
or 10 days early). Add a `remind_days_before` column to `recurring_events`. The
scheduler generates the reminder instance with `remind_at` shifted back by that many
days. Frontend: add a dropdown in the recurring creation flow.
- Files: `server/db.js` (migration), `server/routes/recurring.js`,
  `server/services/scheduler.js`, `ReminderModal.vue`

**9. Edit recurring events**
Currently recurring events can only be created and deleted. Add a PUT endpoint and
inline edit UI (similar to one-time reminder editing) for title, description, remind
time, and remind-days-before. Changing the remind time should regenerate the next unsent
instance.
- Files: `server/routes/recurring.js`, `ReminderList.vue`,
  `src/composables/useReminders.js`, `src/utils/api.js`

### P2 — Nice to have (larger scope, lower urgency)

**10. App info/footer menu**
Add a small menu (footer link or "..." menu button in the header) with:
- **Contact / Suggestions** — mailto link or link to a feedback form
- **GitHub** — link to the repo (github.com/ohshaban/hijri-calendar)
- **Support / Donate** — needs research into options (Buy Me a Coffee, Ko-fi, GitHub
  Sponsors, Stripe link, etc.). Should be tasteful and non-intrusive. Consider what
  works best for the target audience. This is its own sub-task:
  - Research donation platforms (fees, payout, ease of setup)
  - Choose one and integrate a simple link/button
- Files: new `AppFooter.vue` or popover component, `App.vue`

**11. SPA client-side routing**
Currently no Vue Router. Direct URL access to paths other than `/` will 404 then
fallback via `try_files`. Not a problem now since it's a single-page app, but could
matter if we add features like `/convert` or deep-linking to a specific month.
