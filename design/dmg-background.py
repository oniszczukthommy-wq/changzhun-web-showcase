"""Draws the background of OnKey's DMG window: a wave flowing into an arrow from the app to Applications, and what to do.

    python3 design/dmg-background.py      (needs Pillow; writes design/dmg-background.png and @2x)

scripts/pack-dmg.sh lays the window out to match: 660 x 400 points, OnKey's icon centred at (170, 190),
Applications at (490, 190), 128-point icons. Change one, change both.
"""
import math
import os
from PIL import Image, ImageDraw, ImageFont

W, H = 660, 400
APP_X, APPS_X, ICON_Y = 170, 490, 190
HERE = os.path.dirname(os.path.abspath(__file__))
SANS = "/System/Library/Fonts/SFNS.ttf"

BG_TOP, BG_BOTTOM = (247, 246, 251), (233, 230, 245)   # the app's light lavender, a gentle fall
INK, MUTED, ACCENT = (88, 86, 100), (102, 100, 124), (91, 75, 214)


def font(size, weight):
    f = ImageFont.truetype(SANS, size)
    try:
        f.set_variation_by_name(weight)
    except Exception:
        pass
    return f


def draw(scale):
    w, h = W * scale, H * scale
    img = Image.new("RGB", (w, h))
    px = img.load()
    for y in range(h):
        t = y / (h - 1)
        c = tuple(round(a + (b - a) * t) for a, b in zip(BG_TOP, BG_BOTTOM))
        for x in range(w):
            px[x, y] = c
    g = ImageDraw.Draw(img)
    s = lambda v: round(v * scale)

    # title and hint
    title = "Drag OnKey to Applications"
    f = font(s(22), "Semibold")
    tw = g.textlength(title, font=f)
    g.text(((w - tw) / 2, s(40)), title, font=f, fill=INK)
    hint = "Then open OnKey from your Applications folder."
    f2 = font(s(13), "Regular")
    hw = g.textlength(hint, font=f2)
    g.text(((w - hw) / 2, s(338)), hint, font=f2, fill=MUTED)

    # a wave (like the one in OnKey's icon) settling flat into an arrowhead, between the two icons (icons are 128
    # pt wide: leave room either side)
    x0, x1, y = APP_X + 88, APPS_X - 88, ICON_Y
    head = 18
    end = x1 - head + 2
    pts = []
    for i in range(401):
        u = i / 400
        amp = 11 * math.sin(math.pi * u / 0.85) ** 0.8 if u < 0.85 else 0.0
        pts.append((s(x0 + (end - x0) * u), s(y + amp * math.sin(u * 2 * math.pi * 3.5))))
    g.line(pts, fill=ACCENT, width=s(5), joint="curve")
    r = s(5) / 2
    g.ellipse([pts[0][0] - r, pts[0][1] - r, pts[0][0] + r, pts[0][1] + r], fill=ACCENT)
    X1, Y, HD = s(x1), s(y), s(head)
    g.polygon([(X1, Y), (X1 - HD, Y - HD * 0.8), (X1 - HD, Y + HD * 0.8)], fill=ACCENT)
    return img


if __name__ == "__main__":
    draw(1).save(os.path.join(HERE, "dmg-background.png"), dpi=(72, 72))
    draw(2).save(os.path.join(HERE, "dmg-background@2x.png"), dpi=(144, 144))
    print("wrote design/dmg-background.png and @2x")
