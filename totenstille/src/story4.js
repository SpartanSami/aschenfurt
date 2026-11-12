/* TOTENSTILLE – Kapitel 7 (Die Brücke), alle Enden, Schicksale, Bilanz */
"use strict";

const ENDEN = [
  ["hoffnung", "Das Blut"],
  ["wache", "Totenwache"],
  ["sprengung", "Fangt schon mal ohne mich an"],
  ["herde", "Der Hirte"],
  ["ahnungslos", "Kerngesund"],
  ["echo", "Gebissen: nein"],
  ["zuspaet", "Sechs Uhr eins"],
  ["tod", "Ein Satz für immer"]
];

function positiv(w) { return mit(w) && !!S.inf[w] && w !== "mara"; }
function gesunde() { return ["mara", "walter", "jonas", "lotte"].filter((w) => mit(w) && !positiv(w)); }
function kranke() { return ["lotte", "walter"].filter(positiv); }
function namen(a) { return liste(a.map((w) => NAMEN[w])); }
function knall() { return uhr(); }
function zurSprengung(S) { S.t = Math.min(S.t + 10, FRIST); }

/* ===================== KAPITEL 7: DIE BRÜCKE ===================== */
SZ.k7_bruecke = {
  kap: 7, ort: "Die Brücke", klang: "innen", cp: true, dauer: 10,
  vor: (S) => { if (S.t >= FRIST) return "e_zuspaet"; },
  text: (S) => {
    const t = [
      mit("mara") || mit("walter") || mit("jonas") || mit("lotte")
        ? `Das Tor fällt hinter euch zu. Vor euch liegt die Brücke: vierhundert Meter Stahl, zwei Fahrspuren, leere Sandsackstellungen. An jedem Pfeiler kleben graue Pakete, sauber verkabelt.`
        : `Das Tor fällt hinter dir zu. Außer dir ist niemand mehr übrig. Vor dir liegt die Brücke: vierhundert Meter Stahl, zwei Fahrspuren, leere Sandsackstellungen. An jedem Pfeiler kleben graue Pakete, sauber verkabelt.`,
      `Du hast eine Garnison erwartet. Zelte, Ärzte, Lastwagen.`,
      `Es ist eine Frau. Eine einzige, in einer Uniform, die ihr in drei Wochen zu weit geworden ist. KESSLER steht auf dem Namensband. Sie hat ein Gewehr, einen Campingtisch, und um den Hals trägt sie an einer Schnur einen Zünder. Neben dem Tisch steht ein Kassettenrekorder an einer Autobatterie.`,
      `>„Hier ist die Brücke. Wir nehmen jeden auf, der gesund ist. Halten Sie Namen und Beruf bereit …“`,
      `Kessler drückt auf Stopp. „Oberleutnant Brehm. Das hat er am vierten Tag aufgenommen. Am sechsten sind sie abgezogen. Ich habe gesagt, ich bleibe, solange das Band hält.“ Sie zuckt mit den Schultern. „Drüben ist kein Lager. Drüben ist Landstraße, vierzig Kilometer bis zur nächsten Linie. Aber sie ist leer. Das ist mehr, als es auf dieser Seite gibt.“`,
      `Auf dem Tisch liegen Teststreifen. „Ein Tropfen Blut, zwei Minuten. Kein Blut über den Fluss. Das ist der letzte Befehl, den ich noch habe, und an den halte ich mich. Um sechs sprenge ich. Oder in dem Moment, in dem das Tor fällt, je nachdem, was zuerst kommt. Der Nächste.“`
    ];
    if (mit("mara")) t.push(`Mara. Ein Strich. Kessler stempelt ihr den Handrücken.`);
    if (mit("walter")) {
      t.push(S.inf.walter
        ? `Walter. Der Streifen braucht lange. Dann zwei Striche. Walter sieht darauf, ohne zu begreifen. „Ich bin nicht gebissen“, sagt er. Und noch einmal, im selben Ton: „Ich bin nicht gebissen.“ Er merkt es nicht.`
        : `Walter. Ein Strich. Er atmet aus wie nach einer langen Schicht.`);
    }
    if (mit("jonas")) t.push(`Jonas. Ein Strich. Er grinst so breit, dass man sieht, wie viel Angst er hatte.`);
    if (mit("lotte")) {
      if (S.inf.lotte) {
        t.push(
          `Lotte hält ihren Finger hin, ohne zu zucken. Zwei Striche.`,
          mit("mara")
            ? `Kesslers Hand geht zum Gewehr. „Die Kleine ist positiv. Wo ist der Biss?“ – „Sie hat keinen!“ Mara ist schon auf den Knien, schiebt Ärmel hoch, Hosenbeine, sucht, findet nichts. „Sie hat keinen Biss. Wie Timo. Das ist nicht möglich.“`
            : `Kesslers Hand geht zum Gewehr. „Die Kleine ist positiv. Wo ist der Biss?“ Du schiebst Lottes Ärmel hoch, die Hosenbeine, suchst, findest nichts. Sie hat keinen. Wie Timo.`,
          `Lotte steht ganz still. Sie sieht nicht auf den Streifen. Sie sieht dich an.`
        );
      } else {
        t.push(`Lotte hält ihren Finger hin, ohne zu zucken. Ein Strich. Kessler lächelt beinahe. „Tapferer als die meisten.“`);
      }
    }
    if (S.f.kessler_sah) {
      t.push(`Kessler hat dich die ganze Zeit nicht aus den Augen gelassen. Der Gewehrlauf zeigt nicht zufällig in deine Richtung. „Und jetzt zu Ihnen. Sie sind durch die hindurchgegangen wie durch ein Kornfeld. Ich habe es im Zielfernrohr gesehen.“`);
    }
    t.push(`Sie zieht ein Formular heran, das gleiche wie für alle. „Name?“ – „${S.name}.“ – „Beruf, vorher?“ – „${S.job}.“ – „Gebissen?“`);
    if (ist("rede")) t.push(`*Du liest sie, wie du früher jeden gelesen hast, der dir gegenübersaß: Diese Frau ist seit dreizehn Tagen allein. Sie will nicht schießen. Sie wartet darauf, dass ihr jemand einen Grund gibt, es nicht zu müssen.*`);
    return P(t);
  },
  wahl: (S) => [
    wahl(`„Nein.“ Du hältst ihr den Finger hin.`, (S) => {
      zeit(3); S.f.k_luege = true;
      return folge([
        `Die Lüge kommt so leicht wie immer. Den Stich in die Fingerkuppe spürst du kaum.`
      ], "k7_wahrheit");
    }),
    wahl(`„Ja. Am ersten Tag. Testen Sie mich.“`, (S) => {
      zeit(3); mensch(1); S.f.k_ehrlich = true;
      return folge([
        `Kessler ist zwei Schritte zurück und hat das Gewehr an der Schulter, bevor du ausgeredet hast.`,
        `„Arm auf den Tisch. Langsam.“ Sie sticht dich mit ausgestrecktem Arm, wie man ein Tier füttert, dem man nicht traut. „Wenn das stimmt, sind Sie der erste Mensch, der mir heute Nacht die Wahrheit sagt.“`
      ], "k7_wahrheit");
    }),
    wahl(`Den Test umgehen: dich an ihr vorbeireden.`, (S) => {
      zeit(4);
      if (ist("rede")) {
        return folge([
          `Du redest. Nicht viel, nicht schnell. Über die dreizehn Tage, die sie hier allein gestanden hat. Über die Narbe, die du ihr von selbst zeigst: alt, verheilt, neunzehn Tage. Über Vorschriften, die für Menschen gemacht sind, die morgen tot sind, und nicht für jemanden, der seit drei Wochen steht.`,
          `Sie will es glauben. Du siehst genau den Moment, in dem sie es tut. Früher hast du in solchen Momenten den Stift hingehalten.`,
          `Sie stempelt deinen Handrücken. „Gehen Sie. Bevor ich nachdenke.“`,
          `Dein Talent hat dich noch nie im Stich gelassen. Genau das ist das Problem.`
        ], "e_ahnungslos");
      }
      if (S.funk) {
        return folge([
          `„Sie kennen meine Stimme“, sagst du und hältst das Funkgerät hoch. „Seit Stunden. Sie haben uns durch die halbe Stadt gebracht. Sehen Sie sich die Narbe an: neunzehn Tage alt. Sie wissen selbst, dass niemand neunzehn Tage übersteht. Und Sie wissen, wie viele Streifen Sie noch haben.“`,
          `Kessler sieht auf die Schachtel. Sechs Stück. Sie sieht auf die Uhr. Dann stempelt sie deinen Handrücken. „Gehen Sie.“`
        ], "e_ahnungslos");
      }
      S.f.k_luege = true;
      return folge([
        `Du redest. Kessler hört dir zu, drei Sätze lang, und du merkst, dass du an ihr abgleitest wie an einer Wand.`,
        `„Sparen Sie sich das“, sagt sie. „Jeder, der hier nicht getestet werden wollte, hatte einen Grund.“ Sie packt dein Handgelenk und sticht zu.`
      ], "k7_wahrheit");
    }, { beruf: ist("rede") }),
    wahl(gesunde().length ? `„Erst die anderen. Ich gehe zum Schluss.“` : `Zeit schinden: „Wie viele haben es vor mir geschafft?“`, (S) => {
      zeit(5); S.f.k_allein = true;
      if (!gesunde().length) {
        return folge([
          `„Einundsechzig“, sagt Kessler. „In dreizehn Tagen. Vierzehn habe ich zurückgeschickt.“ Sie sieht dich an, ohne zu blinzeln. „Die vierzehn haben vorher auch alle Fragen gestellt. Finger.“`
        ], "k7_wahrheit");
      }
      return folge([
        `Kessler mustert dich. „Wie Sie wollen.“ Sie schickt die Gestempelten los. Du siehst ihnen nach, wie sie zwischen den Sandsäcken kleiner werden.${mit("mara") ? " Mara bleibt nach fünfzig Metern stehen und wartet." : ""}`,
        `„So“, sagt Kessler. „Ich kenne das. Wer zum Schluss gehen will, hat Angst vor dem Streifen. Finger.“`
      ], "k7_wahrheit");
    })
  ]
};

