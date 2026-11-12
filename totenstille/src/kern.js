/* TOTENSTILLE – Spielkern: Zustand, Regeln, Übergänge (ohne DOM, damit testbar) */
"use strict";

const SZ = {};                 // alle Szenen
let S = null;                  // aktueller Spielstand
let _notizen = [];             // sichtbare Folgen der letzten Entscheidung

const NAMEN = { mara: "Mara", walter: "Walter", jonas: "Jonas", lotte: "Lotte" };
const START_MIN = 22 * 60 + 10; // 22:10 Uhr
const FRIST = 470;              // Minuten bis 06:00 Uhr

const BERUFE = [
  ["med", /arzt|ärzt|aerzt|pfleg|kranken|sanit|apothek|medizin|zahn|chirurg|hebamme|therap|psycholog|arzthelf|rettung|notfall|doktor|heilprakt|pharma|\bmfa\b|\bmta\b/],
  ["kampf", /polizi|soldat|bundeswehr|militär|militaer|security|sicherheitsd|wachmann|wachdienst|wachschutz|türsteh|tuersteh|jäger|jaeger|feuerwehr|boxer|kampfsport|personenschutz|zoll|justizvoll|detektiv|förster|foerster|metzger|fleischer|offizier|kommissar/],
  ["tech", /mechani|mechatron|elektr|ingenieur|handwerk|schlosser|install|klempner|tischler|schreiner|informat|programm|entwickl|software|techni|monteur|lokführer|lokfuehrer|fahrer|maurer|dachdeck|bauarbeiter|zimmermann|zimmerer|\bmaler|\bit\b|it-|admin|architekt|maschinen|schweiß|schweiss|\bkfz|\blkw|pilot|gärtner|gaertner|landwirt|hausmeister|bauleiter|statiker/],
  ["sorge", /erzieh|kinder|sozial|pädagog|paedagog|lehrer|lehrkraft|\bmutter\b|\bvater\b|hausfrau|hausmann|betreu|seelsorg|tagesmutter|\bkita|nanny|au-pair/],
  ["rede", /makler|verkäuf|verkaeuf|verkauf|vertrieb|anwalt|anwält|anwaelt|jurist|berater|beratung|journalist|politik|manager|kaufmann|kauffrau|kaufm|bank|versicherung|marketing|pfarrer|priester|unternehmer|sales|händler|haendler|geschäftsführ|geschaeftsfuehr|moderator|diplomat|richter|notar|consult|redakteur|autor|schauspiel|selbstständig|selbststaendig|immobilien|finanz|vertreter|recruiter|personal|\bchef|direktor|leiter|\bceo\b|gastronom|kellner|barkeeper|friseur|coach|influencer/]
];

const GABEN = {
  med:   ["Ruhige Hände", "Du weißt, wie man Wunden versorgt. Und wie man sich dabei selbst schützt."],
  kampf: ["Ernstfall", "Du triffst, was du anvisierst, und steckst Schläge besser weg als andere."],
  tech:  ["Geschickte Finger", "Schlösser, Hebel, Kabel: Was klemmt, bekommst du leise auf. Was laufen soll, läuft."],
  rede:  ["Menschenkenntnis", "Du merkst, wenn jemand blufft, und findest die Worte, die Türen öffnen."],
  sorge: ["Vertrauen", "Menschen fassen schnell Zutrauen zu dir. Vor allem die, die sonst niemandem mehr trauen."],
  zaeh:  ["Zäh", "Nichts hat dich auf das hier vorbereitet, und du lebst trotzdem noch. Du hältst mehr aus als andere."]
};

function berufArt(job) {
  const j = String(job || "").toLowerCase();
  for (const [art, rx] of BERUFE) if (rx.test(j)) return art;
  return "zaeh";
}

function neuerStand(name, job) {
  const arch = berufArt(job);
  return {
    name, job, arch, makler: /makler|immobilien/i.test(job),
    t: 0, hp: arch === "zaeh" ? 5 : 4, hpMax: 5, hum: 0,
    eisen: false, verband: 0, ammo: 0, vorrat: 0, funk: false, akte: false,
    da: { mara: true, walter: true, jonas: true, lotte: false },
    tot: {},                                    // wer verloren ging und wie
    v: { mara: 1, walter: 1, jonas: 0, lotte: 0 }, // Vertrauen
    inf: {},                                    // wen du angesteckt hast
    f: {},                                      // Merker für Folgen
    horde: 0, route: null, satz: null, band: null,
    kap: 0, ort: "", zuege: 0
  };
}

