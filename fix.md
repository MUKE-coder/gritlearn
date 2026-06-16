# fix.md — Desktop release script + web download page sync

Two issues reported, two root causes found, two fixes applied. This
document is the post-mortem.

---

## Issue 1 — Desktop release script ships broken releases silently

### Reported

> "It has a desktop script that generates the setup that goes to
> github releases and this has a problem."

### Root causes

`scripts/release-desktop.ps1` had three swallow-the-error patterns
that turned real build failures into "the release looks fine but is
missing assets":

1. **`makensis | Out-Null` on the slim installer pass.** The script
   built the FULL installer via `wails build -nsis`, then re-ran
   `makensis` with `-DSLIM_INSTALLER` to produce the slim variant.
   That second pass piped through `Out-Null`. When `makensis` failed
   (missing brand BMPs, missing WebView2 cache, `project.nsi` syntax
   error, anything), the log was discarded. `$LASTEXITCODE` was
   checked but only AFTER the output was gone — so the operator saw
   the error code but had no diagnostic context.

2. **No hard-fail when the slim installer was expected but missing.**
   After the build, the script verified the FULL installer with
   `Test-Path` + `exit 1`. But the slim installer check was a soft
   `if (Test-Path $installerSlimPath) { Write-Host ... }` — if the
   file wasn't there, the script silently kept going and shipped a
   release with the slim asset missing.

3. **No `-Force` re-upload path.** When a release already existed
   (because a prior run got partway through), the script aborted on
   `gh release view $tag` returning success. Common case: GitHub
   upload failed mid-way for one of the three assets and the operator
   wanted to retry. With no `-Force`, the only way out was to manually
   `gh release delete` the half-built release first. Mistakes here are
   how you nuke a working release by accident.

A fourth, lower-impact issue: the macOS/Linux upload reminder was a
single `Write-Host` line at the end of the script. Operators routinely
missed it and shipped releases where 3 of 4 OS tiles on the marketing
page read "Coming soon" forever.

### Fixes applied

`scripts/release-desktop.ps1`:

1. **Surface the `makensis` slim-pass log.** Dropped the `| Out-Null`
   pipe. The makensis output now streams to the operator's terminal so
   failures are diagnosable in-place. `$LASTEXITCODE` check unchanged.

2. **Hard-fail when the slim installer is missing.** Added an explicit
   `Test-Path $installerSlimPath` check after the makensis pass with
   `exit 1` and a yellow hint listing the common failure modes (BMPs
   missing → delete the BMPs and re-run; project.nsi syntax → see the
   makensis log above).

3. **`-Force` switch.** When set, the existing-release / existing-tag
   guard rails are skipped. The `gh release create` call becomes
   `gh release upload --clobber` against the existing release. Idempotent
   re-runs: same script, same args, plus `-Force`. Two tagged states
   are tracked locally (`$releaseExists`, `$tagExists`) so the script
   knows whether to skip `git tag` (when the tag is already there)
   and whether to upload-to vs create-the release.

4. **Louder macOS/Linux reminder.** Post-success banner is now a
   yellow box with copy-pasteable `wails build` + `gh release upload`
   commands for both Mac and Linux. Hard to miss; nothing the operator
   has to assemble from memory.

### How to use it now

```powershell
# normal
.\scripts\release-desktop.ps1 -Version 0.4.0 -Notes "Phase 2 lessons"

# a re-upload run if the previous one fumbled mid-upload
.\scripts\release-desktop.ps1 -Version 0.4.0 -Force

# dry-run, build only
.\scripts\release-desktop.ps1 -Version 0.4.0 -DryRun

# hot-fix, raw .exe only
.\scripts\release-desktop.ps1 -NoInstaller
```

---

## Issue 2 — Web download page doesn't sync with GitHub releases

### Reported

> "in the web there is a download page similar to yours download page,
> But the download page doesn't sync well with github releases."

### Root cause

`apps/web/app/download/page.tsx` was a thin server wrapper that read
`process.env.NEXT_PUBLIC_API_URL` and passed it to a Client Component
(`DownloadPageClient`). The client then fetched
`${apiUrl}/api/desktop/latest` from the **browser**.

This setup had two ways to silently fail end-to-end, both of which
ended in the page sticking on `fallbackRelease` ("0.1.0", every OS
tile "Coming soon", no release notes):

1. **`NEXT_PUBLIC_API_URL` is baked into the client bundle at build
   time.** Next.js inlines every `NEXT_PUBLIC_*` reference into the
   compiled JS. The `Dockerfile` accepts `ARG NEXT_PUBLIC_API_URL` and
   sets it as `ENV` during `pnpm build`, but that ONLY works if the
   docker build was invoked with `--build-arg`. If the operator forgot
   to pass it (or set it on the runtime container instead of the build
   args), the inlined value stayed as the fallback default
   `"http://localhost:8080"`. The browser then tried
   `http://localhost:8080/api/desktop/latest` from the user's machine
   → connection refused → caught → `fallbackRelease`.

2. **CORS preflight blocked the cross-origin fetch.** Even when
   `NEXT_PUBLIC_API_URL` WAS set correctly to `https://api.jbeditor.com`,
   the API needed `CORS_ORIGINS` to include the prod web origin (e.g.
   `https://jbeditor.com`). The API's default `CORS_ORIGINS` is
   `http://localhost:3000,http://localhost:3001`. If the operator
   didn't extend it for prod, the browser's preflight got rejected →
   the fetch threw → caught → `fallbackRelease`.

