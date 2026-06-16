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
  [switch]$SlimOnly,
  # -Force re-uploads assets to an existing release. Use when a prior
  # release succeeded at tag/push but failed mid-upload, or when you
  # need to swap in a corrected asset. Skips the "already exists"
  # guard rails AND uses `gh release upload --clobber` to overwrite.
  [switch]$Force
)

# Use Continue (the default), NOT Stop. With Stop, PowerShell promotes
# any native-exe stderr line into a terminating error — git push, gh,
# makensis, wails all routinely write progress to stderr on success.
# We check $LASTEXITCODE explicitly after each native call instead.
$ErrorActionPreference = "Continue"

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
# Native exes (gh, git) write to stderr on the "not found" path. With
# $ErrorActionPreference = "Stop" those get promoted to terminating
# errors even when the exit code is non-zero (= "good, doesn't exist
# yet"). Temporarily lift ErrorAction for the probes so we can read
# $LASTEXITCODE cleanly.
$releaseExists = $false
$tagExists = $false
if (-not $DryRun) {
  $prev = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  & gh release view $tag *> $null
  if ($LASTEXITCODE -eq 0) { $releaseExists = $true }
  & git rev-parse $tag *> $null
  if ($LASTEXITCODE -eq 0) { $tagExists = $true }
  $ErrorActionPreference = $prev

  if ($releaseExists -and -not $Force) {
    Write-Host "ERROR: GitHub release $tag already exists. Aborting." -ForegroundColor Red
    Write-Host "       Re-run with -Force to re-upload assets to the existing release." -ForegroundColor Yellow
    exit 1
  }
  if ($tagExists -and -not $Force -and -not $releaseExists) {
    Write-Host "ERROR: Git tag $tag already exists. Aborting." -ForegroundColor Red
    Write-Host "       Re-run with -Force to re-use the tag and create the release." -ForegroundColor Yellow
    exit 1
  }
  if ($Force) {
    Write-Host "==> -Force: will re-use tag $tag and clobber existing assets" -ForegroundColor Yellow
  }
}

