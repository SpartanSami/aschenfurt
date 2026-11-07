import type { DialogueDef } from "../types";
import { G } from "../../core/Context";

export const DIALOGUES_CH3: Record<string, DialogueDef> = {
  ch3_bassem_meet: {
    id: "ch3_bassem_meet",
    start: "start",
    nodes: {
      start: {
        speaker: "bassem", text: "Halt. Noch ein Schritt, und ich reiße dir die Kehle heraus, Blutsauger. Ich rieche dich schon seit dem ersten Grenzstein. Du riechst wie die Kammer, in der mein Vater gestorben ist.",
        mood: "wuetend",
        do: () => {
          G.story.learn("bassem", 1);
          G.quests.task("q_grenze", "bassem");
        },
        choices: [
          { text: "Ich bringe Nachricht von Tarek.", next: "tarek", tag: "wahrheit", if: () => G.state.hasItem("wolfszahn") },
          { text: "Ich bin nicht mein Vater.", next: "nicht", tag: "wahrheit" },
          { text: "Ich bin Sami von Drakenfels. Ich will durch den Forst, nicht in deinen Bau.", next: "durch", tag: "frage" },
          { text: "Geh mir aus dem Weg, Hund.", next: "hund", tag: "drohung" },
        ],
      },
      tarek: {
        speaker: "bassem", text: "Tarek …? Gib her. … Sein Zahn. Und sein Brief. Er ist tot. Natürlich ist er tot. Und ausgerechnet ein Drakenfels bringt mir seinen Zahn. Warum?",
        mood: "traurig",
        do: () => {
          G.inventory.remove("wolfszahn");
          G.state.set("gaveTalisman");
        },
        choices: [
          { text: "Weil er es verdient hat, dass jemand es dir sagt.", next: "warum", tag: "mitgefuehl", do: () => G.relations.change("bassem", 20) },
          { text: "Weil ich etwas von dir will.", next: "ehrlich", tag: "wahrheit", do: () => G.relations.change("bassem", 8) },
        ],
      },
      ehrlich: { speaker: "bassem", text: "Wenigstens lügst du nicht. Das ist mehr, als ich von deinem Haus erwartet habe.", next: "warum" },
      nicht: {
        speaker: "bassem", text: "Das sagen Söhne immer. Bis sie die Ringe ihrer Väter tragen. Ich sehe einen an deiner Hand.",
        mood: "kalt",
        do: () => G.relations.change("bassem", 2),
        next: "warum",
      },
      durch: { speaker: "bassem", text: "Durch. Zur Rabenwacht, nehme ich an. Es gibt nur einen Grund, warum ein Drakenfels dorthin will: den alten Gang deines Hauses.", next: "warum" },
      hund: {
        speaker: "bassem", text: "Hund. … Sag das noch einmal, und du wirst herausfinden, wie schnell ein Hund sein kann.",
        mood: "wuetend",
        do: () => G.relations.change("bassem", -15),
        next: "warum",
      },
      warum: {
        speaker: "bassem", text: "Hör zu. Der Mond ist rot, und er bleibt rot. Meine Leute werden mondkrank – sie vergessen, wer sie sind, und dann vergessen sie, dass sie nicht nur Bestien sind. Und jetzt kommst du. Glaubst du an Zufälle?",
        choices: [
          { text: "Was ist der Eid von Vareth?", next: "eid", tag: "frage", once: true },
          { text: "Ich glaube, was mich geweckt hat, weckt auch den Mond.", next: "glaube", tag: "wahrheit", once: true },
          { text: "Hilf mir, die Rabenwacht zu finden.", next: "hilf", tag: "frage" },
        ],
      },
      eid: {
        speaker: "bassem", text: "Der älteste Vertrag zwischen deinem Volk und meinem. Wir stammen aus demselben Dunkel, sagen die Ältesten. Ihr habt seinen Hunger geerbt, wir sein Fleisch. Und beide haben wir geschworen, es nicht zu wecken. Lies die Grenzsteine, wenn du mir nicht glaubst.",
        next: "warum",
      },
      glaube: {
        speaker: "bassem", text: "… Dann sind wir uns in einer Sache einig. Das macht uns nicht zu Freunden.",
        do: () => G.relations.change("bassem", 5),
        next: "warum",
      },
      hilf: {
        speaker: "bassem", text: "Ich helfe keinem Drakenfels. Aber ich töte dich heute nicht. Geh nach Westen, zum alten Lager meiner Sippe. Sieh dir an, was der Mond meinem Volk angetan hat. Dann reden wir weiter – wenn du dann noch reden willst.",
        do: () => G.quests.task("q_grenze", "spuren", true),
        next: "end",
      },
    },
  },

  ch3_bassem_camp: {
    id: "ch3_bassem_camp",
    start: "start",
    nodes: {
      start: {
        speaker: "bassem", text: "Du hast es gesehen. Ich erkenne es an deinem Gesicht. Der Zehnt. Silberketten, und ein Junge, der hinter dem Wagen herläuft, bis seine Füße bluten.",
        mood: "traurig",
        choices: [
          { text: "Mein Haus hat deinen Vater geholt. Für das Ritual. Für mich. Es tut mir leid.", next: "leid", tag: "mitgefuehl" },
          { text: "Das war mein Vater, nicht ich.", next: "vater", tag: "wahrheit" },
          { text: "Was willst du hören? Dass ich auf die Knie falle?", next: "stolz", tag: "drohung" },
        ],
      },
      leid: {
        speaker: "bassem", text: "… Achtzig Jahre habe ich mir vorgestellt, was ich einem Drakenfels sage, wenn er das sagt. Jetzt weiß ich es nicht mehr.",
        do: () => {
          G.relations.change("bassem", 20);
          G.state.set("acknowledgedCrimes");
          G.story.decide("zehnt", "acknowledged", "Bassem gegenüber die Schuld des eigenen Hauses anerkannt");
        },
        next: "nadira",
      },
      vater: {
        speaker: "bassem", text: "Dein Vater. Dein Haus. Dein Ritual. Du lebst von dem, was er gestohlen hat. Aber gut – du warst noch nicht da. Oder du warst da und hast geschlafen.",
        mood: "kalt",
        do: () => {
          G.relations.change("bassem", -3);
          G.story.decide("zehnt", "deflected", "Die Schuld am Zehnt dem Vater zugeschoben");
        },
        next: "nadira",
      },
      stolz: {
        speaker: "bassem", text: "Nein. Ich will, dass du stehen bleibst und es aushältst. Das tun Wölfe. Vampire laufen weg in ihre Särge.",
        mood: "wuetend",
        do: () => {
          G.relations.change("bassem", -15);
          G.story.decide("zehnt", "proud", "Bassem gegenüber hochmütig gewesen");
        },
        next: "nadira",
      },
      nadira: {
        speaker: "bassem", text: "Meine Schwester Nadira ist mondkrank. Die Ältesten wollen sie töten, bevor sie jemanden reißt. Ich habe sie zum Steinkreis im Osten gebracht, um sie zu reinigen. Sie hat die Ketten zerbrochen. Wenn du anders bist als dein Vater, dann hilf mir, sie zu finden, bevor die Ältesten es tun.",
        do: () => {
          G.quests.start("q_nadira");
          G.story.learn("nadira", 1);
          G.story.learn("bassem", 2);
        },
        choices: [
          { text: "Ich helfe dir.", next: "ja", tag: "mitgefuehl" },
          { text: "Ich habe meine eigenen Wege. Aber wenn ich sie finde, sage ich es dir.", next: "nein", tag: "schweigen" },
        ],
      },
      ja: {
        speaker: "bassem", text: "Dann komm zum Steinkreis. Und wenn sie dich angreift – töte sie nicht. Ich bitte dich. Ich habe noch nie einen Drakenfels um etwas gebeten.",
        do: () => {
          G.relations.change("bassem", 10);
          G.state.set("bassemAtCircle");
        },
        next: "end",
      },
      nein: {
        speaker: "bassem", text: "Natürlich. Eigene Wege. Das sagen Drakenfels, wenn sie Nein meinen.",
        do: () => G.relations.change("bassem", -5),
        next: "end",
      },
    },
  },

  ch3_nadira: {
    id: "ch3_nadira",
    start: "start",
    nodes: {
      start: {
        speaker: "nadira", text: "… Bruder? Es ist so laut. Der Mond singt die ganze Zeit. Aber dein Blut, Vampir … dein Blut ist still. Woher hast du die Stille?",
        mood: "aengstlich",
        choices: [
          { text: "Von meiner Mutter. Glaube ich.", next: "mutter", tag: "wahrheit" },
          { text: "Ich weiß es nicht.", next: "weiss", tag: "schweigen" },
        ],
      },
      mutter: { speaker: "nadira", text: "Dann hat sie dir etwas Seltenes gegeben. Etwas, das er nicht hören kann.", mood: "nachdenklich", next: "end" },
      weiss: { speaker: "nadira", text: "Behalt sie. Lass sie dir von niemandem nehmen.", next: "end" },
    },
  },

  ch3_bassem_end: {
    id: "ch3_bassem_end",
    start: () => (G.relations.get("bassem") >= 25 ? "freund" : G.relations.get("bassem") >= -10 ? "neutral" : "feind"),
    nodes: {
      freund: {
        speaker: "bassem", text: "Die Rabenwacht. Hier haben sie meinen Vater angekettet, bevor sie ihn zu euch brachten. … Ich gehe nicht mit nach Ebon. Kein Wolf betritt diese Kathedrale. Aber hör zu: Wenn du zu deiner Burg zurückkehrst und das Ding darunter weckst – dann heul. Ich komme.",
        mood: "nachdenklich",
        do: () => {
          G.state.set("bassemPromise");
          G.story.decide("bassemPact", "pact", "Bassem versprach, beim Ruf zu kommen");
        },
        choices: [
          { text: "Ich werde heulen, Bassem.", next: "end", tag: "mitgefuehl", do: () => G.relations.change("bassem", 5) },
          { text: "Danke.", next: "end", tag: "ende" },
        ],
      },
      neutral: {
        speaker: "bassem", text: "Die Rabenwacht. Dein Gang wartet. Ich halte dich nicht auf. Aber ich komme dir auch nicht nach. Was immer unter Vareth schläft – mach es nicht schlimmer.",
        next: "end",
      },
      feind: {
        speaker: "bassem", text: "Da ist dein Turm. Geh hinein und komm nie wieder über die Grenze. Beim nächsten Mal frage ich nicht, wessen Sohn du bist.",
        mood: "wuetend",
        next: "end",
      },
    },
  },
};
