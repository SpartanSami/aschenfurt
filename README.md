> ## 🆕 Ebenfalls in diesem Repository: **NO WAY OUT**
> Ein First-Person-Survival-Horror-Spiel in 3D (Browser, three.js): fünf Kapitel, Zombie-KI, Verstecken statt Kämpfen, Smartphone, drei Enden.
> → Ordner [`no-way-out/`](no-way-out/README.md) · Direkt spielen: `no-way-out/NoWayOut.html` öffnen.

---

# 🌒 ASCHENFURT – Akte Nachtgrau

Ein tiefgründiges, textbasiertes Fantasy-Detektivspiel: interaktiver Krimi × Messenger-Spiel × Rollenspiel × düstere Urban-Fantasy-Serie.

**Vollständig kostenlos. Keine Paywalls, keine Energie-Systeme, keine gekauften Hinweise, keine Werbung. Alle Inhalte, Modi, Hinweise und Enden sind frei zugänglich.**

---

## ▶️ Spielen

**Einfach `index.html` doppelklicken** – das Spiel läuft komplett offline im Browser (Chrome, Edge, Firefox).
Speicherstände bleiben lokal auf deinem Gerät (localStorage des Browsers).

> Tipp: Lege dir eine Verknüpfung an oder öffne die Datei am Handy/Tablet über einen lokalen Webserver, wenn du unterwegs spielen willst.

---

## 🕵️ Was dich erwartet

- **Charaktererstellung:** 8 alte Berufe (Ex-Polizist, Monsterjäger, Forensiker, Okkultist, Journalist, Ex-Krimineller, Ex-Staatsanwalt, Medium) mit eigenen Lösungswegen, 8 persönliche Geheimnisse (alle werden in der Hauptstory relevant!), 7 moralische Kodizes.
- **3 vollwertige Fälle + Finale**, verbunden durch eine durchgehende Verschwörungs-Hauptstory:
  1. **Zähne der Nacht** – Ein Mord, der wie ein Werwolfangriff aussieht. Der Mond sagt etwas anderes.
  2. **Die Schwelle** – Ein Vampir auf dem Kamerabild, eine intakte Schwellenweihe. Beides kann nicht stimmen.
  3. **Was die Asche erinnert** – Ein Dämonenkreis, der Kulisse ist, eine Zeugin mit gefälschter Erinnerung – und ein Verrat aus den eigenen Reihen.
  - **Finale: Die stille Stadt** – Wahrheit, Gerechtigkeit oder Frieden? Deine gesammelten Beweise, Verbündeten und Beziehungen entscheiden, welches Ende du erreichen kannst.
- **Ermittlungssysteme:** Messenger mit Antwortoptionen & freier Texteingabe, Tatort-Untersuchungen, Verhöre mit Tonarten/Beweisvorlage/Widerspruchs-Konfrontation, Beweiswand zum Verbinden von Hinweisen, automatische Timeline, durchsuchbare Datenbank, Fantasy-Regelbuch als Ermittlungswerkzeug, Theorie-Board.
- **Konsequenzsystem:** NPC-Gedächtnis, Fraktions-Ruf (Polizei, Konvent, Rudel, Zirkel, Orden, Basar, Presse, Rathaus, Stiftung), sofortige/verzögerte/versteckte Folgen, vorbereiteter Verrat, mehrere Enden pro Fall und ein dynamischer Epilog, der jede deiner Entscheidungen bilanziert.
- **Komfort:** spoilerfreies 5-Stufen-Hinweissystem, Widerspruchs-Scanner, offene-Fragen-Liste, automatische Zusammenfassungen, Kapitelrückblick, Kapitel-Rewind, 3 Speicherslots + Autosave + Export/Import, Dark/Hell-Modus, Textgrößen, Lesemodus ohne Animationen, durchsuchbare Chats & Fallakte.
- **3 Schwierigkeitsgrade** (Story / Detektiv / Meisterdetektiv) – alle vollständig und kostenlos.

---

## 🏗️ Architektur (für Neugierige)

| Schicht | Umsetzung |
|---|---|
| **Canon-Layer** | Feste Fallwahrheiten in `js/data_fall*.js` – Täter, Motiv, Methode, Tatzeit und falsche Fährten sind unveränderlich. |
| **State-Layer** | Serialisierbarer Spielzustand in `js/engine.js` (Entscheidungen, Hinweise, Beziehungen, Ruf, Flags). |
| **Drama-Layer** | Storylets (`wenn`/`dann`-Ereignisse), die nur bei erfüllten Bedingungen feuern – jeder Verrat ist über mehrere Kapitel vorbereitet. |
| **Validation** | Inhalte sind ausschließlich autorisiert: NPCs können nur sagen, was im Canon steht; Beweise können nicht erfunden werden; Fantasy-Regeln gelten konsequent. |

Reines HTML/CSS/JavaScript ohne Abhängigkeiten – kein Build, kein Server, kein Tracking.

---

## ⚖️ Fairness-Versprechen

- Jeder Fall ist logisch lösbar; der Täter kommt nie aus dem Nichts.
- Jeder Hauptbeweis hat mindestens zwei Wege (Beruf, NPC-Hilfe, Datenbank, Storylet).
- Keine frühe Entscheidung führt in eine Sackgasse – aber viele haben einen Preis.
- Falsche Fährten klären sich auf, Verrat hat Motive, und das Ende folgt nachvollziehbar aus deinen Entscheidungen.

*„Diese Geschichte ist so passiert, weil du so entschieden hast.“*
