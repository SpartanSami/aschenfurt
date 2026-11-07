import { G } from "../core/Context";
import { input } from "../core/Input";
import { settings, Quality } from "../core/Settings";
import { HUD } from "./HUD";
import { DialogueUI } from "./DialogueUI";
import { PuzzleUI } from "./PuzzleUI";
import { TouchControls } from "./TouchControls";
import { icon, pathIcon } from "./Icons";
import { ABILITIES } from "../player/PlayerAbilities";
import { DOCUMENTS } from "../story/data/documents";
import { MEMORIES } from "../story/data/memories";
import { PEOPLE } from "../story/data/people";
import type { DocumentDef } from "../story/types";
import { SLOTS, formatPlayTime, SaveMeta } from "../save/SaveManager";

type ModalName = "pause" | "inventory" | "journal" | "abilities" | "document" | "settings" | "load" | "save" | "controls" | "puzzle" | "death" | "ending" | "credits";

const TIPS = [
  "Stille ist nicht leer. Hör hin.",
  "Blutsicht verrät, was die Augen der Lebenden übersehen.",
  "Nicht jede Gestalt im Dunkeln will dir schaden. Nicht jede lässt dich gehen.",
  "Der rote Mond geht alle achtzig Jahre auf. Diesmal geht er nicht unter.",
  "Wer schleicht (Strg / C), wird seltener gehört.",
  "Blutphiolen stillen den Durst. Andere Wege auch – zu einem Preis.",
  "Entscheidungen werden erinnert. Von Menschen, von Wölfen, von Vampiren.",
  "Halte [R], um Wunden mit Blut zu schließen – sobald du dich daran erinnerst, wie.",
];

function h(tag: string, cls = "", html = ""): HTMLElement {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html) e.innerHTML = html;
  return e;
}

function esc(s: string): string {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
}

export interface MenuHandlers {
  newGame: () => void;
  continueGame: () => void;
  loadSlot: (slot: string) => void;
  toMainMenu: () => void;
  quit: () => void;
}

export class UIManager {
  root: HTMLElement;
  hud: HUD;
  dialogue: DialogueUI;
  puzzle: PuzzleUI;
  touch: TouchControls;
  modal: ModalName | null = null;
  private modalEl: HTMLElement | null = null;
  private modalStack: ModalName[] = [];
  private notes: HTMLElement;
  private subs: HTMLElement;
  private loadingEl: HTMLElement;
  private memTitle: HTMLElement;
  private chapterEl: HTMLElement;
  private clickEl: HTMLElement;
  private menuEl: HTMLElement | null = null;
  handlers!: MenuHandlers;
  inMenu = true;
  private journalTab = "aufgaben";
  private journalSel: string | null = null;
  private invSel: string | null = null;
  private docClose: (() => void) | null = null;

  constructor(root: HTMLElement) {
    this.root = root;
    this.hud = new HUD(root);
    this.subs = h("div", "", `<span class="line hidden"></span>`);
    this.subs.id = "subtitles";
    root.appendChild(this.subs);
    this.dialogue = new DialogueUI(root);
    this.notes = h("div");
    this.notes.id = "notifications";
    root.appendChild(this.notes);
    this.memTitle = h("div");
    this.memTitle.id = "memoryTitle";
    root.appendChild(this.memTitle);
    this.chapterEl = h("div", "", `<div class="num"></div><div class="title"></div><div class="sub"></div>`);
    this.chapterEl.id = "chapterCard";
    this.chapterEl.style.display = "none";
    root.appendChild(this.chapterEl);
    this.clickEl = h("div", "interactive hidden", `<div>Klicken, um fortzufahren</div>`);
    this.clickEl.id = "clickToPlay";
    this.clickEl.addEventListener("click", () => this.resumeLock());
    root.appendChild(this.clickEl);
    this.loadingEl = h("div", "", `<div class="title">BLOODMOON</div><div class="bar"><div style="width:0%"></div></div><div class="msg"></div><div class="tip"></div>`);
    this.loadingEl.id = "loading";
    this.loadingEl.style.display = "none";
    root.appendChild(this.loadingEl);
    this.puzzle = new PuzzleUI(this);
    this.touch = new TouchControls(root);
    this.hud.setVisible(false);
    window.addEventListener("keydown", (e) => this.onKey(e));
    this.applySubtitleSize();
  }

  applySubtitleSize(): void {
    document.body.classList.remove("sub-klein", "sub-gross");
    if (settings.data.subtitleSize !== "mittel") document.body.classList.add("sub-" + settings.data.subtitleSize);
  }

  // -------------------------------------------------------------------------
  // Meldungen
  // -------------------------------------------------------------------------

  notify(text: string, kind: "info" | "quest" | "item" | "memory" | "warn" = "info"): void {
    if (!text) return;
    const n = h("div", "note " + kind);
    n.textContent = text;
    this.notes.appendChild(n);
    if (kind !== "info") G.audio?.sfx("notify");
    while (this.notes.children.length > 5) this.notes.firstElementChild?.remove();
    setTimeout(() => n.classList.add("out"), 4200);
    setTimeout(() => n.remove(), 5200);
  }