SZ.k7_wahrheit = {
  kap: 7, ort: "Die Brücke", klang: "stille",
  text: (S) => {
    const t = [
      `Zwei Minuten sind lang. Du siehst dem Streifen beim Trocknen zu.`,
      `Ein Strich. Dann, erst blass, dann deutlich: ein zweiter.`,
      `@bogen`,
      `Kessler hat das Gewehr im Anschlag. Aber sie schießt nicht. Sie starrt auf deinen Unterarm, auf den Halbmond aus hellen Punkten. „Der ist alt“, sagt sie. „Wie alt?“`,
      `„Neunzehn Tage.“`,
      `„Nach neunzehn Stunden steht keiner mehr.“ Der Lauf sinkt eine Handbreit. „Außer … Brehm hat von so etwas geredet, bevor sie abgezogen sind. Im Lagezentrum hatten sie ein Wort dafür. Träger. Einer auf hunderttausend. Leute, die es in sich haben und nicht umkippen.“ Sie sieht dich an, und es ist beinahe Mitleid. „Die werden nicht krank. Die machen krank. Blut, Speichel. Ein geteilter Löffel reicht.“`
    ];
    if (S.akte && mit("mara")) t.push(`Mara zieht das Diktiergerät aus der Tasche. Sie muss es nicht abspielen. „Patient Lindner“, sagt sie tonlos. „Kein Wunder. Die Quelle.“`);
    t.push(
      `Etwas in dir wird sehr kalt und sehr klar.`,
      `Timo. Seine Zahnbürste war in den Abfluss gefallen, und du hast gesagt: Nimm meine. Vier Tage später das Fieber.`
    );
    let heute = 0;
    if (S.inf.jonas) { heute++; t.push(`Jonas. Deine aufgeschürften Knöchel in seiner offenen Hand, am Personaleingang. Er hat Danke gesagt.`); }
    if (S.inf.lotte) { heute++; t.push(`Lotte. Deine Flasche in der Linie 7. Sie hat den Flaschenhals abgewischt, nachdem sie getrunken hatte. Um dich zu schützen.`); }
    if (S.inf.walter) { heute++; t.push(`Walter. Ein Schluck Wasser für seine Tablette. Er hat dir die Flasche zurückgegeben wie einen Kelch.`); }
    if (S.inf.mara) { heute++; t.push(`Mara. Deine zerschnittenen Hände in ihrer Wunde, am Stacheldraht. Nicht loslassen, hat sie gesagt. Du hast nicht losgelassen.`); }
    if (!heute) t.push(`Und heute Nacht? Du gehst die Stunden durch, eine nach der anderen, und findest nichts. Dein Blut hat heute niemanden erreicht. Nicht aus Vorsicht. Aus Eile, aus Härte, aus Zufall. Du weißt nicht, ob du darüber lachen oder weinen sollst.`);
    t.push(
      `Und die Echos. All die Köpfe, die sich nach dir gedreht und wieder abgewandt haben. Sie haben dich nie verschont. Sie haben dich erkannt.`,
      `„Deshalb“, sagt Kessler leise. Sie sieht über deine Schulter.`,
      `Hinter dem Tor steht die Uferstraße. Die ganze Straße. Sie drängen nicht, sie schlagen nicht gegen den Zaun. Sie stehen nur da, Tausende Gesichter, alle auf dich gerichtet, und kein einziges murmelt.`,
      `„Die sind nicht wegen meinem Scheinwerfer hier“, sagt Kessler. „Die sind Ihnen nachgelaufen. Die ganze Nacht.“`,
      `^Totenstille.`
    );
    if (mit("mara")) {
      if (S.f.mara_weiss) t.push(`Mara nickt langsam. „Ich weiß es seit ein paar Stunden“, sagt sie. „Ich wollte, dass du es selbst sagst.“`);
      else if (S.f.wahrheit) t.push(`„Du hast es am Parkhaus gesagt“, sagt Mara. „Du hast es uns allen gesagt. Wir haben nur nicht verstanden, was es bedeutet. Du auch nicht.“`);
      else if (S.f.luege) t.push(`„Glasscherbe“, sagt Mara. Nur dieses eine Wort. Es ist schlimmer als alles, was sie hätte schreien können.`);
      else t.push(`Mara sieht dich an, als müsste sie neunzehn Tage noch einmal von vorn durchgehen. Jede geteilte Decke. Jeden Löffel.`);
    }
    if (positiv("lotte")) t.push(`Lotte steht neben dem Tisch, ihren Streifen mit den zwei Strichen in der Faust. Sie hat alles verstanden. Sie kommt zu dir und nimmt deine Hand.`);
    return P(t);
  },
  weiter: "k7_wahl", wl: "Weiter"
};

