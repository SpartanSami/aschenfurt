import * as THREE from "three";
import {
  TexData, toPBR, genStoneBlocks, genFlagstones, genCobble, genPlanks, genPlaster, genRoofTiles,
  genGround, genRock, genBark, genMetal, genCloth, genMarble, genFleshStone, genBone,
  makeBloodTexture, makeCobwebTexture, makeTapestryTexture, makePortraitTexture, makeStainedGlassTexture,
  makeBookSpinesTexture, makeSealTexture, makeSymbolTexture, makeInscriptionTexture, PBRSet,
} from "./Textures";
import { settings, qualityProfiles } from "../core/Settings";

export type SurfaceName =
  | "castleStone" | "castleStoneDark" | "cryptStone" | "castleFloor" | "cryptFloor" | "marbleFloor"
  | "woodFloor" | "woodDark" | "woodOld" | "plaster" | "plasterDirty" | "timber" | "roofTiles" | "roofSlate"
  | "cobble" | "dirt" | "mud" | "grass" | "forest" | "rock" | "rockDark" | "bark" | "barkPale"
  | "iron" | "ironRusty" | "gold" | "silver" | "velvet" | "clothDark" | "clothLinen" | "clothWolf"
  | "marble" | "marbleBlack" | "flesh" | "bone" | "cathedralStone" | "leather" | "leatherBrown" | "fur" | "furGrey";

interface SurfaceDef {
  gen: (size: number) => TexData;
  tile: number; // Meter pro Texturkachel
  normal?: number;
  roughness?: number;
  metalness?: number;
  color?: number;
  emissive?: number;
  emissiveIntensity?: number;
}

