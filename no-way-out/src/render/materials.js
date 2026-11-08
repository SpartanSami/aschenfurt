// Materialbibliothek + "Grid-Shadow"-Shader-Patch: Punktlichter werden im Fragment-Shader
// über das Weltraster gegen Wände/geschlossene Türen geprüft – kein Licht dringt durch Wände.
import * as THREE from 'three';
import { getTex } from './textures.js';

export const GRID_UNIFORMS = {
  uGridTex: { value: null },
  uGridSize: { value: new THREE.Vector2(1, 1) },
  uCamWorld: { value: new THREE.Matrix4() },
  uGridOn: { value: 1 },
  uAmbTex: { value: null },
  uAmbScale: { value: 1.0 },
};

const GLSL_FUNC = /* glsl */`
uniform sampler2D uGridTex;
uniform vec2 uGridSize;
uniform mat4 uCamWorld;
uniform float uGridOn;
uniform sampler2D uAmbTex;
uniform float uAmbScale;
vec3 nwoAmbient( vec3 posView, vec3 nrmView ) {
  vec3 pw = ( uCamWorld * vec4( posView, 1.0 ) ).xyz;
  vec3 nw = normalize( mat3( uCamWorld ) * nrmView );
  vec2 p = pw.xz + nw.xz * 0.45;
  vec3 a = texture2D( uAmbTex, p / uGridSize ).rgb;
  float up = nw.y > 0.5 ? 1.0 : ( nw.y < -0.5 ? 0.7 : 0.85 );
  return a * a * uAmbScale * up;
}
float nwoGridVis( vec3 posView, vec3 nrmView, vec3 lightView ) {
  if ( uGridOn < 0.5 ) return 1.0;
  vec3 pw = ( uCamWorld * vec4( posView, 1.0 ) ).xyz;
  vec3 nw = normalize( mat3( uCamWorld ) * nrmView );
  vec3 lw = ( uCamWorld * vec4( lightView, 1.0 ) ).xyz;
  vec2 a = pw.xz + nw.xz * 0.07;
  vec2 d = lw.xz - a;
  float len = length( d );
  if ( len < 0.05 ) return 1.0;
  float steps = min( ceil( len * 2.6 ), 40.0 );
  vec2 inc = d / steps;
  vec2 p = a + inc * 0.5;
  for ( int s = 0; s < 40; s ++ ) {
    if ( float( s ) >= steps - 0.5 ) break;
    float occ = texture2D( uGridTex, ( floor( p ) + 0.5 ) / uGridSize ).r;
    if ( occ > 0.5 ) return 0.0;
    p += inc;
  }
  return 1.0;
}
`;

export function patchGrid(mat) {
  if (mat.userData.nwoPatched) return mat;
  mat.userData.nwoPatched = true;
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (shader, r) => {
    if (prev) prev(shader, r);
    Object.assign(shader.uniforms, GRID_UNIFORMS);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <lights_pars_begin>', '#include <lights_pars_begin>\n' + GLSL_FUNC)
      .replace(
        '#include <lights_fragment_begin>',
        THREE.ShaderChunk.lights_fragment_begin.replace(
          'getPointLightInfo( pointLight, geometryPosition, directLight );',
          'getPointLightInfo( pointLight, geometryPosition, directLight );\n\t\tdirectLight.color *= nwoGridVis( geometryPosition, geometryNormal, pointLight.position );'
        )
      )
      .replace('#include <lights_fragment_end>', '#if defined( RE_IndirectDiffuse )\n\tirradiance += nwoAmbient( geometryPosition, geometryNormal );\n#endif\n#include <lights_fragment_end>');
  };
  const prevKey = mat.customProgramCacheKey ? mat.customProgramCacheKey.bind(mat) : () => '';
  mat.customProgramCacheKey = () => prevKey() + '|nwoGrid';
  return mat;
}

const lib = new Map();