SZ.k7_wahl = {
  kap: 7, ort: "Die Brücke", klang: "stille",
  text: (S) => {
    const kr = kranke();
    return P(
      `Der Bauzaun ächzt. Nicht, weil sie drücken. Weil es so viele sind.`,
      `Es ist ${uhr()} Uhr. Kessler nimmt den Zünder vom Hals. Ihre Hände sind ruhiger als deine.`,
      `„Das Tor hält keine zehn Minuten mehr. Dann sprenge ich, egal, wer noch auf dieser Brücke steht. Sagen Sie mir, was ich mit Ihnen machen soll. Aber sagen Sie es schnell.“`,
      kr.length > 0 && `Sie sieht zu ${namen(kr)} hinüber. „Und mit ${kr.length > 1 ? "den beiden" : kr[0] === "lotte" ? "ihr" : "ihm"}“, fügt sie leiser hinzu. „Wer zwei Striche hat, geht nicht über diese Brücke.“`
    );
  },
  wahl: (S) => [
    wahl(`„Nehmen Sie mich mit. Mein Blut hat überlebt, was sonst keiner überlebt.“`, (S) => {
      const t = [];
      let ok = true;
      if (mit("mara") && S.v.mara >= 2) {
        t.push(`„Sie sind keine Ärztin“, sagt Mara zu Kessler. „Ich auch nicht. Aber ich weiß, was es heißt, wenn ein Mensch neunzehn Tage mit diesem Ding im Blut herumläuft und lebt. Ketten Sie ${S.name} an mich. Ich lasse keinen Tropfen aus den Augen.“`);
      } else if (S.akte) {
        t.push(`Du legst das Diktiergerät aus dem Sankt Agnes auf den Campingtisch und drückst auf Wiedergabe. Die Stimme der Stationsärztin füllt die Brücke: „… er ist die Quelle. Und sein Blut wäre der Schlüssel.“ Kessler hört es sich an. Zweimal.`);
      } else if (S.f.k_ehrlich) {
        t.push(`„Sie haben mir die Wahrheit gesagt, als Lügen einfacher gewesen wäre“, sagt Kessler. „Das hat in dreizehn Tagen keiner getan.“ Sie atmet aus. „Brehm hat gesagt, wenn je einer von denen auftaucht, will das Lagezentrum ihn lebend.“`);
      } else if (ist("rede")) {
        t.push(`Du hast dein Leben lang Dinge verkauft, an die du nur halb geglaubt hast. Das hier glaubst du ganz. Du sagst ihr, was dein Blut wert ist, auf der anderen Seite, in einem Labor. Du sagst ihr, was es wert ist, wenn sie es hier in den Fluss sprengt. Du lässt sie selbst rechnen.`);
      } else {
        ok = false;
      }
      if (ok) {
        t.push(`Kessler sieht auf den Zünder. Auf die Uhr. Auf dich. „Kein Blut über den Fluss“, sagt sie langsam. „Aber in dem Befehl steht nichts von Medizin.“`);
        return folge(t, "e_hoffnung");
      }
      return folge([
        `„Ich bin Feldwebel“, sagt Kessler. „Keine Ärztin. Ich kann nicht beurteilen, ob Sie ein Heilmittel sind oder eine Bombe.“ Sie sieht sich um. „Und hier ist keiner, der für Sie bürgt.“`,
        mit("mara") ? `Du siehst zu Mara. Mara sieht auf den Asphalt. Du hast in dieser Nacht zu oft gelogen, zu oft weggesehen, und sie hat jedes Mal mitgezählt.` : `Die Einzige, die für dich hätte sprechen können, hat vier Minuten lang einen Hebel gehalten.`,
        `„Es tut mir leid“, sagt Kessler. Sie meint es. Es ändert nichts.`
      ], "e_echo");
    }),
    wahl(`„Sprengen Sie. Ich bleibe auf dieser Seite.“`, (S) => {
      mensch(2);
      return folge([
        `„Die gehen mir aus dem Weg“, sagst du. „Dann kann ich die holen, die es nicht bis hierher geschafft haben. In den Kellern. Auf den Dachböden. Es klopfen noch welche.“`,
        `Kessler mustert dich lange. Dann löst sie das Funkgerät von ihrem Gürtel und schiebt dir den Kassettenrekorder hin.`,
        `„Das Band ist fast durch. Brehm ist seit dreizehn Tagen fort, und seine Stimme lädt immer noch Leute ein. Sprechen Sie ein neues drauf. Irgendwer hört immer zu.“`
      ], "k7_band");
    }),
    wahl(`Kessler den Zünder entreißen und über die Brücke gehen.`, (S) => {
      mensch(-3);
      if ((ist("kampf") || S.ammo > 0 || S.eisen) && S.hp >= 2) {
        return folge([
          ist("kampf")
            ? `Du bist schneller, als sie gedacht hat. Ein Griff, den deine Hände nie verlernt haben, und das Gewehr liegt auf dem Asphalt.`
            : S.ammo > 0
              ? `Die Pistole ist in deiner Hand, bevor sie ihr Gewehr gedreht hat. Du musst nicht schießen. Sie sieht dir an, dass du es tun würdest.`
              : `Das Brecheisen trifft den Gewehrlauf und schlägt ihn zur Seite. Der zweite Schlag trifft ihre Schulter.`,
          `Der Zünder liegt in deiner Faust. Kessler kniet auf der Fahrbahn und hält sich den Arm. „Sie wissen nicht, was Sie tun“, sagt sie.`,
          `Doch. Zum ersten Mal in dieser Nacht weißt du es genau.`
        ], "e_herde");
      }
      return folge([
        `Du bist nicht schnell genug. Sie hat dreizehn Nächte lang auf genau diese Bewegung gewartet.`
      ], "e_schuss");
    }, { beruf: ist("kampf") }),
    wahl(`„Geben Sie mir den Zünder. Ich warte, bis sie alle auf der Brücke stehen.“`, (S) => {
      mensch(3);
      return folge([
        `Kessler versteht sofort. Die Straße ist dir nachgelaufen, die ganze Nacht. Sie wird dir auch auf die Brücke nachlaufen.`,
        `Sie legt dir den Zünder in die Hand. Er ist leichter, als du gedacht hast. „Roter Schalter hoch, dann drücken. Das Kabel reicht bis zur Mitte.“ Sie zögert. Dann salutiert sie, zum ersten Mal seit dreizehn Tagen.`
      ], "e_sprengung");
    })
  ]
};

