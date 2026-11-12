import * as THREE from 'three';
import { FLOORS, ROOMS } from './plan.js';
import { createFloorMaterial, createWallMaterial, FLOOR_DEFAULTS, WALL_DEFAULT, WOOD_TEX_METERS } from './textures.js';

const STORAGE_KEY = 'hourse-style-v2';

// 木地板是板宽（米）；瓷砖/石材是实际砖规格（米）×（米）
export const FLOOR_SIZES = {
  wood: [0.09, 0.12, 0.15, 0.18, 0.2],
  tile: [
    { w: 0.3, d: 0.3 },
    { w: 0.4, d: 0.4 },
    { w: 0.6, d: 0.6 },
    { w: 0.8, d: 0.8 },
    { w: 0.6, d: 1.2 },
    { w: 0.75, d: 1.5 },
  ],
  stone: [
    { w: 0.6, d: 0.6 },
    { w: 0.8, d: 0.8 },
    { w: 1.0, d: 1.0 },
  ],
};

// 按空间给默认规格：卫生间/阳台用小规格防滑砖，厅厨走廊用常规砖
const ROOM_FLOOR_SIZES = {
  bath: { w: 0.3, d: 0.3 },
  corridor: { w: 0.6, d: 0.6 },
  kitchen: { w: 0.6, d: 0.6 },
  balcony: { w: 0.3, d: 0.3 },
  porch: { w: 0.8, d: 0.8 },
};

export const FLOOR_SWATCHES = {
  wood: ['#b08a62', '#c2a37d', '#6a4a34', '#d3b48d', '#8c8880', '#4f3a2a'],
  tile: ['#dfd9ce', '#c8c4bd', '#d9cdb9', '#8f8d88', '#6f6d68', '#b06a4f', '#7c8c78'],
  stone: ['#a9a49b', '#8f8a82', '#c2bdb4', '#6f6a62'],
};

export const WALL_SWATCHES = ['#efeae2', '#f5f0e6', '#d8d2c6', '#c3cbb8', '#b7c4c9', '#d7b8a5', '#5a5d5c'];

export const BALCONY_MODES = ['solid', 'glass'];

function defaultRoomStyle(roomId) {
  const floor = FLOORS.find((f) => f.room === roomId);
  const kind = floor ? floor.mat : 'wood';
  const style = {
    floor: { kind, ...FLOOR_DEFAULTS[kind], ...(ROOM_FLOOR_SIZES[roomId] || {}) },
    wall: { ...WALL_DEFAULT },
  };
  if (roomId === 'balcony') style.enclosure = 'solid';
  return style;
}

export function defaultStyle() {
  const style = { floorLay: { mode: 'room', offsetX: 0, offsetZ: 0 } };
  for (const r of ROOMS) style[r.id] = defaultRoomStyle(r.id);
  return style;
}

// 旧版房间 id（master/second/multi）→ 新 id（bedUpper/bedLower/master）
// 旧 master=左上次卧，旧 second=左下次卧，旧 multi=主卧
function migrateRoomKeys(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (!('second' in obj) && !('multi' in obj)) return obj;
  const out = { ...obj };
  delete out.master;
  delete out.second;
  delete out.multi;
  if (obj.master) out.bedUpper = obj.master;
  if (obj.second) out.bedLower = obj.second;
  if (obj.multi) out.master = obj.multi;
  return out;
}

function loadStyle() {
  const base = defaultStyle();
  try {
    const raw = migrateRoomKeys(JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'));
    if (!raw || typeof raw !== 'object') return base;
    if (raw.floorLay) base.floorLay = { ...base.floorLay, ...raw.floorLay };
    for (const r of ROOMS) {
      const saved = raw[r.id];
      if (!saved) continue;
      if (saved.floor) base[r.id].floor = { ...base[r.id].floor, ...saved.floor };
      if (saved.wall) base[r.id].wall = { ...base[r.id].wall, ...saved.wall };
      if (saved.enclosure) base[r.id].enclosure = saved.enclosure;
    }
  } catch {
    // 存储损坏时回落到默认样式
  }
  return base;
}

let style = loadStyle();
let floors = [];
let walls = [];
let balcony = null;
let neutralWallMat = null;
const wallMatCache = new Map();

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(style));
}

