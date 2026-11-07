import * as THREE from "three";
import { G } from "../core/Context";
import { input } from "../core/Input";
import { Character } from "../characters/Character";
import { PRESETS } from "../characters/Presets";
import { Werewolf } from "../characters/Creatures";
import { CapsuleBody, CircleCollider } from "../world/Collision";

export type EnemyKind = "hollow" | "corrupted" | "cultist" | "wolf" | "shade";
type EState = "idle" | "patrol" | "alert" | "chase" | "windup" | "strike" | "recover" | "stagger" | "dead" | "flee" | "subdued";

const KIND: Record<EnemyKind, { hp: number; speed: number; dmg: number; range: number; windup: number; sight: number; hearing: number; preset?: string }> = {
  hollow: { hp: 60, speed: 2.4, dmg: 18, range: 1.5, windup: 0.75, sight: 12, hearing: 7, preset: "hollow" },
  corrupted: { hp: 70, speed: 2.9, dmg: 20, range: 1.5, windup: 0.65, sight: 15, hearing: 9, preset: "corrupted" },
  cultist: { hp: 90, speed: 3.2, dmg: 24, range: 1.6, windup: 0.55, sight: 18, hearing: 10, preset: "cultist" },
  wolf: { hp: 220, speed: 5.6, dmg: 32, range: 2.0, windup: 0.5, sight: 22, hearing: 16 },
  shade: { hp: 40, speed: 3.6, dmg: 22, range: 1.5, windup: 0.6, sight: 20, hearing: 12, preset: "erste" },
};

export interface EnemyOpts {
  kind: EnemyKind;
  pos: THREE.Vector3;
  yaw?: number;
  patrol?: THREE.Vector3[];
  /** Ziel nur verfolgen, wenn Bedingung erfüllt */
  active?: () => boolean;
  onDeath?: (e: Enemy, how: "fight" | "takedown") => void;
  /** Mensch: Überwältigen tötet nicht, sondern betäubt */
  human?: boolean;
  aggressive?: boolean;
  leash?: number;
  scale?: number;
  takedownLabel?: string;
}

const _v = new THREE.Vector3();

export class Enemy {
  kind: EnemyKind;
  opts: EnemyOpts;
  model: Character | Werewolf;
  body: CapsuleBody;
  circle: CircleCollider;
  state: EState = "idle";
  hp: number;
  maxHp: number;
  private timer = 0;
  private patrolI = 0;
  private lastSeen = new THREE.Vector3();
  private strikeDone = false;
  yaw: number;
  alertness = 0;
  home: THREE.Vector3;

  constructor(o: EnemyOpts) {
    this.kind = o.kind;
    this.opts = o;
    const k = KIND[o.kind];
    this.hp = this.maxHp = k.hp;
    this.yaw = o.yaw ?? 0;
    this.home = o.pos.clone();
    if (o.kind === "wolf") this.model = new Werewolf({ corrupted: true, scale: o.scale ?? 1 });
    else this.model = new Character(PRESETS[k.preset!], { void: o.kind === "shade" });
    if (this.model instanceof Character) {
      this.model.turnToTarget = false;
      if (o.kind === "hollow") this.model.setPose("hangHead", true);
    }
    this.body = { pos: o.pos.clone(), vel: new THREE.Vector3(), radius: o.kind === "wolf" ? 0.5 : 0.33, height: o.kind === "wolf" ? 2.0 : 1.75, onGround: false };
    this.circle = { pos: this.body.pos, radius: this.body.radius, height: this.body.height, enabled: true, owner: this };
    this.body.self = this.circle;
    if (o.patrol?.length) this.state = "patrol";
    if (o.aggressive) this.state = "chase";
  }

  get pos(): THREE.Vector3 {
    return this.body.pos;
  }

  get alive(): boolean {
    return this.state !== "dead" && this.state !== "subdued";
  }

  private pose(p: Parameters<Character["setPose"]>[0]): void {
    if (this.model instanceof Character && this.model.pose !== p) this.model.setPose(p);
  }

  private wolf(s: Parameters<Werewolf["setState"]>[0]): void {
    if (this.model instanceof Werewolf) this.model.setState(s);
  }

