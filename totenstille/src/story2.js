/* TOTENSTILLE – Kapitel 3 (Agnesplatz), Kapitel 4 (Parkhaus Süd) */
"use strict";

/* ===================== KAPITEL 3: LINIE 7 ===================== */
SZ.k3_bahn = {
  kap: 3, ort: "Agnesplatz", klang: "innen", cp: true, dauer: 45,
  vor: (S) => {
    if (S.f.lotte_folgt && !S.da.lotte) {
      S.da.lotte = true; S.v.lotte = 1; S.f.lotte_kam = true;
    }
  },
  text: (S) => {
    const lo = mit("lotte");
    return P(
      `Am Agnesplatz steht eine Straßenbahn quer auf der Kreuzung. Linie 7, das Zielschild noch lesbar: BRÜCKE. Die Türen lassen sich von Hand zuziehen. Zum ersten Mal seit zwei Stunden sitzt ihr.`,
      S.f.lotte_kam && `Mara bemerkt es zuerst: eine kleine Gestalt, die dreißig Meter hinter euch in einem Hauseingang steht. Ein Mädchen, acht vielleicht, eine leere Pfirsichdose in der Hand wie eine Eintrittskarte. Sie ist euch den ganzen Weg gefolgt.`,
      S.f.lotte_kam && `Auf ihre Jacke ist ein Namensschild genäht: LOTTE. Sie sagt kein Wort. Sie steigt in die Bahn und setzt sich auf den Platz neben dir, als wäre er reserviert gewesen.`,
      `Jonas schläft sofort ein, den Kopf an der Scheibe. Mara zählt durch, was noch da ist. Walter schraubt mit steifen Fingern an seiner Tablettendose.`,
      lo
        ? `Lotte hat keine Flasche. Sie sieht auf deine. Fragen würde sie nie, sie sagt ja nichts. Aber ihre Lippen sind grau und aufgesprungen, und sie schluckt trocken.`
        : `Walter hat seine Flasche unterwegs verloren. Die Tablette liegt auf seiner Zunge und geht nicht hinunter. Er hustet trocken und versucht, es zu verbergen.`,
      `„Jeder hat seine Ration“, sagt Mara, ohne aufzusehen. „Wenn wir jetzt anfangen zu teilen, reicht es für keinen bis zur Brücke.“`,
      `Du drehst den Verschluss deiner Flasche auf. Vorhin, beim Laufen, hast du dir auf die Lippe gebissen. Der erste Schluck schmeckt nach Eisen.`
    );
  },
  wahl: (S) => {
    const lo = mit("lotte");
    const ziel = lo ? "lotte" : "walter";
    const Z = NAMEN[ziel];
    return [
      wahl(`Deine eigene Flasche an ${Z} weiterreichen.`, (S) => {
        zeit(5); mensch(1); S.inf[ziel] = true; trau(ziel, 2);
        return folge(lo ? [
          `Lotte trinkt in kleinen, ernsten Schlucken. Dann wischt sie den Flaschenhals sorgfältig mit dem Ärmel ab, bevor sie dir die Flasche zurückgibt. Als wäre sie es, die dich schützen muss.`,
          `Sie rückt ein Stück näher. Nach einer Weile liegt ihr Kopf an deinem Arm.`,
          `Mara sagt nichts. Aber sie hat aufgehört zu zählen.`
        ] : [
          `Walter trinkt, spült die Tablette hinunter und gibt dir die Flasche mit beiden Händen zurück, wie man einen Kelch reicht. „Meine Hannelore hätte dich gemocht“, sagt er.`,
          `Mara sagt nichts. Aber sie hat aufgehört zu zählen.`
        ], "k3_agnes");
      }),
      wahl(S.vorrat > 0 ? `Eine versiegelte Flasche aus deinem Vorrat öffnen.` : `Den Getränkeautomaten an der Haltestelle aufbrechen.`, (S) => {
        if (S.vorrat > 0) {
          S.vorrat--; zeit(5); trau(ziel, 1); leben(1);
          return folge([
            `Das Knacken des Verschlusses ist das schönste Geräusch dieser Nacht. ${Z} trinkt die halbe Flasche in einem Zug.`,
            `Die Pfirsiche teilt ihr durch ${zahlwort(anzahl())}. Zucker. Du hattest vergessen, wie sich das anfühlt.`
          ], "k3_agnes");
        }
        if (S.eisen || ist("tech")) {
          zeit(8); trau(ziel, 1); leben(1);
          return folge([
            S.eisen
              ? `Das Brecheisen in den Türspalt, ein langsamer Druck. Das Schloss gibt nach wie ein müder Zahn.`
              : `Automatenschlösser sind alle gleich. Du brauchst eine aufgebogene Haarklammer von Mara und zwei Minuten.`,
            `Vier Dosen Limonade und eine Flasche Wasser. ${Z} trinkt, bis ${lo ? "sie" : "er"} Schluckauf bekommt. Zucker. Du hattest vergessen, wie sich das anfühlt.`
          ], "k3_agnes");
        }
        zeit(12); S.horde++; trau(ziel, 1); leben(1);
        return folge([
          `Du trittst die Scheibe ein. Das Glas ist lauter, als du gedacht hast. Am Ende des Platzes bricht das Gemurmel ab, und ihr duckt euch alle in den Schatten der Bahn, eine Minute lang, zwei.`,
          `Dann fängt es wieder an. Ihr habt vier Dosen Limonade und eine Flasche Wasser. Aber irgendwo in der Dunkelheit haben sich Köpfe in eure Richtung gedreht und sind so stehen geblieben.`
        ], "k3_agnes", { klang: "stille" });
      }),
      wahl(`„Mara, du hast am meisten. Gib du etwas ab.“`, (S) => {
        zeit(5); trau("mara", -1);
        return folge([
          `Mara sieht dich an. Lange. Dann schraubt sie ihre Flasche auf und hält sie ${lo ? "dem Mädchen" : "Walter"} hin.`,
          `„Großzügig sein mit fremdem Wasser“, sagt sie. „Das kann jeder.“`
        ], "k3_agnes");
      }),
      wahl(`„An der Brücke gibt es Wasser. Bis dahin hält jeder durch.“`, (S) => {
        zeit(3); mensch(-1);
        if (lo) {
          trau("lotte", -1); trau("mara", -1);
          return folge([
            `Lotte senkt den Blick. Eine Minute später hält Mara ihr wortlos die eigene Flasche hin und sieht dabei dich an.`
          ], "k3_agnes");
        }
        S.f.walter_schwach = true; trau("walter", -1);
        notiz("Walter ist geschwächt.");
        return folge([
          `Walter nickt und würgt die Tablette trocken hinunter. Sie bleibt ihm halb im Hals stecken. Er hustet, bis ihm die Tränen kommen, und winkt ab, als Mara aufstehen will.`,
          `Danach sitzt er lange still, eine Hand flach auf der Brust.`
        ], "k3_agnes");
      })
    ];
  }
};

