import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { FXAAPass } from "three/examples/jsm/postprocessing/FXAAPass.js";
import { GradeShader } from "./PostFX";
import { settings, qualityProfiles } from "../core/Settings";

export class Renderer {
  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  scene: THREE.Scene = new THREE.Scene();
  composer!: EffectComposer;
  renderPass!: RenderPass;
  bloom!: UnrealBloomPass;
  grade!: ShaderPass;
  fxaa!: FXAAPass;
  baseExposure = 1.0;
  /** Zusätzliche Belichtung (Nachtsicht etc.). */
  exposureBoost = 0;
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
    const q = qualityProfiles[settings.data.quality];
    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      powerPreference: "high-performance",
      stencil: false,
      preserveDrawingBuffer: false,
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    this.renderer.shadowMap.enabled = q.shadows;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.domElement.id = "game-canvas";
    container.appendChild(this.renderer.domElement);

    this.camera = new THREE.PerspectiveCamera(settings.data.fov, 16 / 9, 0.05, 600);
    this.camera.rotation.order = "YXZ";

    this.buildComposer();
    window.addEventListener("resize", () => this.resize());
    this.resize();
  }

  private buildComposer(): void {
    const q = qualityProfiles[settings.data.quality];
    this.composer = new EffectComposer(this.renderer);
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);
    this.bloom = new UnrealBloomPass(new THREE.Vector2(512, 512), 0.5, 0.5, 0.92);
    this.bloom.enabled = q.bloom;
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.grade = new ShaderPass(GradeShader);
    this.composer.addPass(this.grade);
    this.fxaa = new FXAAPass();
    this.fxaa.enabled = q.antialias;
    this.composer.addPass(this.fxaa);
  }

  get uniforms(): typeof GradeShader.uniforms {
    return this.grade.uniforms as typeof GradeShader.uniforms;
  }

  setScene(scene: THREE.Scene): void {
    this.scene = scene;
    this.renderPass.scene = scene;
  }

  applySettings(): void {
    const q = qualityProfiles[settings.data.quality];
    this.renderer.shadowMap.enabled = q.shadows;
    this.bloom.enabled = q.bloom;
    this.fxaa.enabled = q.antialias;
    this.camera.fov = settings.data.fov;
    this.uniforms.uBrightness.value = settings.data.brightness;
    this.resize();
    // Schatten-Materialien müssen neu kompiliert werden
    this.scene.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
      if (!m) return;
      (Array.isArray(m) ? m : [m]).forEach((mm) => (mm.needsUpdate = true));
    });
  }

  resize(): void {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    const q = qualityProfiles[settings.data.quality];
    const pr = Math.min(window.devicePixelRatio || 1, 2) * q.pixelRatio * settings.data.renderScale;
    this.renderer.setPixelRatio(pr);
    this.renderer.setSize(w, h, false);
    this.renderer.domElement.style.width = w + "px";
    this.renderer.domElement.style.height = h + "px";
    this.composer.setPixelRatio(pr);
    this.composer.setSize(w, h);
    this.bloom.resolution.set(w * pr * 0.5, h * pr * 0.5);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.uniforms.uResolution.value.set(w * pr, h * pr);
  }

  render(dt: number, time: number): void {
    this.uniforms.uTime.value = time;
    this.renderer.toneMappingExposure = this.baseExposure * (1 + this.exposureBoost);
    this.composer.render(dt);
  }
}
