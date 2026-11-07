import type { DialogueDef } from "../types";
import { G } from "../../core/Context";

export const DIALOGUES_CH6: Record<string, DialogueDef> = {
  ch6_pruefung: {
    id: "ch6_pruefung",
    start: "start",
    nodes: {
      start: {
        speaker: "ysolde", text: "Sami. Mein Sohn. Du bist gekommen. Komm zu mir – nicht zu ihr. Sie ist nicht ich.",
        do: () => G.quests.task("q_erste", "abstieg", true),
        next: "zweite",
      },
      zweite: {
        speaker: "stimme", text: "„Sami. Hör nicht auf sie. Ich bin deine Mutter. Sie ist nur das, was er aus meinem Gesicht gemacht hat.“",
        next: "hub",
      },
      hub: {
        speaker: "sami", text: "Zwei Frauen mit ihrem Gesicht. Zwei Stimmen mit ihrer Stimme. Eine von ihnen hat achtzig Jahre lang die Tür zugehalten.",
        choices: [
          { text: "Singt mir die erste Strophe.", next: "ersteStrophe", tag: "frage", once: true },
          { text: "Singt mir die zweite Strophe. Die, die du mir singen wolltest, wenn ich groß bin.", next: "zweiteStrophe", tag: "frage", once: true, if: () => G.state.hasItem("ysolde_brief4") || G.state.is("verse1"), lockedHint: "[Du weißt nicht, wonach du fragen sollst …]" },
          { text: "Zeigt mir eure Hände.", next: "haende", tag: "frage", once: true, if: () => G.state.is("fakeFound") || G.state.hasMemory("m_ritual"), lockedHint: "[Dir fehlt eine Erinnerung an ihre Hände …]" },
          { text: "Du – links. Du bist meine Mutter.", next: "richtig", tag: "wahrheit" },
          { text: "Du – rechts. Du bist meine Mutter.", next: "falsch", tag: "wahrheit" },
        ],
      },
      ersteStrophe: {
        speaker: "stimme", text: "Beide singen, im selben Atem: „Tief im Brunnen schläft der Mond, wo kein Wind die Wasser kämmt …“ Er kennt die erste Strophe. Er hat sie durch Lene gesungen.",
        next: "hub",
      },
      zweiteStrophe: {
        speaker: "ysolde", text: "Links: „… und wenn der Mond erwacht, mein Kind, dann sing ihn in den Brunnen zurück.“ – Rechts schweigt. Dann, zu schnell: „Es gab nur eine Strophe, mein Liebling. Du erinnerst dich falsch.“",
        do: () => G.state.set("heardVerse2Hint"),
        next: "hub",
      },
      haende: {
        speaker: "sami", text: "Die Linke hebt die Hände – die Handflächen voller alter, offener Narben. Die Rechte lächelt und zeigt glatte, weiße Haut. Wie in der falschen Erinnerung.",
        do: () => G.state.set("sawHands"),
        next: "hub",
      },
      richtig: {
        speaker: "ysolde", text: "Du hast mich gefunden. Dann hör zu, Sami, solange er wütend ist und nicht hinsieht. Das ist die zweite Strophe. Ich habe sie achtzig Jahre lang vor ihm versteckt – in mir, wo er nicht hinsehen kann.",
        mood: "laechelnd",
        do: () => G.state.set("chosenReal"),
        next: "end",
      },
      falsch: {
        speaker: "stimme", text: "„Ja … ja, mein Kind. Komm.“ Die Rechte lächelt breiter, als ein Gesicht lächeln kann. Und die Linke schreit deinen Namen, während der Boden sie verschluckt.",
        do: () => G.state.set("chosenFake"),
        next: "end",
      },
    },
  },

  ch6_inschrift: {
    id: "ch6_inschrift",
    start: () => (G.state.is("ilyasAllied") ? "ilyas" : "allein"),
    nodes: {
      ilyas: {
        speaker: "ilyas", text: "Diese Zeichen … Anselm hat sie abgezeichnet, am Rand seiner Seiten. Er konnte sie nicht lesen. Ich kann es – ein wenig. Es ist kein Fluch, Sami. Es ist eine Anleitung.",
        next: "ilyas2",
      },
      ilyas2: {
        speaker: "ilyas", text: "„Was zuerst war, ist an das gebunden, was zuletzt kam. Wer sich selbst erkennt, kann das Band lösen – nicht mit Blut, sondern mit dem, was er behält.“ Was du behältst, Sami. Nicht, was du gibst.",
        mood: "nachdenklich",
        do: () => {
          G.state.set("readInscription");
          G.relations.change("ilyas", 5);
        },
        next: "end",
      },
      allein: {
        speaker: "sami", text: "Zeichen, älter als jede Schrift, die ich kenne. Ich kann sie nicht lesen. Aber eines erkenne ich: zwei Kreise, die sich berühren – und eine Hand, die sie trennt.",
        do: () => G.state.set("sawInscription"),
        next: "end",
      },
    },
  },

  ch6_mine_heart: {
    id: "ch6_mine_heart",
    start: () => (G.state.is("mineLeft") ? "gefangen" : "zweifel"),
    nodes: {
      zweifel: {
        speaker: "mine", text: "Er spricht mit deiner Stimme, Sami. Mit deinem Gesicht. Wie soll ich wissen, welcher von euch beiden du bist?",
        mood: "aengstlich",
        choices: [
          { text: "„… und wenn der Mond erwacht, mein Kind, dann sing ihn in den Brunnen zurück.“", next: "glaubt", tag: "wahrheit", if: () => G.state.is("verse2") },
          { text: "„Tief im Brunnen schläft der Mond …“", next: "halb", tag: "mitgefuehl", if: () => G.state.is("verse1") },
          { text: "Du musst mir vertrauen.", next: "vertrauen", tag: "mitgefuehl" },
        ],
      },
      gefangen: {
        speaker: "mine", text: "Bleib weg! Ich habe dich gesehen – du hast sie getötet, du hast sie unter den Stein gestoßen, ich habe es gesehen …",
        mood: "aengstlich",
        choices: [
          { text: "Das war seine Erinnerung, Mine. Nicht meine. Nicht deine.", next: "halb", tag: "wahrheit", if: () => G.state.is("fakeFound") },
          { text: "„… und wenn der Mond erwacht, mein Kind, dann sing ihn in den Brunnen zurück.“", next: "glaubt", tag: "wahrheit", if: () => G.state.is("verse2") },
          { text: "Mine. Ich bin es.", next: "vertrauen", tag: "mitgefuehl" },
        ],
      },
      halb: {
        speaker: "mine", text: "… Das Lied. Ja. Aber er kennt die erste Strophe. Ich brauche mehr als das, Sami.",
        mood: "nachdenklich",
        next: () => (G.relations.get("mine") >= 10 ? "glaubt" : "vertrauen"),
      },
      glaubt: {
        speaker: "mine", text: "Die zweite Strophe. Niemand kannte sie. Nicht einmal ich. … Du bist es. Hier – nimm den Dorn. Er gehört in die Hand dessen, der sich selbst erkennt.",
        mood: "traurig",
        do: () => {
          if (!G.state.hasItem("schlafdorn")) G.inventory.add("schlafdorn");
          G.state.set("mineAllied");
          G.relations.change("mine", 20);
          G.story.decide("schlafdorn6", "given", "Mine erkannte dich am Herzen von Vareth und gab dir den Dorn");
        },
        next: "end",
      },
      vertrauen: {
        speaker: "mine", text: "Vertrauen … Ich habe dir achtzig Jahre lang vertraut. Du hast geschlafen. … Ich behalte den Dorn. Aber ich werde ihn nicht gegen dich erheben. Das ist alles, was ich dir geben kann.",
        mood: "kalt",
        do: () => G.story.decide("schlafdorn6", "kept", "Mine behielt den Dorn bis zum Schluss"),
        next: "end",
      },
    },
  },

  ch6_final: {
    id: "ch6_final",
    start: "start",
    nodes: {
      start: {
        speaker: "erste", text: "Hier sind wir also. Am Grund des Hauses. Du und ich, Erbe.",
        do: () => G.quests.task("q_erste", "herz"),
        next: "hub",
      },
      hub: {
        speaker: "erste", text: "Frag. Ich habe Zeit. Ich bin aus Zeit gemacht, die niemand mehr will.",
        choices: [
          { text: "Wer bist du?", next: "wer", tag: "frage", once: true },
          { text: "Was willst du von mir?", next: "was", tag: "frage", once: true },
          { text: "Wo ist mein Vater?", next: "vater", tag: "frage", once: true },
          { text: "Genug.", next: "wahl", tag: "ende" },
        ],
      },
      wer: {
        speaker: "erste", text: "Ich bin, was zuerst war. Alles, was dein Volk vergessen hat, damit es leben konnte. Ich bin dein Hunger. Ich bin das Fleisch der Wölfe. Ich bin du – der Teil von dir, der in diesem Stein wartet, seit dein Vater dich mir versprochen hat.",
        next: "hub",
      },
      was: {
        speaker: "erste", text: "Ein Haus. Einen Namen. Ich habe so viele gefressen und keinen behalten. Sie zerfallen in mir wie Salz im Wasser. Deiner würde halten. Dein Vater hat ihn für mich gemacht.",
        next: "hub",
      },
      vater: {
        speaker: "erste", text: "Hier. Überall. Er schreit manchmal, wenn ich mich an ihn erinnere. Soll ich dir seine Stimme leihen? „Mein Sohn. Heute Nacht wirst du mehr sein als ich.“ Hörst du? Er hatte recht.",
        next: "hub",
      },
      wahl: {
        speaker: "sami", text: "Er wartet. Hinter mir die Treppe, über mir das Land, unter mir alles, was je vergessen wurde. Ich muss entscheiden.",
        choices: [
          { text: "Ich gebe dir mein Blut – und mit ihm die ganze Blutlinie. Nimm sie und verhungere daran.", next: "e1", tag: "wahrheit" },
          { text: "Komm. Wohne in mir. Und gehorche.", next: "e2", tag: "vampir" },
          { text: "Ich weiß, wer ich bin. Ich löse das Band.", next: "e3", tag: "mitgefuehl", if: () => G.endings.available("erbe"), lockedHint: "[Ende III] Dir fehlt etwas, das du nicht benennen kannst …" },
        ],
      },
      e1: { speaker: "erste", text: "Dein Blut? Dein ganzes Haus? … Das ist kein Geschenk. Das ist Gift. NEIN –", do: () => G.state.set("endingChoice", "blutlinie"), next: "end" },
      e2: { speaker: "erste", text: "Endlich. Endlich ein Haus, das die Tür von innen öffnet.", do: () => G.state.set("endingChoice", "herrschaft"), next: "end" },
      e3: { speaker: "erste", text: "Lösen? Was ist das? Was … was tust du? Das ist keine Waffe. Das ist ein LIED –", do: () => G.state.set("endingChoice", "erbe"), next: "end" },
    },
  },
};
