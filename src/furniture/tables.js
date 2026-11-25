import * as THREE from 'three';
import { part, MAT, B, RB, CYL, LATHE, BOOK_MATS, ovalGeo, tube, framedArt, centerpiece, placeSetting } from './core.js';

export function coffeeRect() {
  const g = new THREE.Group();
  part(g, RB(1.1, 0.05, 0.6, 0.02), MAT.oak, 0, 0.4, 0);
  part(g, RB(0.94, 0.03, 0.46, 0.012), MAT.walnut, 0, 0.15, 0);
  for (const x of [-0.48, 0.48]) {
    for (const z of [-0.22, 0.22]) part(g, CYL(0.018, 0.022, 0.38, 10), MAT.walnut, x, 0.19, z);
  }
  part(g, CYL(0.055, 0.065, 0.16, 18), MAT.ceramic, -0.28, 0.505, 0.02);
  // 带书页的两本书
  part(g, B(0.23, 0.012, 0.17), BOOK_MATS[0], 0.16, 0.431, 0.05);
  part(g, B(0.215, 0.03, 0.155), MAT.cream, 0.16, 0.452, 0.05);
  part(g, B(0.23, 0.012, 0.17), BOOK_MATS[0], 0.16, 0.473, 0.05);
  part(g, B(0.2, 0.012, 0.15), BOOK_MATS[2], 0.17, 0.485, 0.045, 0, 0.16);
  return g;
}

export function coffeeRound() {
  const g = new THREE.Group();
  part(g, CYL(0.45, 0.45, 0.05, 40), MAT.oak, 0, 0.42, 0);
  part(g, CYL(0.09, 0.11, 0.34, 20), MAT.walnut, 0, 0.2, 0);
  part(g, CYL(0.24, 0.27, 0.035, 28), MAT.walnut, 0, 0.018, 0);
  part(g, CYL(0.05, 0.06, 0.15, 18), MAT.ceramic, 0.16, 0.52, -0.1);
  part(g, B(0.22, 0.012, 0.16), BOOK_MATS[1], -0.14, 0.456, 0.06);
  part(g, B(0.205, 0.03, 0.145), MAT.cream, -0.14, 0.477, 0.06);
  part(g, B(0.22, 0.012, 0.16), BOOK_MATS[1], -0.14, 0.498, 0.06);
  return g;
}

export function coffeeNesting() {
  const g = new THREE.Group();
  part(g, CYL(0.37, 0.37, 0.04, 36), MAT.paleWood, -0.18, 0.43, -0.06);
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3 + 0.5;
    part(g, CYL(0.014, 0.016, 0.41, 8), MAT.black, -0.18 + Math.cos(a) * 0.28, 0.21, -0.06 + Math.sin(a) * 0.28);
  }
  part(g, CYL(0.23, 0.23, 0.035, 32), MAT.oak, 0.34, 0.34, 0.2);
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3;
    part(g, CYL(0.012, 0.014, 0.32, 8), MAT.black, 0.34 + Math.cos(a) * 0.16, 0.16, 0.2 + Math.sin(a) * 0.16);
  }
  part(g, CYL(0.05, 0.06, 0.14, 16), MAT.ceramic, -0.18, 0.52, -0.06);
  return g;
}

