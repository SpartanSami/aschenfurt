import { G } from "../core/Context";
import { settings } from "../core/Settings";
import { ABILITIES } from "../player/PlayerAbilities";
import { pathIcon } from "./Icons";

const DROP = "M17 2 C11 12 6 18 6 27 a11 11 0 0 0 22 0 C28 18 23 12 17 2z";

/** Minimalistisches HUD: Ziel, Interaktionshinweis, Blutdurst, aktive Fähigkeit. */
export class HUD {
  el: HTMLElement;
  private objQ: HTMLElement;
  private objT: HTMLElement;
  private objective: HTMLElement;
  private prompt: HTMLElement;
  private cross: HTMLElement;
  private fill: SVGRectElement;
  private hungerLbl: HTMLElement;
  private ability: HTMLElement;
  private abIcon: HTMLElement;
  private abTxt: HTMLElement;
  private abCd: HTMLElement;
  private health: HTMLElement;
  private healthBar: HTMLElement;
  private fps: HTMLElement;
  private lastPrompt = "";
  private frames = 0;
  private fpsT = 0;
  private objText = "";
  private objFade = 0;

  constructor(root: HTMLElement) {
    this.el = document.createElement("div");
    this.el.id = "hud";
    this.el.innerHTML = `
      <div class="objective"><div class="q"></div><div class="t"></div></div>
      <div class="crosshair"></div>
      <div class="prompt"></div>
      <div class="status">
        <div class="hunger">
          <svg viewBox="0 0 34 40">
            <defs><clipPath id="hclip"><rect id="hfill" x="0" y="40" width="34" height="40"/></clipPath>
            <linearGradient id="hgrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e02a34"/><stop offset="1" stop-color="#5a040a"/></linearGradient></defs>
            <path d="${DROP}" fill="rgba(0,0,0,.45)" stroke="rgba(176,145,90,.55)" stroke-width="1"/>
            <path d="${DROP}" fill="url(#hgrad)" clip-path="url(#hclip)"/>
          </svg>
          <div class="lbl">Blutdurst</div>
        </div>
        <div class="ability"><div class="icon"><div class="cd"></div></div><div class="txt"></div></div>
      </div>
      <div class="health"><div></div></div>
      <div class="fps"></div>`;
    root.appendChild(this.el);
    const q = (s: string) => this.el.querySelector(s) as HTMLElement;
    this.objective = q(".objective");
    this.objQ = q(".objective .q");
    this.objT = q(".objective .t");
    this.prompt = q(".prompt");
    this.cross = q(".crosshair");
    this.fill = this.el.querySelector("#hfill") as unknown as SVGRectElement;
    this.hungerLbl = q(".hunger .lbl");
    this.ability = q(".ability");
    this.abIcon = q(".ability .icon");
    this.abTxt = q(".ability .txt");
    this.abCd = q(".ability .cd");
    this.health = q(".health");
    this.healthBar = q(".health > div");
    this.fps = q(".fps");
    this.objective.style.display = "none";
    this.ability.style.display = "none";
  }

  setVisible(v: boolean): void {
    this.el.style.opacity = v ? "1" : "0";
  }

  setPrompt(text: string): void {
    if (text === this.lastPrompt) return;
    this.lastPrompt = text;
    if (text) {
      this.prompt.innerHTML = `<kbd>E</kbd>${text}`;
      this.prompt.classList.add("show");
      this.cross.classList.add("focus");
    } else {
      this.prompt.classList.remove("show");
      this.cross.classList.remove("focus");
    }
  }

  refresh(): void {
    const o = G.quests?.objective();
    const txt = o ? o.text : "";
    if (txt !== this.objText) {
      this.objText = txt;
      this.objQ.textContent = o?.quest ?? "";
      this.objT.textContent = txt;
      this.objFade = 12;
    }
    this.objective.style.display = txt ? "block" : "none";
    const sel = G.abilities?.selected;
    const def = sel && G.abilities.has(sel) ? ABILITIES[sel] : null;
    if (def) {
      this.ability.style.display = "flex";
      const cdEl = this.abCd.outerHTML;
      this.abIcon.innerHTML = pathIcon(def.icon) + cdEl;
      this.abCd = this.abIcon.querySelector(".cd") as HTMLElement;
      this.abTxt.innerHTML = `<b>${def.name}</b>[Q] · [${def.key}]`;
    } else {
      this.ability.style.display = "none";
    }
  }

  showAbilityFlash(_id: string): void {
    this.abIcon.animate([{ boxShadow: "0 0 30px rgba(196,24,42,.9)" }, { boxShadow: "0 0 0 rgba(0,0,0,0)" }], { duration: 500 });
  }

  update(dt: number): void {
    const h = G.abilities.hunger;
    this.fill.setAttribute("y", String(40 - (h / 100) * 34 - 4));
    this.hungerLbl.style.color = h > 75 ? "#e05050" : "";
    const sel = G.abilities.selected;
    const active = (sel === "bloodsight" && G.abilities.bloodSightOn) || (sel === "nightvision" && G.abilities.nightVisionOn);
    this.ability.classList.toggle("active", active);
    if (sel === "shadowrun") this.abCd.style.transform = `scaleY(${Math.min(1, G.abilities.shadowCooldown / 2.2)})`;
    else this.abCd.style.transform = "scaleY(0)";
    const hp = G.player.health / G.player.maxHealth;
    this.health.classList.toggle("show", hp < 0.995);
    this.healthBar.style.width = `${hp * 100}%`;
    G.renderer.uniforms.uDamage.value = Math.max(G.renderer.uniforms.uDamage.value * Math.exp(-dt * 2), (1 - hp) * 0.55);
    // Ziel blendet nach einiger Zeit dezent aus
    this.objFade -= dt;
    this.objective.style.opacity = this.objFade > 0 ? "1" : "0.45";
    if (settings.data.showFps) {
      this.frames++;
      this.fpsT += dt;
      if (this.fpsT > 0.5) {
        this.fps.textContent = `${Math.round(this.frames / this.fpsT)} FPS · ${G.renderer.renderer.info.render.calls} DC`;
        this.frames = 0;
        this.fpsT = 0;
      }
    } else this.fps.textContent = "";
  }
}
