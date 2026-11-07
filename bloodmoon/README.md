# BLOODMOON – Das Erbe der Finsternis

First-Person-Gothic-Fantasy- und Psychological-Horror-Spiel für den Browser.
Sami von Drakenfels erwacht nach achtzig Jahren in der Krypta unter seiner eigenen Burg – als Vampir, ohne Erinnerung, in einem Königreich, das ihn für tot hält.

Technik: Three.js (WebGL 2), TypeScript, Vite. Alle Grafiken, Texturen, Figuren, Musik und Geräusche werden zur Laufzeit prozedural erzeugt – es gibt keine fremden Assets und damit keine Lizenzfragen.

---

## Starten

```bash
cd bloodmoon
npm install
npm run dev            # Entwicklungsserver auf http://localhost:5173
```

Weitere Befehle:

| Befehl | Zweck |
|---|---|
| `npm run build` | Produktions-Build nach `dist/` (statisch hostbar, z. B. GitHub Pages) |
| `npm run build:single` | Eine einzige HTML-Datei nach `dist-single/index.html` (per Doppelklick spielbar) |
| `npm run preview` | Den Build lokal ausliefern |
| `npm run typecheck` | TypeScript-Prüfung |
| `npm run test:smoke` | Lädt headless alle sechs Kapitel und prüft auf Fehler (Dev-Server muss laufen) |
| `npm run voice:lines` | Exportiert alle Sprachzeilen für die Vertonung |
| `npm run voice:generate` | Vertont alle Zeilen mit ElevenLabs (API-Schlüssel nötig, siehe unten) |
| `npm run sfx:generate` | Erzeugt optionale Soundeffekte mit ElevenLabs |

Empfohlen: aktueller Chrome oder Edge am Desktop, Maus und Tastatur. Auf Smartphones und Tablets gibt es eine Touch-Steuerung (Gerät quer halten). Mit `?debug=1` in der Adresse gibt es eine Konsolen-API `window.BLOODMOON` (Kapitel springen, teleportieren, Fähigkeiten freischalten).

## Steuerung

| Taste | Aktion |
|---|---|
| W A S D | Bewegen |
| Maus | Umschauen |
| Shift | Sprinten |
| Strg / C | Schleichen (C schaltet um) |
| E | Interagieren, Dialog fortsetzen, Gegner überwältigen |
| Q | Gewählte Vampirfähigkeit einsetzen |
| 1 · 2 · 3 | Blutsicht · Nachtsicht · Schattenlauf direkt |
| Mausrad | Fähigkeit wählen |
| Linke Maustaste | Blutstoß (sobald erlernt) |
| R (halten) | Regeneration (sobald erlernt) |
| Tab | Inventar |
| J | Tagebuch (Aufgaben, Personen, Dokumente, Erinnerungen, Entscheidungen) |
| K | Fähigkeiten |
| Esc | Pause, Speichern, Laden, Einstellungen |

In Dialogen: W/S, Mausrad oder Mausbewegung zum Auswählen, E oder Linksklick zum Bestätigen, Zahlentasten für die direkte Wahl.

**Touch (Smartphone/Tablet, quer):** linke Bildschirmhälfte gedrückt halten und ziehen = gehen (weit nach vorn = sprinten), rechte Hälfte wischen = umschauen. Knöpfe für E (interagieren), Q (Fähigkeit), ⟳ (Fähigkeit wechseln), Schleichen, Inventar, Tagebuch, Fähigkeiten und Pause; Blutstoß und Heilen erscheinen, sobald erlernt. Dialogantworten werden direkt angetippt.

## Inhalt

**Sechs Kapitel**