function tvScreenGeometry(w = 1.24, h = 0.67) {
  const geo = new THREE.PlaneGeometry(w, h, 24, 12);
  const uv = geo.attributes.uv;
  const colors = new Float32Array(uv.count * 3);
  for (let i = 0; i < uv.count; i++) {
    const u = uv.getX(i);
    const v = uv.getY(i);
    // 斜向柔光带，模拟熄屏面板对室内光线的反射
    const d = (u - 0.62) + (v - 0.72) * 0.55;
    const streak = Math.exp(-(d * d) / (2 * 0.07 * 0.07));
    const echo = Math.exp(-((d + 0.52) * (d + 0.52)) / (2 * 0.1 * 0.1));
    const val = Math.min(1, 0.012 + streak * 0.72 + echo * 0.22 + v * 0.03);
    colors[i * 3] = val * 0.92;
    colors[i * 3 + 1] = val * 0.96;
    colors[i * 3 + 2] = val;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}

function addTv(g, y, width = 1.32) {
  const h = +(width * 0.568).toFixed(3);
  part(g, B(width * 0.32, 0.02, 0.2), MAT.black, 0, y + 0.01, -0.02);
  part(g, B(0.07, 0.12, 0.05), MAT.black, 0, y + 0.07, -0.05);
  part(g, B(width, h, 0.045), MAT.bezel, 0, y + 0.12 + h / 2, 0);
  part(g, tvScreenGeometry(width * 0.94, h * 0.9), MAT.screen, 0, y + 0.12 + h / 2, 0.0335);
}

export function tvStorage() {
  const g = new THREE.Group();
  // 内收底座，让柜体有悬浮感
  part(g, B(1.52, 0.04, 0.3), MAT.shadow, 0, 0.02, 0);
  part(g, RB(1.8, 0.42, 0.4, 0.02), MAT.cream, 0, 0.27, 0);
  part(g, RB(1.82, 0.035, 0.42, 0.012), MAT.oak, 0, 0.497, 0);
  for (const x of [-0.44, 0.44]) {
    part(g, RB(0.84, 0.32, 0.02, 0.008), MAT.cream, x, 0.26, 0.205);
    part(g, B(0.76, 0.26, 0.004), MAT.shadow, x, 0.26, 0.216);
    part(g, RB(0.74, 0.24, 0.012, 0.006), MAT.cream, x, 0.26, 0.219);
    part(g, B(0.16, 0.012, 0.014), MAT.metal, x + (x < 0 ? 0.3 : -0.3), 0.38, 0.232);
  }
  // 回音壁
  part(g, RB(0.9, 0.055, 0.09, 0.02), MAT.fabricDark, 0, 0.545, 0.1);
  addTv(g, 0.515, 1.32);
  part(g, LATHE([[0.02, 0], [0.055, 0.01], [0.065, 0.06], [0.05, 0.15], [0.045, 0.18]]), MAT.ceramic, -0.78, 0.515, 0);
  for (let i = 0; i < 3; i++) {
    part(g, B(0.22, 0.03, 0.15), BOOK_MATS[i], 0.72, 0.53 + i * 0.03, 0);
  }
  return g;
}

export function tvFloating() {
  const g = new THREE.Group();
  part(g, RB(1.8, 0.34, 0.34, 0.03), MAT.cream, 0, 0.42, 0);
  part(g, RB(1.82, 0.03, 0.36, 0.012), MAT.oak, 0, 0.605, 0);
  // 墙面暗藏支撑
  for (const x of [-0.7, 0.7]) part(g, B(0.05, 0.2, 0.02), MAT.shadow, x, 0.32, -0.16);
  part(g, B(1.5, 0.012, 0.012), MAT.metal, 0, 0.42, 0.172);
  part(g, RB(0.86, 0.05, 0.08, 0.018), MAT.fabricDark, 0, 0.645, 0.06);
  addTv(g, 0.62, 1.28);
  part(g, LATHE([[0.02, 0], [0.05, 0.01], [0.06, 0.06], [0.045, 0.14], [0.04, 0.17]]), MAT.ceramic, -0.72, 0.62, 0);
  part(g, B(0.22, 0.03, 0.14), MAT.fabricDark, 0.66, 0.635, 0);
  return g;
}

export function tvLong() {
  const g = new THREE.Group();
  for (const x of [-1.1, 1.1]) {
    for (const z of [-0.13, 0.13]) part(g, CYL(0.016, 0.02, 0.06, 8), MAT.black, x, 0.03, z);
  }
  part(g, RB(2.4, 0.3, 0.36, 0.02), MAT.walnut, 0, 0.21, 0);
  part(g, RB(2.42, 0.03, 0.38, 0.012), MAT.oak, 0, 0.375, 0);
  for (let i = 0; i < 3; i++) {
    part(g, B(0.76, 0.24, 0.012), MAT.paleWood, -0.8 + i * 0.8, 0.21, 0.184);
    part(g, B(0.16, 0.01, 0.01), MAT.metal, -0.8 + i * 0.8, 0.28, 0.192);
  }
  addTv(g, 0.395, 1.56);
  part(g, CYL(0.05, 0.06, 0.18, 16), MAT.ceramic, -1.05, 0.49, 0);
  for (let i = 0; i < 3; i++) {
    part(g, B(0.2, 0.03, 0.14), BOOK_MATS[i], 1.0, 0.41 + i * 0.03, 0);
  }
  // 电视上方挂画，避免整面空墙
  const art = framedArt(1.2, 0.64, 0);
  art.position.set(0, 1.98, -0.185);
  g.add(art);
  return g;
}

export function diningRect() {
  const g = new THREE.Group();
  part(g, RB(1.4, 0.055, 0.85, 0.022), MAT.oak, 0, 0.735, 0);
  part(g, RB(1.32, 0.03, 0.77, 0.01), MAT.walnut, 0, 0.695, 0);
  part(g, RB(1.28, 0.09, 0.7, 0.012), MAT.walnut, 0, 0.65, 0);
  for (const x of [-0.6, 0.6]) {
    for (const z of [-0.33, 0.33]) {
      const leg = part(g, CYL(0.031, 0.021, 0.71, 12), MAT.walnut, x, 0.355, z);
      leg.rotation.z = x > 0 ? -0.035 : 0.035;
      leg.rotation.x = z > 0 ? 0.035 : -0.035;
    }
  }
  centerpiece(g, 0.7625);
  return g;
}

export function diningRound() {
  const g = new THREE.Group();
  // 圆角桌沿的整块实木台面
  part(g, LATHE([
    [0, 0], [0.52, 0], [0.542, 0.002], [0.55, 0.012], [0.548, 0.032], [0.532, 0.05], [0.5, 0.055], [0, 0.055],
  ], 64), MAT.oak, 0, 0.6775, 0);
  part(g, CYL(0.29, 0.31, 0.055, 32), MAT.walnut, 0, 0.665, 0);
  part(g, LATHE([
    [0.3, 0], [0.31, 0.025], [0.2, 0.05], [0.09, 0.1], [0.07, 0.32], [0.06, 0.56], [0.085, 0.61],
  ], 28), MAT.walnut, 0, 0, 0);
  centerpiece(g, 0.7325);
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + i * Math.PI / 2;
    placeSetting(g, Math.cos(a) * 0.385, Math.sin(a) * 0.385, 0.7335, -a - Math.PI / 2);
  }
  return g;
}

