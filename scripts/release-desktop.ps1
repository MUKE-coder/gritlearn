# release-desktop.ps1 — build, tag, and publish a new JEditor desktop
# release on Windows. Run from the repo root in PowerShell.
#
# Usage:
#   .\scripts\release-desktop.ps1                       # uses version from wails.json
#   .\scripts\release-desktop.ps1 -Version "0.2.0"      # bumps wails.json + commits
#   .\scripts\release-desktop.ps1 -Version "0.2.0" -Notes "Fix the thing"
#   .\scripts\release-desktop.ps1 -DryRun               # build only, no tag / push
#
# What it does:
#   1. Bumps apps/desktop/wails.json (if -Version is given and different)
#   2. Runs `wails build -platform windows/amd64`
#   3. Renames the artifact to the canonical jeditor-windows-amd64.exe
#   4. Stages + commits the wails.json bump
#   5. Tags vX.Y.Z and creates a GitHub release with the .exe attached
#   6. Pushes the commit + tag
#
# The deployed API auto-discovers the new release on its next
# /api/desktop/latest call (10-min cache). The marketing /download page
# revalidates within 10 min too. See RELEASING.md for the macOS / Linux
# builds — those need to be produced on their own host OS and uploaded
# to the same GitHub release with `gh release upload`.

[CmdletBinding()]
param(
  [string]$Version,
  [string]$Notes,
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$wailsJson = "apps/desktop/wails.json"
$binDir = "apps/desktop/build/bin"
$canonicalName = "jeditor-windows-amd64.exe"

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
Write-Host "==> Running wails build (this takes ~60s)" -ForegroundColor Cyan
Push-Location apps/desktop
try {
  & wails build -platform windows/amd64 -clean
  if ($LASTEXITCODE -ne 0) {
    Write-Error "wails build failed"
    exit 1
  }
}
finally {
  Pop-Location
}

# ---- rename to canonical filename ----
$sourceExe = Join-Path $binDir "jeditor.exe"
$targetExe = Join-Path $binDir $canonicalName
if (-not (Test-Path $sourceExe)) {
  # Fallback names wails sometimes uses
  $candidates = Get-ChildItem $binDir -Filter "*.exe" | Sort-Object LastWriteTime -Descending
  if ($candidates.Count -eq 0) {
    Write-Error "No .exe produced in $binDir"
    exit 1
  }
  $sourceExe = $candidates[0].FullName
  Write-Host "==> Using produced binary: $sourceExe" -ForegroundColor Yellow
}
if (Test-Path $targetExe) {
  Remove-Item $targetExe -Force
}
Copy-Item $sourceExe $targetExe
Write-Host "==> Built $targetExe" -ForegroundColor Green

if ($DryRun) {
  Write-Host "==> -DryRun set — skipping commit / tag / release" -ForegroundColor Yellow
  exit 0
}

# ---- commit wails.json bump ----
$status = & git status --short $wailsJson
if ($status) {
  Write-Host "==> Committing wails.json bump" -ForegroundColor Cyan
  & git add $wailsJson
  & git commit -m "Desktop release $tag"
}

# ---- tag + push ----
Write-Host "==> Tagging $tag" -ForegroundColor Cyan
& git tag $tag
& git push origin HEAD
& git push origin $tag

# ---- gh release create ----
$notesArg = if ($Notes) { @("--notes", $Notes) } else { @("--generate-notes") }
Write-Host "==> Creating GitHub release $tag" -ForegroundColor Cyan
& gh release create $tag --title "JEditor $tag" @notesArg $targetExe

Write-Host ""
Write-Host "✔ Released $tag" -ForegroundColor Green
Write-Host "  The API will pick it up within 10 minutes (or hit"
Write-Host "  https://api.jbeditor.com/api/desktop/latest?refresh=1 to bust the cache)."
Write-Host ""
Write-Host "Next: build for macOS / Linux on their host machines and run:"
Write-Host "  gh release upload $tag <file>"
