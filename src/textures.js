import * as THREE from 'three';

const ANISO = 8;

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

// ---------- 木地板（贴图覆盖 2m × 2m） ----------

let woodBase = null;

function buildWood() {
  const size = 512;
  const c = makeCanvas(size);
  const g = c.getContext('2d');
  const rnd = rand(9137);

  g.fillStyle = '#9c6f47';
  g.fillRect(0, 0, size, size);

  const rows = 6;
  const rowH = size / rows;

  for (let row = 0; row < rows; row++) {
    const y = row * rowH;
    const tone = 0.86 + rnd() * 0.26;
    const r = Math.round(166 * tone);
    const gr = Math.round(120 * tone);
    const b = Math.round(78 * tone);
    g.fillStyle = `rgb(${r},${gr},${b})`;
    g.fillRect(0, y, size, rowH);

    // 木纹
    for (let i = 0; i < 26; i++) {
      const gy = y + rnd() * rowH;
      g.strokeStyle = `rgba(72,46,28,${0.035 + rnd() * 0.07})`;
      g.lineWidth = 0.6 + rnd() * 1.4;
      g.beginPath();
      g.moveTo(0, gy);
      for (let x = 0; x <= size; x += 32) {
        g.lineTo(x, gy + Math.sin((x / size) * Math.PI * (1 + rnd()) + row) * 1.8);
      }
      g.stroke();
    }

    // 板缝
    g.fillStyle = 'rgba(52,33,20,0.55)';
    g.fillRect(0, y, size, 2);

    // 错缝端头
    const joints = 2 + Math.floor(rnd() * 2);
    for (let j = 0; j < joints; j++) {
      const x = Math.floor(rnd() * size);
      g.fillStyle = 'rgba(52,33,20,0.45)';
      g.fillRect(x, y + 2, 2, rowH - 2);
    }
  }

  // 整体明暗
  const vg = g.createLinearGradient(0, 0, size, size);
  vg.addColorStop(0, 'rgba(255,235,205,0.10)');
  vg.addColorStop(0.5, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(30,18,10,0.12)');
  g.fillStyle = vg;
  g.fillRect(0, 0, size, size);

  woodBase = c;
}

export function woodFloorTexture(w, d) {
  if (!woodBase) buildWood();
  const tex = toTexture(woodBase);
  tex.repeat.set(w / 2, d / 2);
  return tex;
}

// ---------- 地砖（贴图覆盖 1.2m × 1.2m，2×2 块） ----------

let tileBase = null;

function buildTile() {
  const size = 512;
  const c = makeCanvas(size);
  const g = c.getContext('2d');
  const rnd = rand(4421);

  g.fillStyle = '#c8c4bd';
  g.fillRect(0, 0, size, size);

  const cell = size / 2;
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      const tone = 0.97 + rnd() * 0.045;
      g.fillStyle = `rgb(${Math.round(226 * tone)},${Math.round(223 * tone)},${Math.round(216 * tone)})`;
      g.fillRect(i * cell + 2, j * cell + 2, cell - 4, cell - 4);
    }
  }

  // 细腻石纹
  g.globalAlpha = 0.16;
  for (let i = 0; i < 260; i++) {
    g.fillStyle = rnd() > 0.5 ? '#ffffff' : '#9c968c';
    const x = rnd() * size;
    const y = rnd() * size;
    g.fillRect(x, y, 1 + rnd() * 2, 1 + rnd() * 2);
  }
  g.globalAlpha = 1;

  // 十字砖缝
  g.strokeStyle = 'rgba(145,139,130,0.85)';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(cell, 0);
  g.lineTo(cell, size);
  g.moveTo(0, cell);
  g.lineTo(size, cell);
  g.stroke();

  tileBase = c;
}

export function tileFloorTexture(w, d) {
  if (!tileBase) buildTile();
  const tex = toTexture(tileBase);
  tex.repeat.set(w / 1.2, d / 1.2);
  return tex;
}

// ---------- 入户石材（贴图覆盖 1.6m） ----------

let stoneBase = null;

function buildStone() {
  const size = 512;
  const c = makeCanvas(size);
  const g = c.getContext('2d');
  const rnd = rand(771);

  g.fillStyle = '#a9a49b';
  g.fillRect(0, 0, size, size);

  const cell = size / 2;
  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      const tone = 0.9 + rnd() * 0.16;
      g.fillStyle = `rgb(${Math.round(158 * tone)},${Math.round(152 * tone)},${Math.round(143 * tone)})`;
      g.fillRect(i * cell + 2, j * cell + 2, cell - 4, cell - 4);
    }
  }

  g.globalAlpha = 0.22;
  for (let i = 0; i < 400; i++) {
    g.fillStyle = rnd() > 0.45 ? '#6f6a62' : '#ded9d0';
    g.fillRect(rnd() * size, rnd() * size, 1 + rnd() * 3, 1 + rnd() * 2);
  }
  g.globalAlpha = 1;

  stoneBase = c;
}

export function stoneFloorTexture(w, d) {
  if (!stoneBase) buildStone();
  const tex = toTexture(stoneBase);
  tex.repeat.set(w / 1.6, d / 1.6);
  return tex;
}

// ---------- 墙面（细噪点乳胶漆） ----------

let wallBase = null;

function buildWall() {
  const size = 512;
  const c = makeCanvas(size);
  const g = c.getContext('2d');
  const rnd = rand(31337);

  g.fillStyle = '#efeae2';
  g.fillRect(0, 0, size, size);

  g.globalAlpha = 0.05;
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = rnd() > 0.5 ? '#ffffff' : '#bdb5a8';
    g.fillRect(rnd() * size, rnd() * size, 1.4, 1.4);
  }
  g.globalAlpha = 1;

  wallBase = c;
}

export function wallTexture() {
  if (!wallBase) buildWall();
  const tex = toTexture(wallBase);
  tex.repeat.set(1.6, 1.6);
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