  subtitle(who: string, text: string, color: string): void {
    const line = this.subs.querySelector(".line") as HTMLElement;
    if (!text || !settings.data.subtitles) {
      line.classList.add("hidden");
      return;
    }
    line.classList.remove("hidden");
    line.innerHTML = (who ? `<span class="who" style="color:${color}">${esc(who)}</span>` : "") + esc(text);
  }

  loading(f: number, msg: string): void {
    if (f < 0) {
      this.loadingEl.style.opacity = "0";
      setTimeout(() => (this.loadingEl.style.display = "none"), 800);
      return;
    }
    if (this.loadingEl.style.display === "none") {
      this.loadingEl.style.display = "flex";
      this.loadingEl.style.opacity = "1";
      (this.loadingEl.querySelector(".tip") as HTMLElement).textContent = TIPS[Math.floor(Math.random() * TIPS.length)];
    }
    (this.loadingEl.querySelector(".bar > div") as HTMLElement).style.width = `${Math.round(f * 100)}%`;
    (this.loadingEl.querySelector(".msg") as HTMLElement).textContent = msg;
  }

  memoryTitle(title: string): void {
    this.memTitle.innerHTML = `${esc(title)}<small>Bluterinnerung</small>`;
    this.memTitle.style.opacity = "1";
    setTimeout(() => (this.memTitle.style.opacity = "0"), 3500);
  }

  async chapterCard(n: number, title: string, sub: string): Promise<void> {
    const roman = ["", "I", "II", "III", "IV", "V", "VI"][n] ?? String(n);
    (this.chapterEl.querySelector(".num") as HTMLElement).textContent = `Kapitel ${roman}`;
    (this.chapterEl.querySelector(".title") as HTMLElement).textContent = title;
    (this.chapterEl.querySelector(".sub") as HTMLElement).textContent = sub;
    this.chapterEl.style.display = "flex";
    await new Promise((r) => requestAnimationFrame(r));
    this.chapterEl.style.opacity = "1";
    await new Promise((r) => setTimeout(r, 4600));
    this.chapterEl.style.opacity = "0";
    await new Promise((r) => setTimeout(r, 1400));
    this.chapterEl.style.display = "none";
  }

  abilityUnlocked(id: string): void {
    const a = ABILITIES[id];
    if (!a) return;
    this.notify(`Fähigkeit erwacht: ${a.name}${a.key ? ` [${a.key}]` : ""}`, "memory");
    G.audio.sfx("bloodSightOn");
    this.hud.refresh();
  }

  // -------------------------------------------------------------------------
  // Modale Fenster
  // -------------------------------------------------------------------------

  get modalOpen(): boolean {
    return this.modal !== null;
  }

  private openModal(name: ModalName, el: HTMLElement, push = false): void {
    if (this.modalEl) {
      if (push && this.modal) this.modalStack.push(this.modal);
      this.modalEl.remove();
    }
    this.modal = name;
    this.modalEl = el;
    el.classList.add("interactive");
    this.root.appendChild(el);
    G.game.paused = !this.inMenu;
    input.enabled = false;
    input.exitLock();
    this.clickEl.classList.add("hidden");
    G.audio?.sfx("uiOpen");
  }

  closeModal(resume = true): void {
    if (!this.modalEl) return;
    this.modalEl.remove();
    this.modalEl = null;
    const prev = this.modalStack.pop();
    this.modal = null;
    if (prev) {
      this.reopen(prev);
      return;
    }
    if (this.inMenu) return;
    G.game.paused = false;
    input.enabled = true;
    if (resume) this.resumeLock();
  }

  private reopen(m: ModalName): void {
    if (m === "pause") this.openPause();
    else if (this.inMenu) return;
  }

  resumeLock(): void {
    if (this.inMenu || this.modalOpen) return;
    input.requestLock();
    setTimeout(() => {
      if (!input.looking && !this.inMenu && !this.modalOpen && G.running) this.clickEl.classList.remove("hidden");
    }, 350);
  }

  onLockChange(locked: boolean): void {
    if (locked) {
      this.clickEl.classList.add("hidden");
      return;
    }
    // Pointer Lock verloren (z. B. durch Escape) – Pause öffnen
    if (!this.inMenu && !this.modalOpen && G.running && !G.levels.loading) this.openPause();
  }

  private onKey(e: KeyboardEvent): void {
    if (e.repeat) return;
    if (this.inMenu && !this.modalOpen) return;
    const code = e.code;
    if (this.modal === "document") {
      if (code === "Escape" || code === "KeyE" || code === "Space") {
        e.preventDefault();
        this.docClose?.();
      }
      return;
    }
    if (this.modal === "puzzle") {
      if (code === "Escape") this.puzzle.cancel();
      return;
    }
    if (this.modal === "death" || this.modal === "ending" || this.modal === "credits") return;
    if (this.inMenu) {
      if (code === "Escape") this.closeModal();
      return;
    }
    const playing = !G.dialogue.active && !G.story.busy && G.running;
    if (code === "Escape") {
      if (this.modalOpen) this.closeModal();
      else if (G.running) this.openPause();
    } else if (code === "Tab") {
      e.preventDefault();
      if (this.modal === "inventory") this.closeModal();
      else if (playing && (!this.modal || this.modal === "journal" || this.modal === "abilities")) this.openInventory();
    } else if (code === "KeyJ") {
      if (this.modal === "journal") this.closeModal();
      else if (playing && (!this.modal || this.modal === "inventory" || this.modal === "abilities")) this.openJournal();
    } else if (code === "KeyK") {
      if (this.modal === "abilities") this.closeModal();
      else if (playing && (!this.modal || this.modal === "inventory" || this.modal === "journal")) this.openAbilities();
    }
  }

