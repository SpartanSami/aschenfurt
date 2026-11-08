// Gegenstände: Darstellung und Stammdaten (storyorientiertes Inventar ohne Slotverwaltung).
import * as THREE from 'three';
import { getMat, colorMat, emissiveMat } from '../render/materials.js';

export const ITEM_INFO = {
  bandage: { name: 'Verband', kind: 'heal', heal: 25, useTime: 2.2, max: 4 },
  medkit: { name: 'Erste-Hilfe-Set', kind: 'heal', heal: 65, useTime: 3.6, max: 3 },
  pills: { name: 'Schmerzmittel', kind: 'heal', heal: 12, useTime: 1.4, max: 4, painkiller: 40 },
  keycard: { name: 'Zugangskarte', kind: 'key' },
  key: { name: 'Schlüssel', kind: 'key' },
  doc: { name: 'Dokument', kind: 'doc', verb: 'Lesen' },
  recorder: { name: 'Diktiergerät', kind: 'fragment', verb: 'Abspielen' },
  bottle: { name: 'Glasflasche', kind: 'throw', verb: 'Nehmen' },
  can: { name: 'Blechdose', kind: 'throw', verb: 'Nehmen' },
  serum: { name: 'Ampulle S-17', kind: 'story' },
  sample: { name: 'Kryo-Box „017“', kind: 'story' },
  phone: { name: 'Smartphone', kind: 'story', verb: 'Nehmen' },
  drive: { name: 'Festplatte', kind: 'story' },
  photo: { name: 'Foto', kind: 'doc', verb: 'Ansehen' },
};

