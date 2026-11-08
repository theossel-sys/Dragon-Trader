#!/usr/bin/env python3
"""gen_index.py <retrostone dir>: writes <dir>/index.html, the menu of every game in tools/games.txt."""
import html
import os
import sys

GROUPS = [
    ("Ein Knopf", "Tippen oder halten, irgendwo auf dem Bildschirm",
     "leadysquid pancaketower frogreach hedgehoghills mouseespresso unicornhop blueberrytumble snailswitch"),
    ("Links / rechts", "Linke und rechte Bildschirmhälfte",
     "beaverrush motharound penguinslalom otterrapids crabcoconut biscuitbandit hamsterhavoc molemarbles"),
    ("Echte Touch-Steuerung", "Tippen auf Stellen, ziehen, wischen",
     "spiderswing pogomamie lemurleap duckparade nuttybranch pricklepatch raccoonrecycler radishrascals cosmocorgi "
     "geckogolf fishyfeast caterpillarcrawl jellyjam kittykibble llamadrama gopherdig snowballsiege"),
]

PAGE = """<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="RetroStone">
<title>RetroStone Web</title>
<style>
  :root { --bg: #102040; --card: #1c3260; --fg: #f4ecd8; --muted: #b9c3d9; --accent: #ffd34d; }
  body { margin: 0; min-height: 100vh; background: var(--bg); color: var(--fg); font: 16px/1.45 system-ui, sans-serif;
         padding: calc(env(safe-area-inset-top) + 16px) calc(env(safe-area-inset-right) + 16px)
                  calc(env(safe-area-inset-bottom) + 16px) calc(env(safe-area-inset-left) + 16px); box-sizing: border-box; }
  h1 { margin: 0 0 4px; font-size: 24px; color: var(--accent); }
  h2 { margin: 28px 0 2px; font-size: 19px; }
  h2 + p { margin: 0 0 12px; font-size: 14px; }
  p { margin: 0 0 16px; color: var(--muted); max-width: 64ch; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 14px; }
  a.card { display: block; background: var(--card); border-radius: 14px; overflow: hidden; color: inherit; text-decoration: none; }
  a.card:active { transform: scale(.98); }
  a.card img { display: block; width: 100%; aspect-ratio: 4 / 3; object-fit: cover; image-rendering: pixelated; }
  a.card div { padding: 8px 12px 12px; }
  a.card b { display: block; font-size: 17px; }
  a.card span { display: block; font-size: 14px; color: var(--fg); opacity: .9; }
  a.card small { display: block; font-size: 12.5px; color: var(--muted); margin-top: 4px; }
  footer { margin-top: 28px; font-size: 13px; color: var(--muted); max-width: 72ch; }
  footer a { color: var(--accent); }
</style>
</head>
<body>
<h1>RetroStone VC – Web</h1>
<p>__COUNT__ Spiele für iPhone und iPad: Gerät quer halten. Ton gibt es nach dem ersten Antippen; dafür den
   Stummschalter des iPhones ausschalten. Tipp: in Safari „Teilen → Zum Home-Bildschirm“, dann laufen sie im Vollbild.
   Mit „II“ pausierst du, mit „←“ geht es zurück hierher.</p>
__GROUPS__
<footer>
  Spiele von <a href="https://github.com/PaddleStroke/RetroStoneVC">RetroStone VC</a>, © 2026 Pierre-Louis Boyer (8BCraft).
  Code: MIT. Grafik, Musik und Levels: <a href="https://creativecommons.org/licenses/by-nc-sa/4.0/">CC BY-NC-SA 4.0</a>,
  nur nicht-kommerziell. Unveränderte Spiele, nur für den Browser übersetzt (Emscripten); Web-Frontend: <code>tools/</code>.
  Private Testseite, nicht offiziell.
</footer>
</body>
</html>
"""


def main():
    root = sys.argv[1]
    games = {}
    for line in open(os.path.join(root, "tools", "games.txt"), encoding="utf-8"):
        if line.strip() and not line.startswith("#"):
            gid, name, desc, hint = line.rstrip("\n").split("|")
            games[gid] = (name, desc, hint)
    out, seen = [], set()
    for title, sub, ids in GROUPS:
        cards = []
        for gid in ids.split():
            if gid not in games or not os.path.isdir(os.path.join(root, gid)):
                continue
            seen.add(gid)
            name, desc, hint = (html.escape(s) for s in games[gid])
            cards.append(f'  <a class="card" href="{gid}/"><img src="{gid}/cover.png" alt="" loading="lazy">'
                         f'<div><b>{name}</b><span>{desc}</span><small>{hint}</small></div></a>')
        if cards:
            out.append(f'<h2>{title}</h2>\n<p>{sub}</p>\n<div class="grid">\n' + "\n".join(cards) + "\n</div>")
    missing = set(games) - seen
    if missing:
        sys.exit("not in a group: " + " ".join(sorted(missing)))
    page = PAGE.replace("__COUNT__", str(len(seen))).replace("__GROUPS__", "\n".join(out))
    open(os.path.join(root, "index.html"), "w", encoding="utf-8").write(page)


if __name__ == "__main__":
    main()