# ─── bump wails.json if needed ───────────────────────────────────────
if ($Version -ne $current) {
  Write-Host "==> Bumping wails.json: $current → $Version" -ForegroundColor Cyan
  $json.info.productVersion = $Version
  # Write UTF-8 WITHOUT BOM. PowerShell 5.1's Set-Content -Encoding utf8
  # writes a BOM, which Wails' JSON parser rejects ("invalid character
  # 'ï' looking for beginning of value" — that's the EF BB BF BOM
  # decoded by the error reporter). WriteAllText + UTF8Encoding($false)
  # gives clean UTF-8 with no BOM.
  $bomless = New-Object System.Text.UTF8Encoding $false
  $jsonText = $json | ConvertTo-Json -Depth 10
  [System.IO.File]::WriteAllText((Resolve-Path $wailsJson).Path, $jsonText, $bomless)
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
  # Surface makensis output instead of piping through Out-Null — when
  # the slim build fails (e.g. missing brand BMPs, missing WebView2
  # cache, wrong path), the operator needs to SEE the makensis log to
  # diagnose. The previous Out-Null suppression hid the actual cause
  # of every silent slim-installer failure.
  if (-not $NoInstaller) {
    Write-Host "==> Building slim installer (online WebView2 bootstrapper)" -ForegroundColor Cyan
    Push-Location build/windows/installer
    try {
      $rawExeForNsis = "..\\..\\bin\\jeditor.exe"
      & makensis -DSLIM_INSTALLER "-DARG_WAILS_AMD64_BINARY=$rawExeForNsis" project.nsi
      if ($LASTEXITCODE -ne 0) {
        Write-Error "makensis (slim) failed — see output above"
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
  # Note: format-string style instead of inline interpolation —
  # PowerShell 5.1 treats "MB" as a numeric multiplier literal
  # (1MB = 1048576), so "$var MB" in a double-quoted string trips
  # the parser. {0} / -f bypasses it.
  Write-Host ("==> Full setup:   {0} ({1} MB)" -f $installerFullPath, $fullSizeMB) -ForegroundColor Green
}
if (-not $NoInstaller) {
  if (-not (Test-Path $installerSlimPath)) {
    Write-Error "Expected $installerSlimPath — slim makensis pass did not produce it."
    Write-Host "       Check the makensis log above. Common causes:" -ForegroundColor Yellow
    Write-Host "         * brand BMPs (header.bmp / welcome.bmp) missing — delete them and re-run" -ForegroundColor Yellow
    Write-Host "         * project.nsi has a syntax error or missing macro" -ForegroundColor Yellow
    exit 1
  }
  $slimSizeMB = [Math]::Round((Get-Item $installerSlimPath).Length / 1MB, 1)
  Write-Host ("==> Slim setup:   {0} ({1} MB)" -f $installerSlimPath, $slimSizeMB) -ForegroundColor Green
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
if (-not $tagExists) {
  Write-Host "==> Tagging $tag" -ForegroundColor Cyan
  & git tag $tag
  if ($LASTEXITCODE -ne 0) { Write-Error "git tag failed"; exit 1 }
} else {
  Write-Host "==> Tag $tag already present locally — skipping create" -ForegroundColor Yellow
}
& git push origin HEAD
& git push origin $tag *> $null  # silent re-push is fine when tag already on remote

# ─── assemble release assets ─────────────────────────────────────────
$assets = @()
if (-not $NoInstaller -and (Test-Path $installerFullPath)) { $assets += $installerFullPath }
if (-not $NoInstaller -and (Test-Path $installerSlimPath)) { $assets += $installerSlimPath }
$assets += $targetExe

# ─── gh release create / upload ──────────────────────────────────────
$notesArg = if ($Notes) { @("--notes", $Notes) } else { @("--generate-notes") }
if ($releaseExists) {
  # Release already on GitHub (came in via -Force) → upload assets
  # to it instead of trying to create a duplicate. --clobber replaces
  # any same-named asset that's already attached so re-runs are
  # idempotent.
  Write-Host "==> Re-uploading $($assets.Count) asset(s) to existing release $tag" -ForegroundColor Cyan
  & gh release upload $tag --clobber @assets
  if ($LASTEXITCODE -ne 0) { Write-Error "gh release upload failed"; exit 1 }
} else {
  Write-Host "==> Creating GitHub release $tag with $($assets.Count) asset(s)" -ForegroundColor Cyan
  & gh release create $tag --title "JEditor $tag" @notesArg @assets
  if ($LASTEXITCODE -ne 0) { Write-Error "gh release create failed"; exit 1 }
}

Write-Host ""
Write-Host "Released $tag" -ForegroundColor Green
Write-Host "  The API will pick it up within 10 minutes (or hit"
Write-Host "  https://api.jbeditor.com/api/desktop/latest?refresh=1 to bust the cache)."
Write-Host ""
Write-Host "================================================================" -ForegroundColor Yellow
Write-Host " IMPORTANT: This script only ships the Windows build." -ForegroundColor Yellow
Write-Host " macOS and Linux tiles on the download page will read 'Coming soon'" -ForegroundColor Yellow
Write-Host " until you build on those hosts and attach the artefacts:" -ForegroundColor Yellow
Write-Host "" -ForegroundColor Yellow
Write-Host "   # On a Mac (arm64):" -ForegroundColor Yellow
Write-Host "   wails build -platform darwin/arm64" -ForegroundColor Yellow
Write-Host "   gh release upload $tag build/bin/jeditor.app.zip --clobber" -ForegroundColor Yellow
Write-Host "" -ForegroundColor Yellow
Write-Host "   # On Linux:" -ForegroundColor Yellow
Write-Host "   wails build -platform linux/amd64" -ForegroundColor Yellow
Write-Host "   gh release upload $tag build/bin/jeditor-linux-amd64.AppImage --clobber" -ForegroundColor Yellow
Write-Host "" -ForegroundColor Yellow
Write-Host " Re-run this script with -Force if you also need to fix the Windows" -ForegroundColor Yellow
Write-Host " assets on an existing release." -ForegroundColor Yellow
Write-Host "================================================================" -ForegroundColor Yellow
