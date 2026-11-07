import * as THREE from "three";
import { input } from "../core/Input";
import { settings } from "../core/Settings";
import { G } from "../core/Context";
import { CapsuleBody } from "../world/Collision";
import { events } from "../core/EventBus";

const WALK = 2.5;
const SPRINT = 4.6;
const SNEAK = 1.25;
const EYE = 1.64;
const EYE_SNEAK = 1.18;

export class PlayerController {
  body: CapsuleBody = {
    pos: new THREE.Vector3(),
    vel: new THREE.Vector3(),
    radius: 0.32,
    height: 1.78,
    onGround: false,
  };
  yaw = 0;
  pitch = 0;
  /** Bewegung gesperrt (Dialog, Zwischensequenz) */
  locked = false;
  /** Blick gesperrt */
  lookLocked = false;
  sneaking = false;
  sprinting = false;
  moving = false;
  speed = 0;
  /** Lärmpegel 0..1 für Gegner-KI */
  noise = 0;
  eye = EYE;
  health = 100;
  maxHealth = 100;
  lastDamage = -100;
  private bob = 0;
  private stepAcc = 0;
  private shakeAmt = 0;
  private shakeTime = 0;
  private roll = 0;
  private dashTime = 0;
  private dashDir = new THREE.Vector3();
  private lookTarget: THREE.Vector3 | null = null;
  private lookSpeed = 2;
  private moveVec = new THREE.Vector3();
  private velSmooth = new THREE.Vector3();
  private sneakToggle = false;
  speedMul = 1;
  invulnerable = false;
  lastSafe = new THREE.Vector3();

  get position(): THREE.Vector3 {
    return this.body.pos;
  }

  teleport(pos: THREE.Vector3, yaw?: number, pitch = 0): void {
    this.body.pos.copy(pos);
    this.body.vel.set(0, 0, 0);
    this.velSmooth.set(0, 0, 0);
    this.body.onGround = false;
    if (yaw !== undefined) this.yaw = yaw;
    this.pitch = pitch;
    this.lastSafe.copy(pos);
    this.applyCamera(0);
  }

  /** Kamera sanft auf einen Punkt richten (für Inszenierungen). */
  lookAt(p: THREE.Vector3 | null, speed = 2.5): void {
    this.lookTarget = p ? p.clone() : null;
    this.lookSpeed = speed;
  }

  shake(amount: number, duration = 0.5): void {
    this.shakeAmt = Math.max(this.shakeAmt, amount);
    this.shakeTime = Math.max(this.shakeTime, duration);
  }

  dash(dir: THREE.Vector3, duration = 0.32): void {
    this.dashDir.copy(dir).setY(0).normalize();
    this.dashTime = duration;
  }

  get dashing(): boolean {
    return this.dashTime > 0;
  }

  damage(amount: number, from?: THREE.Vector3): void {
    if (this.invulnerable || this.health <= 0) return;
    this.health = Math.max(0, this.health - amount);
    this.lastDamage = G.time;
    this.shake(0.06, 0.35);
    G.audio.sfx("hurt");
    if (from) {
      const push = this.body.pos.clone().sub(from).setY(0).normalize().multiplyScalar(3);
      this.body.vel.add(push);
    }
    events.emit("player:damaged", { amount, health: this.health });
    if (this.health <= 0) events.emit("player:died", {});
  }

