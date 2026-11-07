import type { QuestDef } from "../types";

export const QUESTS: Record<string, QuestDef> = {
  // ------------------------------------------------------------------ Kapitel 1
  q_erwachen: {
    id: "q_erwachen", title: "Das Erwachen", type: "haupt", chapter: 1, characters: ["sami", "ysolde"],
    desc: "Ich bin in einer Krypta unter Burg Drakenfels erwacht. Der Deckel meines Sarkophags wurde von innen zerbrochen. Ich weiß nicht, wie lange ich geschlafen habe – nur, dass niemand mehr hier ist.",
    doneText: "Ich habe die Burg verlassen. Achtzig Jahre sind vergangen. Und jemand hat auf mich gewartet – oder darauf, dass ich nie erwache.",
    tasks: [
      { id: "krypta", text: "Aus der Krypta entkommen" },
      { id: "erinnerung", text: "Die eigenen Erinnerungen untersuchen (Bluterinnerungen)" },
      { id: "thronsaal", text: "Den alten Thronsaal erreichen" },
      { id: "aufzeichnungen", text: "Verborgene Familienaufzeichnungen finden" },
      { id: "mond", text: "Hinweise auf den roten Mond entdecken" },
      { id: "verlassen", text: "Die Burg verlassen" },
    ],
  },
  q_wappen: {
    id: "q_wappen", title: "Der Wahlspruch des Hauses", type: "raetsel", chapter: 1, characters: ["corvin"],
    desc: "Im Arbeitszimmer meines Vaters steht eine Truhe mit vier Symbolrädern. Über dem Kamin ist der Wahlspruch des Hauses eingemeißelt – oder das, was davon übrig ist.",
    tasks: [
      { id: "inschrift", text: "Die Inschrift über dem Kamin entziffern" },
      { id: "truhe", text: "Die Familientruhe öffnen" },
    ],
  },
  q_holzpferd: {
    id: "q_holzpferd", title: "Das Holzpferd", type: "neben", chapter: 1, characters: ["ysolde"],
    desc: "Oben im Treppenhaus stand eine Gestalt. Als ich ankam, lag dort nur ein Holzpferd mit einem eingeritzten „S“. Es fühlt sich an, als gehöre es irgendwohin zurück.",
    doneText: "Das Kinderzimmer. Meine Mutter sang. Ich erinnere mich an die Melodie – an die erste Strophe.",
    tasks: [
      { id: "finden", text: "Das Holzpferd aufheben" },
      { id: "zurueck", text: "Den Ort finden, an den es gehört" },
    ],
  },
  q_briefe: {
    id: "q_briefe", title: "Ysoldes Brief", type: "verborgen", chapter: 1, characters: ["ysolde"],
    desc: "Meine Mutter hat mir einen Brief hinterlassen – in Stücke gerissen und verstreut. Vielleicht von ihr selbst. Vielleicht von jemand anderem.",
    doneText: "Ich habe alle vier Stücke. Der Brief ist vollständig – und er sagt etwas, das niemand sonst mir sagen wollte.",
    tasks: [
      { id: "b1", text: "Erstes Stück finden" },
      { id: "b2", text: "Zweites Stück finden" },
      { id: "b3", text: "Drittes Stück finden" },
      { id: "b4", text: "Viertes Stück finden" },
    ],
  },
  // ------------------------------------------------------------------ Kapitel 2
  q_rabenfurt: {
    id: "q_rabenfurt", title: "Stimmen aus Rabenfurt", type: "haupt", chapter: 2, characters: ["ilyas", "berta", "konrad", "gerold"],
    desc: "Das Dorf unter der Burg heißt noch immer Rabenfurt. Die Menschen verriegeln ihre Türen, und mehrere von ihnen sind verschwunden. Jemand hier weiß mehr über mein Haus als ich.",
    doneText: "Rabenfurt liegt hinter mir. Was in der Kapelle war, war nur ein Echo. Der Ruf kam von tiefer unten – und der Wolfsbund wird nicht schweigen.",
    tasks: [
      { id: "erkunden", text: "Das Dorf erkunden" },
      { id: "bewohner", text: "Mit den Bewohnern sprechen" },
      { id: "ilyas", text: "İlyas finden" },
      { id: "dokumente", text: "Die alten Dokumente untersuchen" },
      { id: "kapelle", text: "Die verlassene Kapelle betreten" },
      { id: "wolfsbund", text: "Hinweise auf den Wolfsbund entdecken" },
      { id: "wald", text: "Den Weg zum Wald finden" },
    ],
  },
  q_lene: {
    id: "q_lene", title: "Das schlafende Kind", type: "neben", chapter: 2, characters: ["lene", "berta"],
    desc: "Ein Mädchen läuft barfuß durch den Regen, die Augen offen, aber nicht wach. Sie summt eine Melodie, die ich kenne.",
    tasks: [
      { id: "folgen", text: "Dem Kind folgen" },
      { id: "retten", text: "Lene aus der Gruft bringen" },
      { id: "berta", text: "Lene zu Berta zurückbringen", optional: true },
    ],
  },
  // ------------------------------------------------------------------ Kapitel 3
  q_grenze: {
    id: "q_grenze", title: "Die Grenze des Wolfsbundes", type: "haupt", chapter: 3, characters: ["bassem", "nadira"],
    desc: "Der Schwarze Forst gehört dem Wolfsbund. Seit achtzig Jahren hat kein Drakenfels die alten Grenzsteine überschritten. Ich muss es tun.",
    doneText: "Unter der Rabenwacht beginnt ein Gang, den mein Haus gegraben hat. Er führt nach Ebon.",
    tasks: [
      { id: "durchqueren", text: "Den Schwarzen Forst durchqueren" },
      { id: "grenzsteine", text: "Alte Grenzmarkierungen untersuchen (0/3)" },
      { id: "spuren", text: "Die Spuren des Wolfsbundes finden" },
      { id: "bassem", text: "Bassem begegnen" },
      { id: "lager", text: "Das verlassene Lager untersuchen" },
      { id: "ritual", text: "Das alte Ritual entdecken" },
      { id: "eingang", text: "Den Eingang zur unterirdischen Anlage finden" },
    ],
  },
  q_nadira: {
    id: "q_nadira", title: "Mondkrank", type: "charakter", chapter: 3, characters: ["bassem", "nadira"],
    desc: "Bassems Schwester Nadira hat der rote Mond verschlungen. Sie ist zur Bestie geworden. Bassem will sie retten. Der Wolfsbund will sie töten.",
    tasks: [
      { id: "finden", text: "Nadira am Steinkreis finden" },
      { id: "entscheiden", text: "Über Nadiras Schicksal entscheiden" },
    ],
  },
  // ------------------------------------------------------------------ Kapitel 4
  q_dynastie: {
    id: "q_dynastie", title: "Die Wahrheit der Blutdynastie", type: "haupt", chapter: 4, characters: ["mine", "malachias", "ysolde"],
    desc: "Die Kathedrale von Ebon wurde von Vampiren für einen Gott gebaut, den niemand sehen sollte. Hier liegen die Aufzeichnungen meiner Mutter.",
    doneText: "Ich weiß jetzt, was ich bin: kein Sohn, sondern ein Gefäß. Und Mine wusste es die ganze Zeit.",
    tasks: [
      { id: "betreten", text: "Die Kathedrale betreten" },
      { id: "rituale", text: "Alte Blutrituale untersuchen (0/3)" },
      { id: "mine", text: "Mine finden" },
      { id: "dynastie", text: "Die Geschichte der Blutdynastie aufdecken" },
      { id: "bibliothek", text: "Die verborgene Bibliothek öffnen" },
      { id: "aufzeichnungen", text: "Die Aufzeichnungen von Samis Mutter finden" },
      { id: "zugang", text: "Den Zugang zu den unterirdischen Kammern freilegen" },
    ],
  },
  q_mine: {
    id: "q_mine", title: "Minas Geheimnis", type: "charakter", chapter: 4, characters: ["mine"],
    desc: "Mine kannte mich, bevor ich schlief. Sie weiß, warum ich eingeschlossen wurde – und sie verschweigt, was sie versprochen hat.",
    tasks: [
      { id: "begegnung", text: "Mit Mine sprechen" },
      { id: "wahrheit", text: "Die ganze Wahrheit erfahren" },
    ],
  },
  // ------------------------------------------------------------------ Kapitel 5
  q_ritual: {
    id: "q_ritual", title: "Das Ritual von Drakenfels", type: "haupt", chapter: 5, characters: ["mine", "bassem", "ilyas", "ysolde", "corvin"],
    desc: "Ich bin zurück, wo ich erwacht bin. Die Burg ist nicht mehr dieselbe – oder ich sehe sie zum ersten Mal, wie sie wirklich ist.",
    doneText: "Die Krypta ist offen. Unter meinem Sarkophag führt eine Treppe hinab, die älter ist als jede Blutlinie.",
    tasks: [
      { id: "betreten", text: "Die Burg erneut betreten" },
      { id: "gemaecher", text: "Die verborgenen Familienräume öffnen" },
      { id: "rekonstruieren", text: "Die Geschichte des Rituals rekonstruieren" },
      { id: "mine", text: "Mine mit ihrer Vergangenheit konfrontieren" },
      { id: "bassem", text: "Bassem um Unterstützung bitten" },
      { id: "ilyas", text: "İlyas' Dokumente entschlüsseln" },
      { id: "krypta", text: "Den Zugang zur alten Krypta öffnen" },
    ],
  },
  q_letzte_erinnerung: {
    id: "q_letzte_erinnerung", title: "Die letzte Erinnerung", type: "charakter", chapter: 5, characters: ["ysolde"],
    desc: "Eine Erinnerung fehlt. Nicht verloren – herausgeschnitten. Meine Mutter hat sie versteckt, damit niemand sie findet. Nicht einmal er.",
    tasks: [
      { id: "lied", text: "Das Lied vom Mondbrunnen vollständig erinnern" },
    ],
  },
  // ------------------------------------------------------------------ Kapitel 6
  q_erste: {
    id: "q_erste", title: "Der Erste", type: "haupt", chapter: 6, characters: ["erste", "mine", "bassem", "ilyas", "ysolde"],
    desc: "Unter Vareth wartet etwas, das älter ist als Vampire und Wölfe. Es spricht mit den Stimmen derer, die ich kenne.",
    tasks: [
      { id: "abstieg", text: "In die Kammern unter Vareth hinabsteigen" },
      { id: "pruefung", text: "Die Prüfung der Erinnerung bestehen" },
      { id: "herz", text: "Das Herz von Vareth erreichen" },
      { id: "entscheidung", text: "Eine endgültige Entscheidung treffen" },
    ],
  },
};
