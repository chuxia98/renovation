import * as THREE from 'three';

const ANISO = 8;

// 木地板贴图覆盖范围（米）
const WOOD_TEX_METERS = 2;
// 墙面贴图覆盖范围（米），build.js 按此换算每个面的 UV
export const WALL_TEX_METERS = 1.5;

export const FLOOR_DEFAULTS = {
  wood: { color: '#9c6f47', size: 0.2 },
  tile: { color: '#e2dfd8', size: 0.6 },
  stone: { color: '#a9a49b', size: 0.8 },
};

export const WALL_DEFAULT = { finish: 'paint', color: '#efeae2' };

const canvasCache = new Map();

function cachedCanvas(key, build) {
  let canvas = canvasCache.get(key);
  if (!canvas) {
    canvas = build();
    // 取色器可以产生无限组合，缓存上限避免显存无限增长
    if (canvasCache.size > 40) canvasCache.delete(canvasCache.keys().next().value);
    canvasCache.set(key, canvas);
  }
  return canvas;
}

function makeCanvas(size) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  return c;
}

function toTexture(canvas, repeat = 1) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = ANISO;
  tex.repeat.set(repeat, repeat);
  return tex;
}

function rand(seed) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((ch) => ch + ch).join('') : h;
  const n = parseInt(full, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

// 明暗系数：f < 1 变暗，f > 1 变亮
function shade(hex, f) {
  const { r, g, b } = hexToRgb(hex);
  const mix = (v) => Math.round(clamp(v * f, 0, 255));
  return `rgb(${mix(r)},${mix(g)},${mix(b)})`;
}

function rgba(hex, alpha) {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

function cfgKey(kind, cfg) {
  return `${kind}|${cfg.color.toLowerCase()}|${Number(cfg.size ?? 0).toFixed(3)}`;
}

// ---------- 木地板 ----------

function buildWood(color, plankWidth) {
  const size = 1024;
  const c = makeCanvas(size);
  const g = c.getContext('2d');
  const rnd = rand(9137);

  const rows = clamp(Math.round(WOOD_TEX_METERS / plankWidth), 4, 44);
  const rowH = size / rows;

  g.fillStyle = color;
  g.fillRect(0, 0, size, size);

  for (let row = 0; row < rows; row++) {
    const y = row * rowH;
    const tone = 0.9 + rnd() * 0.18;
    g.fillStyle = shade(color, tone);
    g.fillRect(0, y, size, rowH);

    // 木纹
    const grains = Math.max(3, Math.round(rowH * 0.35));
    for (let i = 0; i < grains; i++) {
      const gy = y + rnd() * rowH;
      g.strokeStyle = rgba(shade(color, 0.5), 0.05 + rnd() * 0.08);
      g.lineWidth = 0.6 + rnd() * 1.6;
      g.beginPath();
      g.moveTo(0, gy);
      for (let x = 0; x <= size; x += 32) {
        g.lineTo(x, gy + Math.sin((x / size) * Math.PI * (1 + rnd()) + row) * 1.8);
      }
      g.stroke();
    }

    // 板缝
    g.fillStyle = rgba(shade(color, 0.35), 0.55);
    g.fillRect(0, y, size, Math.max(2, rowH * 0.025));

    // 错缝端头
    const joints = 1 + Math.floor(rnd() * 2);
    for (let j = 0; j < joints; j++) {
      const x = Math.floor(rnd() * size);
      g.fillStyle = rgba(shade(color, 0.35), 0.45);
      g.fillRect(x, y + 2, Math.max(2, rowH * 0.025), rowH - 2);
    }
  }

  // 整体明暗
  const vg = g.createLinearGradient(0, 0, size, size);
  vg.addColorStop(0, 'rgba(255,240,218,0.08)');
  vg.addColorStop(0.5, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(24,16,10,0.10)');
  g.fillStyle = vg;
  g.fillRect(0, 0, size, size);

  return c;
}

export function woodFloorTexture(w, d, cfg = {}) {
  const conf = { ...FLOOR_DEFAULTS.wood, ...cfg };
  const canvas = cachedCanvas(cfgKey('wood', conf), () => buildWood(conf.color, conf.size));
  const tex = toTexture(canvas);
  tex.repeat.set(w / WOOD_TEX_METERS, d / WOOD_TEX_METERS);
  return tex;
}

// ---------- 地砖（一张贴图 2×2 块） ----------

function buildTile(color) {
  const size = 512;
  const c = makeCanvas(size);
  const g = c.getContext('2d');
  const rnd = rand(4421);

  const grout = shade(color, 0.86);
  g.fillStyle = grout;
  g.fillRect(0, 0, size, size);

  const cell = size / 2;
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      const tone = 0.965 + rnd() * 0.06;
      g.fillStyle = shade(color, tone);
      g.fillRect(i * cell + 2, j * cell + 2, cell - 4, cell - 4);
    }
  }

  // 细腻石纹
  g.globalAlpha = 0.16;
  for (let i = 0; i < 260; i++) {
    g.fillStyle = rnd() > 0.5 ? '#ffffff' : shade(color, 0.62);
    const x = rnd() * size;
    const y = rnd() * size;
    g.fillRect(x, y, 1 + rnd() * 2, 1 + rnd() * 2);
  }
  g.globalAlpha = 1;

  // 十字砖缝
  g.strokeStyle = shade(color, 0.7);
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(cell, 0);
  g.lineTo(cell, size);
  g.moveTo(0, cell);
  g.lineTo(size, cell);
  g.stroke();

  return c;
}

export function tileFloorTexture(w, d, cfg = {}) {
  const conf = { ...FLOOR_DEFAULTS.tile, ...cfg };
  const canvas = cachedCanvas(cfgKey('tile', conf), () => buildTile(conf.color));
  const tex = toTexture(canvas);
  // 贴图里是 2×2 块，覆盖 2 × size 米
  const span = conf.size * 2;
  tex.repeat.set(w / span, d / span);
  return tex;
}

// ---------- 入户石材（一张贴图 2×2 块） ----------

function buildStone(color) {
  const size = 512;
  const c = makeCanvas(size);
  const g = c.getContext('2d');
  const rnd = rand(771);

  const grout = shade(color, 0.8);
  g.fillStyle = grout;
  g.fillRect(0, 0, size, size);

  const cell = size / 2;
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      const tone = 0.9 + rnd() * 0.16;
      g.fillStyle = shade(color, tone);
      g.fillRect(i * cell + 2, j * cell + 2, cell - 4, cell - 4);
    }
  }

  g.globalAlpha = 0.22;
  for (let i = 0; i < 400; i++) {
    g.fillStyle = rnd() > 0.45 ? shade(color, 0.6) : shade(color, 1.25);
    g.fillRect(rnd() * size, rnd() * size, 1 + rnd() * 3, 1 + rnd() * 2);
  }
  g.globalAlpha = 1;

  return c;
}

