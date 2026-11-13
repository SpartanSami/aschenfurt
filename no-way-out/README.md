# NO WAY OUT

**First-Person-Survival-Horror.** Jede Kugel zählt. Du kannst nur überleben.

Sami erwacht ohne Erinnerung in einem Krankenhaus. In seiner Akte steht kein Name, nur **„Proband 017“**. Ein Unbekannter ruft ihn an und kennt den Weg nach draußen. Darunter liegt ein Forschungsinstitut, dessen Experiment **PROJECT EVE** die Stadt in eine Quarantänezone verwandelt hat. Bis 06:00 Uhr bleibt Zeit, um 06:00 Uhr wird der Sektor „sterilisiert“.

---

## ▶️ Spielen

| Variante | So geht's |
|---|---|
| **Einzeldatei** | `NoWayOut.html` per Doppelklick öffnen. Alles ist enthalten, inklusive Sprachaufnahmen, und läuft offline. |
| **Projektordner** | `index.html` öffnen (lädt `dist/game.js`). Über einen lokalen Webserver (`npx http-server .`) werden die Sprachaufnahmen aus `assets/audio/` geladen. |
| **Online** | Den Ordner zum Beispiel über GitHub Pages veröffentlichen und `…/no-way-out/` aufrufen. |

**Smartphone, iPad und Tablets:** Das Spiel erkennt Touch-Geräte und blendet eine eigene Steuerung ein:
- **Linke Bildschirmhälfte:** Stick zum Bewegen. Ganz nach außen geschoben wird gerannt. Darüber liegt **Zielen** (tippen = an/aus, halten = solange gehalten).
- **Rechte Hälfte:** Wischen zum Umsehen, Doppeltipp für die schnelle 180°-Wende.
- **Rechts unten genau vier Knöpfe:** Benutzen, Lampe, Handy und Ducken.
- **Alles Weitere erscheint nur bei Bedarf:**
  - Beim Zielen wird der große Knopf zu **Schießen**, vor einem Hindernis zu **Klettern**.
  - Mit einer Flasche in der Hand wird „Zielen“ zu **Werfen**.
  - Im Versteck wird „Ducken“ zu **Atem** (Atem anhalten).
  - **Laden** erscheint links, wenn das Magazin nicht voll ist.
  - **✚ Heilen** erscheint oben neben der Lebensanzeige, wenn es etwas zu heilen gibt.
- **Das Spiel-Handy** öffnet sich als große, direkt antippbare Ansicht mit normal großer Schrift (Nachrichten, Notizen, Karte, Zustand). Sie passt sich Hoch- und Querformat an. Anruf und neue Nachricht lassen sich oben direkt antippen.
- **Anzeigen** (Leben, Ausdauer, Munition, Ziel) liegen am oberen Rand, damit unten nichts verdeckt wird.

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
| Werfen (Ablenkung) | G |
| Zielen · Schießen · Nachladen | rechte Maustaste · linke Maustaste · R |
| Schnelle Wende (180°) | V |
| Karte | Q → App „Karte“ (A/D zoomen) |
| Losreißen, wenn gepackt | A und D abwechselnd |
| Pause | Esc oder P |
| Entscheidungen | Maus, Zahlentasten 1–3 oder W/S + E |

**Gamepad:** linker Stick bewegen, rechter Stick umsehen, A interagieren, B klettern/Atem anhalten, X ducken, Y Smartphone, LB Taschenlampe, RB heilen, LT zielen, RT schießen, Ansicht-Taste nachladen, R3 werfen, L3 rennen, Steuerkreuz für Smartphone-Menüs (X = zurück) und Losreißen, Start für Pause. Alle Menüs lassen sich mit Steuerkreuz bzw. Stick und A bedienen, B geht zurück.

## 🧟 Was das Spiel ausmacht

