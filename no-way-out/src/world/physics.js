// Kollisionsauflösung für Spieler, Zombies und Begleiter: Kreis gegen Rasterzellen und (gedrehte) Quader.
import { F } from './grid.js';

const STEP = 0.42;

export function cellBlocked(level, i, j, px, pz, feetY, height) {
  const g = level.grid;
  if (!g.inb(i, j)) return true;
  const k = j * g.w + i;
  const v = g.f[k];
  if (!(v & F.FLOOR) || (v & F.SOLID) || (v & F.GLASS)) return true;
  // Bodenhöhe am nächstgelegenen Punkt der Zelle
  const qx = Math.min(Math.max(px, i + 0.001), i + 0.999), qz = Math.min(Math.max(pz, j + 0.001), j + 0.999);
  const fh = g.heightAt(qx, qz);
  if (fh > feetY + STEP) return true;
  if (g.ceilY[k] - Math.max(fh, feetY) < height - 0.02) return true;
  return false;
}

function pushOutRect(pos, r, x0, z0, x1, z1) {
  const cx = Math.min(Math.max(pos.x, x0), x1), cz = Math.min(Math.max(pos.z, z0), z1);
  let dx = pos.x - cx, dz = pos.z - cz;
  const d2 = dx * dx + dz * dz;
  if (d2 >= r * r) return false;
  if (d2 > 1e-8) {
    const d = Math.sqrt(d2), k = (r - d) / d;
    pos.x += dx * k; pos.z += dz * k;
  } else {
    // Mittelpunkt im Rechteck: kürzeste Achse
    const l = pos.x - x0, rr = x1 - pos.x, t = pos.z - z0, b = z1 - pos.z;
    const m = Math.min(l, rr, t, b);
    if (m === l) pos.x = x0 - r; else if (m === rr) pos.x = x1 + r; else if (m === t) pos.z = z0 - r; else pos.z = z1 + r;
  }
  return true;
}

function pushOutOBB(pos, r, c) {
  // in lokales System
  const dx = pos.x - c.cx, dz = pos.z - c.cz;
  const lx = dx * c.cos - dz * c.sin, lz = dx * c.sin + dz * c.cos;
  const p = { x: lx, z: lz };
  if (!pushOutRect(p, r, -c.hx, -c.hz, c.hx, c.hz)) return false;
  // zurück in Welt
  pos.x = c.cx + p.x * c.cos + p.z * c.sin;
  pos.z = c.cz - p.x * c.sin + p.z * c.cos;
  return true;
}

export function pointInOBB(x, z, c, margin = 0) {
  const dx = x - c.cx, dz = z - c.cz;
  const lx = dx * c.cos - dz * c.sin, lz = dx * c.sin + dz * c.cos;
  return Math.abs(lx) <= c.hx + margin && Math.abs(lz) <= c.hz + margin;
}

// Bewegt pos (feet) um (dx, dz). opts: {radius, height, ignore:Set, onCollider(c)}
export function moveAgent(level, pos, dx, dz, opts) {
  const r = opts.radius, h = opts.height;
  const len = Math.hypot(dx, dz);
  const steps = Math.max(1, Math.ceil(len / (r * 0.7)));
  const hits = [];
  for (let s = 0; s < steps; s++) {
    pos.x += dx / steps; pos.z += dz / steps;
    resolve(level, pos, r, h, opts, hits);
  }
  return hits;
}

export function resolve(level, pos, r, h, opts = {}, hits = null) {
  const g = level.grid;
  for (let it = 0; it < 3; it++) {
    let moved = false;
    const ci = Math.floor(pos.x), cj = Math.floor(pos.z);
    for (let j = cj - 1; j <= cj + 1; j++) for (let i = ci - 1; i <= ci + 1; i++) {
      if (i === ci && j === cj) continue;
      if (opts.zombie && g.inb(i, j) && (g.f[j * g.w + i] & (F.VENT | F.NOZOMBIE))) {
        if (pushOutRect(pos, r, i, j, i + 1, j + 1)) moved = true;
        continue;
      }
      if (!cellBlocked(level, i, j, pos.x, pos.z, pos.y, h)) continue;
      if (pushOutRect(pos, r, i, j, i + 1, j + 1)) moved = true;
    }
    for (const c of level.collidersNear(pos.x, pos.z, r + 1)) {
      if (opts.ignore && opts.ignore.has(c)) continue;
      if (c.y1 <= pos.y + 0.3 || c.y0 >= pos.y + h) continue;
      if (pushOutOBB(pos, r, c)) { moved = true; if (hits) hits.push(c); if (opts.onCollider) opts.onCollider(c); }
    }
    if (!moved) break;
  }
}

// Nächstes Hindernis vor dem Agenten, über das geklettert werden kann
export function findVault(level, pos, dirX, dirZ, maxDist = 1.1) {
  // a) Requisiten mit vault-Flag
  let best = null;
  for (const c of level.collidersNear(pos.x, pos.z, 2.5)) {
    if (!c.vault || !c.enabled) continue;
    for (let d = 0.2; d <= maxDist; d += 0.1) {
      if (pointInOBB(pos.x + dirX * d, pos.z + dirZ * d, c, 0.05)) {
        // Landepunkt hinter dem Hindernis suchen
        for (let e = d + 0.3; e <= d + 2.6; e += 0.1) {
          const lx = pos.x + dirX * e, lz = pos.z + dirZ * e;
          if (pointInOBB(lx, lz, c, 0.32)) continue;
          if (!spotFree(level, lx, lz, pos.y, 0.3)) break;
          const top = c.y1;
          if (!best || d < best.d) best = { d, land: { x: lx, z: lz, y: level.grid.heightAt(lx, lz) }, top, kind: 'prop' };
          break;
        }
        break;
      }
    }
  }
  if (best) return best;
  // b) Kante (höherer Boden, z. B. Bahnsteig)
  const g = level.grid;
  for (let d = 0.3; d <= maxDist; d += 0.1) {
    const x = pos.x + dirX * d, z = pos.z + dirZ * d;
    const fh = g.heightAt(x, z);
    const diff = fh - pos.y;
    if (diff > STEP && diff < 1.4) {
      const lx = pos.x + dirX * (d + 0.5), lz = pos.z + dirZ * (d + 0.5);
      if (spotFree(level, lx, lz, fh, 0.3)) return { d, land: { x: lx, z: lz, y: g.heightAt(lx, lz) }, top: fh, kind: 'ledge' };
      return null;
    }
    if (diff > 1.4) return null;
    if (!g.isFloor(Math.floor(x), Math.floor(z))) return null;
  }
  return null;
}

export function spotFree(level, x, z, feetY, r, h = 1.0) {
  const i = Math.floor(x), j = Math.floor(z);
  if (cellBlocked(level, i, j, x, z, feetY, h)) return false;
  for (const c of level.collidersNear(x, z, r + 1)) {
    if (c.y1 <= feetY + 0.3 || c.y0 >= feetY + h) continue;
    if (pointInOBB(x, z, c, r)) return false;
  }
  // Nachbarzellen gegen Radius
  for (let j2 = j - 1; j2 <= j + 1; j2++) for (let i2 = i - 1; i2 <= i + 1; i2++) {
    if (i2 === i && j2 === j) continue;
    if (!cellBlocked(level, i2, j2, x, z, feetY, h)) continue;
    const cx = Math.min(Math.max(x, i2), i2 + 1), cz = Math.min(Math.max(z, j2), j2 + 1);
    if ((x - cx) ** 2 + (z - cz) ** 2 < r * r) return false;
  }
  return true;
}
