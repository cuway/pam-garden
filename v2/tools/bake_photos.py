from pathlib import Path
import numpy as np
from PIL import Image, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "storage" / "photos"
OUT = ROOT / "frontend" / "assets" / "img" / "nb"
PICKS = [70, 62, 71, 59, 63, 64, 72, 31, 24, 23, 33, 36, 68, 16, 22, 25, 19, 60, 8, 12, 28, 58, 73, 66, 61, 46, 45, 41]
WIDTHS = (640, 1080)
BACKDROP = 58
LUMA = np.array([0.299, 0.587, 0.114], np.float32)
SHADOW_TINT = np.array([-0.012, 0.022, 0.016], np.float32)
LIGHT_TINT = np.array([0.026, 0.012, -0.012], np.float32)


def rgb_to_hsv(a):
    mx, mn = a.max(-1), a.min(-1)
    d = mx - mn
    h = np.zeros_like(mx)
    safe = np.where(d == 0, 1, d)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    h = np.where(mx == r, ((g - b) / safe) % 6, np.where(mx == g, (b - r) / safe + 2, (r - g) / safe + 4)) / 6
    h = np.where(d == 0, 0, h)
    s = np.where(mx == 0, 0, d / np.where(mx == 0, 1, mx))
    return h % 1, s, mx


def hsv_to_rgb(h, s, v):
    i = np.floor(h * 6).astype(int) % 6
    f = h * 6 - np.floor(h * 6)
    p, q, t = v * (1 - s), v * (1 - f * s), v * (1 - (1 - f) * s)
    choices = [(v, t, p), (q, v, p), (p, v, t), (p, q, v), (t, p, v), (v, p, q)]
    out = np.zeros(h.shape + (3,), np.float32)
    for k, (r, g, b) in enumerate(choices):
        m = i == k
        out[m] = np.stack([r[m], g[m], b[m]], -1)
    return out


def smooth(x, a, b):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def grade(a):
    mean = a.reshape(-1, 3).mean(0)
    a = np.clip(a * np.clip(mean.mean() / mean, 0.94, 1.06), 0, 1)
    lum = a @ LUMA
    a = np.clip(a * np.clip(0.45 / max(float(np.median(lum)), 0.05), 0.85, 1.3), 0, 1)
    lum = (a @ LUMA)[..., None]
    a = a + 0.045 * (1 - lum * 2.2).clip(0, 1) ** 2 - 0.075 * ((lum - 0.62) / 0.38).clip(0, 1) ** 2
    a = np.clip(a, 0, 1)
    a = a + 0.14 * (a * a * (3 - 2 * a) - a)
    h, s, v = rgb_to_hsv(np.clip(a, 0, 1))
    skin = smooth(h, 0.0, 0.03) * (1 - smooth(h, 0.09, 0.13)) + smooth(h, 0.95, 1.0)
    s = np.clip(s * (1 + 0.18 * (1 - s) * (1 - 0.7 * np.clip(skin, 0, 1))), 0, 1)
    green = smooth(h, 0.17, 0.24) * (1 - smooth(h, 0.42, 0.5))
    h = (h + 0.012 * green) % 1
    s = np.clip(s * (1 + 0.04 * green), 0, 1)
    v = np.clip(v * (1 - 0.06 * green), 0, 1)
    a = hsv_to_rgb(h, s, v)
    lum = (a @ LUMA)[..., None]
    a = a + (1 - lum) ** 3 * SHADOW_TINT + lum**3 * LIGHT_TINT
    return np.clip(a, 0, 1)


def crop_34(img):
    w, h = img.size
    nh = round(w * 4 / 3)
    if nh <= h:
        top = (h - nh) // 3
        return img.crop((0, top, w, top + nh))
    nw = round(h * 3 / 4)
    left = (w - nw) // 2
    return img.crop((left, 0, left + nw, h))


def render(img, width):
    img = img.resize((width, round(width * 4 / 3)), Image.LANCZOS)
    img = Image.fromarray((grade(np.asarray(img, np.float32) / 255) * 255 + 0.5).astype(np.uint8), "RGB")
    return img.filter(ImageFilter.UnsharpMask(radius=width / 45, percent=26, threshold=2))


if __name__ == "__main__":
    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob("*.webp"):
        old.unlink()
    photos = sorted(p for p in SRC.iterdir() if p.suffix.lower() in (".jpg", ".jpeg", ".png", ".webp"))
    for n in PICKS:
        img = crop_34(ImageOps.exif_transpose(Image.open(photos[n - 1])).convert("RGB"))
        for w in WIDTHS:
            render(img, w).save(OUT / f"{n}-{w}.webp", "WEBP", quality=80, method=6)
    bg = ImageOps.exif_transpose(Image.open(photos[BACKDROP - 1])).convert("RGB")
    bg = ImageOps.fit(bg, (1200, 1600), Image.LANCZOS).filter(ImageFilter.GaussianBlur(10))
    a = grade(np.asarray(bg, np.float32) / 255)
    lum = (a @ LUMA)[..., None]
    a = np.clip(lum * np.array([0.82, 1.0, 0.86], np.float32) * 0.9 + a * 0.25, 0, 1)
    Image.fromarray((a * 255 + 0.5).astype(np.uint8), "RGB").save(OUT.parent / "canopy.webp", "WEBP", quality=70, method=6)
    print(len(PICKS), "ok")
