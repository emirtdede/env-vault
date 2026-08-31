import os
import re

WORKSPACE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
NSI_PATH = os.path.join(WORKSPACE, "src-tauri", "target", "release", "nsis", "x64", "installer.nsi")
ICON_PATH = os.path.join(WORKSPACE, "src-tauri", "icons", "icon.ico")
HEADER_PATH = os.path.join(WORKSPACE, "src-tauri", "icons", "nsis-header.bmp")
SIDEBAR_PATH = os.path.join(WORKSPACE, "src-tauri", "icons", "nsis-sidebar.bmp")


if not os.path.exists(NSI_PATH):
    print("NSI script not found.")
    exit(1)

with open(NSI_PATH, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Ensure UNINSTALLERICON and UNINSTALLERHEADERIMAGE
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

# 2. Fix the sidebar block if corrupted
content = re.sub(
    r'; Installer sidebar image\s*!if "\$\{SIDEBARIMAGE\}" != ""\s*!define MUI_WELCOMEFINISHPAGE.*?!endif',
    '; Installer sidebar image\n!if "${SIDEBARIMAGE}" != ""\n  !define MUI_WELCOMEFINISHPAGE_BITMAP "${SIDEBARIMAGE}"\n!endif',
    content,
    flags=re.DOTALL
)

# 3. Clean any existing header block or AlignHeaderTexts
content = re.sub(r'!define MUI_HEADERIMAGE[^\n]*\n?', '', content)
content = re.sub(r'!define MUI_CUSTOMFUNCTION_[^\n]*\n?', '', content)
content = re.sub(r'; Enable header images for installer and uninstaller pages.*?(?=; Uninstaller icon)', '', content, flags=re.DOTALL)
content = re.sub(r'\nFunction AlignHeaderTexts.*?FunctionEnd\n', '\n', content, flags=re.DOTALL)
content = re.sub(r'\nFunction un\.AlignHeaderTexts.*?FunctionEnd\n', '\n', content, flags=re.DOTALL)

# 4. Insert clean header block before !include MUI2.nsh
header_pre_block = f"""!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_RIGHT
!define MUI_HEADERIMAGE_BITMAP "{HEADER_PATH}"
!define MUI_HEADERIMAGE_UNBITMAP "{HEADER_PATH}"
!define MUI_CUSTOMFUNCTION_GUIINIT AlignHeaderTexts
!define MUI_CUSTOMFUNCTION_UNGUIINIT un.AlignHeaderTexts
!include MUI2.nsh"""

content = content.replace("!include MUI2.nsh", header_pre_block, 1)

# 5. Append AlignHeaderTexts functions at the end
align_functions = """
Function AlignHeaderTexts
  GetDlgItem $0 $HWNDPARENT 1037
  GetDlgItem $1 $HWNDPARENT 1038
  
  System::Call '*(&i4, &i4, &i4, &i4) p .r2'
  System::Call '*(&i4, &i4, &i4, &i4) p .r3'
  
  System::Call 'user32::GetWindowRect(p $0, p $2)'
  System::Call 'user32::GetWindowRect(p $1, p $3)'
  
  System::Call 'user32::MapWindowPoints(p 0, p $HWNDPARENT, p $2, i 2)'
  System::Call 'user32::MapWindowPoints(p 0, p $HWNDPARENT, p $3, i 2)'
  
  System::Call '*$2(i .r4, i .r5, i .r6, i .r7)'
  System::Call '*$3(i .r8, i .r9, i .r10, i .r11)'
  
  ; Set Subtitle X position to match Title X position ($4) exactly
  System::Call 'user32::SetWindowPos(p $1, p 0, i $4, i $9, i 0, i 0, i 0x0015)'
  
  System::Free $2
  System::Free $3
FunctionEnd

Function un.AlignHeaderTexts
  GetDlgItem $0 $HWNDPARENT 1037
  GetDlgItem $1 $HWNDPARENT 1038
  
  System::Call '*(&i4, &i4, &i4, &i4) p .r2'
  System::Call '*(&i4, &i4, &i4, &i4) p .r3'
  
  System::Call 'user32::GetWindowRect(p $0, p $2)'
  System::Call 'user32::GetWindowRect(p $1, p $3)'
  
  System::Call 'user32::MapWindowPoints(p 0, p $HWNDPARENT, p $2, i 2)'
  System::Call 'user32::MapWindowPoints(p 0, p $HWNDPARENT, p $3, i 2)'
  
  System::Call '*$2(i .r4, i .r5, i .r6, i .r7)'
  System::Call '*$3(i .r8, i .r9, i .r10, i .r11)'
  
  System::Call 'user32::SetWindowPos(p $1, p 0, i $4, i $9, i 0, i 0, i 0x0015)'
  
  System::Free $2
  System::Free $3
FunctionEnd
"""

content += "\n" + align_functions

with open(NSI_PATH, "w", encoding="utf-8") as f:
    f.write(content)

print("[OK] NSIS script patched with right-aligned logo and perfectly left-aligned header texts!")
