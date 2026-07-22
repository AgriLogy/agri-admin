# Contributing to agri-admin

## What this repo is

`AgriLogy/agri-admin` is the **staff operations back-office** — a standalone
Next.js 16 app (App Router, React 18) that sits on top of the `agri-api`
backend. It is **not** the farmer-facing app (that is `agri-web`); the two are
separate deployments that talk to the same API.

Everything it does is an authenticated call to `agri-api` with a staff Bearer
token. Feature areas that exist today (`src/app/admin/*`):

| Area                                           | Route                                               | Backend endpoints (see `src/app/lib/*Api.ts`)                                                            |
| ---------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Dashboard, audit                               | `/admin`, `/admin/audit`                            | `/admin/overview`, `/admin/analytics`                                                                    |
| Users (list, detail, create, modify)           | `/admin/users*`                                     | `/users`, `/users/me`                                                                                    |
| Technicians & scopes                           | `/admin/technicians`                                | `/technicians`, `/admin/technician-grants/{id}`                                                          |
| Alerts console                                 | `/admin/alerts`                                     | `/alerts`, `/alerts/suggest`, `/admin/alerts`, `/admin/alert-analytics`                                  |
| Devices / routers + fleet health               | `/admin/devices*`                                   | `/devices`, `/devices/{id}`, `/admin/devices/health`                                                     |
| Sensor data explorer                           | `/admin/sensor-data`                                | `/admin/sensor-data/{user}/{key}`                                                                        |
| Monitoring (activity, automations, deliveries) | `/admin/monitoring*`                                | `/admin/notifications/*`, `/admin/proactive-notices`                                                     |
| Affirmations, Kc, billing, records, settings   | `/admin/{affirmations,kc,billing,records,settings}` | `/manager-affirmations`, `/admin/kc`, `/admin/billing/*`, `/admin/conversations/{id}`, `/admin/settings` |
| **Database (schema-driven generic CRUD)**      | `/admin/database`                                   | `/admin/db/tables`, `/admin/db/backup`, per-model schema + rows                                          |
| Session / token management                     | header + user detail                                | `DELETE /auth/sessions` (global revoke)                                                                  |
| Read-only "view as"                            | user list/detail                                    | `POST /admin/impersonate/{username}`                                                                     |

Routes are served under `/admin/*`; the bare `/` redirects to `/admin`
(`src/app/page.tsx`).

## Prerequisites

- Node.js **20** (what CI uses), npm
- A reachable `agri-api` instance and a **staff** account on it

## First-time setup

```bash
git clone https://github.com/AgriLogy/agri-admin.git && cd agri-admin
npm install
cp .env.example .env.local     # then fill in the values below
npm run dev                    # http://localhost:3001/admin/login
```

### Environment variables

Only these are actually read by the code (`grep process.env src/ next.config.mjs`):

| Var                             | Read in                                      | Default when unset                                   | Notes                                                                            |
| ------------------------------- | -------------------------------------------- | ---------------------------------------------------- | -------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL`           | `src/app/lib/api.ts`                         | `https://back.agrogo-datafarm.com`                   | axios `baseURL` for every call                                                   |
| `NEXT_PUBLIC_LOGIN_PATH`        | `src/app/lib/api.ts`, `logoutEverywhere.ts`  | `/admin/login` (hard-set in `next.config.mjs` `env`) | where a 401 / logout redirects; prod points at the identity gateway login        |
| `NEXT_PUBLIC_SSO_COOKIE_NAME`   | `hydrateSsoSession.ts`, `clearSsoSession.ts` | `agrogo_sso`                                         | must match the identity gateway                                                  |
| `NEXT_PUBLIC_SSO_COOKIE_DOMAIN` | `clearSsoSession.ts`                         | `''` (host-only cookie)                              | prod: `.agrogo-datafarm.com`                                                     |
| `NEXT_PUBLIC_WEB_APP_URL`       | `adminImpersonationApi.ts`                   | `http://localhost:3000`                              | farmer app the read-only view-as tab opens                                       |
| `PROXY_API_TARGET`              | `next.config.mjs`                            | unset → no rewrite                                   | local-dev only; enables `/api-proxy/*` → target so the browser stays same-origin |

`.env.example` also lists `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`, but no source file
reads it today — treat it as vestigial until a map view wires it up.

**CORS:** the browser calls `agri-api` cross-origin with a Bearer header
(`withCredentials: false`). The backend must have this app's origin
(`http://localhost:3001` in dev, the Vercel domain in prod) in its allowed
origins, or every request fails at the preflight. If you cannot change the
backend, set `PROXY_API_TARGET` and point `NEXT_PUBLIC_API_URL` at `/api-proxy`
for local work.

## Dev loop

```bash
npm run dev            # next dev on :3001
npm run build          # next build (output: standalone)
npm run lint           # eslint . (flat config)
npm run lint:fix
npm run format:check   # prettier --check .   (CI runs this)
npm run format         # prettier --write .
npm run typecheck      # tsc --noEmit  — must pass on every change
npm run test           # jest
npm run test:ci        # jest --ci   (CI runs this)
npm run start          # serve a production build on :3001
```

