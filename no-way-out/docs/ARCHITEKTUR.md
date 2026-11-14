# Architektur & technische Entscheidungen

## Warum three.js statt Unreal Engine 5?

| Kriterium | Unreal Engine 5 | three.js (gewählt) |
|---|---|---|
| In der Cloud-Entwicklungsumgebung lauffähig (ohne GPU, ohne Editor) | ✗ | ✓ |
| Sofort spielbar ohne Installation (Doppelklick, GitHub Pages) | ✗ (Build ≥ mehrere GB) | ✓ (≈ 8 MB inkl. Stimmen) |
| Realistische Beleuchtung | ✓✓ | ✓ (PBR, Schatten, Bloom, eigene Licht-Verdeckung) |
| Prozedurale Inhalte vollständig im Code testbar | eingeschränkt | ✓ (automatischer Durchspieltest) |

Fazit: UE5 hätte die bessere Grafikobergrenze. Ein *tatsächlich spielbares*, getestetes Spiel war in dieser Umgebung aber nur im Browser möglich.

## Verzeichnisstruktur

```
no-way-out/
├─ index.html, style.css      Einstieg + Oberfläche
├─ NoWayOut.html              Einzeldatei-Version (Build)
├─ dist/game.js               gebündeltes Spiel (Build)
├─ assets/audio/*.mp3         Sprachaufnahmen (Geräte-Stimmen)
├─ src/
│  ├─ main.js, game.js        Bootstrapping, Spielzustände, Hauptschleife, Checkpoints, Angriffe
│  ├─ core/                   config (Schwierigkeit, Einstellungen), input, save, events, rng
│  ├─ render/                 renderer (Post-FX, Farbgebung, dynamische Auflösung), materials (+Shader-Patch),
│  │                          textures (prozedural), lighting (Licht-Pool, Flackern, Stromkreise),
│  │                          fx (Partikel, Bildschirm), beam (Lichtkegel mit Schwebstaub)
│  ├─ world/                  grid (Raster, Sichtlinien, A*), leveldef (Level-DSL), level (Aufbau),
│  │                          batcher (statisches Batching), door, physics, props/props2, items,
│  │                          clutter (automatische Raumdetails als Instanz-Objekte)
│  ├─ player/                 player (Bewegung, Ausdauer, Verstecken, Heilen …), hands (Viewmodel)
│  ├─ ai/                     zombie (Zustandsmaschine), humanoid (Körper + Animation), noise, npc
│  ├─ systems/                audio (Synthese, Musik, Stimmen), phone, photos, story, inventory,
│  │                          automap (Karten-App), stats (Auswertung und Rang)
│  ├─ ui/                     hud (Anzeigen), menu, docs (Dokumentenansicht), touch (Touch-Steuerung),
│  │                          phoneui (große Handy-Ansicht für Touch-Geräte)
│  └─ data/
│     ├─ chapters/            Level-Aufbau + Skripte: ch1, ch1b, ch2, ch2b, ch3, ch4, ch4b, ch5
│     │                       (die b-Dateien sind Teilabschnitte eines Kapitels, index.js legt die Reihenfolge fest)
│     ├─ story/               documents, endings, voicemanifest (automatisch erzeugt)
│     └─ zombietypes.js       datengetriebene Gegnertypen
└─ tools/                     build, playtest (Autopilot), routes, map, views, shot, voicelines, genvoice
```

## Zentrale Systeme

