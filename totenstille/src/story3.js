/* TOTENSTILLE – Kapitel 5 (Umwege), Kapitel 6 (Uferstraße) */
"use strict";

function walterSchwach() {
  return !!(S.f.walter_schwach || S.f.walter_gebrochen || S.f.walter_gebissen || S.inf.walter);
}

/* ===================== KAPITEL 5: UMWEGE ===================== */
SZ.k5_start = {
  kap: 5, ort: "Baumviertel", klang: "murmeln", cp: true, dauer: 45,
  vor: (S) => {
    if (S.f.jonas_getragen) S.t += 10;
    if (S.t >= FRIST) return "e_zuspaet";
  },
  text: (S) => {
    const r = rest();
    const ansage = r >= 165
      ? `„Es ist ${uhr()} Uhr“, sagt Mara. „Für einen Umweg reicht es. Für zwei nicht.“`
      : r >= 140
        ? `„Es ist ${uhr()} Uhr“, sagt Mara. „Ein Umweg, und wir stehen mit der letzten Minute am Tor. Wenn nichts schiefgeht.“`
        : r >= 100
          ? `„Es ist ${uhr()} Uhr“, sagt Mara scharf. „Für einen Umweg reicht es nicht mehr. Wenn wir jetzt geradeaus gehen, schaffen wir es. Sonst nicht.“`
          : `„Es ist ${uhr()} Uhr“, sagt Mara. Ihre Stimme ist ganz flach. „Wir schaffen es nur noch, wenn wir ab jetzt rennen.“`;
    return P(
      `Hinter dem Ring beginnt das Viertel, in dem die Straßen nach Bäumen heißen. Ulmenweg. Kastanienallee. Bis zur Uferstraße sind es noch fünfundzwanzig Minuten, sagt Walter. Dann bleibt er unter einem Straßenschild stehen.`,
      S.f.jonas_getragen && `Jonas hängt zwischen euch, den Kopf auf der Brust. Er murmelt nicht mehr. Das ist kein gutes Zeichen.`,
      `„Da vorn links. Ahornweg 9, Erdgeschoss.“ Er dreht den Ehering an seinem Finger. „Hannelore sitzt in der Küche. Ich habe am vierten Tag die Tür zugemacht und bin gegangen. Ich habe nicht mal Auf Wiedersehen gesagt, weil ich dachte, wenn ich das sage, dann …“ Er bricht ab. „Zwanzig Minuten. Mehr will ich nicht.“`,
      S.inf.walter && `Er sagt es gleich noch einmal, im selben Ton, als hätte er sich selbst nicht gehört: „Zwanzig Minuten. Mehr will ich nicht.“ Mara hebt den Kopf.`,
      `Du hörst ihn kaum. Du liest das Schild über seinem Kopf. LINDENSTRASSE.`,
      `Nummer 14, dritter Stock. Hanna. Deine kleine Schwester ist nicht drüben auf der Ostseite, wie du es allen erzählt hast. Sie ist hinter einer Badezimmertür, die du von außen abgeschlossen hast, während dir das Blut vom Arm auf die Dielen getropft ist.`,
      `Es war keine Glasscherbe. Es ist nie eine gewesen.`,
      ansage
    );
  },
  wahl: (S) => [
    wahl(`Mit Walter in den Ahornweg gehen.`, (S) => {
      zeit(20);
      return folge([
        `„Zwanzig Minuten“, sagst du. Walter schließt kurz die Augen. „Danke.“`,
        `Die Lindenstraße bleibt hinter euch zurück. Du siehst nicht hin.`
      ], "k5_hanne");
    }),
    wahl(`In die Lindenstraße. Zu Hanna.`, (S) => {
      zeit(25); S.f.hanna_besucht = true;
      if (S.v.walter >= 2) {
        trau("walter", 1); S.f.walter_verzicht = true;
        return folge([
          `Du sagst es zum ersten Mal laut. „Meine Schwester ist da oben.“`,
          `Walter sieht dich lange an. Dann dreht er den Ring wieder nach innen. „Geh. Ich verstehe das besser als jeder andere.“ Er kommt mit. Den Ahornweg sieht er nicht mehr an.`
        ], "k5_hanna");
      }
      S.f.walter_allein = true;
      return folge([
        `Du sagst es zum ersten Mal laut. „Meine Schwester ist da oben.“`,
        `„Dann gehen wir beide dahin, wo wir hinmüssen“, sagt Walter. „Zwanzig Minuten. Ich bin an der Ecke Uferstraße, bevor ihr da seid.“ Er wartet keine Antwort ab.`
      ], "k5_hanna");
    }),
    wahl(`„Keine Umwege. Es tut mir leid, Walter.“`, (S) => {
      if (S.v.walter >= 2) {
        trau("walter", -1);
        return folge([
          `Walter steht lange unter dem Schild. Dann dreht er den Ring wieder nach innen. „Du hast recht“, sagt er heiser. „Die Lebenden zuerst. Hanne hätte dasselbe gesagt.“`,
          `Er geht voran und dreht sich nicht um. Du auch nicht. Die Lindenstraße bleibt hinter euch zurück wie etwas, das man im Zug vergessen hat.`
        ], "k6_ufer");
      }
      mensch(-1);
      const t = [
        `„Dann trennen sich hier unsere Wege“, sagt Walter. Kein Zorn, nur Müdigkeit. Er drückt Mara den Netzplan in die Hand. „Uferstraße, immer geradeaus. Wartet nicht auf mich.“`,
        `Er biegt in den Ahornweg ein, ein alter Mann mit einer Tablettendose in der Jackentasche, und die Dunkelheit schließt sich hinter ihm.`
      ];
      verlust("walter", "weg");
      return folge(t, "k6_ufer");
    }),
    wahl(`„Wir teilen uns auf. Treffpunkt in dreißig Minuten an der Uferstraße.“`, (S) => {
      zeit(25); S.f.hanna_besucht = true; S.f.walter_allein = true;
      S.f.walter_begleitet = mit("jonas") && !S.f.jonas_getragen;
      return folge([
        S.f.walter_begleitet
          ? `Jonas geht mit Walter. „Einer muss ja auf den Opa aufpassen“, sagt er, und Walter tut so, als hätte er es nicht gehört.`
          : `Walter geht allein. Du siehst ihm nach, bis ihn der Ahornweg verschluckt.`,
        `Du sagst es zum ersten Mal laut. „Meine Schwester ist da oben.“ Mara nickt nur. ${mit("lotte") ? "Lotte nimmt deine Hand." : "Sie fragt nichts."}`
      ], "k5_hanna");
    })
  ]
};

