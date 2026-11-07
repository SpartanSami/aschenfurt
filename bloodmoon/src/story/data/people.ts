import type { PersonDef } from "../types";

export const PEOPLE: Record<string, PersonDef & { alias?: string }> = {
  sami: {
    id: "sami", name: "Sami von Drakenfels", role: "Erbe des Hauses Drakenfels",
    entries: [
      { level: 1, text: "Ich. Ein Vampir aus der ältesten Blutlinie Vareths. Achtzig Jahre in einem Sarkophag unter der eigenen Burg. Meine Erinnerungen sind Scherben, und manche schneiden." },
      { level: 2, text: "Ein Gefäß. Mein Vater hat mich gezeugt, damit etwas in mir wohnen kann, das älter ist als jedes Leben in Vareth." },
      { level: 3, text: "Meine Mutter hat mich nicht eingesperrt. Sie hat mich versteckt – vor ihm und vor meinem Vater." },
    ],
  },
  ysolde: {
    id: "ysolde", name: "Ysolde von Drakenfels", role: "Gräfin von Drakenfels, meine Mutter",
    entries: [
      { level: 1, text: "Die Frau aus meiner ersten Erinnerung. Ihr Porträt hing verhüllt in der Ahnengalerie, als hätte jemand ihren Anblick nicht mehr ertragen." },
      { level: 2, text: "Sie hat Corvins Ritual umgelenkt und mich versiegelt. Danach ist sie hinabgestiegen – dorthin, wo der Erste schläft." },
      { level: 3, text: "Sie lebt. Oder das, was von ihr übrig ist: gebunden im Siegel, seit achtzig Jahren, und sie hat ihm nie verraten, was sie vor ihm versteckt." },
    ],
  },
  corvin: {
    id: "corvin", name: "Graf Corvin von Drakenfels", role: "Mein Vater",
    entries: [
      { level: 1, text: "Er wollte, dass unser Haus herrscht statt dient. Er nannte mich „den Erben“, kaum je bei meinem Namen." },
      { level: 2, text: "Er ist nicht gestorben. Er wurde vergessen. Der Erste hat ihn in jener Nacht verschlungen – Erinnerung um Erinnerung." },
    ],
  },
  mine: {
    id: "mine", name: "Mine", alias: "Die Stimme", role: "Vampirin aus dem Haus Morwen",
    entries: [
      { level: 1, text: "Eine Frauenstimme in der Burg: „Du hättest niemals aufwachen dürfen.“ Ich kenne sie, und das macht es schlimmer." },
      { level: 2, text: "Mine aus dem Haus Morwen, einst Mündel unseres Hauses. Sie kannte mich, bevor ich schlief – besser, als ich mich selbst kenne." },
      { level: 3, text: "Sie hat achtzig Jahre lang einen Dolch getragen, der für mich bestimmt war. Und jede Nacht eine Kerze an meinem Sarkophag angezündet." },
    ],
  },
  bassem: {
    id: "bassem", name: "Bassem", role: "Hüter der Grenze, Wolfsbund",
    entries: [
      { level: 1, text: "Ein Werwolf, der die alte Grenze des Schwarzen Forstes bewacht. Er erkennt mein Blut am Geruch. Sein Vater starb in den Kerkern meines Hauses." },
      { level: 2, text: "Er hasst mein Haus. Aber er hasst das, was unter Vareth erwacht, noch mehr – und er ist ehrlich genug, das zuzugeben." },
    ],
  },
  ilyas: {
    id: "ilyas", name: "İlyas Rabe", role: "Chronist von Rabenfurt",
    entries: [
      { level: 1, text: "Ein Mensch, der einem Vampir eine Armbrust entgegenhält – und trotzdem mit ihm redet. Seine Familie hütet seit Generationen die Chronik der Schreiber von Drakenfels." },
      { level: 2, text: "Nachfahre Anselms, des Schreibers, der als Einziger die Nacht des Rituals überlebte. Er weiß mehr, als er sagt – und er hat Gründe dafür." },
    ],
  },
  anselm: {
    id: "anselm", name: "Anselm Rabe", role: "Schreiber des Hauses Drakenfels (†)",
    entries: [{ level: 1, text: "Er ließ beim letzten Festmahl seinen Becher fallen. Er überlebte die Nacht als Einziger und schrieb danach, bis seine Hände versagten." }],
  },
  berta: { id: "berta", name: "Berta", role: "Älteste von Rabenfurt", entries: [{ level: 1, text: "Sie wartet am Brunnen auf ihren verschwundenen Urenkel Paul. Sie erkennt Drakenfels-Augen, wenn sie welche sieht – sie hat sie als Kind gesehen." }] },
  konrad: { id: "konrad", name: "Konrad", role: "Wirt des „Krähenkrugs“", entries: [{ level: 1, text: "Er spricht nur durch eine verriegelte Tür. Er hat Angst, und Angst macht ihn grob – aber nicht dumm." }] },
  lene: { id: "lene", name: "Lene", role: "Ein Mädchen aus Rabenfurt", entries: [{ level: 1, text: "Sie schlafwandelt barfuß zur Kapelle und summt das Lied, das meine Mutter mir vorsang." }] },
  gerold: { id: "gerold", name: "Vater Gerold", role: "Priester von Rabenfurt", entries: [{ level: 1, text: "Er hört eine Stimme aus der Tiefe, die wie seine tote Frau klingt, und hält sie für einen Heiligen. Er führt die Träumenden zu ihr." }] },
  nadira: { id: "nadira", name: "Nadira", role: "Bassems Schwester", entries: [{ level: 1, text: "Der rote Mond hat sie in eine Bestie verwandelt, die sich selbst nicht mehr erkennt. Sie trägt noch das Band, das ein Späher namens Tarek ihr schenkte." }] },
  malachias: { id: "malachias", name: "Prior Malachias", role: "Letzter Priester von Ebon", entries: [{ level: 1, text: "Ein uralter Vampir, der seit Jahrzehnten im Chorgestühl sitzt, das Holz mit immer demselben Satz bedeckt und mit vielen Stimmen spricht." }] },
  erste: {
    id: "erste", name: "Der Erste", role: "Was zuerst da war",
    entries: [
      { level: 1, text: "Es spricht mit geliehenen Stimmen. Es zeigt Erinnerungen, die vielleicht nie geschehen sind." },
      { level: 2, text: "Der Ursprung beider Blutlinien – der Vampire und der Wölfe. Es nährt sich von dem, was vergessen wird, und wird größer mit allem, was es frisst." },
    ],
  },
};