/* ---------- Hilfen für die Story ---------- */
function P() {
  const out = [];
  (function sammeln(a) {
    for (const x of a) {
      if (Array.isArray(x)) sammeln(x);
      else if (typeof x === "string" && x.length) out.push(x);
    }
  })(Array.from(arguments));
  return out;
}
function wahl(l, f, o) { return Object.assign({ l, f }, o || {}); }
function folge(t, nx, o) { return Object.assign({ t: P(t), nx }, o || {}); }

function uhr(t) {
  const m = (START_MIN + (t === undefined ? S.t : t)) % 1440;
  const h = Math.floor(m / 60), mm = m % 60;
  return String(h).padStart(2, "0") + ":" + String(mm).padStart(2, "0");
}
function rest() { return FRIST - S.t; }
function zeit(n) { S.t += n; }
function notiz(s) { _notizen.push(s); }
function leben(n) {
  if (!n) return;
  const alt = S.hp;
  S.hp = Math.max(0, Math.min(S.hpMax, S.hp + n));
  if (S.hp < alt) notiz("Zustand −" + (alt - S.hp));
  else if (S.hp > alt) notiz("Zustand +" + (S.hp - alt));
}
function mensch(n) { S.hum += n; }
function trau(wer, n) {
  if (!n || !S.da[wer]) return;
  S.v[wer] += n;
  notiz(NAMEN[wer] + (n > 0 ? " vertraut dir mehr." : " vertraut dir weniger."));
}
function verlust(wer, art) {
  if (!S.da[wer]) return;
  S.da[wer] = false; S.tot[wer] = art;
  notiz(NAMEN[wer] + " ist nicht mehr bei euch.");
}
function ist(a) { return S.arch === a; }
function mit(w) { return !!S.da[w]; }
function anzahl() { return 1 + ["mara", "walter", "jonas", "lotte"].filter(mit).length; }
function zahlwort(n) { return ["null", "eins", "zwei", "drei", "vier", "fünf", "sechs"][n] || String(n); }
function liste(a) {
  if (a.length <= 1) return a.join("");
  return a.slice(0, -1).join(", ") + " und " + a[a.length - 1];
}

/* ---------- Übergänge ---------- */
function betrete(id) {
  let sicher = 0;
  while (sicher++ < 10) {
    const sz = SZ[id];
    if (!sz) throw new Error("Szene fehlt: " + id);
    if (sz.dauer) S.t += sz.dauer;
    if (sz.vor) {
      const um = sz.vor(S);
      if (um && um !== id) { id = um; continue; }
    }
    if (sz.kap !== undefined) S.kap = sz.kap;
    if (sz.ort) S.ort = sz.ort;
    return id;
  }
  throw new Error("Umleitungsschleife bei " + id);
}

function szeneDaten(id) {
  const sz = SZ[id];
  const d = {
    id, kap: sz.kap, ort: sz.ort, klang: sz.klang || "murmeln",
    text: P(sz.text(S)), ende: sz.ende || null, eingabe: sz.eingabe || null,
    weiter: null, wl: sz.wl || "Weiter", wahlen: null
  };
  if (sz.wahl) {
    d.wahlen = sz.wahl(S);
    if (d.wahlen.length !== 4) throw new Error("Szene " + id + " hat " + d.wahlen.length + " statt 4 Optionen");
  } else if (sz.weiter) {
    d.weiter = typeof sz.weiter === "function" ? sz.weiter(S) : sz.weiter;
  }
  return d;
}

function entscheide(id, i) {
  const w = SZ[id].wahl(S)[i];
  _notizen = [];
  const m = /„([^“]+)“/.exec(w.l);
  if (m) S.satz = m[1];
  S.zuege++;
  const r = w.f(S);
  const t = P(r.t);
  let nx = typeof r.nx === "function" ? r.nx(S) : r.nx;
  if (S.hp <= 0) {
    if (S.verband > 0 && mit("mara")) {
      S.verband--; S.hp = 1;
      t.push("Du kommst erst wieder zu dir, als Mara dir etwas auf die Wunde presst. „Bleib bei mir“, sagt sie. Das letzte Verbandspäckchen aus deinem Rucksack liegt aufgerissen neben ihr. „Noch mal kann ich das nicht.“");
      notiz("Verbandszeug verbraucht. Du lebst.");
    } else {
      nx = "tod";
    }
  }
  return { label: w.l, t, notizen: _notizen.slice(), nx, klang: r.klang || null };
}


