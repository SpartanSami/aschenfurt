import { G } from "../../core/Context";

export type EndingId = "blutlinie" | "herrschaft" | "erbe";

interface EndingDef {
  id: EndingId;
  title: string;
  eyebrow: string;
  music: string;
  available: () => boolean;
  missing?: () => string[];
  pages: () => string[];
}

const trustsMine = () => G.state.rel("mine") >= 30 || G.state.hasItem("schlafdorn");
const bassemAllied = () => G.state.is("bassemAllied");
const ilyasAllied = () => G.state.is("ilyasAllied");

function rabenfurtPage(): string {
  const parts: string[] = [];
  const lene = G.state.flag("leneFate");
  const gerold = G.state.decided("gerold");
  if (lene === "saved") parts.push("Lene wuchs zu einer Frau heran, die nie wieder schlafwandelte. Nur manchmal summte sie eine Melodie, deren Herkunft sie nicht kannte.");
  else parts.push("In Rabenfurt erzählte man noch lange von dem Kind, das in der Kapelle verschwand. Man mied den Hügel, auf dem sie stand.");
  if (gerold === "spared") parts.push("Vater Gerold las nie wieder eine Messe. Er pflegte das Grab seiner Frau, und manchmal weinte er dabei, und manchmal nicht.");
  else if (gerold === "killed" || gerold === "fed") parts.push("Die Kapelle bekam einen neuen Priester. Über den alten sprach niemand.");
  if (G.state.is("helpedVillagers")) parts.push("Und Berta erzählte jedem, der es hören wollte, ein Drakenfels habe einmal die Tür eines Bauernhauses von außen zugehalten, damit der Regen nicht hereinkam.");
  else if (G.state.is("intimidatedVillagers")) parts.push("Und Berta erzählte den Kindern, man solle die Türen verriegeln, wenn rote Augen am Brunnen stehen. Sie hatte nicht unrecht.");
  return parts.join("\n");
}

function bassemPage(kind: EndingId): string {
  const nadira = G.state.flag("nadiraFate");
  if (!bassemAllied()) {
    return kind === "herrschaft"
      ? "Der Wolfsbund zog sich in die Berge zurück, dorthin, wo der rote Mond hinter den Gipfeln verschwindet. Bassem hatte es vorausgesagt. Er hasste es, recht zu behalten."
      : "Bassem kam nicht zu den Kammern hinab. Er erfuhr erst Wochen später, was geschehen war, und schwieg lange. Dann ließ er die Grenzsteine stehen, wo sie waren.";
  }
  if (kind === "herrschaft") return "Bassem kämpfte, bis der Wolfsbund ihn wegtrug. Er sagte nie wieder ein Wort über das Haus Drakenfels – nur über einen einzelnen Vampir, der ihn einmal ‚Freund' genannt hatte, bevor er zu etwas anderem wurde.";
  const base = kind === "erbe"
    ? "Bassem setzte einen vierten Grenzstein in den Schwarzen Forst. Es steht kein Eid darauf und keine Grenze. Nur eine Hand aus Wolfspfote und Menschenfingern, ineinander."
    : "Bassem setzte einen vierten Grenzstein in den Schwarzen Forst. Darauf steht kein Eid, nur ein Name.";
  const nad = nadira === "calmed" ? " Nadira half ihm, ihn aufzurichten." : nadira === "killed" ? " Er setzte ihn allein, an der Stelle, wo seine Schwester starb." : " Nadira ist seither nicht zurückgekehrt. Manchmal hört er sie in den Bergen.";
  return base + nad;
}

function ilyasPage(kind: EndingId): string {
  if (kind === "herrschaft") return ilyasAllied() ? "İlyas verbrannte die Rabenchronik in einer Nacht, die nicht endete. Es gab niemanden mehr, der sie lesen sollte. Dann ging er nach Süden, wo die Menschen noch träumen dürfen, wovon sie wollen." : "İlyas floh mit der Chronik nach Süden. Ob er je angekommen ist, weiß niemand.";
  return ilyasAllied()
    ? "İlyas Rabe schrieb die Chronik zu Ende. Auf die letzte Seite schrieb er nicht, was geschehen war, sondern wer: einen Namen, sorgfältig, in der Handschrift seines Urgroßvaters."
    : "İlyas Rabe schrieb die Chronik zu Ende, so gut er konnte. Es fehlten Seiten. Er ließ sie leer, statt sie zu erfinden.";
}

