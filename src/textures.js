import * as THREE from 'three';
import { pbrSet } from './pbr.js';

const ANISO = 16;
// 法线/粗糙度贴图统一用 512，颜色贴图保持原分辨率
const MAP_SIZE = 512;

// 木地板贴图覆盖范围（米）
export const WOOD_TEX_METERS = 2;
// 墙面贴图覆盖范围（米），build.js 按此换算每个面的 UV
export const WALL_TEX_METERS = 1.5;

export const FLOOR_DEFAULTS = {
  wood: { color: '#b08a62', size: 0.2 },
  tile: { color: '#dfd9ce', w: 0.8, d: 0.8 },
  stone: { color: '#a9a49b', w: 0.8, d: 0.8 },
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

function makeCanvas(width, height = width) {
  const c = document.createElement('canvas');
  c.width = width;
  c.height = height;
  return c;
}

function toTexture(canvas, repeat = 1, srgb = true) {
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
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
  const base = `${kind}|${cfg.color.toLowerCase()}`;
  if (kind === 'wood') return `${base}|${Number(cfg.size ?? 0).toFixed(3)}`;
  return `${base}|${Number(cfg.w ?? 0).toFixed(3)}x${Number(cfg.d ?? 0).toFixed(3)}`;
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
    const tone = 0.93 + rnd() * 0.12;
    g.fillStyle = shade(color, tone);
    g.fillRect(0, y, size, rowH);

    // 木纹：浅橡木以细直纹为主，对比很轻
    const grains = Math.max(3, Math.round(rowH * 0.24));
    for (let i = 0; i < grains; i++) {
      const gy = y + rnd() * rowH;
      g.strokeStyle = rgba(shade(color, 0.58), 0.035 + rnd() * 0.055);
      g.lineWidth = 0.5 + rnd() * 1.2;
      g.beginPath();
      g.moveTo(0, gy);
      for (let x = 0; x <= size; x += 32) {
        g.lineTo(x, gy + Math.sin((x / size) * Math.PI * (1 + rnd()) + row) * 1.4);
      }
      g.stroke();
    }

    // 板缝
    g.fillStyle = rgba(shade(color, 0.5), 0.4);
    g.fillRect(0, y, size, Math.max(1, rowH * 0.012));

    // 错缝端头
    const joints = 1 + Math.floor(rnd() * 2);
    for (let j = 0; j < joints; j++) {
      const x = Math.floor(rnd() * size);
      g.fillStyle = rgba(shade(color, 0.5), 0.32);
      g.fillRect(x, y + 1, Math.max(1, rowH * 0.012), rowH - 1);
    }
  }

  // 真实橡木纹理叠加：底图只有 512，铺 2×2 覆盖 2 米画布
  const grain = pbrSet('oak')?.color?.image;
  if (grain) {
    const tile = size / 2;
    g.save();
    g.globalCompositeOperation = 'multiply';
    g.globalAlpha = 0.32;
    g.translate(size / 2, size / 2);
    g.rotate(Math.PI / 2);
    g.translate(-size / 2, -size / 2);
    for (let y = -tile * 2; y < size + tile * 2; y += tile) {
      for (let x = -tile * 2; x < size + tile * 2; x += tile) {
        g.drawImage(grain, x, y, tile, tile);
      }
    }
    g.restore();
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

function floorCanvas(kind, conf) {
  if (kind === 'tile') return cachedCanvas(cfgKey('tile', conf), () => buildTile(conf));
  if (kind === 'stone') return cachedCanvas(cfgKey('stone', conf), () => buildStone(conf));
  return cachedCanvas(cfgKey('wood', conf), () => buildWood(conf.color, conf.size));
}

export function woodFloorTexture(w, d, cfg = {}) {
  const conf = { ...FLOOR_DEFAULTS.wood, ...cfg };
  const tex = toTexture(floorCanvas('wood', conf));
  tex.repeat.set(w / WOOD_TEX_METERS, d / WOOD_TEX_METERS);
  return tex;
}

// ---------- 地砖 / 石材（一张贴图 2×2 块） ----------

// 按实际砖规格生成画布：长边 1024，短边等比缩小，保证矩形砖不被拉伸
function paverLayout(w, d, groutMm) {
  const long = 1024;
  const cw = w >= d ? long : Math.round((long * w) / d);
  const ch = d >= w ? long : Math.round((long * d) / w);
  const pxPerM = cw / (w * 2);
  const grout = Math.max(1, Math.round((groutMm / 1000) * pxPerM));
  return { cw, ch, grout, cellW: cw / 2, cellH: ch / 2 };
}

function buildTile({ color, w, d }) {
  // 瓷质砖留缝 2mm；小规格防滑砖缝稍宽
  const groutMm = w <= 0.4 ? 3 : 2;
  const { cw, ch, grout, cellW, cellH } = paverLayout(w, d, groutMm);
  const c = makeCanvas(cw, ch);
  const g = c.getContext('2d');
  const rnd = rand(4421);

  g.fillStyle = shade(color, 0.86);
  g.fillRect(0, 0, cw, ch);

  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      const x = i * cellW + grout / 2;
      const y = j * cellH + grout / 2;
      const tw = cellW - grout;
      const th = cellH - grout;
      const tone = 0.978 + rnd() * 0.044;
      g.fillStyle = shade(color, tone);
      g.fillRect(x, y, tw, th);

      g.save();
      g.beginPath();
      g.rect(x, y, tw, th);
      g.clip();

      // 柔光釉面的斜向明暗
      const sheen = g.createLinearGradient(x, y, x + tw, y + th);
      sheen.addColorStop(0, 'rgba(255,255,255,0.04)');
      sheen.addColorStop(0.55, 'rgba(255,255,255,0)');
      sheen.addColorStop(1, 'rgba(0,0,0,0.028)');
      g.fillStyle = sheen;
      g.fillRect(x, y, tw, th);

      // 大板砖的淡雅石纹
      const veins = 2 + Math.round(w * d * 3);
      for (let v = 0; v < veins; v++) {
        g.strokeStyle = rgba(shade(color, rnd() > 0.5 ? 0.66 : 1.12), 0.03 + rnd() * 0.04);
        g.lineWidth = 0.5 + rnd() * 1.4;
        const sx = x + rnd() * tw;
        const sy = y + rnd() * th;
        g.beginPath();
        g.moveTo(sx, sy);
        g.bezierCurveTo(
          sx + (rnd() - 0.5) * tw * 0.8, sy + rnd() * th * 0.5,
          sx + (rnd() - 0.5) * tw * 0.8, sy + th * 0.5 + rnd() * th * 0.4,
          sx + (rnd() - 0.5) * tw * 0.6, y + th,
        );
        g.stroke();
      }

      // 细颗粒
      const grains = Math.round(24 + w * d * 40);
      for (let k = 0; k < grains; k++) {
        g.fillStyle = rgba(rnd() > 0.5 ? '#ffffff' : shade(color, 0.65), 0.06 + rnd() * 0.08);
        g.fillRect(x + rnd() * tw, y + rnd() * th, 1 + rnd() * 1.4, 1 + rnd() * 1.4);
      }
      g.restore();

      // 砖边倒角的一线过渡
      g.strokeStyle = rgba(shade(color, 0.76), 0.22);
      g.lineWidth = 1;
      g.strokeRect(x + 0.5, y + 0.5, tw - 1, th - 1);
    }
  }

  return c;
}

