/* TOTENSTILLE – Prolog, Kapitel 1 (Stadtbad Nord), Kapitel 2 (Tunnel / Dächer) */
"use strict";

function funkKontakt() {
  return [
    `Mara dreht am Kanalwähler. Rauschen. Rauschen. Dann, ganz dünn, die Durchsage. Und darunter, als stünde jemand direkt neben dem Lautsprecher, eine zweite Stimme. Eine Frau. „… wer hat das Gerät? Hier ist die Brücke. Wie viele seid ihr?“`,
    `„Vier“, sagt Mara.`,
    `„Dann beeilt euch. Ich warte nicht eine Minute länger als sechs.“ Es klickt.`,
    `*Ich*, hat sie gesagt. Nicht *wir*.`
  ];
}

/* ===================== PROLOG ===================== */
SZ.prolog = {
  kap: 0, ort: "Nacht 19", klang: "innen",
  text: (S) => P(
    `Neunzehn Nächte lang hat das Kurbelradio nur gerauscht. Heute Nacht spricht es.`,
    `>„Hier ist die Brücke. Wir nehmen jeden auf, der gesund ist. Halten Sie Namen und Beruf bereit. Wir bleiben bis sechs Uhr. Danach gibt es keine Brücke mehr.“`,
    `Die Stimme ist jung und sehr müde. Nach vierzig Sekunden fängt sie von vorn an. In Kaltenbrück wiederholt sich inzwischen fast alles.`,
    `Du übst deine Antworten wie für ein Vorstellungsgespräch am Ende der Welt. Name: ${S.name}. Beruf: ${S.job}. Gebissen: nein.`,
    `Das Letzte übst du am häufigsten.`,
    `+${GABEN[S.arch][0]}|${GABEN[S.arch][1]}`
  ),
  weiter: "k1_start", wl: "Die Nacht beginnt"
};

