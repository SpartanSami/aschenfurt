import { G } from "../core/Context";
import { input } from "../core/Input";

/**
 * Touch-Steuerung für Smartphones und Tablets.
 * Linke Bildschirmhälfte: virtueller Stick (weit ausgelenkt = Sprinten).
 * Rechte Bildschirmhälfte: Wischen zum Umschauen.
 * Schaltflächen lösen dieselben Tastencodes aus wie die Tastatur, damit alle Systeme unverändert bleiben.
 */
export class TouchControls {
  private el: HTMLElement;
  private stickBase: HTMLElement;
  private stickKnob: HTMLElement;
  private stickId: number | null = null;
  private stickOrigin = { x: 0, y: 0 };
  private lookId: number | null = null;
  private lookLast = { x: 0, y: 0 };
  private held = new Set<string>();
  private visible = false;
  private pushBtn: HTMLElement;
  private regenBtn: HTMLElement;

  constructor(root: HTMLElement) {
    this.el = document.createElement("div");
    this.el.id = "touch";
    this.el.className = "interactive hidden";
    this.el.innerHTML = `
      <div class="zone left"></div>
      <div class="zone right"></div>
      <div class="stick hidden"><div class="knob"></div></div>
      <div class="top">
        <button data-tap="Tab">Inventar</button>
        <button data-tap="KeyJ">Tagebuch</button>
        <button data-tap="KeyK">Fähigk.</button>
        <button data-tap="Escape" class="pause">II</button>
      </div>
      <div class="actions">
        <button data-hold="KeyE" class="big">E</button>
        <button data-tap="KeyQ" class="mid">Q</button>
        <button data-wheel="1" class="small">⟳</button>
        <button data-tap="KeyC" class="small">Schleichen</button>
        <button data-mouse="0" class="small push hidden">Blutstoß</button>
        <button data-hold="KeyR" class="small regen hidden">Heilen</button>
      </div>`;
    root.appendChild(this.el);
    this.stickBase = this.el.querySelector(".stick")!;
    this.stickKnob = this.el.querySelector(".knob")!;
    this.pushBtn = this.el.querySelector(".push")!;
    this.regenBtn = this.el.querySelector(".regen")!;

    const left = this.el.querySelector(".zone.left") as HTMLElement;
    const right = this.el.querySelector(".zone.right") as HTMLElement;
    left.addEventListener("pointerdown", (e) => this.stickStart(e));
    right.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      if (this.lookId !== null) return;
      this.lookId = e.pointerId;
      this.lookLast = { x: e.clientX, y: e.clientY };
      try {
        right.setPointerCapture(e.pointerId);
      } catch {
        /* ältere Browser */
      }
    });
    right.addEventListener("pointermove", (e) => {
      if (e.pointerId !== this.lookId) return;
      input.mouseDX += (e.clientX - this.lookLast.x) * 2.2;
      input.mouseDY += (e.clientY - this.lookLast.y) * 2.2;
      this.lookLast = { x: e.clientX, y: e.clientY };
    });
    const endLook = (e: PointerEvent) => {
      if (e.pointerId === this.lookId) this.lookId = null;
    };
    right.addEventListener("pointerup", endLook);
    right.addEventListener("pointercancel", endLook);
    left.addEventListener("pointermove", (e) => this.stickMove(e));
    left.addEventListener("pointerup", (e) => this.stickEnd(e));
    left.addEventListener("pointercancel", (e) => this.stickEnd(e));

    for (const b of this.el.querySelectorAll<HTMLElement>("button")) {
      b.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        b.classList.add("on");
        if (b.dataset.tap) this.tap(b.dataset.tap);
        if (b.dataset.hold) this.key(b.dataset.hold, true);
        if (b.dataset.wheel) input.wheel += 1;
        if (b.dataset.mouse) {
          input.mouseDown[0] = true;
          input.mousePressed[0] = true;
        }
      });
      const up = () => {
        b.classList.remove("on");
        if (b.dataset.hold) this.key(b.dataset.hold, false);
        if (b.dataset.mouse) input.mouseDown[0] = false;
      };
      b.addEventListener("pointerup", up);
      b.addEventListener("pointercancel", up);
      b.addEventListener("pointerleave", up);
    }
  }

  private key(code: string, down: boolean): void {
    if (down === this.held.has(code)) return;
    if (down) this.held.add(code);
    else this.held.delete(code);
    window.dispatchEvent(new KeyboardEvent(down ? "keydown" : "keyup", { code, key: code, bubbles: true }));
  }

  private tap(code: string): void {
    this.key(code, true);
    setTimeout(() => this.key(code, false), 60);
  }

  private stickStart(e: PointerEvent): void {
    e.preventDefault();
    if (this.stickId !== null) return;
    this.stickId = e.pointerId;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      /* ältere Browser */
    }
    this.stickOrigin = { x: e.clientX, y: e.clientY };
    this.stickBase.style.left = e.clientX + "px";
    this.stickBase.style.top = e.clientY + "px";
    this.stickKnob.style.transform = "translate(-50%, -50%)";
    this.stickBase.classList.remove("hidden");
  }

  private stickMove(e: PointerEvent): void {
    if (e.pointerId !== this.stickId) return;
    const R = 56;
    let dx = e.clientX - this.stickOrigin.x;
    let dy = e.clientY - this.stickOrigin.y;
    const len = Math.hypot(dx, dy);
    const k = len > R ? R / len : 1;
    dx *= k;
    dy *= k;
    this.stickKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    const nx = dx / R, ny = dy / R;
    this.key("KeyW", ny < -0.35);
    this.key("KeyS", ny > 0.35);
    this.key("KeyA", nx < -0.35);
    this.key("KeyD", nx > 0.35);
    this.key("ShiftLeft", len > R * 1.35 && ny < -0.5);
  }

  private stickEnd(e: PointerEvent): void {
    if (e.pointerId !== this.stickId) return;
    this.stickId = null;
    this.stickBase.classList.add("hidden");
    for (const c of ["KeyW", "KeyS", "KeyA", "KeyD", "ShiftLeft"]) this.key(c, false);
  }

  private releaseAll(): void {
    for (const c of [...this.held]) this.key(c, false);
    this.stickId = null;
    this.lookId = null;
    this.stickBase.classList.add("hidden");
    input.mouseDown[0] = false;
  }

  update(): void {
    const show = input.touch && G.running && !G.ui.inMenu && !G.ui.modalOpen && !G.dialogue.active && !G.levels.loading;
    if (show !== this.visible) {
      this.visible = show;
      this.el.classList.toggle("hidden", !show);
      if (!show) this.releaseAll();
    }
    if (show) {
      this.pushBtn.classList.toggle("hidden", !G.abilities.has("bloodpush"));
      this.regenBtn.classList.toggle("hidden", !G.abilities.has("regen"));
    }
  }
}
