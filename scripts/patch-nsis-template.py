import os

WORKSPACE = r"c:\Users\emir\Desktop\Env_Vault"
TARGET_NSI = os.path.join(WORKSPACE, "src-tauri", "installer.nsi")

# Complete, self-contained NSIS template for Env Vault
# Guaranteed to set MUI_UNICON (uninstaller & alert dialog icon) and MUI_HEADERIMAGE_UNBITMAP
nsis_full_content = r"""Unicode true
ManifestDPIAware true
ManifestDPIAwareness PerMonitorV2

!if "lzma" == "none"
  SetCompress off
!else
  SetCompressor /SOLID "lzma"
!endif

!include MUI2.nsh
!include FileFunc.nsh
!include x64.nsh
!include WordFunc.nsh
!include "utils.nsh"
!include "FileAssociation.nsh"
!include "Win\COM.nsh"
!include "Win\Propkey.nsh"
!include "StrFunc.nsh"
${StrCase}
${StrLoc}

!define WEBVIEW2APPGUID "{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}"

!define MANUFACTURER "Vellium"
!define PRODUCTNAME "Env Vault"
!define VERSION "1.0.0"
!define VERSIONWITHBUILD "1.0.0.0"
!define HOMEPAGE "https://vellium.dev"
!define INSTALLMODE "currentUser"
!define LICENSE ""
!define INSTALLERICON "C:\Users\emir\Desktop\Env_Vault\src-tauri\icons\icon.ico"
!define SIDEBARIMAGE "C:\Users\emir\Desktop\Env_Vault\src-tauri\icons\nsis-sidebar.bmp"
!define HEADERIMAGE "C:\Users\emir\Desktop\Env_Vault\src-tauri\icons\nsis-header.bmp"
!define UNINSTALLERICON "C:\Users\emir\Desktop\Env_Vault\src-tauri\icons\icon.ico"
!define UNINSTALLERHEADERIMAGE "C:\Users\emir\Desktop\Env_Vault\src-tauri\icons\nsis-header.bmp"
!define MAINBINARYNAME "env-vault"
!define MAINBINARYSRCPATH "C:\Users\emir\Desktop\Env_Vault\src-tauri\target\release\env-vault.exe"
!define BUNDLEID "com.vellium.envvault"
!define COPYRIGHT "© 2026 Vellium. Tüm hakları saklıdır."
!define OUTFILE "nsis-output.exe"
!define ARCH "x64"
!define ADDITIONALPLUGINSPATH "C:\Users\emir\AppData\Local\tauri\NSIS\Plugins\x86-unicode\additional"
!define ALLOWDOWNGRADES "true"
!define DISPLAYLANGUAGESELECTOR "false"
!define INSTALLWEBVIEW2MODE "downloadBootstrapper"
!define WEBVIEW2INSTALLERARGS "/silent"
!define WEBVIEW2BOOTSTRAPPERPATH ""
!define WEBVIEW2INSTALLERPATH ""
!define MINIMUMWEBVIEW2VERSION ""
!define UNINSTKEY "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCTNAME}"
!define MANUKEY "Software\${MANUFACTURER}"
!define MANUPRODUCTKEY "${MANUKEY}\${PRODUCTNAME}"
!define UNINSTALLERSIGNCOMMAND ""
!define ESTIMATEDSIZE "10307"
!define STARTMENUFOLDER ""

Var PassiveMode
Var UpdateMode
Var NoShortcutMode
Var WixMode
Var OldMainBinaryName

Name "${PRODUCTNAME}"
BrandingText "${COPYRIGHT}"
OutFile "${OUTFILE}"

!define PLACEHOLDER_INSTALL_DIR "placeholder\${PRODUCTNAME}"
InstallDir "${PLACEHOLDER_INSTALL_DIR}"

VIProductVersion "${VERSIONWITHBUILD}"
VIAddVersionKey "ProductName" "${PRODUCTNAME}"
VIAddVersionKey "FileDescription" "${PRODUCTNAME}"
VIAddVersionKey "LegalCopyright" "${COPYRIGHT}"
VIAddVersionKey "FileVersion" "${VERSION}"
VIAddVersionKey "ProductVersion" "${VERSION}"

# additional plugins
!addplugindir "${ADDITIONALPLUGINSPATH}"

; Uninstaller signing command
!if "${UNINSTALLERSIGNCOMMAND}" != ""
  !uninstfinalize '${UNINSTALLERSIGNCOMMAND}'
!endif

; Handle install mode
!if "${INSTALLMODE}" == "perMachine"
  RequestExecutionLevel admin
!endif

!if "${INSTALLMODE}" == "currentUser"
  RequestExecutionLevel user
!endif

; Installer icon
!if "${INSTALLERICON}" != ""
  !define MUI_ICON "${INSTALLERICON}"
!endif

; Uninstaller icon (Crucial for uninstaller window, taskbar and alert popup)
!if "${UNINSTALLERICON}" != ""
  !define MUI_UNICON "${UNINSTALLERICON}"
!else if "${INSTALLERICON}" != ""
  !define MUI_UNICON "${INSTALLERICON}"
!endif

; Installer sidebar image
!if "${SIDEBARIMAGE}" != ""
  !define MUI_WELCOMEFINISHPAGE_BITMAP "${SIDEBARIMAGE}"
!endif

; Enable header images
!define MUI_HEADERIMAGE

; Installer header image
!if "${HEADERIMAGE}" != ""
  !define MUI_HEADERIMAGE_BITMAP "${HEADERIMAGE}"
!endif

; Uninstaller header image
!if "${UNINSTALLERHEADERIMAGE}" != ""
  !define MUI_HEADERIMAGE_UNBITMAP "${UNINSTALLERHEADERIMAGE}"
!else if "${HEADERIMAGE}" != ""
  !define MUI_HEADERIMAGE_UNBITMAP "${HEADERIMAGE}"
!endif

; Define registry key to store installer language
!define MUI_LANGDLL_REGISTRY_ROOT "HKCU"
!define MUI_LANGDLL_REGISTRY_KEY "${MANUPRODUCTKEY}"
!define MUI_LANGDLL_REGISTRY_VALUENAME "Installer Language"

; Installer pages
!define MUI_PAGE_CUSTOMFUNCTION_PRE SkipIfPassive
!insertmacro MUI_PAGE_WELCOME

!if "${LICENSE}" != ""
  !define MUI_PAGE_CUSTOMFUNCTION_PRE SkipIfPassive
  !insertmacro MUI_PAGE_LICENSE "${LICENSE}"
!endif

!define MUI_PAGE_CUSTOMFUNCTION_PRE DirectoryPre
!define MUI_PAGE_CUSTOMFUNCTION_LEAVE DirectoryLeave
!insertmacro MUI_PAGE_DIRECTORY

!define MUI_PAGE_CUSTOMFUNCTION_PRE SkipIfPassive
!insertmacro MUI_PAGE_INSTFILES

!define MUI_PAGE_CUSTOMFUNCTION_PRE SkipIfPassive
!define MUI_FINISHPAGE_NOAUTOCLOSE
!define MUI_FINISHPAGE_RUN
!define MUI_FINISHPAGE_RUN_FUNCTION RunApp
!insertmacro MUI_PAGE_FINISH

; Uninstaller pages
!define MUI_PAGE_CUSTOMFUNCTION_PRE un.SkipIfPassive
!define MUI_PAGE_CUSTOMFUNCTION_SHOW un.ConfirmShow
!define MUI_PAGE_CUSTOMFUNCTION_LEAVE un.ConfirmLeave
!insertmacro MUI_UNPAGE_CONFIRM

!define MUI_PAGE_CUSTOMFUNCTION_PRE un.SkipIfPassive
!insertmacro MUI_UNPAGE_INSTFILES

; Set languages
!insertmacro MUI_LANGUAGE "Turkish"

!include "C:\Users\emir\Desktop\Env_Vault\src-tauri\target\release\nsis\x64\Turkish.nsh"

; Custom functions and main sections
Function .onInit
  SetOutPath "$INSTDIR"
FunctionEnd

Function RunApp
  Exec '"$INSTDIR\${MAINBINARYNAME}.exe"'
FunctionEnd

Function SkipIfPassive
FunctionEnd

Function DirectoryPre
FunctionEnd

Function DirectoryLeave
FunctionEnd

Function un.SkipIfPassive
FunctionEnd

Function un.ConfirmShow
FunctionEnd

Function un.ConfirmLeave
FunctionEnd

Section "Install"
  SetOutPath "$INSTDIR"
  File /r "C:\Users\emir\Desktop\Env_Vault\src-tauri\target\release\env-vault.exe"
  
  WriteUninstaller "$INSTDIR\uninstall.exe"

  ; Registry uninstall entries
  WriteRegStr HKCU "${UNINSTKEY}" "DisplayName" "${PRODUCTNAME}"
  WriteRegStr HKCU "${UNINSTKEY}" "DisplayIcon" "$INSTDIR\${MAINBINARYNAME}.exe"
  WriteRegStr HKCU "${UNINSTKEY}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "${UNINSTKEY}" "Publisher" "${MANUFACTURER}"
  WriteRegStr HKCU "${UNINSTKEY}" "HelpLink" "${HOMEPAGE}"
  WriteRegStr HKCU "${UNINSTKEY}" "UninstallString" '"$INSTDIR\uninstall.exe"'
  WriteRegStr HKCU "${UNINSTKEY}" "QuietUninstallString" '"$INSTDIR\uninstall.exe" /S'
  WriteRegDWORD HKCU "${UNINSTKEY}" "NoModify" 1
  WriteRegDWORD HKCU "${UNINSTKEY}" "NoRepair" 1

  ; Shortcuts
  CreateShortcut "$SMPROGRAMS\${PRODUCTNAME}.lnk" "$INSTDIR\${MAINBINARYNAME}.exe" "" "$INSTDIR\${MAINBINARYNAME}.exe" 0
  CreateShortcut "$DESKTOP\${PRODUCTNAME}.lnk" "$INSTDIR\${MAINBINARYNAME}.exe" "" "$INSTDIR\${MAINBINARYNAME}.exe" 0
SectionEnd

Section "Uninstall"
  ; Check if running and prompt user with custom icon
  ${nsProcess::FindProcess} "${MAINBINARYNAME}.exe" $R0
  ${If} $R0 == 0
    MessageBox MB_OKCANCEL|MB_ICONQUESTION "Env Vault çalışır durumda!$\r$\nUygulamayı sonlandırmak için Tamam'a tıklayın." IDOK kill_proc IDCANCEL abort_uninst
    kill_proc:
      ${nsProcess::KillProcess} "${MAINBINARYNAME}.exe" $R0
      Sleep 1000
      Goto continue_uninst
    abort_uninst:
      Abort
  ${EndIf}

  continue_uninst:
  Delete "$DESKTOP\${PRODUCTNAME}.lnk"
  Delete "$SMPROGRAMS\${PRODUCTNAME}.lnk"
  Delete "$INSTDIR\${MAINBINARYNAME}.exe"
  Delete "$INSTDIR\uninstall.exe"
  RMDir "$INSTDIR"

  DeleteRegKey HKCU "${UNINSTKEY}"
SectionEnd
"""
"""

# Now write complete template
with open(TARGET_NSI, "w", encoding="utf-8") as f:
    f.write(nsis_full_content.strip())

print(f"Generated clean NSIS installer script: {TARGET_NSI}")
