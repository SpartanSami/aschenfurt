import * as THREE from "three";
import type { Level } from "./Level";
import { candleCluster } from "./builders/Props";

/**
 * Setzt Kerzengruppen in die Ecken aller vorgemerkten Räume (und in großen Räumen zusätzlich
 * entlang der Wände), damit kein Raumwinkel völlig im Dunkeln liegt.
 * Strahltests gegen die Kollision verhindern, dass Kerzen in Wänden, Säulen oder Möbeln landen;
 * wo bereits ein Licht in der Nähe ist, wird keine weitere Kerze gesetzt.
 */
export function placeRoomCandles(L: Level): void {
  const existing = L.lightPool.sources.map((s) => s.pos.clone());
  const placed: THREE.Vector3[] = [];
  const o = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const ray = (x: number, y: number, z: number, dx: number, dy: number, dz: number, far: number): number | null =>
    L.col.raycast(o.set(x, y, z), dir.set(dx, dy, dz), far);
  let seed = 7100;
  const log: { x: number; z: number; why: string }[] = [];
  (L as unknown as { candleLog: typeof log }).candleLog = log;

  for (const r of L.rooms) {
    const w = r.x1 - r.x0, d = r.z1 - r.z0;
    if (w < 2.2 || d < 2.2) continue;
    const ins = 0.8;
    const xs = [r.x0 + ins, r.x1 - ins];
    const zs = [r.z0 + ins, r.z1 - ins];
    const pts: [number, number][] = [];
    for (const x of xs) for (const z of zs) pts.push([x, z]);
    // Große Räume: zusätzlich entlang der Wände etwa alle 8 m
    const along = (len: number, a0: number, cb: (v: number) => void) => {
      if (len <= 10) return;
      const n = Math.floor(len / 8);
      for (let i = 1; i <= n; i++) cb(a0 + (len * i) / (n + 1));
    };
    along(w, r.x0, (x) => pts.push([x, zs[0]], [x, zs[1]]));
    along(d, r.z0, (z) => pts.push([xs[0], z], [xs[1], z]));

    for (const [x, z] of pts) {
      // Boden unter dem Punkt finden
      let base: number;
      if (r.top !== undefined) {
        const start = r.top - 0.3;
        const dist = ray(x, start, z, 0, -1, 0, 40);
        if (dist === null || dist < 1.9) { log.push({ x, z, why: "boden " + dist }); continue; } // kein Boden oder zu wenig Kopfhöhe
        base = start - dist;
      } else if (r.floorY !== undefined) {
        const start = r.floorY + 1.2;
        const dist = ray(x, start, z, 0, -1, 0, 3);
        if (dist === null) continue;
        base = start - dist;
        if (Math.abs(base - r.floorY) > 0.3) continue; // steht auf einem Möbelstück
        const up = ray(x, base + 0.1, z, 0, 1, 0, 6);
        if (up !== null && up < 1.8) continue;
      } else continue;
      // Freiraum: in beiden Achsen mindestens 1,2 m offen und nichts direkt daneben
      const y = base + 0.35;
      let ok = true;
      const reach: number[] = []; // freie Strecke +x, -x, +z, -z
      for (const [ax, az] of [[1, 0], [0, 1]] as const) {
        const a = ray(x, y, z, ax, 0, az, 6) ?? 6;
        const b = ray(x, y, z, -ax, 0, -az, 6) ?? 6;
        reach.push(a, b);
        if (a + b < 1.2 || Math.min(a, b) < 0.12) ok = false;
      }
      if (!ok) { log.push({ x, z, why: "eng" }); continue; }
      // Nicht doppelt beleuchten
      const near = (p: THREE.Vector3, rad: number) => Math.hypot(p.x - x, p.z - z) < rad && Math.abs(p.y - base) < 2.5;
      if (existing.some((p) => near(p, 2.2)) || placed.some((p) => near(p, 2.6))) { log.push({ x, z, why: "licht" }); continue; }
      log.push({ x, z, why: "ok " + base.toFixed(2) });
      placed.push(new THREE.Vector3(x, base, z));
      candleCluster(L, [x, base + 0.005, z], 4, 0.15, seed++, 2.6, 7.5);
      // Weicher Hof um die Flammen (immer sichtbar, auch ohne zugewiesenes Licht)
      L.glows.add(new THREE.Vector3(x, base + 0.4, z), 2.4, 1, 0.3);
      // Lichtpfütze am Boden – nur auf ebenem Boden, begrenzt durch die nächsten Wände
      const dirs: [number, number, number][] = [[1, 0, reach[0]], [-1, 0, reach[1]], [0, 1, reach[2]], [0, -1, reach[3]]];
      const flat = dirs.every(([dx, dz, free]) => {
        const step = Math.min(0.9, free - 0.05);
        const dd = ray(x + dx * step, base + 0.5, z + dz * step, 0, -1, 0, 1.5);
        return dd !== null && Math.abs(0.5 - dd) < 0.08;
      });
      if (flat) L.glows.add(new THREE.Vector3(x, base + 0.015, z), 5.0, 0, 0.4, [x - reach[1], z - reach[3], x + reach[0], z + reach[2]]);
    }
  }
}