  canSeePlayer(): boolean {
    const k = KIND[this.kind];
    const pp = G.player.position;
    const d = pp.distanceTo(this.pos);
    if (d > k.sight * (G.player.sneaking ? 0.6 : 1)) return false;
    const fwd = _v.set(Math.sin(this.yaw), 0, Math.cos(this.yaw));
    const to = pp.clone().sub(this.pos).setY(0).normalize();
    if (fwd.dot(to) < 0.35 && d > 2.5) return false;
    const eye = this.pos.clone().add(new THREE.Vector3(0, 1.6, 0));
    return G.level!.col.lineOfSight(eye, G.camera.position);
  }

  hears(): boolean {
    const d = G.player.position.distanceTo(this.pos);
    return d < KIND[this.kind].hearing * G.player.noise;
  }

  stagger(seconds: number, impulse?: THREE.Vector3): void {
    if (!this.alive) return;
    this.state = "stagger";
    this.timer = this.kind === "wolf" ? seconds * 0.45 : seconds;
    if (impulse) this.body.vel.add(impulse.clone().multiplyScalar(this.kind === "wolf" ? 0.35 : 1));
    this.pose("cower");
    this.wolf("stagger");
  }

  damage(n: number): void {
    if (!this.alive) return;
    this.hp -= n;
    if (this.hp <= 0) this.die("fight");
  }

  die(how: "fight" | "takedown"): void {
    if (!this.alive) return;
    this.state = this.opts.human && how === "takedown" ? "subdued" : "dead";
    this.circle.enabled = false;
    this.pose(this.state === "subdued" ? "slump" : "lie");
    this.wolf("dead");
    if (this.model instanceof Character) this.model.locomotion = 0;
    if (this.model instanceof Werewolf) this.model.locomotion = 0;
    this.opts.onDeath?.(this, how);
    G.combat.onEnemyDown(this);
  }

