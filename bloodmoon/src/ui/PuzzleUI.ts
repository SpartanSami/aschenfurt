import { G } from "../core/Context";
import { drawSymbol } from "../graphics/Textures";
import type { UIManager } from "./UIManager";

function h(tag: string, cls = "", html = ""): HTMLElement {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

export const SYMBOL_NAMES: Record<string, string> = {
  mond: "Mond", rabe: "Rabe", krone: "Krone", wolf: "Wolf", schlange: "Schlange", rose: "Rose", tropfen: "Blutstropfen", auge: "Auge", schwert: "Schwert",
};

/** Rätseldialoge: Symbolräder, Reihenfolgen, Chiffren und Melodien. */
export class PuzzleUI {
  private ui: UIManager;
  private cancelFn: (() => void) | null = null;

  constructor(ui: UIManager) {
    this.ui = ui;
  }

  cancel(): void {
    this.cancelFn?.();
  }

  private frame(title: string, desc: string): { el: HTMLElement; box: HTMLElement; fb: HTMLElement; act: HTMLElement } {
    const el = h("div", "screen");
    const box = h("div", "puzzle panel", `<h2>${title}</h2><div class="ornament"></div><div class="desc">${desc}</div><div class="body"></div><div class="feedback"></div><div class="actions"></div>`);
    el.appendChild(box);
    return { el, box, fb: box.querySelector(".feedback") as HTMLElement, act: box.querySelector(".actions") as HTMLElement };
  }

  /**
   * Symbolräder. validate liefert null (richtig) oder einen Hinweistext (falsch).
   * Gibt true zurück, wenn gelöst, false bei Abbruch.
   */
  dials(opts: { title: string; desc: string; labels: string[]; symbols: string[]; initial?: string[]; validate: (v: string[]) => string | null }): Promise<boolean> {
    return new Promise((resolve) => {
      const { el, box, fb, act } = this.frame(opts.title, opts.desc);
      const body = box.querySelector(".body") as HTMLElement;
      const wrap = h("div", "dials");
      body.appendChild(wrap);
      const vals = opts.labels.map((_, i) => opts.initial?.[i] ?? opts.symbols[0]);
      const faces: HTMLCanvasElement[] = [];
      const draw = (i: number) => {
        const c = faces[i];
        const ctx = c.getContext("2d")!;
        ctx.clearRect(0, 0, 152, 152);
        drawSymbol(ctx, vals[i], 76, 76, 110, "#c8a860");
        (wrap.children[i].querySelector(".lbl2") as HTMLElement).textContent = SYMBOL_NAMES[vals[i]] ?? vals[i];
      };
      opts.labels.forEach((lbl, i) => {
        const d = h("div", "dial", `<div class="lbl">${lbl}</div><div class="face"></div><div class="lbl2" style="font-size:16px;color:var(--ink-dim)"></div><div class="arrows"></div>`);
        const c = document.createElement("canvas");
        c.width = c.height = 152;
        d.querySelector(".face")!.appendChild(c);
        faces.push(c);
        const ar = d.querySelector(".arrows")!;
        for (const [t, dir] of [["◀", -1], ["▶", 1]] as [string, number][]) {
          const b = h("button", "btn small", t);
          b.addEventListener("click", () => {
            const k = opts.symbols.indexOf(vals[i]);
            vals[i] = opts.symbols[(k + dir + opts.symbols.length) % opts.symbols.length];
            G.audio.sfx("click");
            fb.textContent = "";
            draw(i);
          });
          ar.appendChild(b);
        }
        wrap.appendChild(d);
        draw(i);
      });
      const ok = h("button", "btn small", "Einrasten lassen");
      ok.addEventListener("click", () => {
        const r = opts.validate([...vals]);
        if (r === null) {
          fb.className = "feedback ok";
          fb.textContent = "Ein tiefes Klicken. Der Mechanismus gibt nach.";
          G.audio.sfx("solved");
          setTimeout(() => {
            this.cancelFn = null;
            this.ui.closeModal();
            resolve(true);
          }, 1200);
        } else {
          fb.className = "feedback";
          fb.textContent = r;
          G.audio.sfx("wrong");
          box.animate([{ transform: "translateX(-6px)" }, { transform: "translateX(6px)" }, { transform: "none" }], { duration: 260 });
        }
      });
      const cancel = h("button", "btn small", "Abbrechen");
      this.cancelFn = () => {
        this.cancelFn = null;
        this.ui.closeModal();
        resolve(false);
      };
      cancel.addEventListener("click", () => this.cancelFn?.());
      act.append(ok, cancel);
      this.ui.openPuzzle(el);
    });
  }

  /** Fragmente in die richtige Reihenfolge bringen (anklicken zum Tauschen). */
  order(opts: { title: string; desc: string; items: { id: string; text: string }[]; validate: (ids: string[]) => string | null }): Promise<boolean> {
    return new Promise((resolve) => {
      const { el, box, fb, act } = this.frame(opts.title, opts.desc);
      const body = box.querySelector(".body") as HTMLElement;
      const list = h("div", "order");
      body.appendChild(list);
      const items = [...opts.items];
      let picked = -1;
      const render = () => {
        list.innerHTML = "";
        items.forEach((it, i) => {
          const r = h("div", "frag" + (i === picked ? " sel" : ""), `<span class="num">${["I", "II", "III", "IV", "V", "VI"][i]}</span><span>${it.text}</span>`);
          r.addEventListener("click", () => {
            if (picked < 0) picked = i;
            else {
              [items[picked], items[i]] = [items[i], items[picked]];
              picked = -1;
              G.audio.sfx("paper");
            }
            fb.textContent = "";
            render();
          });
          list.appendChild(r);
        });
      };
      render();
      const ok = h("button", "btn small", "So war es");
      ok.addEventListener("click", () => {
        const r = opts.validate(items.map((i) => i.id));
        if (r === null) {
          fb.className = "feedback ok";
          fb.textContent = "Die Bruchstücke fügen sich. Die Erinnerung hält.";
          G.audio.sfx("solved");
          setTimeout(() => {
            this.cancelFn = null;
            this.ui.closeModal();
            resolve(true);
          }, 1300);
        } else {
          fb.className = "feedback";
          fb.textContent = r;
          G.audio.sfx("wrong");
        }
      });
      const cancel = h("button", "btn small", "Abbrechen");
      this.cancelFn = () => {
        this.cancelFn = null;
        this.ui.closeModal();
        resolve(false);
      };
      cancel.addEventListener("click", () => this.cancelFn?.());
      act.append(ok, cancel);
      this.ui.openPuzzle(el);
    });
  }

  /** Buchstaben/Wort eingeben (Chiffre). */
  cipher(opts: { title: string; desc: string; alphabet: string[]; length: number; validate: (word: string) => string | null; extra?: string }): Promise<boolean> {
    return new Promise((resolve) => {
      const { el, box, fb, act } = this.frame(opts.title, opts.desc);
      const body = box.querySelector(".body") as HTMLElement;
      if (opts.extra) body.appendChild(h("div", "", opts.extra));
      const entered = h("div", "entered", "");
      body.appendChild(entered);
      const row = h("div", "keysrow");
      body.appendChild(row);
      let word = "";
      const upd = () => (entered.textContent = word.padEnd(opts.length, "·").split("").join(" "));
      upd();
      for (const ch of opts.alphabet) {
        const b = h("button", "btn small", ch);
        b.addEventListener("click", () => {
          if (word.length < opts.length) {
            word += ch;
            G.audio.sfx("click");
            fb.textContent = "";
            upd();
          }
        });
        row.appendChild(b);
      }
      const del = h("button", "btn small", "⌫");
      del.addEventListener("click", () => {
        word = word.slice(0, -1);
        upd();
      });
      row.appendChild(del);
      const ok = h("button", "btn small", "Entschlüsseln");
      ok.addEventListener("click", () => {
        const r = opts.validate(word);
        if (r === null) {
          fb.className = "feedback ok";
          fb.textContent = "Die Zeichen ordnen sich. Der Text wird lesbar.";
          G.audio.sfx("solved");
          setTimeout(() => {
            this.cancelFn = null;
            this.ui.closeModal();
            resolve(true);
          }, 1300);
        } else {
          fb.className = "feedback";
          fb.textContent = r;
          G.audio.sfx("wrong");
          word = "";
          upd();
        }
      });
      const cancel = h("button", "btn small", "Abbrechen");
      this.cancelFn = () => {
        this.cancelFn = null;
        this.ui.closeModal();
        resolve(false);
      };
      cancel.addEventListener("click", () => this.cancelFn?.());
      act.append(ok, cancel);
      this.ui.openPuzzle(el);
    });
  }

  /** Spieluhr: Töne in der richtigen Reihenfolge spielen. */
  notes(opts: { title: string; desc: string; keys: { label: string; midi: number }[]; length: number; validate: (seq: number[]) => string | null }): Promise<boolean> {
    return new Promise((resolve) => {
      const { el, box, fb, act } = this.frame(opts.title, opts.desc);
      const body = box.querySelector(".body") as HTMLElement;
      const entered = h("div", "entered", "");
      body.appendChild(entered);
      const row = h("div", "keysrow");
      body.appendChild(row);
      let seq: number[] = [];
      const upd = () => (entered.textContent = seq.map((m) => opts.keys.find((k) => k.midi === m)?.label ?? "?").join(" – ") || "·");
      upd();
      for (const k of opts.keys) {
        const b = h("button", "btn small", k.label);
        b.addEventListener("click", () => {
          G.audio.note(k.midi, "box");
          if (seq.length >= opts.length) seq = [];
          seq.push(k.midi);
          fb.textContent = "";
          upd();
          if (seq.length === opts.length) {
            const r = opts.validate(seq);
            if (r === null) {
              fb.className = "feedback ok";
              fb.textContent = "Die Melodie ist vollständig. Irgendwo im Raum klickt ein Schloss.";
              G.audio.sfx("solved");
              setTimeout(() => {
                this.cancelFn = null;
                this.ui.closeModal();
                resolve(true);
              }, 1600);
            } else {
              fb.className = "feedback";
              fb.textContent = r;
              setTimeout(() => {
                seq = [];
                upd();
              }, 900);
            }
          }
        });
        row.appendChild(b);
      }
      const cancel = h("button", "btn small", "Abbrechen");
      this.cancelFn = () => {
        this.cancelFn = null;
        this.ui.closeModal();
        resolve(false);
      };
      cancel.addEventListener("click", () => this.cancelFn?.());
      act.append(cancel);
      this.ui.openPuzzle(el);
    });
  }
}
