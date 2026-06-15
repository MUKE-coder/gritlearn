####
## JEditor NSIS installer template
##
## Flow (VS Code / Discord / GitHub Desktop convention):
##   1. Welcome page — title + version + "Next"
##   2. Directory page — student sees + can override the install path
##   3. Install page — file-extraction progress
##   4. Finish page — "Launch JEditor" checkbox + "Finish"
##
## Single-instance: a named mutex blocks a second copy of the
## installer from running in parallel.
##
## Install location defaults to %LOCALAPPDATA%\Programs\JEditor
## (the Slack / Discord / VSCode / GitHub Desktop convention) — no
## admin required, the in-app auto-updater can swap the binary
## without UAC. The Directory page lets the student override.
##
## Installed binary is named jeditor.exe (no version suffix) so
## os.Executable() in the auto-updater always resolves to the same
## canonical path regardless of which version is running.
####
Unicode true

# Overrides applied BEFORE wails_tools.nsh so it doesn't re-set them
# from the wails.json defaults.
!define PRODUCT_EXECUTABLE "jeditor.exe"
!define UNINST_KEY_NAME    "JEditor"
!define REQUEST_EXECUTION_LEVEL "user"

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

!include "MUI.nsh"

!define MUI_ICON   "..\icon.ico"
!define MUI_UNICON "..\icon.ico"
!define MUI_FINISHPAGE_NOAUTOCLOSE
!define MUI_ABORTWARNING

# Branded MUI bitmaps — header.bmp (150x57) and welcome.bmp (164x314)
# are checked into this directory once generated. Commented out for
# v0.3.0 because the assets haven't been drawn yet; the installer
# uses the default MUI look until then. Uncomment when the bitmaps
# land alongside this file.
# !define MUI_HEADERIMAGE
# !define MUI_HEADERIMAGE_BITMAP            "header.bmp"
# !define MUI_HEADERIMAGE_UNBITMAP          "header.bmp"
# !define MUI_HEADERIMAGE_RIGHT
# !define MUI_WELCOMEFINISHPAGE_BITMAP      "welcome.bmp"
# !define MUI_UNWELCOMEFINISHPAGE_BITMAP    "welcome.bmp"

# Welcome page text overrides — must be defined before MUI_PAGE_WELCOME.
!define MUI_WELCOMEPAGE_TITLE   "Welcome to the JEditor Setup Wizard"
!define MUI_WELCOMEPAGE_TEXT    "This will install JEditor v${INFO_PRODUCTVERSION} on your computer.$\r$\n$\r$\nJEditor is the analogy-first coding curriculum — a real code editor that teaches you to ship.$\r$\n$\r$\nClick Next to continue, or Cancel to exit the wizard."

# Directory page surfaces the install location front and centre so
# the student knows where it's going.
!define MUI_DIRECTORYPAGE_TEXT_TOP "Setup will install JEditor in the folder below. To install in a different folder, click Browse and select another folder. Click Install to start the installation."
!define MUI_DIRECTORYPAGE_TEXT_DESTINATION "Install location"

# Finish page run-on-exit option.
!define MUI_FINISHPAGE_RUN      "$INSTDIR\${PRODUCT_EXECUTABLE}"
!define MUI_FINISHPAGE_RUN_TEXT "Launch JEditor now"

!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "English"

Name "${INFO_PRODUCTNAME}"

# Two installer flavours from one NSIS file:
#   - default          → full setup with WebView2 standalone bundled
#                        (when build/windows/installer/webview2/
#                        MicrosoftEdgeWebView2RuntimeInstaller.exe exists)
#   - /DSLIM_INSTALLER → slim setup, no WebView2 bundled (~22 MB).
#     wails.webview2runtime's online bootstrapper handles the runtime
#     install at first run; needs internet on the install machine but
#     not at full-runtime size.
#
# v0.3.0 default: slim. The release script can pass -DSLIM_INSTALLER to
# explicitly tag the slim variant in the filename; without the flag we
# still produce a slim installer (since we don't bundle the offline
# WebView2 yet). When we add the offline payload, this becomes the
# real default-vs-slim split.
!ifdef SLIM_INSTALLER
    OutFile "..\..\bin\JEditor-Setup-Slim-v${INFO_PRODUCTVERSION}.exe"
!else
    OutFile "..\..\bin\JEditor-Setup-v${INFO_PRODUCTVERSION}.exe"
!endif

# Default install location: %LOCALAPPDATA%\Programs\JEditor (same
# place as Slack / Discord / VSCode / GitHub Desktop). No admin
# required. The student can change this on the Directory page if
# they want C:\Program Files\JEditor — that requires admin which
# will UAC-prompt at install time.
InstallDir "$LOCALAPPDATA\Programs\${INFO_PRODUCTNAME}"
# If a previous install wrote its location to the registry, prefer
# that on re-install so updates land where the student originally
# put it.
InstallDirRegKey HKCU "Software\${INFO_COMPANYNAME}\${INFO_PRODUCTNAME}" "InstallDir"
RequestExecutionLevel user
ShowInstDetails show

# Single-instance guard. Local-namespace mutex so RequestExecutionLevel
# user doesn't fail with ACCESS_DENIED on Global.
Function .onInit
    System::Call 'kernel32::CreateMutex(p 0, i 0, t "JEditorSetupMutex") ?e'
    Pop $R0
    IntCmp $R0 183 already_running mutex_ok mutex_ok
    already_running:
        MessageBox MB_OK|MB_ICONEXCLAMATION "The JEditor installer is already running."
        Abort
    mutex_ok:

    # If JEditor itself is currently running, ask the student to
    # close it first — otherwise the file-copy step will fail because
    # the binary is locked.
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
    SetShellVarContext current

    # WebView2: use the wails default online bootstrapper. Small
    # (~1.8 MB) — downloads the actual runtime from MS at install
    # time. Needs working internet during install.
    !insertmacro wails.webview2runtime

    SetOutPath $INSTDIR

    !insertmacro wails.files

    CreateShortcut "$SMPROGRAMS\${INFO_PRODUCTNAME}.lnk" "$INSTDIR\${PRODUCT_EXECUTABLE}"
    CreateShortcut "$DESKTOP\${INFO_PRODUCTNAME}.lnk"    "$INSTDIR\${PRODUCT_EXECUTABLE}"

    # Remember the install location so a future re-install picks it
    # up via InstallDirRegKey above (avoids the student having to
    # re-choose the folder every release).
    WriteRegStr HKCU "Software\${INFO_COMPANYNAME}\${INFO_PRODUCTNAME}" "InstallDir" "$INSTDIR"

    !insertmacro wails.writeUninstaller
SectionEnd

Section "Uninstall"
    SetShellVarContext current

    # Drop the WebView2 user-data dir — leftover %APPDATA%\jeditor.exe
    # would re-populate on next launch with stale state.
    RMDir /r "$APPDATA\${PRODUCT_EXECUTABLE}"

    RMDir /r $INSTDIR

    Delete "$SMPROGRAMS\${INFO_PRODUCTNAME}.lnk"
    Delete "$DESKTOP\${INFO_PRODUCTNAME}.lnk"

    DeleteRegKey HKCU "Software\${INFO_COMPANYNAME}\${INFO_PRODUCTNAME}"

    !insertmacro wails.deleteUninstaller
SectionEnd