// 四腿圆桌：与独腿圆桌区分款式
export function diningRoundLegs() {
  const g = new THREE.Group();
  part(g, LATHE([
    [0, 0], [0.52, 0], [0.542, 0.002], [0.55, 0.012], [0.548, 0.032], [0.532, 0.05], [0.5, 0.055], [0, 0.055],
  ], 64), MAT.oak, 0, 0.68, 0);
  part(g, CYL(0.44, 0.44, 0.035, 48), MAT.walnut, 0, 0.6625, 0);
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + i * Math.PI / 2;
    const x = Math.cos(a) * 0.33;
    const z = Math.sin(a) * 0.33;
    const leg = part(g, CYL(0.024, 0.017, 0.66, 12), MAT.walnut, x, 0.33, z);
    leg.rotation.z = x * 0.12;
    leg.rotation.x = -z * 0.12;
  }
  centerpiece(g, 0.735);
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + i * Math.PI / 2;
    placeSetting(g, Math.cos(a) * 0.385, Math.sin(a) * 0.385, 0.736, -a - Math.PI / 2);
  }
  return g;
}

export function diningOval() {
  const g = new THREE.Group();
  part(g, ovalGeo(0.75, 0.45, 0.055, null, 0.01), MAT.oak, 0, 0.71, 0);
  part(g, ovalGeo(0.62, 0.36, 0.05, null, 0.008), MAT.walnut, 0, 0.67, 0);
  for (const x of [-0.34, 0.34]) {
    part(g, LATHE([
      [0.2, 0], [0.21, 0.025], [0.14, 0.06], [0.075, 0.14], [0.062, 0.4], [0.08, 0.52], [0.075, 0.58],
    ], 24), MAT.walnut, x, 0.03, 0);
    const foot = part(g, CYL(0.19, 0.21, 0.03, 24), MAT.walnut, x, 0.015, 0);
    foot.scale.z = 0.72;
  }
  centerpiece(g, 0.765);
  return g;
}


function deskThings(g) {
  part(g, RB(0.32, 0.014, 0.22, 0.005), MAT.bezel, -0.2, 0.782, 0.05);
  part(g, RB(0.32, 0.21, 0.012, 0.004), MAT.bezel, -0.2, 0.895, -0.03, -0.2);
  part(g, B(0.29, 0.19, 0.002), MAT.blackGlass, -0.2, 0.896, -0.022, -0.2);
  part(g, RB(0.3, 0.012, 0.19, 0.004), MAT.bezel, 0.22, 0.775, 0.04);
  part(g, B(0.26, 0.008, 0.16), MAT.cream, 0.22, 0.785, 0.04);
  part(g, CYL(0.038, 0.032, 0.09, 18), MAT.ceramic, 0.55, 0.815, -0.14);
  part(g, new THREE.TorusGeometry(0.028, 0.007, 8, 16, Math.PI), MAT.ceramic, 0.588, 0.82, -0.14, 0, 0, -Math.PI / 2);
  tube(g, [[-0.05, 0.775, 0.12], [0.02, 0.77, 0.2], [0.25, 0.77, 0.18], [0.4, 0.775, 0.08]], 0.004, MAT.black);
}