export const ENDINGS: Record<EndingId, EndingDef> = {
  blutlinie: {
    id: "blutlinie", title: "Das Ende der Blutlinie", eyebrow: "Ende I", music: "ending1",
    available: () => true,
    pages: () => [
      "Sami öffnete seine Adern über dem Siegel, und das älteste Blut Vareths floss dorthin zurück, woher es gekommen war.\nDer Erste trank – und fand nichts darin, was er behalten konnte. Kein Erbe. Keine Krone. Nur einen Sohn, der aufgehört hatte, etwas zu wollen.",
      "Als die Sonne über dem Schwarzen Forst aufging, war der Mond über Vareth weiß.\nIn den Burgen des Landes erwachten die alten Familien und spürten, dass etwas fehlte: Die Nacht gehorchte ihnen nicht mehr. Ihre Unsterblichkeit war zu einem langen, gewöhnlichen Leben geworden. Viele hassten ihn dafür. Einige dankten ihm, leise.",
      trustsMine()
        ? "Mine trug ihn hinaus ins Licht, weil er es so gewollt hatte.\nSie blieb, bis nichts mehr von ihm übrig war als Staub auf ihrem Mantel. Danach zündete sie nie wieder eine Kerze an. Sie brauchte keine mehr, um sich zu erinnern."
        : "Mine sah nicht zu. Sie war gegangen, bevor das Licht kam.\nIn ihrer Tasche trug sie einen schwarzen Dolch, den sie nicht gebraucht hatte, und niemand weiß, ob sie darüber erleichtert war.",
      bassemPage("blutlinie"),
      ilyasPage("blutlinie") + "\n" + rabenfurtPage(),
      "Das Haus Drakenfels erlosch in dieser Nacht.\nEs war das Einzige, was es je für die Welt getan hat.",
    ],
  },
  herrschaft: {
    id: "herrschaft", title: "Die Herrschaft der Nacht", eyebrow: "Ende II", music: "ending2",
    available: () => true,
    pages: () => [
      "Sami öffnete sich, und der Erste stieg in ihn hinein wie in ein Haus, das endlich bereit war.\nDiesmal war keine Mutter da, die die Tür schloss.",
      "Er fühlte alles, was je vergessen worden war. Jeden Namen, jedes Gesicht, jede Nacht seit Anbeginn.\nUnd er erinnerte sich an nichts mehr, das ihm selbst gehörte.",
      "Der rote Mond ging nicht mehr unter. In Vareth wurde es nicht mehr Tag.\nDie alten Familien knieten. Die Wölfe heulten. Die Menschen träumten – und träumten nur noch von ihm.",
      trustsMine()
        ? "Mine kniete nicht. Sie stand vor seinem Thron, den schwarzen Dolch in der Hand, und er sah sie lange an.\nDann lächelte er mit dem Gesicht ihres Freundes und sagte: „Du hättest es tun sollen, als du noch konntest.“"
        : "Mine hatte es kommen sehen. Sie war die Erste, die er vergaß.",
      bassemPage("herrschaft") + "\n" + ilyasPage("herrschaft"),
      "Sami von Drakenfels wurde der mächtigste Vampir, den Vareth je gesehen hat.\nNiemand nannte ihn je wieder bei seinem Namen. Am wenigsten er selbst.",
    ],
  },
  erbe: {
    id: "erbe", title: "Der wahre Erbe", eyebrow: "Ende III", music: "ending3",
    available: () => {
      if (!G.state.is("verse2")) return false;
      const n = [G.state.hasItem("schlafdorn"), G.state.is("anselmDecoded"), bassemAllied()].filter(Boolean).length;
      return n >= 2;
    },
    missing: () => {
      const m: string[] = [];
      if (!G.state.is("verse2")) m.push("Dir fehlt die zweite Strophe des Liedes.");
      const n = [G.state.hasItem("schlafdorn"), G.state.is("anselmDecoded"), bassemAllied()].filter(Boolean).length;
      if (n < 2) m.push("Dir fehlt das Vertrauen derer, die das Band mit dir lösen könnten.");
      return m;
    },
    pages: () => [
      "Sami sang die zweite Strophe. Nicht für den Ersten – für sich.\nUnd während er sang, erkannte er, was das Band war: keine Kette, sondern eine Erinnerung mit zwei Enden.",
      "Er löste sie. Nicht mit Gewalt, nicht mit Blut.\nEr ließ los, was sein Vater ihm angebunden hatte – und mit ihm alles, was der Erste je verschlungen hatte. Die Namen kehrten zurück. Die Gesichter. Die Stimmen. Ruprechts Tochter. Gerolds Adelheid. Ein Graf namens Corvin, der um Vergebung schrie, und niemand antwortete ihm.",
      "Der Erste wurde nicht vernichtet. Er wurde gelöst – verstreut in alles, was lebt.\nEine winzige Dunkelheit in jedem Blut, in jedem Traum, in jedem Wolf und jedem Menschen. Niemand kann sagen, ob die Welt dadurch besser geworden ist. Nur, dass sie jetzt niemandem mehr gehört.",
      "Ysolde sah den Morgen nicht.\nAber sie sah ihren Sohn, und er kannte das ganze Lied.",
      trustsMine()
        ? "Sami erwachte in einem schmalen Bett in Rabenfurt. Er wusste nicht, wo er war. Er wusste nicht, wer er war.\nAn seinem Bett saß eine Frau mit dunklen Augen und einer brennenden Kerze.\n„Ich heiße Mine“, sagte sie. „Und diesmal erzähle ich dir alles.“"
        : "Sami erwachte in einem schmalen Bett in Rabenfurt. Er wusste nicht, wo er war. Er wusste nicht, wer er war.\nAn seinem Bett saß ein Mann mit einer Ledertasche voller Schriftrollen.\n„Ich heiße İlyas“, sagte er. „Ich habe aufgeschrieben, wer du warst. Du entscheidest, ob du es lesen willst.“",
      bassemPage("erbe") + "\n" + rabenfurtPage(),
      "Der Mond über Vareth ist weiß.\nManchmal, in klaren Nächten, schimmert er ein wenig rot. Die Kinder in Rabenfurt sagen, dann träumt er.",
    ],
  },
};