function buildStone({ color, w, d }) {
  const { cw, ch, grout, cellW, cellH } = paverLayout(w, d, 2.5);
  const c = makeCanvas(cw, ch);
  const g = c.getContext('2d');
  const rnd = rand(771);

  g.fillStyle = shade(color, 0.84);
  g.fillRect(0, 0, cw, ch);

  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      const x = i * cellW + grout / 2;
      const y = j * cellH + grout / 2;
      const tw = cellW - grout;
      const th = cellH - grout;
      const tone = 0.94 + rnd() * 0.08;
      g.fillStyle = shade(color, tone);
      g.fillRect(x, y, tw, th);

      g.save();
      g.beginPath();
      g.rect(x, y, tw, th);
      g.clip();
      // 哑光石材的云状纹理
      for (let v = 0; v < 3; v++) {
        const sx = x + rnd() * tw;
        const sy = y + rnd() * th;
        g.strokeStyle = rgba(shade(color, rnd() > 0.5 ? 0.78 : 1.1), 0.02 + rnd() * 0.025);
        g.lineWidth = 12 + rnd() * 26;
        g.beginPath();
        g.moveTo(sx, sy);
        g.bezierCurveTo(
          sx + (rnd() - 0.5) * tw * 0.9, sy + rnd() * th * 0.6,
          sx + (rnd() - 0.5) * tw * 0.9, sy + th * 0.6, sx + (rnd() - 0.5) * tw, y + th,
        );
        g.stroke();
      }
      const grains = Math.round(40 + w * d * 90);
      for (let k = 0; k < grains; k++) {
        g.fillStyle = rgba(rnd() > 0.45 ? shade(color, 0.68) : shade(color, 1.18), 0.07 + rnd() * 0.1);
        g.fillRect(x + rnd() * tw, y + rnd() * th, 1 + rnd() * 2.4, 1 + rnd() * 1.6);
      }
      g.restore();
    }
  }

  return c;
}