SZ.k5_hanne = {
  kap: 5, ort: "Ahornweg 9", klang: "stille",
  text: (S) => P(
    `Ahornweg 9. Walters Schlüssel passt noch. Im Flur hängen Mäntel, es riecht nach kaltem Kaffee und nach etwas anderem.`,
    `Sie sitzt am Küchentisch, mit dem Rücken zur Tür, im geblümten Morgenmantel. Vor ihr steht eine Tasse. Ihre Hand liegt am Henkel, als wäre sie nur kurz in Gedanken.`,
    `~„Der Kaffee ist gleich durch, Walter.“`,
    `Walter bleibt in der Tür stehen. Sein Mund arbeitet. „Einundvierzig Jahre“, flüstert er. „Einundvierzig Jahre lang hat sie das jeden Morgen gesagt.“`,
    `~„Der Kaffee ist gleich durch, Walter.“`,
    `Er macht einen Schritt in die Küche. Das Gemurmel bricht ab. Hannelores Kopf dreht sich, langsam, zu weit.`
  ),
  wahl: (S) => [
    wahl(`Ihm Zeit lassen. Du wachst an der Tür.`, (S) => {
      zeit(15); mensch(1); S.f.walter_frieden = true;
      trau("walter", 2);
      return folge([
        `Du bleibst im Flur stehen und drehst der Küche den Rücken zu. Manche Dinge gehören nur zwei Menschen.`,
        `Du hörst seine Stimme, leise, lange. Du hörst ihren Satz, dreimal, viermal, und einmal antwortet er darauf: „Ich weiß, Hanne. Ich weiß. Du machst den besten Kaffee von ganz Kaltenbrück.“`,
        `Dann wird es still.`,
        `Als Walter herauskommt, trägt er zwei Ringe an derselben Hand. Sein Gesicht ist nass und ganz ruhig. „Jetzt habe ich Auf Wiedersehen gesagt“, sagt er. „Jetzt kann ich gehen, wohin es auch geht.“`
      ], "k6_ufer");
    }),
    wahl(`Vorgehen und es für ihn tun.`, (S) => {
      zeit(8);
      const hoch = S.v.walter >= 3;
      if (!hoch) trau("walter", -1);
      return folge([
        `Du schiebst dich an ihm vorbei. ${S.eisen ? "Das Brecheisen liegt schwer in deiner Hand." : "Auf der Anrichte steht ein Messerblock."}`,
        `Hannelore steht schon. Sie ist schnell, schneller, als eine alte Frau sein dürfte. Aber vor dir bleibt sie stehen. Einen Atemzug lang sieht sie dich an, den Kopf schief, als hätte sie dich mit jemandem verwechselt.`,
        `Der Atemzug reicht dir.`,
        `Walter steht in der Tür und sieht auf das, was du getan hast. „Das war nicht deins“, sagt er tonlos. „Das war das Letzte, was ich für sie hätte tun können.“`,
        hoch && `Dann legt er dir die Hand auf die Schulter. „Aber ich hätte es nicht gekonnt. Das weiß ich auch.“`
      ], "k6_ufer");
    }),
    wahl(`Walter am Kragen packen und rausziehen. Sofort.`, (S) => {
      zeit(5); S.f.walter_gebrochen = true;
      trau("walter", -2);
      return folge([
        `Du reißt ihn zurück. Der Stuhl fällt um, Hannelore ist auf den Beinen, und sie ist schnell. Du wirfst die Küchentür zu und stemmst dich dagegen, bis Mara den Flurschrank davorgeschoben hat.`,
        `Von drinnen schlägt es gegen das Holz. Dazwischen, immer wieder, freundlich und geduldig:`,
        `~„Der Kaffee ist gleich durch, Walter.“`,
        `Walter steht im Flur zwischen den Mänteln. Er ist in einer Minute um zehn Jahre gealtert. „Ich wollte doch nur …“, sagt er. Dann sagt er nichts mehr. Den ganzen Weg bis zur Uferstraße nicht.`
      ], "k6_ufer", { klang: "murmeln" });
    }),
    wahl(`Selbst in die Küche gehen und dich zwischen die beiden stellen.`, (S) => {
      zeit(12); S.f.walter_frieden = true; S.f.gesehen = true; S.f.mara_ahnt = true;
      trau("walter", 1);
      return folge([
        `Du gehst an Walter vorbei. Du weißt selbst nicht, warum.`,
        `Hannelores Kopf dreht sich zu dir. Du siehst ihre Augen, milchig und weit. Du siehst, wie sich ihre Finger um den Tassenhenkel schließen. Du stehst so nah, dass du sie berühren könntest.`,
        `Sie tut nichts.`,
        `Sie sieht durch dich hindurch, als wärst du ein Möbelstück, das schon immer hier gestanden hat. Dann dreht sie sich zurück zu ihrer Tasse.`,
        `~„Der Kaffee ist gleich durch, Walter.“`,
        `„Warum …“ Walters Stimme kippt. „Warum hat sie dich nicht …“ Du weißt es nicht. Mara steht im Flur und hat alles gesehen, und in ihrem Gesicht arbeitet etwas.`,
        `Walter sagt Auf Wiedersehen von der Tür aus. Hannelore bleibt, wie sie ist. Er will es so.`
      ], "k6_ufer");
    })
  ]
};

