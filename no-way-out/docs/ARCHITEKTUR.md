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
│  ├─ render/                 renderer (Post-FX), materials (+Shader-Patch), textures (prozedural),
│  │                          lighting (Licht-Pool, Flackern, Stromkreise), fx (Partikel, Bildschirm)
│  ├─ world/                  grid (Raster, Sichtlinien, A*), leveldef (Level-DSL), level (Aufbau),
│  │                          batcher (statisches Batching), door, physics, props/props2, items
│  ├─ player/                 player (Bewegung, Ausdauer, Verstecken, Heilen …), hands (Viewmodel)
│  ├─ ai/                     zombie (Zustandsmaschine), humanoid (Körper + Animation), noise, npc
│  ├─ systems/                audio (Synthese, Musik, Stimmen), phone, photos, story, inventory
│  ├─ ui/                     hud, menu, docs (Dokumentenansicht)
│  └─ data/
│     ├─ chapters/ch1…ch5     Level-Aufbau + Skripte je Kapitel
│     ├─ story/               documents, endings, voicemanifest (automatisch erzeugt)
│     └─ zombietypes.js       datengetriebene Gegnertypen
└─ tools/                     build, playtest (Autopilot), routes, map, views, shot, voicelines, genvoice
```

## Zentrale Systeme

### Welt: Raster + Level-DSL
- Die Welt ist ein **1-m-Raster** mit Bitflags (Wand, Boden, Tür, Requisit, sichtblockierend, Glas, Schacht, Kletterhindernis, Deckung, verriegelt, geschlossen). Pro Zelle gibt es Boden- und Deckenhöhe sowie optional Rampen und Treppen.
- Kapitel werden mit einer **DSL** beschrieben: `room()`, `door()`, `door2()`, `glass()`, `vent()`, `ramp()`, `prop()`, `light()`, `zombie()`, `item()`, `interact()`, `trigger()`, `checkpoint()`. Der `LevelBuilder` erzeugt daraus Wände, Böden, Decken, Stufen und Stürze mit Welt-UVs und Vertex-AO. Die Geometrie wird pro Material und 16-m-Chunk zusammengefasst, das spart Draw-Calls bei weiterhin funktionierendem Frustum-Culling.
- Daraus entstehen auch die Kollision (Kreis gegen Zellen und gedrehte Quader), die Sichtlinien (DDA), die Geräuschausbreitung (Flood-Fill entlang der Gänge) und die Pfadsuche (A* mit 8 Richtungen).

### Licht
- **Leuchten** haben Modi (steady, flicker, broken, pulse, strobe, rotate, fire, motion) und gehören zu Stromkreisen (`power(group, on)`).
- Ein **fester Pool** von 6–12 Punktlichtern wird jedes Zehntelsekunde den relevantesten Leuchten zugewiesen. Dadurch bleiben die Shader-Kosten konstant.
- Ein **Shader-Patch** an `MeshStandardMaterial` prüft für jedes Punktlicht entlang des Rasters, ob eine Wand oder geschlossene Tür dazwischen liegt. So entstehen harte Licht-Schatten an Türöffnungen, und kein Licht dringt durch Wände.
- Eine **Ambient-Rastertextur** speichert indirektes Licht je Raum. Sie wird bei Stromwechseln und Türbewegungen neu berechnet.
- Die **Taschenlampe** ist ein SpotLight mit Schattenwurf und leichter Nachlaufbewegung.

### Gegner-KI (`ai/zombie.js`)
Zustände: `idle, patrol, dormant, getup, investigate, alert, chase, search, return, attack, grab, stagger, bash, checkhide, script`.
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
- Wartezeiten laufen über die Spielzeit. Beim Laden eines Checkpoints werden laufende Abläufe abgebrochen (Generationszähler).

### Speichern
Ein Snapshot je Checkpoint enthält Flags, erledigte Skripte, aufgenommene Gegenstände, Türzustände, Stromkreise, entfernte Gegner, Inventar, Gesundheit, Telefoninhalt und Begleiter. Beim Tod wird das Kapitel neu aufgebaut und der Snapshot angewendet. Zusätzlich gibt es je Kapitel einen Start-Snapshot für die Kapitelauswahl und Meta-Daten (freigeschaltete Kapitel, gesehene Enden).

### Audio
Alle Effekte werden per DSP in JavaScript synthetisiert: Schritte je Untergrund, Türen, Glas, Zombie-Stimmen per Formantsynthese, Atem, Herzschlag, Alarme, Ambiente-Loops. Die Wiedergabe erfolgt räumlich (HRTF) mit Tiefpass, wenn eine Wand zwischen Quelle und Hörer liegt.

Die **dynamische Musik** hat drei Schichten (Drone, Spannungs-Cluster, Jagd-Ostinato mit Trommeln), dazu Stinger bei Entdeckung, Herzschlag im Versteck und ein langsames Abklingen nach der Flucht.

### Leistung
Statisches Batching nach Material und Chunk, ein fester Licht-Pool, Schatten nur für die Taschenlampe, gecachte Texturen und drei Qualitätsstufen (Pixelratio, Schattenauflösung, Lichtanzahl, Grid-Schatten, MSAA, Bloom).
