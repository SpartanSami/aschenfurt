// Smoke-Test: startet das Spiel headless (Chromium + SwiftShader), lädt nacheinander
// alle sechs Kapitel und meldet Ladefehler, Laufzeitfehler und Konsolenfehler.
// Voraussetzung: laufender Dev-Server (npm run dev) oder URL=... (z. B. vite preview).
// Aufruf: npm run test:smoke
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const URL = process.env.URL || "http://localhost:5173/?debug=1";
const LEVELS = ["ch1_drakenfels", "ch2_rabenfurt", "ch3_forst", "ch4_ebon", "ch5_drakenfels", "ch6_erste"];
const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
page.on("pageerror", (e) => errors.push(e.message));
let failed = 0;
await page.goto(URL, { waitUntil: "load" });
await page.waitForFunction("document.querySelector('#splash.ready')", null, { timeout: 180000 });
await page.click("#splash");
await page.waitForFunction("!!window.BLOODMOON", null, { timeout: 60000 });
console.log("Hauptmenü ok");
for (const id of LEVELS) {
  const t0 = Date.now();
  const before = errors.length;
  try {
    await page.evaluate((id) => { window.BLOODMOON.G.ui.hideMainMenu(); return window.BLOODMOON.goto(id); }, id);
    await page.waitForFunction((id) => window.BLOODMOON.G.running && window.BLOODMOON.G.level?.id === id, id, { timeout: 300000 });
    await page.waitForTimeout(1500);
    const info = await page.evaluate(() => { let n = 0; window.BLOODMOON.G.level.scene.traverse((o) => { if (o.isMesh) n++; }); return { meshes: n }; });
    const errs = errors.slice(before);
    if (errs.length) failed++;
    console.log(`${errs.length ? "FEHLER" : "ok    "} ${id.padEnd(16)} ${((Date.now() - t0) / 1000).toFixed(1)} s, ${info.meshes} Meshes${errs.length ? "\n   " + errs.join("\n   ") : ""}`);
  } catch (e) {
    failed++;
    console.log(`FEHLER ${id}: ${e.message}`);
  }
}
// Speichern und Laden
try {
  const ok = await page.evaluate(async () => {
    const G = window.BLOODMOON.G;
    G.save.save("slot3");
    const has = G.save.list().some((s) => s.slot === "slot3");
    return has;
  });
  console.log(ok ? "ok     Speichern in Slot 3" : "FEHLER Speichern in Slot 3");
  if (!ok) failed++;
} catch (e) {
  failed++;
  console.log("FEHLER Speichern:", e.message);
}
await browser.close();
console.log(failed ? `\n${failed} Problem(e) gefunden.` : "\nAlle Smoke-Tests bestanden.");
process.exit(failed ? 1 : 0);