/* ===================== KAPITEL 1 ===================== */
SZ.k1_start = {
  kap: 1, ort: "Stadtbad Nord", klang: "innen", cp: true,
  text: (S) => {
    const j = S.job;
    const alt = {
      med: `Als ${j} hast du gelernt, wie viel ein Körper aushält. In diesen neunzehn Tagen hast du gelernt, wie wenig.`,
      kampf: `Als ${j} hast du geglaubt, auf den Ernstfall vorbereitet zu sein. Der Ernstfall hatte andere Pläne.`,
      tech: `Als ${j} hast du Dinge am Laufen gehalten. Die Bretter vor den Fenstern, das Kurbelradio, die Pumpe im Keller: alles deine Arbeit.`,
      rede: `Als ${j} hast du davon gelebt, Menschen zu lesen und zu überzeugen. Hier unten hat das öfter ein Leben gerettet als jede Waffe.`,
      sorge: `Als ${j} hast du dich um andere gekümmert. Du hast nie damit aufgehört. Es ist das Einzige, was dich hier unten noch an dich selbst erinnert.`,
      zaeh: `${j}. Nichts an deinem alten Leben hat dich auf das hier vorbereitet. Du lebst trotzdem noch, und das können nach neunzehn Tagen nicht viele sagen.`
    }[S.arch];
    return P(
      `Das Stadtbad Nord ist seit neunzehn Tagen euer Zuhause. Ein leeres Becken, gekachelt bis unter die Decke, vier Schlafsäcke am Grund des Nichtschwimmerbereichs. Jeder Laut kommt hier doppelt zurück. Deshalb flüstert ihr.`,
      S.makler && `Früher hättest du gesagt: Objekt mit Charakter, sanierungsbedürftig, sehr ruhige Nachbarschaft. Nur das mit der Nachbarschaft stimmt nicht mehr.`,
      `Draußen, hinter den zugenagelten Fenstern, liegt das Gemurmel über der Straße. Hunderte Stimmen, und jede sagt Tag und Nacht denselben Satz: den letzten, den sie als Mensch gesprochen hat. Deshalb nennt man sie Echos.`,
      `~„Ich bin gleich da.“`,
      `~„Hast du abgeschlossen?“`,
      `~„Nur noch fünf Minuten.“`,
      `Man gewöhnt sich daran. Angst macht nur der Moment, in dem es aufhört. Wenn die Echos still werden, haben sie jemanden bemerkt.`,
      `Walter Brandt, achtundsechzig, früher Fahrer bei den Verkehrsbetrieben, streicht einen Netzplan auf den Kacheln glatt. Mara Demir, Notfallsanitäterin, zählt Tabletten in ihre Handfläche. Jonas, siebzehn, kurbelt das Radio, als könnte er die Stimme damit festhalten.`,
      alt,
      `„Sechs Uhr“, sagt Mara. „Das sind keine acht Stunden. Timo hätte gesagt, wir schaffen das.“ Niemand antwortet. Der vierte Schlafsack ist seit einer Woche leer. Fieber, kein Biss. Mara hat ihn zweimal abgesucht und es dann zu Ende gebracht, bevor er aufwachen konnte. Sie versteht es bis heute nicht.`,
      `Die Narbe an deinem linken Unterarm juckt, wie jede Nacht. Eine Glasscherbe, am ersten Tag. Das hast du allen gesagt.`,
      `Ihr habt vier Rucksäcke und zu wenig Platz. Neben Decke und Wasserflasche passt bei dir genau eine Sache.`
    );
  },
  wahl: (S) => [
    wahl(`Den Verbandskasten aus dem Bademeisterraum.`, (S) => {
      S.verband = ist("med") ? 3 : 2; zeit(5);
      notiz("Verbandszeug eingepackt.");
      return folge([
        `Der Kasten hängt noch an der Wand, hinter einer Scheibe, auf der NUR IM NOTFALL steht. Mullbinden, Kompressen, eine Schere, ein Paar Einmalhandschuhe.`,
        ist("med") && `Du sortierst den Inhalt im Dunkeln nach Griffreihenfolge, ohne nachzudenken. Manche Dinge verlernt man nicht.`,
        `Mara nickt, als sie den Kasten in deinem Rucksack verschwinden sieht. „Wenigstens jemand, der mitdenkt.“`
      ], "k1_scherbe");
    }),
    wahl(`Das Brecheisen aus dem Heizungskeller.`, (S) => {
      S.eisen = true; zeit(5);
      notiz("Brecheisen eingepackt.");
      return folge([
        `Es lehnt dort, wo du es am dritten Tag abgestellt hast. Sechzig Zentimeter Stahl, an einem Ende gebogen. Es öffnet Türen. Es öffnet auch anderes, aber daran denkst du jetzt nicht.`,
        `Jonas grinst zum ersten Mal seit Tagen. „Endlich mal jemand mit 'nem Plan.“`
      ], "k1_scherbe");
    }),
    wahl(`Die Pistole des toten Polizisten. Drei Patronen.`, (S) => {
      S.ammo = 3; zeit(5);
      notiz("Pistole eingepackt. Drei Schuss.");
      return folge([
        `Der Polizist liegt seit dem zweiten Tag im Foyer, unter einer Rettungsdecke. Seine Dienstwaffe hat seitdem niemand angerührt. Im Magazin stecken drei Patronen.`,
        ist("kampf") && `Du ziehst den Schlitten zurück, prüfst das Patronenlager, sicherst. Deine Hände wissen noch, was sie tun.`,
        `Walter sieht erst die Waffe an, dann dich. „Jeder Schuss ist in dieser Stadt eine Einladung“, sagt er. „Überleg dir gut, wen du einlädst.“`
      ], "k1_scherbe");
    }),
    wahl(`Wasser und Konserven. Alles, was noch da ist.`, (S) => {
      S.vorrat = 2; zeit(5);
      notiz("Vorräte eingepackt.");
      return folge([
        `Zwei Flaschen Wasser, noch versiegelt. Drei Dosen Pfirsiche. Du hast sie hinter den Spinden versteckt, für den Tag, an dem es ernst wird.`,
        `„Das hattest du die ganze Zeit?“, fragt Jonas. Mara legt ihm die Hand auf den Arm. „Und heute teilt ${S.name} es mit uns. Das zählt.“`
      ], "k1_scherbe");
    })
  ]
};

