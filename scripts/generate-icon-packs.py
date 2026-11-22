"""
Generates the four selectable Env Vault application icon packs.

Each pack is rendered at 1024 px and exported as a 256 px PNG (used at runtime
for the window, taskbar and tray) plus a multi-size ICO (used for desktop and
Start Menu shortcuts).
"""

from __future__ import annotations

import os
from PIL import Image, ImageDraw

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
OUT_DIR = os.path.join(ROOT, "src", "assets", "icons")
os.makedirs(OUT_DIR, exist_ok=True)

SIZE = 1024
SS = 4  # supersampling for smooth edges
W = SIZE * SS

PACKS = {
    "obsidian": {
        "bg_top": (18, 26, 44),
        "bg_bottom": (5, 8, 16),
        "shield_top": (28, 63, 110),
        "shield_bottom": (8, 22, 45),
        "rim": (56, 189, 248),
        "accent": (34, 211, 238),
        "keyhole": (234, 248, 255),
    },
    "porcelain": {
        "bg_top": (255, 255, 255),
        "bg_bottom": (226, 232, 240),
        "shield_top": (255, 255, 255),
        "shield_bottom": (203, 213, 225),
        "rim": (30, 64, 175),
        "accent": (37, 99, 235),
        "keyhole": (15, 23, 42),
    },
    "contrast": {
        "bg_top": (12, 12, 12),
        "bg_bottom": (0, 0, 0),
        "shield_top": (250, 250, 250),
        "shield_bottom": (212, 212, 212),
        "rim": (250, 204, 21),
        "accent": (250, 204, 21),
        "keyhole": (10, 10, 10),
    },
    "cyan": {
        "bg_top": (6, 42, 48),
        "bg_bottom": (2, 16, 20),
        "shield_top": (14, 116, 144),
        "shield_bottom": (3, 54, 68),
        "rim": (103, 232, 249),
        "accent": (34, 211, 238),
        "keyhole": (236, 254, 255),
    },
}


def gradient(top: tuple[int, int, int], bottom: tuple[int, int, int], size: int) -> Image.Image:
    image = Image.new("RGB", (1, size))
    pixels = image.load()
    for y in range(size):
        ratio = y / max(1, size - 1)
        pixels[0, y] = tuple(round(top[i] + (bottom[i] - top[i]) * ratio) for i in range(3))
    return image.resize((size, size))


def shield_points(size: int, margin: float = 0.16) -> list[tuple[float, float]]:
    left = size * margin
    right = size * (1 - margin)
    top = size * margin
    bottom = size * (1 - margin * 0.9)
    center = size / 2
    return [
        (center, top),
        (right, top + size * 0.075),
        (right, size * 0.50),
        (center, bottom),
        (left, size * 0.50),
        (left, top + size * 0.075),
    ]


def scale_points(points: list[tuple[float, float]], factor: float) -> list[tuple[float, float]]:
    cx = sum(x for x, _ in points) / len(points)
    cy = sum(y for _, y in points) / len(points)
    return [(cx + (x - cx) * factor, cy + (y - cy) * factor) for x, y in points]


def render(pack: dict) -> Image.Image:
    canvas = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    # Rounded square plate
    plate = gradient(pack["bg_top"], pack["bg_bottom"], W).convert("RGBA")
    mask = Image.new("L", (W, W), 0)
    ImageDraw.Draw(mask).rounded_rectangle(
        (0, 0, W - 1, W - 1), radius=int(W * 0.22), fill=255
    )
    canvas.paste(plate, (0, 0), mask)

    # Soft inner glow
    glow = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse(
        (W * 0.08, W * 0.02, W * 0.92, W * 0.86),
        fill=(*pack["accent"], 40),
    )
    canvas = Image.alpha_composite(canvas, Image.composite(glow, Image.new("RGBA", (W, W)), mask))

    # Shield with rim
    points = shield_points(W)
    ring = Image.new("RGBA", (W, W), (0, 0, 0, 0))
    ImageDraw.Draw(ring).polygon(points, fill=(*pack["rim"], 255))
    inset = scale_points(points, 0.93)
    shield = gradient(pack["shield_top"], pack["shield_bottom"], W).convert("RGBA")
    shield_mask = Image.new("L", (W, W), 0)
    ImageDraw.Draw(shield_mask).polygon(inset, fill=255)
    shield.putalpha(shield_mask)
    canvas = Image.alpha_composite(canvas, ring)
    canvas = Image.alpha_composite(canvas, shield)

    # Keyhole
    detail = ImageDraw.Draw(canvas)
    center = W / 2
    detail.ellipse(
        (center - W * 0.072, W * 0.335, center + W * 0.072, W * 0.479),
        fill=(*pack["keyhole"], 255),
    )
    detail.polygon(
        [
            (center - W * 0.040, W * 0.455),
            (center + W * 0.040, W * 0.455),
            (center + W * 0.014, W * 0.600),
            (center - W * 0.014, W * 0.600),
        ],
        fill=(*pack["keyhole"], 255),
    )

    return canvas.resize((SIZE, SIZE), Image.LANCZOS)


def main() -> None:
    for name, palette in PACKS.items():
        master = render(palette)
        png_path = os.path.join(OUT_DIR, f"icon-{name}.png")
        master.resize((256, 256), Image.LANCZOS).save(png_path, "PNG", optimize=True)
        ico_path = os.path.join(OUT_DIR, f"icon-{name}.ico")
        master.resize((256, 256), Image.LANCZOS).save(
            ico_path,
            sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
        )
        print(f"generated {name}: {png_path}, {ico_path}")


if __name__ == "__main__":
    main()
