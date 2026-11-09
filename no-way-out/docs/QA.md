# Qualitätskontrolle – Protokoll

Getestet wurde automatisiert in einem Headless-Chromium mit Software-Rendering (SwiftShader). Ein **Autopilot** steuert Sami mit echter Bewegung, Kollision, Türen, Klettern, Verstecken, Interaktionen, Anrufen, Dokumenten und Entscheidungen durch die Kapitel (`tools/playtest.mjs`, Routen in `tools/routes.mjs`). Story-Skripte, Sprachaufnahmen, Checkpoints und Kapitelwechsel laufen dabei wie im echten Spiel.

## Ergebnisse

| Prüfung | Ergebnis |
|---|---|
| Kapitel 1 vollständig (mit Unverwundbarkeit) | ✅ Erwachen → Telefon/Anruf → Schleichpassage → ITS-Verfolgung → Spind → Zugangskarte → OP-Trakt → Kameras → Aufnahme 1 → Notstrom → Aufzug → Kapitel 2 |
| Kapitel 1 vollständig **ohne** Unverwundbarkeit | ✅ Der Bot überlebt, verliert aber an der Aufzug-Szene Gesundheit. Diese Stelle wurde danach entschärft. |
| Kapitel 2 vollständig | ✅ Dekon-Schleuse → Labore → Mine → Zellentrakt (Elif, Zelle 017, Aufnahme 2) → Entscheidung Kryo-Box → Kühlraum B (Serum) → ARGUS-Terminal → Sterilisation durch die Schleusen → Tunnel → Kapitel 3 |
| Kapitel 3 vollständig | ✅ Ebenen −3/−2/−1 über Rampen → Samis Kombi (Aufnahme 3) → İlyas → Strom fürs Rolltor → Flucht zwischen den Autos → Kapitel 4 |
| Kapitel 4 vollständig | ✅ Drehkreuz → Bahnsteig → durch Zug 3117 (geduckt) → Geständnis + Entscheidung → Aufnahme 4 → Tunnel → Horde → Bahnsteigkante klettern → Biss → Serum-Entscheidung → Kapitel 5 |
| Kapitel 1, Teil 2 (Notaufnahme & Pathologie) | ✅ Aufzug hält im EG → Anruf → Fressender im Versorgungsgang → Notaufnahme (Triage-Protokoll) → Wartezimmer erwacht, Scheibe bricht → Brandschutztür schließen → Keller → Büro (Eingangsbuch) → Kühlfächer-Szene → Kurier: NEXARA-Karte → Verfolgung zum Lastenaufzug → Kapitel 2 |
| Kapitel 2, Teil 2 (Versorgungsebene & Pumpwerk) | ✅ Leitungsgang mit Dampfventilen → Werkstatt (Wartungsbuch) → Pumpwerk → Flasche werfen → durchs Becken watend (langsamer, lauter) → Schaltwarte → Notstrom → Flucht über den Südsteg → Schott → Notausgang → Kapitel 3 |
| Kapitel 4, Teil 2 (Linden-Passage) | ✅ Betriebsgang → verschütteter Hauptgang → durch „Mode Krüger“ (Puppe erwacht) → Fernsehwand (Nachrichten, Dialog) → Drogerie (Heilmittel, Suchplakat) → Mines Telefon → Frischmarkt: Flasche werfen, durch die Gänge → Rolltor-Motor → Tür schließen → Tor öffnet → Lindenstraße → Kapitel 5 |
| Kapitel 5 + **Ende „Hoffnung“** | ✅ |
| Kapitel 5 + **Ende „Tragödie“ (İlyas bleibt)** | ✅ |
| Kapitel 5 + **Ende „Tragödie“ (Sami bleibt)** | ✅ |
| Kapitel 5 + **Ende „Geheimnis“** | ✅ |
| **Gesamte Kampagne am Stück** (alle acht Abschnitte, Zustand wird übernommen) | ✅ 1 → 1·2 → 2 → 2·2 → 3 → 4 → 4·2 → 5: Aufnahmen 1–5 gesammelt, Serum gefunden und weitergegeben, Begleiter übernommen, Geheimnis-Ende erreicht. Keine Skript- oder Laufzeitfehler (Produktions-Build). |
| Kapitel 1, Teil 2 **ohne** Unverwundbarkeit | ✅ **vollständig mit 100 % Gesundheit**: geduckt hinter der Theke, Flucht vor dem Wartezimmer, Brandschutztür, im Keller in der Wäscherei und im Büro den Wachmann abgewartet, Karte genommen, sofort zum Aufzug gerannt. |
| Kapitel 2·2 und 4·2 **ohne** Unverwundbarkeit | ⚠️ Der Bot stirbt in den Schleichpassagen (Leitungsgang, Modegeschäft), weil er feste Wege abläuft und weder Dampfstöße abwartet noch Wanderern ausweicht. Die Läufe deckten aber echte Platzierungsfehler auf, die behoben sind (siehe unten). |
| Einzeldatei `NoWayOut.html` per file:// | ✅ neue Abschnitte laden, alle 46 Sprachaufnahmen eingebettet |
| Tod → Todesbildschirm → „Weiter vom Checkpoint“ | ✅ |
| Fortsetzen nach Neuladen der Seite (localStorage) | ✅ |
| Kapitelauswahl / Freischaltung / gesehene Enden | ✅ |
| Schwierigkeitsgrade: Heilmittel im gesamten Spiel (acht Abschnitte) | ✅ Leicht 39 · Mittel 30 · Schwer 14 |
| Zombie-KI: Geräusch → Untersuchen → Verdacht → Alarm → Verfolgung → Angriff → Packen → Losreißen | ✅ |
| Tür einschlagen, Suche, Rückkehr, Versteck prüfen | ✅ |
| Heilen, Telefon-Apps, Dokumente, Sprachaufnahmen laden | ✅ |
| Pause per P (zuvor nur Esc) | ✅ nach Fehlerbehebung |
| Schwierigkeitsgrad im Haupt- und Pausemenü ändern (wirkt sofort, auf den Spielstand und alle Kapitelstarts) | ✅ per Mausklick im Browser geprüft |
| Entscheidungen per Tastatur (W/S + E) | ✅ |
| Kontaktperson über Kamera-Einblendung (Kap. 1), ARGUS-Monitor und Lautsprecher (Kap. 2), Sprachnachricht (Kap. 3) | ✅ |