  update(dt: number): void {
    const k = KIND[this.kind];
    const pp = G.player.position;
    const d = pp.distanceTo(this.pos);
    const active = this.opts.active ? this.opts.active() : true;
    let move = new THREE.Vector3();
    let speed = 0;
    this.timer -= dt;
    if (this.alive && active && G.player.health > 0) {
      const sees = this.canSeePlayer();
      if (sees || (this.hears() && d < k.hearing)) {
        this.alertness = Math.min(1, this.alertness + dt * (sees ? 2.5 : 1.2));
        this.lastSeen.copy(pp);
      } else this.alertness = Math.max(0, this.alertness - dt * 0.25);
    }
    switch (this.state) {
      case "idle":
      case "patrol":
        if (this.alertness > 0.6 && active) {
          this.state = "alert";
          this.timer = 0.6;
          G.audio.sfx(this.kind === "wolf" ? "growl" : "hiss", this.pos);
          G.combat.engaged(this);
        } else if (this.state === "patrol" && this.opts.patrol) {
          const target = this.opts.patrol[this.patrolI];
          const to = target.clone().sub(this.pos).setY(0);
          if (to.length() < 0.6) this.patrolI = (this.patrolI + 1) % this.opts.patrol.length;
          move = to.normalize();
          speed = k.speed * 0.35;
        }
        break;
      case "alert":
        this.face(pp, dt * 6);
        if (this.timer <= 0) this.state = "chase";
        break;
      case "chase": {
        if (!active) {
          this.state = "idle";
          break;
        }
        const target = this.alertness > 0.2 ? this.lastSeen : this.home;
        const to = target.clone().sub(this.pos).setY(0);
        if (this.opts.leash && this.pos.distanceTo(this.home) > this.opts.leash) {
          move = this.home.clone().sub(this.pos).setY(0).normalize();
          speed = k.speed;
          if (this.alertness < 0.3) this.state = "idle";
        } else if (d < k.range && this.alertness > 0.2) {
          this.state = "windup";
          this.timer = k.windup;
          this.strikeDone = false;
          this.pose("raiseArms");
          this.wolf("crouch");
          G.audio.sfx(this.kind === "wolf" ? "growl" : "hiss", this.pos);
        } else if (to.length() > 0.5) {
          move = to.normalize();
          speed = k.speed;
        } else if (this.alertness <= 0.05) {
          this.state = "idle";
        }
        this.wolf(speed > 4 ? "run" : "prowl");
        break;
      }
      case "windup":
        this.face(pp, dt * 4);
        if (this.timer <= 0) {
          this.state = "strike";
          this.timer = 0.25;
          this.pose("reach");
          this.wolf("lunge");
          this.body.vel.add(new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw)).multiplyScalar(this.kind === "wolf" ? 7 : 4));
        }
        break;
      case "strike":
        if (!this.strikeDone && d < k.range + 0.6) {
          this.strikeDone = true;
          const fwd = new THREE.Vector3(Math.sin(this.yaw), 0, Math.cos(this.yaw));
          const to = pp.clone().sub(this.pos).setY(0).normalize();
          if (fwd.dot(to) > 0.3 && !G.player.dashing) {
            G.player.damage(k.dmg, this.pos);
            G.audio.sfx("hit", G.player.position);
          }
        }
        if (this.timer <= 0) {
          this.state = "recover";
          this.timer = this.kind === "wolf" ? 0.6 : 1.0;
          this.pose(this.kind === "hollow" ? "hangHead" : "guard");
          this.wolf("idle");
        }
        break;
      case "recover":
        if (this.timer <= 0) this.state = "chase";
        break;
      case "stagger":
        if (this.timer <= 0) {
          this.state = "chase";
          this.pose(this.kind === "hollow" ? "hangHead" : "guard");
          this.wolf("idle");
        }
        break;
      case "flee": {
        move = this.pos.clone().sub(pp).setY(0).normalize();
        speed = k.speed * 1.2;
        if (d > 25) this.state = "idle";
        break;
      }
      default:
        break;
    }
    // Bewegung mit Kollision
    if (this.alive || this.body.vel.lengthSq() > 0.01) {
      const h = move.multiplyScalar(speed);
      if (speed > 0.1) this.face(this.pos.clone().add(h), dt * 6);
      this.body.vel.x *= Math.exp(-dt * 4);
      this.body.vel.z *= Math.exp(-dt * 4);
      G.level!.col.move(this.body, h, Math.min(dt, 0.05), 2);
    }
    // Modell
    this.model.root.position.copy(this.pos);
    this.model.root.rotation.y = this.yaw;
    if (this.model instanceof Character) {
      this.model.locomotion = speed;
      this.model.faceTarget = this.alive && this.alertness > 0.3 ? G.camera.position : null;
    } else {
      this.model.locomotion = speed;
      this.model.faceTarget = this.alive ? G.camera.position : null;
    }
    this.model.update(dt, G.time);
  }

  private face(p: THREE.Vector3, k: number): void {
    const to = p.clone().sub(this.pos);
    const target = Math.atan2(to.x, to.z);
    let dy = target - this.yaw;
    while (dy > Math.PI) dy -= Math.PI * 2;
    while (dy < -Math.PI) dy += Math.PI * 2;
    this.yaw += dy * Math.min(1, k);
  }

  dispose(): void {
    this.model.dispose();
  }
}

/** Seltene, bedeutsame Kämpfe: Blutstoß, Überwältigen, Regeneration, Ausweichen. */
export class CombatSystem {
  enemies: Enemy[] = [];
  private pushCd = 0;
  private regenFx = 0;
  inCombat = false;
  private combatTimer = 0;
  private takedown: Enemy | null = null;

  spawn(o: EnemyOpts): Enemy {
    const e = new Enemy(o);
    G.level!.scene.add(e.model.root);
    G.level!.col.circles.push(e.circle);
    this.enemies.push(e);
    return e;
  }

  clear(): void {
    for (const e of this.enemies) e.dispose();
    this.enemies = [];
    this.inCombat = false;
  }

  remove(e: Enemy): void {
    e.dispose();
    this.enemies = this.enemies.filter((x) => x !== e);
    if (G.level) G.level.col.circles = G.level.col.circles.filter((c) => c !== e.circle);
  }

  engaged(_e: Enemy): void {
    this.combatTimer = 8;
    if (!this.inCombat) {
      this.inCombat = true;
      G.levels.playMusic("combat");
    }
  }