  // -------------------------------------------------------------------------
  // Hauptmenü
  // -------------------------------------------------------------------------

  showMainMenu(): void {
    this.inMenu = true;
    this.dialogue.close();
    this.hud.setVisible(false);
    this.subtitle("", "", "");
    if (this.menuEl) this.menuEl.remove();
    const latest = G.save.latest();
    const el = h("div", "interactive", `
      <div class="left">
        <div class="logo">BLOOD<span>MOON</span></div>
        <div class="sub">Das Erbe der Finsternis</div>
        <div class="items"></div>
      </div>
      <div class="quote">„Achtzig Jahre schlief der Erbe.<br>Achtzig Jahre wachte der Mond.“</div>
      <div class="foot"><span>Ein Gothic-Fantasy-Horrorspiel</span><span>Kopfhörer empfohlen · Maus & Tastatur</span></div>`);
    el.id = "menu";
    const items = el.querySelector(".items")!;
    const add = (label: string, fn: () => void, disabled = false) => {
      const b = h("button", "btn", label) as HTMLButtonElement;
      b.disabled = disabled;
      b.addEventListener("click", () => {
        G.audio?.sfx("uiClick");
        fn();
      });
      b.addEventListener("mouseenter", () => !disabled && G.audio?.sfx("uiHover"));
      items.appendChild(b);
    };
    add("Neues Spiel", () => {
      if (latest) {
        this.confirm("Ein neues Spiel beginnen? Der automatische Spielstand wird beim ersten Kontrollpunkt überschrieben. Manuelle Spielstände bleiben erhalten.", () => this.handlers.newGame());
      } else this.handlers.newGame();
    });
    add("Spiel fortsetzen", () => this.handlers.continueGame(), !latest);
    add("Spiel laden", () => this.openLoad(), !G.save.list().length);
    add("Einstellungen", () => this.openSettings());
    add("Steuerung", () => this.openControls());
    add("Mitwirkende", () => this.openCredits());
    add("Spiel beenden", () => this.handlers.quit());
    if (!G.save.available) {
      const w = h("div", "", "Hinweis: Der Browser erlaubt keinen lokalen Speicher – Fortschritt kann nicht gesichert werden.");
      w.style.cssText = "margin-top:22px;color:#c08070;font-style:italic;font-size:16px;";
      el.querySelector(".left")!.appendChild(w);
    }
    this.root.appendChild(el);
    this.menuEl = el;
  }

  hideMainMenu(): void {
    this.inMenu = false;
    this.menuEl?.remove();
    this.menuEl = null;
    this.hud.setVisible(true);
  }

  confirm(text: string, yes: () => void, yesLabel = "Ja", noLabel = "Abbrechen"): void {
    const el = h("div", "screen", `<div class="box panel" style="max-width:560px;text-align:center"><p style="font-size:21px;line-height:1.5">${esc(text)}</p><div class="actions"></div></div>`);
    const act = el.querySelector(".actions")!;
    const y = h("button", "btn small", yesLabel);
    y.addEventListener("click", () => {
      this.closeModal(false);
      yes();
    });
    const n = h("button", "btn small", noLabel);
    n.addEventListener("click", () => this.closeModal());
    act.append(y, n);
    this.openModal("pause", el, true);
  }

  // -------------------------------------------------------------------------
  // Pause, Speichern, Laden
  // -------------------------------------------------------------------------

  openPause(): void {
    const el = h("div", "screen", `<div class="box panel" style="max-width:460px;text-align:center"><h2>Pause</h2><div class="ornament"></div><div class="items" style="display:flex;flex-direction:column;align-items:center;gap:2px;margin-top:10px"></div></div>`);
    const items = el.querySelector(".items")!;
    const add = (label: string, fn: () => void, disabled = false) => {
      const b = h("button", "btn", label) as HTMLButtonElement;
      b.style.textAlign = "center";
      b.disabled = disabled;
      b.addEventListener("click", () => {
        G.audio?.sfx("uiClick");
        fn();
      });
      items.appendChild(b);
    };
    add("Fortsetzen", () => this.closeModal());
    add("Speichern", () => this.openSave(), G.story.busy || G.dialogue.active || G.combat.inCombat);
    add("Laden", () => this.openLoad());
    add("Tagebuch", () => this.openJournal());
    add("Einstellungen", () => this.openSettings());
    add("Steuerung", () => this.openControls());
    add("Hauptmenü", () => this.confirm("Zum Hauptmenü zurückkehren? Nicht gespeicherter Fortschritt seit dem letzten Kontrollpunkt geht verloren.", () => this.handlers.toMainMenu()));
    this.modalStack = [];
    this.openModal("pause", el);
  }

