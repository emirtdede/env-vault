import os
import subprocess
import shutil
from PIL import Image

# Dynamic workspace resolution
WORKSPACE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ICONS_DIR = os.path.join(WORKSPACE, "src-tauri", "icons")
os.makedirs(ICONS_DIR, exist_ok=True)

# Find Chrome executable
def find_chrome():
    candidates = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"),
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
    ]
    for c in candidates:
        if os.path.exists(c):
            return c
    which_chrome = shutil.which("chrome") or shutil.which("msedge")
    if which_chrome:
        return which_chrome
    raise FileNotFoundError("Chrome veya Edge tarayıcısı bulunamadı.")

CHROME_PATH = find_chrome()

svg_content = """<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body {
    width: 1024px;
    height: 1024px;
    background: transparent;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  svg {
    width: 1000px;
    height: 1000px;
    filter: drop-shadow(0 8px 32px rgba(0, 240, 255, 0.45));
  }
</style>
</head>
<body>
<svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Outer Glow -->
    <radialGradient id="outerGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#00F0FF" stop-opacity="0.45" />
      <stop offset="60%" stop-color="#0A84FF" stop-opacity="0.15" />
      <stop offset="100%" stop-color="#000000" stop-opacity="0" />
    </radialGradient>

    <!-- Shield Solid Base Gradient (High contrast against any taskbar) -->
    <linearGradient id="shieldBase" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#142442" />
      <stop offset="40%" stop-color="#0C172B" />
      <stop offset="100%" stop-color="#060C17" />
    </linearGradient>

    <!-- Vibrant Neon Rim Gradient -->
    <linearGradient id="neonRim" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38BDF8" />
      <stop offset="30%" stop-color="#00F0FF" />
      <stop offset="65%" stop-color="#0A84FF" />
      <stop offset="100%" stop-color="#60A5FA" />
    </linearGradient>

    <!-- Shackle Solid Luminous Gradient -->
    <linearGradient id="shackleGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="35%" stop-color="#E0F2FE" />
      <stop offset="75%" stop-color="#38BDF8" />
      <stop offset="100%" stop-color="#0284C7" />
    </linearGradient>

    <!-- Padlock Body Solid Gradient -->
    <linearGradient id="lockBodyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0284C7" />
      <stop offset="40%" stop-color="#0369A1" />
      <stop offset="100%" stop-color="#082F49" />
    </linearGradient>

    <!-- Keyhole Glow -->
    <linearGradient id="keyholeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" />
      <stop offset="60%" stop-color="#BAE6FD" />
      <stop offset="100%" stop-color="#38BDF8" />
    </linearGradient>

    <!-- Glass Highlight Reflection -->
    <linearGradient id="glassSheen" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.5" />
      <stop offset="35%" stop-color="#FFFFFF" stop-opacity="0.15" />
      <stop offset="70%" stop-color="#FFFFFF" stop-opacity="0" />
    </linearGradient>
  </defs>

  <!-- Ambient Glow -->
  <circle cx="256" cy="256" r="250" fill="url(#outerGlow)" />

  <!-- Outer Shield Contour (Edge to Edge, 94% coverage) -->
  <path
    d="M 256,16 L 484,72 C 484,260 416,428 256,496 C 96,428 28,260 28,72 Z"
    fill="url(#shieldBase)"
    stroke="url(#neonRim)"
    stroke-width="18"
    stroke-linejoin="round"
  />

  <!-- Inner Shield Inset Border -->
  <path
    d="M 256,40 L 460,90 C 460,250 398,398 256,462 C 114,398 52,250 52,90 Z"
    fill="#080F1E"
    stroke="#00F0FF"
    stroke-width="4"
    stroke-opacity="0.6"
  />

  <!-- Diagonal Glass Sheen Reflection -->
  <path
    d="M 256,40 L 460,90 C 460,175 440,265 395,335 L 210,120 L 256,40 Z"
    fill="url(#glassSheen)"
  />

  <!-- Cyber Accents -->
  <g opacity="0.6" stroke="#38BDF8" stroke-width="3.5" fill="none" stroke-linecap="round">
    <path d="M 85,150 L 130,150 L 155,180" />
    <circle cx="85" cy="150" r="4.5" fill="#00F0FF" />

    <path d="M 427,150 L 382,150 L 357,180" />
    <circle cx="427" cy="150" r="4.5" fill="#00F0FF" />
  </g>

  <!-- ================= MASTER PADLOCK (BOLD & LUMINOUS) ================= -->
  <!-- Shackle Shadow & Base Arch -->
  <path
    d="M 204,228 L 204,168 C 204,136 227.3,110 256,110 C 284.7,110 308,136 308,168 L 308,228"
    fill="none"
    stroke="#030712"
    stroke-width="38"
    stroke-linecap="round"
  />

  <!-- Shackle Main Metallic Arch -->
  <path
    d="M 204,228 L 204,168 C 204,136 227.3,110 256,110 C 284.7,110 308,136 308,168 L 308,228"
    fill="none"
    stroke="url(#shackleGrad)"
    stroke-width="26"
    stroke-linecap="round"
  />

  <!-- Shackle Specular Highlight Core -->
  <path
    d="M 204,222 L 204,168 C 204,140 227.3,118 256,118 C 284.7,118 308,140 308,168 L 308,222"
    fill="none"
    stroke="#FFFFFF"
    stroke-width="8"
    stroke-linecap="round"
    opacity="0.9"
  />

  <!-- Padlock Body (Solid, Bright, High Contrast) -->
  <rect
    x="160"
    y="206"
    width="192"
    height="160"
    rx="28"
    fill="url(#lockBodyGrad)"
    stroke="#38BDF8"
    stroke-width="8"
  />

  <!-- Inner Plate Highlight -->
  <rect
    x="174"
    y="220"
    width="164"
    height="132"
    rx="18"
    fill="#041E3A"
    stroke="#00F0FF"
    stroke-width="2.5"
    stroke-opacity="0.7"
  />

  <!-- Padlock Cyber Details -->
  <g stroke="#38BDF8" stroke-width="3" stroke-linecap="round" opacity="0.85">
    <line x1="186" y1="262" x2="216" y2="262" />
    <line x1="186" y1="284" x2="210" y2="284" />
    <line x1="186" y1="306" x2="216" y2="306" />

    <line x1="296" y1="262" x2="326" y2="262" />
    <line x1="302" y1="284" x2="326" y2="284" />
    <line x1="296" y1="306" x2="326" y2="306" />
  </g>

  <!-- Glowing Rivets -->
  <circle cx="188" cy="232" r="3.5" fill="#38BDF8" />
  <circle cx="324" cy="232" r="3.5" fill="#38BDF8" />
  <circle cx="188" cy="338" r="3.5" fill="#38BDF8" />
  <circle cx="324" cy="338" r="3.5" fill="#38BDF8" />

  <!-- Luminous White Keyhole -->
  <circle cx="256" cy="272" r="32" fill="#020B18" stroke="#00F0FF" stroke-width="3.5" />
  <circle cx="256" cy="264" r="14" fill="url(#keyholeGrad)" />
  <path
    d="M 250,270 L 244,295 C 244,300 268,300 268,295 L 262,270 Z"
    fill="url(#keyholeGrad)"
  />
  <circle cx="256" cy="264" r="6" fill="#FFFFFF" />
  <circle cx="256" cy="290" r="3.5" fill="#FFFFFF" />

  <!-- Top Dots -->
  <circle cx="220" cy="80" r="4.5" fill="#38BDF8" />
  <circle cx="256" cy="62" r="6" fill="#FFFFFF" />
  <circle cx="292" cy="80" r="4.5" fill="#38BDF8" />
</svg>
</body>
</html>
"""

