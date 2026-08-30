import os

WORKSPACE = r"c:\Users\emir\Desktop\Env_Vault"
NSI_PATH = os.path.join(WORKSPACE, "src-tauri", "target", "release", "nsis", "x64", "installer.nsi")
ICON_PATH = os.path.join(WORKSPACE, "src-tauri", "icons", "icon.ico")
HEADER_PATH = os.path.join(WORKSPACE, "src-tauri", "icons", "nsis-header.bmp")

if not os.path.exists(NSI_PATH):
    print("NSI script not found yet.")
    exit(0)

with open(NSI_PATH, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Patch Uninstaller Icon and Header Image
content = content.replace('!define UNINSTALLERICON ""', f'!define UNINSTALLERICON "{ICON_PATH}"')
content = content.replace('!define UNINSTALLERHEADERIMAGE ""', f'!define UNINSTALLERHEADERIMAGE "{HEADER_PATH}"')

# 2. Add GUIInit hooks for tight header alignment
gui_init_hook = """!define MUI_CUSTOMFUNCTION_GUIINIT AlignHeaderControls
!define MUI_CUSTOMFUNCTION_UNGUIINIT un.AlignHeaderControls
"""

if "!define MUI_CUSTOMFUNCTION_GUIINIT AlignHeaderControls" not in content:
    # Insert right before "; Installer pages"
    content = content.replace("; Installer pages", gui_init_hook + "\n; Installer pages")

# 3. Add SHOW callbacks to standard pages so page transitions keep the tight alignment
content = content.replace(
    "!insertmacro MUI_PAGE_DIRECTORY",
    "!define MUI_PAGE_CUSTOMFUNCTION_SHOW AlignHeaderControls\n!insertmacro MUI_PAGE_DIRECTORY"
)
content = content.replace(
    "!insertmacro MUI_PAGE_INSTFILES",
    "!define MUI_PAGE_CUSTOMFUNCTION_SHOW AlignHeaderControls\n!insertmacro MUI_PAGE_INSTFILES"
)
content = content.replace(
    "!insertmacro MUI_UNPAGE_INSTFILES",
    "!define MUI_PAGE_CUSTOMFUNCTION_SHOW un.AlignHeaderControls\n!insertmacro MUI_UNPAGE_INSTFILES"
)

# 4. Add the Alignment Functions
align_functions = """
Function AlignHeaderControls
  ; Retrieve DPI
  System::Call "user32::GetDpiForWindow(p $HWNDPARENT) i .r2"
  ${If} $2 == 0
    StrCpy $2 96
  ${EndIf}

  GetDlgItem $R0 $HWNDPARENT 1034 ; Picture Control
  GetDlgItem $R1 $HWNDPARENT 1037 ; Header Title
  GetDlgItem $R2 $HWNDPARENT 1038 ; Header Subtitle

  ; Logo: x = 12, y = 5, w = 48, h = 48
  IntOp $3 12 * $2
  IntOp $3 $3 / 96
  IntOp $4 5 * $2
  IntOp $4 $4 / 96
  IntOp $5 48 * $2
  IntOp $5 $5 / 96
  IntOp $6 48 * $2
  IntOp $6 $6 / 96
  System::Call "user32::SetWindowPos(p $R0, p 0, i $3, i $4, i $5, i $6, i 0x0014)"

  ; Title: x = 68, y = 8, w = 420, h = 18 (Tight 8px margin after logo)
  IntOp $3 68 * $2
  IntOp $3 $3 / 96
  IntOp $4 8 * $2
  IntOp $4 $4 / 96
  IntOp $5 420 * $2
  IntOp $5 $5 / 96
  IntOp $6 18 * $2
  IntOp $6 $6 / 96
  System::Call "user32::SetWindowPos(p $R1, p 0, i $3, i $4, i $5, i $6, i 0x0014)"

  ; Subtitle: x = 68, y = 26, w = 420, h = 26 (Directly aligned with title)
  IntOp $3 68 * $2
  IntOp $3 $3 / 96
  IntOp $4 26 * $2
  IntOp $4 $4 / 96
  IntOp $5 420 * $2
  IntOp $5 $5 / 96
  IntOp $6 26 * $2
  IntOp $6 $6 / 96
  System::Call "user32::SetWindowPos(p $R2, p 0, i $3, i $4, i $5, i $6, i 0x0014)"
FunctionEnd

Function un.AlignHeaderControls
  System::Call "user32::GetDpiForWindow(p $HWNDPARENT) i .r2"
  ${If} $2 == 0
    StrCpy $2 96
  ${EndIf}

  GetDlgItem $R0 $HWNDPARENT 1034
  GetDlgItem $R1 $HWNDPARENT 1037
  GetDlgItem $R2 $HWNDPARENT 1038

  ; Logo: x = 12, y = 5, w = 48, h = 48
  IntOp $3 12 * $2
  IntOp $3 $3 / 96
  IntOp $4 5 * $2
  IntOp $4 $4 / 96
  IntOp $5 48 * $2
  IntOp $5 $5 / 96
  IntOp $6 48 * $2
  IntOp $6 $6 / 96
  System::Call "user32::SetWindowPos(p $R0, p 0, i $3, i $4, i $5, i $6, i 0x0014)"

  ; Title: x = 68, y = 8, w = 420, h = 18
  IntOp $3 68 * $2
  IntOp $3 $3 / 96
  IntOp $4 8 * $2
  IntOp $4 $4 / 96
  IntOp $5 420 * $2
  IntOp $5 $5 / 96
  IntOp $6 18 * $2
  IntOp $6 $6 / 96
  System::Call "user32::SetWindowPos(p $R1, p 0, i $3, i $4, i $5, i $6, i 0x0014)"

  ; Subtitle: x = 68, y = 26, w = 420, h = 26
  IntOp $3 68 * $2
  IntOp $3 $3 / 96
  IntOp $4 26 * $2
  IntOp $4 $4 / 96
  IntOp $5 420 * $2
  IntOp $5 $5 / 96
  IntOp $6 26 * $2
  IntOp $6 $6 / 96
  System::Call "user32::SetWindowPos(p $R2, p 0, i $3, i $4, i $5, i $6, i 0x0014)"
FunctionEnd
"""

# Call in un.ConfirmShow as well
if "Call un.AlignHeaderControls" not in content:
    content = content.replace("Function un.ConfirmShow", "Function un.ConfirmShow\n  Call un.AlignHeaderControls")

content += "\n" + align_functions

with open(NSI_PATH, "w", encoding="utf-8") as f:
    f.write(content)

print("[OK] NSIS script patched with tight header alignment and uninstaller custom assets!")