  private slotList(mode: "save" | "load"): HTMLElement {
    const box = h("div", "box panel", `<h2>${mode === "save" ? "Spiel speichern" : "Spiel laden"}</h2><div class="ornament"></div><div class="slots"></div><div class="actions"></div>`);
    const slots = box.querySelector(".slots")!;
    for (const s of SLOTS) {
      if (mode === "save" && s === "auto") continue;
      const f = G.save.read(s);
      const meta: SaveMeta | undefined = f?.meta;
      const row = h("div", "slot" + (!meta && mode === "load" ? " empty" : ""));
      const name = s === "auto" ? "Automatisch" : `Platz ${s.slice(-1)}`;
      row.innerHTML = meta
        ? `<div class="name">${name}</div><div class="info">Kapitel ${meta.chapter} · ${esc(meta.location)}<small>${esc(meta.objective || "")} · ${formatPlayTime(meta.playTime)} · ${new Date(meta.savedAt).toLocaleString("de-DE")}</small></div><div></div>`
        : `<div class="name">${name}</div><div class="info"><small>Leer</small></div><div></div>`;
      row.addEventListener("click", () => {
        if (mode === "save") {
          const doSave = () => {
            G.save.save(s);
            this.closeModal(false);
            this.openSave();
          };
          if (meta) this.confirm("Diesen Spielstand überschreiben?", doSave, "Überschreiben");
          else doSave();
        } else if (meta) {
          const go = () => {
            this.modalStack = [];
            this.closeModal(false);
            this.handlers.loadSlot(s);
          };
          if (!this.inMenu) this.confirm("Diesen Spielstand laden? Nicht gespeicherter Fortschritt geht verloren.", go, "Laden");
          else go();
        }
      });
      slots.appendChild(row);
    }
    const back = h("button", "btn small", "Zurück");
    back.addEventListener("click", () => this.closeModal());
    box.querySelector(".actions")!.appendChild(back);
    return box;
  }

  openSave(): void {
    const el = h("div", "screen");
    el.appendChild(this.slotList("save"));
    this.openModal("save", el, true);
  }

  openLoad(): void {
    const el = h("div", "screen");
    el.appendChild(this.slotList("load"));
    this.openModal("load", el, true);
  }

  // -------------------------------------------------------------------------
  // Einstellungen & Steuerung
  // -------------------------------------------------------------------------