SZ.k7_band = {
  kap: 7, ort: "Die Brücke", klang: "stille",
  text: (S) => P(
    `Kessler drückt auf Aufnahme. Das rote Lämpchen brennt.`,
    `Du weißt, was in dieser Stadt mit Sätzen passiert, die man zuletzt sagt. Dieser hier wird sich alle vierzig Sekunden wiederholen, Nacht für Nacht, solange die Batterie hält.`,
    `Such ihn dir gut aus.`
  ),
  eingabe: {
    schluessel: "band", label: "Dein Satz für das Band", max: 140,
    std: (S) => `Hier ist ${S.name}. Bleibt, wo ihr seid. Ich hole euch.`
  },
  weiter: "e_wache", wl: "Aufnahme beenden"
};

/* ===================== ENDEN ===================== */
SZ.e_hoffnung = {
  kap: 7, ort: "Ostufer", klang: "stille",
  ende: { id: "hoffnung", art: "heil" },
  vor: zurSprengung,
  text: (S) => {
    const kr = kranke();
    const wem = kr.length > 1 ? "Lottes, und danach in Walters" : kr[0] === "lotte" ? "Lottes" : "Walters";
    const t = [
      `Kessler fesselt dir die Hände mit Kabelbindern. Du gehst in der Mitte der Fahrbahn, zehn Schritte vor allen anderen, und hinter dir rollt sie das Zündkabel ab.`,
      `Um ${knall()} Uhr steht ihr am Ostufer. Du drehst dich um. Die Brücke ist voll bis zur Mitte. Sie sind dir gefolgt, so weit es ging, lautlos, und sie sehen herüber.`,
      `Kessler drückt.`,
      `Der Fluss nimmt alles.`
    ];
    if (kr.length && mit("mara")) {
      t.push(
        `Mara wartet auf kein Labor. Am Straßenrand, im ersten grauen Licht, legt sie eine Kanüle in deinen Arm und die andere in ${wem}. „Vene zu Vene“, sagt sie. „Wenn es stimmt, was die über Träger sagen, ist das die einzige Medizin, die es auf dieser Welt noch gibt.“ Ihre Hände zittern nicht.`,
        `Gegen Mittag sinkt das Fieber.`
      );
    } else if (kr.length) {
      t.push(
        `Kessler hat einen Sanitätsrucksack und einen Lehrgang, der sechs Jahre her ist. Am Straßenrand, im ersten grauen Licht, legt sie eine Kanüle in deinen Arm und die andere in ${wem}. „Wenn das schiefgeht“, sagt sie, „habe ich nie davon gehört.“`,
        `Gegen Mittag sinkt das Fieber.`
      );
    } else {
      t.push(`Vierzig Kilometer Landstraße. An der nächsten Linie glaubt euch zuerst niemand. Dann ${S.akte ? "hört eine Stabsärztin das Band aus dem Sankt Agnes, zweimal hintereinander" : "sieht sich eine Stabsärztin erst deine Narbe an und dann sehr lange deinen Teststreifen"}, und am Abend hängst du an einem Schlauch.`);
    }
    t.push(
      `Sie nennen es später das Kaltenbrück-Serum. Dein Name steht nicht darauf. Du wohnst hinter Glas, in einem Container mit eigenem Luftfilter, und zweimal die Woche nehmen sie dir Blut ab.`,
      `Du wirst nie wieder jemandem die Hand geben. Du wirst nie wieder eine Flasche teilen.`
    );
    if (mit("lotte") && S.v.lotte >= 2) {
      t.push(
        `An einem Morgen im Frühjahr steht Lotte vor der Scheibe. Sie legt die Hand ans Glas. Dann bewegen sich ihre Lippen, und aus der Sprechanlage kommt eine Stimme, die du noch nie gehört hast, klein und rostig vom langen Schweigen. „Guten Morgen, ${S.name}.“`,
        `Es ist kein Satz für die Ewigkeit. Es ist einer für jeden Tag. Sie sagt ihn von da an jeden Morgen.`
      );
    }
    t.push(`Neunzehn Tage lang hast du den Tod durch diese Stadt getragen, ohne es zu wissen. Jetzt trägst du das Einzige, was gegen ihn hilft.`);
    return P(t);
  }
};

