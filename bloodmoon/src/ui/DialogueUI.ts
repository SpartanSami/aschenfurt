import { G } from "../core/Context";
import { input } from "../core/Input";
import { SPEAKERS } from "../story/data/speakers";
import type { DNode } from "../story/types";
import type { ShownChoice } from "../story/DialogueSystem";

const TAGS: Record<string, string> = {
  luege: "Lüge", drohung: "Drohen", vampir: "Vampir", hunger: "Blutdurst", wahrheit: "Wahrheit",
  mitgefuehl: "Mitgefühl", frage: "Fragen", schweigen: "Schweigen", ende: "",
};

/** Dialogfenster mit Tastatur-, Mausrad- und Mausauswahl (ohne Pointer-Lock zu verlassen). */
export class DialogueUI {
  el: HTMLElement;
  private who: HTMLElement;
  private text: HTMLElement;
  private choicesEl: HTMLElement;
  private hint: HTMLElement;
  private choices: ShownChoice[] = [];
  private sel = 0;
  private mouseAcc = 0;
  private typing = 0;
  private full = "";
  open_ = false;

  constructor(root: HTMLElement) {
    this.el = document.createElement("div");
    this.el.id = "dialogue";
    this.el.className = "hidden interactive";
    this.el.innerHTML = `<div class="who"></div><div class="text"></div><div class="choices"></div><div class="hint"></div>`;
    root.appendChild(this.el);
    this.who = this.el.querySelector(".who")!;
    this.text = this.el.querySelector(".text")!;
    this.choicesEl = this.el.querySelector(".choices")!;
    this.hint = this.el.querySelector(".hint")!;
  }

  open(): void {
    this.open_ = true;
    this.el.classList.remove("hidden");
    G.ui.hud.setVisible(false);
  }

  close(): void {
    this.open_ = false;
    this.el.classList.add("hidden");
    G.ui.hud.setVisible(true);
  }

  showNode(node: DNode, choices: ShownChoice[]): void {
    const sp = SPEAKERS[node.speaker];
    this.who.textContent = sp?.name ?? "";
    this.who.style.color = sp?.color ?? "#ccc";
    this.full = node.text;
    this.typing = 0;
    this.text.textContent = "";
    this.choices = choices;
    const firstOpen = choices.findIndex((c) => !c.locked);
    this.sel = Math.max(0, firstOpen);
    this.renderChoices();
  }

  private renderChoices(): void {
    this.choicesEl.innerHTML = "";
    const typingDone = this.typing >= this.full.length;
    this.choicesEl.style.opacity = typingDone ? "1" : "0";
    this.choices.forEach((c, i) => {
      const d = document.createElement("div");
      d.className = "choice" + (i === this.sel ? " sel" : "") + (c.locked ? " locked" : "");
      const tag = c.choice.tag && TAGS[c.choice.tag] ? `<span class="tag">[${TAGS[c.choice.tag]}]</span>` : "";
      d.innerHTML = `<span class="n">${i + 1}</span>${tag}${c.locked ? c.choice.lockedHint ?? c.choice.text : c.choice.text}`;
      d.addEventListener("mouseenter", () => {
        if (!c.locked) {
          this.sel = i;
          this.renderChoices();
        }
      });
      d.addEventListener("click", () => this.confirm(i));
      this.choicesEl.appendChild(d);
    });
    this.hint.textContent = this.choices.length ? (typingDone ? "W/S oder Mausrad wählen · E bestätigen" : "") : typingDone ? "E / Leertaste – weiter" : "";
  }

  private confirm(i: number): void {
    const c = this.choices[i];
    if (!c || c.locked) return;
    G.dialogue.choose(c.index);
  }

  update(dt: number): void {
    if (!this.open_) return;
    // Schreibmaschinen-Effekt
    if (this.typing < this.full.length) {
      this.typing = Math.min(this.full.length, this.typing + dt * 70);
      this.text.textContent = this.full.slice(0, Math.floor(this.typing));
      if (this.typing >= this.full.length) this.renderChoices();
      if (input.wasPressedRaw("KeyE") || input.wasPressedRaw("Space") || input.wasPressedRaw("Enter") || input.mousePressed[0]) {
        this.typing = this.full.length;
        this.text.textContent = this.full;
        this.renderChoices();
        input.consume("KeyE");
        input.consume("Space");
        input.consume("Enter");
        input.mousePressed[0] = false;
      }
      return;
    }
    const open = this.choices.map((c, i) => (c.locked ? -1 : i)).filter((i) => i >= 0);
    if (open.length) {
      let move = 0;
      if (input.wasPressedRaw("KeyW") || input.wasPressedRaw("ArrowUp")) move = -1;
      if (input.wasPressedRaw("KeyS") || input.wasPressedRaw("ArrowDown")) move = 1;
      if (input.wheel) move = Math.sign(input.wheel);
      this.mouseAcc += input.mouseDY;
      if (Math.abs(this.mouseAcc) > 60) {
        move = Math.sign(this.mouseAcc);
        this.mouseAcc = 0;
      }
      if (move) {
        const k = open.indexOf(this.sel);
        this.sel = open[(k + move + open.length) % open.length];
        G.audio.sfx("uiHover");
        this.renderChoices();
      }
      for (let n = 1; n <= 9; n++) {
        if (input.wasPressedRaw("Digit" + n) && this.choices[n - 1] && !this.choices[n - 1].locked) {
          this.confirm(n - 1);
          return;
        }
      }
      if (input.wasPressedRaw("KeyE") || input.wasPressedRaw("Enter") || input.wasPressedRaw("Space") || (input.mousePressed[0] && input.locked)) {
        input.consume("KeyE");
        this.confirm(this.sel);
      }
    } else if (input.wasPressedRaw("KeyE") || input.wasPressedRaw("Space") || input.wasPressedRaw("Enter") || input.mousePressed[0]) {
      input.consume("KeyE");
      G.dialogue.advance();
    }
  }
}
