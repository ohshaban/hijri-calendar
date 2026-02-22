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

### Gaps to address

#### P0 - Must fix
1. **Resend domain verification**: Emails currently only go to developer.ohs@gmail.com.
   The `from` address is set to `noreply@hilalshaban.com` but Resend needs the domain
   DNS records verified (DKIM, SPF, DMARC). Check Resend dashboard for verification status.

2. ~~**Mobile header overflow**~~: Fixed - uses icon-only buttons on mobile, text on desktop.

3. ~~**Arabic numerals in AR mode**~~: Fixed - `toArabicNumerals()` used for day numbers.

#### P1 - Should fix
4. **SPA client-side routing**: Currently no Vue Router. Direct URL access to paths
   other than / will 404 then fallback via try_files. Not a problem now since it's a
   single-page app, but could matter if we add routes.

5. ~~**Error toast/notification system**~~: Fixed - global ToastContainer with useToast composable.

6. ~~**Loading skeleton**~~: Not needed - calendar data is computed synchronously, no loading state.

7. ~~**Keyboard navigation**~~: Fixed - arrow keys navigate days, Enter opens reminder modal, focus ring on selected day.

8. ~~**Empty month padding**~~: Fixed - trailing empty cells fill the last row.

#### P2 - Nice to have
9. ~~**Responsive calendar cells**~~: Fixed - hides Gregorian date and Islamic event labels below 480px (`xs` breakpoint), compact cell height on very small screens.

10. ~~**Year range validation**~~: Fixed - expanded from 1440-1460 to 1400-1500 AH.

11. ~~**Animated month transitions**~~: Fixed - slide transition when navigating months, with RTL support.

12. ~~**PWA support**~~: Fixed - web app manifest, service worker with network-first caching, Apple meta tags, installable on mobile.

13. ~~**Timezone handling**~~: Fixed - recurring events store the user's IANA timezone and use it to compute correct UTC timestamps for generated reminders.

14. ~~**Reminder edit**~~: Fixed - inline edit form in reminder list with PUT endpoint, can update title, description, and time.

15. ~~**Confirmation dialog for delete**~~: Fixed - confirm() prompt before deleting reminders and recurring events.
