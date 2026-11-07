import { G } from "../core/Context";
import { events } from "../core/EventBus";
import type { DialogueDef, DNode, DChoice } from "./types";
import { DIALOGUES } from "./data/dialogues";
import type { Character } from "../characters/Character";

export interface ShownChoice {
  choice: DChoice;
  index: number;
  locked: boolean;
}

/** Verzweigte Dialoge mit Entscheidungen, Bedingungen und Konsequenzen. */
export class DialogueSystem {
  active = false;
  def: DialogueDef | null = null;
  nodeId = "";
  node: DNode | null = null;
  partner: Character | null = null;
  choices: ShownChoice[] = [];
  private resolve: (() => void) | null = null;
  private voiceTimer = 0;
  private canAdvanceAt = 0;

  get registry(): Record<string, DialogueDef> {
    return DIALOGUES;
  }

  start(id: string, partner: Character | null = null): Promise<void> {
    const def = DIALOGUES[id];
    if (!def) {
      console.warn("[Dialog] unbekannt:", id);
      return Promise.resolve();
    }
    if (this.active) this.end();
    this.def = def;
    this.partner = partner;
    this.active = true;
    G.player.locked = true;
    G.abilities.setBloodSight(false);
    G.audio.duck(true);
    G.ui.dialogue.open();
    events.emit("dialogue:start", { dialogueId: id });
    if (partner) {
      G.player.lookAt(partner.headWorld(), 3);
      partner.faceTarget = G.camera.position;
    }
    const startId = typeof def.start === "function" ? def.start() : def.start;
    this.show(startId);
    return new Promise((r) => (this.resolve = r));
  }

  private show(id: string): void {
    if (!this.def) return;
    if (id === "end" || !this.def.nodes[id]) {
      if (id !== "end") console.warn("[Dialog] Knoten fehlt:", this.def.id, id);
      this.end();
      return;
    }
    this.nodeId = id;
    const node = this.def.nodes[id];
    this.node = node;
    try {
      node.do?.();
    } catch (err) {
      console.error("[Dialog] Aktion", this.def.id, id, err);
    }
    if (!this.active) return;
    // Weiche ohne eigenen Text: direkt weiter
    if (!node.text && !(node.choices && node.choices.length)) {
      const n = node.next;
      this.show(typeof n === "function" ? n() : n ?? "end");
      return;
    }
    const h = G.abilities.hunger;
    this.choices = (node.choices ?? [])
      .map((c, index) => {
        const usedOnce = c.once && G.state.data.dialogueSeen[this.onceKey(c.text)];
        let ok = (!c.if || c.if()) && !usedOnce;
        if (c.hungerMin !== undefined && h < c.hungerMin) ok = false;
        return { choice: c, index, locked: !ok };
      })
      .filter((c) => !c.locked || (c.choice.lockedHint && !(c.choice.once && G.state.data.dialogueSeen[this.onceKey(c.choice.text)])));
    G.ui.dialogue.showNode(node, this.choices);
    this.canAdvanceAt = performance.now() + 350;
    // Sprachausgabe & Mimik
    const lineId = `${this.def.id}.${id}`;
    const speakerChar = this.partner && node.speaker !== "sami" ? this.partner : null;
    speakerChar?.setMood(node.mood ?? "neutral");
    const estimate = Math.max(2.2, node.text.length * 0.055);
    G.audio.voice(lineId, node.speaker).then((dur) => {
      const d = dur ?? estimate;
      if (speakerChar) speakerChar.talk(d);
    });
    this.voiceTimer = estimate;
  }

  /** „once“-Antworten gelten pro Dialog und Antworttext – auch wenn dieselbe Antwort in mehreren Knoten angeboten wird. */
  private onceKey(text: string): string {
    return `c:${this.def!.id}:${text}`;
  }

  advance(): void {
    if (!this.active || !this.node || this.choices.some((c) => !c.locked)) return;
    if (performance.now() < this.canAdvanceAt) return;
    const n = this.node.next;
    const next = typeof n === "function" ? n() : n ?? "end";
    G.audio.stopVoice();
    this.show(next);
  }

  choose(i: number): void {
    if (!this.active || !this.def) return;
    const c = this.choices.find((x) => x.index === i);
    if (!c || c.locked) return;
    if (performance.now() < this.canAdvanceAt) return;
    const onceKey = this.onceKey(c.choice.text);
    if (c.choice.once) G.state.data.dialogueSeen[onceKey] = 1;
    G.audio.stopVoice();
    G.audio.sfx("uiClick");
    try {
      c.choice.do?.();
    } catch (err) {
      console.error("[Dialog] Auswahl", onceKey, err);
    }
    if (!this.active) return; // Aktion hat Dialog beendet
    this.show(c.choice.next ?? "end");
  }

  end(): void {
    if (!this.active) return;
    const def = this.def!;
    this.active = false;
    G.state.data.dialogueSeen[def.id] = (G.state.data.dialogueSeen[def.id] ?? 0) + 1;
    G.ui.dialogue.close();
    G.audio.stopVoice();
    G.audio.duck(false);
    G.player.locked = false;
    G.player.lookAt(null);
    if (this.partner) {
      this.partner.faceTarget = null;
      this.partner.setMood("neutral");
    }
    this.def = null;
    this.node = null;
    this.partner = null;
    events.emit("dialogue:end", { dialogueId: def.id });
    try {
      def.onEnd?.();
    } catch (err) {
      console.error("[Dialog] onEnd", def.id, err);
    }
    const r = this.resolve;
    this.resolve = null;
    r?.();
  }

  seen(id: string): number {
    return G.state.data.dialogueSeen[id] ?? 0;
  }

  update(dt: number): void {
    this.voiceTimer -= dt;
    if (this.active && this.partner) this.partner.faceTarget = G.camera.position;
  }
}
