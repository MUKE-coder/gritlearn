# CLAUDE.md — JEditor (gritlearn)

> **Product**: JEditor (full name JBEditor) — an analogy-first IDE that
> teaches you to code while you build real projects. Native desktop editor
> (Wails + Monaco) with the curriculum bundled in the binary, fully offline
> after a one-time signup.
>
> **Repo / module / docker / DB**: still `gritlearn` for internal continuity.
> Nothing user-facing uses that name. The product brand is **JEditor**.

---

## Repo layout

Monorepo (pnpm workspaces + Turbo).

- `apps/api` — Go (Gin + GORM). REST + WebSocket realtime. Port `8080`.
- `apps/desktop` — Wails 2 desktop app (Go + React/Vite). Ships the
  curriculum embedded; works offline after signup. **Primary client.**
- `apps/web` — Next.js 14 marketing site (`/`, `/download`, `/login`,
  `/register`, blog, components gallery). App Router + standalone build.
- `apps/admin` — Next.js dashboard for the curriculum content team.
- `packages/shared` — TS types + zod schemas shared between API and web.
- `scripts/release-desktop.ps1` — PowerShell release pipeline for the
  Windows desktop build (see "Releasing" below).
- `e2e/` + `tests/` — Playwright + Go test suites.
- `docker-compose.yml` / `docker-compose.prod.yml` — local dev + prod
  stacks (postgres, redis, api, web, admin).

This file scopes work to **`apps/desktop`, `apps/web`, and `apps/api`**
unless told otherwise.

---

## Domain

The product is a Wails desktop binary that bundles Monaco editor + an
analogy-driven curriculum (lessons, exercises, code katas) and runs
fully offline after the first signup. The web side is marketing + auth
+ a small components gallery for the design system.

Curriculum content lives in the binary (Phase 1 today) so a student
in a low-bandwidth setting can complete an entire phase without ever
touching the network. The web app handles the once-off online steps:
signup, sign-in, and a per-user license file the desktop verifies on
launch.

---

## Tech stack

| Layer | Stack |
|---|---|
| Desktop | Wails 2.11 · React 19 · Vite · TanStack Router · Monaco editor |
| API | Go 1.24 · Gin · GORM · PostgreSQL · Redis · asynq (background jobs) |
| Web | Next.js 14 (App Router) · Tailwind · framer-motion · standalone build |
| Admin | Next.js 14 · the same UI kit as `web` |
| Auth | JWT (access + refresh) · cookie session for the web |
| Realtime | WebSocket from API for live curriculum events |

---

## Releasing the desktop

The desktop release pipeline is `scripts/release-desktop.ps1`. It's
**Windows-only** — macOS and Linux are built on those hosts and the
artefacts are attached to the same GitHub release manually.

```powershell
# normal release — bump version, build full + slim installers, tag, publish
.\scripts\release-desktop.ps1 -Version 0.4.0 -Notes "Phase 2 lessons added"

# dry-run (build + verify only, no tag / push / release)
.\scripts\release-desktop.ps1 -Version 0.4.0 -DryRun

# raw .exe only (emergency hot-fix)
.\scripts\release-desktop.ps1 -NoInstaller

# re-upload assets to an existing release (e.g. one of them failed to upload)
.\scripts\release-desktop.ps1 -Version 0.4.0 -Force
```

What it ships per release (Windows):

1. `JEditor-Setup-vX.Y.Z.exe` — full installer (~200 MB) with the
   WebView2 Evergreen Standalone Runtime bundled. Installs on machines
   with no internet.
2. `JEditor-Setup-Slim-vX.Y.Z.exe` — slim installer (~22 MB) that
   downloads WebView2 from Microsoft at install time. Smaller download,
   needs internet on the install machine.
3. `jeditor-windows-amd64.exe` — raw portable binary the auto-updater
   swaps in place. **Asset name matters** — the API's `pickAssetFor`
   matches on the substring `windows-amd64`.

The macOS / Linux team builds on their hosts and runs:

```bash
gh release upload vX.Y.Z build/bin/jeditor-darwin-arm64.dmg --clobber
gh release upload vX.Y.Z build/bin/jeditor-linux-amd64.AppImage --clobber
```

The web `/download` page picks them up automatically the moment the
API's 10-minute cache expires (or `gh api repos/.../releases/latest`
is hit to force).

### Asset naming — canonical

The web download page + the API matcher rely on these substrings:

| Platform | Asset name | Matcher (lowercase substring) |
|---|---|---|
| Windows | `jeditor-windows-amd64.exe` | `windows-amd64` |
| macOS (Apple Silicon) | `jeditor-darwin-arm64.dmg` | `darwin-arm64` |
| macOS (Intel) | `jeditor-darwin-amd64.dmg` | `darwin-amd64` |
| Linux | `jeditor-linux-amd64.AppImage` | `linux-amd64` or `appimage` |

