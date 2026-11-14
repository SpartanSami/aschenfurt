// Renderer mit Post-Processing: Szene + First-Person-Viewmodel, Bloom, Tonemapping und
// ein abschließender Effekt-Pass (Körnung, Vignette, Verletzungseffekte, Überblendungen).
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { Pass, FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { QUALITY, IS_TOUCH } from '../core/config.js';
import { GRID_UNIFORMS } from './materials.js';

class DualRenderPass extends Pass {
  constructor() { super(); this.needsSwap = false; this.clear = true; this.scene = null; this.camera = null; this.vmScene = null; this.vmCamera = null; this.extra = null; }
  render(renderer, writeBuffer, readBuffer) {
    const oldAuto = renderer.autoClear;
    renderer.autoClear = false;
    renderer.setRenderTarget(this.renderToScreen ? null : readBuffer);
    renderer.setClearColor(this.clearColor || 0x000000, 1);
    renderer.clear(true, true, true);
    if (this.scene && this.camera) { renderer.render(this.scene, this.camera); this.stats = { calls: renderer.info.render.calls, tris: renderer.info.render.triangles }; }
    if (this.vmScene && this.vmCamera) { renderer.clearDepth(); renderer.render(this.vmScene, this.vmCamera); }
    renderer.autoClear = oldAuto;
  }
}

const FinalShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uGrain: { value: 0.05 },
    uVignette: { value: 0.35 },
    uInjury: { value: 0 },
    uDamage: { value: 0 },
    uFade: { value: 0 },
    uFadeColor: { value: new THREE.Color(0, 0, 0) },
    uBright: { value: 1 },
    uRes: { value: new THREE.Vector2(1, 1) },
    uPulse: { value: 0 },
    uTint: { value: new THREE.Color(1, 1, 1) },
    uBlur: { value: 0 },
    uCam: { value: 0 },
    uGrade: { value: 1 },
  },
  vertexShader: /* glsl */`varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse; uniform float uTime, uGrain, uVignette, uInjury, uDamage, uFade, uBright, uPulse, uBlur, uCam, uGrade;
    uniform vec3 uFadeColor, uTint; uniform vec2 uRes; varying vec2 vUv;
    float hash(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
    void main(){
      vec2 uv = vUv;
      vec2 c = uv - 0.5;
      float r = length(c);
      // Überwachungskamera: Linsenverzerrung
      if (uCam > 0.5) { uv = 0.5 + c * (1.0 + 0.12 * r * r); }
      // leichte Farbsäume zum Bildrand hin (Objektiv), stärker bei Verletzung und Treffern
      float ca = (0.0035 + uInjury * 0.004 + uDamage * 0.012) * r;
      vec3 col;
      col.r = texture2D(tDiffuse, uv + c * ca).r;
      col.g = texture2D(tDiffuse, uv).g;
      col.b = texture2D(tDiffuse, uv - c * ca).b;
      // Unschärfe bei schwerer Verletzung (zu den Rändern hin)
      float bl = uBlur * smoothstep(0.15, 0.6, r);
      if (bl > 0.01) {
        vec3 acc = col; float px = bl * 3.0 / uRes.y;
        acc += texture2D(tDiffuse, uv + vec2(px, 0.0)).rgb; acc += texture2D(tDiffuse, uv - vec2(px, 0.0)).rgb;
        acc += texture2D(tDiffuse, uv + vec2(0.0, px)).rgb; acc += texture2D(tDiffuse, uv - vec2(0.0, px)).rgb;
        col = mix(col, acc / 5.0, clamp(bl, 0.0, 1.0));
      }
      col *= uTint;
      // Farbgebung: kühle, grünstichige Schatten, warme Lichter, sanfte S-Kurve
      float lum0 = dot(col, vec3(0.2126, 0.7152, 0.0722));
      vec3 tone = mix(vec3(0.93, 1.0, 1.07), vec3(1.05, 1.0, 0.92), smoothstep(0.03, 0.45, lum0));
      col *= mix(vec3(1.0), tone, uGrade);
      vec3 sc = clamp(col, 0.0, 1.0);
      col = mix(col, sc * sc * (3.0 - 2.0 * sc), 0.22 * uGrade);
      // Entsättigung bei Verletzung
      float l = dot(col, vec3(0.299, 0.587, 0.114));
      col = mix(col, vec3(l), uInjury * 0.45);
      // Helligkeit (Gamma)
      col = pow(max(col, 0.0), vec3(1.0 / uBright));
      // Vignette + rote Ränder
      float vig = smoothstep(0.85, 0.2, r * (1.0 + uVignette + uInjury * 0.35 + uPulse * 0.15));
      col *= mix(1.0, vig, 0.85);
      float edge = smoothstep(0.3, 0.75, r);
      col = mix(col, vec3(0.35, 0.0, 0.0), edge * (uDamage * 0.75 + uInjury * 0.22 * (0.6 + 0.4 * uPulse)));
      // Filmkörnung
      float n = hash(uv * uRes + fract(uTime * 7.13) * 100.0) - 0.5;
      col += n * uGrain * (0.6 + (1.0 - l) * 0.8);
      if (uCam > 0.5) {
        col = vec3(dot(col, vec3(0.3, 0.6, 0.1))) * vec3(0.75, 1.0, 0.8);
        col *= 0.85 + 0.15 * sin(uv.y * uRes.y * 1.2 + uTime * 20.0);
        col += (hash(vec2(floor(uv.y * 80.0), uTime)) - 0.5) * 0.06;
      }
      col = mix(col, uFadeColor, uFade);
      gl_FragColor = vec4(col, 1.0);
    }`,
};

