import type { DialogueDef } from "../types";
import { G } from "../../core/Context";

const giveDagger = () => {
  if (!G.state.hasItem("schlafdorn")) G.inventory.add("schlafdorn");
  G.state.set("mineAllied");
  G.story.decide("schlafdorn", "given", "Mine übergab dir den Schlafdorn");
  G.quests.task("q_mine", "wahrheit");
  G.story.learn("mine", 3);
};

export const DIALOGUES_CH5: Record<string, DialogueDef> = {
  ch5_mine_arrive: {
    id: "ch5_mine_arrive",
    start: "start",
    nodes: {
      start: {
        speaker: "mine", text: "Ich habe gesagt, wir reden in Drakenfels. Hier bin ich. Die Burg hat sich verändert, seit du fort bist. Oder sie zeigt endlich, was sie immer war.",
        choices: [
          { text: "Du bist mir gefolgt.", next: "gefolgt", tag: "frage" },
          { text: "Diesmal sagst du mir alles.", next: "alles", tag: "wahrheit" },
        ],
      },
      gefolgt: { speaker: "mine", text: "Ich folge dir seit achtzig Jahren. Ich habe nur gewartet, dass du dich bewegst.", mood: "laechelnd", next: "alles" },
      alles: {
        speaker: "mine", text: "Wenn du weißt, was in jener Nacht geschah. Nicht vorher. Die Gemächer deiner Mutter liegen hinter dem Kinderzimmer. Ich habe die Tür nie geöffnet. Ich konnte es nicht.",
        mood: "traurig",
        next: "end",
      },
    },
  },

  ch5_reconstruct: {
    id: "ch5_reconstruct",
    start: "start",
    nodes: {
      start: {
        speaker: "sami", text: "Vier Erinnerungen an jene Nacht. Eine davon gehört nicht mir. Welche ist falsch?",
        choices: [
          { text: "Vater erhebt das Glas auf den Erben.", next: "echt1", tag: "frage" },
          { text: "Der Rauch ohne Licht steigt in mich hinein.", next: "echt2", tag: "frage" },
          { text: "Mutter schneidet sich die Hände auf und legt sie auf meine Brust.", next: "echt3", tag: "frage" },
          { text: "Mine steht über mir, den Dolch an meiner Kehle. Mutter liegt reglos am Boden.", next: "falsch", tag: "wahrheit" },
        ],
      },
      echt1: { speaker: "sami", text: "Nein. Das Glas, Anselms Becher, das Lachen der Gäste – das habe ich gesehen, in diesem Saal, mit Blut auf dem Tischtuch.", next: "start" },
      echt2: { speaker: "sami", text: "Nein. Diese Kälte kann man nicht erfinden. Sie sitzt noch heute in meinen Knochen.", next: "start" },
      echt3: { speaker: "sami", text: "Nein. Ihre Hände waren warm. Und die Wunden waren echt – ich habe sie gespürt, als sie mich in den Stein legte.", next: "start" },
      falsch: {
        speaker: "sami", text: "In dieser Erinnerung sind ihre Hände unversehrt. Sie hat das Siegel nie berührt. Das kann nicht sein. Er hat sie mir gegeben, damit ich Mine hasse.",
        do: () => G.state.set("fakeFound"),
        next: "end",
      },
    },
  },

  ch5_mine: {
    id: "ch5_mine",
    start: "start",
    nodes: {
      start: {
        speaker: "sami", text: "Ich habe eine Erinnerung gesehen, Mine. Du stehst über mir, den Dolch an meiner Kehle. Und meine Mutter liegt tot zu deinen Füßen.",
        next: "frage",
      },
      frage: {
        speaker: "mine", text: "… Und du glaubst ihr?",
        mood: "kalt",
        choices: [
          { text: "Nein. Sie war falsch. Er hat sie mir gegeben, damit ich dich hasse.", next: "falsch", tag: "wahrheit", if: () => G.state.is("fakeFound") },
          { text: "Sag du es mir.", next: "sag", tag: "frage" },
          { text: "Ich sollte dich töten, bevor du es tust.", next: "drohung", tag: "drohung" },
        ],
      },
      falsch: {
        speaker: "mine", text: "Er kennt mich gut. Er hat achtzig Jahre lang zugehört, wie ich an deinem Sarg geredet habe. … Ja, es gibt einen Dolch. Aber deine Mutter lag nie zu meinen Füßen. Sie stand. Bis zum Schluss.",
        mood: "traurig",
        do: () => G.relations.change("mine", 15),
        next: "wahrheit",
      },
      sag: { speaker: "mine", text: "Es gibt einen Dolch. Den Schlafdorn. Deine Mutter hat ihn mir gegeben.", next: "wahrheit" },
      drohung: {
        speaker: "mine", text: "Dann versuch es. Ich habe achtzig Jahre lang überlegt, ob ich es kann. Vielleicht nimmst du mir die Entscheidung ab.",
        mood: "wuetend",
        do: () => G.relations.change("mine", -15),
        choices: [
          { text: "„Tief im Brunnen schläft der Mond …“", next: "lied", tag: "mitgefuehl", if: () => G.state.is("verse1"), lockedHint: "[Du kennst kein Lied, das sie beruhigen könnte …]" },
          { text: "… Nein. Ich will dir nicht wehtun.", next: "wahrheit", tag: "mitgefuehl", do: () => G.relations.change("mine", 8) },
          { text: "Gib mir den Dolch.", next: "weg", tag: "drohung" },
        ],
      },
      lied: {
        speaker: "mine", text: "„… wo kein Wind die Wasser kämmt.“ Du erinnerst dich. Er hätte das nicht gewusst. Nicht so. Nicht mit diesem Gesicht.",
        mood: "traurig",
        do: () => G.relations.change("mine", 22),
        next: "wahrheit",
      },
      weg: {
        speaker: "mine", text: "Nein. Den bekommt niemand, der so fragt. Ich gehe hinab, Sami – vor dir. Und wenn er dort mit deiner Stimme spricht, werde ich ihn erkennen.",
        mood: "kalt",
        do: () => {
          G.state.set("mineLeft");
          G.story.decide("schlafdorn", "kept", "Mine behielt den Schlafdorn und ging allein voraus");
          G.quests.task("q_mine", "wahrheit");
        },
        next: "end",
      },
      wahrheit: {
        speaker: "mine", text: "Ich habe ihr versprochen: Wenn du erwachst und er in dir ist, beende ich es. Darum stand ich auf der Mauer. Darum habe ich gesagt, du hättest niemals aufwachen dürfen. Weil ich dann wählen müsste.",
        mood: "traurig",
        do: () => {
          G.quests.task("q_mine", "wahrheit");
          G.story.learn("mine", 3);
        },
        choices: [
          { text: "Und? Ist er in mir?", next: "inmir", tag: "frage" },
          { text: "Du hättest es tun können, als ich schlief.", next: "schlief", tag: "frage" },
        ],
      },
      inmir: {
        speaker: "mine", text: "Ein Splitter. Ich sehe ihn manchmal in deinen Augen, wenn du hungrig bist. Aber du bist noch da. Du hast nach mir gefragt, nicht nach Macht. Das hätte er nicht getan.",
        next: "dorn",
      },
      schlief: {
        speaker: "mine", text: "Dann hätte ich nie erfahren, ob du es noch bist. Und ich wollte es wissen. Mehr als alles andere.",
        mood: "traurig",
        next: "dorn",
      },
      dorn: {
        speaker: "mine", text: "",
        next: () => (G.relations.get("mine") >= 25 ? "gibt" : "zoegert"),
      },
      gibt: {
        speaker: "mine", text: "Nimm ihn. Wenn jemand ihn führen soll, dann du. Deine Mutter schrieb, das Band könne gelöst werden. Vielleicht braucht man dazu eine Klinge, die nicht schneidet, sondern trennt.",
        mood: "laechelnd",
        do: giveDagger,
        choices: [
          { text: "Komm mit mir hinab, Mine.", next: "mit", tag: "mitgefuehl" },
        ],
      },
      mit: { speaker: "mine", text: "Natürlich komme ich mit. Ich zünde seit achtzig Jahren Kerzen für dich an. Eine mehr macht keinen Unterschied.", mood: "laechelnd", next: "end" },
      zoegert: {
        speaker: "mine", text: "Den Dorn behalte ich. Noch. Wenn wir unten sind und er mit deiner Stimme spricht, dann will ich ihn in der Hand haben.",
        mood: "kalt",
        choices: [
          { text: "Ich vertraue dir mein Leben an, Mine. Vertrau mir den Dorn an.", next: "zweite", tag: "mitgefuehl", once: true },
          { text: "Ich verstehe.", next: "versteh", tag: "schweigen" },
        ],
      },
      zweite: {
        speaker: "mine", text: "",
        do: () => G.relations.change("mine", 12),
        next: () => (G.relations.get("mine") >= 25 ? "gibt" : "nein"),
      },
      nein: {
        speaker: "mine", text: "Nicht heute. Frag mich unten noch einmal. Wenn du dann noch du bist.",
        mood: "traurig",
        do: () => {
          G.state.set("mineKeepsDagger");
          G.story.decide("schlafdorn", "kept", "Mine behielt den Schlafdorn");
        },
        next: "end",
      },
      versteh: {
        speaker: "mine", text: "Gut. Dann gehen wir. Du zuerst. Ich bleibe hinter dir. Das war schon immer mein Platz.",
        do: () => {
          G.state.set("mineKeepsDagger");
          G.story.decide("schlafdorn", "kept", "Mine behielt den Schlafdorn");
        },
        next: "end",
      },
    },
  },

  ch5_ilyas: {
    id: "ch5_ilyas",
    start: () => (G.state.is("anselmDecoded") ? "danach" : G.dialogue.seen("ch5_ilyas") ? "wieder" : "start"),
    nodes: {
      start: {
        speaker: "ilyas", text: "",
        next: () => (G.relations.get("ilyas") >= 10 ? "mutig" : "anselm"),
      },
      mutig: { speaker: "ilyas", text: "Ich habe den Mut gefunden. Er lag zwischen Rabenfurt und deinem Tor, ungefähr auf halber Strecke, unter einem toten Baum.", mood: "laechelnd", do: () => G.story.learn("ilyas", 2), next: "scheibe" },
      anselm: { speaker: "ilyas", text: "Ich bin nicht deinetwegen hier. Ich bin wegen Anselm hier. Er hat achtzig Jahre darauf gewartet, dass jemand seine Seiten liest.", mood: "kalt", do: () => G.story.learn("ilyas", 2), next: "scheibe" },
      wieder: { speaker: "ilyas", text: "Die Scheibe. Wo der Schreiber schrieb. Such weiter.", next: "end" },
      scheibe: {
        speaker: "ilyas", text: "„Wo der Schreiber schrieb.“ Anselm schrieb hier, am Tisch deines Vaters. Er hasste diesen Tisch, steht in der Chronik. Er hat einmal eine Feder hineingerammt, so wütend war er.",
        choices: [
          { text: "Ich suche danach.", next: "end", tag: "ende" },
          { text: "Was erwartest du, darin zu lesen?", next: "erwartung", tag: "frage" },
        ],
      },
      erwartung: { speaker: "ilyas", text: "Eine Entschuldigung, glaube ich. Dafür, dass er überlebt hat. Menschen, die überleben, schreiben immer Entschuldigungen.", mood: "nachdenklich", next: "end" },
      danach: {
        speaker: "ilyas", text: "„Nicht vernichten. Nicht beherrschen. Lösen.“ … Weißt du, was das heißt, Sami? Ich nicht. Aber ich weiß, dass es niemand je versucht hat.",
        choices: [
          { text: "Komm mit mir hinab, İlyas.", next: "mit", tag: "mitgefuehl" },
          { text: "Bleib hier. Es ist zu gefährlich.", next: "bleib", tag: "mitgefuehl" },
        ],
      },
      mit: {
        speaker: "ilyas", text: "",
        next: () => (G.relations.get("ilyas") >= 10 ? "mitJa" : "mitNein"),
      },
      mitJa: {
        speaker: "ilyas", text: "Jemand muss aufschreiben, was dort unten geschieht. Und jemand muss die Worte lesen, die dort in den Stein geschrieben sind – Anselm schreibt von Inschriften, älter als jede Sprache, die ihr Vampire kennt.",
        do: () => {
          G.state.set("ilyasAllied");
          G.story.decide("ilyasGo", "with", "İlyas begleitet dich in die Kammern");
        },
        next: "end",
      },
      mitNein: {
        speaker: "ilyas", text: "Mit dir? Nach allem, was du mir verschwiegen hast? Nein. Ich bleibe hier und schreibe auf, dass du gegangen bist. Das ist mehr, als die meisten Drakenfels von einem Menschen bekommen.",
        mood: "kalt",
        do: () => G.story.decide("ilyasGo", "stay", "İlyas weigerte sich, mitzukommen"),
        next: "end",
      },
      bleib: {
        speaker: "ilyas", text: "Gefährlich. Als ob es hier oben sicher wäre. … Gut. Ich schreibe auf, dass du gegangen bist. Und ich schreibe deinen Namen dazu, nicht nur deinen Titel.",
        do: () => {
          G.relations.change("ilyas", 5);
          G.story.decide("ilyasGo", "stay", "İlyas blieb auf deinen Wunsch in der Burg");
        },
        next: "end",
      },
    },
  },

  ch5_bassem: {
    id: "ch5_bassem",
    start: () => (G.state.is("bassemPromise") ? "versprochen" : "allein"),
    nodes: {
      versprochen: {
        speaker: "bassem", text: "Du hast geheult. Ich habe es bis zur Grenze gehört. Der Wolfsbund steht vor deinem Tor, Drakenfels – zum ersten Mal ohne Fackeln.",
        choices: [
          { text: "Ich brauche euch da unten. Das Ding unter Vareth ruft eure Mondkranken.", next: "ja", tag: "wahrheit" },
        ],
      },
      ja: {
        speaker: "bassem", text: "Dann halten wir sie dir vom Leib. Aber hör zu: Wenn du ihm nachgibst, reißen wir dich in Stücke. Das ist kein Vertrag. Das ist ein Versprechen.",
        mood: "kalt",
        do: () => {
          G.state.set("bassemAllied");
          G.quests.task("q_ritual", "bassem");
          G.story.decide("bassemAllied", "yes", "Der Wolfsbund steht an deiner Seite");
        },
        next: "end",
      },
      allein: {
        speaker: "bassem", text: "Ich bin allein gekommen. Die Ältesten wissen nicht, dass ich hier bin. Sie würden mir das Fell abziehen. Also: Warum sollte ich bleiben?",
        choices: [
          { text: "Mein Haus hat deinem Volk alles genommen. Lass mich ein einziges Mal etwas zurückgeben.", next: "ja", tag: "mitgefuehl", if: () => G.state.is("acknowledgedCrimes") },
          { text: "Nadira hat gesagt, mein Blut sei still. Hilf mir, es still zu halten.", next: "ja", tag: "wahrheit", if: () => G.state.flag("nadiraFate") === "calmed" },
          { text: "Ich kann dich nicht zwingen.", next: "nein", tag: "schweigen" },
        ],
      },
      nein: {
        speaker: "bassem", text: "Nein. Kannst du nicht. … Ich warte am Tor. Wenn das Ding herauskommt, bin ich da. Aber hinunter gehe ich nicht. Nicht für einen Drakenfels.",
        do: () => {
          G.quests.task("q_ritual", "bassem");
          G.story.decide("bassemAllied", "no", "Bassem blieb am Tor");
        },
        next: "end",
      },
    },
  },

  ch5_ruprecht: {
    id: "ch5_ruprecht",
    start: "start",
    nodes: {
      start: {
        speaker: "verlorener", text: "Junger Herr … der Herr ist zurück. Er sitzt unter dem Stein und fragt nach Euch. Er hat Euren Namen vergessen. Er fragt trotzdem.",
        do: () => G.story.learn("corvin", 2),
        choices: [
          { text: "Ruhe jetzt, Ruprecht. Bald.", next: "end", tag: "mitgefuehl" },
        ],
      },
    },
  },
};