const S: Record<SurfaceName, SurfaceDef> = {
  castleStone: {
    gen: (s) => genStoneBlocks(s, { rows: 5, minW: 0.18, maxW: 0.38, mortar: 0.045, base: [0.36, 0.34, 0.33], variation: 0.35, mortarColor: [0.17, 0.16, 0.15], moss: 0.15, grime: 0.6, seed: 11, cracks: 0.5 }),
    tile: 3, normal: 3,
  },
  castleStoneDark: {
    gen: (s) => genStoneBlocks(s, { rows: 4, minW: 0.22, maxW: 0.45, mortar: 0.05, base: [0.25, 0.23, 0.23], variation: 0.4, mortarColor: [0.1, 0.09, 0.09], moss: 0.25, grime: 0.8, seed: 12, cracks: 0.7 }),
    tile: 2.6, normal: 3.2,
  },
  cryptStone: {
    gen: (s) => genStoneBlocks(s, { rows: 6, minW: 0.15, maxW: 0.3, mortar: 0.05, base: [0.27, 0.25, 0.24], variation: 0.45, mortarColor: [0.08, 0.075, 0.07], moss: 0.45, grime: 0.9, seed: 13, cracks: 0.9 }),
    tile: 2.4, normal: 3.4,
  },
  cathedralStone: {
    gen: (s) => genStoneBlocks(s, { rows: 6, minW: 0.25, maxW: 0.5, mortar: 0.03, base: [0.3, 0.29, 0.3], variation: 0.2, mortarColor: [0.15, 0.14, 0.14], moss: 0.05, grime: 0.5, seed: 14, cracks: 0.3 }),
    tile: 3.5, normal: 2.6,
  },
  castleFloor: { gen: (s) => genFlagstones(s, 21, [0.33, 0.31, 0.3], 4, 0.05), tile: 3, normal: 2.6 },
  cryptFloor: { gen: (s) => genFlagstones(s, 22, [0.24, 0.23, 0.22], 6, 0.06), tile: 2.5, normal: 3 },
  marbleFloor: { gen: (s) => genFlagstones(s, 23, [0.42, 0.4, 0.4], 3, 0.03), tile: 3, normal: 1.6, roughness: 0.8 },
  woodFloor: { gen: (s) => genPlanks(s, 31, [0.3, 0.2, 0.13], 6, 1), tile: 2, normal: 2 },
  woodDark: { gen: (s) => genPlanks(s, 32, [0.2, 0.12, 0.08], 5, 0.85), tile: 1.6, normal: 1.8 },
  woodOld: { gen: (s) => genPlanks(s, 33, [0.3, 0.26, 0.2], 4, 0.8), tile: 1.8, normal: 2.4 },
  timber: { gen: (s) => genPlanks(s, 34, [0.16, 0.1, 0.07], 2, 0.9), tile: 1, normal: 2 },
  plaster: { gen: (s) => genPlaster(s, 41, [0.62, 0.57, 0.5], 0.5), tile: 2.5, normal: 1.6 },
  plasterDirty: { gen: (s) => genPlaster(s, 42, [0.5, 0.45, 0.38], 0.9), tile: 2.5, normal: 2 },
  roofTiles: { gen: (s) => genRoofTiles(s, 51, [0.24, 0.14, 0.1]), tile: 2, normal: 3 },
  roofSlate: { gen: (s) => genRoofTiles(s, 52, [0.14, 0.14, 0.16]), tile: 1.8, normal: 3 },
  cobble: { gen: (s) => genCobble(s, 61), tile: 2.2, normal: 3.4 },
  dirt: { gen: (s) => genGround(s, 71, "dirt"), tile: 4, normal: 2 },
  mud: { gen: (s) => genGround(s, 72, "mud"), tile: 4, normal: 2 },
  grass: { gen: (s) => genGround(s, 73, "grass"), tile: 4, normal: 2 },
  forest: { gen: (s) => genGround(s, 74, "forest"), tile: 5, normal: 2.2 },
  rock: { gen: (s) => genRock(s, 81, [0.33, 0.31, 0.29]), tile: 4, normal: 3 },
  rockDark: { gen: (s) => genRock(s, 82, [0.18, 0.16, 0.16]), tile: 4, normal: 3.4 },
  bark: { gen: (s) => genBark(s, 91, [0.18, 0.14, 0.11]), tile: 1.5, normal: 4 },
  barkPale: { gen: (s) => genBark(s, 92, [0.3, 0.29, 0.27]), tile: 1.5, normal: 4 },
  iron: { gen: (s) => genMetal(s, 101, [0.2, 0.2, 0.21], 0.25), tile: 1, normal: 1.5, metalness: 1 },
  ironRusty: { gen: (s) => genMetal(s, 102, [0.18, 0.17, 0.17], 0.75), tile: 1, normal: 2, metalness: 1 },
  gold: { gen: (s) => genMetal(s, 103, [0.75, 0.56, 0.28], 0.05), tile: 0.5, normal: 1, metalness: 1 },
  silver: { gen: (s) => genMetal(s, 104, [0.75, 0.75, 0.78], 0.05), tile: 0.5, normal: 1, metalness: 1 },
  velvet: { gen: (s) => genCloth(s, 111, [0.32, 0.04, 0.06], 120, 0.3), tile: 1, normal: 1 },
  clothDark: { gen: (s) => genCloth(s, 112, [0.09, 0.08, 0.1], 120, 0.2), tile: 1, normal: 1 },
  clothLinen: { gen: (s) => genCloth(s, 113, [0.45, 0.4, 0.33], 90, 0.05), tile: 1, normal: 1.2 },
  clothWolf: { gen: (s) => genCloth(s, 114, [0.22, 0.17, 0.12], 60, 0.05), tile: 1, normal: 1.5 },
  marble: { gen: (s) => genMarble(s, 121, [0.78, 0.76, 0.74], [0.3, 0.28, 0.3]), tile: 2, normal: 0.6, roughness: 0.9 },
  marbleBlack: { gen: (s) => genMarble(s, 122, [0.06, 0.055, 0.06], [0.4, 0.1, 0.12]), tile: 2, normal: 0.6, roughness: 0.9 },
  flesh: { gen: (s) => genFleshStone(s, 131), tile: 4, normal: 3, emissive: 0xffffff, emissiveIntensity: 0.6 },
  bone: { gen: (s) => genBone(s, 141), tile: 0.6, normal: 2 },
  leather: { gen: (s) => genPlaster(s, 151, [0.07, 0.055, 0.06], 0.2), tile: 0.6, normal: 1.4, roughness: 0.55 },
  leatherBrown: { gen: (s) => genPlaster(s, 152, [0.2, 0.12, 0.07], 0.4), tile: 0.6, normal: 1.4, roughness: 0.6 },
  fur: { gen: (s) => genBark(s, 161, [0.16, 0.12, 0.09]), tile: 0.4, normal: 3 },
  furGrey: { gen: (s) => genBark(s, 162, [0.28, 0.27, 0.26]), tile: 0.4, normal: 3 },
};

