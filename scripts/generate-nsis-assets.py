import os
from PIL import Image, ImageDraw, ImageFont

WORKSPACE = r"c:\Users\emir\Desktop\Env_Vault"
ICONS_DIR = os.path.join(WORKSPACE, "src-tauri", "icons")
ICON_PNG_PATH = os.path.join(ICONS_DIR, "icon.png")

print("Generating high-fidelity NSIS Header (150x57) and Sidebar (164x314) bitmaps...")

icon_master = Image.open(ICON_PNG_PATH).convert("RGBA")

# ==============================================================================
# 1. NSIS HEADER BITMAP (150x57 px, Pure White Background #FFFFFF)
# ==============================================================================
# NSIS header background is pure white (#FFFFFF). 
# We place a crisp 48x48 icon on the far right of the 150x57 canvas.
header_canvas = Image.new("RGBA", (150, 57), (255, 255, 255, 255))
header_icon_size = 48
header_icon = icon_master.resize((header_icon_size, header_icon_size), Image.Resampling.LANCZOS)

icon_x = 150 - header_icon_size - 4
icon_y = (57 - header_icon_size) // 2

header_canvas.alpha_composite(header_icon, (icon_x, icon_y))
header_bmp = header_canvas.convert("RGB")

header_target = os.path.join(ICONS_DIR, "nsis-header.bmp")
header_bmp.save(header_target, "BMP")
print(f"[OK] Saved pristine NSIS header to {header_target} (150x57 RGB, pure white background)")


# ==============================================================================
# 2. NSIS SIDEBAR BITMAP (164x314 px, Premium Dark Navy Cyber Banner)
# ==============================================================================
sidebar_w, sidebar_h = 164, 314
sidebar_canvas = Image.new("RGBA", (sidebar_w, sidebar_h), (8, 15, 30, 255))
draw = ImageDraw.Draw(sidebar_canvas)

# Vertical gradient background
for y in range(sidebar_h):
    ratio = y / sidebar_h
    r = int(12 * (1 - ratio) + 6 * ratio)
    g = int(24 * (1 - ratio) + 12 * ratio)
    b = int(44 * (1 - ratio) + 23 * ratio)
    draw.line([(0, y), (sidebar_w, y)], fill=(r, g, b, 255))

# Subtle decorative cyber lines and accents
draw.line([(12, 20), (sidebar_w - 12, 20)], fill=(0, 240, 255, 60), width=1)
draw.line([(12, sidebar_h - 20), (sidebar_w - 12, sidebar_h - 20)], fill=(0, 240, 255, 60), width=1)

# Glowing circle ambient in center
ambient = Image.new("RGBA", (sidebar_w, sidebar_h), (0, 0, 0, 0))
ambient_draw = ImageDraw.Draw(ambient)
for radius in range(70, 0, -5):
    alpha = int(25 * (1 - radius / 70))
    ambient_draw.ellipse(
        [sidebar_w // 2 - radius, 110 - radius, sidebar_w // 2 + radius, 110 + radius],
        fill=(0, 240, 255, alpha)
    )
sidebar_canvas.alpha_composite(ambient)

# Add large sharp logo (96x96)
sidebar_icon_size = 96
sidebar_icon = icon_master.resize((sidebar_icon_size, sidebar_icon_size), Image.Resampling.LANCZOS)
sidebar_icon_x = (sidebar_w - sidebar_icon_size) // 2
sidebar_icon_y = 65
sidebar_canvas.alpha_composite(sidebar_icon, (sidebar_icon_x, sidebar_icon_y))

# Add brand typography
try:
    # Try using Windows system font Segoe UI if available
    font_bold = ImageFont.truetype("C:\\Windows\\Fonts\\segoeuib.ttf", 15)
    font_sub = ImageFont.truetype("C:\\Windows\\Fonts\\segoeui.ttf", 10)
    font_tiny = ImageFont.truetype("C:\\Windows\\Fonts\\segoeui.ttf", 9)
except Exception:
    font_bold = ImageFont.load_default()
    font_sub = font_bold
    font_tiny = font_bold

# "Env Vault"
title_text = "Env Vault"
bbox_title = draw.textbbox((0, 0), title_text, font=font_bold)
title_w = bbox_title[2] - bbox_title[0]
draw.text(((sidebar_w - title_w) // 2, 175), title_text, fill=(255, 255, 255, 255), font=font_bold)

# Subtitle
sub_text = "Secure .env Vault"
bbox_sub = draw.textbbox((0, 0), sub_text, font=font_sub)
sub_w = bbox_sub[2] - bbox_sub[0]
draw.text(((sidebar_w - sub_w) // 2, 196), sub_text, fill=(56, 189, 248, 230), font=font_sub)

# Bottom badge
badge_text = "Vellium.dev"
bbox_badge = draw.textbbox((0, 0), badge_text, font=font_tiny)
badge_w = bbox_badge[2] - bbox_badge[0]
draw.text(((sidebar_w - badge_w) // 2, 280), badge_text, fill=(148, 163, 184, 180), font=font_tiny)

sidebar_bmp = sidebar_canvas.convert("RGB")
sidebar_target = os.path.join(ICONS_DIR, "nsis-sidebar.bmp")
sidebar_bmp.save(sidebar_target, "BMP")
print(f"[OK] Saved premium NSIS sidebar to {sidebar_target} (164x314 RGB)")

print("All NSIS assets generated successfully!")
