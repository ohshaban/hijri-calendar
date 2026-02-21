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

### Improvements over plan
- Used Hono instead of Express (faster, smaller, better for Node 20)
- Used Vite 7 + Tailwind v4 instead of Vite 4 + Tailwind 3 (newer, stable)
- Added /api/auth/me endpoint (not in plan but useful for session checking)

### Gaps to address

#### P0 - Must fix
1. **Resend domain verification**: Emails currently only go to developer.ohs@gmail.com.
   The `from` address is set to `noreply@hilalshaban.com` but Resend needs the domain
   DNS records verified (DKIM, SPF, DMARC). Check Resend dashboard for verification status.

2. **Mobile header overflow**: The top bar has 5 buttons that will likely wrap badly on
   small screens (<375px). Need to collapse into a hamburger menu or use icon-only
   buttons on mobile.

3. **Arabic numerals in AR mode**: Plan specifies "Arabic numerals" (١٢٣) but currently
   showing Western numerals (123) even in Arabic mode. Need to use
   `toLocaleString('ar-EG')` for day numbers when lang=ar.

#### P1 - Should fix
4. **SPA client-side routing**: Currently no Vue Router. Direct URL access to paths
   other than / will 404 then fallback via try_files. Not a problem now since it's a
   single-page app, but could matter if we add routes.

5. **Error toast/notification system**: Errors currently show inline in modals. A
   global toast system would be better UX for transient messages like "Reminder created"
   or "Reminder cancelled".

6. **Loading skeleton**: Calendar grid shows nothing while composable initializes.
   Add a skeleton/shimmer state for better perceived performance.

7. **Keyboard navigation**: Calendar grid isn't keyboard-navigable. Arrow keys should
   move between days, Enter should open reminder modal.

8. **Empty month padding**: Calendar grid shows empty cells before month start but not
   after month end. Should fill remaining cells in the last row for visual consistency.

#### P2 - Nice to have
9. **Responsive calendar cells**: On very small screens, cells could show only the
   Hijri day number and hide the Gregorian date / Islamic event label.

10. **Year range validation**: Dropdowns go 1440-1460. `@umalqura/core` supports
    1356-1500 AH. Could expand range.

11. **Animated month transitions**: No animation when switching months. A slide
    transition would feel more polished.

12. **PWA support**: Add a manifest.json and service worker for installability and
    offline calendar viewing (without reminder features).

13. **Timezone handling**: Reminder `remind_at` timestamps use the browser's local
    time but the server compares against server time. If user and server are in
    different timezones, reminders fire at wrong time. Should store and compare in UTC.

14. **Reminder edit**: Can only create and delete, not edit existing reminders.

15. **Confirmation dialog for delete**: Currently deletes immediately on button click.
    Should confirm first.
