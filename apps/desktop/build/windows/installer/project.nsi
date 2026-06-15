####
## JEditor NSIS installer template — full setup with bundled WebView2.
##
## Wizard flow (the conventional Windows installer look):
##   1. Welcome page — banner image + version + "Next"
##   2. License page — Apache-style EULA, must accept
##   3. Directory page — student sees + can change install location
##   4. Install page — WebView2 + file extraction progress
##   5. Finish page — "Launch JEditor" checkbox + "Finish"
##
## Defaults to C:\Program Files\JEditor (the classic Windows install
## location for desktop apps). Requires admin → UAC prompts on launch.
## The student can pick %LOCALAPPDATA%\Programs\JEditor on the Directory
## page if they want a no-admin install — both paths are supported.
##
## Bundles the Microsoft Edge WebView2 Evergreen Standalone Installer
## (~190 MB) so the install works on machines with no internet. The
## offline payload lives at:
##   build/windows/installer/webview2/MicrosoftEdgeWebView2RuntimeInstaller.exe
## The release script downloads it once and caches it across releases.
## If the payload is missing, the build falls back to the small
## online bootstrapper (~1.8 MB total installer).
##
## Single-instance: a named mutex blocks a second copy of the
## installer from running in parallel.
##
## Installed binary is named jeditor.exe (no version suffix) so the
## in-app updater always resolves to the same canonical path.
####
Unicode true

# Overrides applied BEFORE wails_tools.nsh so it doesn't re-set them
# from the wails.json defaults.
!define PRODUCT_EXECUTABLE "jeditor.exe"
!define UNINST_KEY_NAME    "JEditor"
!define REQUEST_EXECUTION_LEVEL "admin"

!include "wails_tools.nsh"

VIProductVersion "${INFO_PRODUCTVERSION}.0"
VIFileVersion    "${INFO_PRODUCTVERSION}.0"

VIAddVersionKey "CompanyName"     "${INFO_COMPANYNAME}"
VIAddVersionKey "FileDescription" "${INFO_PRODUCTNAME} Installer"
VIAddVersionKey "ProductVersion"  "${INFO_PRODUCTVERSION}"
VIAddVersionKey "FileVersion"     "${INFO_PRODUCTVERSION}"
VIAddVersionKey "LegalCopyright"  "${INFO_COPYRIGHT}"
VIAddVersionKey "ProductName"     "${INFO_PRODUCTNAME}"

ManifestDPIAware true
BrandingText " "    ; hide the default "Nullsoft Install System" footer

!include "MUI.nsh"

!define MUI_ICON   "..\icon.ico"
!define MUI_UNICON "..\icon.ico"
!define MUI_FINISHPAGE_NOAUTOCLOSE
!define MUI_ABORTWARNING

# Branded MUI bitmaps — the release script generates these from
# build/windows/icon.ico the first time it runs so they always match
# the current logomark. Sizes are NSIS-MUI standards:
#   header.bmp   — 150x57   sits top-right of every page
#   welcome.bmp  — 164x314  the left-side banner on Welcome + Finish
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP            "header.bmp"
!define MUI_HEADERIMAGE_UNBITMAP          "header.bmp"
!define MUI_HEADERIMAGE_RIGHT
!define MUI_WELCOMEFINISHPAGE_BITMAP      "welcome.bmp"
!define MUI_UNWELCOMEFINISHPAGE_BITMAP    "welcome.bmp"

# Welcome page text overrides — must be defined before MUI_PAGE_WELCOME.
!define MUI_WELCOMEPAGE_TITLE "Welcome to the JEditor Setup Wizard"
!define MUI_WELCOMEPAGE_TEXT  "This wizard will install JEditor v${INFO_PRODUCTVERSION} on your computer.$\r$\n$\r$\nJEditor is the analogy-first coding curriculum — a real code editor that teaches you to ship.$\r$\n$\r$\nIt is recommended that you close all other applications before starting Setup.$\r$\n$\r$\nClick Next to continue."

# Directory page surfaces the install location front and centre.
!define MUI_DIRECTORYPAGE_TEXT_TOP "Setup will install JEditor in the following folder. To install in a different folder, click Browse and select another folder. Click Install to start the installation."
!define MUI_DIRECTORYPAGE_TEXT_DESTINATION "Destination Folder"

# Finish page run-on-exit option.
!define MUI_FINISHPAGE_RUN              "$INSTDIR\${PRODUCT_EXECUTABLE}"
!define MUI_FINISHPAGE_RUN_TEXT         "Launch JEditor"
!define MUI_FINISHPAGE_LINK             "Visit jbeditor.com"
!define MUI_FINISHPAGE_LINK_LOCATION    "https://jbeditor.com"

# Page order — the wizard the student walks through.
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE           "license.txt"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
!insertmacro MUI_UNPAGE_FINISH

!insertmacro MUI_LANGUAGE "English"

Name "${INFO_PRODUCTNAME}"

# Two installer flavours from one NSIS file:
#   - default          → full setup with WebView2 Standalone bundled
#                        (~200 MB). Works on machines with no internet.
#   - /DSLIM_INSTALLER → slim setup, no WebView2 bundled (~22 MB).
#                        Uses the wails online bootstrapper which
#                        downloads the actual runtime at install time.
!ifdef SLIM_INSTALLER
    OutFile "..\..\bin\JEditor-Setup-Slim-v${INFO_PRODUCTVERSION}.exe"
!else
    OutFile "..\..\bin\JEditor-Setup-v${INFO_PRODUCTVERSION}.exe"
!endif