SZ.k3_agnes = {
  kap: 3, ort: "Sankt-Agnes-Klinikum", klang: "murmeln",
  text: (S) => P(
    `Die Linie 7 steht im Schatten des Sankt-Agnes-Klinikums. Sieben Stockwerke, alle Fenster dunkel. Bis auf die im vierten. Dort stehen sie an den Scheiben, in Krankenhaushemden, die Handflächen am Glas.`,
    `Ihr müsst unter diesen Fenstern vorbei. Mara geht als Letzte. Sie geht immer langsamer.`,
    `~„Schwester? Schwester Mara, ich kriege keine Luft.“`,
    `~„Schwester Mara, Sie kommen doch wieder?“`,
    `Jonas bleibt stehen. „Die sagen deinen Namen.“`,
    `Mara steht mitten auf der Straße, den Blick nach oben. „Station 4B. Am dritten Tag habe ich dort ausgeholfen. Es waren zwei Gebissene auf dem Flur und elf im Zimmer, die noch gelebt haben. Ich hatte den Schlüssel.“ Sie schluckt. „Ich habe abgeschlossen. Von außen. Ich habe ihnen gesagt, ich komme wieder.“`,
    `Oben schlagen die Hände im Takt gegen das Glas.`
  ),
  wahl: (S) => [
    wahl(`„Du hättest sie nicht retten können. Aber uns hast du gerettet.“`, (S) => {
      zeit(5);
      if (ist("rede")) {
        trau("mara", 2);
        return folge([
          `„Elf, die du nicht retten konntest“, sagst du. „Und wie viele hast du in den Jahren davor aus Autos geschnitten? Wie viele seitdem? Uns drei allein in den letzten neunzehn Tagen. Die Rechnung geht nie auf, Mara. Aber sie geht auch nicht nur in eine Richtung.“`,
          `Sie sieht dich an, als hättest du etwas ausgesprochen, das sie sich selbst nicht erlaubt hat. Dann nickt sie und geht weiter. Schneller als vorher.`
        ], "k4_sperre");
      }
      trau("mara", 1);
      return folge([
        `Mara nickt langsam. Sie glaubt dir nicht ganz. Aber sie geht weiter, und nach ein paar Schritten berührt ihre Schulter kurz deine.`
      ], "k4_sperre");
    }, { beruf: ist("rede") }),
    wahl(`„Dann gehen wir rauf und bringen es zu Ende. Zusammen.“`, (S) => {
      zeit(35); mensch(1);
      const wer = mit("lotte") ? "Jonas und Lotte" : "Jonas";
      const t = [
        `Der Haupteingang steht offen. Im Treppenhaus brennt nichts mehr, also zählt ihr die Stockwerke mit der Hand am Geländer. Walter bleibt mit ${wer} unten.`,
        `Station 4B. Die Tür hat ein Sichtfenster. Dahinter stehen sie, elf, in ihren Hemden, und sagen Maras Namen.`,
        `Mara schließt auf. Mit demselben Schlüssel.`
      ];
      if (ist("kampf")) {
        t.push(`Es dauert keine fünf Minuten. Du weißt, wohin man schlagen muss, und du hasst, wie gut du es weißt.`);
      } else if (S.eisen) {
        t.push(`Es dauert keine fünf Minuten. Das Brecheisen ist für so etwas gemacht, und du hasst, wie gut es geht.`);
      } else if (S.ammo > 0) {
        S.ammo--; S.horde++;
        t.push(`Ihr habt Maras Messer und eine Infusionsstange. Für den Letzten, der Mara schon am Kragen hat, brauchst du eine Patrone. Der Schuss ist im ganzen Haus zu hören, und draußen wird es still.`);
        notiz("Eine Patrone verbraucht.");
      } else {
        t.push(`Ihr habt nur Maras Messer und eine Infusionsstange. Es dauert zu lange. Einer drückt dich gegen ein Bettgestell, bis dir die Rippen knacken und Mara ihn von dir herunterzieht.`);
        leben(-1);
      }
      S.akte = true; S.verband += 1; S.f.mara_frieden = true;
      t.push(
        `Mara nennt jeden beim Namen. Herr Aksoy. Frau Lindemann. Sie hat keinen vergessen. Dir fällt auf, dass sich keiner von ihnen für dich interessiert hat. Sie sind alle auf Mara zugegangen.`,
        `Im Stationszimmer liegt neben einer kalten Tasse ein Diktiergerät. Mara drückt auf Wiedergabe. Die Stimme der Stationsärztin, heiser, sehr schnell:`,
        `>„… Patient Lindner, Zimmer neun. Bissverletzung an Tag eins, bis heute fieberfrei. Ich habe ihn für ein Wunder gehalten. Aber alle drei Zimmernachbarn sind erkrankt, ohne jeden Bisskontakt. Ein geteiltes Trinkglas. Ein Verbandswechsel. Wenn ich recht habe, ist Lindner kein Wunder. Er ist die Quelle. Und sein Blut wäre der Schlüssel, wenn es noch jemanden gäbe, der …“`,
        `Das Band endet. Mara steckt das Gerät ein. „Träger“, sagt sie nachdenklich. „Gebissen und kein Fieber. Hast du so was je gesehen?“`,
        `Die Narbe an deinem Arm juckt. „Nein“, sagst du.`
      );
      trau("mara", 2);
      notiz("Diktiergerät der Stationsärztin mitgenommen.");
      return folge(t, "k4_sperre", { klang: "innen" });
    }),
    wahl(`„Elf Menschen. Und du schläfst nachts?“`, (S) => {
      zeit(5); mensch(-1); S.f.hanna_bekannt = true;
      trau("mara", -2);
      return folge([
        `„Nein“, sagt Mara. Sie dreht sich zu dir um, und ihr Gesicht ist ganz ruhig. „Ich schlafe nicht. Deshalb weiß ich auch, dass du im Schlaf redest, ${S.name}. Jede Nacht derselbe Name. Hanna. Und jede Nacht hältst du dabei deinen linken Arm fest.“`,
        `Sie wartet nicht auf eine Antwort. Walter sieht zwischen euch hin und her und sagt nichts.`
      ], "k4_sperre");
    }),
    wahl(`„Jeder von uns hat irgendwo eine Tür zugemacht.“`, (S) => {
      zeit(8); mensch(1); S.f.hanna_erzaehlt = true;
      trau("mara", 2); trau("walter", 1);
      return folge([
        `Mara dreht sich langsam zu dir um. „Du auch?“`,
        `Du hast es neunzehn Tage lang niemandem gesagt. „Meine Schwester. Hanna. Sie ist nicht drüben auf der Ostseite, wie ich es euch erzählt habe. Sie ist in ihrem Badezimmer, Lindenstraße 14. Ich habe von außen abgeschlossen.“`,
        `Walter räuspert sich. „Hannelore sitzt in unserer Küche“, sagt er. „Ahornweg 9.“ Er sagt es zum ersten Mal.`,
        `Über euch schlagen die Hände ans Glas. Mara nimmt ihren Rucksack wieder auf. „Dann sind wir ja unter uns“, sagt sie, und es klingt fast wie Zuneigung.`
      ], "k4_sperre");
    })
  ]
};

