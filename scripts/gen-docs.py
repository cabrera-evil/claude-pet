#!/usr/bin/env python3
"""Regenerate docs/pet.gif, docs/crew.gif and docs/demo.gif from the sprite code (needs Node 22.6+ and Pillow)."""

import json
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
DOCS = ROOT / "docs"
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
BACKGROUND = (30, 30, 30)
LABEL = (0xE5, 0xE7, 0xEB)
FRAME_MS = 350
PALETTE_COLORS = 48
DEMO_SIZE = (642, 108)
DEMO_SCALE = 6


def rgb(color: int) -> tuple[int, int, int]:
    return (color >> 16) & 255, (color >> 8) & 255, color & 255


def blit(draw: ImageDraw.ImageDraw, pixels: list[list[int]], x0: int, y0: int, scale: int) -> None:
    for y, row in enumerate(pixels):
        for x, color in enumerate(row):
            if color != -1:
                left, top = x0 + x * scale, y0 + y * scale
                draw.rectangle([left, top, left + scale - 1, top + scale - 1], fill=rgb(color))


def sheet(items, columns, cell, origin, scale, label_y, font) -> Image.Image:
    rows = -(-len(items) // columns)
    image = Image.new("RGB", (cell[0] * columns, cell[1] * rows), BACKGROUND)
    draw = ImageDraw.Draw(image)
    for i, (name, pixels) in enumerate(items):
        left, top = (i % columns) * cell[0], (i // columns) * cell[1]
        blit(draw, pixels, left + origin[0], top + origin[1], scale)
        draw.text((left + cell[0] / 2, top + label_y), name, font=font, fill=LABEL, anchor="mm")
    return image


def demo_frame(frame) -> Image.Image:
    image = Image.new("RGB", DEMO_SIZE, BACKGROUND)
    draw = ImageDraw.Draw(image)
    blit(draw, frame["pet"], 6, 12, DEMO_SCALE)
    for i, mini in enumerate(frame["minis"]):
        blit(draw, mini, 180 + i * 114, 18, DEMO_SCALE)
    return image


def save(frames: list[Image.Image], path: Path) -> None:
    paletted = [frame.quantize(PALETTE_COLORS) for frame in frames]
    paletted[0].save(path, save_all=True, append_images=paletted[1:], duration=FRAME_MS, loop=0, optimize=True)


def main() -> None:
    frames = json.loads(subprocess.run(
        ["node", "--no-warnings", str(ROOT / "scripts" / "docs-frames.mjs")],
        check=True, capture_output=True, text=True,
    ).stdout)
    font = ImageFont.truetype(FONT, 15)
    save([sheet(f, 4, (186, 130), (12, 10), 6, 107, font) for f in frames["pet"]], DOCS / "pet.gif")
    save([sheet(f, 5, (140, 125), (7, 10), 7, 100, font) for f in frames["crew"]], DOCS / "crew.gif")
    save([demo_frame(f) for f in frames["demo"]], DOCS / "demo.gif")


if __name__ == "__main__":
    main()
