// Die drei Enden. Seiten werden abhängig von Entscheidungen und Fundstücken zusammengesetzt.
const P = (t) => `<p>${t}</p>`;

export const ENDINGS = {
  hope: {
    id: 'hope', title: 'Hoffnung',
    summary: 'Sami, Mine und İlyas entkommen gemeinsam. Die Wahrheit über PROJECT EVE kommt zumindest teilweise ans Licht.',
    hint: 'Rette alle – auch den, der es am wenigsten verdient. (Serum S-17, Kapitel 2 & 4)',
    pages: (f) => [
      P('Das Tor schließt sich hinter euch. Auf der Brücke: Scheinwerfer, Männer in weißen Anzügen, das NEXARA-Logo auf den Türen.') + P('Einer ruft Mines Namen. Sie bleibt nicht stehen. Sie dreht nicht einmal den Kopf.'),
      P('Am anderen Ufer warten Soldaten, Ärzte, Decken. Fragen.') + P('İlyas drückt einem Offizier eine Festplatte in die Hand. Auf dem Etikett steht in Kinderschrift: <i>DEFNE</i>. „Das ist der Grund“, sagt er. „Für alles.“'),
      f.sample === 'mine'
        ? P('Im Sanitätszelt öffnet Mine die Kryo-Box. „Probe 017“, sagt sie zu der Ärztin vom Bundesinstitut. „Daraus wird ein Gegenmittel. Kein Produkt.“')
        : P('Sami stellt die Kryo-Box auf den Tisch des Einsatzleiters. Mine sieht ihn lange an. Dann nickt sie. „Du hättest sie mir geben können“, sagt sie leise. „Ich weiß“, sagt er. „Jetzt weiß ich es.“'),
      P('Drei Wochen später steht es in jeder Zeitung: <b>PROJECT EVE</b>. Die Hälfte der Wahrheit kommt ans Licht. Die andere Hälfte verschwindet in Anwaltsschreiben. NEXARA spricht von „bedauerlichen Einzelfällen“.'),
      f.ilyas_judged === 'forgive'
        ? P('İlyas stellt sich der Staatsanwaltschaft. Am ersten Besuchstag sitzt Defne ihm gegenüber und malt ein Bild: drei Strichmännchen auf einer Brücke.')
        : P('İlyas sagt aus. Stunde um Stunde. Als man ihn fragt, warum, sagt er nur: „Weil mir einer gesagt hat, dass jemand dafür geradestehen muss.“'),
      P('Sami erinnert sich nicht an den Leuchtturm. Aber Mine erzählt ihm davon. Jeden Abend ein Stück mehr.') + P('<i>Auf seinem Telefon wartet eine ungelesene Nachricht. Absender: …017.</i>'),
    ],
  },
  tragedy: {
    id: 'tragedy', title: 'Tragödie',
    summary: 'Nicht alle schaffen es hinaus. Jemand bleibt am Tor zurück – und der Preis ist hoch.',
    hint: 'Manchmal muss jemand zurückbleiben. (Totmannschalter am Kontrollpunkt Nord)',
    pages: (f) => f.ending === 'tragedy_b' ? [
      P('„Geht.“ Sami legt die Hand auf den Schalter. Mine schreit seinen Namen. İlyas zieht sie durch das Tor.'),
      P('Hinter ihm: Schritte. Schlurfend. Viele. Er schaut nicht hin. Er schaut auf Mine, bis das Tor sich schließt.'),
      f.sample === 'mine'
        ? P('Mine trägt die Kryo-Box über die Brücke, an den weißen Anzügen vorbei. Sie gibt sie nicht NEXARA. Sie gibt sie einer Ärztin vom Bundesinstitut und sagt: „Er hat sich entschieden. Für alle.“')
        : P('Die Kryo-Box mit der Aufschrift 017 bleibt am Kontrollpunkt zurück. Stunden später holen Männer in weißen Anzügen sie ab. Was daraus wird, erfährt niemand.'),
      P('Um 06:00 Uhr beginnt Protokoll ASCHE.'),
      P('Mine erzählt später, sie habe in dieser Nacht noch eine Nachricht bekommen. Absender: …017. Nur zwei Worte.') + P('<i>„Nach vorne.“</i>'),
    ] : [
      P('İlyas legt die Hand auf den Schalter. „Geht“, sagt er. „Ich bin sowieso schon unterwegs.“ Seine Augen sind gerötet. Er lächelt trotzdem.'),
      P('Hinter euch schließt sich das Tor – langsam, mit einem Geräusch wie ein letzter Atemzug. Durch die Gitter seht ihr, wie sie ihn erreichen. Er lässt den Schalter nicht los.'),
      P('Auf der Brücke stehen die NEXARA-Wagen. Mine nimmt Samis Hand und geht an ihnen vorbei.') + P('Die Festplatte mit der Aufschrift <i>DEFNE</i> findet man Tage später – in der Innentasche einer Jacke, am Kontrollpunkt Nord.'),
      P('Die Daten erreichen die Presse. Zu spät für viele. Rechtzeitig für ein Mädchen in der Kinderklinik Süd, deren Therapie aus „Probe 017“ entwickelt wird.'),
      f.serum_kept
        ? P('Die Ampulle S-17 liegt noch immer in Samis Jackentasche. Er hat sie nie benutzt. Manchmal nimmt er sie heraus und hält sie gegen das Licht.')
        : P('Ein Serum hätte gereicht. Eine Dosis. Sami denkt an den Kühlraum B, an einen Gang, den er nicht genommen hat.'),
    ],
  },
  secret: {
    id: 'secret', title: 'Geheimnis',
    summary: 'Die Stimme am Telefon war Sami selbst – drei Tage zuvor aufgenommen. Über einen Weg, den NEXARA nicht kannte, entkommen alle drei.',
    hint: 'Finde alle fünf Aufnahmen und nimm am Ende den letzten Anruf an.',
    pages: (f) => [
      P('Die Stimme am Telefon verliert ihre Verzerrung. Sie wird klarer, wärmer. Vertraut.') + P('„Hallo, Sami.“ Es ist deine Stimme.'),
      P('„Ich habe dir einen Weg gebaut. Kameras, Türen, Nachrichten – jede Warnung, jeder Satz ist drei Tage alt. Ich wusste, dass ich mich vergessen würde. Also habe ich mir selbst die Hand gereicht.“'),
      P('„Ich habe İlyas bezahlt, damit er ARGUS abschaltet. Ich wollte die Daten und mich retten. Dass Sektion C aufgeht, wusste ich nicht. Aber es ist meine Schuld. Unsere.“'),
      (f.ilyas_saved
        ? P('„Das Serum war aus deinem Blut. Du bist das Gegenmittel – nicht die Ampulle. Lass nicht zu, dass sie dich besitzen.“')
        : P('„Dein Blut ist das Gegenmittel. Mine weiß, was zu tun ist.“') + P('Im Kanal legt Mine eine Kanüle in deinen Arm und die andere in İlyas’. Eine Stunde später sinkt sein Fieber.')),
      P('Der alte Entwässerungskanal führt unter dem Kontrollpunkt hindurch zum Fluss. Ihr watet durch kniehohes Wasser, während über euch die NEXARA-Scheinwerfer ins Leere leuchten.') + P('Sie warten auf eine Wertanlage, die nie kommt.'),
      P('Bei Sonnenaufgang verschickt ein Programm namens <b>NACHVORNE</b> ein letztes Paket: alle EVE-Daten, alle Protokolle, alle Namen – an jede Redaktion des Landes. Absender: s.yildiz.'),
      P('Mine fragt dich, ob du dich an irgendetwas erinnerst.') + P('„An eine Stimme“, sagst du. „Sie hat gesagt, ich soll nicht aufhören zu laufen.“') + P('<i>Du warst es selbst. Du warst die ganze Zeit bei dir.</i>'),
    ],
  },
};