## Behobene Fehler (Auswahl)
- Requisiten, die ihre Höhe selbst setzen (Rohre, Schilder, Fernseher, OP-Lampen), wurden doppelt angehoben und hingen teils in der Decke oder im Boden. Ihre Höhe gilt jetzt relativ zum örtlichen Boden.
- Schild- und Bildschirmtexte wurden über breite Flächen gekachelt („ELEKTRO MAX ELEKTRO MAX …“) bzw. abgeschnitten. Beschriftete Flächen werden jetzt eingepasst.
- Wurde die Pause nicht über Esc ausgelöst, konnte der Mauszeiger gefangen bleiben, und Klicks landeten im 3D-Bild statt auf den Menüknöpfen. Die Pause gibt den Zeiger jetzt immer frei.
- Ausgewogenheit der neuen Abschnitte nach Läufen ohne Unverwundbarkeit: Im Pumpwerk stand ein Wanderer direkt am Startpunkt, im Modegeschäft blickten drei Lauerer auf den einzigen Weg (einer zwei Meter neben dem Eingang), im Keller schnitt der Wachmann den Fluchtweg zum Aufzug ab, und ein Rollwagen sowie ein Rollstuhl blockierten Laufwege. Alles wurde versetzt bzw. gedreht.
- Wird der Mauszeiger vom Browser nicht eingefangen (z. B. in eingebetteten Fenstern), lässt sich jetzt mit gedrückter Maustaste umsehen. Ein Hinweis erscheint automatisch.
- Checkpoints in Verfolgungen: Nach der Brandschutztür und dem Schott wird nur gespeichert, wenn kein Verfolger mehr im Raum ist.
- Die Pausetaste P und Gamepad-Start waren belegt, wurden aber nie ausgewertet.
- Entscheidungen, Menüs, Todesbildschirm und Abspann ließen sich nicht per Gamepad bedienen.
- Hindernisse auf Zellgrenzen wurden für die KI nicht markiert, Zombies blieben hängen. Die Markierung erfasst jetzt einen Rand.
- Materialnamen mit Zeilenumbruch erzeugten Shader-Fehler.
- Ein Objekt in den Story-Flags machte den Checkpoint-Snapshot zirkulär (Kapitel 3).
- Doppeltüren waren per Skript nicht ansprechbar (`gate` → `gate_a`).
- Ein Brückengeländer setzte die Kollisionsdecke auf 1,25 m. Wand- und Kollisionshöhe sind jetzt getrennt.
- Zugtür, Wohnungsregal und Flutlicht versperrten Wege, die Positionen wurden korrigiert.
- Die Lautsprecherdurchsage blockierte Dialoge, sie läuft jetzt parallel.
- Ein patrouillierender Zombie im Zellentrakt überforderte die emotionale Elif-Szene und wurde ersetzt.
- Kapitel 5 und das Parkhaus waren zu dunkel, die Umgebungshelligkeit wurde angehoben.