SZ.k1_scherbe = {
  kap: 1, ort: "Stadtbad Nord", klang: "stille",
  text: (S) => P(
    `Walter und du löst die Bretter vom Personaleingang. Das dritte klemmt. Du reißt daran, deine Knöchel schrammen über den Putz, Haut bleibt hängen. Es brennt. Du wischst die Hand an der Hose ab und denkst nicht weiter darüber nach.`,
    `Jonas zieht am vierten Brett. Es gibt plötzlich nach, schlägt gegen das Drahtglas der Tür, und die Scheibe bricht. Er fängt sie mit der Hand.`,
    `Er schreit nicht. Dazu ist er zu lange dabei. Aber das Blut läuft ihm in schnellen Tropfen vom Handballen, und draußen passiert das Schlimmste, was passieren kann.`,
    `^Das Gemurmel hört auf.`,
    `Totenstille. Hunderte Köpfe, die sich drehen, irgendwo hinter der Mauer.`,
    `„Hand hoch, über den Kopf“, zischt Mara und greift schon nach ihrem Rucksack. Aber Jonas sieht nicht sie an. Er sieht dich an.`
  ),
  wahl: (S) => [
    wahl(`„Gib her.“ Du drückst deine Hände auf die Wunde und verbindest sie selbst.`, (S) => {
      zeit(5);
      if (ist("med") && S.verband > 0) {
        S.verband--; trau("jonas", 2);
        S.f.handschuhe = true;
        return folge([
          `Erst die Handschuhe. Das sitzt tiefer als jede Angst: nie mit bloßen Händen in fremdes Blut. Dann Kompresse, Binde, fester Zug. Zwanzig Sekunden.`,
          `„Wo hast du das gelernt?“, fragt Jonas. „In einem anderen Leben“, sagst du.`,
          `Draußen setzt das Gemurmel wieder ein, Stimme für Stimme. Mara atmet aus.`
        ], "k1_route");
      }
      const hatte = S.verband > 0;
      if (hatte) S.verband--;
      S.inf.jonas = true; S.f.selbst_verbunden = true;
      trau("jonas", 2);
      return folge([
        `Du kniest schon vor ihm. ${hatte ? "Kompresse, Binde, fester Zug." : "Du reißt einen Streifen von deinem Hemd und ziehst ihn fest."} Sein Blut läuft dir warm über die Finger, in die aufgeschürften Knöchel, seins und deins, nicht mehr zu unterscheiden.`,
        `„Danke“, sagt Jonas leise. Es ist das erste Mal, dass er das zu dir sagt.`,
        `Draußen setzt das Gemurmel wieder ein, Stimme für Stimme. Mara atmet aus.`
      ], "k1_route");
    }, { beruf: ist("med") && S.verband > 0 }),
    wahl(`„Mara, mach du das. Ich halte die Tür.“`, (S) => {
      zeit(8); trau("mara", 1);
      return folge([
        `Mara arbeitet schnell und ohne ein Wort. Druckverband, zwei Lagen, die Finger frei. Du stehst an der Tür und siehst durch den Riss im Drahtglas hinaus.`,
        `Einer steht im Hof. Ein Mann im Bademantel, barfuß, keine drei Meter entfernt. Sein Gesicht ist der Tür zugewandt. Dir. Du siehst, wie sich seine Nasenflügel bewegen.`,
        `Dann dreht er sich weg, als wärst du nichts, wonach es sich zu suchen lohnt, und sein Mund findet seinen Satz wieder.`,
        `~„Ich leg mich nur kurz hin.“`,
        `Du hältst es für Glück.`
      ], "k1_route");
    }),
    wahl(`„Ärmel drum, Zähne zusammen. Dafür ist jetzt keine Zeit.“`, (S) => {
      zeit(2); S.f.hand_schlecht = true;
      trau("jonas", -1);
      notiz("Jonas' Hand ist kaum zu gebrauchen.");
      return folge([
        `Jonas starrt dich einen Moment lang an. Dann wickelt er sich den Ärmel seines Kapuzenpullis um die Hand und beißt die Zähne zusammen. Der Stoff ist nach einer Minute schwarz.`,
        `„Das muss genäht werden“, sagt Mara. „Später“, sagst du. Sie widerspricht nicht. Aber sie merkt es sich.`
      ], "k1_route");
    }),
    wahl(`„Raus hier. Sofort, bevor sie die Tür finden.“`, (S) => {
      S.f.blutspur = true; S.horde++;
      notiz("Ihr hinterlasst eine Spur.");
      return folge([
        `Ihr rennt. Durch den Personaleingang, über den Hof, Jonas die Faust an die Brust gepresst. Hinter euch bleibt eine Spur aus dunklen, runden Tropfen auf dem Asphalt, wie verlorene Münzen.`,
        `Als ihr die Hofmauer erreicht, schlägt etwas von innen gegen die Tür, durch die ihr gerade gekommen seid. Dann noch etwas. Sie haben das Bad gefunden. In fünf Minuten finden sie die Tropfen.`,
        `Mara verbindet Jonas im Gehen, schlecht und schnell.`
      ], "k1_route");
    })
  ]
};