html_path = os.path.join(WORKSPACE, "scripts", "temp_icon.html")
png_1024_path = os.path.join(WORKSPACE, "scripts", "temp_icon_1024.png")

with open(html_path, "w", encoding="utf-8") as f:
    f.write(svg_content)

print(f"Capturing 1024x1024 transparent master PNG using {CHROME_PATH}...")
subprocess.run([
    CHROME_PATH,
    "--headless",
    "--disable-gpu",
    "--force-device-scale-factor=1",
    "--window-size=1024,1024",
    "--default-background-color=00000000",
    f"--screenshot={png_1024_path}",
    html_path
], check=True)

print("Processing master icon with Pillow...")
master_img = Image.open(png_1024_path).convert("RGBA")

# Helper to save square resized icon
def save_square_icon(filename, size):
    target = os.path.join(ICONS_DIR, filename)
    resized = master_img.resize((size, size), Image.Resampling.LANCZOS)
    resized.save(target, "PNG")

# Helper to save centered icon on non-square transparent canvas (Wide Tile & SplashScreen)
def save_centered_icon(filename, canvas_w, canvas_h, icon_h_ratio=0.75):
    target = os.path.join(ICONS_DIR, filename)
    canvas = Image.new("RGBA", (canvas_w, canvas_h), (0, 0, 0, 0))
    icon_h = int(canvas_h * icon_h_ratio)
    icon_w = icon_h
    resized = master_img.resize((icon_w, icon_h), Image.Resampling.LANCZOS)
    x = (canvas_w - icon_w) // 2
    y = (canvas_h - icon_h) // 2
    canvas.paste(resized, (x, y), resized)
    canvas.save(target, "PNG")

