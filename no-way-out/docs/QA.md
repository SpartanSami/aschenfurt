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
| **Gesamte Kampagne am Stück** (alle acht Abschnitte, Zustand wird übernommen) | ✅ 1 → 1·2 → 2 → 2·2 → 3 → 4 → 4·2 → 5: Aufnahmen 1–5 gesammelt, Serum gefunden und weitergegeben, Begleiter übernommen, Geheimnis-Ende erreicht. Keine Skript- oder Laufzeitfehler (Produktions-Build). Nach der Überarbeitung (Raumdetails, Kriecher, Karte, Statistik) erneut vollständig bestanden. |
| Kapitel 1, Teil 2 **ohne** Unverwundbarkeit | ✅ **vollständig mit 100 % Gesundheit**: geduckt hinter der Theke, Flucht vor dem Wartezimmer, Brandschutztür, im Keller in der Wäscherei und im Büro den Wachmann abgewartet, Karte genommen, sofort zum Aufzug gerannt. |
| Kapitel 2·2 und 4·2 **ohne** Unverwundbarkeit | ⚠️ Der Bot stirbt in den Schleichpassagen (Leitungsgang, Modegeschäft), weil er feste Wege abläuft und weder Dampfstöße abwartet noch Wanderern ausweicht. Die Läufe deckten aber echte Platzierungsfehler auf, die behoben sind (siehe unten). |
| Touch-Steuerung (iPad-Emulation, echte Touch-Gesten) | ✅ Stick bewegt, Wischen dreht die Sicht, Handy öffnen/schließen über das Kontext-Steuerkreuz, Pause und Weiterspielen, Knopfnamen in Hinweisen („Benutzen“) |
| Start auf Geräten mit 48 kHz (Android-Emulation, Hoch- und Querformat) | ✅ nach Fehlerbehebung |
| Ton: Freigabe beim ersten Antippen, stumm in der Pause, wieder an nach Fortsetzen | ✅ (Chromium; iOS-Stummmodus und Unterbrechungen nur nach Spezifikation umgesetzt, nicht am Gerät geprüft) |
| Einzeldatei `NoWayOut.html` per file:// | ✅ neue Abschnitte laden, alle 46 Sprachaufnahmen eingebettet |
| Tod → Todesbildschirm → „Weiter vom Checkpoint“ | ✅ |
| Fortsetzen nach Neuladen der Seite (localStorage) | ✅ |
| Kapitelauswahl / Freischaltung / gesehene Enden | ✅ |
| Schwierigkeitsgrade: Heilmittel im gesamten Spiel (acht Abschnitte) | ✅ siehe Zahlen am Ende dieser Tabelle (nach der Erhöhung) |
| Zombie-KI: Geräusch → Untersuchen → Verdacht → Alarm → Verfolgung → Angriff → Packen → Losreißen | ✅ |
| Tür einschlagen, Suche, Rückkehr, Versteck prüfen | ✅ |
| Heilen, Telefon-Apps, Dokumente, Sprachaufnahmen laden | ✅ |
| Pause per P (zuvor nur Esc) | ✅ nach Fehlerbehebung |
| Schwierigkeitsgrad im Haupt- und Pausemenü ändern (wirkt sofort, auf den Spielstand und alle Kapitelstarts) | ✅ per Mausklick im Browser geprüft |
| Entscheidungen per Tastatur (W/S + E) | ✅ |
| Kontaktperson über Kamera-Einblendung (Kap. 1), ARGUS-Monitor und Lautsprecher (Kap. 2), Sprachnachricht (Kap. 3) | ✅ |

## Überarbeitung (Grafik, Details, Animationen, Karten)