1. **Das Erwachen** – Burg Drakenfels: Krypta, Beinhaus, Galerie, Arbeitszimmer, Kinderzimmer, Thronsaal, Torhaus.
2. **Das Dorf der Verdammten** – Rabenfurt: Dorfplatz, Häuser, Kapelle, Gruft; erste Begegnung mit İlyas.
3. **Der Wald ohne Morgen** – Schwarzer Forst: Grenzsteine, Wolfslager, Steinkreis, Wachturm; Bassem und der Wolfsbund.
4. **Die Kirche des Blutes** – Kathedrale von Ebon: Kapellen, Fensterrätsel, Bibliothek, Siegel; Mine.
5. **Die Rückkehr der Blutlinie** – Drakenfels erneut: Spieluhr, Rekonstruktion der Nacht, Anselms Chiffre, Ruf nach Bassem.
6. **Der Erste** – Abstieg unter die Burg, Schleifenkorridor, Prüfung der zwei Ysoldes, Wolfshöhle, das Herz.

**Drei Enden:** *Das Ende der Blutlinie*, *Die Herrschaft der Nacht* und *Der wahre Erbe*. Welche Enden im Finale wählbar sind, hängt von deinen Entscheidungen, Beziehungen, gefundenen Erinnerungen und Gegenständen ab. Das wahre Ende braucht die zweite Strophe des Liedes vom Mondbrunnen und mindestens zwei von drei Vorbereitungen (Schlafdorn, Anselms entschlüsselter Bericht, Bassem als Verbündeter). Der Epilog fasst deine Entscheidungen zusammen.

**Systeme:** Vampirfähigkeiten (Blutsicht, Nachtsicht, Schattenlauf, Bluterinnerung, Blutdurst als Ressource mit Folgen in Dialogen), begrenzter Kampf (Überwältigen, Blutstoß, Ausweichen), Aufgaben, Inventar, Tagebuch, verzweigte Dialoge mit Beziehungswerten (Mine, Bassem, İlyas), Entscheidungsprotokoll, Rätsel mit logischen Hinweisen und Rückmeldung bei Fehlversuchen, Horror-Regie mit gezielt gesetzten Schreckmomenten, Autosave an Kontrollpunkten plus drei manuelle Speicherplätze, Einstellungen (Lautstärken, Maus, Sichtfeld, Grafikqualität, Helligkeit, Untertitel, Kopfwippen).

## Vertonung mit ElevenLabs

Ohne Sprachdateien läuft das Spiel vollständig mit Untertiteln; Figuren bewegen trotzdem Lippen und Mimik. Sobald Sprachdateien vorhanden sind, spielt das Spiel sie automatisch ab.

```bash
cd bloodmoon
npm run voice:lines                          # erzeugt tools/voice/lines.json (≈ 400 Zeilen, ≈ 36 000 Zeichen)
ELEVENLABS_API_KEY=dein_schluessel npm run voice:generate
# optional: nur ein Kapitel / nur ein paar Zeilen zum Probehören
ELEVENLABS_API_KEY=... npm run voice:generate -- --only=ch1 --limit=20
```

- Die Stimmen pro Figur stehen in `tools/voice/voices.json` (Modell `eleven_multilingual_v2`, Deutsch). Die dort eingetragenen Stimmen-IDs sind Beispiele aus der ElevenLabs-Bibliothek – ersetze sie durch Stimmen aus deinem Konto, wenn du andere Klangfarben willst.
- Die Dateien landen in `public/assets/audio/voice/` und werden in `manifest.json` eingetragen. Bereits erzeugte Zeilen werden beim nächsten Lauf übersprungen.
- `npm run sfx:generate` erzeugt zusätzlich Geräusche (Türen, Heulen, Glocke …) über die Sound-Generation-API; sie ersetzen dann die synthetischen Klänge.

## Projektaufbau

