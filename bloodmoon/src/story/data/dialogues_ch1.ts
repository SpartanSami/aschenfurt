import type { DialogueDef } from "../types";
import { G } from "../../core/Context";

const hub = [
  { text: "Ruprecht? Bist du das?", next: "name", tag: "frage" as const, once: true },
  { text: "Was ist in dieser Halle geschehen?", next: "nacht", tag: "frage" as const, once: true },
  { text: "Wer zündet unten in der Krypta die Kerze an?", next: "kerze", tag: "frage" as const, once: true, if: () => G.state.is("sawCandle") },
  { text: "Er hat ohnehin nichts mehr, wofür er lebt.", next: "feed", tag: "hunger" as const, hungerMin: 45, lockedHint: "[Blutdurst zu gering] …" },
  { text: "Ruhe in Frieden, Ruprecht.", next: "abschied", tag: "ende" as const },
];

export const DIALOGUES_CH1: Record<string, DialogueDef> = {
  ch1_ruprecht: {
    id: "ch1_ruprecht",
    start: () => (G.state.is("metRuprecht") ? "wieder" : "start"),
    nodes: {
      start: {
        speaker: "verlorener", text: "… die Gläser … die Gläser müssen poliert sein, bevor der Herr kommt … bevor der Herr …",
        do: () => G.state.set("metRuprecht"),
        choices: hub,
      },
      wieder: { speaker: "verlorener", text: "… poliert … alles muss poliert sein …", choices: hub },
      name: {
        speaker: "verlorener", text: "Ruprecht … ja. Der Kellermeister. Ich hatte eine Tochter. Wie hieß sie …? Er hat ihren Namen genommen. Er nimmt immer zuerst die Namen.",
        choices: [
          { text: "Wer hat ihn genommen?", next: "er", tag: "frage" },
          { text: "Erinnerst du dich an mich?", next: "sami", tag: "frage" },
        ],
      },
      er: {
        speaker: "verlorener", text: "Der unter dem Stein. Der, der vor dem Herrn da war. Er hat die Halle gegessen, junger Herr. Die ganze Halle, an einem einzigen Abend. Nur die Stühle sind übrig geblieben.",
        do: () => G.story.learn("erste", 1),
        choices: hub,
      },
      sami: {
        speaker: "verlorener", text: "Junger Herr … Sami. Ihr wart freundlich zu mir. Ihr habt mich nie geschlagen. Die junge Herrin auch nicht. Die junge Herrin Mine.",
        mood: "traurig",
        next: "sami2",
      },
      sami2: {
        speaker: "sami", text: "Mine. Der Name … liegt mir auf der Zunge wie ein Wort aus einem Traum.",
        do: () => G.story.learn("mine", 1),
        choices: hub,
      },
      kerze: {
        speaker: "verlorener", text: "Sie kommt jede Nacht. Jede Nacht seit … seit immer. Sie zündet die Kerze an, unten bei Euch, und dann weint sie nicht. Sie weint nie. Ich weine für sie. Wenn ich mich erinnere, wie das geht.",
        do: () => G.state.set("knowsCandle"),
        choices: hub,
      },
      nacht: {
        speaker: "verlorener", text: "Der Herr hob das Glas. Dann ging er hinunter, mit dem jungen Herrn und der Herrin. Dann war es still. Und alle sind sitzen geblieben. Sitzen geblieben … ich warte, dass jemand aufsteht. Achtzig Jahre warte ich.",
        choices: hub,
      },
      feed: {
        speaker: "sami", text: "Sein Herz schlägt noch. Langsam. Wie ein Tropfen, der nie den Boden erreicht.",
        choices: [
          { text: "Trinken.", next: "fed", tag: "hunger", do: () => {
            G.abilities.addHunger(-45);
            G.player.heal(40);
            G.audio.sfx("feed");
            G.story.decide("ruprecht", "fed", "Ruprecht, den Kellermeister, ausgetrunken");
            G.state.set("ruprechtGone");
          } },
          { text: "Nein. Nicht so.", next: "wieder", tag: "schweigen" },
        ],
      },
      fed: { speaker: "verlorener", text: "… danke, junger Herr … jetzt … darf ich aufstehen …", mood: "traurig", next: "end" },
      abschied: {
        speaker: "verlorener", text: "… Ruhe … ja. Wenn der Herr kommt. Wenn der Herr kommt, dann ruhe ich.",
        do: () => G.story.decide("ruprecht", "spared", "Ruprecht, den Kellermeister, verschont"),
        next: "end",
      },
    },
  },
};