export class MaterialLibrary {
  private pbr = new Map<string, PBRSet>();
  private mats = new Map<string, THREE.Material>();
  /** Sichtbares Blut: leuchtet unter Blutsicht stärker */
  bloodMaterials: THREE.MeshStandardMaterial[] = [];
  /** Verborgene Spuren: nur unter Blutsicht sichtbar */
  hiddenMaterials: THREE.MeshBasicMaterial[] = [];
  /** Materialien, die bei Nachtsicht hervorgehoben werden */
  warmMaterials: THREE.MeshStandardMaterial[] = [];

  private get texSize(): number {
    return qualityProfiles[settings.data.quality].texSize;
  }

  surface(name: SurfaceName): THREE.MeshStandardMaterial {
    const key = "s:" + name;
    let m = this.mats.get(key) as THREE.MeshStandardMaterial | undefined;
    if (m) return m;
    const def = S[name];
    let set = this.pbr.get(name);
    if (!set) {
      set = toPBR(def.gen(this.texSize), def.normal ?? 2.5);
      this.pbr.set(name, set);
    }
    const rep = 1 / def.tile;
    const prep = (t: THREE.Texture) => {
      t.repeat.set(rep, rep);
      return t;
    };
    m = new THREE.MeshStandardMaterial({
      map: prep(set.map),
      normalMap: prep(set.normalMap),
      roughnessMap: prep(set.ormMap),
      metalnessMap: def.metalness ? set.ormMap : null,
      aoMap: null,
      roughness: def.roughness ?? 1,
      metalness: def.metalness ?? 0,
      color: def.color ?? 0xffffff,
    });
    if (set.emissiveMap) {
      m.emissiveMap = prep(set.emissiveMap);
      m.emissive = new THREE.Color(def.emissive ?? 0xffffff);
      m.emissiveIntensity = def.emissiveIntensity ?? 1;
    }
    m.name = name;
    this.mats.set(key, m);
    return m;
  }

  /** Variante mit Tönung (z. B. für Möbel in anderer Holzfarbe). */
  tinted(name: SurfaceName, color: number, roughness?: number): THREE.MeshStandardMaterial {
    const key = `t:${name}:${color}:${roughness}`;
    let m = this.mats.get(key) as THREE.MeshStandardMaterial | undefined;
    if (m) return m;
    m = this.surface(name).clone();
    m.color = new THREE.Color(color);
    if (roughness !== undefined) m.roughness = roughness;
    this.mats.set(key, m);
    return m;
  }

  basic(key: string, make: () => THREE.Material): THREE.Material {
    let m = this.mats.get("b:" + key);
    if (!m) {
      m = make();
      this.mats.set("b:" + key, m);
    }
    return m;
  }

