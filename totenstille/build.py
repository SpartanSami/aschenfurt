# -*- coding: utf-8 -*-
"""Baut TOTENSTILLE aus totenstille/src/ zu einer einzigen Datei zusammen.

  Totenstille.html            -> komplette Seite, läuft per Doppelklick und auf dem Handy
  (optional) zweites Argument -> Fragment ohne <html>/<head>/<body> für die Veröffentlichung als Artifact
"""
import io
import os
import sys

HIER = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HIER, "src")
ROOT = os.path.dirname(HIER)

FONTS = ('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?'
         'family=Barlow+Condensed:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500'
         '&family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,600;1,7..72,400&display=swap">')


def lies(name):
    with io.open(os.path.join(SRC, name), "r", encoding="utf-8") as f:
        return f.read()


css = lies("style.css")
body = lies("body.html")
js = "\n".join("/* ===== %s ===== */\n%s" % (n, lies(n))
               for n in ["kern.js", "story1.js", "story2.js", "story3.js", "story4.js", "ui.js"])
assert "</script" not in js.lower()

kern = ("<style>\n" + css + "\n</style>\n" + body + "\n<script>\n" + js + "\n</script>\n")

seite = ("<!DOCTYPE html>\n<html lang=\"de\">\n<head>\n<meta charset=\"UTF-8\">\n"
         "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1, viewport-fit=cover\">\n"
         "<meta name=\"theme-color\" content=\"#0b0f18\">\n"
         "<title>Totenstille</title>\n" + FONTS + "\n"
         "<style>:root{padding:env(safe-area-inset-top,0px) 0 env(safe-area-inset-bottom,0px)}</style>\n"
         "</head>\n<body>\n" + kern + "</body>\n</html>\n")

ziel = os.path.join(ROOT, "Totenstille.html")
with io.open(ziel, "w", encoding="utf-8") as f:
    f.write(seite)
print("OK: %s (%.0f KB)" % (ziel, os.path.getsize(ziel) / 1024.0))

if len(sys.argv) > 1:
    fragment = ("<title>Totenstille</title>\n"
                "<meta name=\"claude:viewport-fit-sides\" content=\"cover\">\n" + FONTS + "\n" + kern)
    with io.open(sys.argv[1], "w", encoding="utf-8") as f:
        f.write(fragment)
    print("OK: %s (%.0f KB)" % (sys.argv[1], os.path.getsize(sys.argv[1]) / 1024.0))
