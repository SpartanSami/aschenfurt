import * as THREE from "three";
import { Level } from "../Level";
import { materials, SurfaceName } from "../../graphics/Materials";
import { terrain, deadTree, rock, mountains, grassField } from "../builders/Nature";
import { tower, battlements, wall } from "../builders/Architecture";
import { gravestone } from "../builders/Props";
import { FogBanks, Flock, CameraParticles } from "../../graphics/Effects";
import { G } from "../../core/Context";
import { fbm } from "../../graphics/Noise";

/** Hintergrund des Hauptmenüs: Burg Drakenfels unter dem roten Mond. */
export class MenuScene extends Level {
  readonly id = "menu";
  readonly chapter = 0;
  readonly title = "Hauptmenü";
  readonly location = "Burg Drakenfels";
  private flock!: Flock;
  private t = 0;

  override requiredSurfaces(): SurfaceName[] {
    return ["castleStoneDark", "roofSlate", "rock", "forest", "bark"];
  }

  async build(): Promise<void> {
    const moonDir = new THREE.Vector3(0.12, 0.3, -1).normalize();
    this.setupSky({ moonDir, redness: 0.95, cloudiness: 0.55, moonSize: 0.06, horizon: 0x1c0a10 });
    const h = (x: number, z: number) => {
      const d = Math.hypot(x, z + 75);
      const cliff = Math.max(0, 28 - d * 0.45) * 1.3;
      const n = (fbm(((x / 200) % 1 + 1) % 1, ((z / 200) % 1 + 1) % 1, 4, 4, 3) - 0.5) * 6;
      return cliff + n - 1;
    };
    terrain(this, materials.surface("forest"), 0, -40, 260, 220, 120, h);
    mountains(this, [0, 0, -60], 210, 70, 4, 0x07050a);
    // Burg auf dem Felsen
    const stone = materials.surface("castleStoneDark");
    const roof = materials.surface("roofSlate");
    const by = h(0, -75) - 1;
    tower(this, stone, roof, 0, -78, by, 5, 30, { windows: 6 });
    tower(this, stone, roof, -14, -70, by, 3.2, 20, { windows: 3 });
    tower(this, stone, roof, 13, -72, by, 3.5, 22, { windows: 4 });
    tower(this, stone, roof, -7, -90, by, 3, 26, { windows: 2 });
    tower(this, stone, roof, 9, -88, by, 2.6, 34, { windows: 2 });
    wall(this, stone, [-14, -70], [13, -72], by, 12, 2);
    wall(this, stone, [-14, -70], [-7, -90], by, 12, 2);
    wall(this, stone, [13, -72], [9, -88], by, 12, 2);
    battlements(this, stone, [-14, -70], [13, -72], by + 12, 2);
    this.box(stone, [0, by + 9, -82], [16, 18, 12]);
    // Vordergrund
    for (let i = 0; i < 9; i++) {
      const x = -22 + i * 5.5 + Math.sin(i * 3.1) * 3;
      const z = 6 + Math.cos(i * 2.3) * 8;
      gravestone(this, [x, h(x, z), z], Math.sin(i) * 0.4, i + 3, Math.sin(i * 7) * 0.15);
    }
    deadTree(this, [-16, h(-16, 14), 14], 9, 3);
    deadTree(this, [19, h(19, 8), 8], 11, 7);
    deadTree(this, [-30, h(-30, -10), -10], 13, 11);
    rock(this, [8, h(8, 18), 18], 1.8, 2);
    rock(this, [-8, h(-8, 24), 24], 1.2, 5);
    grassField(this, 900, { x0: -40, z0: -20, x1: 40, z1: 34 }, (x, z) => h(x, z), 3);
    const fb = new FogBanks(60, 0x6a5a66, 0.11);
    for (let i = 0; i < 60; i++) {
      const x = (Math.random() - 0.5) * 120, z = Math.random() * -90 + 30;
      fb.add(new THREE.Vector3(x, h(x, z) + 1.5, z), 18 + Math.random() * 14);
    }
    this.addFogBanks(fb);
    this.flock = new Flock(new THREE.Vector3(0, by + 32, -78), 16, 24);
    this.scene.add(this.flock.group);
    this.addParticles(new CameraParticles("ash", 300, 0x8a5050, 0.03, 30));
    this.setupMoonLight(0.9, 0x9a3a40, moonDir, { center: new THREE.Vector3(0, 10, -40), size: 140 });
    this.light({ pos: [0, by + 20, -70], color: new THREE.Color(1, 0.4, 0.2), intensity: 30, distance: 30, flicker: 0.3 });
    this.spawn("start", [0, h(0, 30) + 1.7, 30], 0);
  }

  start(): void {}

  applyEnv(): void {
    const fog = this.scene.fog as THREE.FogExp2;
    fog.color.set(0x140a10);
    fog.density = 0.0085;
    this.scene.background = new THREE.Color(0x0a0508);
    this.ambient.color.set(0x2a1a22);
    this.ambient.intensity = 0.5;
    this.hemi.color.set(0x4a2a3a);
    this.hemi.groundColor.set(0x0a0505);
    this.hemi.intensity = 0.6;
    G.renderer.baseExposure = 1.1;
  }

  override update(dt: number, t: number): void {
    super.update(dt, t);
    this.t += dt;
    const cam = G.camera;
    const a = this.t * 0.02;
    cam.position.set(Math.sin(a) * 6, 4.2 + Math.sin(this.t * 0.1) * 0.4, 30 + Math.cos(a) * 3);
    cam.lookAt(0, 16, -75);
    this.sky?.update(t, cam.position);
    this.flock.update(t);
    this.fogBanks?.update(t, cam);
    this.particles.forEach((p) => p.update(t, cam.position));
    this.lightPool.update(dt, t, cam.position, cam.getWorldDirection(new THREE.Vector3()));
  }
}