  openSettings(): void {
    const d = settings.data;
    const el = h("div", "screen", `<div class="box panel"><h2>Einstellungen</h2><div class="ornament"></div><div class="rows"></div><div class="actions"></div></div>`);
    const rows = el.querySelector(".rows")!;
    const slider = (label: string, key: keyof typeof d, min: number, max: number, step: number, fmt = (v: number) => `${Math.round(v * 100)} %`) => {
      const r = h("div", "row", `<label>${label}</label><div style="display:flex;gap:12px;align-items:center"><input type="range" min="${min}" max="${max}" step="${step}" value="${d[key]}"><span style="min-width:62px;text-align:right;color:var(--ink-dim)"></span></div>`);
      const inp = r.querySelector("input") as HTMLInputElement;
      const out = r.querySelector("span") as HTMLElement;
      out.textContent = fmt(Number(d[key]));
      inp.addEventListener("input", () => {
        settings.update({ [key]: Number(inp.value) } as any);
        out.textContent = fmt(Number(inp.value));
        if (key === "fov" || key === "brightness" || key === "renderScale") G.renderer.applySettings();
      });
      rows.appendChild(r);
    };
    const toggle = (label: string, key: keyof typeof d, onChange?: () => void) => {
      const r = h("div", "row", `<label>${label}</label><button class="btn small toggle">${d[key] ? "An" : "Aus"}</button>`);
      const b = r.querySelector("button") as HTMLElement;
      b.addEventListener("click", () => {
        settings.update({ [key]: !settings.data[key] } as any);
        b.textContent = settings.data[key] ? "An" : "Aus";
        onChange?.();
      });
      rows.appendChild(r);
    };
    const select = (label: string, key: keyof typeof d, opts: [string, string][], onChange?: () => void) => {
      const r = h("div", "row", `<label>${label}</label><select>${opts.map(([v, t]) => `<option value="${v}" ${d[key] === v ? "selected" : ""}>${t}</option>`).join("")}</select>`);
      const s = r.querySelector("select") as HTMLSelectElement;
      s.addEventListener("change", () => {
        settings.update({ [key]: s.value } as any);
        onChange?.();
      });
      rows.appendChild(r);
    };
    const section = (t: string) => rows.appendChild(h("h3", "", t)).setAttribute("style", "font-size:14px;color:var(--gold);margin:22px 0 6px;letter-spacing:.25em;text-transform:uppercase");
    section("Audio");
    slider("Gesamtlautstärke", "master", 0, 1, 0.01);
    slider("Musik", "music", 0, 1, 0.01);
    slider("Soundeffekte", "sfx", 0, 1, 0.01);
    slider("Umgebung", "ambience", 0, 1, 0.01);
    slider("Sprache", "voice", 0, 1, 0.01);
    section("Steuerung");
    slider("Maus-Empfindlichkeit", "sensitivity", 0.2, 3, 0.05, (v) => v.toFixed(2));
    toggle("Maus Y invertieren", "invertY");
    toggle("Kopfbewegung beim Gehen", "headBob");
    section("Grafik");
    select("Grafikqualität", "quality", [["niedrig", "Niedrig"], ["mittel", "Mittel"], ["hoch", "Hoch"], ["ultra", "Ultra"]] as [Quality, string][], () => {
      G.renderer.applySettings();
      this.notify("Qualität geändert. Texturqualität und Lichtanzahl gelten ab dem nächsten Gebiet.", "info");
    });
    slider("Auflösungsskalierung", "renderScale", 0.5, 1, 0.05);
    slider("Sichtfeld", "fov", 60, 95, 1, (v) => `${v}°`);
    slider("Helligkeit", "brightness", 0.7, 1.6, 0.02, (v) => v.toFixed(2));
    const fs = h("div", "row", `<label>Darstellungsmodus</label><button class="btn small toggle">${document.fullscreenElement ? "Vollbild" : "Fenster"}</button>`);
    const fb = fs.querySelector("button") as HTMLElement;
    fb.addEventListener("click", async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else await document.documentElement.requestFullscreen();
      } catch {
        this.notify("Vollbild wird von diesem Browser nicht unterstützt.", "warn");
      }
      setTimeout(() => (fb.textContent = document.fullscreenElement ? "Vollbild" : "Fenster"), 200);
    });
    rows.appendChild(fs);
    toggle("FPS anzeigen", "showFps");
    section("Barrierefreiheit");
    toggle("Untertitel", "subtitles");
    select("Untertitelgröße", "subtitleSize", [["klein", "Klein"], ["mittel", "Mittel"], ["gross", "Groß"]], () => this.applySubtitleSize());
    const act = el.querySelector(".actions")!;
    const reset = h("button", "btn small", "Zurücksetzen");
    reset.addEventListener("click", () => {
      settings.reset();
      G.renderer.applySettings();
      this.applySubtitleSize();
      this.closeModal(false);
      this.openSettings();
    });
    const back = h("button", "btn small", "Zurück");
    back.addEventListener("click", () => this.closeModal());
    act.append(reset, back);
    this.openModal("settings", el, true);
  }

  openControls(): void {
    const keys: [string, string][] = [
      ["W A S D", "Bewegen"], ["Maus", "Umschauen"], ["Shift", "Sprinten"], ["Strg / C", "Schleichen (C schaltet um)"],
      ["E", "Interagieren · Dialog fortsetzen · Überwältigen"], ["Q", "Gewählte Vampirfähigkeit"], ["1 · 2 · 3", "Blutsicht · Nachtsicht · Schattenlauf"],
      ["Mausrad", "Fähigkeit wählen"], ["Linke Maustaste", "Blutstoß (sobald erlernt)"], ["R (halten)", "Regeneration (sobald erlernt)"],
      ["Tab", "Inventar"], ["J", "Tagebuch"], ["K", "Fähigkeiten"], ["Escape", "Pause"],
    ];
    const el = h("div", "screen", `<div class="box panel" style="max-width:700px"><h2>Steuerung</h2><div class="ornament"></div><div class="keys">${keys.map(([k, v]) => `<div><kbd>${k}</kbd></div><div>${v}</div>`).join("")}</div><p style="color:var(--ink-dim);font-style:italic;margin-top:22px;font-size:17px">In Dialogen: W/S, Mausrad oder Mausbewegung zum Auswählen, E oder Linksklick zum Bestätigen, Zahlentasten für direkte Wahl.</p>${input.touch ? `<p style="color:var(--ink-dim);font-style:italic;font-size:17px">Touch: Linke Bildschirmhälfte gedrückt halten und ziehen = gehen (weit nach vorn = sprinten). Rechte Hälfte wischen = umschauen. E = interagieren, Q = Fähigkeit, ⟳ = Fähigkeit wechseln. Antworten in Dialogen direkt antippen.</p>` : ""}<div class="actions"></div></div>`);
    const back = h("button", "btn small", "Zurück");
    back.addEventListener("click", () => this.closeModal());
    el.querySelector(".actions")!.appendChild(back);
    this.openModal("controls", el, true);
  }

  openCredits(): void {
    const el = h("div", "screen", `<div class="box panel" style="max-width:760px"><h2>Mitwirkende</h2><div class="ornament"></div>
      <div class="credits">
        <b>Idee & Figuren</b>Sami von Drakenfels, Mine, Bassem, İlyas – nach der Vorlage des Auftraggebers
        <b>Entwicklung, Story, Dialoge</b>Claude (Anthropic) als Ein-Personen-Studio
        <b>Technik</b>Three.js · three-mesh-bvh · TypeScript · Vite
        <b>Grafik</b>Sämtliche Texturen, Modelle und Figuren werden prozedural zur Laufzeit erzeugt.
        <b>Klang & Musik</b>Prozedurale Synthese mit der Web-Audio-API.
        <b>Stimmen</b>Sprachausgabe erzeugt mit ElevenLabs (elevenlabs.io) – Standardstimmen Brian, Lily, Harry, George, Sarah, Callum, Roger, Bill, Matilda, Chris, Jessica, Eric, Daniel, Bella und Charlie.
        <b>Schriften</b>Cinzel, Cinzel Decorative, Cormorant Garamond (SIL Open Font License)
      </div><div class="actions"></div></div>`);
    const back = h("button", "btn small", "Zurück");
    back.addEventListener("click", () => this.closeModal());
    el.querySelector(".actions")!.appendChild(back);
    this.openModal("credits", el, true);
  }

  // -------------------------------------------------------------------------
  // Inventar
  // -------------------------------------------------------------------------

  openInventory(): void {
    const el = h("div", "screen");
    const book = h("div", "book panel");
    el.appendChild(book);
    const render = () => {
      const items = G.inventory.items();
      if (this.invSel && !items.find((i) => i.def.id === this.invSel)) this.invSel = null;
      if (!this.invSel && items.length) this.invSel = items[0].def.id;
      const sel = items.find((i) => i.def.id === this.invSel);
      const cat: Record<string, string> = { schluessel: "Schlüssel", dokument: "Dokument", artefakt: "Artefakt", phiole: "Blutphiole", quest: "Questgegenstand", heilung: "Heilung" };
      book.innerHTML = `<div class="tabs"><div class="tab on">Inventar</div></div>
        <div class="content"><div class="items-grid"></div><div class="detail"></div></div>
        <div class="footer">Tab – schließen · J – Tagebuch · K – Fähigkeiten</div>`;
      const grid = book.querySelector(".items-grid")!;
      if (!items.length) grid.appendChild(h("div", "empty", "Deine Taschen sind leer."));
      for (const it of items) {
        const c = h("div", "item" + (it.def.id === this.invSel ? " on" : ""), icon(it.def.icon) + (it.count > 1 ? `<span class="cnt">${it.count}</span>` : ""));
        c.title = it.def.name;
        c.addEventListener("click", () => {
          this.invSel = it.def.id;
          render();
        });
        grid.appendChild(c);
      }
      const det = book.querySelector(".detail") as HTMLElement;
      if (sel) {
        const q = sel.def.quest && G.quests.defs[sel.def.quest] ? `<p style="color:var(--gold-dim);font-size:16px">Gehört zu: ${esc(G.quests.defs[sel.def.quest].title)}</p>` : "";
        det.innerHTML = `<h3>${esc(sel.def.name)}</h3><div class="meta">${cat[sel.def.category] ?? ""}</div><p>${esc(sel.def.desc)}</p>${q}<div class="actions" style="justify-content:flex-start"></div>`;
        const act = det.querySelector(".actions")!;
        if (sel.def.usable || sel.def.category === "phiole" || sel.def.category === "heilung") {
          const b = h("button", "btn small", "Benutzen");
          b.addEventListener("click", () => {
            G.inventory.use(sel.def.id);
            render();
          });
          act.appendChild(b);
        }
        if (sel.def.category === "dokument" && DOCUMENTS[sel.def.id]) {
          const b = h("button", "btn small", "Lesen");
          b.addEventListener("click", () => this.openDocument(DOCUMENTS[sel.def.id], true));
          act.appendChild(b);
        }
      } else det.innerHTML = "";
    };
    render();
    this.openModal("inventory", el);
  }

  // -------------------------------------------------------------------------
  // Tagebuch
  // -------------------------------------------------------------------------

  openJournal(tab?: string): void {
    if (tab) this.journalTab = tab;
    const el = h("div", "screen");
    const book = h("div", "book panel");
    el.appendChild(book);
    const tabs: [string, string][] = [["aufgaben", "Aufgaben"], ["erinnerungen", "Erinnerungen"], ["dokumente", "Dokumente"], ["personen", "Personen"], ["entscheidungen", "Entscheidungen"]];
    const render = () => {
      book.innerHTML = `<div class="tabs">${tabs.map(([k, t]) => `<div class="tab ${k === this.journalTab ? "on" : ""}" data-t="${k}">${t}</div>`).join("")}</div>
        <div class="content"><div class="list"></div><div class="detail"></div></div>
        <div class="footer">J – schließen · Tab – Inventar · K – Fähigkeiten</div>`;
      book.querySelectorAll(".tab").forEach((t) =>
        t.addEventListener("click", () => {
          this.journalTab = (t as HTMLElement).dataset.t!;
          this.journalSel = null;
          render();
        }),
      );
      const list = book.querySelector(".list") as HTMLElement;
      const det = book.querySelector(".detail") as HTMLElement;
      const entries: { id: string; title: string; sub?: string; done?: boolean; body: () => string }[] = [];
      if (this.journalTab === "aufgaben") {
        const typ: Record<string, string> = { haupt: "Hauptquest", neben: "Nebenquest", erkundung: "Erkundung", charakter: "Charakterquest", raetsel: "Rätsel", verborgen: "Verborgene Entdeckung" };
        const qs = [...G.quests.active(), ...G.quests.all("done"), ...G.quests.all("failed")];
        for (const q of qs) {
          const st = G.quests.status(q.id);
          entries.push({
            id: q.id, title: q.title, sub: `${typ[q.type]} · ${st === "done" ? "Abgeschlossen" : st === "failed" ? "Gescheitert" : "Aktiv"}`, done: st !== "active",
            body: () => {
              const tasks = q.tasks.filter((t) => !t.hidden || G.quests.taskDone(q.id, t.id))
                .map((t) => `<div class="task ${G.quests.taskDone(q.id, t.id) ? "ok" : ""}">${esc(t.text)}${t.optional ? " <i style='color:var(--ink-faint)'>(optional)</i>" : ""}</div>`).join("");
              const chars = q.characters.length ? `<p style="color:var(--gold-dim);font-size:16px;margin-top:14px">Beteiligt: ${q.characters.map((c) => PEOPLE[c]?.name ?? c).join(", ")}</p>` : "";
              const tr = st === "active" ? `<div class="actions" style="justify-content:flex-start"><button class="btn small" data-track="${q.id}">${G.state.data.trackedQuest === q.id ? "Wird verfolgt" : "Verfolgen"}</button></div>` : "";
              return `<h3>${esc(q.title)}</h3><div class="meta">${typ[q.type]} · Kapitel ${q.chapter}</div><p>${esc(st === "done" && q.doneText ? q.doneText : q.desc)}</p>${tasks}${chars}${tr}`;
            },
          });
        }
      } else if (this.journalTab === "erinnerungen") {
        for (const id of G.state.data.memories) {
          const m = MEMORIES[id];
          if (!m) continue;
          entries.push({ id, title: m.title, sub: `Kapitel ${m.chapter}`, body: () => `<h3>${esc(m.title)}</h3><div class="meta">Bluterinnerung</div><p>${esc(m.summary)}</p><p style="font-style:italic;color:var(--ink-dim)">${esc(m.interpretation)}</p>` });
        }
      } else if (this.journalTab === "dokumente") {
        for (const id of G.state.data.documents) {
          const d = DOCUMENTS[id];
          if (!d) continue;
          entries.push({ id, title: d.title, sub: d.author ?? "", body: () => `<h3>${esc(d.title)}</h3><div class="meta">${esc(d.author ?? "")}</div>${d.body.split("\n\n").map((p) => `<p>${esc(p)}</p>`).join("")}` });
        }
      } else if (this.journalTab === "personen") {
        for (const [pid, lvl] of Object.entries(G.state.data.people)) {
          const p = PEOPLE[pid];
          if (!p || lvl <= 0) continue;
          entries.push({
            id: pid, title: lvl === 1 && p.alias ? p.alias : p.name, sub: p.role,
            body: () => {
              const rel = ["mine", "bassem", "ilyas"].includes(pid) ? `<div class="rel">${G.relations.label(pid)}</div>` : "";
              const txt = p.entries.filter((e) => e.level <= lvl).map((e) => `<p>${esc(e.text)}</p>`).join("");
              return `<h3>${esc(lvl === 1 && p.alias ? p.alias : p.name)}</h3><div class="meta">${esc(p.role)}</div>${rel}${txt}`;
            },
          });
        }
      } else {
        const ds = Object.entries(G.state.data.decisions);
        for (const [id, d] of ds) entries.push({ id, title: d.label, sub: `Kapitel ${d.chapter}`, body: () => `<h3>${esc(d.label)}</h3><div class="meta">Kapitel ${d.chapter}</div><p style="color:var(--ink-dim);font-style:italic">Diese Entscheidung wird erinnert.</p>` });
      }
      if (!entries.length) list.appendChild(h("div", "empty", "Noch keine Einträge."));
      if (!this.journalSel || !entries.find((e) => e.id === this.journalSel)) this.journalSel = entries[0]?.id ?? null;
      for (const e of entries) {
        const it = h("div", "entry" + (e.id === this.journalSel ? " on" : "") + (e.done ? " done" : ""), `${esc(e.title)}${e.sub ? `<small>${esc(e.sub)}</small>` : ""}`);
        it.addEventListener("click", () => {
          this.journalSel = e.id;
          render();
        });
        list.appendChild(it);
      }
      const cur = entries.find((e) => e.id === this.journalSel);
      det.innerHTML = cur ? cur.body() : "";
      det.querySelectorAll("[data-track]").forEach((b) =>
        b.addEventListener("click", () => {
          G.state.data.trackedQuest = (b as HTMLElement).dataset.track!;
          this.hud.refresh();
          render();
        }),
      );
    };
    render();
    this.openModal("journal", el);
  }

  // -------------------------------------------------------------------------
  // Fähigkeiten
  // -------------------------------------------------------------------------

  openAbilities(): void {
    const el = h("div", "screen");
    const book = h("div", "book panel");
    book.style.gridTemplateRows = "auto 1fr auto";
    el.appendChild(book);
    const render = () => {
      const order = ["bloodsight", "nightvision", "shadowrun", "bloodmemory", "bloodhunger", "bloodpush", "regen"];
      book.innerHTML = `<div class="tabs"><div class="tab on">Fähigkeiten des Blutes</div></div><div class="list" style="overflow-y:auto;padding:10px 30px"></div><div class="footer">Klicke auf eine aktive Fähigkeit, um sie auf [Q] zu legen · K – schließen</div>`;
      const list = book.querySelector(".list")!;
      for (const id of order) {
        const a = ABILITIES[id];
        const has = G.abilities.has(id);
        const row = h("div", "ab" + (has ? "" : " locked") + (G.abilities.selected === id ? " sel" : ""), `
          <div class="ico">${pathIcon(a.icon)}</div>
          <div><h3>${has ? a.name : "Noch verborgen"}${has && a.key ? `<span class="k">[${a.key}]</span>` : ""}</h3>
          <p>${has ? esc(a.desc) : "Diese Gabe schläft noch in deinem Blut."}</p>${has ? `<p style="font-size:16px">${esc(a.detail)}</p>` : ""}</div>`);
        if (has && a.active) {
          row.style.cursor = "pointer";
          row.addEventListener("click", () => {
            G.abilities.select(id);
            render();
          });
        }
        list.appendChild(row);
      }
      const hv = Math.round(G.abilities.hunger);
      const hint = h("div", "", `<p style="text-align:center;color:var(--ink-dim);margin:16px 0 0">Blutdurst: <b style="color:${hv > 75 ? "#e05050" : "var(--ink)"}">${hv} %</b> – ${hv < 30 ? "gesättigt, klar" : hv < 60 ? "wach, hungrig" : hv < 85 ? "die Sinne brennen" : "der Hunger spricht mit deiner Stimme"}</p>`);
      list.appendChild(hint);
    };
    render();
    this.openModal("abilities", el);
  }

  // -------------------------------------------------------------------------
  // Dokumente
  // -------------------------------------------------------------------------

  openDocument(doc: DocumentDef, fromInventory = false): void {
    const el = h("div", "screen");
    const paper = h("div", "doc", `<h2>${esc(doc.title)}</h2>${doc.author ? `<div class="author">${esc(doc.author)}</div>` : ""}${doc.body
      .split("\n\n")
      .map((p) => (p.startsWith("~") ? `<p class="torn">${esc(p.slice(1))}</p>` : `<p>${esc(p)}</p>`))
      .join("")}<div class="close">E · Escape · Klick – schließen</div>`);
    el.appendChild(paper);
    const close = () => {
      this.docClose = null;
      this.closeModal();
      if (fromInventory) this.openInventory();
    };
    this.docClose = close;
    el.addEventListener("click", close);
    this.openModal("document", el, fromInventory);
    if (fromInventory) this.modalStack = [];
  }

  // -------------------------------------------------------------------------
  // Tod & Enden
  // -------------------------------------------------------------------------

  showDeath(onRetry: () => void): void {
    const el = h("div", "", `<h1>Die Dunkelheit nimmt dich</h1><p>Doch Blut vergisst nicht. Es ruft dich zurück.</p><div class="actions" style="margin-top:30px;display:flex;gap:16px"></div>`);
    el.id = "death";
    const b = h("button", "btn small", "Vom letzten Erwachen fortfahren");
    b.addEventListener("click", () => {
      this.closeModal(false);
      onRetry();
    });
    const m = h("button", "btn small", "Hauptmenü");
    m.addEventListener("click", () => {
      this.closeModal(false);
      this.handlers.toMainMenu();
    });
    el.querySelector(".actions")!.append(b, m);
    this.openModal("death", el);
    requestAnimationFrame(() => (el.style.opacity = "1"));
  }

  async showEnding(eyebrow: string, title: string, pages: string[], onDone: () => void): Promise<void> {
    const el = h("div", "", `<div class="eyebrow">${esc(eyebrow)}</div><h1>${esc(title)}</h1><div class="page"></div><div class="actions"></div>`);
    el.id = "ending";
    this.openModal("ending", el);
    await new Promise((r) => requestAnimationFrame(r));
    el.style.opacity = "1";
    const page = el.querySelector(".page") as HTMLElement;
    const act = el.querySelector(".actions") as HTMLElement;
    let i = 0;
    const show = () => {
      page.style.opacity = "0";
      setTimeout(() => {
        page.innerHTML = pages[i].split("\n").map((p) => `<p>${esc(p)}</p>`).join("");
        page.style.opacity = "1";
        act.innerHTML = "";
        const b = h("button", "btn small", i < pages.length - 1 ? "Weiter" : "Zum Hauptmenü");
        b.addEventListener("click", () => {
          i++;
          if (i < pages.length) show();
          else {
            this.closeModal(false);
            onDone();
          }
        });
        act.appendChild(b);
      }, 900);
    };
    show();
  }

  update(dt: number): void {
    this.dialogue.update(dt);
    this.touch.update();
    if (!this.inMenu) this.hud.update(dt);
  }

  /** Öffnet ein Rätselfenster (vom PuzzleUI genutzt). */
  openPuzzle(el: HTMLElement): void {
    this.openModal("puzzle", el);
  }
}
