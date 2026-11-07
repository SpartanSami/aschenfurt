import type { DialogueDef } from "../types";
import { G } from "../../core/Context";

export const DIALOGUES_CH4: Record<string, DialogueDef> = {
  ch4_mine: {
    id: "ch4_mine",
    start: "start",
    nodes: {
      start: {
        speaker: "mine", text: "Du bist schneller wach geworden, als ich gehofft habe. Und langsamer, als ich befürchtet habe.",
        mood: "kalt",
        do: () => {
          G.story.learn("mine", 2);
          G.quests.start("q_mine", false);
          G.quests.task("q_dynastie", "mine");
        },
        choices: [
          { text: "Du warst es. Auf der Mauer. „Du hättest niemals aufwachen dürfen.“", next: "mauer", tag: "frage" },
          { text: "Wer bist du?", next: "wer", tag: "frage" },
          { text: "Ich rieche dein Blut. Altes Blut. Komm näher.", next: "hunger", tag: "hunger", hungerMin: 60, lockedHint: "[Blutdurst] …" },
        ],
      },
      mauer: {
        speaker: "mine", text: "Ja. Ich habe es nicht so gemeint, wie es klang. Oder doch. Ich weiß es selbst nicht mehr. Achtzig Jahre machen aus jedem Satz ein Rätsel.",
        mood: "nachdenklich",
        next: "wer",
      },
      hunger: {
        speaker: "mine", text: "Achtzig Jahre geschlafen, und das Erste, woran du denkst, ist, mich zu beißen? Vielleicht hätte ich doch tun sollen, was ich versprochen habe.",
        mood: "wuetend",
        do: () => G.relations.change("mine", -12),
        next: "wer",
      },
      wer: {
        speaker: "mine", text: "Ich bin Mine. Aus dem Haus Morwen. Ich war Mündel bei euch, als du noch jünger warst, als du jetzt aussiehst. Dein Vater nannte uns eine Allianz. Du hast mich Mine genannt, weil du Minerva zu feierlich fandest. Erinnerst du dich?",
        choices: [
          { text: "Ein wenig. Du hast die Kerzen angezündet. In der Krypta.", next: "kerze", tag: "wahrheit", if: () => G.state.is("sawCandle") || G.state.is("knowsCandle") },
          { text: "Ruprecht hat von dir erzählt.", next: "ruprecht", tag: "wahrheit", if: () => G.state.is("metRuprecht") },
          { text: "Nein. Ich erinnere mich an nichts von dir.", next: "nichts", tag: "wahrheit" },
        ],
      },
      kerze: {
        speaker: "mine", text: "Jede Nacht. Achtzig Jahre lang. Es ist schwer, jemanden zu bewachen, den man nicht wecken darf. Man braucht ein Ritual, sonst verliert man den Verstand.",
        mood: "traurig",
        do: () => G.relations.change("mine", 12),
        next: "warum",
      },
      ruprecht: {
        speaker: "mine", text: "Ruprecht. Er hat mir jeden Abend gesagt, die Gläser seien poliert. Ich habe ihm jeden Abend gedankt. Es war das einzige Gespräch, das ich in all den Jahren geführt habe.",
        mood: "traurig",
        do: () => {
          G.relations.change("mine", 6);
          if (G.state.decided("ruprecht") === "fed") G.relations.change("mine", -8);
        },
        next: () => (G.state.decided("ruprecht") === "fed" ? "ruprechtFed" : "warum"),
      },
      ruprechtFed: {
        speaker: "mine", text: "… Und du hast ihn ausgetrunken. Ich rieche es an dir. Vielleicht war es Gnade. Vielleicht war es Hunger. Ich hoffe, du weißt selbst, was davon.",
        mood: "kalt",
        next: "warum",
      },
      nichts: {
        speaker: "mine", text: "Natürlich nicht. Etwas hat dir genug genommen, um dir auch das zu nehmen. Oder deine Mutter war gründlicher, als ich dachte.",
        mood: "kalt",
        next: "warum",
      },
      warum: {
        speaker: "sami", text: "Warum wurde ich eingeschlossen? Ich will die Wahrheit, Mine.",
        next: "warum2",
      },
      warum2: {
        speaker: "mine", text: "Weil deine Mutter dich mehr geliebt hat als ihr Haus. Corvin wollte, dass etwas in dir wohnt – das, was unter Vareth schläft. Ysolde hat sein Ritual umgelenkt und dich versiegelt, bevor es ganz in dir war.",
        mood: "nachdenklich",
        do: () => G.story.learn("ysolde", 2),
        choices: [
          { text: "Und was hast du ihr versprochen?", next: "versprechen", tag: "frage", if: () => G.state.hasMemory("m_siegel"), lockedHint: "[Dir fehlt eine Erinnerung an die Krypta …]" },
          { text: "Wo ist meine Mutter jetzt?", next: "mutter", tag: "frage", once: true },
          { text: "Du hättest mich wecken können.", next: "wecken", tag: "frage" },
        ],
      },
      mutter: {
        speaker: "mine", text: "Hinabgestiegen. Unter die Burg, unter das Land. Mehr weiß ich nicht. Mehr wollte ich nie wissen.",
        mood: "traurig",
        next: "warum2b",
      },
      warum2b: {
        speaker: "mine", text: "Frag, was du noch fragen willst. Aber nicht zu laut. Die Fenster hier haben Ohren.",
        choices: [
          { text: "Was hast du meiner Mutter versprochen?", next: "versprechen", tag: "frage", if: () => G.state.hasMemory("m_siegel"), lockedHint: "[Dir fehlt eine Erinnerung an die Krypta …]" },
          { text: "Du hättest mich wecken können.", next: "wecken", tag: "frage" },
        ],
      },
      wecken: {
        speaker: "mine", text: "Und dann? Dich wecken und abwarten, ob du es noch bist? Deine Mutter hat mir genau gesagt, was zu tun ist, wenn du erwachst. Ich habe es noch nicht getan. Das muss dir für heute genügen.",
        mood: "kalt",
        next: "entscheidung",
      },
      versprechen: {
        speaker: "mine", text: "… Das sage ich dir nicht hier. Nicht unter diesem Fenster.",
        mood: "aengstlich",
        do: () => G.quests.task("q_mine", "begegnung"),
        next: "entscheidung",
      },
      entscheidung: {
        speaker: "mine", text: "Du wirst mir also vertrauen müssen. Oder nicht. Es ist deine Entscheidung, Sami. Ausnahmsweise.",
        do: () => G.quests.task("q_mine", "begegnung"),
        choices: [
          { text: "Ich vertraue dir. Für jetzt.", next: "gut", tag: "mitgefuehl", do: () => {
            G.relations.change("mine", 15);
            G.story.decide("mineTrust4", "trust", "Mine in Ebon das Vertrauen ausgesprochen");
          } },
          { text: "Ich werde es herausfinden. Mit dir oder ohne dich.", next: "neutral", tag: "wahrheit", do: () => {
            G.relations.change("mine", 3);
            G.story.decide("mineTrust4", "neutral", "Mine in Ebon weder vertraut noch misstraut");
          } },
          { text: "Dann bist du nicht besser als mein Vater. Geheimnisse und Pläne.", next: "kalt", tag: "drohung", do: () => {
            G.relations.change("mine", -12);
            G.story.decide("mineTrust4", "distrust", "Mine in Ebon mit dem Vater verglichen");
          } },
        ],
      },
      gut: {
        speaker: "mine", text: "Du hast dich nicht verändert. Das ist entweder sehr gut oder sehr schlecht. Die Aufzeichnungen deiner Mutter liegen in der Bibliothek hinter dem Stammbaum. Die Häuser in der Ordnung ihres Blutes, Sami – wie die Kerzen, die wir als Kinder hier angezündet haben, um die Priester zu ärgern.",
        mood: "laechelnd",
        do: () => G.state.set("mineHint"),
        next: "end",
      },
      neutral: {
        speaker: "mine", text: "Das hast du schon immer gesagt. Meistens ohne mich. Die Bibliothek liegt hinter dem Stammbaum im Seitenschiff. Lies, bevor du zählst.",
        next: "end",
      },
      kalt: {
        speaker: "mine", text: "Vielleicht. Aber ich bin noch hier. Das ist mehr, als die meisten von uns von sich sagen können. Die Bibliothek ist hinter dem Stammbaum. Finde sie allein.",
        mood: "kalt",
        next: "end",
      },
    },
  },

  ch4_mine_seal: {
    id: "ch4_mine_seal",
    start: () => (G.relations.get("mine") >= 15 ? "bereit" : "zoegern"),
    nodes: {
      bereit: {
        speaker: "mine", text: "Das Siegel will zwei Blutlinien. Drakenfels – und eine zweite, älter als eure Krone. Morwen ist älter. Gib mir deine Hand.",
        choices: [
          { text: "Danke, Mine.", next: "gibt", tag: "mitgefuehl" },
          { text: "Ich nehme stattdessen das Blut des Priors.", next: "prior", tag: "vampir", if: () => !G.state.is("malachiasDown") },
        ],
      },
      zoegern: {
        speaker: "mine", text: "Das Siegel will zwei Blutlinien. Und du willst meine. Warum sollte ich dir helfen, dorthin hinabzusteigen, wohin sie gegangen ist?",
        mood: "kalt",
        choices: [
          { text: "Weil ich sie finden muss. Und weil ich dich dabei brauche.", next: "bitte", tag: "mitgefuehl" },
          { text: "Ich nehme es mir auch so.", next: "drohung", tag: "drohung" },
          { text: "Dann nehme ich das Blut des Priors.", next: "prior", tag: "vampir", if: () => !G.state.is("malachiasDown") },
        ],
      },
      bitte: {
        speaker: "sami", text: "Bitte, Mine. Ich steige nicht hinab, um ihn zu wecken. Ich steige hinab, um sie zu finden.",
        do: () => G.relations.change("mine", 10),
        next: () => (G.relations.get("mine") >= -5 ? "gibtZoegernd" : "nein"),
      },
      gibtZoegernd: {
        speaker: "mine", text: "… Ich tue es nicht für dich. Ich tue es, weil sie es so gewollt hätte. Gib mir deine Hand, bevor ich es mir anders überlege.",
        mood: "traurig",
        do: () => G.relations.change("mine", 6),
        next: "gibt",
      },
      gibt: {
        speaker: "mine", text: "Halt still. Es brennt nur kurz. … Siehst du? Unser Blut erkennt sich noch.",
        do: () => {
          G.state.set("mineGaveBlood");
          G.relations.change("mine", 5);
          G.story.decide("sealBlood", "mine", "Mine gab ihr Blut für das Siegel von Ebon");
        },
        next: "end",
      },
      nein: {
        speaker: "mine", text: "Nein. Hol es dir beim Prior. Er hat ohnehin zu viel davon.",
        mood: "kalt",
        next: "prior",
      },
      drohung: {
        speaker: "mine", text: "Versuch es, und du wirst herausfinden, warum deine Mutter ausgerechnet mir den Dorn gegeben hat. … Geh zum Prior. Ich sehe zu.",
        mood: "wuetend",
        do: () => {
          G.relations.change("mine", -25);
          G.story.decide("sealBlood", "threat", "Mine bedroht, um an ihr Blut zu kommen");
        },
        next: "prior",
      },
      prior: {
        speaker: "sami", text: "Malachias sitzt im Chorgestühl. Sein Blut ist das älteste in dieser Kirche.",
        next: "end",
      },
    },
  },

  ch4_malachias: {
    id: "ch4_malachias",
    start: () => (G.dialogue.seen("ch4_malachias") ? "wieder" : "start"),
    nodes: {
      start: {
        speaker: "malachias", text: "Wir vergessen für ihn. Wir vergessen für ihn. Wir vergessen … ah. Das Gefäß. Er hat uns gebeten, dich zu grüßen.",
        do: () => G.story.learn("malachias", 1),
        next: "hub",
      },
      wieder: { speaker: "malachias", text: "Das Gefäß kehrt zurück. Wie ein Krug zum Brunnen.", next: "hub" },
      hub: {
        speaker: "malachias", text: "Frag, Kind. Wir haben Zeit. Wir haben alle Zeit, die je vergessen wurde.",
        choices: [
          { text: "Wer bist du?", next: "wer", tag: "frage", once: true },
          { text: "Was weißt du über das Ritual?", next: "ritual", tag: "frage", once: true },
          { text: "Was ist der Erste?", next: "erste", tag: "frage", once: true },
          { text: "Ich brauche dein Blut für das Siegel.", next: "blut", tag: "vampir", if: () => G.quests.taskDone("q_dynastie", "aufzeichnungen") && !G.state.is("mineGaveBlood") && !G.state.is("malachiasDown") },
          { text: "Ich gehe.", next: "end", tag: "ende" },
        ],
      },
      wer: { speaker: "malachias", text: "Wir waren Malachias. Prior von Ebon. Jetzt sind wir das, was er von Malachias übrig gelassen hat. Ein Mund. Viele Münder. Hörst du sie? Sie sind alle sehr höflich.", next: "hub" },
      ritual: {
        speaker: "malachias", text: "Wir haben es gelehrt. Corvin hat zugehört. Ysolde hat besser zugehört. Sie hat verstanden, dass man ein Tor in beide Richtungen öffnen kann. Und dass man es von innen zuhalten kann, wenn man bereit ist, dahinter zu bleiben.",
        do: () => G.story.learn("ysolde", 2),
        next: "hub",
      },
      erste: {
        speaker: "malachias", text: "Was zuerst war. Bevor es Namen gab. Er ist alles, was je vergessen wurde, und er hat Hunger, weil die Welt so viel vergisst. Euer Blut ist sein Hunger. Das Blut der Wölfe ist sein Fleisch. Ihr seid seine Kinder, die vergessen haben, wessen Kinder sie sind.",
        do: () => G.story.learn("erste", 2),
        next: "hub",
      },
      blut: {
        speaker: "malachias", text: "Nimm es. Wenn du kannst. Die Kinder werden dich daran hindern wollen. Sie lieben uns. Sie lieben ihn.",
        do: () => G.state.set("malachiasFight"),
        next: "end",
      },
    },
  },
};