- **Eine Glock, wenig Munition.** Sami war Polizist. Seine Glock 17 liegt beim Erwachen neben dem Telefon, mit einem halb vollen Magazin. Unterwegs findet er Patronen: in jedem Abschnitt vier Schachteln (Mittel: zusammen rund 370 Schuss im ganzen Spiel, vorher rund 210). Ein Kopftreffer tötet sofort, am Körper braucht es vier Treffer (Mittel). Jeder Schuss ist laut und lockt alles in der Nähe an. Schleichen, Verstecken, Ablenken mit Würfen und Türen bleiben deshalb wichtig.
- **Zombie-KI mit sieben Kernzuständen** (Ruhe, Patrouille, Untersuchen, Alarm, Verfolgung, Suche, Rückkehr) sowie Angriff, Packen, Taumeln, Tür einschlagen, Versteck prüfen, Schlafen und Aufstehen. Die Wahrnehmung hängt von Sichtfeld, Entfernung, Licht, Bewegung, Haltung und der Taschenlampe ab. Geräusche breiten sich entlang der Gänge aus, Wände und Türen dämpfen sie.
- **Verstecke ohne Garantie:** Spinde, unter Betten, hinter Fahrzeugen und Containern. Wer beim Verstecken gesehen wird oder zu laut atmet, wird herausgezogen.
- **Dezente Daueranzeige:** zwei schmale Balken für Gesundheit und Ausdauer, die Zahl der Heilmittel, der Munitionszähler und das aktuelle Ziel. Alles ist blass und wird nur bei Änderungen kurz hell.
- **Fundstücke leuchten auf:** Munition gelb, Heilmittel grün, Schlüssel und wichtige Dinge blau, Aufnahmen rot. Der Lichtpunkt pulsiert und blinkt etwa alle drei Sekunden, auch im Dunkeln.
- **Verletzungssystem** mit den Zuständen Gesund, Verletzt und Schwer verletzt. Es bremst, kürzt die Ausdauer und trübt die Sicht. Heilmittel sind knapp, Wunden heilen nicht von selbst.
- **Smartphone in der Hand** mit Taschenlampe, Nachrichten, Sprachmemos, Notizen (Ziel, Dokumente, Erkenntnisse), Fotos, Anrufliste, Zustand und **Karte**. Der Akku ist unbegrenzt.
- **Karten-App:** Sie zeichnet automatisch auf, was Sami wirklich gesehen hat: den Raum, in dem er steht, und alles in Sichtlinie, auch durch offene Türen. Sie zeigt Wände, Türen (grün offen, gelb zu, rot verschlossen), Glas, Wasser, gesehene Gegenstände, Raumnamen und Samis Blickrichtung. Der aufgedeckte Bereich wird mit dem Checkpoint gespeichert.
- **Die unbekannte Kontaktperson** meldet sich über Textnachrichten, Anrufe, Sprachnachrichten, Lautsprecherdurchsagen, Überwachungskameras und Monitore des ARGUS-Systems sowie über alte Aufnahmen.
- **Klassische, langsame Zombies:** Sie schlurfen langsamer, als Sami geht, wie in frühen Survival-Horror-Spielen. Gefährlich werden sie in Gruppen, in engen Gängen, wenn sie dich packen, und wenn du geduckt schleichst, denn dann bist du langsamer als sie.
- **Zombies sind keine Statisten:** Sie stolpern bei Verfolgungen über Hindernisse und stürzen, schlagen Türen ein, prüfen Verstecke und rufen sich gegenseitig herbei.
- **Kriecher:** Beinlose Zombies ziehen sich mit den Armen über den Boden. Sie sind sehr langsam, liegen aber flach im Dunkeln, sind leicht zu übersehen und greifen nach den Knöcheln (Kellerflur, Werkstatt im Pumpwerk, U-Bahnsteig).
- **Treffer und Tod sichtbar:** Getroffene Zombies zucken zur Seite des Einschlags, ein Kopftreffer reißt den Kopf zurück. Beim Sterben knicken die Knie ein, dann kippt der Körper um, und zwar weg vom Schützen, aber nie in eine Wand. Darunter breitet sich eine Blutlache aus. Fehlschüsse hinterlassen Einschusslöcher, Treffer Blutspritzer an der Wand dahinter.
- **Auswertung am Ende:** Spielzeit, Tode, erledigte Zombies, Schüsse, Treffer und Trefferquote, Kopftreffer, benutzte Heilmittel, Dokumente und Aufnahmen, dazu ein Rang von S bis D.
- **Fünf Kapitel in acht Abschnitten:** Krankenhaus (Station 3, dann Notaufnahme und Pathologie) → Forschungseinrichtung PROJECT EVE (Institut, dann Versorgungsebene mit Pumpwerk) → Parkhaus → U-Bahn (Tunnel, dann Linden-Passage) → Stadt. Jeder Abschnitt hat eigene Mechaniken, zum Beispiel Notstrom, ein Wartezimmer hinter Glas, Kühlfächer, Dekon-Schleuse, Sterilisation mit zeitgesteuerten Toren, Autoalarme, einen Zug voller „Fahrgäste“, Dampfventile, die Infizierte anlocken, ein geflutetes Becken, in dem jeder Schritt laut ist, Schaufensterpuppen, zwischen denen nicht nur Puppen stehen, einen Supermarkt voller Infizierter, Regen, der Schritte verschluckt, und einen Totmannschalter.
- **Figuren:** Mine und İlyas müssen gefunden werden. Beide haben Geheimnisse.
- **Entscheidungen und drei Enden:** **Hoffnung**, **Tragödie** und **Geheimnis**. Die Hinweise dazu sind über das ganze Spiel verteilt.
- **Drei Schwierigkeitsgrade:** Leicht, Mittel (Standard) und Schwer. Sie ändern Heilmittel, Reaktionsfenster, Gegnertempo, Wahrnehmung und Schaden. Die Geschichte bleibt gleich. Der Grad lässt sich jederzeit im Haupt- und Pausemenü ändern.
- **Häufige automatische Checkpoints**, Kapitelauswahl und Fortsetzen.
- **Einstellungen:** Mausempfindlichkeit, Y-Achse, Sichtfeld, Kopfbewegung, Grafikqualität, Renderauflösung, automatische Auflösung, Vollbild, Helligkeit, Bloom, Filmkörnung, Lautstärken (Gesamt, Musik, Effekte, Stimmen), Untertitel und Untertitelgröße sowie die Tastenbelegung.