`npm run typecheck` is **mandatory before every push**. `next.config.mjs` sets
`typescript.ignoreBuildErrors: true`, so a broken build will still _build_ —
`tsc --noEmit` is the only thing that catches type regressions. Run `build`
before `typecheck` on a clean checkout (that is CI's order) so Next generates
`next-env.d.ts` first.

No husky hooks are installed in-repo (`husky`/`lint-staged` are in
`devDependencies` but there is no `.husky/` or lint-staged config) — run the
scripts yourself.

## `src/` layout

| Path                                         | What belongs there                                                                                                                                                                                                                                                |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/admin/<area>/page.tsx`              | Route entry only: `'use client'`, wrap the area's `*Main` component in `<AdminPageShell>`. Keep logic out.                                                                                                                                                        |
| `src/app/components/admin/`                  | Feature components, one `<Area>Main.tsx` per route + drawers/panels. Sub-folders: `database/`, `monitoring/`, `records/`, `userDetail/`.                                                                                                                          |
| `src/app/components/admin/_shared/`          | Cross-area primitives: `AdminCrudTable`, `AdminEntityDrawer`, `AdminConfirmDelete`, `ExportCsvButton`, `useAdminEntity`.                                                                                                                                          |
| `src/app/components/layout/`                 | `AdminPageShell` (header + sidebar + scroll container), `PageInfoBar`.                                                                                                                                                                                            |
| `src/app/components/main/`                   | Chrome: `AdminHeader`, `AdminSidebar`, `AdminMobileMenu`, `AdminBigMenu`.                                                                                                                                                                                         |
| `src/app/components/auth/`                   | `LoginCard` shell used by `/admin/login`.                                                                                                                                                                                                                         |
| `src/app/lib/`                               | The whole API layer + pure helpers. `api.ts` = the single axios instance; `admin*Api.ts` = one typed wrapper per domain; SSO helpers (`hydrateSsoSession`, `clearSsoSession`, `checkAuthTokens`, `logoutEverywhere`); pure modules with `*.test.ts` next to them. |
| `src/app/ui/` + `src/app/ui/tokens/`         | Design tokens (colors/spacing/typography/radii/shadows), Chakra `theme.ts`, `antdTheme.ts`, emotion cache. Tailwind reads these tokens.                                                                                                                           |
| `src/app/utils/`                             | Small React utilities (`useColorModeStyles`).                                                                                                                                                                                                                     |
| `src/i18n/` + `src/messages/{fr,en,ar}.json` | next-intl cookie-based locale (FR default, AR is RTL). No locale in the URL.                                                                                                                                                                                      |

UI stack is **antd 6 + Chakra 2 + Tailwind** side by side; dark mode is
`data-theme="dark"` on `<html>`, bridged in `providers.tsx`.

## Worked example — adding `/admin/pumps`

**1. API wrapper** — `src/app/lib/adminPumpApi.ts`:

```ts
import api from './api';

export type AdminPump = { id: number; name: string; is_active: boolean };

export const adminPumpApi = {
  list: (): Promise<AdminPump[]> =>
    api.get<AdminPump[]>('/admin/pumps').then((r) => r.data),
  update: (id: number, body: Partial<AdminPump>): Promise<AdminPump> =>
    api.patch<AdminPump>(`/admin/pumps/${id}`, body).then((r) => r.data),
};
```

Always go through the shared `api` instance — it attaches the Bearer token,
hydrates the SSO session, and handles 401. Never build a bare `axios` call or
hardcode a host. Re-export from `src/app/lib/index.ts` if other modules need it.

**2. Feature component** — `src/app/components/admin/PumpsMain.tsx`:

```tsx
'use client';
import { useAdminEntity } from './_shared/useAdminEntity';
import { AdminCrudTable } from './_shared/AdminCrudTable';
import { adminPumpApi, type AdminPump } from '@/app/lib/adminPumpApi';

export default function PumpsMain() {
  const { list, loading } = useAdminEntity<AdminPump>(adminPumpApi.list);
  const cols = [{ title: 'Nom', dataIndex: 'name' }];
  return (
    <AdminCrudTable<AdminPump>
      rowKey="id"
      loading={loading}
      data={list}
      columns={cols}
      searchable
      searchKeys={['name']}
    />
  );
}
```

`useAdminEntity` handles loading/error/refetch and funnels failures into antd
`message.error`. Use `AdminEntityDrawer` for create/edit forms and
`AdminConfirmDelete` for destructive actions rather than rolling new ones.

**3. Route** — `src/app/admin/pumps/page.tsx` is a thin `'use client'` file that
renders `<AdminPageShell><PumpsMain /></AdminPageShell>` and nothing else (copy
`src/app/admin/database/page.tsx`).

**4. Navigation** — register the entry in `src/app/components/main/AdminSidebar.tsx`
(both the `pathname.startsWith('/admin/pumps')` selected-key branch and the
`router.push('/admin/pumps')` menu item) and in `AdminMobileMenu.tsx`.

**5. i18n** — add every user-visible string to all three of
`src/messages/fr.json`, `en.json`, `ar.json` under the `admin.*` namespace, and
read them with `useTranslations()`. No hardcoded copy.

**6. Test** — the jest suite targets **pure modules with relative imports** (no
path-alias mapping is configured). Extract the logic worth testing into a plain
module and test it next to the source, e.g. `src/app/lib/pumpStatus.test.ts`.
Component tests are possible (`@testing-library/react` + jsdom are set up) but
must not rely on `@/…` aliases.

**7. Verify:** `npm run lint && npm run format:check && npm run test && npm run build && npm run typecheck`.

## Branches, commits, PRs

- Branch off **`main`**. `main` is the release branch: `.releaserc.json` has
  `"branches": ["main"]`, CI runs on push/PR to `main`, and `release.yml` runs
  semantic-release on push to `main`. `vercel.json` only sets
  `{"framework": "nextjs"}` — the Vercel production-branch mapping lives in the
  Vercel project settings, not in-repo (not documented in-repo).
- Branch names follow the existing convention: `feat/<slug>`, `fix/<slug>`,
  `test/<slug>`.
- **Conventional Commits are enforced on the PR title** by
  `.github/workflows/lint-pr-title.yml` (squash merge uses the PR title as the
  commit message, and semantic-release classifies from it). Allowed types:
  `feat fix perf refactor docs style test build ci chore revert`. Scope
  optional; subject must start with a letter. `commitlint.config.cjs`
  (`@commitlint/config-conventional`) applies the same rules to commits.
- Version impact (`.releaserc.json`): `feat` → minor, `fix`/`perf` → patch, and
  `chore`/`refactor`/`docs`/`style`/`test`/`build`/`ci` → patch. Use scope
  `no-release`, or `chore(release):`, to skip a release.
- **One PR ↔ one dedicated, scope-matched issue.** Open the issue first, then
  put `Closes #N` in the PR body. Don't stack unrelated changes onto one issue.
- Issue **and** PR are assigned to the author (`mks-zakaria`) —
  `.github/workflows/auto-assign.yml` does this automatically on open.
- **Zero AI/assistant attribution** anywhere: no `Co-Authored-By` bot lines, no
  "generated with", no assistant mentions in commit messages, PR titles/bodies,
  issues, or branch names.

## CI and deploy

On every PR to `main` and every push to `main`, `.github/workflows/ci.yml` runs
on Node 20: `npm ci` → `lint` → `format:check` → `test:ci` → `build` →
`typecheck`. All six must be green.

On push to `main`, `.github/workflows/release.yml` re-runs lint/build/typecheck
then `npx semantic-release`: it bumps `package.json`, writes `CHANGELOG.md`,
tags, and pushes a `chore(release): x.y.z [skip ci]` commit (that `[skip ci]`
guard is why the release job doesn't loop).

Deploy is Vercel's Git integration on this repo (`.vercel/project.json` →
project `agri-admin`). PRs get preview deployments; a merge to the configured
production branch promotes to the admin domain. Environment variables are set
in the Vercel project, not in the repo — a new `NEXT_PUBLIC_*` var must be added
there for every environment or it will be `undefined` in the built bundle.

## Gotchas

- **Tokens live in `localStorage`** (`accessToken` / `refreshToken`), not
  httpOnly cookies. `api.ts` calls `hydrateSsoSession()` on every request, which
  copies the shared `agrogo_sso` cookie into localStorage — but **only when
  `is_staff` is true**, so a farmer's SSO session is deliberately ignored here.
- **401 handling is global**: any non-auth request returning 401 clears the SSO
  session and hard-navigates to `NEXT_PUBLIC_LOGIN_PATH`. Requests to
  `/auth/sessions` and `/auth/token` are exempt so the login form can show its
  own error. Don't add ad-hoc 401 redirects in components.
- **Login is `POST /auth/sessions`** (returns `{access, refresh}`), and **logout
  is `DELETE /auth/sessions`** — a _server-side_ revoke that bumps
  `sessions_revoked_at`, invalidating the token in every sibling app. Clearing
  the cookie alone is not logout.
- **Impersonation is read-only by design.** `POST /admin/impersonate/{username}`
  mints a token with a `readonly` claim; mutations with it are rejected 403
  server-side. The token is handed to the farmer app via the URL _hash_
  (`{WEB_APP_URL}/view-as#token=…`) to keep it out of logs. Never widen this to
  a writable session client-side.
- **`ignoreBuildErrors: true`** (`typecheck` is your only type gate) and
  **`reactStrictMode: false`** (effects don't double-invoke, so double-fetch /
  missing-cleanup bugs won't surface in dev).
- **Jest has no `@/` alias mapping** and ignores `.next/` (a stale
  `.next/standalone/package.json` otherwise causes a haste-map collision). Keep
  tested logic in pure, relatively-imported modules.
- **`/admin/db/*` is staff-guarded in `agri-api`** (`router_db.py`) and is raw
  table access — schema changes on the backend surface immediately in the
  Database page's generic CRUD. Treat it as a power tool.
- The shared code under `src/app/lib`, `src/i18n`, `src/messages` and
  `src/app/ui` is **vendored** from `agri-front`, not a package. Fixes here do
  not propagate to the other apps; port them deliberately.
