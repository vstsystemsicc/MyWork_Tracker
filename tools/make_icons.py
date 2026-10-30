"""One-off generator for the MyWork Tracker app icons (run from project root)."""
import numpy as np
from PIL import Image, ImageDraw

STOPS = [(0.0, (167, 139, 250)), (0.55, (139, 92, 246)), (1.0, (91, 33, 182))]


def gradient(size):
    ys, xs = np.mgrid[0:size, 0:size].astype(np.float32) / (size - 1)
    t = np.clip((xs * 0.55 + ys * 0.45), 0, 1)
    rgb = np.zeros((size, size, 3), dtype=np.float32)
    for i in range(len(STOPS) - 1):
        a, ca = STOPS[i]
        b, cb = STOPS[i + 1]
        mask = (t >= a) & (t <= b)
        f = ((t[mask] - a) / (b - a))[..., None]
        rgb[mask] = np.array(ca, dtype=np.float32) * (1 - f) + np.array(cb, dtype=np.float32) * f
    return rgb.astype(np.uint8)


def rounded_mask(size, radius):
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, size - 1, size - 1], radius=radius, fill=255)
    return mask


def draw_check(img, size, scale=1.0):
    """Draw the check mark, sized relative to the canvas centre."""
    d = ImageDraw.Draw(img)
    s = size / 512.0 * scale
    cx, cy = size / 2, size / 2
    pts = [
        (cx - 118 * s, cy + 12 * s),
        (cx - 40 * s, cy + 94 * s),
        (cx + 122 * s, cy - 88 * s),
    ]
    width = max(2, int(44 * s))
    d.line(pts, fill=(255, 255, 255, 255), width=width, joint="curve")
    r = width / 2
    for x, y in pts:
        d.ellipse([x - r, y - r, x + r, y + r], fill=(255, 255, 255, 255))


def make(size, path, radius_ratio=0.226, maskable=False):
    base = Image.fromarray(gradient(size), "RGB").convert("RGBA")
    if maskable:
        icon = base  # full bleed; Android applies its own mask
        draw_check(icon, size, scale=0.86)
    else:
        icon = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        icon.paste(base, (0, 0), rounded_mask(size, int(size * radius_ratio)))
        draw_check(icon, size)
    icon.save(path, "PNG", optimize=True)
    print("wrote", path)


if __name__ == "__main__":
    make(192, "icons/icon-192.png")
    make(512, "icons/icon-512.png")
    make(512, "icons/icon-maskable-512.png", maskable=True)