export function deskLegs() {
  const g = new THREE.Group();
  part(g, RB(1.2, 0.045, 0.6, 0.018), MAT.oak, 0, 0.745, 0);
  part(g, RB(1.12, 0.07, 0.54, 0.012), MAT.walnut, 0, 0.7, 0);
  for (const x of [-0.55, 0.55]) {
    for (const z of [-0.26, 0.26]) part(g, B(0.045, 0.72, 0.045), MAT.black, x, 0.36, z);
  }
  part(g, B(1.06, 0.02, 0.02), MAT.black, 0, 0.16, 0);
  deskThings(g);
  return g;
}

export function deskPedestal() {
  const g = new THREE.Group();
  part(g, RB(1.2, 0.045, 0.6, 0.018), MAT.oak, 0, 0.745, 0);
  part(g, RB(1.14, 0.07, 0.54, 0.012), MAT.walnut, 0, 0.7, 0);
  part(g, B(1.12, 0.04, 0.5), MAT.shadow, 0, 0.03, 0);
  part(g, RB(0.42, 0.65, 0.56, 0.015), MAT.oak, 0.36, 0.395, 0);
  for (let i = 0; i < 3; i++) {
    part(g, RB(0.37, 0.16, 0.018, 0.006), MAT.cream, 0.36, 0.2 + i * 0.19, 0.283);
    part(g, B(0.31, 0.12, 0.004), MAT.shadow, 0.36, 0.2 + i * 0.19, 0.292);
    part(g, RB(0.29, 0.1, 0.01, 0.005), MAT.cream, 0.36, 0.2 + i * 0.19, 0.295);
    part(g, B(0.14, 0.012, 0.012), MAT.metal, 0.36, 0.26 + i * 0.19, 0.31);
  }
  for (const z of [-0.24, 0.24]) part(g, CYL(0.02, 0.017, 0.72, 8), MAT.black, -0.55, 0.36, z);
  part(g, B(0.86, 0.2, 0.02), MAT.paleWood, -0.14, 0.6, -0.27);
  deskThings(g);
  return g;
}

export function bookshelfOpen() {
  const g = new THREE.Group();
  const W = 0.9;
  const H = 1.9;
  const D = 0.26;
  // 框架：背板、侧板、顶底板与层板
  part(g, B(W - 0.06, 0.05, D - 0.04), MAT.shadow, 0, 0.025, 0);
  part(g, B(W, H, 0.018), MAT.oak, 0, H / 2, -D / 2 + 0.01);
  for (const s of [-1, 1]) part(g, B(0.03, H, D), MAT.oak, s * (W / 2 - 0.015), H / 2, 0);
  part(g, B(W, 0.035, D), MAT.oak, 0, H - 0.0175, 0);
  for (const y of [0.055, 0.5, 0.95, 1.4, 1.845]) {
    part(g, B(W - 0.05, 0.03, D - 0.02), MAT.oak, 0, y, 0.005);
    part(g, B(W - 0.05, 0.014, 0.012), MAT.walnut, 0, y, D / 2 - 0.006);
  }

  const rows = [
    { y: 0.07, n: 9, seed: 1 },
    { y: 0.515, n: 8, seed: 2 },
    { y: 0.965, n: 7, seed: 3 },
    { y: 1.415, n: 5, seed: 4 },
  ];
  rows.forEach((row, ri) => {
    let x = -W / 2 + 0.055;
    for (let i = 0; i < row.n; i++) {
      const w = 0.036 + ((i * 7 + ri * 3) % 3) * 0.014;
      const h = 0.25 + ((i * 5 + ri * 2) % 4) * 0.028;
      if (x + w > W / 2 - 0.05) break;
      if ((i + ri * 2) % 7 === 3) {
        const stack = 2 + (i % 2);
        let sy = row.y;
        for (let k = 0; k < stack; k++) {
          const sw = w + 0.022;
          part(g, B(sw, 0.028, 0.17), BOOK_MATS[(i + k + 1) % BOOK_MATS.length], x + sw / 2, sy + 0.014, 0.02);
          sy += 0.03;
        }
        x += w + 0.035;
      } else if ((i + ri) % 6 === 4) {
        part(g, B(w, h, 0.17), BOOK_MATS[(i + ri) % BOOK_MATS.length], x + w / 2, row.y + h / 2, 0.02, 0, 0, 0.16);
        x += w + 0.03;
      } else {
        part(g, B(w, h, 0.17), BOOK_MATS[(i + ri) % BOOK_MATS.length], x + w / 2, row.y + h / 2, 0.02);
        x += w + 0.007;
      }
    }
  });

  // 顶部陶瓶与垂藤
  part(g, LATHE([[0.025, 0], [0.055, 0.01], [0.06, 0.05], [0.04, 0.11], [0.035, 0.13]]), MAT.ceramic, -0.28, 1.862, 0);
  part(g, CYL(0.004, 0.004, 0.18, 6), MAT.leaf, 0.24, 1.95, 0);
  for (const [x, y, z, sx, sy, sz] of [[0.22, 2.02, 0, 0.06, 0.01, 0.03], [0.27, 1.98, 0.02, 0.055, 0.01, 0.028]]) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 6), MAT.leafLight);
    leaf.scale.set(sx, sy, sz);
    leaf.position.set(x, y, z);
    leaf.rotation.z = 0.4;
    leaf.castShadow = true;
    g.add(leaf);
  }
  return g;
}