export function stoneFloorTexture(w, d, cfg = {}) {
  const conf = { ...FLOOR_DEFAULTS.stone, ...cfg };
  const canvas = cachedCanvas(cfgKey('stone', conf), () => buildStone(conf.color));
  const tex = toTexture(canvas);
  const span = conf.size * 2;
  tex.repeat.set(w / span, d / span);
  return tex;
}

export function floorTexture(kind, w, d, cfg = {}) {
  if (kind === 'tile') return tileFloorTexture(w, d, cfg);
  if (kind === 'stone') return stoneFloorTexture(w, d, cfg);
  return woodFloorTexture(w, d, cfg);
}

// ---------- 墙面 ----------

const WALL_SIZE = 512;

function buildPaint(color) {
  const c = makeCanvas(WALL_SIZE);
  const g = c.getContext('2d');
  const rnd = rand(31337);

  g.fillStyle = color;
  g.fillRect(0, 0, WALL_SIZE, WALL_SIZE);

  g.globalAlpha = 0.05;
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = rnd() > 0.5 ? '#ffffff' : shade(color, 0.7);
    g.fillRect(rnd() * WALL_SIZE, rnd() * WALL_SIZE, 1.4, 1.4);
  }
  g.globalAlpha = 1;

  return c;
}

function buildLinen(color) {
  const c = makeCanvas(WALL_SIZE);
  const g = c.getContext('2d');
  const rnd = rand(5150);

  g.fillStyle = color;
  g.fillRect(0, 0, WALL_SIZE, WALL_SIZE);

  // 亚麻织纹：横竖交织的细线
  g.lineWidth = 1;
  for (let y = 0; y < WALL_SIZE; y += 3) {
    g.strokeStyle = rgba(rnd() > 0.5 ? '#ffffff' : shade(color, 0.7), 0.05 + rnd() * 0.05);
    g.beginPath();
    g.moveTo(0, y + 0.5);
    g.lineTo(WALL_SIZE, y + 0.5);
    g.stroke();
  }
  for (let x = 0; x < WALL_SIZE; x += 3) {
    g.strokeStyle = rgba(rnd() > 0.5 ? '#ffffff' : shade(color, 0.7), 0.04 + rnd() * 0.04);
    g.beginPath();
    g.moveTo(x + 0.5, 0);
    g.lineTo(x + 0.5, WALL_SIZE);
    g.stroke();
  }

  g.globalAlpha = 0.05;
  for (let i = 0; i < 1800; i++) {
    g.fillStyle = rnd() > 0.5 ? '#ffffff' : shade(color, 0.65);
    g.fillRect(rnd() * WALL_SIZE, rnd() * WALL_SIZE, 1.6, 1.6);
  }
  g.globalAlpha = 1;

  return c;
}

