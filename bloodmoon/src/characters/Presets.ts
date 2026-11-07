import type { CharacterPreset } from "./Character";

// Eigenständige, wiedererkennbare Figuren – jede mit eigenem Gesicht, Körperbau,
// Frisur und Kleidung.

const PALE: [number, number, number] = [0.86, 0.79, 0.76];

export const PRESETS: Record<string, CharacterPreset> = {
  sami: {
    id: "sami", name: "Sami von Drakenfels", height: 1.85, build: "slim", vampire: true,
    face: {
      width: 0.97, length: 1.05, jaw: 1.15, chin: 1.15, cheek: 1.35, gaunt: 0.25, nose: 1.0, noseW: 0.88, brow: 1.15,
      skin: PALE, pallor: 0.65, eye: "#4a2a2a", browColor: "#140e0d", browThick: 1.05, browArch: 0.8, liner: 0.4, seed: 11,
    },
    hair: { style: "swept", color: "#141010", beard: "none" },
    outfit: { top: "coat", topMat: "leather", skirt: 0.78, legMat: "clothDark", bootMat: "leather", collar: "high", trim: "silver", belt: true },
  },
  mine: {
    id: "mine", name: "Mine", height: 1.72, build: "slim", female: true, vampire: true,
    face: {
      width: 0.95, length: 1.02, jaw: 0.9, chin: 0.92, cheek: 1.45, gaunt: 0.1, nose: 0.82, noseW: 0.8, brow: 0.9, lips: 1.25,
      skin: [0.89, 0.81, 0.79], pallor: 0.55, eye: "#5a1a22", browColor: "#100909", browThick: 0.9, browArch: 1.35, liner: 0.85,
      lipColor: "rgba(95,12,30,0.92)", seed: 23,
    },
    hair: { style: "long", color: "#0c0808" },
    outfit: { top: "dress", topMat: "velvet", topTint: 0x6a3a44, skirt: 1, skirtMat: "clothDark", legMat: "clothDark", bootMat: "leather", collar: "high", sleeveMat: "clothDark", gem: 0x9a0a14, mantle: "cloth", mantleMat: "clothDark" },
  },
  bassem: {
    id: "bassem", name: "Bassem", height: 1.93, build: "broad",
    face: {
      width: 1.08, length: 1.03, jaw: 1.4, chin: 1.1, cheek: 1.1, nose: 1.15, noseW: 1.25, noseHook: 0.6, brow: 1.5,
      skin: [0.6, 0.44, 0.34], eye: "#b08420", browColor: "#140c08", browThick: 1.45, browArch: 0.6, stubble: 0.4, seed: 37,
      scars: [{ x: 0.48, y: 0.12, len: 18, ang: 1.25 }, { x: -0.28, y: 0.42, len: 10, ang: 0.35 }],
    },
    hair: { style: "shaggy", color: "#1a120c", beard: "full", beardColor: "#1a120c", thickness: 1.1 },
    outfit: { top: "tunic", topMat: "leatherBrown", skirt: 0.32, legMat: "clothWolf", bootMat: "leatherBrown", collar: "none", mantle: "fur", belt: true, sleeveMat: "clothWolf" },
  },
  ilyas: {
    id: "ilyas", name: "İlyas", height: 1.78, build: "normal",
    face: {
      width: 1.0, length: 1.0, jaw: 1.0, chin: 1.0, cheek: 0.95, nose: 1.12, noseW: 1.05, noseHook: 0.35, brow: 1.05,
      skin: [0.72, 0.56, 0.45], eye: "#3a2a18", browColor: "#1a120c", browThick: 1.15, age: 0.2, seed: 41,
    },
    hair: { style: "curly", color: "#1c140e", beard: "short", beardColor: "#1c140e" },
    outfit: { top: "tunic", topMat: "clothLinen", topTint: 0x9a8a70, skirt: 0.38, legMat: "clothDark", bootMat: "leatherBrown", collar: "none", mantle: "cloth", mantleMat: "clothWolf", belt: true, bag: true },
  },
  ysolde: {
    id: "ysolde", name: "Ysolde von Drakenfels", height: 1.76, build: "slim", female: true, vampire: true,
    face: {
      width: 0.96, length: 1.06, jaw: 0.95, chin: 1.0, cheek: 1.5, gaunt: 0.15, nose: 0.95, noseW: 0.82, brow: 1.0, lips: 1.0,
      skin: PALE, pallor: 0.6, eye: "#2a2030", browColor: "#1a1214", browArch: 1.1, liner: 0.5, seed: 53,
    },
    hair: { style: "updo", color: "#1a1214" },
    outfit: { top: "dress", topMat: "velvet", topTint: 0x7a3030, skirt: 1, legMat: "clothDark", bootMat: "leather", collar: "ruff", gem: 0x7a0a10 },
  },
  corvin: {
    id: "corvin", name: "Graf Corvin von Drakenfels", height: 1.9, build: "broad", vampire: true,
    face: {
      width: 1.02, length: 1.08, jaw: 1.3, chin: 1.3, cheek: 1.2, gaunt: 0.35, nose: 1.2, noseW: 0.95, noseHook: 0.8, brow: 1.6,
      skin: PALE, pallor: 0.7, eye: "#3a1a1a", browColor: "#2a2424", browThick: 1.2, age: 0.45, seed: 61,
    },
    hair: { style: "swept", color: "#3a3434", beard: "goatee", beardColor: "#2a2424" },
    outfit: { top: "coat", topMat: "velvet", topTint: 0x3a2a30, skirt: 0.85, legMat: "clothDark", bootMat: "leather", collar: "fur", trim: "gold" },
  },
  anselm: {
    id: "anselm", name: "Anselm", height: 1.72, build: "slim",
    face: { width: 0.98, length: 1.0, jaw: 0.95, nose: 1.1, skin: [0.76, 0.62, 0.52], eye: "#3a3020", browColor: "#4a3a2a", age: 0.5, seed: 67 },
    hair: { style: "tonsure", color: "#4a3a2a" },
    outfit: { top: "robe", topMat: "clothDark", skirt: 1, legMat: "clothDark", bootMat: "leatherBrown", collar: "cowl", belt: true },
  },
  berta: {
    id: "berta", name: "Berta", height: 1.6, build: "gaunt", female: true,
    face: { width: 0.98, length: 0.98, jaw: 0.95, gaunt: 0.4, nose: 1.15, noseHook: 0.4, skin: [0.78, 0.64, 0.56], eye: "#4a4a40", browColor: "#8a8478", age: 0.95, seed: 71 },
    hair: { style: "kerchief", color: "#5a4a3a" },
    outfit: { top: "dress", topMat: "clothLinen", topTint: 0x6a5a48, skirt: 1, skirtMat: "clothWolf", legMat: "clothDark", bootMat: "leatherBrown", collar: "none", mantle: "cloth", mantleMat: "clothDark" },
  },
  konrad: {
    id: "konrad", name: "Konrad", height: 1.8, build: "heavy",
    face: { width: 1.1, length: 0.98, jaw: 1.25, cheek: 0.8, nose: 1.2, noseW: 1.3, skin: [0.8, 0.62, 0.52], eye: "#4a3a2a", browColor: "#3a2a1a", age: 0.4, seed: 73 },
    hair: { style: "short", color: "#3a2a1a", beard: "full", beardColor: "#3a2a1a" },
    outfit: { top: "tunic", topMat: "clothLinen", topTint: 0x7a6a58, skirt: 0.25, legMat: "clothWolf", bootMat: "leatherBrown", belt: true },
  },
  lene: {
    id: "lene", name: "Lene", height: 1.24, build: "child", female: true,
    face: { width: 1.04, length: 0.92, jaw: 0.85, chin: 0.8, cheek: 1.2, nose: 0.7, noseW: 0.85, lips: 0.9, skin: [0.88, 0.74, 0.66], eye: "#4a6a8a", browColor: "#7a5a32", browThick: 0.7, seed: 79 },
    hair: { style: "braids", color: "#8a6a3a" },
    outfit: { top: "dress", topMat: "clothLinen", topTint: 0xb0a080, skirt: 0.85, legMat: "clothLinen", bootMat: "leatherBrown" },
  },
  gerold: {
    id: "gerold", name: "Vater Gerold", height: 1.76, build: "gaunt",
    face: { width: 0.96, length: 1.06, jaw: 1.0, gaunt: 0.6, cheek: 1.3, nose: 1.15, noseHook: 0.5, brow: 1.2, skin: [0.76, 0.66, 0.6], eye: "#6a6a6a", browColor: "#8a8a88", age: 0.65, seed: 83, liner: 0.6 },
    hair: { style: "tonsure", color: "#8a8a86" },
    outfit: { top: "robe", topMat: "clothDark", skirt: 1, legMat: "clothDark", bootMat: "leather", collar: "cowl", belt: true },
  },
  malachias: {
    id: "malachias", name: "Prior Malachias", height: 1.86, build: "gaunt", vampire: true,
    face: { width: 0.94, length: 1.1, jaw: 1.05, gaunt: 0.85, cheek: 1.6, nose: 1.25, noseHook: 0.9, brow: 1.6, skin: [0.8, 0.76, 0.76], pallor: 0.9, eye: "#3a0a0a", browColor: "#c8c4c0", age: 1, liner: 0.9, seed: 89 },
    hair: { style: "white", color: "#c8c4c0" },
    outfit: { top: "robe", topMat: "velvet", topTint: 0x4a1818, skirt: 1, legMat: "clothDark", bootMat: "leather", collar: "high", trim: "gold" },
  },
  nadira: {
    id: "nadira", name: "Nadira", height: 1.74, build: "slim", female: true,
    face: { width: 1.0, length: 1.0, jaw: 1.05, cheek: 1.2, nose: 1.05, noseW: 1.1, brow: 1.2, skin: [0.62, 0.46, 0.36], eye: "#c09020", browColor: "#140c08", browThick: 1.2, seed: 97, scars: [{ x: 0.3, y: -0.5, len: 8, ang: 0.8 }] },
    hair: { style: "long", color: "#140c08" },
    outfit: { top: "tunic", topMat: "leatherBrown", skirt: 0.3, legMat: "clothWolf", bootMat: "leatherBrown", mantle: "fur", belt: true },
  },
  villagerM: {
    id: "villagerM", name: "Dorfbewohner", height: 1.76, build: "normal",
    face: { width: 1.02, jaw: 1.1, nose: 1.1, skin: [0.8, 0.64, 0.54], eye: "#4a3a2a", browColor: "#3a2a1a", age: 0.3, seed: 101, stubble: 0.5 },
    hair: { style: "short", color: "#3a2a1a", beard: "stubble" },
    outfit: { top: "tunic", topMat: "clothLinen", topTint: 0x6a5a48, skirt: 0.3, legMat: "clothWolf", bootMat: "leatherBrown", belt: true },
  },
  villagerF: {
    id: "villagerF", name: "Dorfbewohnerin", height: 1.64, build: "normal", female: true,
    face: { width: 0.98, nose: 0.95, skin: [0.82, 0.68, 0.6], eye: "#4a5a4a", browColor: "#5a3a22", age: 0.3, seed: 103 },
    hair: { style: "kerchief", color: "#5a3a22" },
    outfit: { top: "dress", topMat: "clothLinen", topTint: 0x8a7a60, skirt: 1, skirtMat: "clothWolf", legMat: "clothDark", bootMat: "leatherBrown" },
  },
  hollow: {
    id: "hollow", name: "Verlorener", height: 1.8, build: "gaunt",
    face: { width: 0.92, length: 1.08, jaw: 1.1, gaunt: 1, cheek: 1.6, nose: 0.9, brow: 1.4, skin: [0.6, 0.6, 0.6], pallor: 1, eye: "#d8d0c0", browColor: "#3a3a3a", browThick: 0.4, age: 1, liner: 1, seed: 107 },
    hair: { style: "bald", color: "#222" },
    outfit: { top: "rags", topMat: "clothLinen", topTint: 0x4a4038, skirt: 0.55, legMat: "clothLinen", legTint: 0x3a342c, bootMat: "clothDark" },
  },
  corrupted: {
    id: "corrupted", name: "Verdorbener", height: 1.78, build: "gaunt",
    face: { width: 1.0, jaw: 1.1, gaunt: 0.7, cheek: 1.3, nose: 1.0, skin: [0.62, 0.55, 0.52], pallor: 0.5, eye: "#e8d8c8", browColor: "#2a1a1a", liner: 1, seed: 109, scars: [{ x: 0.2, y: 0.2, len: 14, ang: 0.4 }] },
    hair: { style: "short", color: "#2a2018" },
    outfit: { top: "tunic", topMat: "clothLinen", topTint: 0x4a3a30, skirt: 0.3, legMat: "clothWolf", bootMat: "leatherBrown", belt: true },
  },
  cultist: {
    id: "cultist", name: "Akolyth", height: 1.82, build: "slim", vampire: true,
    face: { width: 0.95, gaunt: 0.5, skin: PALE, pallor: 0.8, eye: "#5a0a0a", browColor: "#1a1a1a", seed: 113 },
    hair: { style: "hood", color: "#111" },
    outfit: { top: "robe", topMat: "velvet", topTint: 0x3a0a10, skirt: 1, legMat: "clothDark", bootMat: "leather", collar: "hood", belt: true },
  },
  erste: {
    id: "erste", name: "Der Erste", height: 2.05, build: "slim",
    face: { faceless: true, skin: [0, 0, 0], eye: "#000", browColor: "#000" },
    hair: { style: "bald", color: "#000" },
    outfit: { top: "robe", topMat: "clothDark", skirt: 1, legMat: "clothDark", bootMat: "clothDark", collar: "cowl" },
  },
};
