# agri-admin

The Agrilogy **admin console** — a standalone Next.js app (extracted from
`agri-front`). Manages users, zones, per-zone graph toggles, alerts, the
device/router registry, and manager affirmations.

Self-contained: the shared code (API client, i18n, theme/UI) is vendored under
`src/app/lib`, `src/i18n` + `src/messages`, and `src/app/ui`. (Future: migrate to
published `@agri/*` packages shared with `agri-front`.)

Routes are served under `/admin/*`. The bare `/` redirects to `/admin`.

## Develop

```bash
npm install
npm run dev        # http://localhost:3001  (open /admin/login)
npm run build
npm run typecheck
```

Set `apps`-style env in `.env.local` (API base, e.g. `NEXT_PUBLIC_API_URL`).

## Deploy (Vercel)

New Vercel project on this repo → framework Next.js → add the admin domain
(e.g. `back.agrogo…`). Set `NEXT_PUBLIC_API_URL` (+ any proxy env) in the project.
