import { G } from "../core/Context";
import { ENDINGS, EndingId } from "./data/endings";

const KEY = "bloodmoon.endings.v1";

/** Bestimmt verfügbare Enden, spielt den Epilog und merkt sich entdeckte Enden. */
export class EndingManager {
  seen(): EndingId[] {
    try {
      return JSON.parse(localStorage.getItem(KEY) ?? "[]");
    } catch {
      return [];
    }
  }

  markSeen(id: EndingId): void {
    const s = new Set(this.seen());
    s.add(id);
    try {
      localStorage.setItem(KEY, JSON.stringify([...s]));
    } catch {
      /* */
    }
  }

  available(id: EndingId): boolean {
    return ENDINGS[id].available();
  }

  missingFor(id: EndingId): string[] {
    return ENDINGS[id].missing?.() ?? [];
  }

  async play(id: EndingId): Promise<void> {
    const e = ENDINGS[id];
    G.state.set("ending", id);
    this.markSeen(id);
    G.audio.music?.play(e.music, 4);
    const pages = e.pages();
    const seen = this.seen();
    pages.push(`Entdeckte Enden: ${seen.length} von 3\n${(["blutlinie", "herrschaft", "erbe"] as EndingId[]).map((x) => (seen.includes(x) ? ENDINGS[x].title : "???")).join(" · ")}`);
    await new Promise<void>((resolve) => G.ui.showEnding(e.eyebrow, e.title, pages, resolve));
    G.save.remove("auto");
    G.game.toMainMenu();
  }
}
