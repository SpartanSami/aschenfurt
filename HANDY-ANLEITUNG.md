# 📱 Aschenfurt auf dem Handy spielen – kostenlos, in 2 Minuten

## Weg 1: Die Eine-Datei-Version (am schnellsten, kein Account, kein Internet nötig)

Im Spielordner liegt **`Aschenfurt-Handy.html`** – das komplette Spiel in einer einzigen Datei (ca. 0,5 MB).

**So kommt sie aufs Handy (eine Möglichkeit wählen):**

1. **Per WhatsApp/Telegram:** Schick dir die Datei selbst (z. B. in „Nachricht an mich“), am Handy antippen → „Öffnen mit Chrome“.
2. **Per E-Mail:** Datei an dich selbst mailen, Anhang am Handy herunterladen und mit Chrome öffnen.
3. **Per USB-Kabel:** Datei in den Handy-Ordner „Download“ kopieren, dort mit der Dateien-App antippen → Chrome.
4. **Per WLAN direkt vom PC** (solange der Test-Server hier läuft und Handy + PC im selben WLAN sind):
   Am Handy im Browser öffnen: **`http://192.168.0.236:8741/Aschenfurt-Handy.html`** → Menü → „Seite herunterladen“ oder einfach direkt spielen.

> 💡 **Wichtig bei der Datei-Version:** Spielstände hängen am Browser. Nutze ab und zu **Menü ☰ → Speichern & Laden → Exportieren** und sichere den Text (z. B. in deinen Notizen) – dann kann dir kein Handywechsel und kein Browser-Update den Fortschritt nehmen.

---

## Weg 2: Als „echte App“ installieren (einmalig 5 Minuten, dauerhaft am besten)

Damit das Spiel mit eigenem Icon auf deinem Startbildschirm liegt und offline läuft wie eine App, muss es einmal kostenlos online gestellt werden. Das geht gratis über **GitHub Pages**:

1. Kostenloses Konto auf **github.com** anlegen (falls noch nicht vorhanden).
2. Oben rechts **„+“ → „New repository“** → Name z. B. `aschenfurt` → Public → „Create repository“.
3. Auf der Repo-Seite: **„uploading an existing file“** anklicken und **alle Dateien und Ordner** aus dem Spielordner hineinziehen (`index.html`, `manifest.webmanifest`, `sw.js`, `icon-192.png`, `icon-512.png` und die Ordner `css/` und `js/`). Unten „Commit changes“.
   *(Hinweis: Ordner lassen sich am einfachsten per Drag & Drop aus dem Explorer ins Browserfenster ziehen.)*
4. Im Repo: **Settings → Pages** → unter „Branch“ `main` und `/ (root)` wählen → „Save“.
5. Nach 1–2 Minuten ist dein Spiel erreichbar unter:
   `https://DEINNAME.github.io/aschenfurt/`
6. Diese Adresse **am Handy in Chrome öffnen** → Menü (⋮) → **„Zum Startbildschirm hinzufügen“** / „App installieren“.

Fertig: Eigenes Icon 🌒, Vollbild, läuft danach komplett **offline**, Spielstände bleiben dauerhaft erhalten – und es bleibt zu 100 % kostenlos und werbefrei, weil es dein eigenes Spiel auf deinem eigenen (Gratis-)Webspace ist.

> Updates später: Einfach geänderte Dateien im GitHub-Repo erneut hochladen – die App aktualisiert sich beim nächsten Öffnen selbst.