export function bookshelfLadder() {
  const g = new THREE.Group();
  const lean = -0.16;
  const zAt = (y) => 0.03 + Math.tan(-lean) * (y - 0.98);
  for (const x of [-0.33, 0.33]) {
    part(g, RB(0.045, 1.95, 0.1, 0.012), MAT.oak, x, 0.98, 0.03, lean);
  }
  const levels = [0.25, 0.6, 0.95, 1.3, 1.65];
  levels.forEach((y, i) => {
    const z = zAt(y);
    part(g, RB(0.68, 0.03, 0.28, 0.01), MAT.walnut, 0, y, z, lean);
    if (i === 1 || i === 3) {
      const n = i === 1 ? 6 : 4;
      for (let k = 0; k < n; k++) {
        const bw = 0.05 + ((k + i) % 3) * 0.012;
        const bh = 0.24 + ((k * 3 + i) % 3) * 0.03;
        part(g, B(bw, bh, 0.17), BOOK_MATS[(k + i) % BOOK_MATS.length], -0.28 + k * 0.06 + bw / 2, y + 0.015 + bh / 2, z - 0.02);
      }
    }
  });
  part(g, CYL(0.05, 0.06, 0.14, 16), MAT.ceramic, 0.22, 1.385, zAt(1.3));
  return g;
}

export function bookshelfCabinet() {
  const g = new THREE.Group();
  part(g, RB(1.0, 0.75, 0.38, 0.012), MAT.oak, 0, 0.375, 0);
  part(g, RB(1.02, 0.03, 0.4, 0.008), MAT.walnut, 0, 0.765, 0);
  for (const x of [-0.25, 0.25]) {
    part(g, B(0.48, 0.66, 0.012), MAT.paleWood, x, 0.37, 0.194);
    part(g, CYL(0.009, 0.009, 0.1, 8), MAT.metal, x + (x < 0 ? 0.18 : -0.18), 0.55, 0.206);
  }
  for (const x of [-0.485, 0.485]) part(g, B(0.03, 0.82, 0.34), MAT.oak, x, 1.19, -0.01);
  part(g, B(0.94, 0.82, 0.02), MAT.walnut, 0, 1.19, -0.18);
  for (const y of [0.78, 1.15, 1.52]) part(g, B(0.95, 0.03, 0.33), MAT.oak, 0, y, -0.01);
  const rows = [
    { y: 0.795, n: 9 },
    { y: 1.165, n: 8 },
    { y: 1.535, n: 6 },
  ];
  rows.forEach((row, ri) => {
    let x = -0.43;
    for (let i = 0; i < row.n; i++) {
      const w = 0.045 + ((i * 5 + ri * 2) % 3) * 0.012;
      const h = 0.26 + ((i * 3 + ri) % 3) * 0.025;
      part(g, B(w, h, 0.21), BOOK_MATS[(i + ri + 2) % BOOK_MATS.length], x + w / 2, row.y + h / 2, 0);
      x += w + 0.008;
      if (x > 0.42) break;
    }
  });
  return g;
}
