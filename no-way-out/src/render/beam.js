// Sichtbarer Lichtkegel der Taschenlampe:
//  • Schwebstaub, der nur dort aufleuchtet, wo der Strahl ihn trifft (Rechnung komplett auf der Grafikkarte),
//  • ein schwacher Lichtschaft, der an der ersten Wand in Strahlrichtung endet.
// Die Strahllänge wird pro Bild per Gitter-Strahltest bestimmt, damit Staub und Schaft nicht durch Wände leuchten.
import * as THREE from 'three';
import { F } from '../world/grid.js';

const BOX = 8;           // Kantenlänge des Staubwürfels um die Kamera (m)
const MAXLEN = 14;       // maximale Strahllänge (m)

export class FlashBeam {
  constructor(game, count) {
    this.game = game;
    this.len = MAXLEN;
    const pos = new Float32Array(count * 3), rnd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = Math.random() * BOX; pos[i * 3 + 1] = Math.random() * BOX; pos[i * 3 + 2] = Math.random() * BOX;
      rnd[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aRnd', new THREE.BufferAttribute(rnd, 1));
    this.uniforms = {
      uTime: { value: 0 }, uCam: { value: new THREE.Vector3() }, uFlashPos: { value: new THREE.Vector3() },
      uFlashDir: { value: new THREE.Vector3(0, 0, -1) }, uOn: { value: 0 }, uLen: { value: MAXLEN },
      uScale: { value: 500 }, uColor: { value: new THREE.Color(1.0, 0.93, 0.8) },
    };
    this.dust = new THREE.Points(g, new THREE.ShaderMaterial({
      uniforms: this.uniforms,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: /* glsl */`
        attribute float aRnd;
        uniform float uTime, uOn, uLen, uScale; uniform vec3 uCam, uFlashPos, uFlashDir;
        varying float vB;
        void main(){
          float t = uTime;
          // langsames Schweben und Sinken
          vec3 p = position + vec3(sin(t * 0.13 + aRnd * 40.0) * 0.35, -t * (0.012 + aRnd * 0.02), cos(t * 0.11 + aRnd * 31.0) * 0.35);
          // Würfel wandert mit der Kamera mit (wiederholt sich lückenlos)
          p = mod(p - uCam + ${BOX.toFixed(1)} * 0.5, ${BOX.toFixed(1)}) - ${BOX.toFixed(1)} * 0.5 + uCam;
          vec3 v = p - uFlashPos; float d = length(v);
          float c = dot(v / max(d, 0.001), uFlashDir);
          float cone = smoothstep(0.87, 0.975, c);
          float along = dot(v, uFlashDir);
          float lenF = 1.0 - smoothstep(uLen - 0.5, uLen + 0.1, along);
          float nearF = smoothstep(0.3, 1.0, d);
          float tw = 0.55 + 0.45 * sin(t * (0.8 + aRnd * 2.2) + aRnd * 23.0);
          vB = uOn * cone * lenF * nearF * tw / (1.0 + d * d * 0.07);
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          gl_Position = projectionMatrix * mv;
          float s = (0.012 + aRnd * 0.016) * uScale / max(0.15, -mv.z);
          // zu kleine Punkte nicht flackern lassen: Größe begrenzen, Helligkeit anpassen
          vB *= clamp(s / 2.0, 0.0, 1.0);
          gl_PointSize = clamp(s, 2.0, 12.0);
          if (vB < 0.003) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
        }`,
      fragmentShader: /* glsl */`
        uniform vec3 uColor; varying float vB;
        void main(){
          vec2 q = gl_PointCoord - 0.5;
          float a = 1.0 - smoothstep(0.12, 0.5, length(q));
          gl_FragColor = vec4(uColor * vB * a * 4.0, 1.0);
        }`,
    }));
    this.dust.frustumCulled = false;
    this.dust.renderOrder = 5;

    // Lichtschaft: offener Kegel, Spitze im Ursprung, öffnet sich entlang +Z (passt zu lookAt)
    const cg = new THREE.ConeGeometry(1, 1, 28, 6, true);
    cg.rotateX(-Math.PI / 2); cg.translate(0, 0, 0.5);
    this.shaftU = { uOn: { value: 0 }, uColor: this.uniforms.uColor };
    this.shaft = new THREE.Mesh(cg, new THREE.ShaderMaterial({
      uniforms: this.shaftU,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: /* glsl */`
        varying float vAx; varying vec3 vN; varying vec3 vV;
        void main(){
          vAx = position.z;
          vec4 mv = modelViewMatrix * vec4(position, 1.0);
          vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,
      fragmentShader: /* glsl */`
        uniform float uOn; uniform vec3 uColor; varying float vAx; varying vec3 vN; varying vec3 vV;
        void main(){
          // Ränder (streifender Blick) weich ausblenden, zur Spitze und zum Ende hin ausblenden
          float face = pow(abs(dot(normalize(vN), normalize(vV))), 1.6);
          float a = uOn * face * pow(1.0 - vAx, 2.2) * smoothstep(0.0, 0.12, vAx);
          gl_FragColor = vec4(uColor * a * 0.26, 1.0);
        }`,
    }));
    this.shaft.frustumCulled = false;
    this.shaft.renderOrder = 4;
    this.tanA = Math.tan(0.36);
  }

  attach(scene) { scene.add(this.dust); scene.add(this.shaft); }

  // Entfernung bis zum ersten Hindernis, das Licht aufhält (Wand, geschlossene Tür, Boden, Decke)
  _length(o, d) {
    const lv = this.game.level; if (!lv) return MAXLEN;
    const grid = lv.grid;
    for (let t = 0.2; t < MAXLEN; t += 0.12) {
      const x = o.x + d.x * t, y = o.y + d.y * t, z = o.z + d.z * t;
      const cx = Math.floor(x), cz = Math.floor(z);
      if (!grid.inb(cx, cz)) return t;
      if (grid.get(cx, cz) & (F.SOLID | F.DOORSHUT)) return t;
      const k = grid.idx(cx, cz);
      if (y < grid.floorY[k] || y > grid.ceilY[k]) return t;
    }
    return MAXLEN;
  }

  update(dt, cam, flash, dir, on, viewH) {
    const u = this.uniforms;
    u.uTime.value += dt;
    u.uCam.value.copy(cam.position);
    u.uFlashPos.value.copy(flash.position);
    u.uFlashDir.value.copy(dir);
    const target = on ? 1 : 0;
    u.uOn.value += (target - u.uOn.value) * Math.min(1, dt * 12);
    const visible = u.uOn.value > 0.01;
    this.dust.visible = visible; this.shaft.visible = visible;
    if (!visible) return;
    // Strahllänge weich nachführen (kein Springen an Türkanten)
    const L = this._length(flash.position, dir);
    this.len += (L - this.len) * Math.min(1, dt * 18);
    u.uLen.value = this.len;
    u.uScale.value = viewH / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2));
    const s = this.shaft, len = Math.max(0.5, this.len);
    s.position.copy(flash.position);
    s.lookAt(flash.position.x + dir.x, flash.position.y + dir.y, flash.position.z + dir.z);
    s.scale.set(len * this.tanA, len * this.tanA, len);
    this.shaftU.uOn.value = u.uOn.value;
  }
}