SZ.k1_route = {
  kap: 1, ort: "Hinterhof", klang: "murmeln",
  text: (S) => P(
    `Der Hinterhof. Nachtluft, zum ersten Mal seit Tagen. Über den Dächern steht ein halber Mond, und die Stadt darunter ist so dunkel, wie Städte nie gedacht waren.`,
    `Walter hält dir den Netzplan hin. „Die U3. Vom Stadtbad bis Agnesplatz, vier Stationen, alles unter der Erde. Ich bin die Strecke einunddreißig Jahre gefahren. Ich kenne da unten jede Weiche.“`,
    `„Und jeden, der da unten noch im Zug sitzt?“, fragt Jonas. Er zeigt nach oben, zur Feuerleiter. „Über die Altstadtdächer. Die stehen so eng, da kommt man bis zum Agnesplatz, ohne einmal runterzumüssen. Hab ich schon gemacht.“`,
    `Mara sieht auf die Uhr, dann auf dich. Irgendwann in den letzten neunzehn Tagen ist das so geworden: Am Ende sehen alle dich an.`,
    S.f.blutspur
      ? `Auf der Hauptstraße setzt das Gemurmel wieder ein. Näher als vorhin. Sie haben die Spur gefunden.`
      : `Auf der Hauptstraße setzt das Gemurmel wieder ein. Näher als vorhin.`
  ),
  wahl: (S) => [
    wahl(`Walters Weg: durch den U-Bahn-Tunnel.`, (S) => {
      zeit(10); trau("walter", 1); S.route = "tunnel";
      return folge([
        `„Tunnel“, sagst du. Walter faltet den Plan zusammen wie etwas Kostbares. „Station Stadtbad, Abgang Süd. Bleibt auf den Schwellen, nicht im Schotter. Und kein Wort, wenn ich die Hand hebe.“`
      ], "k2a_zug");
    }),
    wahl(`Jonas' Weg: über die Dächer der Altstadt.`, (S) => {
      zeit(10); trau("jonas", 1); S.route = "dach";
      return folge([
        `„Dächer.“ Jonas ist schon an der Feuerleiter. Walter legt den Kopf in den Nacken und sieht lange hinauf. „Achtundsechzig Jahre“, murmelt er. „Und jetzt soll ich klettern wie eine Katze.“ Aber er greift nach der ersten Sprosse.`
      ], "k2b_dach");
    }),
    wahl(`Der kürzeste Weg: die Hauptstraße, mitten durch.`, (S) => {
      S.route = "tunnel"; S.horde++;
      const t = [
        `Zweihundert Meter geht es gut. Die Hauptstraße ist breit, die Echos stehen in losen Gruppen, vertieft in ihre Sätze. Ihr geht an der Bordsteinkante, einer hinter dem anderen.`,
        `Dann biegt ihr um die Ecke am Kaufhaus, und die Straße ist voll. Von Schaufenster zu Schaufenster.`,
        `^Das Gemurmel hört auf.`
      ];
      if (ist("kampf")) {
        t.push(`Du bist schneller als deine Angst. Dem Ersten rammst du die Schulter gegen die Brust, den Zweiten reißt du am Kragen zur Seite. „Lauft!“`);
      } else {
        t.push(`Ihr rennt. Eine Hand erwischt deinen Rucksack und reißt dich herum, du schlägst mit dem Gesicht gegen eine Autotür. Mara zerrt dich hoch.`);
        leben(-1);
      }
      t.push(`Walter stößt ein Gitter auf, das du nie gesehen hättest: der Abgang zur U3. Ihr stolpert die Treppe hinunter ins Schwarze. Über euch füllt sich der Eingang mit Schatten.`);
      t.push(`„Das war der kurze Weg“, keucht Mara. „Nie wieder.“`);
      trau("mara", -1);
      return folge(t, "k2a_zug", { klang: "stille" });
    }, { beruf: ist("kampf") }),
    wahl(`„Wir stimmen ab. Jeder eine Stimme.“`, (S) => {
      zeit(15); S.route = "tunnel";
      trau("walter", 1); trau("mara", 1); trau("jonas", -1);
      return folge([
        `Walter hebt die Hand für den Tunnel. Jonas für die Dächer. Mara überlegt keine Sekunde. „Tunnel. Wenn auf einem Dach einer fällt, kann ich nichts mehr für ihn tun.“`,
        `Zwei zu eins, bevor du überhaupt den Mund aufmachst. Jonas schiebt die Hände in die Taschen und sagt nichts mehr. Bei ihm ist das das Lauteste.`,
        `„Gut, dass du gefragt hast“, sagt Walter leise zu dir. „Timo hat nie gefragt.“`
      ], "k2a_zug");
    })
  ]
};