function wallMaterial(roomId) {
  if (!roomId || !style[roomId]) {
    if (!neutralWallMat) {
      neutralWallMat = createWallMaterial();
    }
    return neutralWallMat;
  }
  const conf = style[roomId].wall;
  const key = `${roomId}|${conf.finish}|${conf.color}`;
  let mat = wallMatCache.get(key);
  if (!mat) {
    mat = createWallMaterial({ finish: conf.finish, color: conf.color });
    wallMatCache.set(key, mat);
  }
  return mat;
}

function disposeFloorMaterial(mat) {
  if (!mat) return;
  mat.map?.dispose();
  mat.normalMap?.dispose();
  mat.roughnessMap?.dispose();
  mat.dispose();
}

function applyFloorMesh(mesh) {
  const roomId = mesh.userData.roomId;
  const conf = style[roomId].floor;
  const { w, d } = mesh.userData.floorSize;
  disposeFloorMaterial(mesh.material);
  const mat = createFloorMaterial(conf.kind, w, d, conf);
  const lay = style.floorLay;
  if (lay.mode === 'continuous') {
    // 通铺：把贴图相位锚到世界原点 + 用户偏移，跨房间对齐
    // 顶面 UV：u 随世界 X 增大，v 随世界 Z 减小
    const rect = mesh.userData.floorRect;
    const tx = conf.kind === 'wood' ? WOOD_TEX_METERS : conf.w * 2;
    const ty = conf.kind === 'wood' ? WOOD_TEX_METERS : conf.d * 2;
    const ox = (rect.x1 - lay.offsetX) / tx;
    const oy = (lay.offsetZ - rect.z2) / ty;
    for (const tex of [mat.map, mat.normalMap, mat.roughnessMap]) {
      if (tex) tex.offset.set(ox, oy);
    }
  }
  mesh.material = mat;
}

function applyWallMesh(mesh) {
  const sides = mesh.userData.wallSides;
  const neutral = wallMaterial(null);
  const plus = wallMaterial(sides.plus);
  const minus = wallMaterial(sides.minus);
  mesh.material = sides.axis === 'v'
    ? [plus, minus, neutral, neutral, neutral, neutral]
    : [neutral, neutral, neutral, neutral, plus, minus];
}

function applyFloors() {
  for (const mesh of floors) applyFloorMesh(mesh);
}

function applyWalls() {
  for (const mesh of walls) applyWallMesh(mesh);
}

export function bindApartment({ floorMeshes, wallMeshes, balcony: balconyController }) {
  floors = floorMeshes;
  walls = wallMeshes;
  balcony = balconyController;
  applyFloors();
  applyWalls();
  balcony?.setMode(style.balcony.enclosure);
}

export function getStyle() {
  return style;
}

export function getRoomStyle(roomId) {
  return style[roomId];
}

export function getFloorLay() {
  return style.floorLay;
}

export function setFloorLay(patch) {
  style.floorLay = { ...style.floorLay, ...patch };
  persist();
  applyFloors();
}

export function updateRoom(roomId, patch) {
  const room = style[roomId];
  if (patch.floor) {
    // 换地板类型时整组替换，避免木地板板宽和瓷砖规格字段互相残留
    const changingKind = patch.floor.kind && patch.floor.kind !== room.floor.kind;
    room.floor = changingKind ? { ...patch.floor } : { ...room.floor, ...patch.floor };
    for (const mesh of floors) {
      if (mesh.userData.roomId === roomId) applyFloorMesh(mesh);
    }
  }
  if (patch.wall) {
    room.wall = { ...room.wall, ...patch.wall };
    // 墙体可能同时属于两个房间，直接全量刷新
    applyWalls();
  }
  if (patch.enclosure) {
    room.enclosure = patch.enclosure;
    if (roomId === 'balcony') balcony?.setMode(room.enclosure);
  }
  persist();
}

export function getStyleSnapshot() {
  return JSON.parse(JSON.stringify(style));
}

export function setStyleSnapshot(snapshot) {
  const base = defaultStyle();
  const snap = migrateRoomKeys(snapshot);
  if (snap && typeof snap === 'object') {
    if (snap.floorLay) base.floorLay = { ...base.floorLay, ...snap.floorLay };
    for (const r of ROOMS) {
      const saved = snap[r.id];
      if (!saved) continue;
      if (saved.floor) base[r.id].floor = { ...base[r.id].floor, ...saved.floor };
      if (saved.wall) base[r.id].wall = { ...base[r.id].wall, ...saved.wall };
      if (saved.enclosure) base[r.id].enclosure = saved.enclosure;
    }
  }
  style = base;
  persist();
  applyFloors();
  applyWalls();
  balcony?.setMode(style.balcony.enclosure);
}
