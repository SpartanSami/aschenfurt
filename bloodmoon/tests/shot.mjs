// Hilfsskript: lädt das Spiel headless, führt Schritte aus und speichert Screenshots.
// Aufruf: node tests/shot.mjs <outdir> <script.json>
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
import fs from "fs";

const out = process.argv[2] || "tests/out";
const steps = JSON.parse(fs.readFileSync(process.argv[3], "utf8"));
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({
  args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required"],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
const errors = [];
page.on("console", (m) => {
  if (m.type() === "error" || m.type() === "warning") errors.push(`[${m.type()}] ${m.text()}`);
});
page.on("pageerror", (e) => errors.push(`[pageerror] ${e.message}\n${e.stack}`));
await page.goto(process.env.URL || "http://localhost:5173/?debug=1", { waitUntil: "load" });
for (const s of steps) {
  const t0 = Date.now();
  try {
    if (s.wait) await page.waitForTimeout(s.wait);
    if (s.waitFor) await page.waitForFunction(s.waitFor, null, { timeout: s.timeout ?? 120000 });
    if (s.click) await page.click(s.click);
    if (s.eval) {
      const r = await page.evaluate(s.eval);
      if (r !== undefined) console.log("eval:", JSON.stringify(r));
    }
    if (s.key) await page.keyboard.press(s.key);
    if (s.hold) {
      await page.keyboard.down(s.hold);
      await page.waitForTimeout(s.ms ?? 1000);
      await page.keyboard.up(s.hold);
    }
    if (s.shot) await page.screenshot({ path: `${out}/${s.shot}.png` });
  } catch (e) {
    console.log("STEP FAILED", JSON.stringify(s), e.message);
  }
  console.log("step", JSON.stringify(s).slice(0, 90), (Date.now() - t0) + "ms");
}
console.log("--- console errors/warnings ---");
console.log(errors.slice(0, 40).join("\n"));
await browser.close();