/* ===================== KAPITEL 4: PARKHAUS SÜD ===================== */
SZ.k4_sperre = {
  kap: 4, ort: "Parkhaus Süd", klang: "innen", cp: true, dauer: 50,
  text: (S) => P(
    `Der Ring ist dicht. Jemand hat Autos zu einer Mauer geschoben, zwei Lagen hoch, von der Hauswand bis zur Einfahrt des Parkhauses Süd. Dahinter brennt Licht. Echtes, elektrisches Licht, und ein Generator brummt.`,
    `„Stehen bleiben.“ Die Stimme kommt von oben. Drei Gestalten auf der Mauer, zwei Jagdgewehre, eine Armbrust. „Hände dahin, wo ich sie sehe.“`,
    `Ein Mann steigt herunter. Um die fünfzig, Arbeitsjacke mit dem Aufdruck ROTH HOCH- UND TIEFBAU, das Gesicht eines Menschen, der seit drei Wochen Entscheidungen trifft, die keiner treffen will.`,
    `„Durch den Ring geht es nur durch mein Parkhaus. Und in mein Parkhaus kommt keiner, den wir nicht angesehen haben. Ärmel hoch. Hosenbeine. Kragen. Alle.“`,
    mit("lotte")
      ? `Mara krempelt als Erste. Dann Walter. Jonas zögert, dann auch er. Lotte hält ihre dünnen Arme hin wie beim Kinderarzt.`
      : `Mara krempelt als Erste. Dann Walter. Jonas zögert, dann auch er.`,
    `Dann bist du dran. Die Narbe liegt unter deinem linken Ärmel. Ein Halbmond aus hellen Punkten. Du hast sie neunzehn Tage lang niemandem gezeigt.`,
    ist("rede") && `*Du hast als ${S.job} genug Gesichter gelesen: Roth will niemanden erschießen. Aber er wird es tun, wenn man ihm vor seinen Leuten einen Grund gibt.*`
  ),
  wahl: (S) => [
    wahl(`Ärmel hoch. „Eine Glasscherbe. Am ersten Tag.“`, (S) => {
      zeit(8); S.f.luege = true; S.f.narbe_gesehen = true;
      if (S.akte) S.f.mara_weiss = true;
      if (!S.f.hanna_erzaehlt) trau("mara", -1);
      return folge([
        `Die Frau mit der Lampe beugt sich über deinen Unterarm. Lange.`,
        `„Scherben machen keine Bögen“, sagt sie. Roth tritt näher. „Wie alt?“ – „Neunzehn Tage.“ Er überlegt. Dann zuckt er mit den Schultern. „Dann ist mir egal, was es war. Wer gebissen ist, steht nach neunzehn Stunden nicht mehr. Du stehst nach neunzehn Tagen. Durch.“`,
        `Die Lampe wandert weiter. Aber Mara hat die Narbe gesehen, zum ersten Mal. Und Mara hat in ihrem Leben mehr Bisswunden versorgt als jeder hier.`,
        S.akte && `Du siehst, wie ihre Hand zu der Jackentasche geht, in der das Diktiergerät steckt.`
      ], "k4_jonas");
    }),
    wahl(`Ärmel hoch. „Ein Biss. Am ersten Tag. Ich lebe noch.“`, (S) => {
      zeit(12); mensch(1);
      S.f.wahrheit = true; S.f.narbe_gesehen = true; S.f.mara_ahnt = true;
      if (S.akte) S.f.mara_weiss = true;
      trau("jonas", -1);
      return folge([
        `^Niemand rührt sich.`,
        `Dann geht alles gleichzeitig. Zwei Gewehrläufe zeigen auf deinen Kopf. Jonas weicht einen Schritt zurück. Mara sagt „Was?“, so leise, dass es wehtut.`,
        `Roth sieht sich die Narbe an, aus zwei Metern Abstand. Verheilt. Weiß. „Das gibt's nicht“, sagt er. „Aber ich habe in drei Wochen eine Menge gesehen, was es nicht gibt.“ Er spuckt aus. „Du gehst außen über die Rampe, wo wir dich im Blick haben. Du fasst bei mir nichts an und niemanden.“`,
        `Mara starrt dich an. „Neunzehn Tage“, flüstert sie. „Und Timo hatte keinen Biss.“ Sie bringt den Gedanken nicht zu Ende. Noch nicht.`,
        S.akte && `Ihre Hand liegt auf der Tasche mit dem Diktiergerät.`
      ], "k4_jonas", { klang: "stille" });
    }),
    wahl(`„Mich fasst keiner an. Wir sind sauber, das muss reichen.“`, (S) => {
      zeit(10); S.f.narbe_gesehen = true; S.f.roth_feind = 1;
      if (S.akte) S.f.mara_weiss = true;
      const t = [];
      if (ist("kampf")) {
        t.push(`Der Erste, der nach deinem Arm greift, liegt eine Sekunde später auf dem Asphalt, und du hast sein Gewehr in der Hand, bevor du darüber nachgedacht hast. Dann zeigen drei andere Läufe auf deinen Kopf, und du legst es langsam wieder hin.`);
      } else {
        t.push(`Der Gewehrkolben trifft dich in den Magen, bevor du den Satz beendet hast. Du gehst in die Knie.`);
        leben(-1);
      }
      t.push(
        `Zwei halten dich fest, die Frau mit der Lampe reißt deinen Ärmel hoch. Stille.`,
        `„Alt“, sagt sie. „Komplett verheilt.“ Roth schüttelt den Kopf. „Dafür das Theater? Wer so etwas versteckt, hat entweder was zu verbergen oder ist einfach nur stur. Ich hoffe für deine Leute, du bist stur.“`,
        `Mara hat die Narbe gesehen. Sie sagt nichts. Sie sieht nur nicht mehr weg.`
      );
      trau("mara", -1);
      return folge(t, "k4_jonas");
    }, { beruf: ist("kampf") }),
    wahl(`„Seht euch lieber den Jungen an. Der kennt euch doch.“`, (S) => {
      zeit(5); mensch(-1); S.f.verraten = true;
      trau("jonas", -3); trau("mara", -1);
      return folge([
        `Es wirkt sofort. Alle Lampen schwenken auf Jonas. Dein Ärmel ist vergessen.`,
        `Jonas sieht dich an. Kein Zorn. Etwas Schlimmeres: Er sieht aus wie jemand, der gerade etwas über die Welt gelernt hat, das er lieber nicht gewusst hätte.`,
        `„Wusst ich's doch“, sagt Roth leise und tritt vor den Jungen. „So ein Gesicht vergesse ich nicht.“`
      ], "k4_jonas");
    })
  ]
};