SZ.k5_hanna = {
  kap: 5, ort: "Lindenstraße 14", klang: "stille",
  text: (S) => P(
    `Lindenstraße 14, dritter Stock. Ihr Schlüssel hängt noch an deinem Bund, zwischen Büroschlüssel und Fahrradschloss, als wäre nichts gewesen.`,
    `Die Wohnung riecht nach ihr. Auf dem Wohnzimmertisch stehen zwei Teller. Auf einem liegt ein Stück Pizza, grau vor Schimmel. Der andere ist deiner.`,
    `Im Flur die Badezimmertür. Der Schlüssel steckt von außen. Davor, auf den Dielen, ein dunkler Fleck. Dein Blut, neunzehn Tage alt.`,
    `~„Fang schon mal ohne mich an.“`,
    `Ihre Stimme. Genau ihre Stimme, nur ohne alles, was Hanna war.`,
    `~„Fang schon mal ohne mich an.“`,
    `Das hat sie aus dem Bad gerufen, als die Pizza kam. Zehn Minuten später hat sie dich gebissen. Mara steht hinter dir und sagt nichts. Die Narbe an deinem Arm pocht.`
  ),
  wahl: (S) => [
    wahl(`Die Tür öffnen und es beenden.`, (S) => {
      zeit(15); mensch(1); S.f.hanna_erloest = true; S.f.gesehen = true; S.f.mara_ahnt = true;
      return folge([
        `Du drehst den Schlüssel. Die Tür schwingt nach innen.`,
        `Sie steht vor dem Waschbecken, in dem Kleid, das sie an jenem Abend getragen hat. Ihr Satz bricht ab. Sie dreht sich zu dir um, und du machst dich bereit für das, was vor neunzehn Tagen passiert ist.`,
        `Es passiert nicht. Hanna sieht dich an. Sie kommt nicht näher. Sie steht nur da, die Arme hängend, und wartet, als wüsste sie, wozu du gekommen bist.`,
        `Das macht es schwerer, nicht leichter.`,
        `Danach legst du sie in die Badewanne und deckst sie mit ihrem Bademantel zu. Mara steht im Flur. „Sie hat dich nicht angegriffen“, sagt sie langsam. „Sie stand einen halben Meter vor dir.“ Du hast darauf keine Antwort.`
      ], "k6_ufer");
    }),
    wahl(`Die Tür öffnen und sie ansehen.`, (S) => {
      zeit(12); S.f.gesehen = true; S.f.mara_weiss = true; S.f.hanna_gesehen = true;
      const zitat = S.f.luege
        ? `„Glasscherbe“, sagt sie. „Du hast Glasscherbe gesagt.“`
        : S.f.wahrheit
          ? `„Du hast am Parkhaus die Wahrheit gesagt“, flüstert sie. „Ich wollte es nicht glauben.“`
          : `„Das ist ein Biss“, sagt sie. „Das war die ganze Zeit ein Biss.“`;
      trau("mara", S.f.luege ? -2 : S.f.wahrheit ? 1 : -1);
      return folge([
        `Du drehst den Schlüssel. Die Tür schwingt nach innen.`,
        `Sie kommt heraus. Barfuß, langsam. Ihr Satz ist abgebrochen. Sie bleibt so dicht vor dir stehen, dass du die Sommersprossen auf ihrer Nase zählen könntest, wie früher.`,
        `Ihre Hand hebt sich. Die Finger legen sich auf deinen linken Unterarm, genau auf die Narbe. Es ist beinahe zärtlich.`,
        `Dann sieht sie Mara. Ihr Kiefer klappt auf, und sie ist schnell. Du wirfst die Arme um sie und hältst sie fest, deine Schwester, die sich in deinem Griff windet und nach Mara schnappt und dich dabei kein einziges Mal beißt. Du schiebst sie zurück ins Bad. Du schließt ab.`,
        `„Zeig mir deinen Arm“, sagt Mara. Ihre Stimme ist ganz flach. Du zeigst ihn ihr. ${zitat}`
      ], "k6_ufer");
    }),
    wahl(`Dich vor die Tür setzen und Abschied nehmen.`, (S) => {
      zeit(10); mensch(1); S.f.hanna_abschied = true;
      return folge([
        `Du setzt dich auf die Dielen, den Rücken an der Tür. Hinter dem Holz bricht ihr Satz ab.`,
        `Du erzählst ihr alles. Das Stadtbad. Timo. Walter und sein Netzplan. ${mit("lotte") ? "Das Mädchen, das nicht spricht." : "Mara, die nachts nicht schläft."} Dass du allen gesagt hast, sie sei drüben. Dass du es manchmal selbst geglaubt hast.`,
        `Solange du sprichst, ist es still hinter der Tür. Ganz still. Als würde jemand zuhören.`,
        `„Ich fang schon mal an, Hanna“, sagst du am Ende. „Komm nach, wenn du kannst.“`,
        `Du bist schon an der Wohnungstür, als es wieder einsetzt.`,
        `~„Fang schon mal ohne mich an.“`
      ], "k6_ufer");
    }),
    wahl(`Den Schlüssel umdrehen, die Tür aufschließen und gehen.`, (S) => {
      zeit(5); S.f.hanna_frei = true;
      trau("mara", -1);
      return folge([
        `Du drehst den Schlüssel im Schloss. Einmal, bis es klickt. Dann lässt du die Klinke los, ohne sie herunterzudrücken.`,
        `„Was tust du?“, fragt Mara. Du nimmst deinen Rucksack und gehst zur Wohnungstür.`,
        `Ihr seid auf der Treppe, zwischen dem zweiten und dem ersten Stock, als oben eine Klinke geht. Langsam. Dann Schritte auf Dielen. Barfuß.`,
        `„Was hast du getan?“, flüstert Mara. Du weißt es selbst nicht genau. Du weißt nur, dass du sie nicht ein zweites Mal einsperren konntest.`
      ], "k6_ufer");
    })
  ]
};

