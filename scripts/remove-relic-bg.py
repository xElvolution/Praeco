#!/usr/bin/env python3
"""Remove solid edge-connected backgrounds from theme relic PNGs."""
from __future__ import annotations

from array import array
from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent / "public" / "assets" / "relics"
THEMES = ("day", "papyrus", "night")


def remove_background(path: Path) -> None:
    im = Image.open(path).convert("RGBA")
    w, h = im.size
    raw = array("B", im.tobytes())
    n = w * h

    def pixel(i: int) -> tuple[int, int, int, int]:
        j = i * 4
        return raw[j], raw[j + 1], raw[j + 2], raw[j + 3]

    def set_alpha(i: int, a: int) -> None:
        raw[i * 4 + 3] = a

    corners = [0, w - 1, (h - 1) * w, (h - 1) * w + (w - 1)]
    cr = sum(pixel(i)[0] for i in corners) // 4
    cg = sum(pixel(i)[1] for i in corners) // 4
    cb = sum(pixel(i)[2] for i in corners) // 4
    corner_light = (cr + cg + cb) / 3
    dark = corner_light < 140

    def is_bg(i: int) -> bool:
        r, g, b, a = pixel(i)
        if a < 8:
            return True
        dist = ((r - cr) ** 2 + (g - cg) ** 2 + (b - cb) ** 2) ** 0.5
        light = (r + g + b) / 3
        sat = max(r, g, b) - min(r, g, b)
        if dark:
            return dist < 55 and light < 95 and sat < 72
        return dist < 32 and light > 215 and sat < 42

    visited = bytearray(n)
    q: deque[int] = deque()

    def seed(i: int) -> None:
        if 0 <= i < n and not visited[i] and is_bg(i):
            visited[i] = 1
            q.append(i)

    for x in range(w):
        seed(x)
        seed((h - 1) * w + x)
    for y in range(h):
        seed(y * w)
        seed(y * w + (w - 1))

    while q:
        i = q.popleft()
        x = i % w
        y = i // w
        for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1)):
            if 0 <= nx < w and 0 <= ny < h:
                ni = ny * w + nx
                if not visited[ni] and is_bg(ni):
                    visited[ni] = 1
                    q.append(ni)

    cleared = 0
    for i in range(n):
        if visited[i]:
            set_alpha(i, 0)
            cleared += 1

    for y in range(1, h - 1):
        for x in range(1, w - 1):
            i = y * w + x
            if visited[i]:
                continue
            r, g, b, a = pixel(i)
            if a == 0:
                continue
            if not is_bg(i):
                continue
            if any(visited[ny * w + nx] for nx, ny in ((x - 1, y), (x + 1, y), (x, y - 1), (x, y + 1))):
                set_alpha(i, min(a, 96))

    im = Image.frombytes("RGBA", (w, h), raw.tobytes())
    im.save(path, optimize=True)
    print(
        f"{path.relative_to(ROOT.parent.parent.parent)} ({'dark' if dark else 'light'}): "
        f"cleared {cleared}/{n} ({100 * cleared / n:.1f}%)"
    )


def main() -> None:
    for theme in THEMES:
        folder = ROOT / theme
        if not folder.is_dir():
            continue
        for path in sorted(folder.glob("relic-*.png")):
            remove_background(path)


if __name__ == "__main__":
    main()
