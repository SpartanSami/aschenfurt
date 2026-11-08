import * as THREE from "three";
import { makeSmokeTexture } from "./Textures";

// ---------------------------------------------------------------------------
// Flammen: alle Kerzen/Fackeln eines Levels in einem einzigen Draw Call
// ---------------------------------------------------------------------------
export class FlameSystem {
  mesh: THREE.Mesh;
  private offsets: Float32Array;
  private params: Float32Array; // scale, phase, visible, kind
  private count = 0;
  private cap: number;
  private geo: THREE.InstancedBufferGeometry;
  material: THREE.ShaderMaterial;

  constructor(cap = 1500) {
    this.cap = cap;
    const base = new THREE.PlaneGeometry(1, 1, 1, 4);
    base.translate(0, 0.5, 0);
    this.geo = new THREE.InstancedBufferGeometry();
    this.geo.index = base.index;
    this.geo.setAttribute("position", base.getAttribute("position"));
    this.geo.setAttribute("uv", base.getAttribute("uv"));
    this.offsets = new Float32Array(cap * 3);
    this.params = new Float32Array(cap * 4);
    this.geo.setAttribute("aOffset", new THREE.InstancedBufferAttribute(this.offsets, 3));
    this.geo.setAttribute("aParams", new THREE.InstancedBufferAttribute(this.params, 4));
    this.geo.instanceCount = 0;
    this.material = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uIntensity: { value: 1 } },
      vertexShader: /* glsl */ `
        attribute vec3 aOffset;
        attribute vec4 aParams;
        uniform float uTime;
        varying vec2 vUv;
        varying float vPhase;
        varying float vKind;
        void main() {
          vUv = uv;
          vPhase = aParams.y;
          vKind = aParams.w;
          float s = aParams.x * aParams.z;
          vec3 toCam = cameraPosition - aOffset;
          toCam.y = 0.0;
          vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), normalize(toCam + vec3(1e-4))));
          float t = uTime * (vKind > 0.5 ? 9.0 : 6.0) + vPhase;
          float sway = sin(t * 1.3) * 0.08 + sin(t * 3.1) * 0.04;
          float stretch = 1.0 + sin(t * 2.7) * 0.08 + sin(t * 5.3) * 0.05;
          vec3 p = aOffset + right * position.x * s * (vKind > 0.5 ? 0.9 : 0.42)
                 + vec3(0.0, 1.0, 0.0) * position.y * s * stretch
                 + right * sway * position.y * position.y * s;
          gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform float uIntensity;
        varying vec2 vUv;
        varying float vPhase;
        varying float vKind;
        float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
        float noise(vec2 p) {
          vec2 i = floor(p); vec2 f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
        }
        void main() {
          vec2 uv = vUv;
          float t = uTime * 2.0 + vPhase;
          float n = noise(vec2(uv.x * 4.0, uv.y * 3.0 - t * 2.5));
          float x = (uv.x - 0.5) * 2.0;
          float y = uv.y;
          // Tropfenform: unten breit, oben spitz
          float width = mix(0.85, 0.05, pow(y, 0.9)) * (0.85 + n * 0.3);
          float d = abs(x) / max(width, 0.001);
          float shape = smoothstep(1.0, 0.35, d) * smoothstep(0.0, 0.08, y) * smoothstep(1.0, 0.55 + n * 0.25, y);
          vec3 col = mix(vec3(1.0, 0.95, 0.75), vec3(1.0, 0.55, 0.12), smoothstep(0.1, 0.55, y));
          col = mix(col, vec3(0.8, 0.15, 0.03), smoothstep(0.55, 0.95, y));
          // bläulicher Kern an der Basis
          col = mix(vec3(0.3, 0.4, 1.0), col, smoothstep(0.0, 0.16, y) + step(0.3, abs(x)));
          float core = smoothstep(0.6, 0.0, d) * smoothstep(0.7, 0.2, y);
          col += core * vec3(0.6, 0.45, 0.2);
          float a = shape * uIntensity;
          if (a < 0.01) discard;
          gl_FragColor = vec4(col * a * 2.2, a);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    });
    this.mesh = new THREE.Mesh(this.geo, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 10;
  }

  add(pos: THREE.Vector3, scale = 0.06, kind: "candle" | "torch" = "candle"): number {
    if (this.count >= this.cap) return -1;
    const i = this.count++;
    this.offsets.set([pos.x, pos.y, pos.z], i * 3);
    this.params.set([scale, Math.random() * 100, 1, kind === "torch" ? 1 : 0], i * 4);
    this.geo.instanceCount = this.count;
    (this.geo.getAttribute("aOffset") as THREE.InstancedBufferAttribute).needsUpdate = true;
    (this.geo.getAttribute("aParams") as THREE.InstancedBufferAttribute).needsUpdate = true;
    return i;
  }

  setVisible(i: number, v: number): void {
    if (i < 0) return;
    this.params[i * 4 + 2] = v;
    (this.geo.getAttribute("aParams") as THREE.InstancedBufferAttribute).needsUpdate = true;
  }

  update(time: number): void {
    this.material.uniforms.uTime.value = time;
  }

  dispose(): void {
    this.geo.dispose();
    this.material.dispose();
  }
}

// ---------------------------------------------------------------------------
// Lichtschein ohne Lichtquelle: warme Lichtpfütze am Boden und weicher Hof um Kerzen.
// Sichtbar unabhängig vom Licht-Pool, damit auch entfernte Raumecken nicht schwarz wirken.
// ---------------------------------------------------------------------------
export class GlowSystem {
  mesh: THREE.Mesh;
  private offsets: Float32Array;
  private params: Float32Array; // Größe, Phase, Art (0 = Boden, 1 = Hof), Stärke
  private clips: Float32Array; // Begrenzung der Lichtpfütze (x0, z0, x1, z1) – endet an Wänden
  private count = 0;
  private geo: THREE.InstancedBufferGeometry;
  material: THREE.ShaderMaterial;

  constructor(private cap = 800) {
    const base = new THREE.PlaneGeometry(1, 1);
    this.geo = new THREE.InstancedBufferGeometry();
    this.geo.index = base.index;
    this.geo.setAttribute("position", base.getAttribute("position"));
    this.geo.setAttribute("uv", base.getAttribute("uv"));
    this.offsets = new Float32Array(cap * 3);
    this.params = new Float32Array(cap * 4);
    this.clips = new Float32Array(cap * 4);
    this.geo.setAttribute("aOffset", new THREE.InstancedBufferAttribute(this.offsets, 3));
    this.geo.setAttribute("aParams", new THREE.InstancedBufferAttribute(this.params, 4));
    this.geo.setAttribute("aClip", new THREE.InstancedBufferAttribute(this.clips, 4));
    this.geo.instanceCount = 0;
    this.material = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uIntensity: { value: 1 } },
      vertexShader: /* glsl */ `
        attribute vec3 aOffset;
        attribute vec4 aParams;
        attribute vec4 aClip;
        varying vec4 vClip;
        varying vec3 vWorld;
        varying vec2 vUv;
        varying float vPhase;
        varying float vStrength;
        varying float vKind;
        void main() {
          vUv = uv;
          vClip = aClip;
          vPhase = aParams.y;
          vKind = aParams.z;
          vStrength = aParams.w;
          float s = aParams.x;
          vec3 p;
          if (aParams.z < 0.5) {
            p = aOffset + vec3(position.x * s, 0.0, -position.y * s);
          } else {
            vec3 toCam = normalize(cameraPosition - aOffset);
            vec3 right = normalize(cross(vec3(0.0, 1.0, 0.0), toCam + vec3(1e-4)));
            vec3 up = cross(toCam, right);
            p = aOffset + (right * position.x + up * position.y) * s;
          }
          vWorld = p;
          gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform float uIntensity;
        varying vec2 vUv;
        varying float vPhase;
        varying float vStrength;
        varying float vKind;
        varying vec4 vClip;
        varying vec3 vWorld;
        void main() {
          float r = length(vUv - 0.5) * 2.0;
          if (r > 1.0) discard;
          if (vKind < 0.5 && (vWorld.x < vClip.x || vWorld.z < vClip.y || vWorld.x > vClip.z || vWorld.z > vClip.w)) discard;
          float t = uTime + vPhase;
          float flick = 0.86 + 0.08 * sin(t * 9.7) + 0.06 * sin(t * 23.1);
          float fall = vKind < 0.5 ? pow(1.0 - r, 2.2) : exp(-r * r * 5.0) * (1.0 - r);
          vec3 col = vKind < 0.5 ? vec3(1.0, 0.52, 0.2) : vec3(1.0, 0.62, 0.3);
          float a = fall * flick * vStrength * uIntensity;
          gl_FragColor = vec4(col * a, a);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    this.mesh = new THREE.Mesh(this.geo, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 9;
  }

  /** kind 0: Lichtpfütze am Boden (size = Durchmesser), kind 1: Hof um die Flamme. */
  add(pos: THREE.Vector3, size: number, kind: 0 | 1, strength: number, clip: [number, number, number, number] = [-1e5, -1e5, 1e5, 1e5]): void {
    if (this.count >= this.cap) return;
    const i = this.count++;
    this.offsets.set([pos.x, pos.y, pos.z], i * 3);
    this.params.set([size, Math.random() * 100, kind, strength], i * 4);
    this.clips.set(clip, i * 4);
    this.geo.instanceCount = this.count;
    for (const n of ["aOffset", "aParams", "aClip"]) (this.geo.getAttribute(n) as THREE.InstancedBufferAttribute).needsUpdate = true;
  }

  update(time: number): void {
    this.material.uniforms.uTime.value = time;
  }

  dispose(): void {
    this.geo.dispose();
    this.material.dispose();
  }
}

// ---------------------------------------------------------------------------
// Partikel um die Kamera (Staub, Asche, Regen, Glühwürmchen)
// ---------------------------------------------------------------------------
export class CameraParticles {
  points: THREE.Points;
  private mat: THREE.ShaderMaterial;
  constructor(kind: "dust" | "ash" | "embers" | "spores", count: number, color: THREE.ColorRepresentation, size = 0.03, box = 14) {
    const pos = new Float32Array(count * 3);
    const seed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * box;
      pos[i * 3 + 1] = (Math.random() - 0.5) * box * 0.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * box;
      seed[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    const fall = kind === "ash" ? -0.25 : kind === "embers" ? 0.6 : kind === "spores" ? 0.05 : -0.02;
    this.mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uCam: { value: new THREE.Vector3() },
        uBox: { value: box },
        uColor: { value: new THREE.Color(color) },
        uSize: { value: size },
        uFall: { value: fall },
        uOpacity: { value: 1 },
      },
      vertexShader: /* glsl */ `
        attribute float aSeed;
        uniform float uTime; uniform vec3 uCam; uniform float uBox; uniform float uSize; uniform float uFall;
        varying float vA;
        void main() {
          vec3 p = position;
          float t = uTime * (0.3 + aSeed * 0.4);
          p.x += sin(t + aSeed * 30.0) * 0.6 + uTime * 0.05;
          p.z += cos(t * 0.8 + aSeed * 20.0) * 0.6;
          p.y += uFall * uTime * (0.6 + aSeed);
          vec3 hb = vec3(uBox * 0.5, uBox * 0.25, uBox * 0.5);
          vec3 rel = mod(p - uCam + hb, hb * 2.0) - hb;
          vec3 world = uCam + rel;
          vec4 mv = viewMatrix * vec4(world, 1.0);
          gl_Position = projectionMatrix * mv;
          float dist = -mv.z;
          gl_PointSize = clamp(uSize * 600.0 / max(dist, 0.1), 1.0, 12.0);
          vA = smoothstep(uBox * 0.5, uBox * 0.2, length(rel)) * (0.5 + 0.5 * sin(uTime * 2.0 + aSeed * 50.0));
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor; uniform float uOpacity;
        varying float vA;
        void main() {
          vec2 c = gl_PointCoord - 0.5;
          float d = length(c);
          float a = smoothstep(0.5, 0.0, d) * vA * uOpacity;
          if (a < 0.01) discard;
          gl_FragColor = vec4(uColor * a, a);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.points = new THREE.Points(g, this.mat);
    this.points.frustumCulled = false;
  }
  update(time: number, cam: THREE.Vector3): void {
    this.mat.uniforms.uTime.value = time;
    this.mat.uniforms.uCam.value.copy(cam);
  }
  set opacity(v: number) {
    this.mat.uniforms.uOpacity.value = v;
  }
  dispose(): void {
    this.points.geometry.dispose();
    this.mat.dispose();
  }
}

export class Rain {
  lines: THREE.LineSegments;
  private mat: THREE.ShaderMaterial;
  constructor(count = 2500, box = 30) {
    const pos = new Float32Array(count * 6);
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * box, y = Math.random() * box * 0.6, z = (Math.random() - 0.5) * box;
      pos.set([x, y, z, x + 0.03, y - 0.45, z], i * 6);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    this.mat = new THREE.ShaderMaterial({
      uniforms: { uTime: { value: 0 }, uCam: { value: new THREE.Vector3() }, uBox: { value: box }, uOpacity: { value: 1 } },
      vertexShader: /* glsl */ `
        uniform float uTime; uniform vec3 uCam; uniform float uBox;
        varying float vA;
        void main() {
          vec3 p = position;
          p.y -= uTime * 14.0;
          p.x += uTime * 0.8;
          vec3 hb = vec3(uBox * 0.5, uBox * 0.3, uBox * 0.5);
          vec3 rel = mod(p - uCam + hb, hb * 2.0) - hb;
          vA = smoothstep(uBox * 0.5, uBox * 0.15, length(rel.xz));
          gl_Position = projectionMatrix * viewMatrix * vec4(uCam + rel, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uOpacity; varying float vA;
        void main() { gl_FragColor = vec4(vec3(0.55, 0.58, 0.65) * vA * 0.35 * uOpacity, vA * 0.35 * uOpacity); }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.lines = new THREE.LineSegments(g, this.mat);
    this.lines.frustumCulled = false;
  }
  update(time: number, cam: THREE.Vector3): void {
    this.mat.uniforms.uTime.value = time;
    this.mat.uniforms.uCam.value.copy(cam);
  }
  set opacity(v: number) {
    this.mat.uniforms.uOpacity.value = v;
  }
  dispose(): void {
    this.lines.geometry.dispose();
    this.mat.dispose();
  }
}

// ---------------------------------------------------------------------------
// Bodennebel: weiche, langsam treibende Billboards
// ---------------------------------------------------------------------------
let smokeTex: THREE.Texture | null = null;
export function smokeTexture(): THREE.Texture {
  if (!smokeTex) smokeTex = makeSmokeTexture(5);
  return smokeTex;
}

export class FogBanks {
  mesh: THREE.InstancedMesh;
  private base: { p: THREE.Vector3; s: number; r: number; sp: number }[] = [];
  private dummy = new THREE.Object3D();
  constructor(count: number, color: THREE.ColorRepresentation = 0x8a8a96, opacity = 0.12) {
    const mat = new THREE.MeshBasicMaterial({
      map: smokeTexture(), color, transparent: true, opacity, depthWrite: false, fog: true,
    });
    this.mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), mat, count);
    this.mesh.count = 0;
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 5;
  }
  add(p: THREE.Vector3, size: number): void {
    if (this.mesh.count >= this.mesh.instanceMatrix.count) return;
    this.base.push({ p: p.clone(), s: size, r: Math.random() * 6.28, sp: (Math.random() - 0.5) * 0.06 });
    this.mesh.count = this.base.length;
  }
  update(time: number, cam: THREE.Camera): void {
    for (let i = 0; i < this.base.length; i++) {
      const b = this.base[i];
      this.dummy.position.set(b.p.x + Math.sin(time * 0.05 + i) * 1.5, b.p.y, b.p.z + Math.cos(time * 0.04 + i * 2) * 1.5);
      this.dummy.quaternion.copy(cam.quaternion);
      this.dummy.rotateZ(b.r + time * b.sp);
      this.dummy.scale.setScalar(b.s);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
  dispose(): void {
    this.mesh.geometry.dispose();
    (this.mesh.material as THREE.Material).dispose();
  }
}

// ---------------------------------------------------------------------------
// Lichtschächte (Mondlicht durch Fenster) – additive Volumen-Attrappe
// ---------------------------------------------------------------------------
export function lightShaft(width: number, length: number, color: THREE.ColorRepresentation, opacity = 0.08): THREE.Mesh {
  const g = new THREE.CylinderGeometry(width * 0.5, width * 0.9, length, 4, 1, true);
  g.rotateY(Math.PI / 4);
  g.translate(0, -length / 2, 0);
  const mat = new THREE.ShaderMaterial({
    uniforms: { uColor: { value: new THREE.Color(color) }, uOpacity: { value: opacity }, uTime: { value: 0 } },
    vertexShader: /* glsl */ `
      varying float vY; varying vec3 vN; varying vec3 vView;
      void main() {
        vY = uv.y;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vN = normalize(mat3(modelMatrix) * normal);
        vView = normalize(cameraPosition - wp.xyz);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uOpacity;
      varying float vY; varying vec3 vN; varying vec3 vView;
      void main() {
        float edge = pow(abs(dot(vN, vView)), 1.5);
        float a = uOpacity * edge * smoothstep(0.0, 0.5, vY) * smoothstep(1.0, 0.85, vY);
        gl_FragColor = vec4(uColor * a, a);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
  });
  const m = new THREE.Mesh(g, mat);
  m.renderOrder = 6;
  return m;
}

// ---------------------------------------------------------------------------
// Himmel mit rotem Mond, Sternen und Wolken
// ---------------------------------------------------------------------------
export class Sky {
  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;
  constructor(opts: { moonDir?: THREE.Vector3; redness?: number; cloudiness?: number; zenith?: number; horizon?: number; moonSize?: number } = {}) {
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMoonDir: { value: (opts.moonDir ?? new THREE.Vector3(0.3, 0.45, -0.85)).clone().normalize() },
        uRed: { value: opts.redness ?? 0.85 },
        uClouds: { value: opts.cloudiness ?? 0.6 },
        uZenith: { value: new THREE.Color(opts.zenith ?? 0x05040a) },
        uHorizon: { value: new THREE.Color(opts.horizon ?? 0x1a0d12) },
        uMoonSize: { value: opts.moonSize ?? 0.035 },
      },
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() {
          vDir = normalize(position);
          vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          gl_Position = p.xyww;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime; uniform vec3 uMoonDir; uniform float uRed; uniform float uClouds;
        uniform vec3 uZenith; uniform vec3 uHorizon; uniform float uMoonSize;
        varying vec3 vDir;
        float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
        float noise(vec3 p) {
          vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
          return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
                     mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
        }
        float fbm(vec3 p) { float s = 0.0; float a = 0.5; for (int i = 0; i < 5; i++) { s += a * noise(p); p *= 2.03; a *= 0.5; } return s; }
        void main() {
          vec3 d = normalize(vDir);
          float h = clamp(d.y, -0.2, 1.0);
          vec3 moonCol = mix(vec3(0.85, 0.85, 0.95), vec3(0.95, 0.12, 0.08), uRed);
          vec3 col = mix(uHorizon, uZenith, pow(max(h, 0.0), 0.55));
          // Sterne
          vec3 sp = d * 300.0;
          float st = step(0.9975, hash(floor(sp))) * smoothstep(0.0, 0.3, h);
          st *= 0.6 + 0.4 * sin(uTime * 2.0 + hash(floor(sp)) * 50.0);
          col += vec3(st) * 0.8 * (1.0 - uClouds * 0.6);
          // Mond
          float md = acos(clamp(dot(d, uMoonDir), -1.0, 1.0));
          float disc = smoothstep(uMoonSize, uMoonSize * 0.92, md);
          // Oberflächenstruktur
          vec3 tang = normalize(cross(uMoonDir, vec3(0.0, 1.0, 0.0)));
          vec3 bit = cross(tang, uMoonDir);
          vec2 mp = vec2(dot(d - uMoonDir, tang), dot(d - uMoonDir, bit)) / uMoonSize;
          float maria = fbm(vec3(mp * 2.2, 1.0));
          vec3 moon = moonCol * (0.75 + 0.5 * maria) * (1.0 - 0.35 * smoothstep(0.4, 1.0, length(mp)));
          float glow = exp(-md * 9.0) * 0.55 + exp(-md * 30.0) * 0.6;
          col += moonCol * glow * (0.5 + uRed * 0.5);
          // Wolken
          vec3 cp = vec3(d.x / max(d.y + 0.15, 0.05), d.z / max(d.y + 0.15, 0.05), 0.0) * 1.2 + vec3(uTime * 0.008, uTime * 0.003, uTime * 0.01);
          float cl = smoothstep(0.45, 0.85, fbm(cp)) * uClouds * smoothstep(-0.05, 0.25, d.y);
          vec3 cloudCol = mix(vec3(0.03, 0.025, 0.035), moonCol * 0.25, exp(-md * 3.0));
          col = mix(col, moon, disc * (1.0 - cl * 0.85));
          col = mix(col, cloudCol, cl);
          // Horizont-Dunst
          col = mix(col, uHorizon * 1.2, smoothstep(0.12, -0.05, d.y) * 0.8);
          gl_FragColor = vec4(col, 1.0);
        }
      `,
      side: THREE.BackSide,
      depthWrite: false,
      fog: false,
    });
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(450, 32, 16), this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = -10;
  }
  update(time: number, camPos: THREE.Vector3): void {
    this.material.uniforms.uTime.value = time;
    this.mesh.position.copy(camPos);
  }
  get moonDir(): THREE.Vector3 {
    return this.material.uniforms.uMoonDir.value;
  }
  set redness(v: number) {
    this.material.uniforms.uRed.value = v;
  }
  dispose(): void {
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}

// ---------------------------------------------------------------------------
// Fledermäuse / Krähen in der Ferne
// ---------------------------------------------------------------------------
export class Flock {
  group = new THREE.Group();
  private birds: { m: THREE.Mesh; phase: number; r: number; h: number; sp: number }[] = [];
  constructor(center: THREE.Vector3, count = 12, radius = 30) {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0.15, -0.6, 0.1, -0.1, 0, 0, -0.15, 0, 0, 0.15, 0.6, 0.1, -0.1, 0, 0, -0.15], 3));
    const mat = new THREE.MeshBasicMaterial({ color: 0x020203, side: THREE.DoubleSide });
    for (let i = 0; i < count; i++) {
      const m = new THREE.Mesh(g, mat);
      this.group.add(m);
      this.birds.push({ m, phase: Math.random() * 10, r: radius * (0.5 + Math.random() * 0.6), h: center.y + Math.random() * 12, sp: 0.15 + Math.random() * 0.2 });
    }
    this.group.position.set(center.x, 0, center.z);
  }
  update(time: number): void {
    for (const b of this.birds) {
      const a = time * b.sp + b.phase;
      b.m.position.set(Math.cos(a) * b.r, b.h + Math.sin(a * 3) * 1.5, Math.sin(a) * b.r);
      b.m.rotation.set(0, -a, Math.sin(time * 14 + b.phase) * 0.6);
      b.m.scale.setScalar(1.2);
    }
  }
}
