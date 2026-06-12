# -*- coding: utf-8 -*-
"""Baut Aschenfurt-Handy.html: das komplette Spiel in einer einzigen Datei
(CSS + alle Skripte inline, Icon als Data-URI, kein Service Worker nötig)."""
import base64
import io
import os
import re

ROOT = os.path.dirname(os.path.abspath(__file__))

def lies(pfad):
    with io.open(os.path.join(ROOT, pfad), "r", encoding="utf-8") as f:
        return f.read()

html = lies("index.html")
css = lies("css/style.css")

skripte = [
    "js/util.js", "js/data_world.js", "js/data_npcs.js",
    "js/data_fall1.js", "js/data_fall2.js", "js/data_fall3.js",
    "js/data_finale.js", "js/engine.js", "js/ui.js", "js/main.js",
]
js_inline = "\n".join("/* ===== %s ===== */\n%s" % (p, lies(p)) for p in skripte)

with open(os.path.join(ROOT, "icon-192.png"), "rb") as f:
    icon_b64 = base64.b64encode(f.read()).decode("ascii")

# CSS inline
html = re.sub(r'<link rel="stylesheet"[^>]*>', "<style>\n" + css + "\n</style>", html)
# Manifest/Icon-Links raus, Data-URI-Favicon rein
html = re.sub(r'<link rel="manifest"[^>]*>\s*', "", html)
html = re.sub(r'<link rel="icon"[^>]*>', '<link rel="icon" href="data:image/png;base64,' + icon_b64 + '">', html)
html = re.sub(r'<link rel="apple-touch-icon"[^>]*>', '<link rel="apple-touch-icon" href="data:image/png;base64,' + icon_b64 + '">', html)
# Alle Skript-Tags durch ein Inline-Skript ersetzen (Service-Worker-Block entfällt mit)
html = re.sub(r'<script src="[^"]*"></script>\s*', "", html)
html = re.sub(r'<script>\s*// Offline-Fähigkeit.*?</script>\s*', "", html, flags=re.S)
html = html.replace("</body>", "<script>\n" + js_inline + "\n</script>\n</body>")

ziel = os.path.join(ROOT, "Aschenfurt-Handy.html")
with io.open(ziel, "w", encoding="utf-8") as f:
    f.write(html)
print("OK: %s (%.0f KB)" % (ziel, os.path.getsize(ziel) / 1024.0))