  heal(amount: number): void {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  update(dt: number): void {
    const cam = G.camera;
    const s = settings.data;
    // Blick
    if (!this.lookLocked && input.locked) {
      const sens = 0.0021 * s.sensitivity;
      this.yaw -= input.mouseDX * sens;
      this.pitch -= input.mouseDY * sens * (s.invertY ? -1 : 1);
      this.pitch = THREE.MathUtils.clamp(this.pitch, -1.45, 1.45);
    }
    if (this.lookTarget) {
      const to = this.lookTarget.clone().sub(cam.position);
      const targetYaw = Math.atan2(-to.x, -to.z);
      const targetPitch = Math.atan2(to.y, Math.hypot(to.x, to.z));
      let dy = targetYaw - this.yaw;
      while (dy > Math.PI) dy -= Math.PI * 2;
      while (dy < -Math.PI) dy += Math.PI * 2;
      const k = 1 - Math.exp(-dt * this.lookSpeed);
      this.yaw += dy * k;
      this.pitch += (targetPitch - this.pitch) * k;
    }

    // Bewegung
    let fwd = 0, side = 0;
    const canMove = !this.locked && input.enabled;
    if (canMove) {
      if (input.isDown("KeyW") || input.isDown("ArrowUp")) fwd += 1;
      if (input.isDown("KeyS") || input.isDown("ArrowDown")) fwd -= 1;
      if (input.isDown("KeyA") || input.isDown("ArrowLeft")) side -= 1;
      if (input.isDown("KeyD") || input.isDown("ArrowRight")) side += 1;
      if (input.wasPressed("KeyC")) this.sneakToggle = !this.sneakToggle;
    }
    const ctrl = canMove && (input.isDown("ControlLeft") || input.isDown("ControlRight"));
    this.sneaking = ctrl || this.sneakToggle;
    this.sprinting = canMove && !this.sneaking && (input.isDown("ShiftLeft") || input.isDown("ShiftRight")) && fwd > 0;
    const target = this.sneaking ? SNEAK : this.sprinting ? SPRINT : WALK;
    this.moveVec.set(side, 0, -fwd);
    if (this.moveVec.lengthSq() > 1) this.moveVec.normalize();
    this.moveVec.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw).multiplyScalar(target * this.speedMul);
    // Beschleunigung / Abbremsen
    const accel = this.body.onGround ? 12 : 3;
    this.velSmooth.lerp(this.moveVec, 1 - Math.exp(-accel * dt));
    if (this.dashTime > 0) {
      this.dashTime -= dt;
      this.velSmooth.copy(this.dashDir).multiplyScalar(15);
    }
    this.speed = this.velSmooth.length();
    this.moving = this.speed > 0.3;

    if (G.level) {
      G.level.col.move(this.body, this.velSmooth, Math.min(dt, 0.05), 4);
      // Absturzsicherung
      if (this.body.pos.y < -40) this.teleport(this.lastSafe.clone().add(new THREE.Vector3(0, 0.5, 0)), this.yaw);
      else if (this.body.onGround && G.time % 1 < dt) this.lastSafe.copy(this.body.pos);
    }

    // Lärm
    const n = !this.moving ? 0.05 : this.sneaking ? 0.15 : this.sprinting ? 1 : 0.45;
    this.noise += (n - this.noise) * Math.min(1, dt * 4);

    // Schritte
    if (this.moving && this.body.onGround) {
      const stride = this.sneaking ? 0.75 : this.sprinting ? 0.62 : 0.68;
      this.stepAcc += (this.speed * dt) / stride;
      if (this.stepAcc >= 1) {
        this.stepAcc -= 1;
        G.audio.footstep(G.audio.surface, this.sneaking ? 0.35 : this.sprinting ? 1.1 : 0.75);
      }
      this.bob += dt * this.speed * 2.6;
    } else {
      this.stepAcc = 0.6;
    }

    // Gesundheit regeneriert langsam (vampirisch), wenn kein Kampf
    if (G.time - this.lastDamage > 6 && this.health < this.maxHealth && this.health > 0) this.heal(dt * 3);

    this.applyCamera(dt);
  }

  private applyCamera(dt: number): void {
    const cam = G.camera;
    const targetEye = this.sneaking ? EYE_SNEAK : EYE;
    this.eye += (targetEye - this.eye) * Math.min(1, dt * 8);
    const bobOn = settings.data.headBob ? 1 : 0;
    const amp = this.moving && this.body.onGround ? (this.sprinting ? 0.045 : 0.025) * bobOn : 0;
    const by = Math.sin(this.bob * 2) * amp;
    const bx = Math.cos(this.bob) * amp * 0.6;
    let sx = 0, sy = 0;
    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      sx = (Math.random() - 0.5) * this.shakeAmt;
      sy = (Math.random() - 0.5) * this.shakeAmt;
      if (this.shakeTime <= 0) this.shakeAmt = 0;
    }
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    cam.position.set(this.body.pos.x, this.body.pos.y + this.eye + by, this.body.pos.z).addScaledVector(right, bx);
    const strafeRoll = -this.velSmooth.dot(right) * 0.004 * bobOn;
    this.roll += (strafeRoll - this.roll) * Math.min(1, dt * 6);
    cam.rotation.set(this.pitch + sy, this.yaw + sx, this.roll);
  }

  forward(out = new THREE.Vector3()): THREE.Vector3 {
    return out.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
  }
}
