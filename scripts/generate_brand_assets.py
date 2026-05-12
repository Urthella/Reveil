"""Generate Reveil app icon, adaptive icon, splash, and favicon PNGs.

Produces both a vector source (mobile/assets/reveil-mark.svg) and rasterized
PNGs at the sizes Expo expects. Run:

    python scripts/generate_brand_assets.py

Replace with proper Pencil exports for production-grade artwork.
"""
from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "mobile" / "assets"

# Brand palette (matches mobile/src/theme/index.ts).
PRIMARY = (108, 99, 255)        # #6C63FF
PRIMARY_DIM = (74, 67, 214)     # #4A43D6
ACCENT = (3, 218, 198)          # #03DAC6
BG_DARK = (15, 15, 20)          # #0F0F14
SURFACE = (26, 26, 34)          # #1A1A22
WHITE = (255, 255, 255)


def _radial_gradient(size: int, inner: tuple[int, int, int], outer: tuple[int, int, int]) -> Image.Image:
    """Radial-style gradient via per-pixel interpolation. Simple, no NumPy."""
    img = Image.new("RGB", (size, size), inner)
    draw = ImageDraw.Draw(img)
    cx, cy = size / 2, size / 2
    max_d = ((size / 2) ** 2 + (size / 2) ** 2) ** 0.5
    # Ring-by-ring fill — coarse stride keeps it fast at 1024×1024.
    stride = max(1, size // 256)
    for r in range(int(max_d), 0, -stride):
        t = r / max_d
        rr = int(inner[0] * (1 - t) + outer[0] * t)
        gg = int(inner[1] * (1 - t) + outer[1] * t)
        bb = int(inner[2] * (1 - t) + outer[2] * t)
        draw.ellipse([(cx - r, cy - r), (cx + r, cy + r)], fill=(rr, gg, bb))
    return img


def _load_font(size_px: int, bold: bool = True) -> ImageFont.FreeTypeFont:
    candidates = [
        "C:/Windows/Fonts/seguibl.ttf",
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    ]
    for path in candidates:
        if Path(path).exists():
            try:
                return ImageFont.truetype(path, size_px)
            except OSError:
                continue
    return ImageFont.load_default()


def _draw_dawn_glyph(canvas: Image.Image, cx: int, cy: int, scale: float, color=WHITE) -> None:
    """Three concentric dawn arcs + horizon + sun core."""
    # Glow layer for depth
    glow = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    glow_radius = int(280 * scale)
    gdraw.ellipse(
        [(cx - glow_radius, cy - glow_radius // 2 + int(70 * scale)),
         (cx + glow_radius, cy + glow_radius // 2 + int(70 * scale))],
        fill=(*color, 70),
    )
    glow = glow.filter(ImageFilter.GaussianBlur(radius=int(36 * scale)))
    canvas.alpha_composite(glow)

    draw = ImageDraw.Draw(canvas)
    base_y = cy + int(70 * scale)
    horizon_w = int(440 * scale)
    horizon_h = int(22 * scale)
    draw.rounded_rectangle(
        [(cx - horizon_w // 2, base_y - horizon_h // 2),
         (cx + horizon_w // 2, base_y + horizon_h // 2)],
        radius=int(11 * scale),
        fill=(*color, 255),
    )

    arc_specs = [
        (int(330 * scale), int(34 * scale)),
        (int(240 * scale), int(28 * scale)),
        (int(150 * scale), int(24 * scale)),
    ]
    for radius, width in arc_specs:
        bbox = [(cx - radius, base_y - radius), (cx + radius, base_y + radius)]
        draw.arc(bbox, start=200, end=340, fill=(*color, 255), width=width)

    core_r = int(60 * scale)
    draw.ellipse(
        [(cx - core_r, base_y - core_r), (cx + core_r, base_y + core_r)],
        fill=(*color, 255),
    )


def _ensure_rgba(img: Image.Image) -> Image.Image:
    return img.convert("RGBA") if img.mode != "RGBA" else img


def make_app_icon(size: int = 1024) -> Image.Image:
    base = _radial_gradient(size, PRIMARY, PRIMARY_DIM)
    base = _ensure_rgba(base)
    _draw_dawn_glyph(base, size // 2, size // 2, scale=size / 1024)
    return base.convert("RGB")


def make_adaptive_foreground(size: int = 1024) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    _draw_dawn_glyph(img, size // 2, size // 2, scale=0.62 * size / 1024)
    return img


def make_splash(size: int = 1024) -> Image.Image:
    base = Image.new("RGB", (size, size), BG_DARK)
    base = _ensure_rgba(base)
    _draw_dawn_glyph(base, size // 2, int(size * 0.45), scale=0.55 * size / 1024, color=WHITE)
    draw = ImageDraw.Draw(base)
    font = _load_font(int(82 * size / 1024))
    text = "Reveil"
    bbox = draw.textbbox((0, 0), text, font=font)
    w = bbox[2] - bbox[0]
    draw.text(
        (size / 2 - w / 2 - bbox[0], size * 0.74),
        text,
        font=font,
        fill=PRIMARY,
    )
    sub_font = _load_font(int(28 * size / 1024), bold=False)
    sub = "Wake up to your habits"
    sb = draw.textbbox((0, 0), sub, font=sub_font)
    sw = sb[2] - sb[0]
    draw.text(
        (size / 2 - sw / 2 - sb[0], size * 0.83),
        sub,
        font=sub_font,
        fill=(176, 176, 192),
    )
    return base.convert("RGB")


def make_favicon(size: int = 256) -> Image.Image:
    return make_app_icon(size)


SVG_TEMPLATE = """<?xml version='1.0' encoding='UTF-8'?>
<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1024 1024' width='1024' height='1024'>
  <defs>
    <radialGradient id='bg' cx='50%' cy='45%' r='65%'>
      <stop offset='0%' stop-color='#7C73FF'/>
      <stop offset='100%' stop-color='#4A43D6'/>
    </radialGradient>
    <filter id='glow' x='-30%' y='-30%' width='160%' height='160%'>
      <feGaussianBlur stdDeviation='32'/>
    </filter>
  </defs>
  <rect width='1024' height='1024' rx='220' ry='220' fill='url(#bg)'/>
  <g transform='translate(512, 582)' fill='none' stroke='white' stroke-linecap='round'>
    <ellipse cx='0' cy='0' rx='280' ry='140' fill='white' opacity='0.18' filter='url(#glow)' stroke='none'/>
    <rect x='-220' y='-11' width='440' height='22' rx='11' fill='white' stroke='none'/>
    <path d='M -330 0 A 330 330 0 0 1 330 0' stroke-width='34'/>
    <path d='M -240 0 A 240 240 0 0 1 240 0' stroke-width='28'/>
    <path d='M -150 0 A 150 150 0 0 1 150 0' stroke-width='24'/>
    <circle cx='0' cy='0' r='60' fill='white' stroke='none'/>
  </g>
</svg>
"""


def write_svg(path: Path) -> None:
    path.write_text(SVG_TEMPLATE, encoding="utf-8")


def main() -> None:
    ASSETS.mkdir(parents=True, exist_ok=True)
    write_svg(ASSETS / "reveil-mark.svg")
    print(f"  wrote {(ASSETS / 'reveil-mark.svg').relative_to(ROOT)}")
    targets = {
        "icon.png": make_app_icon(1024),
        "adaptive-icon.png": make_adaptive_foreground(1024),
        "splash-icon.png": make_splash(1024),
        "favicon.png": make_favicon(256),
    }
    for name, img in targets.items():
        out = ASSETS / name
        img.save(out, "PNG")
        print(f"  wrote {out.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