/* ===================== KAPITEL 2A: TUNNEL ===================== */
SZ.k2a_zug = {
  kap: 2, ort: "U3, Tunnel", klang: "tunnel", cp: true, dauer: 35,
  text: (S) => P(
    `Der Abgang zur Station Stadtbad riecht nach nassem Stein und nach etwas Süßem, über das niemand spricht. Walter geht voran, eine Hand an der Wand, als würde er sie begrüßen.`,
    `Auf den Gleisen steht das Wasser knöcheltief. Ihr habt eine Taschenlampe, mit Maras Halstuch abgedunkelt. Ihr Licht reicht drei Schritte.`,
    `Nach der zweiten Kurve hört ihr sie. Ein Zug steht im Tunnel, die Türen geschlossen, die Scheiben von innen beschlagen. Dahinter sitzen sie. Ordentlich, auf ihren Plätzen, wie an jenem Morgen.`,
    `~„Nächster Halt: Agnesplatz.“`,
    `~„Ich bin gleich da, Schatz.“`,
    `~„Sagen Sie mal, geht das auch schneller?“`,
    `„Der Sieben-Uhr-zwölfer“, flüstert Walter. „Den hat Ludwig gefahren. Wir haben zusammen gelernt.“`,
    `Der Zug füllt den Tunnel fast ganz aus. Rechts bleibt ein Spalt zwischen Wagen und Wand, schulterbreit. Unter den Wagen glänzt schwarzes Wasser. Die Tür des letzten Wagens steht eine Handbreit offen.`,
    S.horde > 0 && `Hinter euch, vom Bahnsteig her, kommen Schritte ins Wasser. Viele.`
  ),
  wahl: (S) => [
    wahl(`Durch den Zug. Leise, zwischen ihnen hindurch.`, (S) => {
      zeit(10);
      const t = [
        `Die Tür lässt sich aufschieben. Drinnen ist es warm, auf eine Art, die du nicht einatmen willst. Vierzig Köpfe, alle nach vorn gerichtet. Du setzt den Fuß in den Gang.`,
        `Ein Mann im Anzug hält sich an der Stange fest. „Sagen Sie mal, geht das auch schneller?“ Als du an ihm vorbeigehst, bricht sein Satz mitten im Wort ab. Dann der der Frau neben ihm. Die Stille läuft vor dir her durch den Wagen wie eine Welle.`,
        `Sie sehen dich an. Alle. Du stehst zwischen ihnen und hörst nur noch dein eigenes Blut.`,
        `Dann gleiten ihre Blicke von dir ab, hinter dich, zu Mara. Und ihre Lippen beginnen sich wieder zu bewegen.`
      ];
      if (S.f.hand_schlecht || S.f.blutspur) {
        t.push(`Jonas ist der Dritte. Seine Hand tropft durch den Verband. Der Mann im Anzug dreht den Kopf zu dem Geräusch, zu dem Geruch, und greift zu.`);
        if (S.eisen) {
          t.push(`Dein Brecheisen trifft das Handgelenk, bevor sich die Finger schließen. Es knackt wie ein Ast. Ihr rennt die letzten zwei Wagen, und hinter euch steht der ganze Zug auf.`);
        } else {
          t.push(`Du reißt Jonas los. Fingernägel ziehen dir vier Striemen über den Hals. Ihr rennt die letzten zwei Wagen, und hinter euch steht der ganze Zug auf.`);
          leben(-1);
        }
        S.horde++;
      } else {
        t.push(`Vier Wagen. Keiner von euch atmet. Hinter der letzten Tür steht Walter im Wasser und zittert am ganzen Körper. „Die haben dich angesehen“, flüstert er. „Und dann haben sie weggesehen. Hast du das gemerkt?“`);
      }
      return folge(t, "k2_klopfen", { klang: "stille" });
    }),
    wahl(`Durch den Spalt an der Tunnelwand.`, (S) => {
      zeit(25); S.f.walter_herz = true;
      trau("walter", 1);
      return folge([
        `Der Spalt ist so eng, dass ihr die Rucksäcke vor der Brust tragen müsst. Rechts kalter Beton, links die Scheiben, eine Handbreit vor deinem Gesicht.`,
        `Dahinter bewegen sie sich. Du siehst es aus dem Augenwinkel: Ein Kopf dreht sich mit, als du vorbeigehst. Dann der nächste. Der ganze Wagen sieht dir nach. Nicht Mara vor dir, nicht Jonas hinter dir. Dir.`,
        `Eine Frau legt die Stirn an die Scheibe, genau auf deiner Höhe. Ihre Lippen stehen still.`,
        `Auf halber Strecke bleibt Walter stecken. Er atmet flach und schnell, eine Hand auf der Brust. Du schiebst die Schulter unter seinen Arm und ziehst ihn weiter, Meter um Meter.`,
        `„Geht schon“, sagt er am Ende. „Die Pumpe. Die ist auch nicht mehr die Jüngste.“`
      ], "k2_klopfen");
    }),
    wahl(`Unter dem Zug hindurch. Durchs Wasser kriechen.`, (S) => {
      zeit(15); S.funk = true; leben(-1);
      notiz("Funkgerät gefunden.");
      return folge([
        `Das Wasser ist so kalt, dass es wehtut. Du kriechst auf den Ellbogen, den Mund knapp über der Oberfläche. Über dir, durch den Wagenboden, hörst du sie murmeln und mit den Füßen scharren.`,
        `Unter dem dritten Wagen liegt einer, der nicht murmelt. Uniform der Bundespolizei, das Gesicht zum Glück nach unten. An seinem Gürtel glimmt ein grünes Lämpchen.`,
        `Ein Funkgerät. Du löst es mit tauben Fingern. Als du am anderen Ende auftauchst, hast du dir an einer Schwellenschraube den Unterschenkel aufgerissen und spürst deine Hände nicht mehr.`,
        funkKontakt()
      ], "k2_klopfen");
    }),
    wahl(ist("tech") ? `Die Notentriegelung am letzten Wagen ziehen.` : `Eine Ablenkung: Lärm am hinteren Ende des Zuges.`, (S) => {
      zeit(10);
      if (ist("tech")) {
        return folge([
          `Am letzten Wagen sitzt die Notentriegelung, ein roter Griff hinter einer Plombe. Du kennst solche Mechaniken. Ein Ruck, und am hinteren Ende des Zuges klappen alle Türen gleichzeitig auf.`,
          `Sie stehen auf. Alle auf einmal. Sie drängen nach hinten hinaus, in den Tunnel, aus dem ihr gekommen seid, weg von euch. Ihr geht durch den Spalt, als wäre der Zug leer.`,
          `„Wo lernt man so was?“, flüstert Jonas. „Als ${S.job}“, sagst du.`
        ], "k2_klopfen");
      }
      S.horde++;
      return folge([
        `Du nimmst einen Schotterstein und wirfst ihn, so weit du kannst, über den Zug hinweg nach hinten. Er schlägt gegen Blech. Noch einer. Noch einer.`,
        `^Das Gemurmel hört auf.`,
        `Dann stehen sie auf. Alle gleichzeitig. Sie drängen ans hintere Ende des Zuges, und ihr schiebt euch vorn durch den Spalt, so schnell es geht.`,
        `Hinter euch splittert Glas. Der Lärm läuft durch den Tunnel in beide Richtungen, und irgendwo weit hinten antwortet ihm etwas.`
      ], "k2_klopfen", { klang: "stille" });
    }, { beruf: ist("tech") })
  ]
};