function buildStripe(color) {
  const c = makeCanvas(WALL_SIZE);
  const g = c.getContext('2d');

  const stripes = 16;
  const sw = WALL_SIZE / stripes;
  g.fillStyle = color;
  g.fillRect(0, 0, WALL_SIZE, WALL_SIZE);

  for (let i = 0; i < stripes; i += 2) {
    g.fillStyle = shade(color, 0.92);
    g.fillRect(i * sw, 0, sw, WALL_SIZE);
  }
  // 细分隔线
  g.fillStyle = rgba(shade(color, 0.7), 0.5);
  for (let i = 1; i < stripes; i++) {
    g.fillRect(i * sw - 0.5, 0, 1, WALL_SIZE);
  }

  return c;
}

function buildGrid(color) {
  const c = makeCanvas(WALL_SIZE);
  const g = c.getContext('2d');

  const cells = 8;
  const cw = WALL_SIZE / cells;
  g.fillStyle = color;
  g.fillRect(0, 0, WALL_SIZE, WALL_SIZE);

  for (let i = 0; i < cells; i++) {
    for (let j = 0; j < cells; j++) {
      if ((i + j) % 2 === 0) {
        g.fillStyle = shade(color, 0.94);
        g.fillRect(i * cw, j * cw, cw, cw);
      }
    }
  }
  g.fillStyle = rgba(shade(color, 0.7), 0.45);
  for (let i = 0; i <= cells; i++) {
    g.fillRect(i * cw - 0.5, 0, 1, WALL_SIZE);
    g.fillRect(0, i * cw - 0.5, WALL_SIZE, 1);
  }

  return c;
}

const WALL_BUILDERS = {
  paint: buildPaint,
  linen: buildLinen,
  stripe: buildStripe,
  grid: buildGrid,
};

export function wallTexture(cfg = {}) {
  const conf = { ...WALL_DEFAULT, ...cfg };
  const builder = WALL_BUILDERS[conf.finish] || buildPaint;
  const canvas = cachedCanvas(`wall|${conf.finish}|${conf.color.toLowerCase()}`, () => builder(conf.color));
  const tex = toTexture(canvas);
  tex.repeat.set(1, 1);
  return tex;
}

// ---------- 天空 ----------

let skyBase = null;

function buildSky() {
  const w = 1024;
  const h = 512;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const g = c.getContext('2d');

  const grad = g.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#5d97cd');
  grad.addColorStop(0.35, '#8fc0e6');
  grad.addColorStop(0.62, '#d7e8f2');
  grad.addColorStop(0.72, '#eef2ee');
  grad.addColorStop(1, '#a8b49f');
  g.fillStyle = grad;
  g.fillRect(0, 0, w, h);

  // 柔和云层
  const rnd = rand(2048);
  for (let i = 0; i < 46; i++) {
    const x = rnd() * w;
    const y = h * (0.18 + rnd() * 0.36);
    const rx = 40 + rnd() * 130;
    const ry = 10 + rnd() * 26;
    const glow = g.createRadialGradient(x, y, 0, x, y, rx);
    glow.addColorStop(0, `rgba(255,255,255,${0.18 + rnd() * 0.2})`);
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    g.save();
    g.translate(x, y);
    g.scale(1, ry / rx);
    g.translate(-x, -y);
    g.fillStyle = glow;
    g.beginPath();
    g.arc(x, y, rx, 0, Math.PI * 2);
    g.fill();
    g.restore();
  }

  // 太阳光晕
  const sun = g.createRadialGradient(w * 0.72, h * 0.3, 0, w * 0.72, h * 0.3, 190);
  sun.addColorStop(0, 'rgba(255,244,214,0.75)');
  sun.addColorStop(0.3, 'rgba(255,235,190,0.22)');
  sun.addColorStop(1, 'rgba(255,235,190,0)');
  g.fillStyle = sun;
  g.fillRect(0, 0, w, h);

  skyBase = c;
}

export function skyTexture() {
  if (!skyBase) buildSky();
  const tex = new THREE.CanvasTexture(skyBase);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = ANISO;
  return tex;
}
