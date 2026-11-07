import type { DocumentDef } from "../types";

// Absätze werden durch Leerzeilen getrennt. Ein führendes "~" markiert beschädigte Stellen.

export const DOCUMENTS: Record<string, DocumentDef> = {
  // ------------------------------------------------------------------ Kapitel 1
  sarkophag: {
    id: "sarkophag", title: "Inschrift des Sarkophags", kind: "inschrift",
    body: "SAMI VON DRAKENFELS\n\nERBE DES HAUSES\n\nVERSIEGELT IN DER NACHT DES ROTEN MONDES, IM JAHRE 1146\n\n„SCHLAFE, BIS DER MOND DICH VERGISST.“",
  },
  ysolde_brief1: {
    id: "ysolde_brief1", title: "Zerrissener Brief (I)", kind: "brief", author: "Ohne Unterschrift",
    body: "Mein Sohn,\n\nwenn du dies liest, dann hat das Siegel versagt – oder jemand hat es gebrochen. Ich weiß nicht, was von beidem schlimmer wäre.\n\nErschrick nicht vor dem Durst. Er ist das Erste, was zurückkehrt, und das Letzte, was dich verlässt. Trink, wenn du musst. Aber trink nie aus Angst.\n\n~[Der Rest ist abgerissen.]",
  },
  ysolde_brief2: {
    id: "ysolde_brief2", title: "Zerrissener Brief (II)", kind: "brief", author: "Ohne Unterschrift",
    body: "~[Der Rand ist verkohlt.]\n\n… dein Vater nennt es ein Erbe. Ich nenne es eine Gefangenschaft. Das Ritual sollte ihn in dich hineinlegen wie Wein in einen Krug. Aber einen Krug fragt niemand, ob er voll sein will.\n\n~[Mehrere Zeilen sind unleserlich.]\n\nIch habe dich nicht eingeschlossen, um dich zu bestrafen. Ich habe dich eingeschlossen, damit er dich nicht findet.",
  },
  ysolde_brief3: {
    id: "ysolde_brief3", title: "Zerrissener Brief (III)", kind: "brief", author: "Ohne Unterschrift",
    body: "… Mine wird dir nicht alles sagen. Sie hat mir etwas versprochen, das sie hassen wird, und sie wird es halten, weil sie so ist.\n\nWenn du sie siehst, sei nicht grausam zu ihr. Sie war das Einzige in diesem Haus, das dich geliebt hat, ohne etwas von dir zu wollen.\n\n~[Abgerissen.]",
  },
  ysolde_brief4: {
    id: "ysolde_brief4", title: "Zerrissener Brief (IV)", kind: "brief", author: "Y.",
    body: "… er kann alles nachahmen, was er gefressen hat: Stimmen, Gesichter, Erinnerungen. Aber er kann nicht nachahmen, was ich vor ihm versteckt habe.\n\nIch habe die zweite Strophe unseres Liedes nie gesungen, wenn er zuhören konnte. Wenn du mich wiedersiehst, frag mich danach. Wenn ich sie nicht kenne, bin ich es nicht.\n\nIch liebe dich. Es war nie genug. Aber es war alles.\n\n– Y.",
  },
  corvin_notiz: {
    id: "corvin_notiz", title: "Die Blutkrone – Vorbereitungen", kind: "notiz", author: "Graf Corvin von Drakenfels",
    body: "I. Der Zehnt des Wolfsbundes ist eingetroffen. Das Fleisch des Ersten ist in ihrem Blut, so wie sein Hunger in unserem ist. Erst beide zusammen öffnen das Tor.\n\nII. Malachias bestätigt: Das Gefäß muss vom ältesten Blut sein und jung genug, um sich zu biegen. Sami.\n\nIII. Ysolde stellt Fragen. Sie hat Zweifel. Zweifel sind ein Luxus, den sich Unsterbliche nicht leisten können.\n\nIV. Wenn der Erste im Erben wohnt, wohnt er in unserem Haus. Und was in meinem Haus wohnt, gehorcht mir.",
  },
  rotes_buch: {
    id: "rotes_buch", title: "Das Rote Buch", kind: "chronik", author: "Hauschronik der Drakenfels, Band VII",
    body: "Im Jahr 906 nach der Gründung Vareths fand Ahnherr Radomir von Drakenfels unter dem Felsen eine Kammer, die älter ist als jede Burg. Er schrieb, dort schlafe etwas, das „zuerst da war“. Seither nennt unser Haus es den Ersten.\n\nDer Mond über Drakenfels färbt sich alle achtzig Jahre rot. Dies sei kein Himmelszeichen, schrieb Radomir, sondern ein Auge, das sich öffnet. In diesen Nächten ist der Schlaf des Ersten dünn wie Pergament.\n\nIm Jahr 1066 versuchte Graf Wenzel, in der Nacht des Roten Mondes mit dem Ersten zu sprechen. Die Chronik verzeichnet seinen Tod in derselben Nacht. Ohne Ursache. Ohne Wunde.\n\n~[Mehrere Seiten wurden herausgerissen.]\n\nIm Jahr 1146, Nacht des Roten Mondes. Graf Corvin wird das Werk vollenden, das Radomir begann. Das Haus wird nicht länger dienen. Das Haus wird herrschen. Der Erbe ist bereit.\n\n~[Die letzte Zeile ist mit einer anderen Feder geschrieben:] Der Erbe war nie bereit. Gott vergebe uns. – A.",
  },
  mondtafel: {
    id: "mondtafel", title: "Die Mondtafel", kind: "inschrift", author: "Bronzene Scheibe im Thronsaal",
    body: "Eingravierte Jahreszahlen, jede mit einem roten Emailpunkt:\n\n826 · 906 · 986 · 1066 · 1146\n\nDaneben, ohne Punkt, nur ein frischer Kratzer im Metall: 1226.\n\nWenn ich in der Nacht von 1146 versiegelt wurde und der Mond jetzt wieder rot ist … dann schreiben wir das Jahr 1226. Achtzig Jahre. Und jemand hat die Zahl erst kürzlich eingeritzt.",
  },
  kamin_inschrift: {
    id: "kamin_inschrift", title: "Wahlspruch über dem Kamin", kind: "inschrift", author: "Arbeitszimmer des Grafen",
    body: "ERST WACHT DER MOND.\n\nDANN SCHWEIGT DER ███.\n\nDANN FÄLLT DIE KRONE.\n\nZULETZT BLEIBT NUR DAS ███.\n\n~Zwei Worte wurden mit einer Klinge aus dem Stein gekratzt.",
  },
  kamin_inschrift_blut: {
    id: "kamin_inschrift_blut", title: "Wahlspruch – unter Blutsicht", kind: "inschrift", author: "Arbeitszimmer des Grafen",
    body: "Unter der Blutsicht glimmen die zerkratzten Stellen auf. Jemand hat die fehlenden Worte mit Blut nachgezogen – vor langer Zeit, mit dem Finger.\n\nERST WACHT DER MOND.\n\nDANN SCHWEIGT DER RABE.\n\nDANN FÄLLT DIE KRONE.\n\nZULETZT BLEIBT NUR DAS BLUT.",
  },
  // ------------------------------------------------------------------ Kapitel 2
  rabenchronik: {
    id: "rabenchronik", title: "Rabenchronik (Auszug)", kind: "chronik", author: "Abgeschrieben von İlyas Rabe",
    body: "„Anselm Rabe, Schreiber im Haus Drakenfels, kam in der Nacht des Roten Mondes 1146 allein ins Dorf hinab. Sein Haar war weiß geworden. Er sprach drei Tage nicht. Am vierten Tag begann er zu schreiben und hörte nicht mehr auf.“\n\n„Er sagte: Die Gräfin hat den Erben nicht getötet. Sie hat ihn schlafen gelegt. Und dann ist sie hinabgestiegen.“\n\nDie folgenden Seiten sind in einer Chiffre verfasst, die niemand in unserer Familie je lesen konnte. Anselm schrieb darüber nur einen Satz:\n\n„Der Schlüssel ist der Wahlspruch des Hauses – in der Reihenfolge, in der er gesprochen wird.“",
  },
  ilyas_notizen: {
    id: "ilyas_notizen", title: "Die Verschwundenen", kind: "notiz", author: "İlyas Rabe",
    body: "Jorg Wendt, Schmied. Verschwunden in der dritten Nacht nach dem ersten roten Schein.\n\nMarthe Wendt, seine Frau. Vier Nächte später.\n\nPaul, Bertas Urenkel, neun Jahre alt. Vor zwei Nächten.\n\nAlle wurden zuletzt in der Nähe der Kapelle gesehen. Alle haben in den Tagen davor dieselbe Melodie gesummt. Niemand im Dorf kennt sie.\n\nVater Gerold sagt, er wisse von nichts. Vater Gerold schläft nicht mehr.",
  },
  gerold_predigt: {
    id: "gerold_predigt", title: "Nachtmesse", kind: "notiz", author: "Vater Gerold",
    body: "Brüder und Schwestern,\n\nder Rote Heilige hat zu mir gesprochen. Er spricht mit der Stimme meiner Adelheid, die vor sieben Wintern starb, und er sagt, sie sei bei ihm.\n\nEr sagt, wir haben ihn vergessen, und er vergibt uns. Er sagt, er war vor Gott. Er sagt, er braucht nichts von uns als unsere Träume.\n\nWer träumt, wird nicht mehr traurig sein. Wer träumt, wird nicht mehr allein sein.\n\nBringt eure Kinder.",
  },
  spaeherbrief: {
    id: "spaeherbrief", title: "Brief des Spähers", kind: "brief", author: "Tarek, Späher des Wolfsbundes",
    body: "Bassem.\n\nDie Menschen von Rabenfurt verschwinden in der alten Kapelle. Ich folge ihnen heute Nacht hinunter.\n\nWenn ich nicht zurückkomme: Es riecht nach Drakenfels, aber älter. Nicht nach dem Vampir. Nach etwas unter ihm.\n\nSag den Ältesten, der Eid gilt noch. Sag Nadira, ich habe ihr Band nicht vergessen.\n\n– Tarek",
  },
  // ------------------------------------------------------------------ Kapitel 3
  grenzstein_abrieb: {
    id: "grenzstein_abrieb", title: "Der Eid von Vareth", kind: "inschrift", author: "Abrieb der drei Grenzsteine",
    body: "ERSTER STEIN: Hier endet das Land der Nacht und beginnt das Land des Mondes. Kein Blut wird über diese Linie getragen, das nicht gegeben wurde.\n\nZWEITER STEIN: Wolf und Vampir, beide aus demselben Ursprung, schwören bei dem, was zuerst war: Wir wecken ihn nicht.\n\nDRITTER STEIN: Dieser Eid gilt, bis der Mond blutet.\n\n~Darunter, viel später und mit einer Kralle eingeritzt: ER BLUTET.",
  },
  blutzehnt_liste: {
    id: "blutzehnt_liste", title: "Liste des Blutzehnts", kind: "chronik", author: "Rabenwacht, Archiv des Hauses Drakenfels",
    body: "Jahr 1144 – drei Krüge. Sippe Harun.\n\nJahr 1145 – fünf Krüge. Sippe Harun, Sippe Idris.\n\nJahr 1146, vor dem Mond – ein Lebender. Harun, Sohn des Malik.\n\nVermerk: Für die Blutkrone. Nicht zurückzugeben.\n\n~Siegel des Hauses Drakenfels. Unterschrift: Corvin.",
  },
  // ------------------------------------------------------------------ Kapitel 4
  ysolde_tagebuch: {
    id: "ysolde_tagebuch", title: "Ysoldes Tagebuch", kind: "tagebuch", author: "Ysolde von Drakenfels",
    body: "Corvin spricht nur noch von der Krone. Er sagt, der Erste sei ein Gott, und Götter brauchen Häuser. Ich sage, Götter brauchen niemanden. Er lacht über mich, wie man über ein Kind lacht.\n\nMalachias hat mir die Gewölbe unter Ebon gezeigt. Die Wände sind nicht gemauert. Sie sind gewachsen. Ich habe ihn gefragt, wovon der Erste lebt. Er sagte: von Erinnerung. Er wird größer mit allem, was die Welt vergisst.\n\nSami ist das Gefäß. Corvin hat ihn dafür gezeugt. Mein Sohn ist ein Werkzeug, das sein Vater geschmiedet hat, bevor es atmen konnte. Ich habe es nicht gewusst. Ich hätte es wissen müssen.\n\nMine hat zugestimmt. Ich habe ihr den Schlafdorn gegeben. Wenn das Siegel bricht und Sami erwacht und ER in ihm ist, wird sie es beenden. Sie hat geweint. Dann hat sie gefragt, woran sie erkennen soll, ob er es noch ist. Ich habe gesagt: Er wird sich an das Lied erinnern. Der Erste nicht.\n\nMorgen ist der Mond rot. Ich werde Corvins Ritual nicht verhindern. Ich werde es umlenken. Wenn der Erste in das Gefäß steigt, werde ich das Gefäß schließen, bevor er ganz darin ist. Den Rest von ihm halte ich selbst fest – mit meinem Blut, mit allem, was ich bin. Es wird nicht ewig halten. Achtzig Jahre vielleicht. Bis zum nächsten Mond.",
  },
  pakt_ebon: {
    id: "pakt_ebon", title: "Der Pakt von Ebon", kind: "chronik", author: "Urkunde der vier Häuser",
    body: "Wir, die Häuser Ebon, Valcourt, Morwen und Drakenfels, erkennen den Ersten als Ursprung unseres Blutes an.\n\nWir nähren seinen Schlaf mit dem, was die Welt vergisst. Er gewährt uns die Nacht.\n\nGegeben im Jahre 400 nach der Gründung, gezeichnet mit dem Blut der vier.\n\n~Am Rand, in einer neueren, feinen Hand: Das Haus Morwen trat im Jahre 1140 zurück. Wir nähren nichts mehr. – M.",
  },
  stammbaum: {
    id: "stammbaum", title: "Der Stammbaum der Nacht", kind: "inschrift", author: "Fresko im nördlichen Seitenschiff",
    body: "Zuerst sah Ebon, und sein Auge war das erste, das in die Dunkelheit blickte.\n\nAus Ebons Blut erhob sich die Schlange von Valcourt.\n\nDie Schlange biss die Rose, und das Haus Morwen erblühte.\n\nAls Letzter kam der Rabe – Drakenfels, jung und hungrig, und er schwor, einst über allen zu stehen.\n\n~Darunter: Entzündet die Lichter der Häuser in der Ordnung ihres Blutes, und das Wissen der Nacht wird sich öffnen.",
  },
  malachias_gebet: {
    id: "malachias_gebet", title: "Gebet am Chorgestühl", kind: "notiz", author: "In das Holz geritzt, tausendfach",
    body: "Ich vergesse für dich. Ich vergesse für dich. Ich vergesse für dich.\n\n~Die Worte bedecken das gesamte Gestühl, Schicht über Schicht, bis das Holz darunter nicht mehr zu sehen ist.",
  },
  // ------------------------------------------------------------------ Kapitel 5
  anselm_bericht: {
    id: "anselm_bericht", title: "Anselms Bericht", kind: "chronik", author: "Anselm Rabe – entschlüsselt",
    body: "Ich war im Raum, als es geschah. Der Graf stand im Kreis. Der Erbe lag auf dem Stein. Die Gräfin hielt seine Hand.\n\nAls das Mondlicht durch das Dach fiel, öffnete sich der Boden, und etwas stieg herauf, das kein Licht zurückwarf. Es ging in den Erben hinein wie Rauch in eine Lunge.\n\nDa schnitt sich die Gräfin die Hände auf, legte sie auf seine Brust und sprach die Worte rückwärts. Der Graf schrie. Der Erste schrie mit ihm, mit seiner Stimme. Was mit dem Grafen geschah, will ich nicht aufschreiben. Er ist nicht gestorben. Er ist vergessen worden.\n\nDie Gräfin sagte zu mir: Anselm, schreib auf, was ich dir jetzt sage, und verschlüssle es mit unserem Wahlspruch, damit nur ein Drakenfels es lesen kann.\n\n„Das Band zwischen dem Ersten und unserem Blut kann nicht zerrissen werden. Aber es kann gelöst werden – von dem, an den es gebunden ist, wenn er sich selbst erkennt. Nicht vernichten. Nicht beherrschen. Lösen.“\n\nDann stieg sie hinab, und der Boden schloss sich über ihr.",
  },
};
