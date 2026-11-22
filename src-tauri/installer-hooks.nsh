; Env Vault installer customisation.
;
; The vault never deletes user data on its own. Uninstall offers a single,
; opt-in question that removes %LOCALAPPDATA%\EnvVault (encrypted vault,
; settings and cached icons) for users who want a completely clean machine.

!macro customInstall
  DetailPrint "Env Vault: registering application data folder"
  CreateDirectory "$LOCALAPPDATA\EnvVault"
!macroend

!macro customUnInstall
  ; Remove the run-at-startup entry so an uninstalled build never lingers.
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "EnvVault"

  MessageBox MB_YESNO|MB_ICONQUESTION \
    "Also delete the local Env Vault data?$\r$\n$\r$\nThis removes your encrypted vault, settings and cached icons from $LOCALAPPDATA\EnvVault. Encrypted cloud backups are not touched.$\r$\n$\r$\nChoose No to keep your data for a future reinstall." \
    /SD IDNO IDNO envvault_keep_data
  DetailPrint "Env Vault: removing local application data"
  RMDir /r "$LOCALAPPDATA\EnvVault"
  envvault_keep_data:
!macroend
