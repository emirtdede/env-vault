import os
import re

WORKSPACE = r"c:\Users\emir\Desktop\Env_Vault"
NSI_PATH = os.path.join(WORKSPACE, "src-tauri", "target", "release", "nsis", "x64", "installer.nsi")
ICON_PATH = os.path.join(WORKSPACE, "src-tauri", "icons", "icon.ico")
HEADER_PATH = os.path.join(WORKSPACE, "src-tauri", "icons", "nsis-header.bmp")

if not os.path.exists(NSI_PATH):
    print("NSI script not found.")
    exit(1)

with open(NSI_PATH, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Patch top-level define values for UNINSTALLERICON and UNINSTALLERHEADERIMAGE safely
content = re.sub(
    r'!define UNINSTALLERICON ".*?"',
    lambda m: f'!define UNINSTALLERICON "{ICON_PATH}"',
    content
)
content = re.sub(
    r'!define UNINSTALLERHEADERIMAGE ".*?"',
    lambda m: f'!define UNINSTALLERHEADERIMAGE "{HEADER_PATH}"',
    content
)

# 2. Cleanly replace the header images block
target_header_block = """; Enable header images for installer and uninstaller pages when either image is configured.
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_RIGHT
!if "${HEADERIMAGE}" != ""
  !define MUI_HEADERIMAGE_BITMAP "${HEADERIMAGE}"
!endif
!if "${UNINSTALLERHEADERIMAGE}" != ""
  !define MUI_HEADERIMAGE_UNBITMAP "${UNINSTALLERHEADERIMAGE}"
!endif"""

content = re.sub(
    r'; Enable header images for installer and uninstaller pages.*?(?=; Uninstaller icon)',
    lambda m: target_header_block + "\n\n",
    content,
    flags=re.DOTALL
)

with open(NSI_PATH, "w", encoding="utf-8") as f:
    f.write(content)

print("[OK] NSIS script cleanly patched with MUI_HEADERIMAGE_RIGHT and custom uninstaller icons.")