/* ===================== KAPITEL 6: DAS UFER ===================== */
SZ.k6_ufer = {
  kap: 6, ort: "Uferstraße", klang: "murmeln", cp: true, dauer: 50,
  vor: (S) => {
    if (S.f.jonas_getragen && mit("jonas")) S.t += 10;
    if (S.t >= FRIST) return "e_zuspaet";
    if (S.f.walter_allein && mit("walter")) {
      if (S.f.walter_begleitet || !S.f.walter_schwach) {
        S.f.walter_frieden = true; S.f.walter_zurueck = true;
      } else {
        S.da.walter = false; S.tot.walter = "weg"; S.f.walter_kam_nicht = true; S.t += 10;
      }
      S.f.walter_allein = false;
    }
    if (S.f.roth_feind >= 2) { S.hp = Math.max(1, S.hp - 1); S.horde++; S.f.k6_schuss = true; }
    if (S.f.jonas_getragen && mit("jonas")) {
      S.da.jonas = false; S.tot.jonas = "gewandelt";
      if (mit("walter")) { S.f.walter_gebissen = true; S.f.k6_biss = "walter"; }
      else { S.f.k6_biss = "du"; S.hp = Math.max(1, S.hp - 1); }
    }
  },
  text: (S) => P(
    `Die Uferstraße. Vier Spuren, eine Kaimauer, dahinter der Fluss, schwarz und breit. Sechshundert Meter flussaufwärts die Brücke: zwei rote Lampen und ein weißer Scheinwerfer, der über das Wasser tastet.`,
    `Zwischen euch und ihr steht die Stadt.`,
    `Sie füllen die Straße von den Hauswänden bis zur Kaimauer. Tausende. Das Licht hat sie hergezogen, Nacht für Nacht, aus allen Vierteln. Ihr Gemurmel ist so dicht, dass du es im Brustkorb spürst.`,
    `~„Ich ruf dich zurück.“`,
    `~„Alles gut, alles gut, alles gut.“`,
    `~„Mama, wann sind wir da?“`,
    S.f.walter_zurueck && `Walter wartet an der Ecke, wie versprochen. Seine Augen sind rot, und er trägt zwei Ringe an derselben Hand. Er spricht nicht darüber. Er muss es nicht.`,
    S.f.walter_kam_nicht && `An der Ecke wartet niemand. Ihr gebt Walter fünf Minuten. Dann noch einmal fünf. Mara faltet den Netzplan zusammen, den er ihr gelassen hat, und steckt ihn ein, ohne dich anzusehen.`,
    S.f.k6_schuss && `Der Schuss kommt aus dem Nichts. Er reißt dir den Rucksackriemen durch und einen Streifen Haut von der Schulter. Auf einem Dach hinter euch duckt sich ein Schatten weg. Roth hat gesagt, die Stadt sei nicht groß genug. Schlimmer als die Wunde ist der Knall: Die halbe Straße hat ihn gehört.`,
    S.f.k6_biss === "walter" && `Dann hört Jonas auf, schwer zu sein. Er steht plötzlich selbst. „Ich hab's nur für Mama gemacht“, sagt er mit einer Stimme, in der kein Jonas mehr ist, und beißt in das Nächste, was er erreicht. Es ist Walters Unterarm. Mara stößt den Jungen über die Kaimauer. Das Wasser schlägt über ihm zusammen. Walter hält sich den Arm und sagt sehr ruhig: „Das war's dann wohl für mich.“`,
    S.f.k6_biss === "du" && `Dann hört Jonas auf, schwer zu sein. Er steht plötzlich selbst. „Ich hab's nur für Mama gemacht“, sagt er mit einer Stimme, in der kein Jonas mehr ist, und geht auf Mara los. Du wirfst dich dazwischen. Ihr schlagt zusammen gegen die Kaimauer, sein Kiefer schnappt neben deinem Ohr, und dann stößt du ihn hinüber. Das Wasser schlägt über ihm zusammen. Du blutest aus der Stirn. Du hast ihn bis hierher getragen.`,
    (S.inf.lotte && mit("lotte")) && `Lotte ist auf den letzten hundert Metern zweimal gestolpert. Als du sie hochhebst, glüht sie durch die Jacke. Du legst ihr fragend die Hand auf die Stirn. Sie schüttelt den Kopf: nichts, nur müde.`,
    (S.inf.walter && mit("walter") && !S.f.walter_gebissen) && `Walter wischt sich zum dritten Mal den Schweiß von der Stirn. Es sind vier Grad. „Mir ist nur warm vom Laufen“, sagt er. Und gleich darauf, im selben Ton: „Mir ist nur warm vom Laufen.“ Mara sieht ihn an und wird sehr still.`,
    S.horde >= 2
      ? `Mara dreht sich um. Hinter euch, in den Straßen, aus denen ihr gekommen seid, bewegt sich die Dunkelheit. „Die laufen uns nach“, flüstert sie. „Seit dem Stadtbad. Warum laufen die uns nach?“`
      : `Mara dreht sich um. Hinter euch, in den Straßen, aus denen ihr gekommen seid, ist es still. Zu still, findet sie.`,
    S.f.roth_deal && `Am Ruderclub, hundert Meter links, schaukeln zwei Boote an einem Steg. Ein Licht blinkt dreimal. Roth hält Wort.`,
    S.funk && `Das Funkgerät knackt. „Ich sehe euch“, sagt die Frauenstimme. „Ecke Lindenallee. Ich habe eine Leuchtkugel. Eine. Sagt mir, wann.“`,
    `Es ist ${uhr()} Uhr.`
  ),
  wahl: (S) => {
    const dritte = S.funk
      ? `„Jetzt.“ Die Leuchtkugel anfordern.`
      : ist("tech")
        ? `Einen Lieferwagen kurzschließen und mit Dauerhupe wegrollen lassen.`
        : S.ammo > 0
          ? `Auf die Schaufenster am Südende schießen: Alarmanlagen als Köder.`
          : `Steine auf die geparkten Autos am Südende werfen.`;
    return [
      wahl(`Mitten hindurch. Langsam, leise, du gehst voran.`, (S) => {
        zeit(20); S.f.gesehen = true; S.f.mara_ahnt = true;
        const blut = mit("jonas") && S.f.hand_schlecht;
        const stoer = blut || S.horde >= 3 || S.f.k6_schuss;
        const t = [
          `Du machst den ersten Schritt auf die Fahrbahn. Dann den zweiten.`,
          `Vor dir hört einer auf zu murmeln. Dann die neben ihm. Die Stille breitet sich um dich aus wie ein Ölfleck auf Wasser, und in dieser Stille treten sie zur Seite. Nicht weit. Einen Schritt. Gerade genug.`,
          `„Bleibt dicht hinter mir“, flüsterst du. Die anderen gehen in deinem Schatten, jeder eine Hand auf der Schulter des Vordermanns. Rechts und links von euch stehen die Gesichter wie eine Allee.`
        ];
        if (stoer) {
          t.push(blut
            ? `Vierhundert Meter geht es gut. Dann fällt ein Tropfen aus Jonas' Ärmel auf den Asphalt. Ein Kopf ruckt herum. Die Stille bekommt einen Riss, und durch den Riss greifen Hände.`
            : `Vierhundert Meter geht es gut. Dann erreicht euch von hinten die Meute, die euch seit Stunden folgt, und drängt in die Gasse hinein. Die Stille bekommt einen Riss, und durch den Riss greifen Hände.`);
          t.push(`Ihr rennt die letzten Meter. Etwas reißt dir den halben Ärmel vom Arm und die Haut darunter gleich mit.`);
          leben(-1);
        } else {
          t.push(`Sechshundert Meter. Kein Laut. Als ihr den Fuß der Brückenrampe erreicht, schließt sich die Gasse hinter euch, und das Gemurmel kommt zurück, als hätte jemand einen Schalter umgelegt.`);
        }
        t.push(`Mara lehnt an einer Betonsperre und sieht dich an, als sähe sie dich zum ersten Mal. „Die sind dir ausgewichen“, sagt sie. „Nicht uns. Dir.“`);
        return folge(t, "k6_rampe", { klang: "stille" });
      }),
      wahl(S.f.roth_deal ? `Dreimal Licht: zu Roths Booten.` : `Die Leiter hinunter und im Wasser an der Kaimauer entlang.`, (S) => {
        if (S.f.roth_deal) {
          zeit(15);
          return folge([
            `Zwei Männer rudern euch dicht an der Kaimauer entlang, die Riemen mit Lappen umwickelt. Über euch, auf der Straße, murmelt die Stadt. Keiner sieht nach unten.`,
            `An der Treppe unter der Brückenrampe legen sie an. Der Ältere tippt sich an die Mütze. „Vom Chef: Die Kleine isst schon wieder.“ Dann sind sie fort.`
          ], "k6_rampe");
        }
        zeit(25); leben(-1); trau("mara", 1);
        return folge([
          `Der Fluss ist im November so kalt, dass dir das Herz stolpert. Ihr hangelt euch an den Eisenringen der Kaimauer entlang, das Wasser bis zur Brust${mit("lotte") ? ", Lotte auf deinen Schultern" : ""}. Einen Meter über euren Köpfen stehen ihre Füße.`,
          `Auf halber Strecke reißt die Strömung Mara von der Mauer. Du erwischst sie am Rucksack. Für einen Moment hängt ihr beide nur an deiner linken Hand.`,
          `Als ihr unter der Rampe aus dem Wasser kriecht, kannst du deine Finger nicht mehr bewegen. Mara schlägt dir zweimal auf den Rücken, statt etwas zu sagen.`
        ], "k6_rampe");
      }),
      wahl(dritte, (S) => {
        const lauf = `Tausende Köpfe drehen sich nach Süden. Dann setzt sich die Straße in Bewegung, weg von euch, dem Lärm nach. Ihr lauft an den Hauswänden entlang, hinter ihrem Rücken, und keiner dreht sich um.`;
        if (S.funk) {
          zeit(15);
          return folge([
            `Ein Zischen, weit weg. Dann steht ein roter Stern über dem Südhafen und sinkt langsam, an einem Fallschirm, auf die Lagerhallen zu.`,
            `^Das Gemurmel hört auf.`,
            `Tausende Köpfe drehen sich nach Süden. Dann setzt sich die Straße in Bewegung, weg von euch, dem Licht nach. Ihr lauft an den Hauswänden entlang, hinter ihrem Rücken, und keiner dreht sich um.`
          ], "k6_rampe", { klang: "stille" });
        }
        if (ist("tech")) {
          zeit(15);
          return folge([
            `Am Straßenrand steht ein Lieferwagen, die Fahrertür offen. Du brauchst vierzig Sekunden unter dem Lenkrad. Dann klemmst du den Hupenkontakt fest, löst die Handbremse und lässt den Wagen die abschüssige Hafenstraße hinunterrollen, weg von der Brücke, mit Dauerton.`,
            `^Das Gemurmel hört auf.`,
            lauf
          ], "k6_rampe", { klang: "stille" });
        }
        if (S.ammo > 0) {
          const braucht = ist("kampf") ? 1 : 2;
          if (S.ammo >= braucht) {
            S.ammo -= braucht; zeit(15);
            notiz(braucht === 1 ? "Eine Patrone verbraucht." : "Zwei Patronen verbraucht.");
            return folge([
              ist("kampf")
                ? `Du zielst über ihre Köpfe hinweg auf die Glasfront des Autohauses am Südende. Ein Schuss. Die Scheibe zerspringt, und drei Alarmanlagen heulen gleichzeitig los.`
                : `Du zielst über ihre Köpfe hinweg auf die Glasfront des Autohauses am Südende. Der erste Schuss geht in die Fassade. Der zweite trifft. Die Scheibe zerspringt, und drei Alarmanlagen heulen gleichzeitig los.`,
              `^Das Gemurmel hört auf.`,
              lauf
            ], "k6_rampe", { klang: "stille" });
          }
          S.ammo = 0; zeit(20); leben(-1);
          notiz("Letzte Patrone verbraucht.");
          return folge([
            `Du hast noch eine Patrone. Sie geht in die Fassade, einen Meter neben der Glasfront. Der Knall allein zieht den Rand der Menge ab. Nicht die Mitte.`,
            `Ihr lauft trotzdem. Auf den letzten hundert Metern müsst ihr euch durchschlagen, und du bekommst mehr ab als die anderen, weil du vorn läufst.`
          ], "k6_rampe");
        }
        zeit(20); leben(-1);
        return folge([
          `Ihr sammelt Steine und werft sie, so weit ihr könnt, auf die geparkten Autos am Südende. Eine einzige Alarmanlage springt an, dünn und heiser. Sie zieht den Rand der Menge ab. Nicht die Mitte.`,
          `Ihr lauft trotzdem. Auf den letzten hundert Metern müsst ihr euch durchschlagen, und du bekommst mehr ab als die anderen, weil du vorn läufst.`
        ], "k6_rampe");
      }, { beruf: !S.funk && ist("tech") }),
      wahl(`Rennen. Alle, so schnell es geht, an den Hauswänden entlang.`, (S) => {
        zeit(8);
        const t = [
          `Ihr rennt. An den Hauswänden entlang, über Motorhauben, durch Vorgärten.`,
          `^Das Gemurmel hört auf.`,
          `Sechshundert Meter sind sehr lang, wenn sich eine ganze Straße nach dir umdreht.`
        ];
        if (mit("lotte")) t.push(`Lotte trägst du. Sie wiegt nichts. Sie hat die Arme so fest um deinen Hals geschlungen, dass du kaum Luft bekommst.`);
        if (mit("walter") && walterSchwach()) {
          t.push(`Walter schafft die Hälfte. Dann bleibt er stehen, mitten auf dem Gehweg, eine Hand auf der Brust, und schüttelt den Kopf. Du willst umkehren. Mara reißt dich am Arm weiter. Als du dich noch einmal umdrehst, siehst du nur noch die Stelle, an der er gestanden hat.`);
          verlust("walter", "tot");
        }
        if (ist("kampf")) {
          t.push(`Du schlägst eine Schneise, wo keine ist. Deine Fäuste sind danach offen bis auf die Knochen, aber du stehst.`);
          if (S.horde >= 2) leben(-1);
        } else {
          t.push(`Hände an deinem Rucksack, an deinem Kragen, in deinen Haaren. Du reißt dich los, einmal, zweimal, und jedes Mal bleibt etwas von dir zurück.`);
          leben(S.horde >= 2 ? -2 : -1);
        }
        return folge(t, "k6_rampe", { klang: "stille" });
      }, { beruf: ist("kampf") })
    ];
  }
};