  onEnemyDown(_e: Enemy): void {
    if (!this.enemies.some((x) => x.alive && (x.state === "chase" || x.state === "windup" || x.state === "strike"))) this.combatTimer = Math.min(this.combatTimer, 2);
  }

  /** Gegner in Reichweite, die überwältigt werden können. */
  takedownTarget(): Enemy | null {
    const cam = G.camera;
    const fwd = new THREE.Vector3();
    cam.getWorldDirection(fwd);
    let best: Enemy | null = null;
    let bd = 2.4;
    for (const e of this.enemies) {
      if (!e.alive) continue;
      const vulnerable = e.state === "stagger" || (e.state !== "chase" && e.state !== "strike" && e.state !== "windup" && e.alertness < 0.3 && e.kind !== "wolf");
      if (!vulnerable) continue;
      const to = e.pos.clone().add(new THREE.Vector3(0, 1.2, 0)).sub(cam.position);
      const d = to.length();
      if (d < bd && to.normalize().dot(fwd) > 0.6) {
        best = e;
        bd = d;
      }
    }
    return best;
  }

  update(dt: number): void {
    this.pushCd -= dt;
    const can = !G.player.locked && !G.dialogue.active && !G.story.busy && G.player.health > 0;
    // Blutstoß
    if (can && input.mousePressed[0] && input.looking && G.abilities.has("bloodpush") && this.pushCd <= 0) {
      this.pushCd = 1.1;
      G.abilities.addHunger(5);
      G.audio.sfx("push");
      G.renderer.uniforms.uPulse.value = 0.8;
      G.player.shake(0.03, 0.25);
      const fwd = new THREE.Vector3();
      G.camera.getWorldDirection(fwd);
      fwd.y = 0;
      fwd.normalize();
      for (const e of this.enemies) {
        if (!e.alive) continue;
        const to = e.pos.clone().sub(G.player.position).setY(0);
        const d = to.length();
        if (d < 5 && to.normalize().dot(fwd) > 0.45) {
          e.stagger(2.6, to.multiplyScalar(10 - d));
          e.damage(22);
          e.alertness = 1;
          this.engaged(e);
        }
      }
      G.ui.hud.showAbilityFlash("bloodpush");
    }
    // Überwältigen
    const td = can ? this.takedownTarget() : null;
    this.takedown = td;
    if (td) G.ui.hud.setPrompt(td.opts.takedownLabel ?? (td.opts.human ? "Überwältigen (verschonen)" : "Überwältigen"));
    if (td && input.wasPressed("KeyE")) {
      input.consume("KeyE");
      this.doTakedown(td);
    }
    // Regeneration
    if (can && G.abilities.has("regen") && input.isDown("KeyR") && G.player.health < G.player.maxHealth && G.abilities.hunger < 99) {
      G.player.heal(dt * 28);
      G.abilities.addHunger(dt * 11);
      this.regenFx -= dt;
      if (this.regenFx <= 0) {
        this.regenFx = 1.2;
        G.audio.sfx("regen");
      }
      G.renderer.uniforms.uPulse.value = Math.max(G.renderer.uniforms.uPulse.value, 0.15);
    }
    for (const e of this.enemies) e.update(dt);
    if (this.inCombat) {
      this.combatTimer -= dt;
      if (this.enemies.some((e) => e.alive && e.alertness > 0.5)) this.combatTimer = Math.max(this.combatTimer, 3);
      if (this.combatTimer <= 0) {
        this.inCombat = false;
        G.levels.playMusic(G.level?.music ?? "castle");
      }
    }
  }

  private doTakedown(e: Enemy): void {
    G.story.cutscene(async () => {
      G.player.lookAt(e.pos.clone().add(new THREE.Vector3(0, 1.3, 0)), 8);
      G.audio.sfx("feed");
      G.renderer.uniforms.uPulse.value = 1;
      await G.game.wait(0.5);
      e.die("takedown");
      if (!e.opts.human) {
        G.abilities.addHunger(-22);
        G.player.heal(30);
        G.state.inc("fed");
      } else {
        G.abilities.addHunger(-6);
      }
      await G.game.wait(0.7);
    });
  }

  get hasTakedown(): boolean {
    return !!this.takedown;
  }
}