# Default install location: C:\Program Files\JEditor — the classic
# Windows installer convention (matches VS, Office, IntelliJ, every
# other "real" desktop app). Requires admin → triggers a UAC prompt
# at install time. The student can pick %LOCALAPPDATA%\Programs\JEditor
# on the Directory page for a no-admin install — both work.
InstallDir "$PROGRAMFILES64\${INFO_PRODUCTNAME}"
# If a previous install wrote its location to the registry, prefer that
# on re-install so updates land where the student originally put it.
InstallDirRegKey HKLM "Software\${INFO_COMPANYNAME}\${INFO_PRODUCTNAME}" "InstallDir"
RequestExecutionLevel admin
ShowInstDetails show

# ─── jeditor.webview2offline ─────────────────────────────────────────
# Install WebView2 from the Microsoft Evergreen Standalone Installer
# (~190 MB) bundled inside the NSIS. Drop-in replacement for
# wails.webview2runtime which uses the 1.8 MB online bootstrapper that
# has to fetch the actual runtime from Microsoft at install time. The
# standalone variant installs cleanly even on no-internet machines.
#
# The standalone installer file must be staged at
#   build\windows\installer\webview2\MicrosoftEdgeWebView2RuntimeInstaller.exe
# before running wails build. scripts/release-desktop.ps1 downloads it
# once on demand and caches it across releases.
!macro jeditor.webview2offline
    SetRegView 64
    # Bail out if a runtime is already installed system-wide. The
    # registry key shape matches wails_tools.nsh's check.
    ReadRegStr $0 HKLM "SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" "pv"
    StrCmp $0 "" 0 jeditor_wv2_already_installed
    ReadRegStr $0 HKLM "SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" "pv"
    StrCmp $0 "" 0 jeditor_wv2_already_installed
    ReadRegStr $0 HKCU "Software\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}" "pv"
    StrCmp $0 "" 0 jeditor_wv2_already_installed

    DetailPrint "Installing Microsoft Edge WebView2 Runtime (offline)..."
    InitPluginsDir
    CreateDirectory "$pluginsdir\wv2offline"
    SetOutPath "$pluginsdir\wv2offline"
    File "webview2\MicrosoftEdgeWebView2RuntimeInstaller.exe"
    ExecWait '"$pluginsdir\wv2offline\MicrosoftEdgeWebView2RuntimeInstaller.exe" /silent /install' $0
    DetailPrint "WebView2 install exited with code $0"
    Goto jeditor_wv2_done

    jeditor_wv2_already_installed:
        DetailPrint "WebView2 Runtime already present — skipping install."

    jeditor_wv2_done:
!macroend

# Single-instance guard. Local-namespace mutex name + explicit check
# for ERROR_ALREADY_EXISTS (183). Any other code means we proceed.
Function .onInit
    System::Call 'kernel32::CreateMutex(p 0, i 0, t "JEditorSetupMutex") ?e'
    Pop $R0
    IntCmp $R0 183 already_running mutex_ok mutex_ok
    already_running:
        MessageBox MB_OK|MB_ICONEXCLAMATION "The JEditor installer is already running."
        Abort
    mutex_ok:

    # If JEditor itself is currently running, ask the student to close
    # it first — otherwise the file-copy step will fail because the
    # binary is locked.
    FindWindow $R1 "" "JEditor"
    StrCmp $R1 0 app_not_running
        MessageBox MB_YESNO|MB_ICONQUESTION "JEditor is currently running. Close it now and continue installing?" IDYES app_close IDNO app_abort
        app_close:
            SendMessage $R1 0x10 0 0   # WM_CLOSE
            Sleep 1500
            Goto app_not_running
        app_abort:
            Abort
    app_not_running:

    !insertmacro wails.checkArchitecture
FunctionEnd

Section "Install"
    SetShellVarContext all

    # WebView2 install strategy. Two flavours, same NSIS file:
    #   - SLIM_INSTALLER: wails default online bootstrapper (~1.8 MB,
    #     downloads the runtime from MS at install time). Operator
    #     needs internet at install time.
    #   - default: bundle the ~190 MB Edge Evergreen Standalone
    #     Installer — works on no-internet machines.
    !ifdef SLIM_INSTALLER
        !insertmacro wails.webview2runtime
    !else
        !insertmacro jeditor.webview2offline
    !endif

    SetOutPath $INSTDIR

    !insertmacro wails.files

    # Shortcuts — Start Menu + Desktop. SetShellVarContext all puts
    # them in the All Users locations so every account on the machine
    # sees them.
    CreateShortcut "$SMPROGRAMS\${INFO_PRODUCTNAME}.lnk" "$INSTDIR\${PRODUCT_EXECUTABLE}"
    CreateShortcut "$DESKTOP\${INFO_PRODUCTNAME}.lnk"    "$INSTDIR\${PRODUCT_EXECUTABLE}"

    # Remember the install location so a future re-install picks it
    # up via InstallDirRegKey above (avoids the student having to
    # re-choose the folder every release).
    WriteRegStr HKLM "Software\${INFO_COMPANYNAME}\${INFO_PRODUCTNAME}" "InstallDir" "$INSTDIR"

    !insertmacro wails.writeUninstaller
SectionEnd

Section "Uninstall"
    SetShellVarContext all

    # Drop the WebView2 user-data dir — leftover %APPDATA%\jeditor.exe
    # would re-populate on next launch with stale state.
    RMDir /r "$APPDATA\${PRODUCT_EXECUTABLE}"

    RMDir /r $INSTDIR

    Delete "$SMPROGRAMS\${INFO_PRODUCTNAME}.lnk"
    Delete "$DESKTOP\${INFO_PRODUCTNAME}.lnk"

    DeleteRegKey HKLM "Software\${INFO_COMPANYNAME}\${INFO_PRODUCTNAME}"

    !insertmacro wails.deleteUninstaller
SectionEnd