| Prüfung | Ergebnis |
|---|---|
| Lichtkegel mit Schwebstaub | ✅ Bildschirmfotos im Krankenhausflur: Staub leuchtet nur im Strahl, endet an der Wand. Der Lichtschaft ist bewusst schwach und vor allem schräg von der Seite sichtbar. |
| Farbgebung im Schluss-Shader | ✅ Bildschirmfotos aller Testansichten, keine Shader-Fehler |
| Raumdetails in allen acht Abschnitten | ✅ alle Abschnitte bauen fehlerfrei auf (Gesamtdurchlauf), z. B. Kapitel 1: 391 Details, 1·2: 231, 4: 295. Draw-Calls Krankenhausflur (Mittel): 493 |
| Karten-App | ✅ deckt Räume und Sichtlinie auf, zeigt Türen in drei Farben, Gegenstände, Raumnamen und Blickrichtung. Wird im Checkpoint gespeichert (Bitfeld). Zoom mit A/D bzw. ◀ ▶ |
| Kriecher (neuer Zombietyp) | ✅ Platzierung auf begehbaren Zellen in 1·2, 2·2 und 4. In 1·2 schläft er bis zur Flucht mit der Karte und wacht erst beim Betreten des Westteils auf (geprüft: ohne Karte bleibt er liegen, mit Karte verfolgt er). Packen funktioniert, der Kopf ist trefferfähig. |
| Treffer- und Todesanimation, Blutlache, Einschusslöcher | ✅ Bildschirmfotos: Körper kippt nach hinten weg vom Schützen, Blutlache wächst. Waffentest unverändert bestanden (4 Körpertreffer, Kopfschuss, Nachladen, Wand blockiert, Elif geschützt, Trockenschuss, Speichern) |
| Schnelle Wende (V) | ✅ dreht genau 180° in 0,32 s |
| Statistik und Rang | ✅ Spielzeit läuft nur im Spiel, ein Tod zählt und wird sofort gespeichert, Auswertung mit Rang erscheint im Endbildschirm (Bildschirmfoto) |
| Dynamische Auflösung | ✅ Logik mit simulierter Uhr geprüft: bei 25 fps nach gut 6 s auf 60 %, bei 60 fps schrittweise zurück. ⚠️ Im Testbrowser selbst nicht live messbar, weil der Headless-Browser ruckweise rendert (lange Pausen, dazwischen 60 fps). |
| Animations-LOD | ✅ Gesamtdurchlauf ohne Auffälligkeiten; ferne Zombies werden mit aufsummierter Zeit animiert |

## Runde „Lesbarkeit, Steuerung, Fehler im Keller“

