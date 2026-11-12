/* Druckt den Text eines festen Pfades: node pfad.js "<Beruf>" 0,1,2,... [abSzene] */
const fs = require("fs"), vm = require("vm"), path = require("path");
const src = path.join(__dirname, "..", "src");
const ctx = vm.createContext({ console });
for (const f of ["kern.js", "story1.js", "story2.js", "story3.js", "story4.js"]) {
  vm.runInContext(fs.readFileSync(path.join(src, f), "utf8"), ctx, { filename: f });
}
ctx.__job = process.argv[2] || "Student";
ctx.__folge = (process.argv[3] || "").split(",").filter((x) => x !== "").map(Number);
ctx.__ab = process.argv[4] || "";
vm.runInContext(`
(function () {
  S = neuerStand("Sami", __job);
  let id = betrete("prolog"), n = 0, an = !__ab;
  const aus = (s) => { if (an) console.log(s); };
  for (let k = 0; k < 80; k++) {
    if (id === __ab || id.indexOf(__ab) === 0) an = true;
    const d = szeneDaten(id);
    aus("\\n===== " + id + " · " + uhr() + " · hp " + S.hp + " =====");
    d.text.forEach((t) => aus(t));
    if (d.ende) {
      aus("--- Schicksale ---");
      schicksale(d.ende.art, d.ende.id).forEach((t) => aus(t));
      aus("--- Bilanz ---");
      bilanz(d.ende.art).forEach((r) => aus(r.join(": ")));
      return;
    }
    if (d.wahlen) {
      d.wahlen.forEach((w, i) => aus("   [" + "ABCD"[i] + "] " + w.l + (w.beruf ? "  (BERUF)" : "")));
      const i = n < __folge.length ? __folge[n] : 0; n++;
      const r = entscheide(id, i);
      aus("  >>> " + "ABCD"[i]);
      r.t.forEach((t) => aus(t));
      r.notizen.forEach((t) => aus("   -> " + t));
      id = betrete(r.nx);
    } else {
      if (d.eingabe) S[d.eingabe.schluessel] = d.eingabe.std(S);
      id = betrete(d.weiter);
    }
  }
})();
`, ctx);