## 🔧 Technik in Kürze

- **Engine:** three.js (WebGL 2) mit eigener Spiel-Architektur in modularem JavaScript. Mit esbuild wird daraus eine Datei gebündelt. Unreal Engine 5 ließ sich in der Cloud-Entwicklungsumgebung nicht betreiben. Die Browser-Lösung ist außerdem ohne Installation sofort spielbar.
- **Alles prozedural:** Texturen (PBR mit Normal- und Rauheitsmaps), Möbel, Fahrzeuge, Figuren, Animationen, Soundeffekte und die dynamische Musik entstehen zur Laufzeit. Es gibt keine externen Grafik- oder Sounddateien.
- **Licht:** Ein Pool echter Punktlichter wird den relevantesten Leuchten zugewiesen. Ein Shader-Patch prüft jede Lampe über das Weltraster gegen Wände, sodass kein Licht durch Mauern dringt. Dazu kommt weiches Umgebungslicht pro Raum, und die Taschenlampe wirft Schatten.
- **Sichtbarer Lichtkegel:** Im Strahl der Taschenlampe leuchtet Schwebstaub auf, dazu ein schwacher Lichtschaft. Beides endet an der ersten Wand in Strahlrichtung. Die Berechnung läuft vollständig auf der Grafikkarte.
- **Bildlook:** kühle, leicht grünliche Schatten, warme Lichter, sanfte Kontrastkurve, leichte Farbsäume zum Bildrand, Filmkörnung und Vignette.
- **Raumdetails:** In allen Abschnitten verteilt das Spiel automatisch Schmutz- und Ölflecken, Papier, Zeitungen, Pappe, Flugblätter, Putzbrocken, Pfützen, Laub, Wasserlaufspuren an Wänden und heruntergeklappte Deckenplatten. Die Verteilung passt zum Ort (Krankenhaus, Pumpwerk, Garage, U-Bahn, Stadt), ist bei jedem Start gleich und lässt Gegenstände und Schalter frei. Jede Sorte ist ein einziges Instanz-Objekt, das kostet kaum Leistung.
- **Leistung:** Die Auflösung passt sich automatisch an, wenn die Bildrate dauerhaft unter etwa 45 fps fällt (bis 60 %), und steigt wieder, wenn es flüssig läuft. Zombies weiter als 24 m werden nur in jedem dritten Bild animiert.
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

- Die Grafik ist **atmosphärisch, aber nicht fotorealistisch**. Alle Modelle bestehen aus prozeduralen Grundkörpern, die Animationen (auch Kriechen, Treffer und Sterben) sind prozedural statt per Motion-Capture. Die Systeme sind so gebaut, dass sich echte 3D-Modelle (glTF) und Sounddateien später einsetzen lassen.
- Die Spielzeit liegt je nach Spielweise bei etwa **1,5 bis 2 Stunden**. Gemessen ist nur die Untergrenze: Der Autopilot, der unsichtbar die kürzesten Wege rennt, braucht rund 32 Minuten reine Spielzeit.
- Die vertonten Stimmen stammen von englischsprachigen ElevenLabs-Stimmen, die über das mehrsprachige Modell Deutsch sprechen. Ein leichter Akzent ist möglich.
- Begleiter werden von Zombies bewusst ignoriert, damit keine frustrierenden Eskortpassagen entstehen. Gefahr für sie entsteht nur durch die Inszenierung.
- Die Touch-Steuerung, die große Handy-Ansicht und die Anpassungen für iPad/Safari (Ton, Speicher) wurden in einer Smartphone- und iPad-Emulation im Chromium-Browser getestet (hoch und quer, mit echten Tipp-Gesten), nicht auf echten Geräten. Am besten spielt es sich weiterhin mit Maus und Tastatur oder Gamepad. Die Gamepad-Belegung ist fest, nur die Tastatur ist frei belegbar.

Alle Personen, Firmen und Orte sind frei erfunden.
