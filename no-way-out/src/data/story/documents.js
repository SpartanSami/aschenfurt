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
  // ---------------- Kapitel 2 ----------------
  // ---------------- Kapitel 1, Teil 2 ----------------
  c1b_triage: {
    title: 'Triage-Protokoll Zentrale Notaufnahme', where: 'Leitstelle Notaufnahme', kind: 'log',
    body: `Di., 11.11.

03:40 – 2 Pat. aus dem Halden-Institut (Haustechnik?), Bisswunden Unterarm, stark blutend. Kategorie GELB.
03:55 – Pat. 1 krampft, dann **Atemstillstand**. Reanimation erfolgreich?? Pat. beißt Pflegerin Johanna in die Schulter.
04:20 – 6 weitere Bissverletzungen. Fieber, Verwirrtheit, Aggression. Verdacht Tollwut – Labor sagt nein.
04:31 – Anruf NEXARA-Sicherheit (Dr. **K. Brenner**): Keine Meldung an das Gesundheitsamt. Betroffene „bis zur Abholung“ in den Wartebereich.
05:02 – Wartebereich voll. Tür von außen verriegelt. Die Leute schlagen gegen die Scheibe. Wir haben die Vorhänge zugezogen, damit wir sie nicht sehen müssen.
05:40 – Johanna antwortet nicht mehr. Sie liegt in Kabine 3 und sitzt manchmal auf.

> Darunter, andere Schrift:
Niemand holt sie ab. Niemand kommt.`,
  },
  c1b_patho: {
    title: 'Eingangsbuch Pathologie', where: 'Büro Pathologie · Keller', kind: 'file',
    body: `# Eingänge Halden-Institut (Sonderverfahren NEXARA)
Leichenschau entfällt. Totenschein wird **vorab** ausgestellt (Unterschrift Projektleitung, Dr. H. Arendt). Überführung durch NEXARA-Kurier.

| Prob. 004 – K., Thomas – Herzversagen – Leichnam: ~~eingegangen~~ **nicht eingegangen**
| Prob. 007 – S., Marta – Lungenembolie – Leichnam: **nicht eingegangen**
| Prob. 009 – [[Y., Elif]] – Herzversagen – Leichnam: **nicht eingegangen**
| Prob. 011 – B., Jonas – Hirnblutung – Leichnam: **nicht eingegangen**

> Notiz Dr. Wiese, 12.11.:
Seit Dienstag setzt bei den Toten aus der Notaufnahme keine Totenstarre ein. Ich habe die Kühlfächer verriegelt. Ich höre sie. Ich gehe nicht mehr runter.

Wer schreibt Totenscheine für Menschen, die nie bei uns angekommen sind?`,
  },
  c1b_kurier: {
    title: 'Auftrag – NEXARA Sicherheit', where: 'Tasche des Kuriers', kind: 'email',
    body: `Von: Dr. K. Brenner (Leitung Sicherheit)
An: Kurierdienst / R. Lenz
Gesendet: Mi., 12.11., 23:48
Betreff: Sicherstellung Material **017**

Lenz,

Sie holen **heute Nacht** sämtliche Proben und Unterlagen zu Proband 017 aus dem Kühlraum der Pathologie (Fach 12) und bringen sie nach U3. Die Zugangskarte ist bis 06:00 Uhr freigeschaltet.

Der Proband selbst ist seit dem Zwischenfall verschwunden. Falls Sie ihn sehen: **nicht ansprechen**, sofort melden. Er ist für das Unternehmen von höchstem Wert. Lebend.

Übergabe aller Funde am **Kontrollpunkt Nord**. Das Extraktionsteam ist informiert.

– B.`,
  },
  c2_eve: {
    title: 'PROJECT EVE – Projektübersicht (intern)', where: 'Labor B', kind: 'file',
    body: `NEXARA Pharma AG · Halden-Institut · VERTRAULICH

# Ziel
Kausale Therapie des **Kessler-Syndroms** (erbliche, progrediente Neurodegeneration, Letalität 100 %, Erkrankungsbeginn 25–45 J.).

# Ansatz
**E.V.E. – Endogene Vektor-Expression.** Ein modifizierter viraler Vektor schleust regenerative Gensequenzen in geschädigte Nervenzellen ein und regt deren Neubildung an.

# Status
Phase I (Probanden 001–012): signifikante Regeneration bis Monat 3.
Phase II (Probanden 013–020): Variante EVE-2b, laufend.

> Marktpotenzial bei Zulassung: geschätzt 4,2 Mrd. € p. a.`,
  },
  c2_phase1: {
    title: 'Laborbericht – Phase I, Monat 4', where: 'Labor B', kind: 'file',
    body: `Verfasser: Dr. H. Arendt / Dr. K. Brenner (Sicherheit)

Bei 11 von 12 Probanden setzt ab Woche 14 eine unkontrollierte Fortsetzung der Vektor-Expression ein. Interne Bezeichnung: **„Überschreibung“**.

Symptome: Verlust von Sprache und Gedächtnis, Persönlichkeitszerfall, gesteigerte Aggression, Hyperphagie. Vitalfunktionen bleiben auffallend stabil.

Mutation **EVE-2**: Übertragung durch Speichel und Blut nachgewiesen (Pflegekraft, Biss, Woche 16).

# Maßnahmen
Verlegung aller Überschriebenen nach **Sektion C**. Angehörige: Todesfall melden, Urnenbeisetzung über Partnerinstitut.
Keine Meldung an das Paul-Ehrlich-Institut. Fortsetzung mit Phase II.`,
  },
  c2_memo: {
    title: 'Aktennotiz Dr. Arendt', where: 'Büro Dr. Arendt', kind: 'email',
    body: `Von: Dr. Helena Arendt
An: Dr. Konrad Brenner
Betreff: Kosten Sektion C / Proband 017

Konrad,

die separate Notstromversorgung der Schleusen in Sektion C ist zu teuer. Wir koppeln die Verriegelung an ARGUS. Ausfallverhalten bitte auf **„offen“** – Brandschutzauflage, sonst bekommen wir keine Abnahme.

Zu 017: Die Blutwerte sind eindeutig. Er bildet Antikörper gegen die Überschreibung, ohne die Regeneration zu verlieren. Das ist das Produkt. **017 ist ab sofort als Wertanlage einzustufen** und verlässt das Institut nicht.

Die Amnesie (erwartet ab T+72 h) arbeitet für uns. Dr. Aksoy steht ihm zu nahe – behalten Sie sie im Auge.

H. A.`,
  },
  c2_elif: {
    title: 'Probandenblatt 009', where: 'Zelle 009', kind: 'file',
    body: `Probandin: **009** – Elif [[Yıldız]], 27 J.
Diagnose: Kessler-Syndrom, früher Beginn.
Phase I, Aufnahme vor 14 Monaten.

Verlauf: Regeneration bis Monat 3. Ab Woche 15 Überschreibung. Nicht mehr ansprechbar.

Angehörige: Bruder (Mitarbeiter NEXARA, IT). **Sterbeurkunde ausgestellt.** Bruder hat Akteneinsicht verlangt – abgelehnt.

> Handschriftlich: „Sie summt manchmal. Immer dieselbe Melodie.“`,
  },
  c2_017: {
    title: 'Probandenblatt 017', where: 'Zelle 017', kind: 'file',
    body: `Proband: **017** – Sami [[Yıldız]], 34 J.
Arbeitgeber: NEXARA Pharma AG, Systemarchitektur (ARGUS)
Teilnahme: **freiwillig** (Trägerstatus Kessler-Gen positiv)
Wirkstoff: EVE-2b, Applikation durch Dr. M. Aksoy

Befund: Einzigartige Immunantwort („017-Antwort“). Keine Überschreibung. Regeneration vollständig erhalten.
Nebenwirkung: Umbau Hippocampus. **Retrograde Amnesie erwartet ab T+72 h.**

Einstufung: ~~Proband~~ **WERTANLAGE** (Anweisung Dr. Arendt)

Bezugsperson: Dr. M. Aksoy – Zugang beschränken.`,
  },
  c2_argus: {
    title: 'ARGUS – Systemprotokoll', where: 'Serverraum · Terminal', kind: 'screen',
    body: `ARGUS 4.2 · Halden-Institut · Ereignisprotokoll

Mo 01:52  Skript **NACHVORNE** aktualisiert (Benutzer: s.yildiz)
Mo 03:17  ARGUS-Kern: **manuelle Abschaltung** – Wartungszugang Techniker 4471
Mo 03:17  Sektion C, Schleusen 1–6: Stromausfall → Ausfallverhalten OFFEN
Mo 03:21  ARGUS-Kern: Neustart
Mo 03:21  Sektion C: 11 Bewegungen außerhalb der Zellen
Mo 03:26  Lastenaufzug U3 → EG
…
Do 04:12  Gerät „Sami-Telefon“ im Netz ARGUS-GAST erkannt
Do 04:12  Skript NACHVORNE: Ausführung gestartet

> Prozess NACHVORNE · Status: aktiv · Besitzer: s.yildiz`,
  },
  c2_laptop: {
    title: 'Notiz auf einem Laptop', where: 'Serverraum', kind: 'screen',
    body: `Benutzer: idemir (Techniker 4471)

kopiert: /eve/phase1  /eve/phase2  /eve/017  (412 GB)
Ziel: externe Platte „DEFNE“

Notiz:
4 Minuten. Er hat gesagt, 4 Minuten reichen.
Daten gesichert. Was ist mit den Schleusen los??
Papa kommt nach Hause, Defne. Versprochen.`,
  },
  c2_badge: {
    title: 'Dienstausweis', where: 'Serverraum · am Boden', kind: 'file',
    body: `NEXARA PHARMA AG
**Dr. Helena Arendt**
Projektleitung EVE · Halden-Institut
Zugangsstufe: ROOT

> Der Ausweis klebt. Die Frau, die ihn getragen hat, steht drei Meter weiter zwischen den Servern.`,
  },
  c2_s17: {
    title: 'Etikett: S-17', where: 'Kühlraum B', kind: 'note',
    body: `S-17 – Hemmserum (aus Probe 017)
1 Dosis · i.v.

Wirkt nur bei **frischer** Infektion (< 6 h nach Biss).
Nicht an NEXARA übergeben.

– M.A.`,
  },
  c2_decon: {
    title: 'Dekontaminationsschleuse – Hinweis', where: 'Empfang', kind: 'file',
    body: `Zutritt zu den Laborbereichen nur nach vollständigem Dekontaminationszyklus.
1. Schleuse betreten. 2. Zyklus am Bedienfeld starten. 3. Nicht bewegen (ca. 5 Sekunden). 4. Innere Tür öffnet automatisch.

Bei Alarm: Schleusen verriegeln **automatisch** (Sterilisationsprotokoll).`,
  },
  // ---------------- Kapitel 2, Teil 2 ----------------
  c2b_wartung: {
    title: 'Wartungsbuch Pumpwerk U4', where: 'Werkstatt Haustechnik', kind: 'log',
    body: `Di., 11.11.
03:21 – Stromausfall Sektion C/U4. Pumpen P1–P3 aus. Notstrom springt nicht automatisch an (ARGUS-Fehler?).
04:05 – Becken 2 läuft voll. Wasser steht im Versorgungstunnel zum Parkhaus. Spätschicht (Kowalski, Brandt, Yilmaz, Peters) geht runter, Pumpen manuell anfahren.
04:40 – Kein Funkkontakt zur Spätschicht.

Mi., 12.11.
09:15 – Anweisung NEXARA-Sicherheit (Dr. Brenner): **Pumpen NICHT wieder anfahren.** Ebene U4 bleibt geflutet. Begründung: „Kontaminationsrisiko“.

> Darunter, mit Bleistift:
Kontamination? Da unten liegt alles, was aus Sektion C rausgeschwemmt wurde. Die wollen nicht, dass es jemand findet. – İ. D.`,
  },
  c2b_schicht: {
    title: 'Schichtbuch Schaltwarte', where: 'Schaltwarte Pumpwerk', kind: 'log',
    body: `Di., 11.11. – Spätschicht

04:12 – Warte besetzt (Peters). Notstrom bereit, Freigabe fehlt.
04:20 – Kowalski meldet: „Leute im Becken. Patienten? Laborkittel.“
04:26 – Brandt gebissen. Wir ziehen ihn raus.
04:31 – Brandt steht wieder auf.
04:33 – Kowalski und Yilmaz antworten nicht. Ich schließe das Schott.
04:50 – Wenn ich den Notstrom einschalte, geht der Alarm los. Dann wissen sie, wo ich bin.
05:10 – Sie kommen durch das Wasser`,
  },
  // ---------------- Kapitel 3 ----------------
  c3_zettel: {
    title: 'Zettel unter dem Scheibenwischer', where: 'Parkhaus · Ebene −3', kind: 'note',
    body: `Wir sind runter zur U-Bahn. Oben auf der Straße schießen sie. Die Soldaten sagen nichts, die schießen einfach.

Wenn du das liest, Thomas: Der Verbindungsgang auf −2 hat ein Rolltor. Ohne Strom geht es nicht auf.

Wir warten am Bahnsteig. Bis sechs.
– Anja & Leo`,
  },
  c3_ticket: {
    title: 'Dauerparkausweis', where: 'Kombi · Stellplatz 17', kind: 'file',
    body: `Parkhaus Am Klinikum · Dauerparker

Stellplatz: **−2 / 17**
Inhaber: S. Yıldız
Arbeitgeber: NEXARA Pharma AG (Halden-Institut)
Gültig bis: 31.12.

> Auf der Rückseite, Samis Handschrift: „M. – Samstag Ringe abholen. Nicht vergessen!!“`,
  },
  c3_funk: {
    title: 'Funkprotokoll (mitgeschrieben)', where: 'Kassenhäuschen', kind: 'note',
    body: `– Krisenstab an alle: Sektor Klinikum bleibt abgeriegelt.
– Evakuierung NUR über Kontrollpunkt Nord, Alte Brücke.
– 06:00 Uhr: **Protokoll ASCHE**. Danach keine Evakuierung mehr.
– „NEXARA-Team“ am Kontrollpunkt Nord?? Wer sind die??
– Jemand fragt nach „Wertanlage 017“. Hä?

(İlyas' Handschrift, darunter:) Defne – Kinderklinik Süd – Station 2 – NICHT im Sektor. Gott sei Dank.`,
  },
  c3_aushang: {
    title: 'Aushang Parkhausbetreiber', where: 'Parkhaus · Ebene −1', kind: 'file',
    body: `Sehr geehrte Kunden,

aufgrund der behördlichen Absperrung ist die Ausfahrt Ost bis auf Weiteres geschlossen. Die Schranken sind außer Betrieb.

Der Verbindungsgang zur U-Bahn-Station „Klinikum“ (Ebene −2, Süd) ist **nur bei Stromversorgung** über das Rolltor passierbar. Die Steuerung befindet sich im Kassenhäuschen.

Ihr Parkhausteam`,
  },
  // ---------------- Kapitel 4 ----------------
  c4_stoerung: {
    title: 'Störungsmeldung Stadtwerke', where: 'Betriebsraum · Station Klinikum', kind: 'log',
    body: `STADTWERKE VARNHEIM – U-BAHN
Mo 04:58  Linie U3: Zug 3117 auf Anweisung Krisenstab in Station „Klinikum“ angehalten.
Mo 05:10  Betrieb U3 vollständig eingestellt. Fahrgäste verbleiben im Zug (Quarantäne).
Mo 05:40  Kontakt zu Zug 3117 abgebrochen.
Di 09:12  Fahrstrom abgeschaltet. Tunnel Klinikum–Marktplatz: Zutritt verboten.
Mi 22:30  Notruf aus Zug 3117. Keine Worte. Nur Geräusche.`,
  },
  c4_zettel: {
    title: 'Notiz im Zug', where: 'Zug 3117', kind: 'note',
    body: `Für wen auch immer:

Herr Brandt aus Wagen 2 ist gebissen worden. Wir haben ihn hinten eingesperrt, aber die Tür hält nicht.

Wenn ich mich verändere: Lasst mich hier sitzen. Ich will nicht mehr laufen.

Sagt meiner Tochter, ich bin bis zum Schluss geblieben.
– R.`,
  },
  c4_plan: {
    title: 'Streckenplan U3', where: 'Stellwerk Marktplatz', kind: 'file',
    body: `U3: Klinikum – **Marktplatz** – Alte Brücke (gesperrt) – Nordstadt

Notausstieg Marktplatz: Treppe Stellwerk → Ausgang Lindenstraße.

> Mit rotem Stift: „Kontrollpunkt Nord = Alte Brücke. 400 m. Bis 06:00!!“`,
  },
  // ---------------- Kapitel 4, Teil 2 ----------------
  c4b_news: {
    title: 'Eilmeldung – Varnheim 24', where: 'Fernsehwand · Elektro Max', kind: 'screen',
    body: `# +++ EILMELDUNG +++
**NEXARA: Sabotage im Halden-Institut – Techniker unter Verdacht**

Die NEXARA Pharma AG macht einen eigenen Mitarbeiter für den Ausbruch rund um das Klinikum St. Elisabeth verantwortlich. Der Haustechniker **İlyas D. (41)** soll in der Nacht zum Dienstag um 03:17 Uhr die Sicherheitssysteme des Instituts abgeschaltet haben.

„Unsere Forschung war zu jedem Zeitpunkt sicher. Wir bedauern, dass ein Einzelner das Vertrauen missbraucht hat“, so ein Sprecher.

Nach Angaben des Krisenstabs wird der Sektor Klinikum um **06:00 Uhr** geräumt. Evakuierung ausschließlich über den **Kontrollpunkt Nord** an der Alten Brücke.

> Laufband:
+++ Zahl der Infizierten unklar +++ Gesundheitsamt: „Keine Meldung erhalten“ +++ NEXARA-Aktie ausgesetzt +++`,
  },
  c4b_notiz: {
    title: 'Handzettel – NEXARA Sicherheit', where: 'Kasse der Drogerie', kind: 'file',
    body: `# VERMISST – BITTE UM HINWEISE
[Foto: Mann, Mitte 30, dunkle Haare, Klinikarmband]

**Sami Y.**, 34 Jahre, zuletzt gesehen im Klinikum St. Elisabeth.
Der Gesuchte ist **krank und möglicherweise verwirrt**. Er erinnert sich eventuell nicht an seinen Namen.

Bitte **nicht ansprechen**. Hinweise ausschließlich an die NEXARA-Sicherheit, **Kontrollpunkt Nord**.
Für Hinweise, die zum Auffinden führen, ist eine Belohnung ausgesetzt.

> Auf der Rückseite, Kugelschreiber:
Die haben uns am Kontrollpunkt nach ihm gefragt. Nicht nach Kranken, nicht nach Kindern. Nur nach ihm. – T.`,
  },
  // ---------------- Kapitel 5 ----------------
  c5_zettel: {
    title: 'Zettel am Kühlschrank', where: 'Wohnung Yıldız', kind: 'note',
    body: `M.,

ich habe etwas vorbereitet. Für den Fall, dass ich mich vergesse.

Wenn ich mich in den nächsten Tagen komisch benehme: Vertrau mir trotzdem. Auch dem, der ich dann bin.

Nach vorne.
S.

> Darunter, in Mines Schrift: „Du Idiot. Ich liebe dich.“`,
  },
  c5_flugblatt: {
    title: 'Flugblatt des Krisenstabs', where: 'Marktplatz', kind: 'file',
    body: `# KRISENSTAB VARNHEIM – BEKANNTMACHUNG

Der Sektor Klinikum (Innenstadt Süd) wird am Donnerstag, 06:00 Uhr, im Rahmen der Gefahrenabwehr **vollständig geräumt und desinfiziert** („Protokoll ASCHE“).

Personen im Sektor begeben sich unverzüglich zum **Kontrollpunkt Nord (Alte Brücke)**. Nach 06:00 Uhr ist eine Evakuierung nicht mehr möglich.

Personen mit Bissverletzungen melden sich bei den Sanitätskräften.`,
  },
  c5_befehl: {
    title: 'Einsatzbefehl (Durchschlag)', where: 'Sanitätszelt · Kontrollpunkt Nord', kind: 'file',
    body: `VS – NUR FÜR DEN DIENSTGEBRAUCH

Kontrollpunkt Nord wird um 05:30 Uhr aufgegeben. Truppe verlegt auf das Nordufer.

Auf Weisung des Krisenstabs übernimmt das **Sicherheitsteam NEXARA** die Brücke zur „Rückführung eines Patienten mit besonderem Schutzbedarf“ (Kennung **017**).

Dem Team ist Zugang zu gewähren. Keine Rückfragen.

> Handschriftlich: „Seit wann sagt uns eine Pharmafirma, was wir tun?“`,
  },
};
