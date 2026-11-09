# NO WAY OUT

**First-Person-Survival-Horror.** Du kannst nicht kämpfen. Du kannst nur überleben.

Sami erwacht ohne Erinnerung in einem Krankenhaus. In seiner Akte steht kein Name, nur **„Proband 017“**. Ein Unbekannter ruft ihn an und kennt den Weg nach draußen. Darunter liegt ein Forschungsinstitut, dessen Experiment **PROJECT EVE** die Stadt in eine Quarantänezone verwandelt hat. Bis 06:00 Uhr bleibt Zeit, um 06:00 Uhr wird der Sektor „sterilisiert“.

---

## ▶️ Spielen

| Variante | So geht's |
|---|---|
| **Einzeldatei** | `NoWayOut.html` per Doppelklick öffnen. Alles ist enthalten, inklusive Sprachaufnahmen, und läuft offline. |
| **Projektordner** | `index.html` öffnen (lädt `dist/game.js`). Über einen lokalen Webserver (`npx http-server .`) werden die Sprachaufnahmen aus `assets/audio/` geladen. |
| **Online** | Den Ordner zum Beispiel über GitHub Pages veröffentlichen und `…/no-way-out/` aufrufen. |

**iPad und Tablets:** Das Spiel erkennt Touch-Geräte und blendet eine eigene Steuerung ein:
- **Linke Bildschirmhälfte:** Stick zum Bewegen. Ganz nach außen geschoben wird gerannt.
- **Rechte Hälfte:** Wischen zum Umsehen.
- **Knöpfe rechts unten:** Benutzen, Klettern, Ducken, Werfen, Heilen, Lampe und Handy.
- **Je nach Lage:** Beim Handy, an den Überwachungskameras und beim Losreißen erscheinen passende Knöpfe.

Tablets nutzen automatisch kleinere Texturen und eine begrenzte Auflösung, damit Safari nicht an seine Speichergrenze stößt. Der Ton läuft auch, wenn das iPad auf „stumm“ steht.

**Falls die Maus nicht eingefangen wird** (manche eingebetteten Fenster erlauben das nicht): mit gedrückter Maustaste ziehen, um sich umzusehen.

**Voraussetzungen:** ein aktueller Desktop-Browser (Chrome, Edge oder Firefox) mit WebGL 2, Maus und Tastatur oder Gamepad (Standard-Layout, z. B. Xbox/PlayStation). Kopfhörer werden dringend empfohlen.

Der Fortschritt wird automatisch an Checkpoints im Browser gespeichert (localStorage).

## 🎮 Steuerung (frei belegbar unter Einstellungen → Steuerung)

| Aktion | Taste |
|---|---|
| Bewegen | W A S D |
| Rennen (begrenzte Ausdauer) | Shift |
| Schleichen / Ducken | C (umschaltbar oder halten) |
| Interagieren · Tür · Verstecken | E |
| Klettern · im Versteck: Atem anhalten | Leertaste |
| Smartphone | Q oder Tab |
| Taschenlampe | F |
| Heilen | H |
| Werfen (Ablenkung) | G oder linke Maustaste |
| Losreißen, wenn gepackt | A und D abwechselnd |
| Pause | Esc oder P |
| Entscheidungen | Maus, Zahlentasten 1–3 oder W/S + E |

**Gamepad:** linker Stick bewegen, rechter Stick umsehen, A interagieren, B klettern/Atem anhalten, X ducken, Y Smartphone, LB Taschenlampe, RB heilen, RT werfen, LT/L3 rennen, Steuerkreuz für Smartphone-Menüs (X = zurück) und Losreißen, Start für Pause. Alle Menüs lassen sich mit Steuerkreuz bzw. Stick und A bedienen, B geht zurück.

## 🧟 Was das Spiel ausmacht