SZ.e_wache = {
  kap: 7, ort: "Westufer", klang: "murmeln",
  ende: { id: "wache", art: "bleib" },
  vor: zurSprengung,
  text: (S) => {
    const g = gesunde();
    const band = S.band || `Hier ist ${S.name}. Bleibt, wo ihr seid. Ich hole euch.`;
    const t = [];
    if (mit("lotte") && !positiv("lotte") && S.v.lotte >= 2) {
      t.push(`Bevor sie gehen, macht Lotte sich von ${mit("mara") ? "Maras" : "Kesslers"} Hand los. Zwei Schritte vor dir bleibt sie stehen, weil sie verstanden hat, dass sie dich nicht anfassen darf. Ihr Mund geht auf. Die Stimme ist klein und rostig vom langen Schweigen. „Komm nach“, sagt sie.`);
    }
    t.push(
      `Du gehst von der Brücke, zurück durch das Tor. Sie machen dir Platz.`,
      g.length
        ? `Um ${knall()} Uhr stehst du am Kai und siehst zu, wie sich die Brücke in den Fluss legt. Drüben, im ersten Licht, ${g.length > 1 ? "stehen" : "steht"} ${namen(g)} am Ufer. ${g.length > 1 ? "Kleine Figuren. Eine hebt den Arm." : "Eine kleine Figur. Sie hebt den Arm."}`
        : `Um ${knall()} Uhr stehst du am Kai und siehst zu, wie sich die Brücke in den Fluss legt. Drüben, im ersten Licht, steht Kessler allein am Ufer. Sie hebt den Arm.`,
      `Du lernst die Stadt neu. Du lernst, dass du durch jede Straße gehen kannst, wenn du langsam gehst. Dass in Kellern und auf Dachböden noch Menschen sitzen, mehr, als du gedacht hast. Du klopfst. Dreimal kurz. Du redest durch Türen, bis sie dir glauben, dass du echt bist.`,
      `Du fasst niemanden an. Du trinkst aus keinem Becher, den dir jemand reicht. Du gehst voran, und sie gehen in deinem Schatten, bis zum Ruderclub, wo ${S.f.roth_deal ? "Roths Boote warten" : "das Floß liegt, das du aus Türen und leeren Kanistern gebaut hast"}.`
    );
    if (positiv("lotte")) t.push(`Lotte ist bei dir geblieben. Das Fieber hat vier Tage gebraucht. Sie hat kein einziges Wort gesagt, bis zum Schluss nicht, und so ist sie das einzige Echo von Kaltenbrück, das schweigt. Sie geht neben dir durch die Straßen, eine kleine kalte Hand in deiner. Du lässt sie nicht los.`);
    if (positiv("walter")) t.push(`Walter ist bei dir geblieben. Er hat noch zwei Tage lang Fahrpläne erklärt, immer dieselben. Am dritten hast du ihn in den Ahornweg gebracht, an seinen Küchentisch.`);
    if (S.f.hanna_frei) t.push(`Am dritten Abend steht Hanna neben dir am Kai. Barfuß. Sie sagt nichts; in deiner Nähe sagen sie nie etwas. Ihr seht zusammen aufs Wasser.`);
    t.push(
      `Nachts kurbelst du das Radio. Auf der Frequenz der Brücke läuft jetzt deine Stimme, alle vierzig Sekunden:`,
      `>„${band}“`,
      `Ein Satz, der sich für immer wiederholt. Du weißt genau, was du geworden bist. Aber diesen Satz hast du dir selbst ausgesucht.`
    );
    return P(t);
  }
};

SZ.e_sprengung = {
  kap: 7, ort: "Brückenmitte", klang: "stille",
  ende: { id: "sprengung", art: "opfer" },
  vor: zurSprengung,
  text: (S) => {
    const g = gesunde();
    const t = [];
    if (g.length) t.push(`Sie gehen. ${namen(g)}, und hinter ihnen Kessler.${mit("mara") ? " Mara dreht sich dreimal um." : ""}`);
    else t.push(`Kessler geht. Allein, wie sie hier gestanden hat.`);
    if (mit("lotte") && !positiv("lotte") && S.v.lotte >= 2) {
      t.push(`Auf halber Strecke reißt Lotte sich los und rennt zurück. Zwei Schritte vor dir bleibt sie stehen, weil sie verstanden hat, dass sie dich nicht anfassen darf. Ihr Mund geht auf. Die Stimme ist klein und rostig vom langen Schweigen. „Danke“, sagt sie. Dann rennt sie.`);
    }
    t.push(`Du gehst zur Mitte der Brücke und setzt dich auf die Fahrbahn. Um ${knall()} Uhr gibt das Tor nach.`);
    if (positiv("lotte")) t.push(`Lotte ist bei dir geblieben. Sie durfte nicht hinüber, und sie wollte nicht. Sie ist an deiner Schulter eingeschlafen, heiß wie ein kleiner Ofen. Du weckst sie nicht. Sie hat ihren Satz nie gesagt, und das kann ihr jetzt keiner mehr nehmen.`);
    if (positiv("walter")) t.push(`Walter sitzt neben dir, den Ehering zwischen den Fingern. „Zu zweit wartet es sich leichter“, sagt er. Er sagt es nur einmal.`);
    t.push(
      `Sie kommen. Nicht schnell. Sie füllen die Brücke von Geländer zu Geländer, Hunderte, Tausende, und alle sehen dich an, und keiner sagt ein Wort. Die ganze Stadt, die dir nachgelaufen ist. Du lässt sie kommen, bis du die Vordersten berühren könntest.`,
      S.f.hanna_frei && `In der ersten Reihe steht eine junge Frau, barfuß, in einem Sommerkleid. Natürlich.`,
      mit("mara") ? `Das Funkgerät knackt. Maras Stimme, vom anderen Ufer: „${S.name}?“` : `Das Funkgerät knackt. Kesslers Stimme, vom anderen Ufer: „Sind Sie so weit?“`,
      `Du weißt, was mit letzten Sätzen passiert. Dir fällt nur ein einziger ein.`,
      `„Fangt schon mal ohne mich an.“`,
      `Roter Schalter. Hoch.`,
      `Am Ostufer erzählt man später, die Stadt sei an diesem Morgen still gewesen wie nie zuvor. Ganz still. Und dann nicht mehr.`
    );
    return P(t);
  }
};

