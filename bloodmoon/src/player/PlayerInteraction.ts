import * as THREE from "three";
import { G } from "../core/Context";
import { input } from "../core/Input";
import type { Interactable } from "../world/Level";

const _fwd = new THREE.Vector3();
const _to = new THREE.Vector3();

/** Findet das anvisierte interaktive Objekt und zeigt einen dezenten Hinweis. */
export class PlayerInteraction {
  focus: Interactable | null = null;
  private cooldown = 0;

  update(dt: number): void {
    this.cooldown -= dt;
    const L = G.level;
    if (!L || G.player.locked || G.dialogue.active || G.story.busy || G.combat.hasTakedown) {
      this.setFocus(null);
      return;
    }
    const cam = G.camera;
    cam.getWorldDirection(_fwd);
    let best: Interactable | null = null;
    let bestScore = -Infinity;
    const blood = G.abilities.bloodSightLevel > 0.5;
    for (const it of L.interactables) {
      if (it.bloodSightOnly && !blood) continue;
      if (!it.enabled()) continue;
      _to.subVectors(it.pos, cam.position);
      const d = _to.length();
      if (d > it.radius) continue;
      const cos = d > 0.001 ? _to.dot(_fwd) / d : 1;
      // Großzügigerer Kegel aus der Nähe
      const need = (it.angle ?? 0.9) - Math.max(0, (1.2 - d) * 0.25);
      if (cos < need) continue;
      const score = cos * 2 - d * 0.15;
      if (score <= bestScore) continue;
      // Verdeckung prüfen (leicht vor dem Ziel enden)
      const end = it.pos.clone().addScaledVector(_to.normalize(), -0.25);
      if (!L.col.lineOfSight(cam.position, end)) continue;
      best = it;
      bestScore = score;
    }
    this.setFocus(best);
    if (best && input.wasPressed("KeyE") && this.cooldown <= 0) {
      this.cooldown = 0.25;
      input.consume("KeyE");
      try {
        best.onInteract();
      } catch (err) {
        console.error("[Interaktion]", best.id, err);
      }
    }
  }

  private setFocus(it: Interactable | null): void {
    this.focus = it;
    if (G.combat.hasTakedown) return;
    const prompt = it ? (typeof it.prompt === "function" ? it.prompt() : it.prompt) : "";
    G.ui.hud.setPrompt(prompt);
  }
}