# ==============================================================================
# 1. Standard Tauri & Core Desktop Icons
# ==============================================================================
standard_sizes = {
    "16x16.png": 16,
    "24x24.png": 24,
    "32x32.png": 32,
    "48x48.png": 48,
    "64x64.png": 64,
    "128x128.png": 128,
    "128x128@2x.png": 256,
    "256x256.png": 256,
    "icon.png": 512,
    "Square30x30Logo.png": 30,
}

for name, size in standard_sizes.items():
    save_square_icon(name, size)

# ==============================================================================
# 2. Microsoft Store Listing Assets (Partner Center)
# ==============================================================================
# 1:1 App Tile Icon (Zorunlu / Mağaza Vitrin Logosu - 300x300)
save_square_icon("StoreLogo300x300.png", 300)
save_square_icon("StoreLogo.png", 50)

# StoreLogo Scale Variants (50x50 base)
store_logo_scales = {
    "StoreLogo.scale-100.png": 50,
    "StoreLogo.scale-125.png": 63,
    "StoreLogo.scale-150.png": 75,
    "StoreLogo.scale-200.png": 100,
    "StoreLogo.scale-400.png": 200,
}
for name, size in store_logo_scales.items():
    save_square_icon(name, size)

# ==============================================================================
# 3. Square44x44Logo (App List, Taskbar, Search, Start Pins)
# ==============================================================================
# Base & Scales
save_square_icon("Square44x44Logo.png", 44)
sq44_scales = {
    "Square44x44Logo.scale-100.png": 44,
    "Square44x44Logo.scale-125.png": 55,
    "Square44x44Logo.scale-150.png": 66,
    "Square44x44Logo.scale-200.png": 88,
    "Square44x44Logo.scale-400.png": 176,
}
for name, size in sq44_scales.items():
    save_square_icon(name, size)

# Target Sizes (Raw physical pixels for exact taskbar/system tray rendering)
target_sizes = [16, 20, 24, 30, 32, 36, 40, 48, 60, 64, 72, 80, 96, 256]

for ts in target_sizes:
    # Standard target size
    save_square_icon(f"Square44x44Logo.targetsize-{ts}.png", ts)
    # Altform Unplated (Transparent background for dark theme taskbar - NO square plate!)
    save_square_icon(f"Square44x44Logo.altform-unplated_targetsize-{ts}.png", ts)
    # Altform Light Unplated (Transparent background for light theme taskbar)
    save_square_icon(f"Square44x44Logo.altform-lightunplated_targetsize-{ts}.png", ts)

