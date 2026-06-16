# release-desktop.ps1 — build, tag, and publish a new JEditor desktop
# release on Windows. Run from the repo root in PowerShell.
#
# Usage:
#   .\scripts\release-desktop.ps1                     # uses version from wails.json
#   .\scripts\release-desktop.ps1 -Version "0.3.0"    # bumps wails.json + commits
#   .\scripts\release-desktop.ps1 -Version "0.3.0" -Notes "Fix the thing"
#   .\scripts\release-desktop.ps1 -DryRun             # build only, no tag / push
#   .\scripts\release-desktop.ps1 -NoInstaller        # raw .exe only (hot-fix)
#   .\scripts\release-desktop.ps1 -SlimOnly           # only the small online installer
#
# What it does:
#   1. Bumps apps/desktop/wails.json (if -Version differs from current)
#   2. Generates branded BMPs (header.bmp + welcome.bmp) if missing,
#      using the mint accent + current icon.ico
#   3. Downloads the WebView2 Evergreen Standalone Installer (~190 MB)
#      into the installer/webview2/ folder if not already cached
#   4. Runs `wails build -nsis -platform windows/amd64`
#      → produces the raw jeditor.exe + JEditor-Setup-vX.Y.Z.exe (~200 MB)
#   5. Re-runs makensis with -DSLIM_INSTALLER to also produce
#      JEditor-Setup-Slim-vX.Y.Z.exe (~22 MB) using the online
#      WebView2 bootstrapper
#   6. Renames the raw binary to jeditor-windows-amd64.exe (the
#      canonical name the API's pickAsset rule looks for)
#   7. Commits the wails.json bump, tags vX.Y.Z, pushes, creates the
#      GitHub release with all three artifacts attached.
#
# Asset upload order matters — gh release create lists assets in upload
# order on the release page. Full installer first (most users want the
# offline wizard), slim installer second (smaller download for users
# with reliable internet on the install machine), raw .exe third
# (auto-updater fetches it programmatically via pickAsset's "no Setup
# keyword" rule).