| Prüfung | Ergebnis |
|---|---|
| Bildschirmanzeige (HUD) überhaupt sichtbar | ✅ nach Fehlerbehebung. Bildschirmfotos auf Desktop, Smartphone quer und hoch: Ziel, Untertitel, Hinweise, Nachricht, Anruf, Losreißen, Entscheidung, Kapiteltitel, Leben/Ausdauer, Munition |
| Lastenaufzug im Keller (Kap. 1·2) mit Karte öffnen – **über die echte Zielsuche des Spielers** | ✅ |
| Kurier: Karte kommt mit, egal ob zuerst Auftrag, Munition oder Karte genommen wird | ✅ (Skript), Karte wird außerdem beim Darüberlaufen aufgenommen |
| Kapitelanfang nach frühem Tod / über die Kapitelwahl (alle acht Abschnitte einzeln gestartet) | ✅ Einstieg läuft vollständig, Aufzug in Kapitel 2 öffnet |
| Alle Interaktionen der Routen über die echte Zielsuche (Blick, Reichweite, Sichtlinie) | ✅ nach Anpassung der Routen (der Testpilot muss jetzt wie ein Mensch nah genug herangehen) |
| Schilder und Bildschirmtexte | ✅ Schrift wird eingepasst, lange Texte umbrechen (Bildschirmfotos Notaufnahme, Haupteingang, Keller) |
| Touch quer und hoch (Pixel-7-Emulation, echte Tipp-Gesten) | ✅ sichtbar sind nur Zielen, Ducken, Lampe, Handy, Benutzen (+ Heilen/Laden bei Bedarf). Zielen an → großer Knopf „Schießen“ → Schuss (17 → 16) · Zielen aus → „Benutzen“ · Laden · Heilen · Ducken · Doppeltipp = 180° · alle Knöpfe vollständig im Bild |
| Große Handy-Ansicht | ✅ öffnet, 8 Apps, Nachrichtenverlauf mit 16-px-Schrift, Karte mit Zoom-Knöpfen, Zustand, Schließen; Dokumente mit ✕ und „Schließen“ |
| Zusätzliche Fundstücke (je Abschnitt 2 × Munition, 2 × Verband) | ✅ automatisch geprüft: freie Bodenzelle am Wegesrand, nicht in oder hinter Möbeln (ein Platz hinter einem Mülleimer wurde verschoben) |
| Aufleuchten der Fundstücke | ✅ Bildschirmfotos mit und ohne Taschenlampe |
| Heilmittel im gesamten Spiel nach der Erhöhung | ✅ Leicht 55 · Mittel 46 · Schwer 22 (vorher 39 · 30 · 14) |
| Munition im gesamten Spiel nach der Erhöhung (Mittel) | ✅ 32 Schachteln, zusammen rund 370 Schuss mit der Startmunition (vorher rund 210); Leicht ×1,5, Schwer ×0,6 |
| Abschlusstests mit dem Produktions-Build | ✅ **gesamte Kampagne am Stück** (alle acht Abschnitte, 34,3 Minuten Autopilot-Spielzeit, Geheimnis-Ende, keine Fehler, 0 nicht anwählbare Interaktionen), QA-Skript, Waffentest |
| Ausgelieferte Dateien (Einzeldatei und Artefakt-Seite) auf emuliertem Android-Handy | ✅ quer: neues Spiel läuft, Anzeige sichtbar, Knöpfe Ducken · Lampe · Handy · Benutzen · hoch: Hinweis „Bitte das Handy quer halten“ und Pause · zurück quer: Hinweis weg, Weiterspielen |

