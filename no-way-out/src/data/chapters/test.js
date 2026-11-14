// Test-/Sandbox-Level für die Technikprüfung
export default {
  id: 'test', name: 'Testlabor', w: 40, h: 30,
  opts: { floor: 'h_floor', wall: 'h_wall', ceil: 'h_ceil', height: 3 },
  env: { fogDensity: 0.04, hemi: 0.03 },
  build(L) {
    const corr = L.room('corr', 2, 10, 30, 3, { rail: true });
    L.room('roomA', 4, 3, 6, 6);
    L.room('roomB', 12, 3, 6, 6, { wall: 'h_wall_green' });
    L.room('roomC', 4, 14, 8, 7, { floor: 'h_tile_floor', wall: 'h_tile_wall' });
    L.door(7, 9); L.door(15, 9); L.door(8, 13);
    L.lightsAlong(4, 11.5, 30, 11.5, 4, (i) => ({ kind: 'panel', mode: i === 3 ? 'flicker' : 'steady' }));
    L.light(7, 6, { kind: 'panel' });
    L.light(15, 6, { kind: 'panel', mode: 'broken' });
    L.prop('bed', 5.2, 5.5, { hide: true });
    L.prop('locker', 9.4, 3.4, { rot: 0 });
    L.prop('bed_flipped', 22, 11.5, { rot: Math.PI / 2 });
    L.prop('counter', 26, 10.6, { w: 3, monitors: 2, alarm: true });
    L.prop('ivstand', 13, 4);
    L.prop('monitor_stand', 13.5, 7, {});
    L.prop('cabinet', 17.5, 4, { rot: -Math.PI / 2 });
    L.item('bandage', 6, 17);
    L.item('medkit', 10, 19);
    L.item('bottle', 5, 12, { h: 0 });
    L.zombie(28, 11.5, { type: 'shambler', yaw: Math.PI / 2 });
    L.zombie(9, 18, { type: 'sleeper', pose: 'lying' });
    L.decal('blood_pool', 20, 11.2);
    L.decal('blood_smear', 24, 11.8);
    L.checkpoint('start', 4, 11.5, -Math.PI / 2);
  },
  script: [],
};