export class Renderer {
  constructor(canvas, settings) {
    this.canvas = canvas;
    this.settings = settings;
    const r = new THREE.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance', stencil: false, preserveDrawingBuffer: false });
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.0;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    this.r = r;
    this.quality = QUALITY[settings.quality] || QUALITY.medium;
    this.dyn = 1; this._fpsN = 0; this._t0 = 0; this._tLast = 0; this._goodT = 0;
    this._buildComposer();
    window.addEventListener('resize', () => this.resize());
    this.resize();
  }

  _buildComposer() {
    const q = this.quality;
    const rt = new THREE.WebGLRenderTarget(4, 4, { type: THREE.HalfFloatType, samples: q.msaa || 0 });
    this.composer = new EffectComposer(this.r, rt);
    this.scenePass = new DualRenderPass();
    this.composer.addPass(this.scenePass);
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.32, 0.35, 1.15);
    this.bloom.enabled = q.bloom && this.settings.bloom;
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
    this.final = new ShaderPass(FinalShader);
    this.composer.addPass(this.final);
  }

  setQuality(name) {
    this.quality = QUALITY[name] || QUALITY.medium;
    this.composer.dispose();
    this._buildComposer();
    GRID_UNIFORMS.uGridOn.value = this.quality.gridShadow ? 1 : 0;
    this.resize();
  }

  resize() {
    const w = window.innerWidth, h = window.innerHeight;
    const pr = Math.min(window.devicePixelRatio || 1, IS_TOUCH ? 1.5 : 2) * this.quality.pixelRatio * (this.settings.renderScale || 1) * (this.settings.autoRes === false ? 1 : this.dyn);
    this.r.setPixelRatio(pr);
    this.r.setSize(w, h, false);
    this.canvas.style.width = w + 'px'; this.canvas.style.height = h + 'px';
    this.composer.setPixelRatio(pr);
    this.composer.setSize(w, h);
    this.final.uniforms.uRes.value.set(w * pr, h * pr);
    if (this.onResize) this.onResize(w, h);
  }

  render(scene, camera, vmScene, vmCamera, dt) {
    const s = this.scenePass;
    s.scene = scene; s.camera = camera; s.vmScene = vmScene; s.vmCamera = vmCamera;
    GRID_UNIFORMS.uCamWorld.value.copy(camera.matrixWorld);
    const u = this.final.uniforms;
    u.uTime.value += dt;
    u.uGrain.value = this.settings.grain ? 0.055 : 0.0;
    u.uBright.value = this.settings.brightness || 1;
    this.bloom.enabled = this.quality.bloom && this.settings.bloom;
    this.composer.render(dt);
  }

  // Dynamische Auflösung: Fällt die Bildrate dauerhaft unter ~45 fps, wird intern kleiner gerechnet
  // (bis 60 %); läuft es wieder lange flüssig, geht es schrittweise zurück auf 100 %.
  adapt() {
    if (this.settings.autoRes === false) { if (this.dyn !== 1) { this.dyn = 1; this.resize(); } return; }
    // gemessen wird echte Zeit (nicht die gedeckelte Spielzeit); nach Pausen beginnt die Messung neu
    const now = performance.now();
    if (!this._t0 || now - this._tLast > 500) { this._t0 = now; this._fpsN = 0; }
    this._tLast = now; this._fpsN++;
    const span = now - this._t0;
    if (span < 2000) return;
    const fps = this._fpsN * 1000 / span;
    this._t0 = now; this._fpsN = 0;
    let d = this.dyn;
    if (fps < 45 && d > 0.6) { d = Math.max(0.6, d - (fps < 30 ? 0.15 : 0.08)); this._goodT = 0; }
    else if (fps > 57) { this._goodT += 2; if (this._goodT >= 6 && d < 1) { d = Math.min(1, d + 0.05); this._goodT = 0; } }
    else this._goodT = 0;
    if (Math.abs(d - this.dyn) > 0.001) { this.dyn = d; this.resize(); }
  }

  get fx() { return this.final.uniforms; }
}