### Welt: Raster + Level-DSL
- Die Welt ist ein **1-m-Raster** mit Bitflags (Wand, Boden, Tür, Requisit, sichtblockierend, Glas, Schacht, Kletterhindernis, Deckung, verriegelt, geschlossen). Pro Zelle gibt es Boden- und Deckenhöhe sowie optional Rampen und Treppen.
- Kapitel werden mit einer **DSL** beschrieben: `room()`, `door()`, `door2()`, `glass()`, `vent()`, `ramp()`, `heights()`, `water()`, `prop()`, `light()`, `zombie()`, `item()`, `interact()`, `trigger()`, `checkpoint()`. Der `LevelBuilder` erzeugt daraus Wände, Böden, Decken, Stufen und Stürze mit Welt-UVs und Vertex-AO. Die Geometrie wird pro Material und 16-m-Chunk zusammengefasst, das spart Draw-Calls bei weiterhin funktionierendem Frustum-Culling.
- **Wasserflächen** (`water()`): ein Wasserspiegel über abgesenkten Zellen. Wer darin watet, ist langsamer (Spieler ca. 70 %, Zombies 75 %) und lauter (Schrittgeräusch ×1,7, geduckt ×2,5).
- **Höhenangaben von Requisiten:** Requisiten, die ihre Höhe selbst setzen (Lampen, Schilder, Rohre, Fernseher), stehen immer auf dem örtlichen Boden, ihr `y` ist relativ. Bei allen anderen ist `y` absolut. Beschriftete Flächen (Schilder, Bildschirme) werden eingepasst statt gekachelt.
- Daraus entstehen auch die Kollision (Kreis gegen Zellen und gedrehte Quader), die Sichtlinien (DDA), die Geräuschausbreitung (Flood-Fill entlang der Gänge) und die Pfadsuche (A* mit 8 Richtungen).

### Licht
- **Leuchten** haben Modi (steady, flicker, broken, pulse, strobe, rotate, fire, motion) und gehören zu Stromkreisen (`power(group, on)`).
- Ein **fester Pool** von 6–12 Punktlichtern wird jedes Zehntelsekunde den relevantesten Leuchten zugewiesen. Dadurch bleiben die Shader-Kosten konstant.
- Ein **Shader-Patch** an `MeshStandardMaterial` prüft für jedes Punktlicht entlang des Rasters, ob eine Wand oder geschlossene Tür dazwischen liegt. So entstehen harte Licht-Schatten an Türöffnungen, und kein Licht dringt durch Wände.
- Eine **Ambient-Rastertextur** speichert indirektes Licht je Raum. Sie wird bei Stromwechseln und Türbewegungen neu berechnet.
- Die **Taschenlampe** ist ein SpotLight mit Schattenwurf und leichter Nachlaufbewegung.
- **Sichtbarer Lichtkegel** (`render/beam.js`): Rund 3 200 Staubpunkte (Tablet 1 500) liegen in einem 8-m-Würfel, der mit der Kamera mitwandert. Der Vertex-Shader berechnet je Punkt, ob er im Kegel liegt (Winkel zur Strahlachse, Abstand, Strahllänge) und wie hell er ist. Die Strahllänge bestimmt ein Gitter-Strahltest pro Bild, damit Staub und Lichtschaft an der ersten Wand enden. Der Lichtschaft ist ein offener Kegel mit additiver Mischung, der an streifenden Kanten ausgeblendet wird.

### Bild
- Der Schluss-Shader übernimmt Farbgebung (kühle Schatten, warme Lichter, sanfte S-Kurve), leichte Farbsäume zum Bildrand, Verletzungs- und Treffereffekte, Vignette, Körnung und den Kameramodus.
- **Dynamische Auflösung:** `renderer.adapt()` misst alle 2 s die Bildrate im laufenden Spiel. Unter 45 fps sinkt die interne Auflösung schrittweise bis 60 %, nach 6 s über 57 fps steigt sie wieder in 5-%-Schritten. Abschaltbar unter Einstellungen → Grafik.

### Raumdetails (`world/clutter.js`)
Nach dem Levelaufbau läuft ein Verteiler über alle begehbaren Zellen. Er legt Schmutz- und Ölflecken, Pfützen (glatt, spiegeln Lichter), Papier, Zeitungen, Pappe, Flugblätter, Putzbrocken, Laub (draußen), Wasserlaufspuren an Wänden und heruntergeklappte Deckenplatten mit dunklem Loch darüber. Die Häufigkeit hängt vom Abschnitt ab (z. B. mehr Rost und Pfützen im Pumpwerk, Ölflecken in der Garage, kein Papier im Pumpwerk). Gegenstände und Schalter bekommen einen freien Rand, Türen, Rampen, Glas und Wasser bleiben frei. Jede Sorte ist ein `InstancedMesh`, das ergibt rund 10 zusätzliche Draw-Calls je Level. Alles ist reine Dekoration ohne Kollision.