function std(params) {
  const m = new THREE.MeshStandardMaterial(params);
  return patchGrid(m);
}
function texMat(kind, topts, params = {}, repeat = [1, 1]) {
  const t = getTex(kind, topts);
  const p = { map: t.map, normalMap: t.normalMap, roughnessMap: t.roughnessMap, roughness: 1, metalness: 0, ...params };
  if (t.emissiveMap && params.emissiveOn) { p.emissiveMap = t.emissiveMap; p.emissive = new THREE.Color(0xffffff); p.emissiveIntensity = params.emissiveIntensity ?? 1; }
  delete p.emissiveOn;
  const m = std(p);
  if (repeat[0] !== 1 || repeat[1] !== 1) {
    // Texturen sind gemeinsam genutzt: Wiederholung über UV-Skalierung im Geometriebau, hier nur Info
    m.userData.repeat = repeat;
  }
  return m;
}

// Definitionen: uvScale = Meter pro Texturwiederholung [u, v]; vFull = Textur deckt volle Wandhöhe ab
export const MATERIAL_DEFS = {
  // Krankenhaus
  h_floor: () => texMat('lino', { color: '#8e9890' }),
  h_floor2: () => texMat('lino', { color: '#9a9184' }),
  h_wall: () => texMat('wallPaint', { color: '#cfcdc2', base: '#4f5552' }),
  h_wall_green: () => texMat('wallPaint', { color: '#a9b8a6', base: '#3e4a42' }),
  h_wall_dirty: () => texMat('wallPaint', { color: '#b8b3a3', base: '#45403a', scuffs: 30, stains: 14 }),
  h_ceil: () => texMat('ceilingTiles', {}),
  h_tile_wall: () => texMat('tiles', { count: 10, color: '#d7dcd8', grout: '#9da29f', rough: 0.18 }),
  h_tile_floor: () => texMat('tiles', { count: 8, color: '#a7aca8', grout: '#5d605e', dirt: true }),
  // Labor
  l_floor: () => texMat('tiles', { count: 4, color: '#b9bec2', grout: '#7c8186', rough: 0.3, jitter: 4 }),
  l_wall: () => texMat('panel', { color: '#e3e6e9' }),
  l_wall_dark: () => texMat('panel', { color: '#8d959c', base: '#3a4046' }),
  l_ceil: () => texMat('metal', { color: '#c9cdd1', rough: 0.6, scratches: 4 }),
  // Beton / Parkhaus
  concrete: () => texMat('concrete', {}),
  concrete_wall: () => texMat('concrete', { color: '#9a9890', formwork: true, cracks: 2 }),
  concrete_floor: () => texMat('concrete', { color: '#7e7d78', stains: 12, stainColor: 'rgba(20,18,14,0.45)', cracks: 4 }),
  concrete_dark: () => texMat('concrete', { color: '#5e5d59', stains: 10 }),
  // U-Bahn
  s_wall_tile: () => texMat('tiles', { count: 16, aspect: 2, offsetRows: true, color: '#c9b37a', grout: '#5a5040', rough: 0.15, dirt: true }),
  s_wall_tile2: () => texMat('tiles', { count: 16, aspect: 2, offsetRows: true, color: '#7f9fa8', grout: '#3e4a4c', rough: 0.15, dirt: true }),
  s_floor: () => texMat('tiles', { count: 6, color: '#6f6c66', grout: '#3a3834', rough: 0.5, dirt: true }),
  gravel: () => texMat('gravel', {}),
  tunnel: () => texMat('concrete', { color: '#55534e', stains: 16, stainColor: 'rgba(15,14,10,0.5)', cracks: 6 }),
  // Stadt
  asphalt: () => texMat('asphalt', { wet: true }),
  pavement: () => texMat('tiles', { count: 8, color: '#7d7a74', grout: '#4a4844', rough: 0.55, dirt: true }),
  facade1: () => texMat('facade', { color: '#8f877a', lit: 0.12 }, { emissiveOn: true, emissiveIntensity: 1.4 }),
  facade2: () => texMat('facade', { color: '#6f7377', lit: 0.08 }, { emissiveOn: true, emissiveIntensity: 1.4 }),
  facade3: () => texMat('facade', { color: '#9a8064', lit: 0.18, shop: true }, { emissiveOn: true, emissiveIntensity: 1.4 }),
  brick: () => texMat('brick', {}),
  plaster: () => texMat('plaster', {}),
  // Requisiten
  metal: () => texMat('metal', {}, { metalness: 0.6 }),
  metal_dark: () => texMat('metal', { color: '#3c4044', rough: 0.55 }, { metalness: 0.5 }),
  metal_rust: () => texMat('metal', { color: '#6a5a4c', rust: true, rough: 0.7 }, { metalness: 0.3 }),
  steel: () => texMat('metal', { color: '#b8bcc0', brushed: true, rough: 0.3 }, { metalness: 0.85 }),
  chrome: () => std({ color: 0xcfd3d6, metalness: 1, roughness: 0.18 }),
  plastic_white: () => std({ color: 0xdedcd6, roughness: 0.45 }),
  plastic_grey: () => std({ color: 0x8a8d90, roughness: 0.5 }),
  plastic_dark: () => std({ color: 0x2a2c2e, roughness: 0.55 }),
  plastic_blue: () => std({ color: 0x3f6c8f, roughness: 0.5 }),
  plastic_yellow: () => std({ color: 0xd8b02a, roughness: 0.5 }),
  plastic_red: () => std({ color: 0xa02a22, roughness: 0.5 }),
  rubber: () => std({ color: 0x111111, roughness: 0.9 }),
  mattress: () => texMat('cloth', { color: '#8aa6b8', dirt: 4 }),
  mattress_blood: () => texMat('cloth', { color: '#8aa6b8', dirt: 6, blood: 3 }),
  sheet: () => texMat('cloth', { color: '#d9dcd8', dirt: 5 }),
  sheet_blood: () => texMat('cloth', { color: '#d9dcd8', dirt: 5, blood: 4 }),
  curtain: () => texMat('cloth', { color: '#7f9e93', pattern: true, dirt: 3 }, { side: THREE.DoubleSide }),
  fabric_dark: () => texMat('cloth', { color: '#3a3f46' }),
  fabric_seat: () => texMat('cloth', { color: '#3b4d7a', pattern: true, dirt: 8 }),
  wood: () => texMat('wood', {}),
  wood_light: () => texMat('wood', { color: '#b89a72' }),
  door_h: () => texMat('door', { color: '#c4bca8' }),
  door_h_blood: () => texMat('door', { color: '#c4bca8', blood: true }),
  door_metal: () => texMat('metal', { color: '#5e666e', rough: 0.5, scratches: 50 }, { metalness: 0.6 }),
  door_lab: () => texMat('panel', { color: '#d6dade', base: '#808890' }, { metalness: 0.2 }),
  glass: () => std({ color: 0x9fb3bb, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.18, depthWrite: false }),
  glass_dark: () => std({ color: 0x0c1214, roughness: 0.05, metalness: 0.4, transparent: true, opacity: 0.75 }),
  glass_frost: () => std({ color: 0xcfd9dc, roughness: 0.3, transparent: true, opacity: 0.5, depthWrite: false }),
  screen_off: () => std({ color: 0x050607, roughness: 0.15, metalness: 0.2 }),
  lamp_panel: () => std({ color: 0xffffff, emissive: 0xf2f6ff, emissiveIntensity: 2.2, roughness: 0.5 }),
  lamp_off: () => std({ color: 0x9a9a9a, emissive: 0x000000, roughness: 0.5 }),
  paint_yellow: () => std({ color: 0xc8a020, roughness: 0.6 }),
  paint_white: () => std({ color: 0xd8d8d0, roughness: 0.7 }),
  paint_red: () => std({ color: 0x8a1c18, roughness: 0.6 }),
  sandbag: () => texMat('cloth', { color: '#8a7a58', dirt: 10 }),
  military: () => texMat('metal', { color: '#4a5240', rough: 0.7, scratches: 40 }, { metalness: 0.3 }),
  tire: () => std({ color: 0x151515, roughness: 0.85 }),
  skin_human: () => texMat('skin', { color: '#c49a7c', wounds: 0 }),
  hair_dark: () => std({ color: 0x1a1512, roughness: 0.7 }),
  paper: () => texMat('paper', {}),
  black: () => std({ color: 0x050505, roughness: 0.9 }),
  plant: () => std({ color: 0x2f4a2a, roughness: 0.8 }),
  soil: () => std({ color: 0x2a2018, roughness: 1 }),
};