The page would render with no visible error other than the small
"We couldn't reach the release server" sub-line. Plenty of users
wouldn't notice; they'd just see "v0.1.0" forever and click through
to the GitHub releases page.

The architectural problem: **the only thing that needed network
access was the server**, but we were making the **client** do it.
Both failure modes go away if the fetch happens server-side.

### Fix applied

Converted `/download` from a Client Component browser fetch to a
**Server Component** fetch at request time.

`apps/web/app/download/page.tsx`:

```ts
export const revalidate = 600;  // matches API cache

export default async function DownloadPage() {
  const apiUrl =
    process.env.API_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8080";

  let release = fallbackRelease;
  try {
    release = await fetchRelease(apiUrl);
  } catch {}

  return <DownloadPageClient release={release} />;
}
```

Key behaviour changes:

- **`API_INTERNAL_URL` env var** — read at REQUEST time (not build
  time) by the running container. Set to the Docker service name in
  `docker-compose.prod.yml` (e.g. `http://api:8080`). The container
  hits the API directly on the docker network — no DNS resolution
  through the public domain, no hairpin NAT, no CORS preflight.
- **`NEXT_PUBLIC_API_URL` retained as fallback** — anything that was
  working continues to work.
- **`localhost:8080` last resort** — local dev still just works.

`apps/web/components/download-page-client.tsx`:

- Dropped `useEffect`, `useState`, `Loader2`, `fetchRelease` imports.
- Component is now display-only: takes a `release: ReleaseInfo` prop,
  renders. No loading state, no skeleton, no client fetch. Page
  hydrates with real data on first paint.
- `"use client"` stays because the surface still uses hover animations,
  OS detection for the "Recommended" badge, and the release-notes
  rendering logic — none of which work in a pure server component.
- Removed the now-dead `DownloadGridSkeleton` helper.

`apps/web/Dockerfile`:

- Added a documented `ENV API_INTERNAL_URL=http://api:8080` comment
  (commented out — the real value goes in `docker-compose.prod.yml`).
- Kept the existing `ARG NEXT_PUBLIC_API_URL` path so legacy deploys
  that depended on it keep working.

### How to wire it in prod

**Already done in `docker-compose.prod.yml`** — the `web` service now
has `environment.API_INTERNAL_URL: http://api:8080` hard-coded.
`api` is the canonical Docker service name; it resolves on the
`gritlearn` network without any DNS lookup. Also added a `depends_on:
- api` so the web container doesn't start before the API.

If you split the API onto a different host in the future, override
`API_INTERNAL_URL` per-environment via your PaaS env panel — but for
a normal single-host Dokploy deployment, this just works out of the box
after a redeploy.

No `CORS_ORIGINS` change needed on the API for the download page (the
fetch is server-side, not browser-side). Other browser-side endpoints
(login, register) still need it.

### Dokploy env vars you should verify / add

For the download page to actually surface real GitHub releases (not
the hard-coded `0.1.0` fallback), the API needs to read your GitHub
release feed. Make sure these are set in Dokploy's Environment panel
for the `api` service:

| Env var | Required? | Why |
|---|---|---|
| `GITHUB_TOKEN` | **Yes** if the repo is private | Personal access token with `Contents: Read` on the `gritlearn` repo. Without it, the GitHub Releases API returns 404 for private repos and the page falls back to `0.1.0`. |
| `DESKTOP_GITHUB_OWNER` | Optional | Defaults to `MUKE-coder`. Override only if you fork. |
| `DESKTOP_GITHUB_REPO` | Optional | Defaults to `gritlearn`. Override only if you rename. |
| `API_URL` | Recommended | Public URL of the API (e.g. `https://api.jbeditor.com`). Used as a build arg → baked into `NEXT_PUBLIC_API_URL` for browser-side fetches (login, register). The `/download` page does NOT depend on this. |
| `CORS_ORIGINS` | **Yes** for browser-side fetches | Comma-separated list of allowed origins. Default `http://localhost:3000,http://localhost:3001` covers nothing in prod. Set to `https://jbeditor.com,https://app.jbeditor.com,https://admin.jbeditor.com` (your real domains). |

Nothing new for the **web** service in Dokploy — `API_INTERNAL_URL`
is set inside the compose itself, so the env panel doesn't need to
declare it. Just redeploy after `git pull` and the change lands.

---

## Verification

- `pnpm exec tsc --noEmit` on `apps/web` — clean.
- `go vet ./internal/handlers/` on `apps/api` — clean.
- `scripts/release-desktop.ps1 -Version 0.3.0 -DryRun` — runs through
  to "build verified" without trying to tag or upload (dry-run safety
  still works).

---

## What's left for follow-up

- **macOS / Linux build automation.** The release script still requires
  manual `gh release upload` for non-Windows artefacts. A small CI job
  on the Mac + Linux hosts that triggers off the GitHub tag would close
  this gap.
- **NEXT_PUBLIC_API_URL deprecation.** Once every prod deployment has
  moved to `API_INTERNAL_URL`, the legacy `NEXT_PUBLIC_API_URL`
  fallback path can come out of the server component. Same for the
  `Dockerfile`'s `ARG NEXT_PUBLIC_API_URL`. Defer until a prod redeploy
  is confirmed.
- **Asset checksum surfacing.** The marketing page promises
  "SHA-256 checksums + signed builds" but doesn't actually surface the
  checksums. Add `gh release create --notes-file` with the SHA-256 of
  each artefact appended, and link to that section from the page.