SZ.e_herde = {
  kap: 7, ort: "Landstraße Ost", klang: "stille",
  ende: { id: "herde", art: "seuche" },
  vor: zurSprengung,
  text: (S) => P(
    `Du gehst über die Brücke. Vierhundert Meter. Den Zünder wirfst du über das Geländer, damit niemand hinter dir sprengen kann.`,
    mit("mara") && `Mara hat dich angeschrien. Dann hat sie dich geschlagen. Dann ist sie gerannt, wie die anderen.`,
    kranke().length > 0 && `${namen(kranke())} hast du am Campingtisch stehen lassen.`,
    `Hinter dir gibt das Tor nach.`,
    `Du hörst sie nicht. In deiner Nähe murmeln sie nie. Aber du spürst sie, als du das Ostufer erreichst und dich umdrehst: die Brücke voll von Geländer zu Geländer. Sie laufen dir nach. Über den Fluss, auf die leere Landstraße, nach Osten.`,
    `Vierzig Kilometer bis zur nächsten Linie. Du gehst langsam. Du hast Zeit. Hinter dir geht die Stadt, und sie ist sehr leise.`,
    `An der Linie werden sie eines Tages fragen, wie die Toten über den Fluss gekommen sind.`,
    `Jemand wird sagen: Sie hatten einen Hirten.`
  )
};

SZ.e_ahnungslos = {
  kap: 7, ort: "Auffanglager Ost", klang: "murmeln",
  ende: { id: "ahnungslos", art: "seuche" },
  vor: zurSprengung,
  text: (S) => P(
    `Du gehst über die Brücke. Vierhundert Meter, den Stempel auf dem Handrücken, die Narbe unter dem Ärmel. Du hast es geschafft.`,
    positiv("lotte") && `Lotte bleibt am Campingtisch zurück, zwei Striche in der Faust. ${mit("mara") ? "Mara bleibt bei ihr. " : ""}Du redest dir ein, dass du nichts mehr für sie tun kannst. Du drehst dich nicht um.`,
    positiv("walter") && `Walter bleibt zurück. Er winkt dir nach, wie ein Fahrer am Ende der Schicht.`,
    `Um ${knall()} Uhr fällt die Brücke hinter dir in den Fluss. Am Westufer steht die Stadt, dicht gedrängt bis ans Wasser, und sieht herüber. Zu dir, denkst du einen Moment lang. Dann schüttelst du den Gedanken ab.`,
    `Das Auffanglager liegt hinter der nächsten Linie. Zelte, Suppe, zweitausend Menschen. Sie geben dir eine Decke und einen Blechbecher. Du teilst dein Zelt mit einer Familie aus dem Norden. Du hilfst in der Küche aus. Du warst ${S.job}, du kannst mit Menschen. Sie mögen dich.`,
    `In der zweiten Woche bekommt der Junge aus deinem Zelt Fieber. Kein Biss. Die Ärzte verstehen es nicht.`,
    `In der dritten Woche sagt die Frau an der Essensausgabe denselben Satz viermal hintereinander.`,
    `In der vierten Woche stehst du am Zaun und kratzt dich am linken Unterarm, während hinter dir das Gemurmel beginnt. Du bist kerngesund. Du bist es immer gewesen.`,
    `Du hast nie erfahren, warum.`
  )
};

SZ.e_echo = {
  kap: 7, ort: "Westufer", klang: "murmeln",
  ende: { id: "echo", art: "bleib" },
  vor: zurSprengung,
  text: (S) => P(
    gesunde().length
      ? `Kessler geht rückwärts auf die Brücke, das Gewehr auf dich gerichtet, bis sie außer Reichweite ist. ${namen(gesunde())} ${gesunde().length > 1 ? "gehen" : "geht"} vor ihr her. Niemand sagt etwas zu dir.`
      : `Kessler geht rückwärts auf die Brücke, das Gewehr auf dich gerichtet, bis sie außer Reichweite ist. Dann dreht sie sich um und rennt.`,
    `Um ${knall()} Uhr fällt die Brücke in den Fluss.`,
    `Du stehst am Kai. Hinter dir steht die Stadt. Keiner fasst dich an.`,
    positiv("lotte") && `Lotte bleibt noch vier Tage bei dir. Sie sagt kein Wort, bis zum Schluss nicht. Danach geht sie neben dir her, eine kleine kalte Hand in deiner, das einzige Echo von Kaltenbrück, das schweigt.`,
    `Du hast neunzehn Tage lang gelogen. Und als du ein einziges Mal die Wahrheit gebraucht hättest, war niemand mehr da, der sie dir geglaubt hat.`,
    `Du gehst zurück in die Straßen. Du redest mit niemandem; es ist keiner da, der antwortet. Nach einer Woche ertappst du dich dabei, wie du vor einem Schaufenster stehst und vor dich hin sprichst. Immer dasselbe.`,
    `~„Name: ${S.name}. Beruf: ${S.job}. Gebissen: nein.“`,
    `Man muss nicht sterben, um ein Echo zu werden.`
  )
};

SZ.e_zuspaet = {
  kap: 7, ort: "Kaimauer", klang: "stille",
  ende: { id: "zuspaet", art: "spaet" },
  text: (S) => P(
    `Du bist noch zwei Straßen vom Fluss entfernt, als der Himmel im Osten weiß wird. Nicht vom Morgen.`,
    `Der Knall kommt eine Sekunde später. Danach ein Geräusch, wie du es noch nie gehört hast: Stahl, der sich hinlegt.`,
    `Am Kai ragen zwei Pfeiler aus dem Wasser. Dazwischen ist nichts mehr. Drüben, winzig, geht ein Scheinwerfer aus.`,
    `Es ist ${uhr()} Uhr. Die Stimme im Radio hat gesagt: bis sechs. Sie hat es alle vierzig Sekunden gesagt.`,
    mit("mara") && `Mara setzt sich auf die Kaimauer und zählt ihre Tabletten. Sie zählt sie zweimal.`,
    `Um dich herum steht die Stadt. Tausende. Und während du auf das Wasser starrst, merkst du es zum ersten Mal wirklich: Sie murmeln nicht. Nicht hier, nicht in deiner Nähe. Sie stehen um dich herum und sehen dich an, als würden sie auf etwas warten.`,
    `Du kratzt dich am Unterarm. Die Narbe juckt, wie jede Nacht.`,
    `Es wird hell über Kaltenbrück. Du hast jeden Umweg gemacht, der sich richtig angefühlt hat. Vielleicht war es das wert. Du wirst viel Zeit haben, darüber nachzudenken.`
  )
};

function echoSatz() { return S.satz || "Gebissen: nein."; }