// UV-Skalierung (Meter pro Wiederholung) für Weltraum-UVs
export const UV_SCALE = {
  h_floor: [2, 2], h_floor2: [2, 2], h_ceil: [3, 3], h_tile_floor: [2.4, 2.4], h_tile_wall: [2, 2],
  l_floor: [2.4, 2.4], l_ceil: [2, 2],
  concrete: [3, 3], concrete_floor: [4, 4], concrete_wall: [3, 3], concrete_dark: [3, 3],
  s_wall_tile: [2.4, 2.4], s_wall_tile2: [2.4, 2.4], s_floor: [3, 3], gravel: [2, 2], tunnel: [4, 4],
  asphalt: [5, 5], pavement: [3, 3], brick: [3, 3], plaster: [4, 4],
};
// Wände, deren Textur die volle Wandhöhe von 3 m abbildet (Sockelleiste unten)
export const V_FULL = { h_wall: 3, h_wall_green: 3, h_wall_dirty: 3, l_wall: 3, l_wall_dark: 3, facade1: 12, facade2: 12, facade3: 12 };

export function getMat(name) {
  if (lib.has(name)) return lib.get(name);
  const def = MATERIAL_DEFS[name];
  if (!def) { console.warn('Material fehlt:', name); return getMat('plastic_grey'); }
  const m = def();
  m.name = name;
  lib.set(name, m);
  return m;
}