## Render-Last (Mittel, typische Ansichten)
| Kapitel | Draw-Calls | Dreiecke |
|---|---|---|
| 1 Krankenhaus | ~640 | ~38 000 |
| 2 Forschung | ~660 | ~37 000 |
| 3 Parkhaus | ~600 | ~67 000 |
| 4 U-Bahn | ~440 | ~26 000 |
| 5 Stadt | 450–740 | 38 000–60 000 |
| 1·2 Notaufnahme | 535–770 | 40 000–55 000 |
| 2·2 Pumpwerk | ~400 | ~29 000 |
| 4·2 Linden-Passage | 300–970 | 30 000–89 000 |

Die Schaufensterpuppen der Linden-Passage werden zu wenigen Meshes zusammengefasst (vorher bis zu ~1180 Draw-Calls). Das ist für aktuelle Desktop-GPUs unkritisch. Auf schwachen Laptops hilft die Grafikstufe „Niedrig“.

## Spielzeit
Der Autopilot braucht für die gesamte Kampagne **27 Minuten reine Spielzeit** (1: 4,0 · 1·2: 2,8 · 2: 4,3 · 2·2: 1,9 · 3: 3,0 · 4: 3,6 · 4·2: 3,5 · 5: 3,9 Minuten). Er rennt unsichtbar die kürzesten Wege ab, schleicht nicht, wartet keine Patrouillen ab, stirbt nie und liest Dokumente nicht. Das ist eine Untergrenze. Für menschliche Spieler ergibt sich daraus die Schätzung von etwa 1,5 bis 2 Stunden. Gemessen wurde das nicht.

## Grenzen der Tests
- Der Autopilot fährt feste Routen ab. Er **schleicht und weicht nicht wie ein Mensch aus**, deshalb liefen die vollständigen Routen mit Unverwundbarkeit. Ob Verfolgungen fair sind, wurde zusätzlich ohne Unverwundbarkeit (Kapitel 1) und über die Zeitabstände der Skripte geprüft. Ein Feinschliff der Balance durch echte Spieltests wird empfohlen.
- Die Bildrate wurde nicht auf echter Grafikhardware gemessen. Software-Rendering ist dafür nicht aussagekräftig.
- Klang und Musik wurden technisch geprüft (Laden, Abspielen), aber nicht angehört.
- Die Gamepad-Unterstützung ist nach dem Standard-Mapping der Gamepad-API implementiert, aber nicht mit echter Hardware getestet.