- **Keine Waffen, kein Kampf.** Sami kann rennen, schleichen, sich verstecken, klettern, Türen schließen und Zombies mit Würfen ablenken.
- **Zombie-KI mit sieben Kernzuständen** (Ruhe, Patrouille, Untersuchen, Alarm, Verfolgung, Suche, Rückkehr) sowie Angriff, Packen, Taumeln, Tür einschlagen, Versteck prüfen, Schlafen und Aufstehen. Die Wahrnehmung hängt von Sichtfeld, Entfernung, Licht, Bewegung, Haltung und der Taschenlampe ab. Geräusche breiten sich entlang der Gänge aus, Wände und Türen dämpfen sie.
- **Verstecke ohne Garantie:** Spinde, unter Betten, hinter Fahrzeugen und Containern. Wer beim Verstecken gesehen wird oder zu laut atmet, wird herausgezogen.
- **Verletzungssystem** mit den Zuständen Gesund, Verletzt und Schwer verletzt. Es bremst, kürzt die Ausdauer und trübt die Sicht. Heilmittel sind knapp, Wunden heilen nicht von selbst.
- **Smartphone in der Hand** mit Taschenlampe, Nachrichten, Sprachmemos, Notizen (Ziel, Dokumente, Erkenntnisse), Fotos, Anrufliste und Zustand. Der Akku ist unbegrenzt.
- **Die unbekannte Kontaktperson** meldet sich über Textnachrichten, Anrufe, Sprachnachrichten, Lautsprecherdurchsagen, Überwachungskameras und Monitore des ARGUS-Systems sowie über alte Aufnahmen.
- **Klassische, langsame Zombies:** Sie schlurfen langsamer, als Sami geht, wie in frühen Survival-Horror-Spielen. Gefährlich werden sie in Gruppen, in engen Gängen, wenn sie dich packen, und wenn du geduckt schleichst, denn dann bist du langsamer als sie.
- **Zombies sind keine Statisten:** Sie stolpern bei Verfolgungen über Hindernisse und stürzen, schlagen Türen ein, prüfen Verstecke und rufen sich gegenseitig herbei.
- **Fünf Kapitel in acht Abschnitten:** Krankenhaus (Station 3, dann Notaufnahme und Pathologie) → Forschungseinrichtung PROJECT EVE (Institut, dann Versorgungsebene mit Pumpwerk) → Parkhaus → U-Bahn (Tunnel, dann Linden-Passage) → Stadt. Jeder Abschnitt hat eigene Mechaniken, zum Beispiel Notstrom, ein Wartezimmer hinter Glas, Kühlfächer, Dekon-Schleuse, Sterilisation mit zeitgesteuerten Toren, Autoalarme, einen Zug voller „Fahrgäste“, Dampfventile, die Infizierte anlocken, ein geflutetes Becken, in dem jeder Schritt laut ist, Schaufensterpuppen, zwischen denen nicht nur Puppen stehen, einen Supermarkt voller Infizierter, Regen, der Schritte verschluckt, und einen Totmannschalter.
- **Figuren:** Mine und İlyas müssen gefunden werden. Beide haben Geheimnisse.
- **Entscheidungen und drei Enden:** **Hoffnung**, **Tragödie** und **Geheimnis**. Die Hinweise dazu sind über das ganze Spiel verteilt.
- **Drei Schwierigkeitsgrade:** Leicht, Mittel (Standard) und Schwer. Sie ändern Heilmittel, Reaktionsfenster, Gegnertempo, Wahrnehmung und Schaden. Die Geschichte bleibt gleich. Der Grad lässt sich jederzeit im Haupt- und Pausemenü ändern.
- **Häufige automatische Checkpoints**, Kapitelauswahl und Fortsetzen.
- **Einstellungen:** Mausempfindlichkeit, Y-Achse, Sichtfeld, Kopfbewegung, Grafikqualität, Renderauflösung, Vollbild, Helligkeit, Bloom, Filmkörnung, Lautstärken (Gesamt, Musik, Effekte, Stimmen), Untertitel und Untertitelgröße sowie die Tastenbelegung.

## 🔧 Technik in Kürze

