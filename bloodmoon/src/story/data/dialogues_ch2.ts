import type { DialogueDef } from "../types";
import { G } from "../../core/Context";

const revealed = () => G.state.is("revealedNature");

export const DIALOGUES_CH2: Record<string, DialogueDef> = {
  // ------------------------------------------------------------------ Berta
  ch2_berta: {
    id: "ch2_berta",
    start: () => (G.state.is("metBerta") ? (G.state.flag("leneFate") === "saved" && !G.state.is("bertaThanked") ? "dank" : "wieder") : "start"),
    nodes: {
      start: {
        speaker: "berta", text: "Bleib stehen. Lass mich dein Gesicht sehen. … Ja. Solche Augen hab ich schon einmal gesehen. Da war ich so klein wie meine Lene, und sie saßen auf dem Wagen des Grafen.",
        do: () => {
          G.state.set("metBerta");
          G.story.learn("berta", 1);
        },
        choices: [
          { text: "Du irrst dich. Ich bin nur ein Reisender.", next: "luege", tag: "luege" },
          { text: "Ich bin Sami von Drakenfels.", next: "wahr", tag: "wahrheit" },
          { text: "Geh nach Hause, alte Frau. Es ist nicht sicher hier.", next: "drohung", tag: "drohung" },
        ],
      },
      luege: {
        speaker: "berta", text: "Reisende kommen nicht nachts von der Burg herunter. Aber gut. Lüg mich an, wenn es dir hilft. Ich bin zu alt, um mich vor Lügen zu fürchten.",
        do: () => G.story.decide("natureBerta", "hidden", "Berta gegenüber die eigene Herkunft verschwiegen"),
        next: "hub",
      },
      wahr: {
        speaker: "berta", text: "Drakenfels. Also ist der Junge doch nicht tot. Meine Mutter hat gesagt, die Gräfin hätte ihn in den Stein gelegt wie einen Schatz, den man vor Dieben versteckt.",
        mood: "nachdenklich",
        do: () => {
          G.state.set("revealedNature");
          G.story.decide("natureBerta", "revealed", "Berta die Wahrheit über die eigene Herkunft gesagt");
        },
        next: "hub",
      },
      drohung: {
        speaker: "berta", text: "Nicht sicher? Kind, hier ist seit zwanzig Nächten nichts mehr sicher. Ich bleibe am Brunnen, bis mein Paul zurückkommt. Du kannst mich beißen, wenn du willst. Aber du kannst mich nicht wegschicken.",
        mood: "wuetend",
        do: () => {
          G.state.set("intimidatedVillagers");
          G.story.decide("bertaThreat", "threat", "Berta am Brunnen eingeschüchtert");
        },
        next: "hub",
      },
      wieder: {
        speaker: "berta", text: "Du bist noch da. Hast du meinen Paul gesehen?",
        choices: [],
        next: "hub",
      },
      hub: {
        speaker: "berta", text: "Frag, was du fragen willst. Der Regen hört heute ohnehin nicht auf.",
        choices: [
          { text: "Wer ist Paul?", next: "paul", tag: "frage", once: true },
          { text: "Wer in diesem Dorf weiß etwas über mein Haus?", next: "ilyas", tag: "frage", once: true },
          { text: "Was ist mit der Kapelle?", next: "kapelle", tag: "frage", once: true },
          { text: "Ich bringe dich nach Hause. Und ich suche deinen Paul.", next: "hilfe", tag: "mitgefuehl", once: true, if: () => !G.state.is("helpedVillagers") },
          { text: "Ich gehe.", next: "end", tag: "ende" },
        ],
      },
      paul: {
        speaker: "berta", text: "Mein Urenkel. Neun Jahre. Vor zwei Nächten stand er am Fenster und hat gesummt, ein Lied, das ihm keiner beigebracht hat. Am Morgen war das Bett leer und die Tür offen. Seine Schwester Lene summt jetzt auch.",
        mood: "traurig",
        do: () => G.story.learn("lene", 1),
        next: "hub",
      },
      ilyas: {
        speaker: "berta", text: "Der Schreiberjunge. İlyas. Das hohe Haus im Westen, das mit dem Licht oben. Seine Familie hat schon für die Grafen geschrieben, als die Grafen noch Steuern genommen haben. Er wird dich mit seiner Armbrust begrüßen. Nimm es ihm nicht übel.",
        do: () => G.story.learn("ilyas", 1),
        next: "hub",
      },
      kapelle: {
        speaker: "berta", text: "Vater Gerold hält dort Messen. Nachts. Seit seine Adelheid tot ist, schläft er nicht mehr. Die Leute sagen, er spricht mit einem Heiligen. Ich sage, ein Heiliger würde keine Kinder rufen.",
        do: () => G.story.learn("gerold", 1),
        next: "hub",
      },
      hilfe: {
        speaker: "berta", text: "… Ein Drakenfels, der einer alten Frau die Hand reicht. Meine Mutter würde es nicht glauben. Hier. Nimm die Kräuter. Für deine Wunden, falls Vampire welche haben.",
        mood: "laechelnd",
        do: () => {
          G.state.set("helpedVillagers");
          G.story.decide("bertaHelp", "help", "Berta Hilfe bei der Suche nach Paul versprochen");
          G.inventory.add("kraeuterbuendel");
        },
        next: "hub",
      },
      dank: {
        speaker: "berta", text: "Lene … Du hast sie zurückgebracht. Paul ist auch zurück, aus dem Loch unter der Kapelle, mit Augen wie ein Fisch, aber er lebt. Was immer du bist, Drakenfels – heute warst du etwas Gutes.",
        mood: "traurig",
        do: () => {
          G.state.set("bertaThanked");
          G.quests.task("q_lene", "berta");
          if (!G.state.is("intimidatedVillagers")) G.state.set("helpedVillagers");
        },
        next: "end",
      },
    },
  },

  // ------------------------------------------------------------------ Konrad
  ch2_konrad: {
    id: "ch2_konrad",
    start: () => (G.state.is("metKonrad") ? "wieder" : "start"),
    nodes: {
      start: {
        speaker: "konrad", text: "Wir haben zu. Nachts wird nicht aufgemacht. Nicht für Reisende, nicht für Geld und nicht für das, was du bist.",
        do: () => {
          G.state.set("metKonrad");
          G.story.learn("konrad", 1);
        },
        choices: [
          { text: "Ich will nicht hinein. Ich will nur reden.", next: "reden", tag: "mitgefuehl" },
          { text: "Öffne die Tür.", next: "befehl", tag: "vampir", hungerMin: 30, lockedHint: "[Vampir] Dein Wille ist noch zu schwach …" },
          { text: "Ich könnte diese Tür auch ohne dich öffnen.", next: "drohung", tag: "drohung" },
        ],
      },
      wieder: { speaker: "konrad", text: "Du schon wieder. Was willst du noch?", next: "fragen" },
      reden: { speaker: "konrad", text: "Reden. Gut. Durch das Holz hindurch redet es sich am besten mit deinesgleichen.", next: "fragen" },
      befehl: {
        speaker: "konrad", text: "Ich … öffne … nein. NEIN. Raus aus meinem Kopf! Gott steh mir bei – was willst du?",
        mood: "aengstlich",
        do: () => {
          G.state.set("intimidatedVillagers");
          G.state.set("revealedNature");
          G.story.decide("konrad", "mesmerized", "Konrad mit vampirischem Willen bedrängt");
          G.abilities.addHunger(4);
        },
        next: "schluessel",
      },
      drohung: {
        speaker: "konrad", text: "Versuch es. Hinter der Tür steht eine Axt, und meine Hände zittern nicht. … Was willst du?",
        mood: "wuetend",
        do: () => G.story.decide("konrad", "threat", "Konrad gedroht"),
        next: "fragen",
      },
      fragen: {
        speaker: "konrad", text: "Frag schnell.",
        choices: [
          { text: "Was weißt du über die Kapelle?", next: "kapelle", tag: "frage", once: true },
          { text: "Waren Fremde im Dorf?", next: "fremde", tag: "frage", once: true },
          { text: "Hast du einen Schlüssel zur Kapelle?", next: "schluesselfrage", tag: "frage", once: true, if: () => !G.state.hasItem("kapellenschluessel") },
          { text: "Das ist alles.", next: "end", tag: "ende" },
        ],
      },
      kapelle: {
        speaker: "konrad", text: "Ich bin Kirchenvogt. War. Gerold hat mich vor zwei Wochen weggeschickt und abgeschlossen. Seitdem brennt da nachts Licht, aber keiner geht hinein. Nur heraus kommt keiner mehr.",
        next: "fragen",
      },
      fremde: {
        speaker: "konrad", text: "Einer. Groß, Fell über den Schultern, roch nach Wald. Ein Wolfsbund-Späher, wenn du mich fragst. Hat nach der Kapelle gefragt und ist hinaufgegangen. Zurück kam er nicht.",
        do: () => G.quests.start("q_rabenfurt", false),
        next: "fragen",
      },
      schluesselfrage: {
        speaker: "konrad", text: "Den Zweitschlüssel. Ja. Warum sollte ich ihn dir geben?",
        choices: [
          { text: "Weil Kinder verschwinden und du Angst hast, hinaufzugehen.", next: "schluessel", tag: "wahrheit" },
          { text: "Weil ich sonst wiederkomme.", next: "schluesselDrohung", tag: "drohung" },
          { text: "Behalte ihn.", next: "fragen", tag: "schweigen" },
        ],
      },
      schluessel: {
        speaker: "konrad", text: "… Hier. Durch die Luke. Und wenn du da oben stirbst, dann bring wenigstens die anderen mit zurück.",
        do: () => {
          G.inventory.add("kapellenschluessel");
          if (!G.state.is("intimidatedVillagers")) G.state.set("helpedVillagers");
        },
        next: "fragen",
      },
      schluesselDrohung: {
        speaker: "konrad", text: "Nimm ihn. Nimm ihn und geh.",
        mood: "aengstlich",
        do: () => {
          G.state.set("intimidatedVillagers");
          G.inventory.add("kapellenschluessel");
        },
        next: "end",
      },
    },
  },

  // ------------------------------------------------------------------ İlyas am Fenster
  ch2_ilyas_window: {
    id: "ch2_ilyas_window",
    start: "start",
    nodes: {
      start: {
        speaker: "ilyas", text: "Keinen Schritt weiter. Die Armbrust ist mit Silber geladen, und ich habe lange geübt. Wer bist du, und warum riechst du nach Grabstein?",
        do: () => G.story.learn("ilyas", 1),
        choices: [
          { text: "Ich bin Sami von Drakenfels. Ich bin vor drei Nächten in der Burg erwacht.", next: "wahr", tag: "wahrheit" },
          { text: "Ein Reisender. Berta schickt mich.", next: "luege", tag: "luege", if: () => G.state.is("metBerta") },
          { text: "Ein Reisender.", next: "luege2", tag: "luege", if: () => !G.state.is("metBerta") },
          { text: "Senk die Waffe, bevor ich sie dir abnehme.", next: "drohung", tag: "drohung" },
        ],
      },
      wahr: {
        speaker: "ilyas", text: "… Drakenfels. Der Erbe. Mein Urgroßvater hat dein Gesicht beschrieben, aber er hat vergessen zu erwähnen, dass du so jung aussiehst. Warte. Ich komme hinunter. Wenn du mich beißt, verfolgt dich meine Familie bis ans Ende der Chronik.",
        mood: "nachdenklich",
        do: () => {
          G.relations.change("ilyas", 15);
          G.state.set("revealedNature");
          G.story.decide("ilyasFirst", "truth", "İlyas am Fenster die Wahrheit gesagt");
        },
        next: "end",
      },
      luege: {
        speaker: "ilyas", text: "Berta schickt niemanden zu mir, ohne mir vorher Brot zu schicken. Aber sie würde dich nicht zu mir schicken, wenn sie dich für gefährlich hielte. Also lügst du nur halb. Ich komme hinunter.",
        do: () => {
          G.relations.change("ilyas", -5);
          G.story.decide("ilyasFirst", "lie", "İlyas am Fenster belogen");
        },
        next: "end",
      },
      luege2: {
        speaker: "ilyas", text: "Reisende kommen nicht nachts aus Richtung der Burg, und Reisende werfen im Laternenlicht einen Schatten. Du nicht. Versuch es noch einmal.",
        choices: [
          { text: "Ich bin Sami von Drakenfels.", next: "wahr", tag: "wahrheit" },
          { text: "Senk die Waffe.", next: "drohung", tag: "drohung" },
        ],
      },
      drohung: {
        speaker: "ilyas", text: "Nein.",
        do: () => {
          G.relations.change("ilyas", -15);
          G.story.decide("ilyasFirst", "threat", "İlyas am Fenster bedroht");
          G.state.set("ilyasShot");
        },
        next: "nachSchuss",
      },
      nachSchuss: {
        speaker: "ilyas", text: "Das war eine Warnung. Silber brennt, nicht wahr? Gut. Jetzt weißt du, dass ich es ernst meine. Bleib da stehen. Ich komme hinunter, und wir reden wie zwei Leute, die einander nicht trauen.",
        mood: "kalt",
        next: "end",
      },
    },
  },

  // ------------------------------------------------------------------ İlyas im Haus
  ch2_ilyas: {
    id: "ch2_ilyas",
    start: () => (G.state.is("talkedIlyas") ? (G.state.is("chapelDone") ? "nachKapelle" : "wieder") : "start"),
    nodes: {
      start: {
        speaker: "ilyas", text: "Setz dich nicht. Ich habe nur einen Stuhl, und auf dem sitze ich. … Gut. Du willst wissen, was mit deinem Haus geschehen ist. Ich will wissen, warum Menschen in meinem Dorf verschwinden. Vielleicht ist das dieselbe Frage.",
        do: () => {
          G.state.set("talkedIlyas");
          G.quests.task("q_rabenfurt", "ilyas");
        },
        next: "hub",
      },
      wieder: { speaker: "ilyas", text: "Noch etwas?", next: "hub" },
      hub: {
        speaker: "ilyas", text: "Frag.",
        choices: [
          { text: "Was weiß deine Familie über die Nacht von 1146?", next: "chronik", tag: "frage", once: true },
          { text: "Wer verschwindet hier?", next: "verschwunden", tag: "frage", once: true },
          { text: "Ich habe in der Burg Erinnerungen gesehen. Meine Mutter. Eine zweite Frau.", next: "erzaehlen", tag: "wahrheit", once: true, if: () => G.state.hasMemory("m_siegel") },
          { text: "Ich kenne den Wahlspruch meines Hauses.", next: "wahlspruch", tag: "wahrheit", once: true, if: () => G.state.hasItem("rabenchronik") && !!G.state.flag("mottoKnown") },
          { text: "Ich gehe zur Kapelle.", next: "kapelle", tag: "ende", if: () => G.state.hasItem("rabenchronik") },
          { text: "Später.", next: "end", tag: "ende" },
        ],
      },
      chronik: {
        speaker: "ilyas", text: "Mein Urgroßvater Anselm war Schreiber in eurem Haus. Er kam in jener Nacht allein herunter, mit weißem Haar, und hat nie wieder geschlafen, ohne zu schreien. Er hat alles aufgeschrieben. Den Teil, auf den es ankommt, hat er verschlüsselt.",
        do: () => {
          G.inventory.add("rabenchronik");
          G.quests.task("q_rabenfurt", "dokumente");
          G.story.learn("anselm", 1);
          G.story.learn("ilyas", 2);
        },
        next: "chronik2",
      },
      chronik2: {
        speaker: "ilyas", text: "Lies es. Und dann sag mir, warum ein alter Mann, der nichts mehr zu verlieren hatte, so große Angst davor hatte, dass jemand anderes als ein Drakenfels die Wahrheit liest.",
        do: () => G.story.readDocument("rabenchronik"),
        next: "hub",
      },
      verschwunden: {
        speaker: "ilyas", text: "Drei, seit der Mond rot wurde. Alle haben vorher gesummt. Alle wurden zuletzt an der Kapelle gesehen. Ich habe es aufgeschrieben, weil Aufschreiben das Einzige ist, was ich kann, wenn ich mich nicht traue, hinaufzugehen.",
        mood: "traurig",
        do: () => {
          G.story.readDocument("ilyas_notizen");
          G.quests.task("q_rabenfurt", "dokumente");
        },
        next: "hub",
      },
      erzaehlen: {
        speaker: "ilyas", text: "Eine Frau, die an deinem Sarg kniet, und eine, die eine Kerze hält. … Anselm schrieb von einer Morwen. Einem Mündel im Haus, das nach jener Nacht spurlos verschwand. Wenn ich du wäre, würde ich herausfinden, ob sie noch lebt. Und warum sie dich nicht weckt, sondern Kerzen anzündet.",
        do: () => {
          G.relations.change("ilyas", 10);
          G.state.set("toldIlyasTruth");
          G.story.decide("ilyasTruth", "shared", "İlyas von den eigenen Erinnerungen erzählt");
        },
        next: "hub",
      },
      wahlspruch: {
        speaker: "ilyas", text: "Mond, Rabe, Krone, Blut. … Das ist der Schlüssel, aber nicht das Schloss. Anselm benutzte eine Chiffrierscheibe. Sie ist nicht hier. Er schrieb, er habe sie dort gelassen, ‚wo der Schreiber schrieb'. In der Burg also. Wenn du je zurückgehst, nimm mich mit.",
        mood: "nachdenklich",
        do: () => {
          G.relations.change("ilyas", 10);
          G.state.set("ilyasKnowsCipher");
        },
        next: "hub",
      },
      kapelle: {
        speaker: "ilyas", text: "Dann geh. Und komm zurück, wenn du kannst. Ich will wissen, was du gefunden hast – nicht, was du mir erzählen willst. Das ist ein Unterschied.",
        next: "end",
      },
      nachKapelle: {
        speaker: "ilyas", text: "Du lebst. Und Lene … Berta wird es mir erzählen, bevor du es tust. Was war da unten?",
        choices: [
          { text: "Es spricht mit den Stimmen der Toten. Es hat mich ‚Erbe' genannt. Und ein Späher des Wolfsbundes ist dort gestorben.", next: "wahrheit", tag: "wahrheit" },
          { text: "Ein verwirrter Priester. Mehr nicht.", next: "luege", tag: "luege" },
        ],
      },
      wahrheit: {
        speaker: "ilyas", text: "… Dann hat Anselm recht gehabt. Es ist nicht vorbei. Hier – meine Karte vom Schwarzen Forst. Wenn der Wolfsbund von seinem toten Späher erfährt, ist es besser, du erklärst es ihnen, bevor sie es selbst herausfinden. Ich gehe zur Burg, sobald ich den Mut habe. Vielleicht findest du mich dort.",
        mood: "nachdenklich",
        do: () => {
          G.relations.change("ilyas", 15);
          G.state.set("toldIlyasTruth");
          G.story.decide("ilyasChapel", "truth", "İlyas die Wahrheit über die Kapelle erzählt");
          G.inventory.add("ilyas_karte");
        },
        next: "end",
      },
      luege: {
        speaker: "ilyas", text: "Ein verwirrter Priester, der Kinder in eine Grube führt. Gut. Dann behalte deine Wahrheit. Die Karte bekommst du trotzdem – nicht für dich, für Rabenfurt. Und wenn du mich je wieder brauchst, wirst du mir mehr erzählen müssen.",
        mood: "kalt",
        do: () => {
          G.relations.change("ilyas", -15);
          G.story.decide("ilyasChapel", "lie", "İlyas über die Kapelle belogen");
          G.inventory.add("ilyas_karte");
        },
        next: "end",
      },
    },
  },

  // ------------------------------------------------------------------ Vater Gerold
  ch2_gerold: {
    id: "ch2_gerold",
    start: "start",
    nodes: {
      start: {
        speaker: "gerold", text: "Du bist gekommen. Er hat gesagt, dass du kommst. Er hat gesagt, das Gefäß kehrt heim, und die Träumenden werden es tragen. Knie nieder, Erbe. Er hört dich.",
        do: () => G.story.learn("gerold", 1),
        choices: [
          { text: "Wer spricht zu dir, Gerold?", next: "wer", tag: "frage" },
          { text: "Lass das Kind gehen.", next: "kind", tag: "mitgefuehl" },
          { text: "Ich knie vor niemandem.", next: "stolz", tag: "vampir" },
        ],
      },
      wer: {
        speaker: "gerold", text: "Meine Adelheid. Sie ist bei ihm. Er spricht mit ihrer Stimme, damit ich keine Angst habe. Hörst du? Sie lacht. Sie hat sieben Winter nicht gelacht.",
        mood: "laechelnd",
        next: "kern",
      },
      kind: { speaker: "gerold", text: "Gehen? Sie geht doch. Sie geht zu ihm. Alle gehen zu ihm, am Ende. Ich mache den Weg nur kürzer.", next: "kern" },
      stolz: { speaker: "gerold", text: "Nicht vor ihm? Er war vor deinem Blut da, Junge. Vor deinem Namen. Er war da, bevor jemand auf die Idee kam, die Dunkelheit zu benennen.", mood: "wuetend", next: "kern" },
      kern: {
        speaker: "gerold", text: "Er braucht nur Träume. Ein wenig Vergessen. Ist das so viel? Für einen Gott?",
        choices: [
          { text: "Das ist nicht Adelheid. Es leiht sich ihre Stimme, wie es sich meine Familie geliehen hat.", next: "erkenntnis", tag: "wahrheit", if: () => G.state.hasMemory("m_kapelle"), lockedHint: "[Dir fehlt eine Erinnerung an diesen Ort …]" },
          { text: "Ich lasse dich leben, wenn du die Menschen gehen lässt.", next: "verschonen", tag: "mitgefuehl" },
          { text: "Dein Gott wird heute Nacht hungrig bleiben.", next: "toeten", tag: "drohung" },
          { text: "Dann gib mir, was er nimmt.", next: "trinken", tag: "hunger", hungerMin: 50, lockedHint: "[Blutdurst zu gering] …" },
        ],
      },
      erkenntnis: {
        speaker: "gerold", text: "Nein … nein, sie … sie hat gesagt, mein Name ist Gerold, aber Adelheid hat mich nie Gerold genannt. Sie hat … sie hat mich … Gott. Gott im Himmel. Was habe ich getan?",
        mood: "traurig",
        do: () => {
          G.story.decide("gerold", "spared", "Vater Gerold die Wahrheit gezeigt und verschont");
          G.state.set("geroldBroken");
        },
        next: "end",
      },
      verschonen: {
        speaker: "gerold", text: "Leben … ja. Leben, damit ich mich erinnere. Das ist grausamer als alles, was er tun könnte. Geh. Nimm sie mit. Nimm sie alle mit.",
        mood: "traurig",
        do: () => G.story.decide("gerold", "spared", "Vater Gerold verschont"),
        next: "end",
      },
      toeten: {
        speaker: "gerold", text: "Dann tu es. Er nimmt mich ohnehin. Er nimmt dich auch. Er hat dich schon …",
        do: () => {
          G.story.decide("gerold", "killed", "Vater Gerold getötet");
          G.state.set("geroldDead");
        },
        next: "end",
      },
      trinken: {
        speaker: "gerold", text: "Ja … ja, trink. Er schmeckt mit dir. Er schmeckt durch dich …",
        do: () => {
          G.story.decide("gerold", "fed", "Von Vater Gerold getrunken");
          G.state.set("geroldDead");
          G.abilities.addHunger(-50);
          G.player.heal(50);
          G.audio.sfx("feed");
        },
        next: "end",
      },
    },
  },

  // ------------------------------------------------------------------ Lene
  ch2_lene: {
    id: "ch2_lene",
    start: "start",
    nodes: {
      start: {
        speaker: "lene", text: "… tief im Brunnen schläft der Mond … Du bist das. Der Mann aus dem Lied. Er hat gesagt, du kommst und holst mich ab.",
        choices: [
          { text: "Ich bringe dich nach Hause, Lene.", next: "heim", tag: "mitgefuehl" },
          { text: "Wer hat das gesagt?", next: "wer", tag: "frage" },
        ],
      },
      wer: { speaker: "lene", text: "Der mit der Stimme von deiner Mama. Er kennt das Lied. Aber nur die Hälfte. Er hat gesagt, die andere Hälfte hast du.", mood: "nachdenklich", next: "heim" },
      heim: {
        speaker: "lene", text: "… Mir ist kalt. Wo ist Paul?",
        do: () => {
          G.state.set("leneFate", "saved");
          G.quests.task("q_lene", "retten");
        },
        next: "end",
      },
    },
  },
};
