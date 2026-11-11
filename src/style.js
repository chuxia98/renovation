import * as THREE from 'three';
import { FLOORS, ROOMS } from './plan.js';
import { createFloorMaterial, createWallMaterial, FLOOR_DEFAULTS, WALL_DEFAULT } from './textures.js';

const STORAGE_KEY = 'hourse-style-v1';

export const FLOOR_SIZES = {
  wood: [0.09, 0.12, 0.15, 0.18, 0.2],
  tile: [0.3, 0.45, 0.6, 0.8, 1.2],
  stone: [0.6, 0.8, 1.0],
};

export const FLOOR_SWATCHES = {
  wood: ['#9c6f47', '#b08a62', '#6a4a34', '#d3b48d', '#8c8880', '#4f3a2a'],
  tile: ['#e2dfd8', '#c8c4bd', '#d9cdb9', '#8f8d88', '#6f6d68', '#b06a4f', '#7c8c78'],
  stone: ['#a9a49b', '#8f8a82', '#c2bdb4', '#6f6a62'],
};

export const WALL_SWATCHES = ['#efeae2', '#f5f0e6', '#d8d2c6', '#c3cbb8', '#b7c4c9', '#d7b8a5', '#5a5d5c'];

function defaultRoomStyle(roomId) {
  const floor = FLOORS.find((f) => f.room === roomId);
  const kind = floor ? floor.mat : 'wood';
  return {
    floor: { kind, ...FLOOR_DEFAULTS[kind] },
    wall: { ...WALL_DEFAULT },
  };
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
    }
  } catch {
    // 存储损坏时回落到默认样式
  }
  return base;
}

let style = loadStyle();
let floors = [];
let walls = [];
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
  mesh.material = createFloorMaterial(conf.kind, w, d, { color: conf.color, size: conf.size });
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

export function bindApartment({ floorMeshes, wallMeshes }) {
  floors = floorMeshes;
  walls = wallMeshes;
  applyFloors();
  applyWalls();
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
    room.floor = { ...room.floor, ...patch.floor };
    for (const mesh of floors) {
      if (mesh.userData.roomId === roomId) applyFloorMesh(mesh);
    }
  }
  if (patch.wall) {
    room.wall = { ...room.wall, ...patch.wall };
    // 墙体可能同时属于两个房间，直接全量刷新
    applyWalls();
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
    }
  }
  style = base;
  persist();
  applyFloors();
  applyWalls();
}
