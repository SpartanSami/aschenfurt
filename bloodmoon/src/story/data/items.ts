import type { ItemDef } from "../types";

export const ITEMS: Record<string, ItemDef> = {
  // Kapitel 1
  blutphiole: { id: "blutphiole", name: "Blutphiole", category: "phiole", icon: "vial", usable: true, desc: "Ein versiegeltes Glas mit altem, dunklem Blut. Es stillt den Durst – bitter, aber zuverlässig." },
  ysolde_brief1: { id: "ysolde_brief1", name: "Zerrissener Brief (I)", category: "dokument", icon: "letter", quest: "q_briefe", desc: "Ein Brief in einer eleganten, zittrigen Hand. Neben dem Sarkophag gefunden." },
  ysolde_brief2: { id: "ysolde_brief2", name: "Zerrissener Brief (II)", category: "dokument", icon: "letter", quest: "q_briefe", desc: "Das zweite Stück des Briefes. Halb verkohlt, aus dem Kamin der Galerie." },
  holzpferd: { id: "holzpferd", name: "Holzpferd", category: "quest", icon: "toy", quest: "q_holzpferd", desc: "Ein kleines, abgegriffenes Spielzeugpferd. In die Flanke ist ein „S“ geritzt. Es lag dort, wo eben noch jemand stand." },
  corvin_notiz: { id: "corvin_notiz", name: "Notizen des Grafen", category: "dokument", icon: "scroll", desc: "Hastige Notizen auf einem Bogen Pergament, mit Siegellack beschwert." },
  rotes_buch: { id: "rotes_buch", name: "Das Rote Buch", category: "dokument", icon: "book", quest: "q_erwachen", desc: "Die Hauschronik der Drakenfels, in rotes Leder gebunden. Viele Seiten fehlen." },
  siegelring: { id: "siegelring", name: "Siegelring der Drakenfels", category: "schluessel", icon: "ring", quest: "q_erwachen", desc: "Ein schwerer Silberring mit dem Wappen des Hauses: Rabe vor rotem Mond. Er passt an deinen Finger, als hätte er immer dort gesteckt." },
  mondtafel: { id: "mondtafel", name: "Abschrift der Mondtafel", category: "dokument", icon: "scroll", quest: "q_erwachen", desc: "Deine Abschrift der astronomischen Tafel im Thronsaal." },
  // Kapitel 2
  kapellenschluessel: { id: "kapellenschluessel", name: "Kapellenschlüssel", category: "schluessel", icon: "key", quest: "q_rabenfurt", desc: "Ein großer, eiserner Schlüssel. An der Öse hängt ein verblichenes Band in Kirchenrot." },
  rabenchronik: { id: "rabenchronik", name: "Rabenchronik (Auszug)", category: "dokument", icon: "book", quest: "q_rabenfurt", desc: "Abgeschriebene Seiten aus der Chronik von İlyas' Familie. Ein Teil ist in einer fremden Chiffre verfasst." },
  ilyas_karte: { id: "ilyas_karte", name: "İlyas' Karte", category: "quest", icon: "map", quest: "q_rabenfurt", desc: "Eine handgezeichnete Karte des Schwarzen Forstes. Drei Grenzsteine sind markiert, dahinter ein Turm: „Rabenwacht“." },
  wolfszahn: { id: "wolfszahn", name: "Wolfszahn-Talisman", category: "artefakt", icon: "talisman", quest: "q_rabenfurt", desc: "Ein großer Reißzahn an einer Lederschnur. Das Zeichen des Wolfsbundes. Er gehörte einem Späher, der in der Kapellengruft starb." },
  gerold_predigt: { id: "gerold_predigt", name: "Gerolds Predigt", category: "dokument", icon: "scroll", desc: "Vater Gerolds Aufzeichnungen für die Nachtmesse." },
  spaeherbrief: { id: "spaeherbrief", name: "Brief des Spähers", category: "dokument", icon: "letter", quest: "q_rabenfurt", desc: "Ein Brief in grober Schrift, adressiert an „Bassem, Hüter der Grenze“." },
  kraeuterbuendel: { id: "kraeuterbuendel", name: "Kräuterbündel", category: "heilung", icon: "herb", usable: true, desc: "Bertas Heilkräuter, in Leinen gewickelt. Schließt Wunden schneller als jedes vampirische Wollen." },
  // Kapitel 3
  grenzstein_abrieb: { id: "grenzstein_abrieb", name: "Abrieb der Grenzsteine", category: "dokument", icon: "scroll", quest: "q_grenze", desc: "Kohleabriebe der drei Grenzsteine: der alte Eid von Vareth." },
  blutzehnt_liste: { id: "blutzehnt_liste", name: "Liste des Blutzehnts", category: "dokument", icon: "scroll", quest: "q_grenze", desc: "Ein Verzeichnis aus der Rabenwacht. Namen, Daten, Mengen. Das Siegel des Hauses Drakenfels." },
  nadiras_band: { id: "nadiras_band", name: "Nadiras Haarband", category: "quest", icon: "feather", quest: "q_nadira", desc: "Ein geflochtenes Band mit Federn und Knochenperlen, zerrissen." },
  // Kapitel 4
  ysolde_tagebuch: { id: "ysolde_tagebuch", name: "Ysoldes Tagebuch", category: "dokument", icon: "book", quest: "q_dynastie", desc: "Ein schmales, schwarzes Buch. Die Schrift deiner Mutter, die ersten Seiten ruhig, die letzten gehetzt." },
  ysolde_brief3: { id: "ysolde_brief3", name: "Zerrissener Brief (III)", category: "dokument", icon: "letter", quest: "q_briefe", desc: "Ein weiteres Stück des Briefes, zwischen den Seiten eines Gebetbuches." },
  pakt_ebon: { id: "pakt_ebon", name: "Der Pakt von Ebon", category: "dokument", icon: "scroll", quest: "q_dynastie", desc: "Eine Urkunde auf Menschenhaut. Du willst nicht wissen, wessen." },
  // Kapitel 5
  schlafdorn: { id: "schlafdorn", name: "Der Schlafdorn", category: "artefakt", icon: "dagger", quest: "q_mine", desc: "Ein schmaler Dolch aus schwarzem Glas. Ysoldes letztes Werkzeug. Mine hat ihn achtzig Jahre lang getragen." },
  spieluhr: { id: "spieluhr", name: "Ysoldes Spieluhr", category: "artefakt", icon: "musicbox", quest: "q_ritual", desc: "Eine kleine Spieluhr aus Ebenholz. Sie spielt das Lied vom Mondbrunnen." },
  anselm_bericht: { id: "anselm_bericht", name: "Anselms Bericht (entschlüsselt)", category: "dokument", icon: "book", quest: "q_ritual", desc: "Der verschlüsselte Teil der Rabenchronik, endlich lesbar." },
  ysolde_brief4: { id: "ysolde_brief4", name: "Zerrissener Brief (IV)", category: "dokument", icon: "letter", quest: "q_briefe", desc: "Das letzte Stück. Es lag unter der Spieluhr." },
  kryptaschluessel: { id: "kryptaschluessel", name: "Blutschlüssel", category: "schluessel", icon: "seal", quest: "q_ritual", desc: "Ein Schlüssel, der kein Metall ist, sondern geronnenes Blut in der Form eines Schlüssels. Er ist warm." },
};