NSIS installers carry `Setup` in their name and are picked up via
`pickInstallerAsset`, which prefers the non-slim flavour. The matcher
intentionally **skips** anything with `setup`/`installer` for the
per-OS download field — the auto-updater needs the raw portable .exe
for its binary-swap dance; an installer would relaunch the wizard
instead of the app.

---

## Web download page

`apps/web/app/download/page.tsx` is a **Server Component** that fetches
the API at request time:

```ts
const apiUrl =
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8080";

const release = await fetchRelease(apiUrl);
return <DownloadPageClient release={release} />;
```

Env-var hierarchy (first hit wins):

- `API_INTERNAL_URL` — Docker service name (e.g. `http://api:8080`).
  Preferred in prod. Container-to-container, no DNS, no hairpin NAT,
  no CORS. **Set this in `docker-compose.prod.yml`** under the `web`
  service.
- `NEXT_PUBLIC_API_URL` — public API URL (e.g. `https://api.jbeditor.com`).
  Baked into the client bundle at build time. Still works but exposes
  the URL to the client and requires CORS to be configured.
- `http://localhost:8080` — local dev default.

`DownloadPageClient` is now display-only (no `useEffect`, no fetch).
The page hydrates with real data on first paint.

ISR: `export const revalidate = 600` matches the API's 10-minute
in-process cache. To force a refresh sooner: redeploy, or hit
`https://api.jbeditor.com/api/desktop/latest?refresh=1` directly.

---

## API release handler

`apps/api/internal/handlers/desktop_release_handler.go` resolves the
latest release in three layers (first hit wins):

1. **Env override** (`DESKTOP_LATEST_VERSION`) — emergency manual
   control without redeploy.
2. **GitHub Releases API** — the normal path. Hits
   `https://api.github.com/repos/{owner}/{repo}/releases/latest`,
   filters drafts/prereleases, matches per-OS by substring. Response
   cached **10 minutes**.
3. **Hard-coded fallback** — last resort so the endpoint never 500s
   even with no internet from the API host.

Endpoints:

| Path | Purpose |
|---|---|
| `GET /api/desktop/latest` | Per-OS download metadata for the marketing page |
| `GET /api/desktop/latest?refresh=1` | Bust the in-process cache |
| `GET /api/desktop/download?os=windows&tag=v0.3.0` | 302 to a short-lived presigned GitHub CDN URL |
| `GET /api/desktop/diagnostics` | Env-var sanity check + live GitHub probe |

Env vars:

- `DESKTOP_GITHUB_OWNER` (default `MUKE-coder`)
- `DESKTOP_GITHUB_REPO` (default `gritlearn`)
- `GITHUB_TOKEN` — required if repo is private
- `DESKTOP_LATEST_*` — emergency overrides (version / url / released_at /
  release_notes)
- `DESKTOP_DOWNLOAD_BASE` — override the proxy URL base (CDN-fronted setups)

---

## Conventions in this repo

- **API URL on the web side** — server-side reads `API_INTERNAL_URL`
  first, then `NEXT_PUBLIC_API_URL`. Never hard-code.
- **Asset naming** — stick to the canonical substrings above. If you
  add a new OS, add a row to `osTargets` in `desktop_release_handler.go`
  AND a `STATIC_OPTIONS` entry in `apps/web/lib/platform.ts`.
- **Release script** — always use `-Force` for re-runs against an
  existing tag. Don't manually delete GitHub releases to re-upload.
- **NSIS template** — `apps/desktop/build/windows/installer/project.nsi`
  is the canonical NSIS template. Two flavours via `!ifdef SLIM_INSTALLER`.
  `OutFile` paths are versioned — don't rename without also updating
  the release script's expectations.

---

## Recent change log

| Version | Highlight |
|---------|-----------|
| pending | **Release script + download page sync fixes** (see [fix.md](fix.md)). (1) Release script: added `-Force` for re-uploading to an existing release via `gh release upload --clobber`; the previous `Out-Null` on the slim `makensis` pass swallowed every error including the brand-BMPs-missing / project.nsi-syntax-error paths — now surfaces the makensis log AND hard-fails if the slim artefact isn't on disk; macOS/Linux upload reminder moved to a loud post-success banner with copy-pasteable commands. (2) Download page sync: converted `/download` from a Client Component browser fetch (depended on `NEXT_PUBLIC_API_URL` being baked correctly at Docker build time + CORS being configured to allow the prod web origin — both common failure modes that silently flipped the page to the hard-coded fallback) to a Server Component that fetches once at request time via the new `API_INTERNAL_URL` env. Container-to-container in Docker — no DNS, no hairpin NAT, no CORS. Hydrates with real data on first paint, no loading skeleton, no `useEffect`. |