```
src/
  core/        Spielschleife, Zustand, Einstellungen, Eingabe, Ereignisse
  graphics/    Renderer, Nachbearbeitung, prozedurale Texturen und Materialien, Licht-Pool, Effekte
  world/       Levelbasis, Kollision (BVH), Baukästen für Architektur/Natur/Dorf/Requisiten, sechs Kapitel
  characters/  Prozedurale Figuren mit Skelett, Kopf mit Mimik und Lippenbewegung, Kreaturen
  player/      Steuerung, Interaktion, Fähigkeiten
  gameplay/    Kampf, Inventar, Aufgaben
  story/       Dialogsystem, Story-Ablauf, Beziehungen, Enden; data/ enthält alle Texte
  horror/      Horror-Regie und Ereignisse
  audio/       Synthese, Raumklang, Ambiente, Musik, Sprachwiedergabe
  ui/          Menüs, HUD, Tagebuch, Inventar, Dialog- und Rätselfenster
  save/        Speichern und Laden (localStorage)
tools/voice/   ElevenLabs-Vertonung
tests/         Smoke-Test und Playwright-Hilfsskripte
```

## Getestet

Automatisiert in headless Chromium (Software-Rendering über SwiftShader):

- Hauptmenü, Laden aller sechs Kapitel ohne Konsolenfehler (auch im Produktions-Build), Speichern/Laden.
- Kapitel 2 und 3: Gespräche in Rabenfurt, Kapelle und Falltür; Grenzsteine bis zum Abrieb.
- Touch-Steuerung im Handy-Emulator (Querformat 844 × 390): Gehen, Umschauen, Knöpfe, Menü-Layout.
- Kapitel 1: Truhenrätsel (falsche Kombination mit Hinweis, richtige Kombination), Ruprecht-Dialog.
- Kapitel 4: Rituale, Mine-Dialog mit Beziehungsänderung, Fensterrätsel (falsche Reihenfolge setzt zurück), Tagebuch, Siegel mit Mines Blut.
- Kapitel 5: Spieluhr-Melodie, Rekonstruktion der Nacht inklusive falscher Erinnerung, Anselms Chiffrierscheibe – jeweils mit Fehlversuch und Lösung.
- Finale: alle drei Enden erreichbar; das wahre Ende zeigt ohne Voraussetzungen einen Hinweis, was fehlt.

## Ehrliche Einschätzung des Entwicklungsstands

- **Figuren:** prozedural modelliert und animiert (Skelett, Mimik, Lippenbewegung). Sie wirken stilisiert, eher wie bemalte Holzfiguren als wie handmodellierte Charaktere. Für echte Produktionsqualität bräuchte es modellierte und geriggte Figuren (z. B. Blender, Lizenz geklärt) und Motion-Capture-Animationen.
- **Spielzeit:** Die sechs Kapitel sind vollständig spielbar, aber deutlich kürzer als die angestrebten 4–6 Stunden (je nach Spielweise eher 1,5–2,5 Stunden).
- **Vertonung:** Die Pipeline ist fertig, die Sprachdateien selbst sind noch nicht erzeugt – dafür werden ein ElevenLabs-Konto und ein API-Schlüssel gebraucht.
- **Testabdeckung:** automatisiert nur in headless Chromium mit Software-Rendering. Ein Durchlauf auf echter Grafikkarte in Chrome und Edge sowie ein vollständiger manueller Durchlauf von Anfang bis Ende stehen noch aus; Bildrate und Feinabstimmung der Helligkeit können auf echter Hardware anders ausfallen.
- **Eingabe:** ausgelegt auf Maus und Tastatur am Desktop. Die Touch-Steuerung ist eine einfache Ergänzung, getestet nur im Handy-Emulator von Chromium; auf echten Geräten können Bildrate und Bedienung abweichen (schwächere Handys: Grafikqualität „niedrig“ wählen).

## Nächste Schritte

1. Vertonung erzeugen und Lautstärken/Abstände der Sprachausgabe abmischen.
2. Manueller Komplettdurchlauf auf Desktop-Hardware (Chrome und Edge), Helligkeit und Schwierigkeit feinjustieren.
3. Figuren durch modellierte Charaktere ersetzen (Schnittstelle `Character` kann beibehalten werden).
4. Kapitel um Nebenpfade, zusätzliche Begegnungen und Dokumente erweitern, um die Ziel-Spielzeit zu erreichen.
5. Touch-Steuerung auf echten Geräten testen und verfeinern (z. B. Empfindlichkeit, Knopfgrößen).