### Gegner-KI (`ai/zombie.js`)
Zustände: `idle, patrol, dormant, getup, investigate, alert, chase, search, return, attack, grab, stagger, bash, checkhide, script, fall`.
- **Typen** (`data/zombietypes.js`): Schlurfer, Schläfer, Lauerer, Wanderer, Verfolger und **Kriecher**. Der Kriecher nutzt dieselbe KI, aber die Körperhaltung `crawl` (flach, Brust über dem Standpunkt, Beine ausgeblendet) mit eigenem Armzyklus. Er steht nie auf und stürzt nicht.
- **Treffer und Tod:** `humanoid.hit()` lässt den Körper zur Seite des Einschlags zucken. `die()` wählt eine von vier Fallrichtungen: bevorzugt weg vom Schützen, aber nur, wenn 1,6 m frei sind (keine Wand, keine Kante). Die Haltung `dead` lässt erst die Knie einknicken und kippt den Körper dann um die Füße. Darunter wächst eine Blutlache (Laufzeit-Decal).
- **Sicht:** Sichtfeld, Reichweite abhängig von Licht und Bewegung des Spielers (`player.visibility()`), Deckung bei geducktem Ziel, Taschenlampe ins Gesicht. Die Entdeckung baut sich als „Verdacht“ auf: Ab 0,35 schaut der Zombie nach, ab 1 schlägt er Alarm.
- **Gehör:** Geräusche mit Radius (Schritte je Gangart, Türen, Würfe, Klettern, Japsen, Telefon, Autoalarm). Die Lautheit hängt vom Weg durch die Gänge ab, Wände lassen nur einen gedämpften Rest durch.
- **Gruppen:** Verfolger knurren regelmäßig, dieses Geräusch zieht andere Zombies an.
- **Verfolgung** mit kurzem Bewegungsgedächtnis nach Sichtverlust, danach Suche um die letzte bekannte Position und Rückkehr. Normale Türen werden eingeschlagen, verriegelte und Sicherheitstüren nicht. Über Hindernisse klettern Zombies langsam.
- **Verstecke:** Wer beim Betreten gesehen wurde oder hörbar atmet, wird mit einer schwierigkeitsabhängigen Wahrscheinlichkeit gefunden und herausgezogen.
- **Angriffe:** Ausholen (sichtbar), dann Treffer, Packen (Losreißen per Tastenwechsel), Angriff aus dem Hinterhalt (unvermeidbar) oder Gruppenangriff (sehr gefährlich).

### Spieler
Bewegung mit Beschleunigung, Head-Bob, Hinken, Schwanken bei Verletzung, Ausdauer mit Erschöpfung, Ducken mit Prüfung der Kopffreiheit, Klettern über Hindernisse und Kanten, Verstecken mit Kamerafahrt und Atem-Anhalten, zeitbasiertes Heilen (unterbrechbar), Werfen und ein Viewmodel mit Händen und Telefon.

### Story-Engine (`systems/story.js`)
- Kapitel definieren `script: [{ when, if, once, do: async (c) => … }]`. Auslöser sind `start`, `enter:<zone>`, `interact:<id>`, `pickup:<id>`, `unlock:<tür>`, `locked:<tür>`, `read:/closed:<dok>`, `cond` und `restore:<checkpoint>`.
- Der Kontext `c` bietet unter anderem: `wait`, `lines`, `say`, `msg`, `call`, `pa`, `choice`, `objective`, `fact`, `photo`, `door/unlock/lock/open/close`, `power/lightMode`, `spawn/chase/wake`, `addNpc/npc`, `checkpoint`, `endChapter`, `ending`.
- **Kapitel und Teilabschnitte:** `CHAPTER_ORDER` enthält die fünf Kapitel (für die Nummerierung), `CHAPTER_SEQ` die vollständige Abfolge mit den Teilabschnitten `ch1b`, `ch2b` und `ch4b` (Kapitelauswahl, Debug-Sprung). Teilabschnitte tragen `part: true` und zeigen beim Wechsel nur eine kurze Ortsangabe.
- Wartezeiten laufen über die Spielzeit. Beim Laden eines Checkpoints werden laufende Abläufe abgebrochen (Generationszähler).