SZ.k4_jonas = {
  kap: 4, ort: "Parkhaus Süd", klang: "innen",
  text: (S) => P(
    !S.f.verraten && `Roth will euch schon durchwinken. Dann bleibt seine Lampe an Jonas hängen. Lange.`,
    `„Neun Tage ist das her. Du hast bei uns gegessen, bei uns geschlafen, und in der zweiten Nacht warst du weg. Mit dem Medikamentenrucksack.“ Seine Stimme bleibt ruhig. Das ist schlimmer, als wenn er schreien würde. „Am Tag danach hat Benno Fieber gekriegt. Wundbrand. Wir hatten nichts mehr für ihn.“`,
    `Jonas ist grau im Gesicht. „Meine Mutter“, sagt er. „Sie hatte eine Entzündung. Ich dachte, Antibiotika …“ Er sieht zu Boden. „Sie ist trotzdem gestorben. Den Rucksack hab ich noch. Halb voll.“`,
    `Oben auf der Mauer wird ein Gewehr durchgeladen. Roth hebt die Hand, ohne hinzusehen. „Der Junge bleibt hier. Der arbeitet das ab. Ihr anderen könnt durch.“`,
    S.inf.jonas && `Jonas' Stirn glänzt. Es sind vier Grad, und er schwitzt.`,
    `Jonas' Blick findet deinen.`,
    ist("rede") && `*Roth blufft nicht. Aber du siehst, dass er einen Ausweg sucht, bei dem er vor seinen Leuten nicht schwach aussieht.*`
  ),
  wahl: (S) => {
    const nach = (S) => (S.inf.jonas && mit("jonas")) ? "k4_fieber" : "k5_start";
    return [
      wahl(`„Er bleibt. Wir gehen.“`, (S) => {
        zeit(5); mensch(-2);
        trau("mara", -2); trau("walter", -1);
        verlust("jonas", "roth");
        return folge([
          `Jonas wehrt sich nicht. Er stellt den Medikamentenrucksack vor Roths Füße. Dann streckt er Walter die Hand hin, wie ein Erwachsener, und Walter nimmt sie und kann nicht sprechen.`,
          `Dich sieht er nicht mehr an.`,
          `Roth lässt euch durch die Einfahrt. Auf Ebene zwei drückt euch jemand eine Flasche Wasser in die Hand. „Für den Weg.“ Es ist das teuerste Wasser deines Lebens.`
        ], nach);
      }),
      wahl(ist("rede") ? `Roth eine Brücke bauen, über die er gehen kann.` : `Verhandeln: der Rucksack zurück, und ihr legt etwas drauf.`, (S) => {
        zeit(10);
        if (ist("rede")) {
          trau("jonas", 2);
          return folge([
            `Du redest nicht mit Roth. Du redest zu den dreien auf der Mauer, laut genug, dass jeder es hört. Dass hier ein Mann steht, der seine Leute seit drei Wochen am Leben hält. Dass so einer es sich leisten kann, einen Siebzehnjährigen laufen zu lassen, der für seine sterbende Mutter gestohlen hat. Dass man genau daran die Starken von den Grausamen unterscheidet.`,
            S.makler
              ? `Roth hört dir mit schmalen Augen zu. Er weiß genau, was du tust. „Was warst du früher? Staubsaugervertreter?“ – „${S.job}“, sagst du. Er lacht kurz und trocken. „Natürlich.“`
              : `Roth hört dir mit schmalen Augen zu. Er weiß genau, was du tust. „Was warst du früher?“ – „${S.job}“, sagst du. Er lacht kurz und trocken. „Natürlich.“`,
            `Er nimmt den Rucksack. „Haut ab. Alle. Bevor ich es mir anders überlege.“`
          ], nach);
        }
        let was = null;
        if (S.vorrat > 0) { was = "deine letzten Vorräte"; S.vorrat = 0; notiz("Vorräte abgegeben."); }
        else if (S.verband > 0) { was = "den Verbandskasten"; S.verband = 0; notiz("Verbandszeug abgegeben."); }
        else if (S.ammo > 0) { was = "die Pistole mit allen Patronen"; S.ammo = 0; notiz("Pistole abgegeben."); }
        else if (S.funk) { was = "das Funkgerät"; S.funk = false; notiz("Funkgerät abgegeben."); }
        else if (S.eisen) { was = "das Brecheisen"; S.eisen = false; notiz("Brecheisen abgegeben."); }
        trau("jonas", 1);
        if (was) {
          return folge([
            `Du legst ${was} neben den Rucksack. Roth wiegt es mit Blicken.`,
            `„Für ein Leben ist das wenig“, sagt er. „Aber Benno hätte gewollt, dass der Junge läuft. Der war so.“ Er tritt zur Seite.`
          ], nach);
        }
        trau("mara", -1); trau("walter", -1);
        return folge([
          `Du hast nichts, was er brauchen könnte. Roth sieht es dir an. „Die Uhr“, sagt er zu Walter.`,
          `Walter löst das Armband ohne ein Wort. Ein Geschenk der Verkehrsbetriebe, zum Dreißigjährigen. Dann zeigt Roth auf Maras Rucksack, und Mara zählt ihm die Hälfte ihrer Tabletten in die Hand.`,
          `„Jetzt sind wir quitt“, sagt Roth. Keiner von euch sieht dich an.`
        ], nach);
      }, { beruf: ist("rede") }),
      wahl(`„Mara ist Sanitäterin. Lasst sie eure Verletzten ansehen. Dafür gehen wir alle.“`, (S) => {
        zeit(30); mensch(1); S.f.roth_deal = true; S.f.roth_feind = 0;
        trau("mara", 1); trau("jonas", 1);
        notiz("Roth schuldet euch etwas.");
        return folge([
          `Roths Gesicht verändert sich. Nur für einen Moment, aber du siehst es. „Ebene drei“, sagt er rau. „Meine Tochter.“`,
          `Pia ist zwölf. Sie liegt auf der Rückbank eines Kombis, der Unterschenkel dick und rot bis zum Knie. Kein Biss. Ein rostiger Nagel, vor einer Woche. Mara schneidet, spült, verbindet. Die Antibiotika aus Jonas' Rucksack reichen genau für eine Kur.`,
          `„In drei Tagen läuft sie wieder“, sagt Mara. Roth steht daneben, die Hände hängen ihm herab wie Werkzeug, das jemand vergessen hat.`,
          `Dann sieht er Jonas an. „Wir sind quitt.“ Und zu dir: „Am Ruderclub an der Uferstraße liegen zwei Boote von mir. Wenn ihr mich braucht: dreimal Licht.“`
        ], nach);
      }),
      wahl(`Jonas am Kragen packen und rennen.`, (S) => {
        S.f.roth_feind = 2; S.f.roth_deal = false;
        const t = [
          `Du packst Jonas und rennst. Nicht zurück. Hinein, in die Einfahrt, die Rampe hinauf, zwischen die geparkten Autos.`,
          `Hinter euch Geschrei. Dann ein Schuss, und die Heckscheibe neben dir zerfällt.`
        ];
        if (ist("kampf") && S.ammo > 0) {
          S.ammo--;
          t.push(`Du drehst dich im Laufen um und schießt einmal, hoch, in die Deckenlampe. Funken, Dunkelheit, Flüche. Das verschafft euch zehn Sekunden.`);
          notiz("Eine Patrone verbraucht.");
        } else {
          t.push(`Etwas reißt an deiner Schulter, heiß und stumpf. Du läufst weiter. Erst auf der anderen Seite merkst du, dass dein Ärmel nass ist. Ein Streifschuss.`);
          leben(-1);
        }
        t.push(
          `Ihr brecht durch den Notausgang auf der Rückseite. Mara und Walter kommen dreißig Sekunden später${mit("lotte") ? ", Lotte auf Maras Arm" : ""}. Aus dem Parkhaus brüllt Roth euch nach: „Ich finde euch! Die Stadt ist nicht groß genug!“`,
          `Jonas lehnt an der Wand und sieht dich an. „Du hättest mich einfach dalassen können“, sagt er.`
        );
        trau("jonas", 2);
        notiz("Roth vergisst das nicht.");
        return folge(t, nach);
      }, { beruf: ist("kampf") && S.ammo > 0 })
    ];
  }
};