function rampeNach(t) {
  if (mit("walter") && S.f.walter_gebissen) {
    t.push(`Walter geht nicht mit durchs Tor. Er zeigt dem Scheinwerfer seinen Arm, von sich aus, und setzt sich draußen an die Kaimauer, zwei Ringe in der Faust. „Geht“, sagt er. „Ich warte hier auf den Morgen.“`);
    verlust("walter", "biss");
  }
  return t;
}

SZ.k6_rampe = {
  kap: 6, ort: "Brückenrampe", klang: "murmeln",
  vor: (S) => { if (S.t >= FRIST) return "e_zuspaet"; },
  text: (S) => {
    const V = mit("walter") ? "walter" : mit("jonas") ? "jonas" : "mara";
    let frei;
    if (V === "walter") {
      frei = S.f.walter_gebissen
        ? `Walter schiebt den Ärmel hoch. Die Bisswunde ist frisch und sauber. „Ich komme sowieso nicht mehr über den Fluss“, sagt er. „Lasst mich wenigstens noch einmal ein Signal geben.“`
        : S.inf.walter
          ? `„Ich mache das“, sagt Walter und wischt sich den Schweiß aus den Augen. „Mir ist so heiß. Ich schaffe den Weg über die Brücke sowieso nicht mehr.“`
          : S.f.walter_gebrochen
            ? `„Ich mache das“, sagt Walter. Es sind seine ersten Worte seit dem Ahornweg. Er sieht dabei niemanden an.`
            : S.f.walter_frieden
              ? `„Ich mache das“, sagt Walter, und er lächelt dabei. „Ich habe Auf Wiedersehen gesagt. Ich habe hier nichts mehr zu erledigen.“`
              : `„Ich mache das“, sagt Walter. „Ich bin achtundsechzig. Ihr habt alle noch mehr Strecke vor euch als ich.“`;
    } else if (V === "jonas") {
      frei = `„Ich mache das“, sagt Jonas. „Ich bin schneller als ihr alle zusammen. Ich halte den Hebel, bis ihr drin seid, dann springe ich aus dem Fenster und renne.“ Er versucht zu grinsen.`;
    } else {
      frei = `Mara zieht die Riemen ihres Rucksacks fest. „Ich habe schon mal jemandem versprochen, dass ich wiederkomme“, sagt sie. „Diesmal verspreche ich nichts. Diesmal mache ich es einfach.“`;
    }
    return P(
      `Die Brückenrampe: Betonsperren, Stacheldrahtrollen, ein Rolltor aus Bauzaun und Stahlplatten. Dahinter der Scheinwerfer, der euch jetzt voll erfasst.`,
      `Ein Lautsprecher knackt. Eine Frauenstimme${S.funk ? ", dieselbe wie im Funkgerät" : ""}: „Ich mache das Tor nicht auf, solange die an eurem Rücken hängen. Schafft sie von der Rampe weg, dann lasse ich euch rein. Ihr habt zehn Minuten.“`,
      `Du drehst dich um. Sie kommen. Nicht schnell; Echos rennen nicht, solange niemand vor ihnen wegläuft. Aber sie kommen von drei Seiten, und die Rampe ist eine Sackgasse.`,
      `Fünfzig Meter zurück steht ein Backsteinturm am Kai: das Stellwerk Hafen. Auf seinem Dach sitzt eine Rangiersirene, groß wie eine Regentonne.`,
      mit("walter")
        ? `„Batteriebetrieb“, sagt Walter. „Die läuft noch, ich habe sie selbst gewartet. Die hört man bis ans andere Ufer. Aber der Hebel hat keine Raste. Einer muss ihn halten.“`
        : `Mara leuchtet auf das Schild an der Tür: RANGIERSIRENE – HANDBETRIEB – HEBEL GEDRÜCKT HALTEN.`,
      `Wer den Hebel hält, lockt sie alle zum Stellwerk. Und kommt von dort nicht mehr zur Rampe.`,
      frei
    );
  },
  wahl: (S) => {
    const V = mit("walter") ? "walter" : mit("jonas") ? "jonas" : "mara";
    const klemm = S.eisen
      ? `Den Hebel mit dem Brecheisen verkeilen. Niemand bleibt.`
      : ist("tech")
        ? `Den Hebel mit Kabel und Gürtel festzurren. Niemand bleibt.`
        : S.verband > 0
          ? `Den Hebel mit allem Verbandszeug festbinden. Niemand bleibt.`
          : `Den Hebel mit deinem Gürtel festbinden. Niemand bleibt.`;
    const sirene = `Die Sirene heult los, ein Ton wie aus einer anderen Zeit, und die ganze Straße dreht sich nach ihm um. Ihr rennt. Das Tor rollt einen Meter hoch, ihr kriecht darunter durch.`;
    return [
      wahl(`${NAMEN[V]} gehen lassen.`, (S) => {
        zeit(10);
        const t = [];
        if (V === "walter") {
          if (S.f.roth_deal && !S.f.walter_gebissen && !S.inf.walter) {
            t.push(
              `Walter steigt die Eisentreppe hinauf. Bevor er die Tür hinter sich zuzieht, dreht er sich noch einmal um und tippt sich an die Mütze.`,
              sirene,
              `Die Sirene läuft vier Minuten. Du zählst mit. Dann bricht sie ab.`,
              `Und vom Wasser her: dreimal Licht. Zwei Ruderblätter. Eine gebeugte Gestalt, die aus dem Stellwerksfenster auf die Kaimauer klettert und sich in ein Boot fallen lässt.`,
              `Fünf Minuten später steht Walter tropfnass an der Brückentreppe. „Der Chef zahlt seine Schulden“, sagt einer der Ruderer unten im Dunkeln. Mara schlägt Walter vor Erleichterung mit der flachen Hand gegen die Brust.`
            );
            S.f.walter_gerettet = true;
          } else {
            t.push(
              S.f.walter_frieden
                ? `Walter steigt die Eisentreppe hinauf. Bevor er die Tür hinter sich zuzieht, dreht er sich noch einmal um. „Ich gehe Kaffee trinken“, sagt er.`
                : `Walter steigt die Eisentreppe hinauf. Bevor er die Tür hinter sich zuzieht, dreht er sich noch einmal um und hebt die Hand, wie ein Fahrer am Ende der Schicht.`,
              sirene,
              `Die Sirene läuft vier Minuten. Du zählst mit. Dann bricht sie ab, und es ist nur noch das Gemurmel da.`
            );
            verlust("walter", "opfer");
          }
        } else if (V === "jonas") {
          if (!S.f.hand_schlecht && S.v.jonas >= 2) {
            t.push(
              sirene,
              `Das Tor ist schon fast wieder unten, als eine Gestalt über die Rampe gerannt kommt, schneller als alles, was du je hast rennen sehen. Jonas wirft sich flach auf den Beton und rutscht unter dem Tor durch. Es schlägt eine Handbreit hinter seinen Schuhen auf.`,
              `Er liegt auf dem Rücken und lacht und weint gleichzeitig. „Hab ich doch gesagt“, keucht er.`
            );
            trau("jonas", 1);
          } else {
            t.push(
              sirene,
              `Du drehst dich um und wartest auf die rennende Gestalt.`,
              S.f.hand_schlecht
                ? `Am Stellwerksfenster erscheint ein Schatten. Er versucht, sich am Rahmen hinauszuziehen. Mit einer Hand geht das nicht.`
                : `Er rennt. Er ist schnell. Aber er zögert am Fenster einen Atemzug zu lange, so wie jemand zögert, der nicht sicher ist, ob am anderen Ende einer auf ihn wartet. Auf halber Strecke stellt sich ihm die Straße in den Weg.`,
              `Das Tor schlägt auf den Beton. Die Sirene ist verstummt.`
            );
            verlust("jonas", "opfer");
          }
        } else {
          t.push(
            `Sie drückt dir ihren Rucksack in die Arme. „Da ist alles drin. ${S.akte ? "Auch das Diktiergerät. Spiel es denen vor." : "Verschwende nichts davon."}“ Dann läuft sie, ohne sich umzudrehen.`,
            mit("lotte")
              ? `Die Sirene heult los, ein Ton wie aus einer anderen Zeit, und die ganze Straße dreht sich nach ihm um. Du nimmst Lotte auf den Arm und rennst. Das Tor rollt einen Meter hoch, ihr kriecht darunter durch.`
              : `Die Sirene heult los, ein Ton wie aus einer anderen Zeit, und die ganze Straße dreht sich nach ihm um. Du rennst. Das Tor rollt einen Meter hoch, du kriechst darunter durch.`,
            `Die Sirene heult vier Minuten. Du zählst mit. Als sie abbricht, bist du auf der richtigen Seite des Tors, und es fühlt sich an wie die falsche.`
          );
          verlust("mara", "opfer");
        }
        return folge(rampeNach(t), "k7_bruecke");
      }),
      wahl(`„Nein. Ich gehe.“ Du hältst den Hebel selbst.`, (S) => {
        zeit(12); mensch(1);
        S.f.gesehen = true; S.f.kessler_sah = true; S.f.mara_ahnt = true;
        const t = [
          `Du bist die Treppe schon halb oben, bevor jemand widersprechen kann.`,
          `Der Hebel ist kalt und schwer. Die Sirene schreit über die Stadt, und unten dreht sich die Straße zu dir um. Du siehst die anderen rennen, siehst das Tor hochrollen, siehst sie darunter verschwinden. Gut.`,
          `Dann hörst du sie auf der Treppe.`,
          `Sie füllen den Raum. Zwanzig, dreißig. Du lässt den Hebel los, und in der plötzlichen Stille stehen sie um dich herum, so nah, dass du ihren Atem riechen müsstest, wenn sie atmen würden.`,
          `Keiner fasst dich an.`,
          `Du gehst zur Treppe. Sie machen Platz. Du gehst über die Straße, durch Tausende, und sie machen Platz. Du verstehst es nicht, und du bleibst nicht stehen, um es zu verstehen.`,
          `Am Tor wartet der Scheinwerfer auf dich. Er hat alles gesehen.`
        ];
        return folge(rampeNach(t), "k7_bruecke", { klang: "stille" });
      }),
      wahl(klemm, (S) => {
        zeit(8);
        const alle = `Ihr rennt alle zusammen. Das Tor rollt einen Meter hoch, ihr kriecht darunter durch. Hinter euch heult das Stellwerk, minutenlang, und keiner musste bleiben.`;
        const t = [];
        if (S.eisen) {
          S.eisen = false; notiz("Brecheisen zurückgelassen.");
          t.push(`Du rammst das Brecheisen zwischen Hebel und Gehäuse und schlägst es mit dem Handballen fest. Der Hebel bleibt unten. Die Sirene schreit.`, alle);
        } else if (ist("tech")) {
          t.push(`Ein Stück Kabel aus dem Schaltschrank, dein Gürtel, zwei Windungen um Hebel und Heizungsrohr, ein Knebel aus einem Schraubenschlüssel. Saubere Arbeit. Hält zehn Minuten, mindestens.`, alle);
        } else if (S.verband > 0) {
          S.verband = 0; notiz("Verbandszeug verbraucht.");
          t.push(`Du wickelst alles, was der Verbandskasten noch hergibt, um Hebel und Rohr. Mullbinden sind dafür nicht gemacht. Aber sie halten. Gerade lange genug.`, alle);
        } else {
          leben(-1); S.f.horde_am_tor = true;
          t.push(
            `Dein Gürtel ist alles, was du hast. Du ziehst ihn fest und rennst.`,
            `Ihr seid dreißig Meter vor dem Tor, als die Sirene abbricht. Der Gürtel hat nachgegeben. Hinter euch dreht sich die Straße wieder um.`,
            `Ihr schafft es. Knapp. Einer erwischt dich an der Wade, bevor das Tor unten ist, und die Ersten schlagen schon gegen den Zaun.`
          );
        }
        return folge(rampeNach(t), "k7_bruecke");
      }, { beruf: !S.eisen && ist("tech") }),
      wahl(`„Niemand bleibt.“ Über den Stacheldraht, sofort.`, (S) => {
        zeit(10); leben(-1); S.f.draht = true; S.f.horde_am_tor = true;
        S.inf.mara = true;
        const t = [
          `Ihr werft eure Jacken über die Drahtrollen und klettert. Der Lautsprecher brüllt etwas, ein Warnschuss pfeift über eure Köpfe.`,
          `Du bist drüben. ${anzahl() > 2 ? "Die anderen auch. Nur Mara hängt fest." : "Mara hängt fest."} Der Draht hat ihren Oberschenkel, und hinter ihr greift schon eine Hand nach ihrem Stiefel.`,
          `Du reißt sie los. Der Draht geht mit, durch deine Handflächen und tief durch ihr Bein. Sie fällt neben dir auf den Beton, und das Blut kommt in Stößen.`,
          `Du drückst beide Hände in die Wunde, deine zerschnittenen Hände, so fest du kannst. „Nicht loslassen“, keucht Mara. „Egal was ist. Nicht loslassen.“ Du lässt nicht los. Vier Minuten lang, bis sie sich den Gürtel selbst ums Bein gezogen hat.`,
          `Hinter dem Draht steht die Straße und sieht euch zu.`
        ];
        return folge(rampeNach(t), "k7_bruecke");
      })
    ];
  }
};