SZ.e_schuss = {
  kap: 7, ort: "Die Brücke", klang: "stille",
  ende: { id: "tod", art: "tod" },
  text: (S) => P(
    `Der Schuss trifft dich in die Brust und setzt dich auf den Asphalt wie eine Hand.`,
    `Kessler steht über dir. Ihr Gesicht ist nicht hart. Es ist nur sehr müde. „Kein Blut über den Fluss“, sagt sie.`,
    `Du willst etwas sagen. Es kommt nichts mehr.`,
    `Später, als die Brücke schon im Wasser liegt, steht am Westufer jemand auf, der einmal ${S.job} war. Die anderen murmeln ihre Sätze. Dieser eine sagt:`,
    `~„${echoSatz()}“`,
    `Es war das Letzte, was du gesagt hast.`
  )
};

SZ.tod = {
  klang: "stille",
  ende: { id: "tod", art: "tod" },
  text: (S) => {
    const wie = S.kap <= 2
      ? `Es geht schnell, und es ist nicht wie im Film. Kein letzter Blick, kein Abschied. Hände, Gewicht, Dunkelheit.`
      : S.kap <= 4
        ? `Du merkst erst, dass du gefallen bist, als der Beton kalt an deiner Wange liegt. Jemand ruft deinen Namen. Es klingt sehr weit weg.`
        : `Die Straße schließt sich über dir wie Wasser. Das Letzte, was du siehst, sind zwei rote Lampen, weit oben, sehr ruhig.`;
    return P(
      wie,
      `Sie haben bei dir immer einen Herzschlag lang gezögert. Diesmal hat der Herzschlag nicht gereicht.`,
      `Später, viel später, steht zwischen den anderen jemand, der einmal ${S.job} war. Die anderen murmeln ihre Sätze. Dieser eine sagt, Tag und Nacht:`,
      `~„${echoSatz()}“`,
      `Es war das Letzte, was du gesagt hast.`,
      `Eines hast du nie erfahren: warum sie bei dir gezögert haben.`
    );
  }
};

