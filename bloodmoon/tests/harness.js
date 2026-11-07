// Test-Hilfsfunktionen, die im Browserkontext installiert werden.
window.T = {
  G: () => window.BLOODMOON.G,
  sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
  async waitIdle(max = 120000) {
    const G = this.G();
    const t0 = Date.now();
    while ((G.story.busy || G.levels.loading) && Date.now() - t0 < max) await this.sleep(200);
  },
  /** Dialog automatisch durchklicken. prefer: Liste von Textfragmenten, die bevorzugt gewählt werden. */
  async dialogue(prefer = [], max = 90000) {
    const G = this.G();
    const t0 = Date.now();
    const log = [];
    while (G.dialogue.active && Date.now() - t0 < max) {
      const ch = G.dialogue.choices.filter((c) => !c.locked);
      if (ch.length) {
        let pick = ch[0];
        for (const p of prefer) {
          const f = ch.find((c) => c.choice.text.includes(p));
          if (f) { pick = f; break; }
        }
        log.push(G.dialogue.nodeId + " -> " + pick.choice.text.slice(0, 40));
        await this.sleep(400);
        G.dialogue.choose(pick.index);
      } else {
        await this.sleep(400);
        G.dialogue.advance();
      }
      await this.sleep(100);
    }
    return log;
  },
  async interact(id) {
    const G = this.G();
    const it = G.level.interactables.find((i) => i.id === id);
    if (!it) return "no interactable " + id;
    const r = it.onInteract();
    if (r && r.then) await r;
    return "ok " + id;
  },
};
"harness ok";
Object.assign(window.T, {
  NAMES: { mond: "Mond", rabe: "Rabe", krone: "Krone", wolf: "Wolf", schlange: "Schlange", rose: "Rose", tropfen: "Blutstropfen", auge: "Auge" },
  async solveDials(syms) {
    await this.sleep(500);
    const dials = [...document.querySelectorAll(".puzzle .dial")];
    if (!dials.length) return "no dials";
    for (let i = 0; i < syms.length; i++) {
      const want = this.NAMES[syms[i]];
      for (let k = 0; k < 10; k++) {
        const cur = dials[i].querySelector(".lbl2").textContent;
        if (cur === want) break;
        dials[i].querySelectorAll(".arrows button")[1].click();
        await this.sleep(30);
      }
    }
    [...document.querySelectorAll(".puzzle .actions button")].find((b) => b.textContent.includes("Einrasten")).click();
    await this.sleep(1800);
    return document.querySelector(".puzzle") ? "still open: " + document.querySelector(".puzzle .feedback").textContent : "solved";
  },
  async solveOrder(fragments) {
    await this.sleep(500);
    for (let target = 0; target < fragments.length; target++) {
      const frags = [...document.querySelectorAll(".puzzle .frag")];
      const idx = frags.findIndex((f) => f.textContent.includes(fragments[target]));
      if (idx !== target) {
        frags[idx].click();
        await this.sleep(50);
        [...document.querySelectorAll(".puzzle .frag")][target].click();
        await this.sleep(50);
      }
    }
    [...document.querySelectorAll(".puzzle .actions button")].find((b) => b.textContent.includes("So war es")).click();
    await this.sleep(1800);
    return document.querySelector(".puzzle") ? "still open: " + document.querySelector(".puzzle .feedback").textContent : "solved";
  },
  async playNotes(labels) {
    await this.sleep(500);
    const btns = [...document.querySelectorAll(".puzzle .keysrow button")];
    for (const l of labels) {
      btns.find((b) => b.textContent === l).click();
      await this.sleep(120);
    }
    await this.sleep(2200);
    return document.querySelector(".puzzle") ? "still open: " + document.querySelector(".puzzle .feedback").textContent : "solved";
  },
});
"harness2 ok";