- **Engine:** three.js (WebGL 2) mit eigener Spiel-Architektur in modularem JavaScript. Mit esbuild wird daraus eine Datei gebündelt. Unreal Engine 5 ließ sich in der Cloud-Entwicklungsumgebung nicht betreiben. Die Browser-Lösung ist außerdem ohne Installation sofort spielbar.
- **Alles prozedural:** Texturen (PBR mit Normal- und Rauheitsmaps), Möbel, Fahrzeuge, Figuren, Animationen, Soundeffekte und die dynamische Musik entstehen zur Laufzeit. Es gibt keine externen Grafik- oder Sounddateien.
- **Licht:** Ein Pool echter Punktlichter wird den relevantesten Leuchten zugewiesen. Ein Shader-Patch prüft jede Lampe über das Weltraster gegen Wände, sodass kein Licht durch Mauern dringt. Dazu kommt weiches Umgebungslicht pro Raum, und die Taschenlampe wirft Schatten.
- **Sprachaufnahmen:** Alles, was Sami über Geräte hört (Anrufe, Diktiergerät, Lautsprecher, Fernsehnachrichten), ist vertont: 46 Aufnahmen, erzeugt mit ElevenLabs und nachbearbeitet mit ffmpeg. Gespräche mit Mine und İlyas laufen über Untertitel.

Mehr dazu in [`docs/ARCHITEKTUR.md`](docs/ARCHITEKTUR.md), Testergebnisse in [`docs/QA.md`](docs/QA.md). Die Story-Bibel mit allen Auflösungen steht in [`docs/STORY.md`](docs/STORY.md) und enthält **Spoiler**.

## 🛠️ Entwicklung

```bash
cd no-way-out
npm install                 # three + esbuild
npm run build               # dist/game.js + NoWayOut.html (minifiziert)
node tools/build.mjs --dev  # Entwicklungs-Build mit Sourcemap
node tools/playtest.mjs ch1 --god              # automatischer Durchspieltest eines Kapitels
node tools/playtest.mjs all --god --seq        # gesamte Kampagne am Stück
CHOICE=hope node tools/playtest.mjs ch5 --god  # Finale mit bestimmter Entscheidung (hope|ilyas|sami|call)
node tools/map.mjs ch3      # Draufsicht eines Levels als PNG (tools/out)
```

Debug-Modus: `index.html?debug` öffnet das Spiel mit F3 (Statistik), F4 (unverwundbar), F7 (unsichtbar) und F8 (nächstes Kapitel).

## ⚠️ Ehrliche Einordnung

- Die Grafik ist **atmosphärisch, aber nicht fotorealistisch**. Alle Modelle bestehen aus prozeduralen Grundkörpern, die Animationen sind prozedural statt per Motion-Capture. Die Systeme sind so gebaut, dass sich echte 3D-Modelle (glTF) und Sounddateien später einsetzen lassen.
- Die Spielzeit liegt je nach Spielweise bei etwa **1,5 bis 2 Stunden**. Gemessen ist nur die Untergrenze: Der Autopilot, der unsichtbar die kürzesten Wege rennt, braucht rund 31 Minuten reine Spielzeit.
- Die vertonten Stimmen stammen von englischsprachigen ElevenLabs-Stimmen, die über das mehrsprachige Modell Deutsch sprechen. Ein leichter Akzent ist möglich.
- Begleiter werden von Zombies bewusst ignoriert, damit keine frustrierenden Eskortpassagen entstehen. Gefahr für sie entsteht nur durch die Inszenierung.
- Die Touch-Steuerung und die Anpassungen für iPad/Safari (Ton, Speicher) wurden in einer iPad-Emulation im Chromium-Browser getestet, nicht auf einem echten iPad. Am besten spielt es sich weiterhin mit Maus und Tastatur oder Gamepad. Die Gamepad-Belegung ist fest, nur die Tastatur ist frei belegbar.

Alle Personen, Firmen und Orte sind frei erfunden.