/* ===================== SCHICKSALE UND BILANZ ===================== */
function schicksale(art, id) {
  if (art === "tod") return [];
  const t = [];
  const drueben = art === "heil" || art === "opfer" || art === "bleib";

  // Mara
  if (S.tot.mara === "opfer") {
    t.push(`**Mara Demir** hielt den Hebel im Stellwerk Hafen vier Minuten lang. Auf Station 4B ${S.f.mara_frieden ? "ist es seit dieser Nacht still" : "schlagen sie noch immer ans Glas"}.`);
  } else if (mit("mara")) {
    if (art === "heil") {
      t.push(S.inf.mara
        ? `**Mara Demir** bekam das Fieber auf der Landstraße. Die Kanüle lag schon bereit. Sie leitet heute die Plasmaspende im Lager Ost und sagt, sie sei ihr eigener erster Beweis.`
        : `**Mara Demir** leitet heute die Plasmaspende im Lager Ost. Sie besucht dich jeden Sonntag und spricht durch die Scheibe über alles außer Medizin.`);
    } else if (id === "ahnungslos") {
      t.push(positiv("lotte")
        ? `**Mara Demir** ist bei Lotte am Westufer geblieben. Das Letzte, was du von ihr gesehen hast, war ihr Rücken.`
        : `**Mara Demir** hat im Lager das Lazarettzelt übernommen. Sie war die Erste, die das Muster gesehen hat: nie ein Biss, aber immer dein Zelt, deine Schicht, dein Becher. Sie kam zu spät darauf.`);
    } else if (id === "herde") {
      t.push(`**Mara Demir** ist gerannt, bis die Landstraße zu Ende war. Sie erzählt jedem, der zuhört, wie die Toten über den Fluss kamen. Deinen Namen spricht sie dabei nicht aus.`);
    } else if (art === "spaet") {
      t.push(`**Mara Demir** sitzt neben dir auf der Kaimauer. Sie hat noch elf Tabletten.`);
    } else if (S.inf.mara) {
      t.push(`**Mara Demir** bekam am zweiten Tag hinter dem Fluss Fieber. Sie hat gewusst, was es war, und woher. Sie ist allein von der Landstraße in den Wald gegangen.`);
    } else if (id === "sprengung") {
      t.push(`**Mara Demir** trägt das Funkgerät, in das du deinen letzten Satz gesprochen hast, noch immer am Gürtel. Die Batterie ist seit Monaten leer.`);
    } else if (id === "wache" && S.v.mara >= 3) {
      t.push(`**Mara Demir** meldet sich jeden Abend um zehn auf Kanal neun. Ihr redet nie lange. Es reicht.`);
    } else {
      t.push(`**Mara Demir** hat sich auf der Brücke nicht mehr umgedreht. Du nimmst es ihr nicht übel.`);
    }
  }

  // Walter
  const wt = S.tot.walter;
  if (wt === "weg") t.push(`**Walter Brandt** ist in den Ahornweg gegangen und nicht zurückgekommen. In der Küche von Nummer 9 sitzen jetzt zwei am Tisch.`);
  else if (wt === "opfer") t.push(`**Walter Brandt** hat die Rangiersirene vier Minuten lang gehalten. ${S.f.walter_frieden ? "Er hatte Auf Wiedersehen gesagt." : "Zu Hannelore hat er es nie mehr geschafft."}`);
  else if (wt === "tot") t.push(`**Walter Brandt** blieb auf der Uferstraße stehen, eine Hand auf der Brust. Einunddreißig Jahre unfallfrei.`);
  else if (wt === "biss") t.push(`**Walter Brandt** setzte sich mit einem frischen Biss an die Kaimauer, zwei Ringe in der Faust, und wartete auf den Morgen.`);
  else if (mit("walter")) {
    if (S.inf.walter) {
      if (art === "heil") t.push(`**Walter Brandt** hatte keinen Biss. Er hatte einen Schluck aus deiner Flasche. Dein Blut hat ihn zurückgeholt. Er schreibt heute die Fahrpläne für die Versorgungszüge.`);
      else if (art === "spaet") t.push(`**Walter Brandt** sagt seit einer Stunde, dass ihm nur warm ist vom Laufen.`);
      else t.push(`**Walter Brandt** hatte keinen Biss. Er hatte einen Schluck aus deiner Flasche.`);
    } else if (art === "spaet") {
      t.push(`**Walter Brandt** steht am Kai und sieht auf die Pfeiler. Er kannte den Mann, der die Brücke gebaut hat.`);
    } else if (art === "seuche") {
      t.push(id === "herde"
        ? `**Walter Brandt** konnte nicht mehr rennen. Er ist es trotzdem.`
        : `**Walter Brandt** starb in der dritten Woche im Lager. Kein Biss.`);
    } else {
      t.push(`**Walter Brandt** schreibt drüben die Fahrpläne für die Versorgungszüge. Er sagt, das sei das Einzige, was er je richtig gekonnt habe.${S.f.walter_gerettet ? " Roths Ruderern schickt er jeden Monat eine Flasche." : ""}`);
    }
  }

  // Jonas
  const jt = S.tot.jonas;
  if (jt === "roth") {
    t.push(S.inf.jonas
      ? `**Jonas** bekam in Roths Parkhaus Fieber, zwei Stunden nachdem ihr gegangen wart. Niemand dort hat verstanden, warum er keinen Biss hatte. Das Licht im Parkhaus Süd ist seit dieser Nacht aus.`
      : `**Jonas** arbeitet in Roths Parkhaus seine Schuld ab. Er ist gut darin, Dinge zu besorgen. Nach dir hat er nie wieder gefragt.`);
  } else if (jt === "tot") {
    t.push(S.f.jonas_satz
      ? `**Jonas** hat sich seinen Satz ausgesucht und musste ihn nie sagen. Er hieß: Alles gut.`
      : `**Jonas** wurde siebzehn Jahre alt.`);
  } else if (jt === "echo") t.push(`**Jonas** steht hinter dem Rolltor einer Waschstraße am Ring und sagt, dass er es nur für Mama gemacht hat.`);
  else if (jt === "opfer") t.push(`**Jonas** hat die Sirene gehalten und ist gerannt, so schnell er konnte. Es hat nicht gereicht.`);
  else if (jt === "gewandelt") t.push(`**Jonas** hast du bis zur Uferstraße getragen. Dort hat er aufgehört, Jonas zu sein.`);
  else if (mit("jonas")) {
    if (art === "spaet") t.push(`**Jonas** wirft Steine ins Wasser, einen nach dem anderen, dorthin, wo die Brücke war.`);
    else if (art === "seuche") t.push(id === "herde" ? `**Jonas** ist schneller gerannt als alle. Diesmal hat es gereicht.` : `**Jonas** hat im Lager Essen ausgefahren. Er hatte dein Zelt auf seiner Route.`);
    else t.push(`**Jonas** macht drüben eine Ausbildung zum Sanitäter. Er sagt, er sei jemandem Antibiotika schuldig.`);
  }

  // Lotte
  if (mit("lotte")) {
    if (positiv("lotte")) {
      if (art === "heil") t.push(`**Lotte** war die Erste, die dein Blut bekommen hat. Am Abend hat sie die Augen aufgeschlagen und nach ihrem Löffel gesucht.`);
      else if (art === "spaet") t.push(`**Lotte** schläft an deiner Schulter. Sie glüht.`);
      else if (art === "seuche") t.push(`**Lotte** blieb am Westufer zurück, zwei Striche in der Faust. Sie hatte keinen Biss. Sie hatte einen Schluck aus deiner Flasche.`);
    } else {
      if (art === "spaet") t.push(`**Lotte** hält deine Hand und sieht aufs Wasser. Sie sagt nichts.`);
      else if (art === "seuche") t.push(id === "herde" ? `**Lotte** hat jemand getragen. Du weißt nicht, wer.` : `**Lotte** hat im Lager neben dir geschlafen. Jede Nacht.`);
      else if (S.v.lotte < 2) t.push(`**Lotte** ist drüben. Sie hat bis heute kein Wort gesagt. Sie malt Brücken.`);
      else if (art === "heil") { /* im Haupttext erzählt */ }
      else t.push(`**Lotte** ist drüben. Sie spricht wieder, jeden Tag ein bisschen mehr. Nur ihren letzten Satz hebt sie sich auf.`);
    }
  } else if (S.f.klopfen_ignoriert) {
    t.push(`Das **Klopfen** hinter der Tür hast du nie wieder gehört. Du hörst es trotzdem. Dreimal kurz.`);
  }

  // Hanna
  if (S.kap >= 5) {
    if (S.f.hanna_erloest) t.push(`**Hanna** liegt in ihrer Badewanne, zugedeckt mit ihrem Bademantel.`);
    else if (S.f.hanna_abschied) t.push(`**Hanna** sagt hinter ihrer Tür noch immer, dass du schon mal anfangen sollst.`);
    else if (S.f.hanna_gesehen) t.push(`**Hanna** steht hinter ihrer Tür. Du hast sie noch einmal gesehen. Sie hat dich berührt.`);
    else if (S.f.hanna_frei && id !== "wache" && id !== "sprengung") t.push(`**Hanna** geht irgendwo durch Kaltenbrück. Barfuß.`);
    else if (!S.f.hanna_besucht) t.push(`**Hanna** steht hinter einer Badezimmertür in der Lindenstraße 14. Du bist in dieser Nacht daran vorbeigegangen.`);
  }

  // Roth
  if (S.f.roth_deal) t.push(`**Roth** hat Wort gehalten. Pia läuft wieder.`);
  else if (S.f.roth_feind >= 2 && art !== "opfer") t.push(`**Roth** sucht dich noch.`);

  // Kessler
  if (drueben && id !== "echo") t.push(`**Feldwebel Kessler** hat ihren letzten Befehl ausgeführt. Seitdem trägt sie keine Uhr mehr.`);
  return t;
}

function bilanz(art) {
  const kennt = art === "heil" || art === "bleib" || art === "opfer" || art === "seuche";
  const da = ["mara", "walter", "jonas", "lotte"].filter(mit).map((w) => NAMEN[w]);
  const weg = Object.keys(S.tot).map((w) => NAMEN[w]);
  const inf = ["Timo (vor dieser Nacht)"].concat(["jonas", "lotte", "walter", "mara"].filter((w) => S.inf[w]).map((w) => NAMEN[w]));
  const h = S.hum;
  const was = h >= 5 ? "Du bist Mensch geblieben."
    : h >= 2 ? "Du hast versucht, Mensch zu bleiben."
      : h >= -1 ? "Du hast getan, was nötig war."
        : "Die Stadt hat dich hart gemacht.";
  return [
    ["Ende der Nacht", uhr() + " Uhr"],
    ["Zustand", S.hp + " von " + S.hpMax],
    ["An deiner Seite", da.length ? liste(da) : "niemand"],
    ["Verloren", weg.length ? liste(weg) : "niemand"],
    ["Durch dich infiziert", kennt ? liste(inf) : "▮▮▮▮▮▮▮▮▮▮"],
    ["Was die Nacht aus dir gemacht hat", was]
  ];
}
