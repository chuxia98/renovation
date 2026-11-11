import * as THREE from 'three';
import { FLOORS, ROOMS } from './plan.js';
import { createFloorMaterial, createWallMaterial, FLOOR_DEFAULTS, WALL_DEFAULT } from './textures.js';

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
  wood: ['#9c6f47', '#b08a62', '#6a4a34', '#d3b48d', '#8c8880', '#4f3a2a'],
  tile: ['#e2dfd8', '#c8c4bd', '#d9cdb9', '#8f8d88', '#6f6d68', '#b06a4f', '#7c8c78'],
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
  const style = {};
  for (const r of ROOMS) style[r.id] = defaultRoomStyle(r.id);
  return style;
}

function loadStyle() {
  const base = defaultStyle();
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!raw || typeof raw !== 'object') return base;
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
  mesh.material = createFloorMaterial(conf.kind, w, d, conf);
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
  if (snapshot && typeof snapshot === 'object') {
    for (const r of ROOMS) {
      const saved = snapshot[r.id];
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
