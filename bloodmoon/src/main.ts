import "@fontsource/cinzel/400.css";
import "@fontsource/cinzel/600.css";
import "@fontsource/cinzel-decorative/700.css";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/500.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "./ui/styles.css";
import { Game } from "./core/Game";

function webglAvailable(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!c.getContext("webgl2");
  } catch {
    return false;
  }
}

async function boot(): Promise<void> {
  const app = document.getElementById("app")!;
  const ui = document.getElementById("ui")!;
  const splash = document.getElementById("splash")!;
  if (!webglAvailable()) {
    splash.innerHTML = `<div class="t">BLOODMOON</div><div class="s">Dein Browser unterstützt kein WebGL 2.<br>Bitte verwende eine aktuelle Version von Chrome oder Edge mit aktivierter Hardwarebeschleunigung.</div>`;
    return;
  }
  const game = new Game();
  await game.init(app, ui);
  await game.showTitle(splash);
}

boot().catch((err) => {
  console.error(err);
  const s = document.getElementById("splash");
  if (s) s.innerHTML = `<div class="t">BLOODMOON</div><div class="s">Beim Start ist ein Fehler aufgetreten:<br><code>${String(err?.message ?? err)}</code></div>`;
});
