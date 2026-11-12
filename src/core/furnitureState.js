import * as THREE from 'three';
import { FLOORS, mx, mz } from '../plan.js';
import { catalogItem, furnitureVariant, createFurniture } from '../furniture.js';

export const STORE_KEY = 'hourse-layout-v1';

export const furnitureGroup = new THREE.Group();
furnitureGroup.name = 'furniture';

export const placements = [];

const floorRects = FLOORS.map((f) => ({
  minX: mx(f.x1), maxX: mx(f.x2), minZ: mz(f.z1), maxZ: mz(f.z2),
}));

function insideFloor(x, z) {
  for (const r of floorRects) {
    if (x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ) return true;
  }
  return false;
}

function insideWall(x, z, colliders) {
  for (const c of colliders) {
    if (c.enabled === false) continue;
    if (x >= c.minX && x <= c.maxX && z >= c.minZ && z <= c.maxZ) return true;
  }
  return false;
}

function obbHit(ax, az, arot, aw, ad, bx, bz, brot, bw, bd) {
  const ra = THREE.MathUtils.degToRad(arot);
  const rb = THREE.MathUtils.degToRad(brot);
  const uax = { x: Math.cos(ra), z: -Math.sin(ra) };
  const uaz = { x: Math.sin(ra), z: Math.cos(ra) };
  const ubx = { x: Math.cos(rb), z: -Math.sin(rb) };
  const ubz = { x: Math.sin(rb), z: Math.cos(rb) };
  const dx = bx - ax;
  const dz = bz - az;

  for (const axis of [uax, uaz, ubx, ubz]) {
    const dist = Math.abs(dx * axis.x + dz * axis.z);
    const ea = Math.abs((aw / 2) * (uax.x * axis.x + uax.z * axis.z)) + Math.abs((ad / 2) * (uaz.x * axis.x + uaz.z * axis.z));
    const eb = Math.abs((bw / 2) * (ubx.x * axis.x + ubx.z * axis.z)) + Math.abs((bd / 2) * (ubz.x * axis.x + ubz.z * axis.z));
    if (dist >= ea + eb + 0.02) return false;
  }
  return true;
}

let collidersRef = [];

export function bindColliders(colliders) {
  collidersRef = colliders;
}

export function checkPlacement(type, x, z, rot, variantId) {
  const item = catalogItem(type);
  const variant = furnitureVariant(type, variantId);
  const r = THREE.MathUtils.degToRad(rot);
  const c = Math.cos(r);
  const s = Math.sin(r);
  const hw = variant.w / 2;
  const hd = variant.d / 2;
  const local = [
    [0, 0],
    [-hw, -hd], [hw, -hd], [-hw, hd], [hw, hd],
  ];
  for (const [lx, lz] of local) {
    const wx = x + lx * c + lz * s;
    const wz = z - lx * s + lz * c;
    if (!insideFloor(wx, wz)) return false;
    if (insideWall(wx, wz, collidersRef)) return false;
  }

  if (!item.flat) {
    for (const p of placements) {
      const other = catalogItem(p.t);
      if (other.flat) continue;
      const otherVariant = furnitureVariant(p.t, p.v);
      if (obbHit(x, z, rot, variant.w, variant.d, p.x, p.z, p.r, otherVariant.w, otherVariant.d)) return false;
    }
  }
  return true;
}

export function addFurniture(type, x, z, rot, save = true, variantId) {
  const group = createFurniture(type, variantId);
  if (!group) return null;
  group.position.set(x, 0, z);
  group.rotation.y = THREE.MathUtils.degToRad(rot);
  furnitureGroup.add(group);
  const entry = { t: type, v: group.userData.variant, x, z, r: rot, group };
  placements.push(entry);
  if (save) saveLayout();
  return group;
}

export function snapshot() {
  return placements.map((p) => ({
    t: p.t, v: p.v, x: +p.x.toFixed(3), z: +p.z.toFixed(3), r: Math.round(p.r),
  }));
}

export function saveLayout() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(snapshot()));
  } catch {
    /* localStorage 不可用时静默跳过 */
  }
}

export function applyLayout(data) {
  for (const p of placements) furnitureGroup.remove(p.group);
  placements.length = 0;
  for (const p of data) {
    if (!catalogItem(p.t)) continue;
    addFurniture(p.t, p.x, p.z, p.r, false, p.v);
  }
}

// 首次进入（无存档）时的默认布置：马桶靠卫生间东墙、洗手台靠入口右手凹口东墙，均朝西
const DEFAULT_LAYOUT = [
  { t: 'toilet', v: 'standard', x: 4.8, z: 2.6, r: 270 },
  { t: 'washbasin', v: '', x: 4.91, z: 4.08, r: 270 },
];

export function loadLayout() {
  let data = null;
  try {
    const raw = localStorage.getItem(STORE_KEY);
    data = raw ? JSON.parse(raw) : null;
  } catch {
    data = null;
  }
  if (!Array.isArray(data)) data = DEFAULT_LAYOUT.map((p) => ({ ...p }));
  // 旧存档缺默认洁具：逐件一次性补放，之后手动删除不再恢复
  try {
    for (const def of DEFAULT_LAYOUT) {
      const key = `${STORE_KEY}-${def.t}-seeded`;
      if (localStorage.getItem(key)) continue;
      if (!data.some((p) => p.t === def.t)) data.push({ ...def });
      localStorage.setItem(key, '1');
    }
  } catch {
    /* localStorage 不可用时静默跳过 */
  }
  applyLayout(data);
  saveLayout();
}

export function clearFurniture() {
  applyLayout([]);
  saveLayout();
}