# ==============================================================================
# 4. Square150x150Logo (Medium Tile / Start Menu)
# ==============================================================================
save_square_icon("Square150x150Logo.png", 150)
sq150_scales = {
    "Square150x150Logo.scale-100.png": 150,
    "Square150x150Logo.scale-125.png": 188,
    "Square150x150Logo.scale-150.png": 225,
    "Square150x150Logo.scale-200.png": 300,
    "Square150x150Logo.scale-400.png": 600,
}
for name, size in sq150_scales.items():
    save_square_icon(name, size)

# ==============================================================================
# 5. Square71x71Logo (Small Tile)
# ==============================================================================
save_square_icon("Square71x71Logo.png", 71)
sq71_scales = {
    "Square71x71Logo.scale-100.png": 71,
    "Square71x71Logo.scale-125.png": 89,
    "Square71x71Logo.scale-150.png": 107,
    "Square71x71Logo.scale-200.png": 142,
    "Square71x71Logo.scale-400.png": 284,
}
for name, size in sq71_scales.items():
    save_square_icon(name, size)

# Backward compatible names
save_square_icon("Square89x89Logo.png", 89)
save_square_icon("Square107x107Logo.png", 107)
save_square_icon("Square142x142Logo.png", 142)
save_square_icon("Square284x284Logo.png", 284)

# ==============================================================================
# 6. Square310x310Logo (Large Tile)
# ==============================================================================
save_square_icon("Square310x310Logo.png", 310)
sq310_scales = {
    "Square310x310Logo.scale-100.png": 310,
    "Square310x310Logo.scale-125.png": 388,
    "Square310x310Logo.scale-150.png": 465,
    "Square310x310Logo.scale-200.png": 620,
    "Square310x310Logo.scale-400.png": 1240,
}
for name, size in sq310_scales.items():
    save_square_icon(name, size)

# ==============================================================================
# 7. Wide310x150Logo (Wide Tile - 2:1 Aspect Ratio)
# ==============================================================================
save_centered_icon("Wide310x150Logo.png", 310, 150, icon_h_ratio=0.85)
wide_scales = {
    "Wide310x150Logo.scale-100.png": (310, 150),
    "Wide310x150Logo.scale-125.png": (388, 188),
    "Wide310x150Logo.scale-150.png": (465, 225),
    "Wide310x150Logo.scale-200.png": (620, 300),
    "Wide310x150Logo.scale-400.png": (1240, 600),
}
for name, (w, h) in wide_scales.items():
    save_centered_icon(name, w, h, icon_h_ratio=0.85)

# ==============================================================================
# 8. SplashScreen (620x300 Base Aspect Ratio)
# ==============================================================================
save_centered_icon("SplashScreen.png", 620, 300, icon_h_ratio=0.7)
splash_scales = {
    "SplashScreen.scale-100.png": (620, 300),
    "SplashScreen.scale-125.png": (775, 375),
    "SplashScreen.scale-150.png": (930, 450),
    "SplashScreen.scale-200.png": (1240, 600),
    "SplashScreen.scale-400.png": (2480, 1200),
}
for name, (w, h) in splash_scales.items():
    save_centered_icon(name, w, h, icon_h_ratio=0.7)

# ==============================================================================
# 9. BadgeLogo (24x24 Base Aspect Ratio)
# ==============================================================================
save_square_icon("BadgeLogo.png", 24)
badge_scales = {
    "BadgeLogo.scale-100.png": 24,
    "BadgeLogo.scale-125.png": 30,
    "BadgeLogo.scale-150.png": 36,
    "BadgeLogo.scale-200.png": 48,
    "BadgeLogo.scale-400.png": 96,
}
for name, size in badge_scales.items():
    save_square_icon(name, size)

# ==============================================================================
# 10. Multi-Resolution Win32 icon.ico
# ==============================================================================
ico_sizes = [(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
ico_target = os.path.join(ICONS_DIR, "icon.ico")
master_img.save(ico_target, format="ICO", sizes=ico_sizes)
print(f"Saved multi-resolution icon.ico with sizes: {ico_sizes}")

# Clean up temp files
if os.path.exists(html_path):
    os.remove(html_path)
if os.path.exists(png_1024_path):
    os.remove(png_1024_path)

print(f"SUCCESS: All Microsoft Store & Windows Visual Assets generated in {ICONS_DIR}!")