SZ.k4_fieber = {
  kap: 4, ort: "Waschstraße am Ring", klang: "innen", dauer: 15,
  text: (S) => P(
    `Hinter dem Parkhaus liegt eine Waschstraße, das Rolltor halb offen. Ihr braucht fünf Minuten Pause. Jonas braucht mehr.`,
    `Er sitzt an der Wand, die verbundene Hand im Schoß, und redet. „Ich hab's nur für Mama gemacht“, sagt er. Mara fühlt seine Stirn. „Ich hab's nur für Mama gemacht.“ Sie leuchtet ihm in die Augen. „Ich hab's nur für Mama gemacht.“`,
    `Dreimal in einer Minute. Derselbe Satz, derselbe Tonfall. Er merkt es nicht.`,
    `Mara sucht ihn ab. Arme, Beine, Nacken, Kopfhaut. Dann noch einmal. Als sie aufsteht, ist ihr Gesicht leer.`,
    `„Kein Biss. Nur der Schnitt von der Scheibe.“ Sie sieht Walter an, dann dich. „Genau wie bei Timo. Fieber, er wiederholt sich, und er hat keinen Biss. Das gibt es nicht. Irgendetwas übersehen wir.“`,
    `Jonas hebt den Kopf. Für einen Moment ist er ganz da. „Ich werd einer von denen, oder?“ Niemand lügt ihn an.`,
    `„Dann will ich mir meinen Satz aussuchen. Wenn ich schon für immer einen sagen muss.“ Er lächelt schief. „Nicht den mit Mama.“`
  ),
  wahl: (S) => [
    wahl(`Bei ihm bleiben, bis es vorbei ist. Ihm helfen, seinen Satz zu finden.`, (S) => {
      zeit(25); mensch(2); S.f.jonas_satz = true;
      trau("mara", 1);
      const t = [
        `Du setzt dich neben ihn. Mara zieht eine Spritze auf und legt sie neben sich. Sie wird warten, bis er schläft.`,
        `Jonas probiert Sätze an wie Schuhe. „Bis gleich.“ Er schüttelt den Kopf. „Ich war's nicht.“ Er lacht, und es wird ein Husten.`,
        ist("sorge") && `Du hältst seine gesunde Hand und suchst mit ihm, so wie man mit einem Kind sucht, das nicht einschlafen kann.`,
        `Dann wird er still. „Alles gut“, sagt er schließlich. „Ich nehme: Alles gut. Wenn mich dann einer hört, in zehn Jahren …“ Er bringt es nicht zu Ende.`,
        `Er sagt es noch zweimal, zum Üben. Dann schläft er ein, den Kopf an deiner Schulter, und Mara sorgt dafür, dass er seinen Satz niemals sagen muss.`
      ];
      verlust("jonas", "tot");
      return folge(t, "k5_start");
    }, { beruf: ist("sorge") }),
    wahl(`Es Mara abnehmen. Diesmal tust du es selbst.`, (S) => {
      zeit(10);
      const t = [
        `„Geh mit den anderen raus“, sagst du zu Mara. Sie sieht dich an und versteht. Sie hätte es zum zweiten Mal in einer Woche tun müssen.`,
        `Jonas weiß, was kommt. Er nickt. „Mach, dass es schnell geht.“`
      ];
      if (S.ammo > 0) {
        S.ammo--; S.horde++;
        t.push(`Der Schuss ist kurz und trocken, und er ist in der halben Stadt zu hören.`);
        notiz("Eine Patrone verbraucht.");
      } else {
        t.push(`Es geht schnell. Das ist alles, was du jemals darüber sagen wirst.`);
      }
      t.push(`Als du herauskommst, nimmt Mara wortlos deine Hand und hält sie einen Moment lang fest.`);
      trau("mara", 2);
      verlust("jonas", "tot");
      return folge(t, "k5_start");
    }),
    wahl(`Ihn hierlassen. Lebend, mit Wasser, das Tor von außen zu.`, (S) => {
      zeit(5); mensch(-1);
      trau("walter", -1); trau("mara", -1);
      verlust("jonas", "echo");
      return folge([
        `Ihr lasst ihm eine Flasche Wasser da und zieht das Rolltor herunter. Jonas sitzt an der Wand und sieht euch dabei zu. Er sagt nicht, dass ihr bleiben sollt.`,
        `Ihr seid keine dreißig Schritte weit, als es hinter dem Tor wieder anfängt. Dieselben Worte. Aber die Stimme hat ihren Besitzer schon verloren.`,
        `~„Ich hab's nur für Mama gemacht.“`,
        `Walter bleibt stehen, als hätte ihn etwas getroffen. Dann geht er weiter, ohne dich anzusehen.`
      ], "k5_start");
    }),
    wahl(`„Wir nehmen ihn mit. An der Brücke gibt es Ärzte.“`, (S) => {
      zeit(15); mensch(1); S.f.jonas_getragen = true;
      trau("mara", -1);
      notiz("Ihr kommt nur noch langsam voran.");
      return folge([
        `„Das ist ein Fehler“, sagt Mara. „Du weißt, was er in ein paar Stunden ist.“ Aber sie hilft dir, ihn hochzuziehen.`,
        `Jonas hängt zwischen Walter und dir, heiß wie ein Ofen, und murmelt an deinem Ohr.`,
        `~„Ich hab's nur für Mama gemacht.“`,
        `Ihr werdet langsamer sein. Viel langsamer.`
      ], "k5_start");
    })
  ]
};