  blood(kind: "pool" | "splatter" | "smear" | "hand" | "drops" | "writing", seed = 1, text = ""): THREE.MeshStandardMaterial {
    const key = `blood:${kind}:${seed}:${text}`;
    let m = this.mats.get(key) as THREE.MeshStandardMaterial | undefined;
    if (m) return m;
    const tex = makeBloodTexture(seed, kind, text);
    m = new THREE.MeshStandardMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      roughness: 0.35,
      metalness: 0,
      emissive: new THREE.Color(0xff1010),
      emissiveMap: tex,
      emissiveIntensity: 0.02,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2,
    });
    this.bloodMaterials.push(m);
    this.mats.set(key, m);
    return m;
  }

  hidden(kind: "pool" | "splatter" | "smear" | "hand" | "drops" | "writing" | "seal", seed = 1, text = "", color?: string): THREE.MeshBasicMaterial {
    const key = `hidden:${kind}:${seed}:${text}:${color}`;
    let m = this.mats.get(key) as THREE.MeshBasicMaterial | undefined;
    if (m) return m;
    const tex = kind === "seal" ? makeSealTexture(seed, color) : makeBloodTexture(seed, kind, text);
    m = new THREE.MeshBasicMaterial({
      map: tex,
      color: new THREE.Color(2.2, 0.15, 0.12),
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      polygonOffset: true,
      polygonOffsetFactor: -3,
      polygonOffsetUnits: -3,
      toneMapped: false,
    });
    this.hiddenMaterials.push(m);
    this.mats.set(key, m);
    return m;
  }

  cobweb(seed = 1): THREE.Material {
    return this.basic("cobweb" + seed, () => new THREE.MeshStandardMaterial({
      map: makeCobwebTexture(seed), transparent: true, depthWrite: false, side: THREE.DoubleSide, roughness: 1, color: 0x9a9aa0,
    }));
  }

  tapestry(seed = 1, base?: string, pattern?: string): THREE.MeshStandardMaterial {
    return this.basic(`tap:${seed}:${base}`, () => new THREE.MeshStandardMaterial({
      map: makeTapestryTexture(seed, base, pattern), side: THREE.DoubleSide, roughness: 0.95, alphaTest: 0.5,
    })) as THREE.MeshStandardMaterial;
  }

  portrait(seed: number, opts: Parameters<typeof makePortraitTexture>[1] = {}): THREE.MeshStandardMaterial {
    return this.basic(`por:${seed}:${JSON.stringify(opts)}`, () => new THREE.MeshStandardMaterial({
      map: makePortraitTexture(seed, opts), roughness: 0.55,
    })) as THREE.MeshStandardMaterial;
  }

  stainedGlass(seed: number, theme: Parameters<typeof makeStainedGlassTexture>[1], accent?: string, intensity = 1.6): THREE.MeshBasicMaterial {
    return this.basic(`glass:${seed}:${theme}:${accent}:${intensity}`, () => {
      const t = makeStainedGlassTexture(seed, theme, accent);
      const m = new THREE.MeshBasicMaterial({ map: t, side: THREE.DoubleSide, toneMapped: true });
      m.color.setScalar(intensity);
      return m;
    }) as THREE.MeshBasicMaterial;
  }

  books(seed = 1): THREE.MeshStandardMaterial {
    return this.basic("books" + seed, () => new THREE.MeshStandardMaterial({ map: makeBookSpinesTexture(seed), roughness: 0.8 })) as THREE.MeshStandardMaterial;
  }

  symbol(sym: string, color?: string, bg?: string): THREE.MeshStandardMaterial {
    return this.basic(`sym:${sym}:${color}:${bg}`, () => new THREE.MeshStandardMaterial({ map: makeSymbolTexture(sym, color, bg), roughness: 0.6, metalness: 0.2 })) as THREE.MeshStandardMaterial;
  }

  inscription(lines: string[], opts: Parameters<typeof makeInscriptionTexture>[1] = {}): THREE.MeshStandardMaterial {
    return this.basic(`ins:${lines.join("|")}:${JSON.stringify(opts)}`, () => new THREE.MeshStandardMaterial({
      map: makeInscriptionTexture(lines, opts), transparent: !opts.bg, roughness: 0.9, depthWrite: !!opts.bg,
      polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
    })) as THREE.MeshStandardMaterial;
  }

  wax(): THREE.MeshStandardMaterial {
    return this.basic("wax", () => new THREE.MeshStandardMaterial({ color: 0xd8ccb0, roughness: 0.55, emissive: 0x3a2008, emissiveIntensity: 0.25 })) as THREE.MeshStandardMaterial;
  }

  glassMoon(intensity = 1): THREE.MeshBasicMaterial {
    return this.basic("glassMoon" + intensity, () => new THREE.MeshBasicMaterial({ color: new THREE.Color(0.35 * intensity, 0.08 * intensity, 0.1 * intensity), side: THREE.DoubleSide, transparent: true, opacity: 0.85 })) as THREE.MeshBasicMaterial;
  }

  dark(): THREE.MeshBasicMaterial {
    return this.basic("dark", () => new THREE.MeshBasicMaterial({ color: 0x000000 })) as THREE.MeshBasicMaterial;
  }

  dispose(): void {
    for (const m of this.mats.values()) m.dispose();
    for (const p of this.pbr.values()) {
      p.map.dispose();
      p.normalMap.dispose();
      p.ormMap.dispose();
      p.emissiveMap?.dispose();
    }
    this.mats.clear();
    this.pbr.clear();
    this.bloodMaterials = [];
    this.hiddenMaterials = [];
  }

  /** Vorab-Generierung (für Ladebildschirm). */
  async warm(names: SurfaceName[], onProgress?: (f: number) => void): Promise<void> {
    for (let i = 0; i < names.length; i++) {
      this.surface(names[i]);
      onProgress?.((i + 1) / names.length);
      await new Promise((r) => setTimeout(r, 0));
    }
  }
}

export const materials = new MaterialLibrary();