## Behobene Fehler (Auswahl)
- **Die gesamte Bildschirmanzeige war seit der ersten Version unsichtbar.** Ziel, Untertitel, Bedienhinweise, Nachrichten- und Anrufhinweis, „Losreißen!“, Entscheidungen und Kapiteltitel wurden berechnet, aber nie gezeigt: Die Grundregel im Stylesheet lautete „display: none“, und das Einblenden setzte nur einen leeren Wert. Aufgefallen ist es nie, weil alle Tests die Logik prüften (z. B. „Text des Hinweises stimmt“) und kein Test nachsah, ob der Text wirklich auf dem Bildschirm steht. Jetzt gibt es dafür Bildschirmfotos aller Anzeigen.
- **Der Lastenaufzug im Keller (Kapitel 1·2) ließ sich von Spielern nicht benutzen.** Aufzugtüren waren von der Zielsuche ausgenommen, der Testpilot öffnete die Tür aber direkt. Verriegelte Aufzüge und Rolltore lassen sich jetzt ansehen (der Grund wird angezeigt) und mit der passenden Karte öffnen. Der Testpilot benutzt für alle Interaktionen dieselbe Zielsuche wie ein Spieler.
- **Kapitelanfang als Sackgasse:** In Kapitel 2, 3, 4 und 5 enthielt der Start-Speicherstand schon den Merker „Einstieg gelaufen“. Wer vor dem nächsten Checkpoint starb oder das Kapitel über die Kapitelwahl öffnete, bekam keinen Einstieg mehr; in Kapitel 2 blieb die Aufzugtür zu. Der Start-Speicherstand wird jetzt vor dem Einstieg angelegt, ältere Speicherstände werden bereinigt.
- Gegenstände auf hohen Möbeln (z. B. Diktiergerät 4) ließen sich nur genau von vorn anwählen. Möbel versperren den Griff nicht mehr, nur Wände, geschlossene Türen und Glas. Dinge am Boden sind aus etwas größerer Entfernung erreichbar, auf Touch-Geräten ist der Blickwinkel großzügiger.
- Der Kriecher in der Werkstatt (Kapitel 2·2) kroch auf Dampfgeräusche zu und verstopfte die Tür. Er liegt jetzt reglos in der hinteren Ecke und erwacht erst, wenn das Wartungsbuch gelesen ist.
- Schilder: Die Schrift war fest eingestellt und ragte bei langen Texten über den Rand. An den schmalen Kanten der Schilder erschien die Beschriftung außerdem als gestauchter Streifen.
- **Spielbarer Link und `NoWayOut.html` starteten nicht** („Das Spiel konnte nicht gestartet werden“, Android-Handy). Ursache war das Build-Werkzeug: Beim Einbetten des Codes in die Einzeldatei wurde die Zeichenfolge „$&“ im minifizierten three.js-Code als Platzhalter gelesen und durch ein HTML-Stück ersetzt. Das beendete das Skript mitten im Code. Ob die Zeichenfolge entsteht, hängt von der Benennung beim Minifizieren ab. Deshalb lief es vorher zufällig, nach der Überarbeitung nicht mehr. Getestet war nur die Projektversion (`index.html`), nicht die Einzeldatei. Behoben: Der Code wird unverändert eingebettet, und der Build bricht ab, wenn die Einzeldatei vom Bundle abweicht. Geprüft: Einzeldatei und Artefakt-Seite starten auf einem emulierten Android-Handy (Pixel 7) ein neues Spiel ohne Fehler. Die alte Datei zeigt im selben Test genau die Fehlermeldung vom Handy.
- Der erste Kriecher lag direkt vor der Tür zur Pathologie. Der Autopilot blieb hängen, ein Mensch wäre dort eingekeilt worden. Er liegt jetzt im Westteil des Kellerflurs und wacht erst auf der Flucht auf; an der Südwand kommt man vorbei.
- Ein schlafender Kriecher wurde beim Laden in die Stehhaltung gesetzt. Behoben.
- Beim Kapitelwechsel konnte eine abgebrochene Wartezeit (z. B. ein Satz, auf dessen Ende kein Skript wartete) als „unbehandelter Fehler“ in der Konsole landen. Wartezeiten sind jetzt immer abgefangen, wartende Skripte bekommen den Abbruch weiterhin.
- Die dynamische Auflösung maß zuerst die gedeckelte Spielzeit statt der echten Zeit und reagierte dadurch nicht zuverlässig. Sie misst jetzt echte Zeit und beginnt nach Pausen neu.
- Requisiten, die ihre Höhe selbst setzen (Rohre, Schilder, Fernseher, OP-Lampen), wurden doppelt angehoben und hingen teils in der Decke oder im Boden. Ihre Höhe gilt jetzt relativ zum örtlichen Boden.
- Schild- und Bildschirmtexte wurden über breite Flächen gekachelt („ELEKTRO MAX ELEKTRO MAX …“) bzw. abgeschnitten. Beschriftete Flächen werden jetzt eingepasst.
- Wurde die Pause nicht über Esc ausgelöst, konnte der Mauszeiger gefangen bleiben, und Klicks landeten im 3D-Bild statt auf den Menüknöpfen. Die Pause gibt den Zeiger jetzt immer frei.
- Ausgewogenheit der neuen Abschnitte nach Läufen ohne Unverwundbarkeit: Im Pumpwerk stand ein Wanderer direkt am Startpunkt, im Modegeschäft blickten drei Lauerer auf den einzigen Weg (einer zwei Meter neben dem Eingang), im Keller schnitt der Wachmann den Fluchtweg zum Aufzug ab, und ein Rollwagen sowie ein Rollstuhl blockierten Laufwege. Alles wurde versetzt bzw. gedreht.
- Wird der Mauszeiger vom Browser nicht eingefangen (z. B. in eingebetteten Fenstern), lässt sich jetzt mit gedrückter Maustaste umsehen. Ein Hinweis erscheint automatisch.
- iPad: Das Spiel blieb auf dem Ladebildschirm hängen. Ursache war vermutlich der Speicher. Alle Oberflächen werden als Zeichenflächen erzeugt, schon Kapitel 1 belegte etwa 140–185 MB, im Laufe der Kampagne bis 360 MB. Safari begrenzt das auf 256–384 MB, dazu kam die volle Retina-Auflösung. Behoben: Zeichenflächen werden nach dem Hochladen freigegeben, Tablets nutzen kleinere Texturen und eine begrenzte Auflösung. Ein Fehler beim Laden zeigt jetzt eine Meldung statt eines endlosen Ladebildschirms.
- Zombie-Tempo (Wunsch nach Spieltest): Die Zombies rannten mit 3,0–3,25 m/s. Jetzt schlurfen sie mit 1,3–1,45 m/s, inszenierte Verfolger mit 1,75 m/s. Sami geht mit 2,3 m/s und schleicht mit 1,15 m/s. Die Laufanimation hat kürzere, schlurfende Schritte. Kapitel 1, 1·2 (ohne Unverwundbarkeit) und 5 laufen danach weiter fehlerfrei durch.
- Android-Handy (und wahrscheinlich auch das iPad): „Abschnitt konnte nicht geladen werden – The buffer sample rate of 44100 does not match the context rate of 48000 Hz“. Der Hall wurde mit 44,1 kHz erzeugt, viele Handys und Tablets laufen mit 48 kHz, und manche Browser lehnen das ab. Am Desktop-Testbrowser (44,1 kHz) fiel das nie auf. Behoben: Der Hall nutzt jetzt die Abtastrate des Geräts, und ein Tonfehler kann den Levelaufbau nicht mehr verhindern. Geprüft mit erzwungenen 48 kHz in einer Android-Emulation (Hoch- und Querformat).
- iPad ohne Ton: Web-Audio wird unter iOS/iPadOS nur aus einer Berührung heraus gestartet, bleibt nach Unterbrechungen aus und ist im Stummmodus stumm. Behoben: Freigabe bei jeder Eingabe, Audio-Sitzung „Wiedergabe“, stilles HTML-Audio für ältere iOS-Versionen.
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
Der Autopilot braucht für die gesamte Kampagne **rund 32 Minuten reine Spielzeit** (letzter Lauf nach der Überarbeitung, Produktions-Build: 1: 4,0 · 1·2: 3,3 · 2: 4,3 · 2·2: 4,9 · 3: 4,6 · 4: 3,9 · 4·2: 2,9 · 5: 3,9 Minuten; in 1·2 und 2·2 wartet er Patrouillen ab). Er rennt sonst unsichtbar die kürzesten Wege ab, stirbt nie und liest Dokumente nicht. Das ist eine Untergrenze. Für menschliche Spieler ergibt sich daraus die Schätzung von etwa 1,5 bis 2 Stunden. Gemessen wurde das nicht.

## Grenzen der Tests
- Der Autopilot fährt feste Routen ab. Er **schleicht und weicht nicht wie ein Mensch aus**, deshalb liefen die vollständigen Routen mit Unverwundbarkeit. Ob Verfolgungen fair sind, wurde zusätzlich ohne Unverwundbarkeit (Kapitel 1) und über die Zeitabstände der Skripte geprüft. Ein Feinschliff der Balance durch echte Spieltests wird empfohlen.
- Die Bildrate wurde nicht auf echter Grafikhardware gemessen. Software-Rendering ist dafür nicht aussagekräftig.
- Klang und Musik wurden technisch geprüft (Laden, Abspielen), aber nicht angehört.
- Die Gamepad-Unterstützung ist nach dem Standard-Mapping der Gamepad-API implementiert, aber nicht mit echter Hardware getestet.
