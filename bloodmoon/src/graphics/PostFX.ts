import * as THREE from "three";

// Zentrale Nachbearbeitung: Vignette, Filmkorn, Farbgebung und alle
// Wahrnehmungseffekte (Blutsicht, Nachtsicht, Blutdurst, Erinnerung, Illusion).
export const GradeShader = {
  name: "BloodmoonGrade",
  uniforms: {
    tDiffuse: { value: null as THREE.Texture | null },
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uVignette: { value: 0.55 },
    uGrain: { value: 0.045 },
    uBrightness: { value: 1 },
    uBloodSight: { value: 0 },
    uNightVision: { value: 0 },
    uHunger: { value: 0 },
    uMemory: { value: 0 },
    uDamage: { value: 0 },
    uDistort: { value: 0 },
    uShadowRun: { value: 0 },
    uFade: { value: 0 },
    uFadeColor: { value: new THREE.Color(0, 0, 0) },
    uPulse: { value: 0 },
    uTint: { value: new THREE.Color(1, 1, 1) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform vec2 uResolution;
    uniform float uVignette;
    uniform float uGrain;
    uniform float uBrightness;
    uniform float uBloodSight;
    uniform float uNightVision;
    uniform float uHunger;
    uniform float uMemory;
    uniform float uDamage;
    uniform float uDistort;
    uniform float uShadowRun;
    uniform float uFade;
    uniform vec3 uFadeColor;
    uniform float uPulse;
    uniform vec3 uTint;
    varying vec2 vUv;

    float hash(vec2 p) {
      p = fract(p * vec2(123.34, 456.21));
      p += dot(p, p + 45.32);
      return fract(p.x * p.y);
    }

    float noise(vec2 p) {
      vec2 i = floor(p);
      vec2 f = fract(p);
      float a = hash(i);
      float b = hash(i + vec2(1.0, 0.0));
      float c = hash(i + vec2(0.0, 1.0));
      float d = hash(i + vec2(1.0, 1.0));
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
    }

    void main() {
      vec2 uv = vUv;
      vec2 c = uv - 0.5;
      float r = length(c);

      // Illusion / Erinnerungsbruch: wellenförmige Verzerrung
      float warp = uDistort * 0.018 + uMemory * 0.004;
      uv += warp * vec2(
        sin(uv.y * 23.0 + uTime * 2.1) + noise(uv * 6.0 + uTime * 0.4) - 0.5,
        cos(uv.x * 19.0 - uTime * 1.7) + noise(uv * 5.0 - uTime * 0.3) - 0.5
      );

      // Schattenlauf: radiale Bewegungsunschärfe
      vec3 col = vec3(0.0);
      if (uShadowRun > 0.01) {
        float total = 0.0;
        for (int i = 0; i < 8; i++) {
          float t = float(i) / 7.0;
          vec2 suv = mix(uv, vec2(0.5), t * 0.12 * uShadowRun * r * 2.0);
          col += texture2D(tDiffuse, suv).rgb;
          total += 1.0;
        }
        col /= total;
      } else {
        // dezente chromatische Aberration am Rand
        float ca = 0.0012 + r * r * 0.004 + uDamage * 0.006 + uDistort * 0.006 + uHunger * 0.0015;
        vec2 dir = normalize(c + 1e-5) * ca;
        col.r = texture2D(tDiffuse, uv + dir).r;
        col.g = texture2D(tDiffuse, uv).g;
        col.b = texture2D(tDiffuse, uv - dir).b;
      }

      float lum = dot(col, vec3(0.299, 0.587, 0.114));

      // Nachtsicht: kalte, silbrige vampirische Wahrnehmung (keine grüne Kamera)
      if (uNightVision > 0.001) {
        vec3 nv = vec3(pow(lum, 0.8)) * vec3(0.72, 0.82, 1.0) * 1.15;
        // Warme Körper (rötlich/hell) bleiben warm
        float warm = clamp((col.r - col.b) * 2.5, 0.0, 1.0);
        nv = mix(nv, col * vec3(1.3, 0.9, 0.8), warm * 0.6);
        col = mix(col, nv, uNightVision * 0.85);
      }

      // Blutsicht: Welt verblasst, Blut leuchtet
      if (uBloodSight > 0.001) {
        float redness = clamp((col.r - max(col.g, col.b)) * 3.5, 0.0, 1.0);
        vec3 grey = vec3(lum) * vec3(0.42, 0.40, 0.46);
        vec3 blood = col * vec3(1.55, 0.55, 0.5) + vec3(0.04, 0.0, 0.0);
        vec3 bs = mix(grey, blood, redness);
        // Pulsierende Ränder
        float edge = smoothstep(0.25, 0.75, r) * (0.55 + 0.45 * sin(uTime * 3.0));
        bs += vec3(0.16, 0.0, 0.01) * edge;
        col = mix(col, bs, uBloodSight);
      }

      // Erinnerung: verblasste, rot-sepiafarbene Rückblende
      if (uMemory > 0.001) {
        vec3 sep = vec3(lum) * vec3(1.15, 0.78, 0.62);
        sep += (noise(uv * 3.0 + uTime * 0.2) - 0.5) * 0.06;
        float flick = 0.94 + 0.06 * sin(uTime * 37.0) * sin(uTime * 13.0);
        col = mix(col, sep * flick, uMemory * 0.85);
        col += vec3(0.08, 0.01, 0.0) * uMemory * smoothstep(0.3, 0.8, r);
      }

      // Blutdurst: roter Puls am Bildrand, Herzschlag
      float hb = pow(0.5 + 0.5 * sin(uTime * 6.2), 6.0);
      float hungerEdge = smoothstep(0.35, 0.85, r) * uHunger * (0.35 + 0.65 * hb);
      col = mix(col, col * vec3(1.2, 0.5, 0.5) + vec3(0.12, 0.0, 0.0), hungerEdge);

      // Schaden
      col = mix(col, vec3(0.45, 0.0, 0.02), uDamage * smoothstep(0.1, 0.9, r) * 0.9);

      // Einmaliger Impuls (Schreck, Fähigkeitsaktivierung)
      col += vec3(0.2, 0.02, 0.02) * uPulse * smoothstep(0.0, 0.8, r);

      col *= uTint;

      // Helligkeit (Gamma-Einstellung)
      col = pow(max(col, 0.0), vec3(1.0 / uBrightness));

      // Vignette
      float vig = smoothstep(0.85, 0.2, r * (1.0 + uVignette * 0.6));
      col *= mix(1.0, vig, uVignette + uHunger * 0.2 + uMemory * 0.3);

      // Filmkorn
      float g = hash(uv * uResolution + fract(uTime * 13.17) * 100.0) - 0.5;
      col += g * uGrain * (1.0 + uMemory * 1.5 + uDistort);

      // Abblende
      col = mix(col, uFadeColor, clamp(uFade, 0.0, 1.0));

      gl_FragColor = vec4(col, 1.0);
    }
  `,
};
