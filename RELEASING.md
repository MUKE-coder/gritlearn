# Releasing JEditor desktop builds

How a new desktop release reaches users. The API does **not** need to
be redeployed — it discovers new releases by polling GitHub every 10
minutes.

---

## Cycle

1. **Build the binaries** locally per OS (Wails cross-compilation is
   limited, so each OS typically builds on its own machine):

   ```bash
   # Windows
   cd apps/desktop
   wails build -platform windows/amd64 -o jeditor-windows-amd64.exe

   # macOS Apple Silicon
   wails build -platform darwin/arm64 -clean
   # produces build/bin/JEditor.app — package as DMG separately

   # macOS Intel
   wails build -platform darwin/amd64 -clean

   # Linux
   wails build -platform linux/amd64 -o jeditor-linux-amd64.AppImage
   ```

2. **Tag + create a GitHub release** with the canonical asset names:

   ```bash
   git tag v0.2.0
   git push origin v0.2.0

   gh release create v0.2.0 \
     --title "JEditor v0.2.0" \
     --notes "## New\n- TypeScript curriculum\n- Phase 1 milestone\n\n## Fixes\n- ..." \
     jeditor-windows-amd64.exe \
     jeditor-darwin-arm64.dmg \
     jeditor-darwin-amd64.dmg \
     jeditor-linux-amd64.AppImage
   ```

3. **That's it.** Within 10 minutes (or instantly with
   `GET /api/desktop/latest?refresh=1`) the API picks up the new
   release and the marketing site's `/download` page shows it.

---

## Canonical asset naming

The handler's per-OS matcher is **substring**, case-insensitive — so
small variations are forgiven. But sticking to these names keeps logs
clean and the `/api/desktop/diagnostics` output trivial to read.

| OS                    | Asset name                              |
| --------------------- | --------------------------------------- |
| Windows               | `jeditor-windows-amd64.exe`             |
| macOS (Apple Silicon) | `jeditor-darwin-arm64.dmg`              |
| macOS (Intel)         | `jeditor-darwin-amd64.dmg`              |
| Linux                 | `jeditor-linux-amd64.AppImage`          |

OSes without a matching asset render as **"Coming soon"** on
`/download` instead of broken links — fine for staging a partial release
(e.g. shipping Windows first, macOS later in the same tag).

---

## How the API resolves the release

`apps/api/internal/handlers/desktop_release_handler.go` — three-layer
resolver in priority order:

1. **`DESKTOP_LATEST_VERSION` env var** — manual override for emergency
   hotfixes. If set, the API trusts it absolutely and skips GitHub.
2. **GitHub Releases API** — `GET /repos/{owner}/{repo}/releases/latest`,
   filters out drafts + prereleases, matches per-OS assets by substring.
   Response cached in-process for 10 minutes.
3. **Hard-coded fallback** — last-resort defaults so the endpoint never
   returns 500. All four tiles render as "Coming soon".

Owner + repo come from `DESKTOP_GITHUB_OWNER` + `DESKTOP_GITHUB_REPO`
in `.env.production` (default `MUKE-coder` / `gritlearn`).

---

## GITHUB_TOKEN

Required when the repo is **private**. The desktop client never sees
the token — the API proxies the asset download via
`/api/desktop/download?os=windows&tag=v0.2.0`, GitHub returns a 302
to a short-lived presigned S3 URL, and the API re-emits the redirect.

Create a fine-grained PAT at
[github.com/settings/personal-access-tokens](https://github.com/settings/personal-access-tokens):

- **Repository access:** Only select repositories → `gritlearn`.
- **Permissions → Contents:** Read-only.
- No other scopes needed.

Paste the token into Dokploy's compose Environment as `GITHUB_TOKEN=...`.
Verify with `GET https://api.jbeditor.com/api/desktop/diagnostics` —
returns the token's first 4 chars + length but never the full value.

---

## Verifying a release went out

```bash
# What did the API resolve to?
curl https://api.jbeditor.com/api/desktop/latest | jq .

# Force a cache bust (skip the 10-min in-process cache):
curl https://api.jbeditor.com/api/desktop/latest?refresh=1 | jq .

# Health-check the GitHub side and see which assets matched per OS:
curl https://api.jbeditor.com/api/desktop/diagnostics | jq .

# Trigger an actual download (302 → presigned GitHub CDN URL):
curl -IL https://api.jbeditor.com/api/desktop/download?os=windows
```

The marketing site's `/download` page also reflects the new release on
the next 10-minute revalidate window (Next.js ISR matches the API's
cache TTL).

---

## Rolling back

If a release breaks for everyone:

1. **Delete the GitHub release** (don't delete the tag — gh refuses to
   re-publish a deleted tag):
   ```bash
   gh release delete v0.2.0 --yes --cleanup-tag=false
   ```
2. The API picks up the previous release within 10 minutes (or
   instantly via `?refresh=1`). The desktop's "Update available" banner
   will revert to the older version on next poll.
3. If you need a faster cutover for in-flight users, set
   `DESKTOP_LATEST_VERSION` + `DESKTOP_LATEST_URL` in Dokploy's
   Environment and redeploy. The override wins over GitHub for as long
   as it's set.