/* ===================== KAPITEL 2B: DÄCHER ===================== */
SZ.k2b_dach = {
  kap: 2, ort: "Dächer der Altstadt", klang: "murmeln", cp: true, dauer: 35,
  text: (S) => P(
    `Die Feuerleiter singt unter eurem Gewicht. Dann seid ihr oben, und zum ersten Mal seit neunzehn Tagen siehst du, was aus Kaltenbrück geworden ist.`,
    `Kein Licht, nirgends. Nur der Fluss, ein mattes Band im Osten, und darüber, winzig, zwei rote Lampen: die Brücke.`,
    `Unter euch liegt der Marktplatz. Er ist voll. Sie stehen Schulter an Schulter zwischen den Marktständen, und ihr Gemurmel steigt herauf wie Wärme.`,
    `~„Zwei Pfund Tomaten, bitte.“`,
    `~„Das zahlt doch die Versicherung.“`,
    `~„Noch nicht gucken!“`,
    `Das Letzte ist eine Kinderstimme. Mara schließt kurz die Augen.`,
    `Jonas läuft geduckt voraus, bis der First endet. Zwischen diesem Haus und dem nächsten klafft eine Gasse, gut zweieinhalb Meter breit. Jemand hat eine Gerüstbohle hinübergelegt. Sie ist grau, schmal und vom Regen aufgequollen.`,
    `„Die hält“, sagt Jonas. „Hat sie letztes Mal auch.“ Walter sieht die Bohle an wie einen alten Feind. Rechts von euch führt eine offene Dachluke ins Haus hinunter.`
  ),
  wahl: (S) => [
    wahl(`Du gehst zuerst und testest die Bohle.`, (S) => {
      zeit(10); trau("walter", 1); trau("mara", 1);
      return folge([
        `Die Bohle federt bei jedem Schritt. In der Mitte machst du den Fehler, nach unten zu sehen.`,
        `Die Gasse ist voll. Und sie murmeln nicht. Dreißig, vierzig Gesichter, nach oben gedreht, bleich wie Teller. Sie sehen dich an, und für die Länge von zwei Herzschlägen steht die ganze Gasse still.`,
        `Dann bist du drüben. Unter dir setzen die Sätze wieder ein, als wäre nichts gewesen.`,
        `Mara kommt, dann Jonas. Walter geht als Letzter. Beim dritten Schritt knackt das Holz. Du wirfst dich auf den Bauch, erwischst seinen Unterarm und hältst ihn, während die Bohle unter ihm wegbricht und drei Stockwerke tiefer aufschlägt.`,
        `Er liegt neben dir auf dem Blech und lacht lautlos, die Augen nass. „Einunddreißig Jahre unfallfrei“, flüstert er.`
      ], "k2_klopfen", { klang: "stille" });
    }),
    wahl(`Jonas zuerst. Er kennt den Weg.`, (S) => {
      if (S.f.hand_schlecht) {
        zeit(25); S.horde++; trau("jonas", 1);
        return folge([
          `Jonas läuft los, als wäre die Bohle ein Bürgersteig. Am anderen Ende will er sich an der Regenrinne hochziehen, mit der verletzten Hand. Sie gibt nach.`,
          `Er hängt. Einen Arm über der Dachkante, die Beine im Leeren. Du rennst über die Bohle, ohne nachzudenken, und ziehst ihn hoch. Hinter dir rutscht das Holz von der Kante und fällt.`,
          `Der Aufschlag hallt durch die ganze Altstadt. Mara und Walter stehen auf der anderen Seite der Gasse. Sie müssen durchs Haus. Es dauert zwanzig Minuten, bis ihr wieder zusammen seid, und unten ist das Gemurmel nicht zurückgekommen.`
        ], "k2_klopfen", { klang: "stille" });
      }
      zeit(15); trau("jonas", 1);
      return folge([
        `Jonas läuft los, als wäre die Bohle ein Bürgersteig. Drüben dreht er sich um und verbeugt sich. Zum ersten Mal siehst du, dass er erst siebzehn ist.`,
        `Mara folgt, dann du. Walter braucht drei Anläufe. Am Ende kriecht er auf allen vieren hinüber, die Augen geschlossen, und Jonas redet ihm die ganze Strecke leise zu: „Noch ein Stück. Noch ein Stück. Ich hab dich.“`,
        `Als Walter drüben ist, legt er dem Jungen die Hand auf den Kopf. Keiner sagt etwas.`
      ], "k2_klopfen");
    }),
    wahl(`Durch die Dachluke: runter ins Haus und drüben wieder hoch.`, (S) => {
      zeit(20); S.funk = true;
      notiz("Funkgerät gefunden.");
      return folge([
        `Die Leiter führt in einen Flur. Kinderschuhe unter der Garderobe, eine Uniformjacke am Haken. Aus dem Wohnzimmer kommt Gemurmel, vierstimmig.`,
        `Sie sitzen am Esstisch. Vater, Mutter, zwei Kinder. Vor ihnen stehen Teller, auf denen etwas liegt, das einmal Abendbrot war.`,
        `~„Hände waschen, es gibt Essen.“`,
        `~„Bitte bleiben Sie ruhig.“`,
        `Der Weg zur Wohnungstür führt an der offenen Zimmertür vorbei. Du gehst zuerst. Der Mann im Uniformhemd hebt den Kopf. Sein Satz bricht ab. Dann die anderen drei. Vier Gesichter, die dich ansehen wie einen verspäteten Gast.`,
        `Dann senken sie die Köpfe wieder über ihre Teller.`,
        `Auf dem Sideboard im Flur steht eine Ladeschale mit einem Funkgerät. Das Lämpchen ist grün. Du nimmst es mit.`,
        funkKontakt()
      ], "k2_klopfen", { klang: "stille" });
    }),
    wahl(`Die Bohle erst sichern: Gürtel, Riemen, Knoten.`, (S) => {
      trau("walter", 1);
      if (ist("tech")) {
        zeit(8);
        return folge([
          `Zwei Rucksackriemen, dein Gürtel, ein Spannknoten um den Schornsteinfuß. Du brauchst keine drei Minuten. Die Bohle sitzt danach fester als manches Geländer, das du in deinem Leben gesehen hast.`,
          `„Danke“, sagt Walter drüben, so leise, dass nur du es hörst. „Der Junge meint es gut. Aber er weiß noch nicht, dass man fallen kann.“`
        ], "k2_klopfen");
      }
      zeit(20);
      return folge([
        `Ihr braucht eine Viertelstunde, alle Gürtel und zwei Rucksackriemen. Jonas rollt mit den Augen. Aber als Walter hinübergeht, bewegt sich die Bohle keinen Fingerbreit.`,
        `„Danke“, sagt Walter drüben, so leise, dass nur du es hörst. „Der Junge meint es gut. Aber er weiß noch nicht, dass man fallen kann.“`
      ], "k2_klopfen");
    }, { beruf: ist("tech") })
  ]
};