### Bedienung auf Touch-Geräten (`ui/touch.js`, `ui/phoneui.js`)
- Die Touch-Steuerung schreibt nur in `input.touch` (gehaltene Knöpfe, einmalige Tipper, Stick, Blickbewegung). Die Spielsysteme fragen wie bei Tastatur und Gamepad `input.down()` und `input.pressed()` ab.
- Knöpfe mit wechselnder Aufgabe: Der große Knopf löst je nach Lage `interact`, `fire` (beim Zielen) oder `vault` (vor einem Hindernis, `player.canVault()`) aus. „Zielen“ wird mit Wurfgegenstand zu `throw`, „Ducken“ im Versteck zu `vault` (Atem anhalten).
- Zielen: kurzer Tipp rastet ein, erneuter Tipp löst; längeres Halten gilt nur, solange der Finger liegt. Rennen, Heilen oder ein Wurfgegenstand lösen die Rastung.
- Die große Handy-Ansicht ist reines HTML über dem Spielbild. Sie liest denselben Zustand wie das 3D-Telefon (`systems/phone.js`) und wird bei jeder Änderung neu aufgebaut; die Karte zeichnet `automap.draw()` in eine eigene Zeichenfläche. Wird Sami getroffen oder gepackt, schließt sie sich, bei Gefahr blinkt ihr Rand rot.
- Zielsuche (`player._findTarget`): Reichweite über Augenabstand oder waagerechten Abstand (für Dinge am Boden), Blickwinkel auf Touch-Geräten großzügiger, Sichtprüfung `grid.losReach()` (nur Wände, geschlossene Türen, Glas).

### Fundstücke
Jeder aufnehmbare Gegenstand trägt einen kleinen, additiv gemischten Lichtpunkt (`items.makeGlint`), der pulsiert und alle paar Sekunden aufblitzt. Er wird nicht von Lampen beleuchtet und ist deshalb auch im Dunkeln zu sehen; die Farbe zeigt die Art (Munition gelb, Heilmittel grün, Schlüssel/Story blau, Aufnahmen rot, Dokumente und Wurfgegenstände schwach).

### Speichern
Ein Snapshot je Checkpoint enthält Flags, erledigte Skripte, aufgenommene Gegenstände, Türzustände, Stromkreise, entfernte Gegner, Inventar, Gesundheit, Telefoninhalt, Begleiter und die aufgedeckte Karte (Bitfeld als Base64). Die **Statistik** des Durchgangs (Zeit, Tode, Schüsse, Treffer, Kopftreffer, Kills, Heilmittel) liegt getrennt daneben und wird bei Checkpoints und beim Tod gesichert, damit ein Tod sie nicht zurücksetzt. Beim Tod wird das Kapitel neu aufgebaut und der Snapshot angewendet. Zusätzlich gibt es je Kapitel einen Start-Snapshot für die Kapitelauswahl und Meta-Daten (freigeschaltete Kapitel, gesehene Enden).

### Audio
Alle Effekte werden per DSP in JavaScript synthetisiert: Schritte je Untergrund, Türen, Glas, Zombie-Stimmen per Formantsynthese, Atem, Herzschlag, Alarme, Ambiente-Loops. Die Wiedergabe erfolgt räumlich (HRTF) mit Tiefpass, wenn eine Wand zwischen Quelle und Hörer liegt.

Die **dynamische Musik** hat drei Schichten (Drone, Spannungs-Cluster, Jagd-Ostinato mit Trommeln), dazu Stinger bei Entdeckung, Herzschlag im Versteck und ein langsames Abklingen nach der Flucht.

### Leistung
Statisches Batching nach Material und Chunk, ein fester Licht-Pool, Schatten nur für die Taschenlampe, gecachte Texturen und drei Qualitätsstufen (Pixelratio, Schattenauflösung, Lichtanzahl, Grid-Schatten, MSAA, Bloom, Dichte der Raumdetails). Dazu kommen die dynamische Auflösung und ein Animations-LOD: Zombies weiter als 24 m von der Kamera werden nur in jedem dritten Bild animiert (mit aufsummierter Zeit, damit nichts ruckelt). Laufzeit-Decals (Einschusslöcher, Blut) sind auf 60 begrenzt, die ältesten verschwinden.
