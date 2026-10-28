# Optional analytics

GA4 web stream `16218011299` / measurement ID `G-220Z1XVVXL`
was verified for `https://datalibertarian.in` on 2026-10-28.

The final `build:analytics` pass attaches `public/analytics.js` and its small
consent control stylesheet to **every final `dist/**/*.html`**, after the last
navigation pass. Do not move it to the Vite entry: the homepage and independent
sections are regenerated later. It is idempotent and does not modify page data.

Collection is disabled until the visitor chooses **Allow analytics**. **No
thanks** is equally available; **Analytics choices** allows withdrawal. The
choice is stored locally. If storage is unavailable, it applies only to that
document. Global Privacy Control and Do Not Track override a saved opt-in.

Only HTTPS `datalibertarian.in` and `www.datalibertarian.in` can load Google.
Preview URLs, localhost and unknown hosts do not initialize tracking. Events
contain a fixed section route and static section title, never raw path/title,
query, fragment, referrer, search text, case/person IDs or form fields. Private
routes and corrections are excluded. Referrer is deliberately blank, including
on Google script requests. SPA navigation is counted once per pathname; filter
or hash changes are not counted. No custom user IDs or user properties are set.
Google Analytics still uses its consented browser identifier and basic device
metadata; this is **not anonymous browsing**.

`send_page_view` is disabled and this loader explicitly queues the sanitized
pageviews. Advertising storage, ad user data, ad personalization and Google
signals are disabled in the tag. **Enhanced measurement must remain OFF in the
GA4 stream** (including history, search, outbound links, downloads and forms).
Optional advertising and granular device/location property settings must be
reviewed before publication; code configuration is not a substitute for that
admin review. No Measurement Protocol events or secrets are used.

## Verification

- `npm run test:analytics`: consent, revocation, blocked storage, GPC/DNT,
  production guards, duplicate initialization, grouped sensitive routes,
  query/fragment removal, SPA transitions and final-HTML injection.
- `npm test`, `npm run test:babuwatch`, `npm run test:registers`, `npm run build`.
- The cloud sandbox may reject the tsx CLI's IPC pipe. Equivalent TypeScript
  commands can run as `node --import tsx ...` without an IPC listener.
- Before publication, review the consent UI at mobile and desktop sizes. After
  approval and deployment, verify no Google request before consent, one clean
  pageview after opt-in, no traffic from previews, and receipt in GA realtime.
  Unit tests emulate the tag queue and do not prove Google ingestion.

Reference: https://developers.google.com/analytics/devguides/collection/ga4/reference/config