export function makeItemMesh(type) {
  const g = new THREE.Group();
  const add = (geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) => { const m = new THREE.Mesh(geo, typeof mat === 'string' ? getMat(mat) : mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.castShadow = true; g.add(m); return m; };
  switch (type) {
    case 'bandage':
      add(new THREE.CylinderGeometry(0.045, 0.045, 0.08, 14), colorMat(0xf2f0ea, 0.9), 0, 0.04, 0, 0, 0, Math.PI / 2);
      add(new THREE.BoxGeometry(0.1, 0.04, 0.07), colorMat(0x5aa0d0, 0.6), 0.1, 0.02, 0.02);
      break;
    case 'medkit':
      add(new THREE.BoxGeometry(0.34, 0.12, 0.24), colorMat(0xc8201c, 0.5), 0, 0.06, 0);
      add(new THREE.BoxGeometry(0.12, 0.004, 0.035), colorMat(0xffffff, 0.5), 0, 0.122, 0);
      add(new THREE.BoxGeometry(0.035, 0.004, 0.12), colorMat(0xffffff, 0.5), 0, 0.122, 0);
      add(new THREE.BoxGeometry(0.12, 0.03, 0.02), colorMat(0x222222, 0.5), 0, 0.13, -0.08);
      break;
    case 'pills':
      add(new THREE.CylinderGeometry(0.025, 0.025, 0.08, 12), colorMat(0xd08a2a, 0.3, 0, { transparent: true, opacity: 0.85 }), 0, 0.04, 0);
      add(new THREE.CylinderGeometry(0.027, 0.027, 0.02, 12), colorMat(0xffffff, 0.5), 0, 0.09, 0);
      break;
    case 'keycard':
      add(new THREE.BoxGeometry(0.085, 0.003, 0.054), colorMat(0xe8eef2, 0.4), 0, 0.002, 0);
      add(new THREE.BoxGeometry(0.03, 0.004, 0.02), colorMat(0xc8a030, 0.3, 0.8), -0.02, 0.003, 0);
      add(new THREE.BoxGeometry(0.085, 0.004, 0.012), colorMat(0x1e5aa0, 0.4), 0, 0.003, 0.02);
      break;
    case 'key':
      add(new THREE.CylinderGeometry(0.018, 0.018, 0.004, 12), getMat('steel'), 0, 0.002, 0);
      add(new THREE.BoxGeometry(0.05, 0.004, 0.008), getMat('steel'), 0.035, 0.002, 0);
      break;
    case 'doc': case 'photo':
      add(new THREE.BoxGeometry(0.21, 0.003, 0.297), getMat('paper'), 0, 0.002, 0);
      if (type === 'doc') add(new THREE.BoxGeometry(0.23, 0.01, 0.32), colorMat(0x6a4a2a, 0.7), 0, -0.004, 0);
      break;
    case 'recorder':
      add(new THREE.BoxGeometry(0.05, 0.02, 0.11), colorMat(0x1a1c1e, 0.4, 0.3), 0, 0.01, 0);
      add(new THREE.BoxGeometry(0.008, 0.004, 0.008), emissiveMat(0xff2020, 3), 0.012, 0.022, -0.035);
      add(new THREE.CylinderGeometry(0.012, 0.012, 0.004, 10), colorMat(0x555555, 0.3, 0.6), 0, 0.022, 0.02);
      break;
    case 'bottle':
      add(new THREE.CylinderGeometry(0.035, 0.035, 0.2, 10), colorMat(0x2f5a2a, 0.05, 0.1, { transparent: true, opacity: 0.85 }), 0, 0.1, 0);
      add(new THREE.CylinderGeometry(0.012, 0.03, 0.08, 10), colorMat(0x2f5a2a, 0.05, 0.1, { transparent: true, opacity: 0.85 }), 0, 0.24, 0);
      break;
    case 'can':
      add(new THREE.CylinderGeometry(0.033, 0.033, 0.12, 12), colorMat(0xb02a2a, 0.3, 0.7), 0, 0.06, 0);
      break;
    case 'serum':
      add(new THREE.CylinderGeometry(0.012, 0.012, 0.07, 10), colorMat(0x8fd8ff, 0.05, 0, { transparent: true, opacity: 0.8, emissive: 0x2a6a8a, emissiveIntensity: 0.6 }), 0, 0.035, 0);
      add(new THREE.CylinderGeometry(0.013, 0.013, 0.015, 10), colorMat(0xd03030, 0.4), 0, 0.075, 0);
      add(new THREE.BoxGeometry(0.12, 0.05, 0.08), getMat('steel'), 0.09, 0.025, 0);
      break;
    case 'sample':
      add(new THREE.BoxGeometry(0.22, 0.14, 0.16), getMat('steel'), 0, 0.07, 0);
      add(new THREE.BoxGeometry(0.06, 0.02, 0.01), emissiveMat(0x38c8ff, 2), 0, 0.1, 0.081);
      break;
    case 'phone':
      add(new THREE.BoxGeometry(0.075, 0.008, 0.155), colorMat(0x15171a, 0.3, 0.5), 0, 0.004, 0);
      add(new THREE.BoxGeometry(0.068, 0.002, 0.145), emissiveMat(0x7fb0ff, 0.9, 0x050505), 0, 0.0085, 0);
      break;
    case 'drive':
      add(new THREE.BoxGeometry(0.08, 0.015, 0.12), colorMat(0x30343a, 0.4, 0.5), 0, 0.008, 0);
      break;
    case 'switch':
      add(new THREE.BoxGeometry(0.3, 0.45, 0.12), getMat('metal_dark'), 0, 0, 0);
      add(new THREE.BoxGeometry(0.06, 0.18, 0.06), colorMat(0xb02020, 0.5), 0, 0, 0.08);
      break;
    case 'panel':
      add(new THREE.BoxGeometry(0.25, 0.35, 0.06), getMat('metal_dark'), 0, 0, 0);
      add(new THREE.BoxGeometry(0.15, 0.08, 0.01), emissiveMat(0xff4040, 2), 0, 0.08, 0.035);
      break;
    default:
      add(new THREE.BoxGeometry(0.1, 0.1, 0.1), colorMat(0xff00ff, 0.5));
  }
  g.userData.itemType = type;
  return g;
}
