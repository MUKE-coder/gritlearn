# release-desktop.ps1 — build, tag, and publish a new JEditor desktop
# release on Windows. Run from the repo root in PowerShell.
#
# Usage:
#   .\scripts\release-desktop.ps1                       # uses version from wails.json
#   .\scripts\release-desktop.ps1 -Version "0.3.0"      # bumps wails.json + commits
#   .\scripts\release-desktop.ps1 -Version "0.3.0" -Notes "Fix the thing"
#   .\scripts\release-desktop.ps1 -DryRun               # build only, no tag / push
#   .\scripts\release-desktop.ps1 -NoInstaller          # raw .exe only (emergency hot-fix)
#
# What it does:
#   1. Bumps apps/desktop/wails.json (if -Version differs from current)
#   2. Runs `wails build -nsis -platform windows/amd64`
#      → produces both the raw jeditor.exe AND JEditor-Setup-vX.Y.Z.exe
#   3. Renames the raw binary to jeditor-windows-amd64.exe (canonical
#      name the API's pickAsset rule looks for in auto-updater payloads)
#   4. Stages + commits the wails.json bump
#   5. Tags vX.Y.Z and creates a GitHub release with both assets
#   6. Pushes the commit + tag
#
# The deployed API auto-discovers the new release on its next
# /api/desktop/latest call (10-min cache TTL). Installed clients with
# v0.3.0+ desktops see the update banner within ~6 hours on idle apps,
# or instantly via Settings > System > Check for updates.
#
# Asset upload order matters — gh release create lists assets in upload
# order on the release page. NSIS installer first (most users want the
# wizard), raw .exe second (auto-updater fetches it programmatically).

[CmdletBinding()]
param(
  [string]$Version,
  [string]$Notes,
  [switch]$DryRun,
  [switch]$NoInstaller
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$wailsJson = "apps/desktop/wails.json"
$binDir = "apps/desktop/build/bin"
$rawCanonical = "jeditor-windows-amd64.exe"

# ---- read current version ----
$json = Get-Content $wailsJson -Raw | ConvertFrom-Json
$current = $json.info.productVersion

if (-not $Version) {
  $Version = $current
  Write-Host "==> No -Version arg — releasing current wails.json version $Version" -ForegroundColor Cyan
}

if ($Version -notmatch '^[0-9]+\.[0-9]+\.[0-9]+(-[A-Za-z0-9.]+)?$') {
  Write-Error "Bad version '$Version' — expected X.Y.Z[-suffix]"
  exit 2
}

$tag = "v$Version"
$installerName = "JEditor-Setup-v$Version.exe"

# ---- guard rails ----
if (-not $DryRun) {
  $existing = & gh release view $tag 2>$null
  if ($LASTEXITCODE -eq 0) {
    Write-Error "GitHub release $tag already exists. Aborting."
    exit 1
  }
  $tagCheck = & git rev-parse $tag 2>$null
  if ($LASTEXITCODE -eq 0) {
    Write-Error "Git tag $tag already exists. Aborting."
    exit 1
  }
}

# ---- bump wails.json if needed ----
if ($Version -ne $current) {
  Write-Host "==> Bumping wails.json: $current → $Version" -ForegroundColor Cyan
  $json.info.productVersion = $Version
  $json | ConvertTo-Json -Depth 10 | Set-Content $wailsJson -Encoding utf8
}

# ---- build ----
Write-Host "==> Running wails build (this takes ~60-120s)" -ForegroundColor Cyan
Push-Location apps/desktop
try {
  if ($NoInstaller) {
    & wails build -platform windows/amd64 -clean
  } else {
    # -nsis produces both the raw .exe AND JEditor-Setup-vX.Y.Z.exe at
    # apps/desktop/build/bin/. The NSIS template
    # (build/windows/installer/project.nsi) declares the installer
    # filename via its OutFile directive.
    & wails build -nsis -platform windows/amd64 -clean
  }
  if ($LASTEXITCODE -ne 0) {
    Write-Error "wails build failed"
    exit 1
  }
}
finally {
  Pop-Location
}

# ---- rename raw .exe to canonical filename ----
$sourceExe = Join-Path $binDir "jeditor.exe"
$targetExe = Join-Path $binDir $rawCanonical
if (-not (Test-Path $sourceExe)) {
  $candidates = Get-ChildItem $binDir -Filter "*.exe" |
    Where-Object { $_.Name -notmatch "Setup" } |
    Sort-Object LastWriteTime -Descending
  if ($candidates.Count -eq 0) {
    Write-Error "No raw .exe produced in $binDir"
    exit 1
  }
  $sourceExe = $candidates[0].FullName
  Write-Host "==> Using produced raw binary: $sourceExe" -ForegroundColor Yellow
}
if (Test-Path $targetExe) {
  Remove-Item $targetExe -Force
}
Copy-Item $sourceExe $targetExe
Write-Host "==> Raw binary: $targetExe" -ForegroundColor Green

# ---- verify installer (when not -NoInstaller) ----
$installerPath = Join-Path $binDir $installerName
if (-not $NoInstaller) {
  if (-not (Test-Path $installerPath)) {
    Write-Error "Expected $installerPath — NSIS build did not produce it. Re-run with -NoInstaller for raw-only ship."
    exit 1
  }
  Write-Host "==> Installer:  $installerPath" -ForegroundColor Green
}

if ($DryRun) {
  Write-Host "==> -DryRun set — skipping commit / tag / release" -ForegroundColor Yellow
  exit 0
}

# ---- commit wails.json bump ----
$status = & git status --short $wailsJson
if ($status) {
  Write-Host "==> Committing wails.json bump" -ForegroundColor Cyan
  & git add $wailsJson
  & git commit -m "chore(release): bump desktop to $tag"
}

# ---- tag + push ----
Write-Host "==> Tagging $tag" -ForegroundColor Cyan
& git tag $tag
& git push origin HEAD
& git push origin $tag

# ---- assemble release assets ----
# Order matters — installer first (most users want the wizard /
# Start Menu / uninstaller path), raw .exe second (auto-updater
# fetches it via the API's pickAsset rule that prefers the
# "no Setup keyword" asset).
$assets = @()
if (-not $NoInstaller -and (Test-Path $installerPath)) {
  $assets += $installerPath
}
$assets += $targetExe

# ---- gh release create ----
$notesArg = if ($Notes) { @("--notes", $Notes) } else { @("--generate-notes") }
Write-Host "==> Creating GitHub release $tag with $($assets.Count) asset(s)" -ForegroundColor Cyan
& gh release create $tag --title "JEditor $tag" @notesArg @assets

Write-Host ""
Write-Host "✔ Released $tag" -ForegroundColor Green
Write-Host "  The API will pick it up within 10 minutes (or hit"
Write-Host "  https://api.jbeditor.com/api/desktop/latest?refresh=1 to bust the cache)."
Write-Host ""
Write-Host "Next: build for macOS / Linux on their host machines and run:"
Write-Host "  gh release upload $tag <file>"