/* ===================== KAPITEL 2: DAS KLOPFEN ===================== */
SZ.k2_klopfen = {
  kap: 2, klang: "innen", dauer: 25,
  vor: (S) => { S.ort = S.route === "tunnel" ? "Station Rathaus" : "Trockenboden"; },
  text: (S) => {
    const tu = S.route === "tunnel";
    return P(
      tu
        ? `Hinter dem Zug wird der Tunnel breiter. Station Rathaus, ein Bahnsteig voller liegengebliebener Taschen. An der Stirnwand eine graue Stahltür: BETRIEBSRAUM – KEIN ZUTRITT.`
        : `Das dritte Dach ist flach. Ein alter Trockenboden mit einem Aufbau aus Holz, die Wäscheleinen noch gespannt. Die Tür ist von innen verriegelt.`,
      `Dahinter klopft es.`,
      `Dreimal kurz. Pause. Dreimal kurz.`,
      `Ihr bleibt stehen. Walter schüttelt langsam den Kopf. „Das ist keiner von denen. Die klopfen nicht. Die reden.“`,
      `„Oder es ist einer, der uns da drin haben will“, flüstert Mara. „Wir haben keine Zeit für fremde Türen, ${S.name}.“`,
      `Dreimal kurz. Pause. Es klingt geduldig. So, als würde es das schon sehr lange tun.`
    );
  },
  wahl: (S) => {
    const tu = S.route === "tunnel";
    const kind = (zus) => [
      `Ein Mädchen. Acht vielleicht. Sie sitzt auf einem Stapel ${tu ? "Warnwesten" : "alter Decken"}, einen Löffel in der Faust, und drückt sich an die Wand, so weit es geht. Um sie herum leere Dosen, sauber aufgereiht. An der Wand Kreidestriche. Du zählst siebzehn.`,
      `Sie schreit nicht. Sie sagt gar nichts. Auf ihre Jacke ist ein Namensschild genäht, wie für die Kita: LOTTE.`,
      zus
    ];
    return [
      wahl(`Die Tür aufbrechen.`, (S) => {
        const t = [];
        if (S.eisen || ist("tech")) {
          zeit(5);
          t.push(S.eisen
            ? `Das Brecheisen findet den Spalt neben dem Schloss. Ein Druck, ein trockenes Knacken. Die Tür schwingt auf.`
            : `Ein Schnappriegel, mehr nicht. Du schiebst dein Taschenmesser in den Spalt und hebelst die Falle zurück. Die Tür schwingt auf.`);
        } else {
          zeit(10); S.horde++;
          t.push(`Du wirfst dich mit der Schulter dagegen. Einmal. Zweimal. Beim dritten Mal gibt der Rahmen nach, und der Knall rollt ${tu ? "durch den ganzen Bahnhof" : "über die Dächer"}. Irgendwo, weit weg, wird es still.`);
        }
        S.da.lotte = true; S.v.lotte = ist("sorge") ? 1 : 0;
        notiz("Lotte schließt sich euch an.");
        t.push(kind(`Mara geht in die Hocke und streckt die Hand aus. Es dauert lange. Dann steht das Mädchen auf, geht an Maras Hand vorbei und stellt sich hinter dich.`));
        t.push(`„Die redet ja gar nicht“, stellt Jonas fest. Lotte sieht ihn an, als wäre das die dümmste Bemerkung der Welt.`);
        return folge(t, "k3_bahn");
      }),
      wahl(`Zurückklopfen. Dreimal kurz.`, (S) => {
        zeit(10); mensch(1);
        S.da.lotte = true; S.v.lotte = ist("sorge") ? 3 : 2;
        notiz("Lotte schließt sich euch an.");
        return folge([
          `Du legst die Knöchel an ${tu ? "den Stahl" : "das Holz"}. Dreimal kurz.`,
          `Stille. Dann schiebt sich ein Zettel unter der Tür durch. Wachsmalstift, Großbuchstaben: SEID IHR ECHT?`,
          `„Wir sind echt“, sagst du leise. „Ich heiße ${S.name}. Wir gehen zur Brücke. Du kannst mitkommen.“`,
          `Lange nichts. Dann ein zweiter Zettel: SAG NOCH WAS ANDERES.`,
          `Du verstehst. Echos sagen immer dasselbe. Also redest du. Über das Stadtbad, über Walter, der Züge gefahren hat, über den halben Mond. Irgendwann fährt innen ein Riegel zurück.`,
          `Ein Mädchen, acht vielleicht, einen Löffel in der Faust. Auf ihre Jacke ist ein Namensschild genäht: LOTTE. Sie sagt kein Wort. Aber sie nimmt deine Hand, als hätte sie das schon vor langer Zeit beschlossen.`,
          `Später, im Gehen, hält sie dir einen dritten Zettel hin: ICH SAG NICHTS. WAS MAN ZULETZT SAGT, MUSS MAN FÜR IMMER SAGEN.`
        ], "k3_bahn");
      }, { beruf: ist("sorge") }),
      wahl(`Etwas zu essen vor die Tür stellen und weitergehen.`, (S) => {
        zeit(3); mensch(1); S.f.lotte_folgt = true;
        const hatte = S.vorrat > 0;
        if (hatte) S.vorrat--;
        return folge([
          `Du stellst ${hatte ? "eine Dose Pfirsiche und eine der versiegelten Flaschen" : "den halben Schokoriegel aus deiner Jackentasche"} vor die Tür. Dann klopfst du, dreimal kurz, und trittst zurück.`,
          `Das Klopfen hört auf. Niemand öffnet.`,
          `„Mehr können wir nicht tun“, sagt Mara. Es klingt wie eine Frage. Ihr geht weiter. Als du dich nach dreißig Schritten umdrehst, ist der Platz vor der Tür leer.`
        ], "k3_bahn");
      }),
      wahl(`Weitergehen. Nicht jede Tür ist eure.`, (S) => {
        mensch(-1); trau("mara", -1); S.f.klopfen_ignoriert = true;
        return folge([
          `Ihr geht. Das Klopfen folgt euch, dreimal kurz, Pause, dreimal kurz. Dann ändert es sich. Es wird schneller. Unregelmäßig. Jemand hat gehört, dass da Schritte waren, und dass sie sich entfernen.`,
          `Dann hört es auf.`,
          `Mara geht neben dir, den Blick geradeaus. „Ich hab schon mal eine Tür stehen lassen“, sagt sie. „Man wird es nicht wieder los, ${S.name}. Nur damit du es weißt.“`
        ], "k3_bahn");
      })
    ];
  }
};
