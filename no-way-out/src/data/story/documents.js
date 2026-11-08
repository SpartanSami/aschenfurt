// Storydokumente. Markup: Absätze durch Leerzeile, "# " Zwischenüberschrift, "> " Zitat,
// **fett**, ~~durchgestrichen~~, [[geschwärzt]]. kind: file | email | note | log | screen
export const DOCS = {
  // ---------------- Kapitel 1 ----------------
  c1_akte: {
    title: 'Patientenakte – Untersuchung 3', where: 'Klemmbrett · Station 3', kind: 'file',
    body: `Name: [[Sami Yıldız]]
Geburtsdatum: [[14.03.1992]]
Aufnahme: Mo., 10.11., 04:02 Uhr – ohne Personalien

Geführt als: **PROBAND 017** (Übernahme Halden-Institut, Sektion B)

# Befund
Bewusstlos, Vitalwerte stabil. Pupillen verzögert lichtreagibel. Keine Biss- oder Kratzverletzungen. Auffällige Blutwerte (siehe Anlage – fehlt).

# Anordnung
Sedierung nach Anweisung Dr. M. A. Patient **nicht** in das Kliniksystem eintragen. **Nicht** an den Sicherheitsdienst NEXARA melden.

> Handschriftlich am Rand:
Er darf auf keinen Fall nach unten. Wenn er aufwacht: Telefon liegt bereit. Es tut mir leid. – M.`,
  },
  c1_dienstplan: {
    title: 'Übergabeprotokoll Station 3', where: 'Stationszimmer', kind: 'file',
    body: `Nachtdienst Mo./Di. 10./11.11.

03:30 – Hausalarm. Ärztliches Personal in die Notaufnahme abgezogen.
03:52 – Zi. 302/304: Patienten verlegt.
04:10 – Neuaufnahme Untersuchung 3, ohne Namen. Dr. Aksoy (Gastärztin Halden-Institut) versorgt selbst. Wirkt völlig aufgelöst.
04:40 – **Zi. 303: Hr. Lindner gebissen**, hochaggressiv, nicht mehr ansprechbar. Fixierung gerissen. Tür von außen abgeschlossen. **NICHT ÖFFNEN.**
05:15 – Quarantäne durch Krisenstab. Treppenhäuser verriegelt.
05:20 – Kerstin + ich nehmen den Weg über ITS und OP. Gott steh uns bei.`,
  },
  c1_aushang: {
    title: 'Aushang: Quarantänemaßnahme', where: 'Wartebereich · Pinnwand', kind: 'file',
    body: `# Stadt Varnheim – Gesundheitsamt
Allgemeinverfügung zur Absonderung (§ 28, § 30 Infektionsschutzgesetz)

Für das Klinikum St. Elisabeth einschließlich aller Neben- und Untergeschosse wird mit sofortiger Wirkung die **Absonderung** angeordnet. Das Verlassen des Gebäudes ist untersagt.

Personen mit Biss- oder Kratzverletzungen sind **unverzüglich** zu isolieren. Der Kontakt zu Erkrankten ist zu vermeiden.

Die Evakuierung erfolgt ausschließlich über die vom Krisenstab benannten Kontrollpunkte.

> Darunter mit Kugelschreiber: „Wann denn??? Wir warten seit 2 Tagen“`,
  },
  c1_kerstin: {
    title: 'Zettel im Spind', where: 'Umkleide', kind: 'note',
    body: `Jana,

falls du das liest: Ich nehme den Weg über den OP-Trakt zum Lastenaufzug. Meine Karte liegt auf der Bank – meine Ersatzkarte habe ich dabei.

Die Leute aus dem Keller – NEXARA – haben Montagnacht einen Mann raufgebracht. Ohne Namen, nur eine Nummer. Die Ärztin, die bei ihm war, hat geweint. Sie hat ihn „Sami“ genannt, als sie dachte, es hört keiner zu.

Dann kamen die anderen. Die, die beißen.

Pass auf dich auf.
K.`,
  },
  c1_lieferschein: {
    title: 'Lieferschein (Kühlkette)', where: 'Sterilgut-Lager · OP-Trakt', kind: 'file',
    body: `NEXARA Pharma AG – Standort Halden-Institut (U3)

Lieferung: **EVE-2b, Charge 7**, 12 Einheiten à 2 ml, Kühlkette –80 °C
Empfänger: Klinikum St. Elisabeth, OP-Trakt (Durchreiche)
Verwendung: Studie EVE Phase II, Applikation 013–020

Vermerk: Transport **ausschließlich** über den Lastenaufzug. Keine Erfassung im Kliniksystem. Rücklauf leerer Behälter an Sektion B.

Freigabe: Dr. H. Arendt (Projektleitung)`,
  },
  c1_wachbuch: {
    title: 'Wachbuch Sicherheitsdienst', where: 'Sicherheitsbüro', kind: 'log',
    body: `Nacht 10./11.11.

03:17 Alle Kameras U3 schwarz. Kein Signal, auch NEXARA-intern nicht.
03:21 Kameras wieder da. Alarm in „Sektion C“ – kennen wir nicht, haben wir keinen Zugriff drauf.
03:26 Lastenaufzug fährt von allein nach oben. Leer?
03:40 Erste Verletzte in der Notaufnahme. Bisswunden.
04:02 Zwei NEXARA-Leute bringen eine Liege rauf. Ohne Papiere. Ärztin dabei.
04:55 Krisenstab übernimmt. Wir sollen bleiben und „sichern“.

Mi 12.11.
Strom im OP-Trakt weg. Notstrom nur noch hier im Büro.
Bergmann ist gebissen worden. Er sagt, es geht ihm gut.

Do 13.11.
Bergmann sagt nichts mehr.`,
  },
  c1_notstrom: {
    title: 'Bedienanleitung Netzersatzanlage NEA-2', where: 'Technikraum', kind: 'file',
    body: `Bei Netzausfall:
1. Hauptschalter auf „NOT“.
2. Starttaste gedrückt halten, bis der Motor gleichmäßig läuft.
3. Versorgt: Versorgungsflur, OP-Trakt, **Lastenaufzug U3**.

**Achtung:** Die Anlage ist im Betrieb sehr laut. Beim Anlauf wird automatisch der Hausalarm ausgelöst.`,
  },
  c1_tv: {
    title: 'Laufband: Regionalnachrichten', where: 'Fernseher · Wartebereich', kind: 'screen',
    body: `+++ EILMELDUNG +++ Klinikum St. Elisabeth weiträumig abgeriegelt +++ Krisenstab: „Lage unter Kontrolle“ +++ Anwohner im Umkreis von 2 km zum Verbleib in den Wohnungen aufgefordert +++ NEXARA Pharma AG weist Berichte über einen Zwischenfall in Forschungseinrichtung zurück +++ Bundeswehr unterstützt mit ABC-Abwehrkräften +++ Evakuierung über Kontrollpunkt Nord (Alte Brücke) +++`,
  },
};