// Farbiges Standardmaterial on-the-fly (z. B. Autolack)
export function colorMat(hex, rough = 0.5, metal = 0, extra = {}) {
  const key = `c:${hex}:${rough}:${metal}:${JSON.stringify(extra)}`;
  if (lib.has(key)) return lib.get(key);
  const m = std({ color: hex, roughness: rough, metalness: metal, ...extra });
  m.name = key;
  lib.set(key, m);
  return m;
}

export function emissiveMat(hex, intensity = 2, base = 0x111111) {
  const key = `e:${hex}:${intensity}:${base}`;
  if (lib.has(key)) return lib.get(key);
  const m = std({ color: base, emissive: hex, emissiveIntensity: intensity, roughness: 0.4 });
  m.name = key;
  lib.set(key, m);
  return m;
}

// Decal (Blut, Papier) – transparent, leicht versetzt
export function decalMat(kind) {
  const key = 'decal:' + kind;
  if (lib.has(key)) return lib.get(key);
  let m;
  if (kind.startsWith('blood')) {
    const t = getTex('blood', { kind: kind.split('_')[1] || 'splat' }, 256);
    m = std({ map: t.map, transparent: true, roughness: 0.25, metalness: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  } else {
    const t = getTex('paper', {}, 128);
    m = std({ map: t.map, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  }
  m.name = key;
  lib.set(key, m);
  return m;
}

export function signMat(text, opts = {}) {
  const key = 'sign:' + text + JSON.stringify(opts);
  if (lib.has(key)) return lib.get(key);
  const t = getTex('sign', { text, ...opts }, opts.w || 256, opts.h || 64);
  const m = std({ map: t.map, emissiveMap: t.emissiveMap, emissive: opts.glow ? 0xffffff : 0x000000, emissiveIntensity: opts.glow ? (opts.intensity || 1.6) : 0, roughness: 0.5 });
  m.name = key;
  lib.set(key, m);
  return m;
}

export function screenMat(kind, opts = {}) {
  const key = 'screen:' + kind + JSON.stringify(opts);
  if (lib.has(key)) return lib.get(key);
  const t = getTex('screen', { kind, ...opts }, 256);
  const m = std({ map: t.map, emissiveMap: t.emissiveMap, emissive: 0xffffff, emissiveIntensity: opts.intensity || 1.3, roughness: 0.2 });
  m.name = key;
  lib.set(key, m);
  return m;
}

export function disposeMaterialLib() { /* Materialien bleiben zwischen Kapiteln im Cache – bewusst */ }