export function tileFloorTexture(w, d, cfg = {}) {
  const conf = { ...FLOOR_DEFAULTS.tile, ...cfg };
  const tex = toTexture(floorCanvas('tile', conf));
  // 贴图里是 2×2 块，覆盖 2 × w 米、2 × d 米
  tex.repeat.set(w / (conf.w * 2), d / (conf.d * 2));
  return tex;
}

// ---------- 入户石材（一张贴图 2×2 块） ----------

export function stoneFloorTexture(w, d, cfg = {}) {
  const conf = { ...FLOOR_DEFAULTS.stone, ...cfg };
  const tex = toTexture(floorCanvas('stone', conf));
  tex.repeat.set(w / (conf.w * 2), d / (conf.d * 2));
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

  // 哑光乳胶漆：只有极轻的滚涂颗粒
  g.globalAlpha = 0.035;
  for (let i = 0; i < 1800; i++) {
    g.fillStyle = rnd() > 0.5 ? '#ffffff' : shade(color, 0.75);
    g.fillRect(rnd() * WALL_SIZE, rnd() * WALL_SIZE, 1.2, 1.2);
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

function wallCanvas(conf) {
  const builder = WALL_BUILDERS[conf.finish] || buildPaint;
  return cachedCanvas(`wall|${conf.finish}|${conf.color.toLowerCase()}`, () => builder(conf.color));
}

export function wallTexture(cfg = {}) {
  const conf = { ...WALL_DEFAULT, ...cfg };
  const tex = toTexture(wallCanvas(conf));
  tex.repeat.set(1, 1);
  return tex;
}

// ---------- PBR 派生：法线 / 粗糙度 ----------

const reliefCache = new Map();

function sampleLuminance(canvas, size) {
  const src = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
  const field = new Float32Array(size * size);
  const stepX = canvas.width / size;
  const stepY = canvas.height / size;
  for (let y = 0; y < size; y++) {
    const sy = Math.min(canvas.height - 1, Math.floor(y * stepY));
    for (let x = 0; x < size; x++) {
      const sx = Math.min(canvas.width - 1, Math.floor(x * stepX));
      const i = (sy * canvas.width + sx) * 4;
      field[y * size + x] = (src[i] * 0.299 + src[i + 1] * 0.587 + src[i + 2] * 0.114) / 255;
    }
  }
  return field;
}

function blurField(field, size, passes) {
  let src = field;
  for (let p = 0; p < passes; p++) {
    const out = new Float32Array(size * size);
    for (let y = 0; y < size; y++) {
      const up = ((y + size - 1) % size) * size;
      const down = ((y + 1) % size) * size;
      const row = y * size;
      for (let x = 0; x < size; x++) {
        const left = (x + size - 1) % size;
        const right = (x + 1) % size;
        out[row + x] = (src[up + left] + src[up + x] + src[up + right]
          + src[row + left] + src[row + x] + src[row + right]
          + src[down + left] + src[down + x] + src[down + right]) / 9;
      }
    }
    src = out;
  }
  return src;
}

// 由颜色贴图的明度场派生法线（Sobel）与粗糙度（凹陷处更粗糙）
function buildRelief(colorCanvas, { normalStrength, baseRough, roughRange, blur }) {
  const size = MAP_SIZE;
  const field = blurField(sampleLuminance(colorCanvas, size), size, blur);
  let mean = 0;
  for (let i = 0; i < field.length; i++) mean += field[i];
  mean /= field.length;

  const normalCanvas = makeCanvas(size);
  const roughCanvas = makeCanvas(size);
  const nctx = normalCanvas.getContext('2d');
  const rctx = roughCanvas.getContext('2d');
  const nimg = nctx.createImageData(size, size);
  const rimg = rctx.createImageData(size, size);

  for (let y = 0; y < size; y++) {
    const up = ((y + size - 1) % size) * size;
    const down = ((y + 1) % size) * size;
    const row = y * size;
    for (let x = 0; x < size; x++) {
      const left = (x + size - 1) % size;
      const right = (x + 1) % size;
      const dx = (field[row + right] - field[row + left]) * normalStrength;
      const dy = (field[down + x] - field[up + x]) * normalStrength;
      const inv = 1 / Math.hypot(dx, dy, 1);
      const i = (row + x) * 4;
      nimg.data[i] = ((-dx * inv) * 0.5 + 0.5) * 255;
      nimg.data[i + 1] = ((-dy * inv) * 0.5 + 0.5) * 255;
      nimg.data[i + 2] = (inv * 0.5 + 0.5) * 255;
      nimg.data[i + 3] = 255;
      const r = clamp(baseRough + (mean - field[row + x]) * roughRange, 0.04, 1) * 255;
      rimg.data[i] = r;
      rimg.data[i + 1] = r;
      rimg.data[i + 2] = r;
      rimg.data[i + 3] = 255;
    }
  }
  nctx.putImageData(nimg, 0, 0);
  rctx.putImageData(rimg, 0, 0);
  return { normal: normalCanvas, rough: roughCanvas };
}

function cachedRelief(key, build) {
  let entry = reliefCache.get(key);
  if (!entry) {
    entry = build();
    // 取色器可产生无限组合，缓存上限避免显存无限增长
    if (reliefCache.size > 16) reliefCache.delete(reliefCache.keys().next().value);
    reliefCache.set(key, entry);
  }
  return entry;
}

// 暖现代风格以哑光、柔光为主，避免高亮镜面反射
const FLOOR_SURFACE = {
  wood: { normalStrength: 2.0, baseRough: 0.56, roughRange: 0.8, blur: 2, clearcoat: 0.04, clearcoatRoughness: 0.72, env: 0.25, normalScale: 0.55 },
  tile: { normalStrength: 1.6, baseRough: 0.34, roughRange: 1.2, blur: 1, clearcoat: 0.1, clearcoatRoughness: 0.45, env: 0.3, normalScale: 0.6 },
  stone: { normalStrength: 1.4, baseRough: 0.58, roughRange: 1.0, blur: 1, clearcoat: 0.02, clearcoatRoughness: 0.8, env: 0.25, normalScale: 0.55 },
};

export function createFloorMaterial(kind, w, d, cfg = {}) {
  const conf = { ...FLOOR_DEFAULTS[kind], ...cfg };
  const surf = FLOOR_SURFACE[kind] || FLOOR_SURFACE.wood;
  const map = floorTexture(kind, w, d, conf);
  const { normal, rough } = cachedRelief(
    `floor|${cfgKey(kind, conf)}`,
    () => buildRelief(floorCanvas(kind, conf), surf),
  );
  const normalMap = toTexture(normal, 1, false);
  normalMap.repeat.copy(map.repeat);
  const roughnessMap = toTexture(rough, 1, false);
  roughnessMap.repeat.copy(map.repeat);
  return new THREE.MeshPhysicalMaterial({
    map,
    normalMap,
    roughnessMap,
    normalScale: new THREE.Vector2(surf.normalScale, surf.normalScale),
    roughness: 1,
    metalness: 0,
    clearcoat: surf.clearcoat,
    clearcoatRoughness: surf.clearcoatRoughness,
    envMapIntensity: surf.env,
  });
}

export function createWallMaterial(cfg = {}) {
  const conf = { ...WALL_DEFAULT, ...cfg };
  const map = wallTexture(conf);
  const plaster = pbrSet('plaster');
  let normalMap;
  let roughnessMap;
  if (plaster) {
    // 真实灰泥的微起伏；墙面 UV 已按 1.5 米一格换算
    normalMap = plaster.normal;
    roughnessMap = plaster.rough;
  } else {
    const relief = cachedRelief(
      `wall|${conf.finish}|${conf.color.toLowerCase()}`,
      () => buildRelief(wallCanvas(conf), { normalStrength: 0.9, baseRough: 0.9, roughRange: 0.25, blur: 2 }),
    );
    normalMap = toTexture(relief.normal, 1, false);
    roughnessMap = toTexture(relief.rough, 1, false);
  }
  return new THREE.MeshStandardMaterial({
    map,
    normalMap,
    roughnessMap,
    normalScale: new THREE.Vector2(0.38, 0.38),
    roughness: 1,
    metalness: 0,
    envMapIntensity: 0.15,
  });
}

// ---------- 天空 ----------

let skyBase = null;
let skyOverride = null;

export function setSkyTexture(tex) {
  skyOverride = tex;
}

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
  if (skyOverride) return skyOverride;
  if (!skyBase) buildSky();
  const tex = new THREE.CanvasTexture(skyBase);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = ANISO;
  return tex;
}