[CmdletBinding()]
param(
  [string]$Version,
  [string]$Notes,
  [switch]$DryRun,
  [switch]$NoInstaller,
  [switch]$SlimOnly
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
Set-Location $repoRoot

$wailsJson      = "apps/desktop/wails.json"
$binDir         = "apps/desktop/build/bin"
$installerDir   = "apps/desktop/build/windows/installer"
$iconPath       = "apps/desktop/build/windows/icon.ico"
$wv2Dir         = "$installerDir/webview2"
$wv2Exe         = "$wv2Dir/MicrosoftEdgeWebView2RuntimeInstaller.exe"
$wv2Url         = "https://msedge.sf.dl.delivery.mp.microsoft.com/filestreamingservice/files/63158e01-aca3-44d4-8c09-0d338d23779d/MicrosoftEdgeWebView2RuntimeInstallerX64.exe"
$wv2MinBytes    = 100 * 1024 * 1024
$rawCanonical   = "jeditor-windows-amd64.exe"

# ─── read current version ────────────────────────────────────────────
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

$tag              = "v$Version"
$installerFull    = "JEditor-Setup-v$Version.exe"
$installerSlim    = "JEditor-Setup-Slim-v$Version.exe"

# ─── guard rails ─────────────────────────────────────────────────────
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

# ─── bump wails.json if needed ───────────────────────────────────────
if ($Version -ne $current) {
  Write-Host "==> Bumping wails.json: $current → $Version" -ForegroundColor Cyan
  $json.info.productVersion = $Version
  $json | ConvertTo-Json -Depth 10 | Set-Content $wailsJson -Encoding utf8
}

# ─── regenerate installer BMPs ───────────────────────────────────────
# Branded header (150×57) + welcome banner (164×314). Idempotent —
# only runs if either BMP is missing.
$headerBmp  = "$installerDir/header.bmp"
$welcomeBmp = "$installerDir/welcome.bmp"
if (-not (Test-Path $headerBmp) -or -not (Test-Path $welcomeBmp)) {
  Write-Host "==> Generating installer brand bitmaps (mint accent)" -ForegroundColor Cyan
  Add-Type -AssemblyName System.Drawing
  $ink   = [System.Drawing.Color]::FromArgb(10, 10, 13)
  $mint  = [System.Drawing.Color]::FromArgb(95, 227, 176)
  $cream = [System.Drawing.Color]::FromArgb(237, 237, 238)
  $muted = [System.Drawing.Color]::FromArgb(161, 161, 170)
  $mintBrush  = New-Object System.Drawing.SolidBrush($mint)
  $creamBrush = New-Object System.Drawing.SolidBrush($cream)
  $mutedBrush = New-Object System.Drawing.SolidBrush($muted)
  $iconLg = (New-Object System.Drawing.Icon($iconPath, 64, 64)).ToBitmap()
  $iconSm = (New-Object System.Drawing.Icon($iconPath, 32, 32)).ToBitmap()

  $header = New-Object System.Drawing.Bitmap(150, 57)
  $gh = [System.Drawing.Graphics]::FromImage($header)
  $gh.SmoothingMode    = 'AntiAlias'
  $gh.TextRenderingHint = 'ClearTypeGridFit'
  $gh.Clear($ink)
  $gh.FillRectangle($mintBrush, 0, 53, 150, 4)
  $gh.DrawImage($iconSm, 10, 12, 32, 32)
  $gh.DrawString('JEditor',           (New-Object System.Drawing.Font('Segoe UI', 11, [System.Drawing.FontStyle]::Bold)), $creamBrush, 50, 13)
  $gh.DrawString('analogy-first IDE', (New-Object System.Drawing.Font('Segoe UI', 7.5)),                                  $mutedBrush, 50, 32)
  $gh.Dispose()
  $header.Save($headerBmp, [System.Drawing.Imaging.ImageFormat]::Bmp)

  $welcome = New-Object System.Drawing.Bitmap(164, 314)
  $gw = [System.Drawing.Graphics]::FromImage($welcome)
  $gw.SmoothingMode    = 'AntiAlias'
  $gw.TextRenderingHint = 'ClearTypeGridFit'
  $gw.Clear($ink)
  $gw.FillRectangle($mintBrush, 0, 0, 164, 6)
  $gw.DrawImage($iconLg, 50, 84, 64, 64)
  $sf = New-Object System.Drawing.StringFormat
  $sf.Alignment = 'Center'
  $gw.DrawString('JEditor',           (New-Object System.Drawing.Font('Segoe UI', 19, [System.Drawing.FontStyle]::Bold)), $creamBrush, (New-Object System.Drawing.RectangleF(0, 162, 164, 30)), $sf)
  $gw.DrawString('analogy-first IDE', (New-Object System.Drawing.Font('Segoe UI', 8.5)),                                  $mutedBrush, (New-Object System.Drawing.RectangleF(0, 196, 164, 20)), $sf)
  $gw.DrawString('Setup Wizard',      (New-Object System.Drawing.Font('Segoe UI', 7)),                                    $mutedBrush, (New-Object System.Drawing.RectangleF(0, 290, 164, 16)), $sf)
  $gw.Dispose()
  $welcome.Save($welcomeBmp, [System.Drawing.Imaging.ImageFormat]::Bmp)
}

# ─── stage WebView2 offline runtime (for the FULL installer flavour) ─
# The full installer bundles the ~190 MB Edge Evergreen Standalone
# Installer. Cached in the build tree (gitignored — file pattern
# *.exe catches it) so the download happens once per dev machine.
if (-not $SlimOnly -and -not $NoInstaller) {
  New-Item -ItemType Directory -Path $wv2Dir -Force | Out-Null
  $wv2Size = if (Test-Path $wv2Exe) { (Get-Item $wv2Exe).Length } else { 0 }
  if ($wv2Size -lt $wv2MinBytes) {
    Write-Host "==> Downloading WebView2 Evergreen Standalone Installer (~190 MB, one-time)" -ForegroundColor Cyan
    if (Test-Path $wv2Exe) { Remove-Item $wv2Exe -Force }
    $ProgressPreference = "SilentlyContinue"
    Invoke-WebRequest -Uri $wv2Url -OutFile $wv2Exe -UseBasicParsing
    if (-not (Test-Path $wv2Exe)) {
      Write-Error "Failed to download WebView2 runtime to $wv2Exe"
      exit 1
    }
  }
}

# ─── build ───────────────────────────────────────────────────────────
Write-Host "==> Running wails build (this takes ~60-120s)" -ForegroundColor Cyan
Push-Location apps/desktop
try {
  if ($NoInstaller) {
    & wails build -platform windows/amd64 -clean
  } elseif ($SlimOnly) {
    # Skip the full default by overriding SLIM_INSTALLER at the makensis
    # level. wails build -nsis runs makensis on project.nsi without
    # SLIM_INSTALLER defined, so we have to skip wails -nsis here and
    # run makensis manually below.
    & wails build -platform windows/amd64 -clean
  } else {
    # Default — wails build -nsis runs makensis without SLIM_INSTALLER,
    # producing the full ~200 MB offline installer.
    & wails build -nsis -platform windows/amd64 -clean
  }
  if ($LASTEXITCODE -ne 0) {
    Write-Error "wails build failed"
    exit 1
  }

  # Slim installer flavour — a second makensis pass with -DSLIM_INSTALLER.
  if (-not $NoInstaller) {
    Write-Host "==> Building slim installer (online WebView2 bootstrapper)" -ForegroundColor Cyan
    Push-Location build/windows/installer
    try {
      $rawExeForNsis = "..\\..\\bin\\jeditor.exe"
      & makensis -DSLIM_INSTALLER "-DARG_WAILS_AMD64_BINARY=$rawExeForNsis" project.nsi | Out-Null
      if ($LASTEXITCODE -ne 0) {
        Write-Error "makensis (slim) failed"
        exit 1
      }
    } finally {
      Pop-Location
    }
  }
}
finally {
  Pop-Location
}

# ─── rename raw .exe to canonical filename ───────────────────────────
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
if (Test-Path $targetExe) { Remove-Item $targetExe -Force }
Copy-Item $sourceExe $targetExe
Write-Host "==> Raw binary:   $targetExe" -ForegroundColor Green

# ─── verify installer artifacts ──────────────────────────────────────
$installerFullPath = Join-Path $binDir $installerFull
$installerSlimPath = Join-Path $binDir $installerSlim
if (-not $NoInstaller -and -not $SlimOnly) {
  if (-not (Test-Path $installerFullPath)) {
    Write-Error "Expected $installerFullPath — NSIS build did not produce it."
    exit 1
  }
  $fullSizeMB = [Math]::Round((Get-Item $installerFullPath).Length / 1MB, 1)
  Write-Host "==> Full setup:   $installerFullPath ($($fullSizeMB) MB)" -ForegroundColor Green
}
if (-not $NoInstaller -and (Test-Path $installerSlimPath)) {
  $slimSizeMB = [Math]::Round((Get-Item $installerSlimPath).Length / 1MB, 1)
  Write-Host "==> Slim setup:   $installerSlimPath ($($slimSizeMB) MB)" -ForegroundColor Green
}

if ($DryRun) {
  Write-Host "==> -DryRun set — skipping commit / tag / release" -ForegroundColor Yellow
  exit 0
}

# ─── commit wails.json bump ──────────────────────────────────────────
$status = & git status --short $wailsJson
if ($status) {
  Write-Host "==> Committing wails.json bump" -ForegroundColor Cyan
  & git add $wailsJson
  & git commit -m "chore(release): bump desktop to $tag"
}

# ─── tag + push ──────────────────────────────────────────────────────
Write-Host "==> Tagging $tag" -ForegroundColor Cyan
& git tag $tag
& git push origin HEAD
& git push origin $tag

# ─── assemble release assets ─────────────────────────────────────────
$assets = @()
if (-not $NoInstaller -and (Test-Path $installerFullPath)) { $assets += $installerFullPath }
if (-not $NoInstaller -and (Test-Path $installerSlimPath)) { $assets += $installerSlimPath }
$assets += $targetExe

# ─── gh release create ───────────────────────────────────────────────
$notesArg = if ($Notes) { @("--notes", $Notes) } else { @("--generate-notes") }
Write-Host "==> Creating GitHub release $tag with $($assets.Count) asset(s)" -ForegroundColor Cyan
& gh release create $tag --title "JEditor $tag" @notesArg @assets

Write-Host ""
Write-Host "Released $tag" -ForegroundColor Green
Write-Host "  The API will pick it up within 10 minutes (or hit"
Write-Host "  https://api.jbeditor.com/api/desktop/latest?refresh=1 to bust the cache)."
Write-Host ""
Write-Host "Next: build for macOS / Linux on their host machines and run:"
Write-Host "  gh release upload $tag <file>"
