import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { pbrTextures } from './pbr.js';

// 家具统一约定：原点在地面中心，正面朝 +Z

const std = (color, roughness = 0.8, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

const phys = (params) => new THREE.MeshPhysicalMaterial(params);

const woodMat = (color, roughness) => phys({
  color, roughness, metalness: 0,
  clearcoat: 0.07, clearcoatRoughness: 0.65, envMapIntensity: 0.5,
});

const metalMat = (color, roughness, env = 1.2) => {
  const mat = new THREE.MeshStandardMaterial({ color, roughness, metalness: 1 });
  mat.envMapIntensity = env;
  return mat;
};

const fabric = (color, roughness = 0.94) => phys({
  color, roughness, metalness: 0,
  sheen: 0.35, sheenRoughness: 0.9,
  sheenColor: new THREE.Color(color).lerp(new THREE.Color(0xffffff), 0.35),
  envMapIntensity: 0.35,
});

const fabricDouble = (color, roughness = 0.94) => {
  const mat = fabric(color, roughness);
  mat.side = THREE.DoubleSide;
  return mat;
};

// 暖现代/奶油风：浅橡木、亚麻织物、哑光石英与拉丝五金
const MAT = {
  walnut: woodMat(0x5b4433, 0.58),
  oak: woodMat(0xb69570, 0.62),
  paleWood: woodMat(0xd2bb9e, 0.64),
  fabricGray: fabric(0x9c978e),
  fabricBeige: fabric(0xc1b2a0),
  fabricDark: fabric(0x5c5952),
  basket: fabricDouble(0xc1b2a0),
  basketLight: fabricDouble(0xd6ccbc),
  cream: phys({ color: 0xece6db, roughness: 0.7, metalness: 0, clearcoat: 0.04, clearcoatRoughness: 0.6, envMapIntensity: 0.45 }),
  white: phys({ color: 0xf1efe8, roughness: 0.55, metalness: 0, clearcoat: 0.1, clearcoatRoughness: 0.45, envMapIntensity: 0.6 }),
  ceramic: phys({ color: 0xf4f3ef, roughness: 0.22, metalness: 0, clearcoat: 0.5, clearcoatRoughness: 0.12, envMapIntensity: 0.9 }),
  black: std(0x232422, 0.6),
  metal: metalMat(0x8d9192, 0.34),
  brass: metalMat(0xa98a5e, 0.4),
  leaf: std(0x3f7a45, 0.75),
  leafLight: std(0x5d9558, 0.75),
  pot: std(0xa9a49c, 0.75),
  soil: std(0x3a2c21, 1),
  rug: fabric(0xc6b7a2, 1),
  rugBorder: fabric(0x9b8973, 1),
  duvet: fabric(0xe9e2d5, 0.95),
  duvetAccent: fabric(0xa6ae9f, 0.95),
  pillow: fabric(0xf2eee5, 0.95),
  screen: phys({ color: 0x8b98a4, roughness: 0.07, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04, vertexColors: true }),
  bezel: phys({ color: 0x0e1013, roughness: 0.35, metalness: 0, clearcoat: 0.7, clearcoatRoughness: 0.2 }),
  mirror: metalMat(0xc9d8de, 0.04, 1.6),
  glass: phys({
    color: 0xdfeaeb, transparent: true, opacity: 0.12, roughness: 0.03,
    metalness: 0, ior: 1.5, envMapIntensity: 1.5,
    side: THREE.DoubleSide, depthWrite: false,
  }),
  stoneTop: phys({ color: 0xe6e2d8, roughness: 0.34, metalness: 0, clearcoat: 0.12, clearcoatRoughness: 0.5, envMapIntensity: 0.7 }),
};

const BOOK_COLORS = [0x7a4a3a, 0x3e5a6b, 0x7b6b45, 0x8c8c8c, 0x4f6350, 0x9c7f5f];
const BOOK_MATS = BOOK_COLORS.map((c) => std(c, 0.9));

const FABRIC_MATS = ['fabricGray', 'fabricBeige', 'fabricDark', 'basket', 'basketLight', 'duvet', 'duvetAccent', 'pillow'];
const RUG_MATS = ['rug', 'rugBorder'];

// 载入真实贴图后给共享材质补上贴图；颜色仍由 MAT 里的色值控制
export function applyFurnitureTextures() {
  const oak = pbrTextures('oak', 1);
  if (!oak) return;
  const walnut = pbrTextures('walnut', 1);
  const linen = pbrTextures('linen', 1.5);
  const rugLinen = pbrTextures('linen', 8);
  const marble = pbrTextures('marble', 1);

  const assign = (mat, tex, normalScale, roughness = 1) => {
    mat.map = tex.map;
    mat.normalMap = tex.normalMap;
    mat.roughnessMap = tex.roughnessMap;
    mat.normalScale.set(normalScale, normalScale);
    mat.roughness = roughness;
    mat.needsUpdate = true;
  };

  assign(MAT.oak, oak, 0.9);
  assign(MAT.paleWood, oak, 0.9);
  assign(MAT.walnut, walnut, 1.0);
  for (const key of FABRIC_MATS) assign(MAT[key], linen, 2.2);
  for (const key of RUG_MATS) assign(MAT[key], rugLinen, 1.8);
  assign(MAT.stoneTop, marble, 0.35, 0.8);
}

function part(parent, geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
const RB = (w, h, d, r = 0.02) => new RoundedBoxGeometry(w, h, d, 3, r);
const CYL = (rt, rb, h, seg = 20) => new THREE.CylinderGeometry(rt, rb, h, seg);

// ---------- 软装 ----------

function sofaStraight(w = 2.1, seats = 2) {
  const g = new THREE.Group();
  const armW = 0.16;
  const inner = w - armW * 2 - 0.06;
  const cw = inner / seats;
  for (const x of [-(w / 2 - 0.13), w / 2 - 0.13]) {
    for (const z of [-0.34, 0.34]) part(g, CYL(0.025, 0.025, 0.12, 10), MAT.walnut, x, 0.06, z);
  }
  part(g, RB(w, 0.22, 0.9, 0.04), MAT.fabricGray, 0, 0.23, 0);
  part(g, RB(w, 0.52, 0.2, 0.06), MAT.fabricGray, 0, 0.6, -0.35);
  for (let i = 0; i < seats; i++) {
    const x = -inner / 2 + cw * (i + 0.5);
    part(g, RB(cw - 0.03, 0.16, 0.68, 0.05), MAT.fabricBeige, x, 0.42, 0.04);
    part(g, RB(cw - 0.05, 0.4, 0.14, 0.05), MAT.fabricBeige, x, 0.62, -0.22, -0.12);
  }
  for (const x of [-(w / 2 - armW / 2), w / 2 - armW / 2]) {
    part(g, RB(armW, 0.5, 0.9, 0.06), MAT.fabricGray, x, 0.37, 0);
  }
  for (const [x, rz] of [[-w / 4, 0.18], [w / 4, -0.18]]) {
    part(g, RB(0.32, 0.32, 0.11, 0.05), MAT.duvetAccent, x, 0.65, -0.1, 0, 0, rz);
  }
  return g;
}

function sofaCorner() {
  const g = new THREE.Group();
  for (const x of [-1.17, 0, 1.2]) {
    for (const z of [-0.78, -0.02]) part(g, CYL(0.025, 0.025, 0.12, 10), MAT.walnut, x, 0.06, z);
  }
  for (const x of [0.38, 1.2]) part(g, CYL(0.025, 0.025, 0.12, 10), MAT.walnut, x, 0.06, 0.78);
  part(g, RB(2.6, 0.22, 0.9, 0.04), MAT.fabricGray, 0, 0.23, -0.4);
  part(g, RB(1.0, 0.22, 0.8, 0.04), MAT.fabricGray, 0.8, 0.23, 0.45);
  part(g, RB(2.6, 0.52, 0.2, 0.06), MAT.fabricGray, 0, 0.6, -0.75);
  for (const x of [-0.62, 0.58]) {
    part(g, RB(1.18, 0.16, 0.68, 0.05), MAT.fabricBeige, x, 0.42, -0.36);
    part(g, RB(1.14, 0.4, 0.14, 0.05), MAT.fabricBeige, x, 0.62, -0.62, -0.12);
  }
  part(g, RB(0.92, 0.16, 0.72, 0.05), MAT.fabricBeige, 0.8, 0.42, 0.45);
  part(g, RB(0.16, 0.5, 0.9, 0.06), MAT.fabricGray, -1.22, 0.37, -0.4);
  part(g, RB(0.16, 0.34, 0.8, 0.06), MAT.fabricGray, 1.22, 0.3, 0.45);
  for (const [x, rz] of [[-0.62, 0.16], [0.16, -0.14]]) {
    part(g, RB(0.34, 0.32, 0.11, 0.05), MAT.duvetAccent, x, 0.65, -0.5, 0, 0, rz);
  }
  return g;
}

function armchairLounge() {
  const g = new THREE.Group();
  for (const x of [-0.34, 0.34]) {
    for (const z of [-0.32, 0.32]) part(g, CYL(0.022, 0.022, 0.12, 10), MAT.walnut, x, 0.06, z);
  }
  part(g, RB(0.85, 0.2, 0.85, 0.04), MAT.fabricBeige, 0, 0.22, 0);
  part(g, RB(0.66, 0.15, 0.64, 0.05), MAT.fabricBeige, 0, 0.39, 0.04);
  part(g, RB(0.85, 0.5, 0.18, 0.06), MAT.fabricBeige, 0, 0.57, -0.33);
  for (const x of [-0.39, 0.39]) part(g, RB(0.14, 0.42, 0.85, 0.05), MAT.fabricBeige, x, 0.34, 0);
  return g;
}

function armchairShell() {
  const g = new THREE.Group();
  for (const x of [-0.2, 0.2]) {
    for (const z of [-0.2, 0.2]) part(g, CYL(0.022, 0.017, 0.4, 10), MAT.walnut, x, 0.2, z);
  }
  part(g, new THREE.CylinderGeometry(0.38, 0.34, 0.6, 28, 1, true, 0.62, Math.PI * 2 - 1.24), MAT.basket, 0, 0.66, 0);
  part(g, CYL(0.32, 0.3, 0.12, 28), MAT.fabricBeige, 0, 0.42, 0);
  part(g, RB(0.5, 0.34, 0.12, 0.05), MAT.basketLight, 0, 0.68, -0.22, -0.15);
  return g;
}

function armchairRattan() {
  const g = new THREE.Group();
  for (const x of [-0.3, 0.3]) {
    for (const z of [-0.27, 0.27]) part(g, CYL(0.022, 0.018, 0.4, 10), MAT.oak, x, 0.2, z);
  }
  part(g, RB(0.7, 0.07, 0.66, 0.02), MAT.oak, 0, 0.42, 0);
  part(g, RB(0.62, 0.08, 0.58, 0.035), MAT.fabricBeige, 0, 0.49, 0.01);
  for (const x of [-0.32, 0.32]) part(g, CYL(0.022, 0.022, 0.55, 10), MAT.oak, x, 0.72, -0.3);
  for (const y of [0.52, 0.94]) part(g, B(0.68, 0.05, 0.05), MAT.oak, 0, y, -0.3);
  for (let i = 0; i <= 8; i++) {
    part(g, CYL(0.011, 0.011, 0.42, 8), MAT.paleWood, -0.28 + i * 0.07, 0.73, -0.3);
  }
  for (const y of [0.6, 0.7, 0.8, 0.9]) {
    part(g, CYL(0.009, 0.009, 0.62, 8), MAT.paleWood, 0, y, -0.3, 0, 0, Math.PI / 2);
  }
  return g;
}

function coffeeRect() {
  const g = new THREE.Group();
  part(g, RB(1.1, 0.05, 0.6, 0.02), MAT.oak, 0, 0.4, 0);
  part(g, RB(0.94, 0.03, 0.46, 0.012), MAT.walnut, 0, 0.15, 0);
  for (const x of [-0.48, 0.48]) {
    for (const z of [-0.22, 0.22]) part(g, CYL(0.018, 0.022, 0.38, 10), MAT.walnut, x, 0.19, z);
  }
  part(g, CYL(0.055, 0.065, 0.16, 18), MAT.ceramic, -0.28, 0.505, 0.02);
  part(g, B(0.22, 0.03, 0.16), MAT.fabricDark, 0.16, 0.44, 0.05);
  part(g, B(0.2, 0.025, 0.15), MAT.cream, 0.17, 0.468, 0.045, 0, 0.12);
  return g;
}

function coffeeRound() {
  const g = new THREE.Group();
  part(g, CYL(0.45, 0.45, 0.05, 40), MAT.oak, 0, 0.42, 0);
  part(g, CYL(0.09, 0.11, 0.34, 20), MAT.walnut, 0, 0.2, 0);
  part(g, CYL(0.24, 0.27, 0.035, 28), MAT.walnut, 0, 0.018, 0);
  part(g, CYL(0.05, 0.06, 0.15, 18), MAT.ceramic, 0.16, 0.52, -0.1);
  part(g, B(0.2, 0.03, 0.15), MAT.fabricDark, -0.14, 0.46, 0.06);
  return g;
}

function coffeeNesting() {
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

function tvStorage() {
  const g = new THREE.Group();
  part(g, B(1.72, 0.05, 0.36), MAT.black, 0, 0.025, 0);
  part(g, RB(1.8, 0.42, 0.4, 0.02), MAT.cream, 0, 0.27, 0);
  part(g, RB(1.82, 0.035, 0.42, 0.012), MAT.oak, 0, 0.497, 0);
  for (const x of [-0.44, 0.44]) {
    part(g, B(0.84, 0.3, 0.012), MAT.cream, x, 0.27, 0.204);
    part(g, CYL(0.008, 0.008, 0.12, 8), MAT.metal, x + (x < 0 ? 0.36 : -0.36), 0.27, 0.23, 0, 0, Math.PI / 2);
  }
  addTv(g, 0.515, 1.32);
  part(g, CYL(0.05, 0.06, 0.18, 16), MAT.ceramic, -0.75, 0.61, 0);
  for (let i = 0; i < 3; i++) {
    part(g, B(0.2, 0.03, 0.14), BOOK_MATS[i], 0.72, 0.53 + i * 0.03, 0);
  }
  return g;
}

function tvFloating() {
  const g = new THREE.Group();
  part(g, RB(1.8, 0.34, 0.34, 0.03), MAT.cream, 0, 0.42, 0);
  part(g, RB(1.82, 0.03, 0.36, 0.012), MAT.oak, 0, 0.605, 0);
  part(g, B(1.5, 0.012, 0.012), MAT.metal, 0, 0.42, 0.172);
  addTv(g, 0.62, 1.28);
  part(g, CYL(0.05, 0.06, 0.18, 16), MAT.ceramic, -0.7, 0.71, 0);
  part(g, B(0.22, 0.03, 0.14), MAT.fabricDark, 0.66, 0.635, 0);
  return g;
}

function tvLong() {
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
  return g;
}

function rug() {
  const g = new THREE.Group();
  part(g, B(2.4, 0.014, 1.6), MAT.rug, 0, 0.007, 0);
  part(g, B(2.4, 0.016, 0.08), MAT.rugBorder, 0, 0.009, 0.72);
  part(g, B(2.4, 0.016, 0.08), MAT.rugBorder, 0, 0.009, -0.72);
  part(g, B(0.08, 0.016, 1.44), MAT.rugBorder, 1.16, 0.009, 0);
  part(g, B(0.08, 0.016, 1.44), MAT.rugBorder, -1.16, 0.009, 0);
  return g;
}

// ---------- 桌椅 ----------

function diningRect() {
  const g = new THREE.Group();
  part(g, RB(1.4, 0.055, 0.85, 0.022), MAT.oak, 0, 0.73, 0);
  part(g, RB(1.28, 0.07, 0.72, 0.02), MAT.walnut, 0, 0.68, 0);
  for (const x of [-0.6, 0.6]) {
    for (const z of [-0.33, 0.33]) part(g, CYL(0.028, 0.022, 0.7, 10), MAT.walnut, x, 0.35, z);
  }
  part(g, CYL(0.11, 0.08, 0.08, 20), MAT.ceramic, 0, 0.8, 0);
  return g;
}

function diningRound() {
  const g = new THREE.Group();
  part(g, CYL(0.55, 0.55, 0.05, 44), MAT.oak, 0, 0.73, 0);
  part(g, CYL(0.07, 0.1, 0.62, 20), MAT.walnut, 0, 0.4, 0);
  part(g, CYL(0.3, 0.32, 0.04, 28), MAT.walnut, 0, 0.02, 0);
  part(g, CYL(0.11, 0.08, 0.08, 20), MAT.ceramic, 0, 0.8, 0);
  return g;
}

function diningOval() {
  const g = new THREE.Group();
  const top = part(g, CYL(0.75, 0.75, 0.05, 56), MAT.oak, 0, 0.73, 0);
  top.scale.z = 0.6;
  for (const x of [-0.32, 0.32]) {
    part(g, CYL(0.06, 0.085, 0.66, 18), MAT.walnut, x, 0.4, 0);
    const foot = part(g, CYL(0.2, 0.22, 0.035, 24), MAT.walnut, x, 0.018, 0);
    foot.scale.z = 0.7;
  }
  part(g, CYL(0.11, 0.08, 0.08, 20), MAT.ceramic, 0, 0.8, 0);
  return g;
}

function chairFabric() {
  const g = new THREE.Group();
  part(g, RB(0.46, 0.045, 0.46, 0.02), MAT.fabricBeige, 0, 0.45, 0);
  for (const x of [-0.19, 0.19]) {
    for (const z of [-0.19, 0.19]) part(g, B(0.035, 0.44, 0.035), MAT.walnut, x, 0.22, z);
  }
  for (const x of [-0.19, 0.19]) part(g, B(0.035, 0.42, 0.035), MAT.walnut, x, 0.68, -0.2);
  part(g, RB(0.43, 0.3, 0.04, 0.012), MAT.fabricBeige, 0, 0.78, -0.205);
  return g;
}

function chairWood() {
  const g = new THREE.Group();
  part(g, RB(0.45, 0.045, 0.44, 0.015), MAT.oak, 0, 0.45, 0);
  for (const x of [-0.18, 0.18]) {
    for (const z of [-0.18, 0.18]) part(g, CYL(0.018, 0.015, 0.44, 8), MAT.walnut, x, 0.22, z);
  }
  for (const x of [-0.18, 0.18]) part(g, B(0.035, 0.44, 0.035), MAT.walnut, x, 0.69, -0.2);
  for (const y of [0.66, 0.74, 0.82]) part(g, B(0.4, 0.045, 0.03), MAT.oak, 0, y, -0.2);
  return g;
}

function chairRattan() {
  const g = new THREE.Group();
  part(g, RB(0.45, 0.04, 0.44, 0.015), MAT.oak, 0, 0.45, 0);
  part(g, RB(0.4, 0.05, 0.38, 0.03), MAT.fabricBeige, 0, 0.49, 0.01);
  for (const x of [-0.18, 0.18]) {
    for (const z of [-0.18, 0.18]) part(g, CYL(0.018, 0.015, 0.44, 8), MAT.walnut, x, 0.22, z);
  }
  for (const x of [-0.19, 0.19]) part(g, CYL(0.02, 0.02, 0.42, 8), MAT.walnut, x, 0.68, -0.2);
  for (const y of [0.5, 0.88]) part(g, B(0.42, 0.035, 0.035), MAT.walnut, 0, y, -0.2);
  for (let i = 0; i <= 6; i++) {
    part(g, CYL(0.008, 0.008, 0.36, 6), MAT.paleWood, -0.16 + i * 0.054, 0.69, -0.2);
  }
  for (const y of [0.58, 0.68, 0.78]) {
    part(g, CYL(0.007, 0.007, 0.37, 6), MAT.paleWood, 0, y, -0.2, 0, 0, Math.PI / 2);
  }
  return g;
}

function deskLegs() {
  const g = new THREE.Group();
  part(g, RB(1.2, 0.05, 0.6, 0.02), MAT.oak, 0, 0.74, 0);
  for (const x of [-0.55, 0.55]) {
    for (const z of [-0.26, 0.26]) part(g, B(0.045, 0.72, 0.045), MAT.black, x, 0.36, z);
  }
  part(g, RB(0.9, 0.02, 0.5, 0.008), MAT.paleWood, 0, 0.2, 0);
  part(g, B(0.3, 0.06, 0.2), MAT.cream, -0.28, 0.795, -0.05);
  part(g, B(0.26, 0.03, 0.18), BOOK_MATS[0], -0.28, 0.84, -0.05);
  part(g, B(0.16, 0.015, 0.01), MAT.metal, 0.36, 0.78, 0.14, -0.35);
  return g;
}

function deskPedestal() {
  const g = new THREE.Group();
  part(g, RB(1.2, 0.045, 0.6, 0.02), MAT.oak, 0, 0.74, 0);
  part(g, RB(0.42, 0.62, 0.56, 0.015), MAT.oak, 0.36, 0.41, 0);
  for (let i = 0; i < 3; i++) {
    part(g, B(0.36, 0.16, 0.012), MAT.cream, 0.36, 0.22 + i * 0.19, 0.283);
    part(g, CYL(0.008, 0.008, 0.14, 8), MAT.metal, 0.36, 0.26 + i * 0.19, 0.295, 0, 0, Math.PI / 2);
  }
  for (const z of [-0.24, 0.24]) part(g, CYL(0.02, 0.017, 0.72, 8), MAT.black, -0.55, 0.36, z);
  part(g, B(0.86, 0.2, 0.02), MAT.paleWood, -0.14, 0.6, -0.27);
  part(g, B(0.28, 0.05, 0.18), MAT.cream, -0.26, 0.79, -0.05);
  part(g, B(0.24, 0.03, 0.17), BOOK_MATS[0], -0.26, 0.83, -0.05);
  return g;
}

function bookshelfOpen() {
  const g = new THREE.Group();
  for (const x of [-0.435, 0.435]) part(g, B(0.03, 1.9, 0.35), MAT.oak, x, 0.95, 0);
  part(g, B(0.9, 1.9, 0.02), MAT.walnut, 0, 0.95, -0.165);
  for (const y of [0.05, 0.5, 0.95, 1.4, 1.85]) part(g, B(0.87, 0.03, 0.34), MAT.oak, 0, y, 0);

  const rows = [
    { y: 0.065, n: 9 },
    { y: 0.515, n: 8 },
    { y: 0.965, n: 7 },
    { y: 1.415, n: 5 },
  ];
  rows.forEach((row, ri) => {
    let x = -0.4;
    for (let i = 0; i < row.n; i++) {
      const w = 0.045 + ((i * 7 + ri * 3) % 3) * 0.012;
      const h = 0.28 + ((i * 5 + ri) % 4) * 0.025;
      const mat = BOOK_MATS[(i + ri) % BOOK_MATS.length];
      part(g, B(w, h, 0.22), mat, x + w / 2, row.y + h / 2, 0.02);
      x += w + 0.008;
      if (x > 0.4) break;
    }
  });
  return g;
}

function bookshelfLadder() {
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

function bookshelfCabinet() {
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

// ---------- 卧室 ----------

function bedding(g, width, length) {
  part(g, RB(width - 0.1, 0.22, length - 0.12, 0.05), MAT.pillow, 0, 0.41, 0.03);
  part(g, RB(width - 0.08, 0.09, length * 0.62, 0.03), MAT.duvet, 0, 0.565, length * 0.16);
  part(g, RB(width - 0.06, 0.05, 0.3, 0.02), MAT.duvetAccent, 0, 0.63, length * 0.38);
  const pw = width / 2 - 0.12;
  for (const x of [-pw / 2 - 0.02, pw / 2 + 0.02]) {
    part(g, RB(pw - 0.06, 0.14, 0.34, 0.05), MAT.pillow, x, 0.59, -length / 2 + 0.28, -0.18);
  }
}

function bedWood(width, length) {
  const g = new THREE.Group();
  part(g, RB(width, 0.3, length, 0.03), MAT.walnut, 0, 0.15, 0);
  part(g, RB(width + 0.04, 0.95, 0.09, 0.03), MAT.walnut, 0, 0.5, -length / 2 - 0.03);
  bedding(g, width, length);
  return g;
}

function bedUpholstered(width, length) {
  const g = new THREE.Group();
  part(g, RB(width, 0.3, length, 0.04), MAT.fabricBeige, 0, 0.15, 0);
  part(g, B(width - 0.2, 0.06, length - 0.24), MAT.black, 0, 0.03, 0.02);
  part(g, RB(width + 0.06, 0.95, 0.07, 0.03), MAT.fabricBeige, 0, 0.55, -length / 2 - 0.03);
  const panels = Math.max(2, Math.round(width / 0.45));
  const panelW = (width + 0.04) / panels;
  for (let i = 0; i < panels; i++) {
    const x = -(width + 0.04) / 2 + panelW * (i + 0.5);
    part(g, RB(panelW - 0.012, 0.92, 0.1, 0.045), MAT.cream, x, 0.55, -length / 2 - 0.06);
  }
  bedding(g, width, length);
  return g;
}

function bedFloating(width, length) {
  const g = new THREE.Group();
  part(g, B(width - 0.5, 0.12, length - 0.5), MAT.black, 0, 0.06, 0.03);
  part(g, RB(width, 0.26, length, 0.02), MAT.paleWood, 0, 0.23, 0);
  part(g, RB(width + 0.04, 0.9, 0.08, 0.02), MAT.walnut, 0, 0.55, -length / 2 - 0.02);
  bedding(g, width, length);
  return g;
}

function addTableLamp(g, y) {
  part(g, CYL(0.05, 0.07, 0.1, 16), MAT.ceramic, 0, y + 0.05, 0);
  part(g, CYL(0.01, 0.01, 0.18, 8), MAT.brass, 0, y + 0.18, 0);
  part(g, CYL(0.09, 0.12, 0.14, 20), MAT.cream, 0, y + 0.3, 0);
}

function nightstandDrawer() {
  const g = new THREE.Group();
  part(g, RB(0.45, 0.42, 0.4, 0.015), MAT.oak, 0, 0.21, 0);
  part(g, RB(0.47, 0.03, 0.42, 0.008), MAT.walnut, 0, 0.435, 0);
  part(g, B(0.39, 0.16, 0.012), MAT.paleWood, 0, 0.3, 0.203);
  part(g, CYL(0.012, 0.012, 0.03, 10), MAT.brass, 0, 0.3, 0.22, Math.PI / 2);
  addTableLamp(g, 0.45);
  return g;
}

function nightstandRound() {
  const g = new THREE.Group();
  part(g, CYL(0.21, 0.21, 0.4, 28), MAT.oak, 0, 0.2, 0);
  part(g, CYL(0.23, 0.23, 0.03, 28), MAT.walnut, 0, 0.415, 0);
  part(g, CYL(0.02, 0.02, 0.05, 10), MAT.brass, 0, 0.26, 0.215, Math.PI / 2);
  addTableLamp(g, 0.43);
  return g;
}

function nightstandOpen() {
  const g = new THREE.Group();
  for (const x of [-0.19, 0.19]) {
    for (const z of [-0.15, 0.15]) part(g, B(0.03, 0.42, 0.03), MAT.walnut, x, 0.21, z);
  }
  part(g, RB(0.45, 0.03, 0.36, 0.008), MAT.oak, 0, 0.42, 0);
  part(g, RB(0.39, 0.02, 0.3, 0.006), MAT.oak, 0, 0.15, 0);
  part(g, B(0.2, 0.16, 0.14), BOOK_MATS[1], -0.08, 0.51, 0);
  part(g, B(0.18, 0.13, 0.13), BOOK_MATS[3], -0.07, 0.665, 0.005, 0, 0.15);
  part(g, CYL(0.045, 0.05, 0.1, 14), MAT.ceramic, 0.13, 0.485, 0.02);
  return g;
}

function wardrobeFlat() {
  const g = new THREE.Group();
  part(g, B(1.6, 2.1, 0.6), MAT.oak, 0, 1.06, 0);
  part(g, RB(1.64, 0.04, 0.62, 0.012), MAT.walnut, 0, 2.13, 0);
  part(g, B(1.6, 0.06, 0.58), MAT.walnut, 0, 0.03, 0);
  for (const x of [-0.395, 0.395]) {
    part(g, B(0.77, 2.0, 0.02), MAT.paleWood, x, 1.06, 0.31);
    part(g, CYL(0.009, 0.009, 0.24, 8), MAT.metal, x + (x < 0 ? 0.3 : -0.3), 1.06, 0.33);
  }
  return g;
}

function wardrobeSlat() {
  const g = new THREE.Group();
  part(g, B(1.6, 2.1, 0.6), MAT.oak, 0, 1.06, 0);
  part(g, RB(1.64, 0.04, 0.62, 0.012), MAT.walnut, 0, 2.13, 0);
  part(g, B(1.6, 0.06, 0.58), MAT.walnut, 0, 0.03, 0);
  for (let i = 0; i < 32; i++) {
    part(g, B(0.038, 2.0, 0.022), MAT.paleWood, -0.748 + i * 0.0483, 1.06, 0.312);
  }
  for (const x of [-0.1, 0.1]) {
    part(g, CYL(0.01, 0.01, 0.44, 8), MAT.metal, x, 1.12, 0.335);
  }
  return g;
}

function wardrobeGlass() {
  const g = new THREE.Group();
  part(g, B(1.6, 2.1, 0.6), MAT.oak, 0, 1.06, 0);
  part(g, RB(1.64, 0.04, 0.62, 0.012), MAT.walnut, 0, 2.13, 0);
  part(g, B(1.6, 0.06, 0.58), MAT.walnut, 0, 0.03, 0);
  part(g, B(1.48, 1.98, 0.02), MAT.paleWood, 0, 1.06, -0.28);
  part(g, B(1.5, 0.03, 0.5), MAT.walnut, 0, 1.02, -0.02);
  part(g, CYL(0.012, 0.012, 1.4, 8), MAT.metal, 0, 1.58, -0.12, 0, 0, Math.PI / 2);
  for (const x of [-0.42, 0.38]) {
    part(g, B(0.34, 0.06, 0.42), MAT.fabricBeige, x, 1.07, -0.02);
    part(g, B(0.3, 0.22, 0.24), MAT.duvetAccent, x + 0.25, 1.55, -0.04);
  }
  for (const x of [-0.395, 0.395]) {
    part(g, B(0.77, 1.98, 0.012), MAT.glass, x, 1.06, 0.3);
    part(g, CYL(0.009, 0.009, 0.3, 8), MAT.metal, x + (x < 0 ? 0.3 : -0.3), 1.06, 0.32);
  }
  return g;
}

// ---------- 厨卫 ----------

function fridge() {
  const g = new THREE.Group();
  part(g, B(0.7, 1.85, 0.65), MAT.white, 0, 0.925, 0);
  part(g, B(0.7, 0.012, 0.66), MAT.metal, 0, 1.18, 0);
  part(g, B(0.68, 0.9, 0.02), MAT.white, 0, 0.68, 0.33);
  part(g, B(0.68, 0.6, 0.02), MAT.white, 0, 1.52, 0.33);
  part(g, CYL(0.012, 0.012, 0.34, 8), MAT.metal, -0.24, 1.4, 0.35);
  part(g, CYL(0.012, 0.012, 0.3, 8), MAT.metal, -0.24, 0.7, 0.35);
  return g;
}

function counter() {
  const g = new THREE.Group();
  part(g, B(1.8, 0.85, 0.6), MAT.cream, 0, 0.425, 0);
  part(g, B(1.82, 0.05, 0.62), MAT.stoneTop, 0, 0.875, 0);
  for (let i = 0; i < 3; i++) {
    part(g, B(0.56, 0.7, 0.015), MAT.cream, -0.6 + i * 0.6, 0.47, 0.31);
    part(g, B(0.18, 0.012, 0.012), MAT.metal, -0.6 + i * 0.6, 0.72, 0.33);
  }
  // 水槽（窗下）
  part(g, B(0.5, 0.02, 0.38), MAT.metal, 0.45, 0.902, 0);
  part(g, B(0.44, 0.06, 0.32), MAT.black, 0.45, 0.88, 0);
  part(g, CYL(0.016, 0.016, 0.22, 10), MAT.metal, 0.45, 1.01, -0.22);
  part(g, CYL(0.014, 0.014, 0.16, 10), MAT.metal, 0.45, 1.11, -0.16, Math.PI / 2);
  // 灶台
  part(g, B(0.56, 0.012, 0.44), MAT.black, -0.42, 0.906, 0);
  for (const dx of [-0.13, 0.13]) {
    part(g, new THREE.TorusGeometry(0.07, 0.012, 8, 20), MAT.metal, -0.42 + dx, 0.915, 0, Math.PI / 2);
  }
  // 油烟机
  part(g, B(0.6, 0.1, 0.44), MAT.metal, -0.42, 1.62, -0.05);
  part(g, B(0.24, 1.18, 0.22), MAT.metal, -0.42, 2.26, -0.17);
  // 灶台防溅板
  part(g, B(0.85, 0.5, 0.02), MAT.stoneTop, -0.47, 1.15, -0.3);
  return g;
}

function toilet() {
  const g = new THREE.Group();
  part(g, B(0.34, 0.34, 0.46), MAT.ceramic, 0, 0.18, 0.03);
  const bowl = part(g, CYL(0.19, 0.15, 0.16, 24), MAT.ceramic, 0, 0.4, 0.04);
  bowl.scale.z = 1.25;
  const lid = part(g, CYL(0.2, 0.2, 0.03, 24), MAT.ceramic, 0, 0.49, 0.04);
  lid.scale.z = 1.25;
  part(g, B(0.42, 0.42, 0.18), MAT.ceramic, 0, 0.62, -0.26);
  part(g, B(0.5, 0.03, 0.22), MAT.ceramic, 0, 0.84, -0.26);
  part(g, CYL(0.025, 0.025, 0.02, 12), MAT.metal, 0, 0.86, -0.26);
  return g;
}

function washbasin() {
  const g = new THREE.Group();
  part(g, B(0.96, 0.78, 0.48), MAT.oak, 0, 0.4, 0);
  part(g, B(1.0, 0.05, 0.52), MAT.ceramic, 0, 0.815, 0);
  const basin = part(g, CYL(0.2, 0.17, 0.1, 24), MAT.ceramic, 0, 0.86, 0);
  basin.scale.z = 1.3;
  part(g, B(0.17, 0.05, 0.13), MAT.black, 0, 0.855, 0);
  part(g, CYL(0.014, 0.014, 0.2, 10), MAT.metal, 0, 0.95, -0.18);
  part(g, CYL(0.012, 0.012, 0.14, 10), MAT.metal, 0, 1.05, -0.12, Math.PI / 2);
  part(g, B(0.94, 0.76, 0.03), MAT.metal, 0, 1.55, -0.235);
  part(g, B(0.88, 0.7, 0.012), MAT.mirror, 0, 1.55, -0.218);
  for (const x of [-0.36, 0.36]) part(g, B(0.03, 0.2, 0.06), MAT.brass, x, 1.55, -0.19);
  return g;
}

function shower() {
  const g = new THREE.Group();
  part(g, B(0.9, 0.06, 0.9), MAT.ceramic, 0, 0.03, 0);
  part(g, B(0.86, 0.02, 0.86), MAT.metal, 0, 0.065, 0);
  // 两侧玻璃（背靠墙角）
  part(g, B(0.9, 1.95, 0.016), MAT.glass, 0, 1.04, 0.443, 0, 0, 0);
  part(g, B(0.016, 1.95, 0.9), MAT.glass, 0.443, 1.04, 0);
  part(g, B(0.94, 0.04, 0.04), MAT.metal, 0, 2.02, 0.443);
  part(g, B(0.04, 0.04, 0.94), MAT.metal, 0.443, 2.02, 0);
  part(g, B(0.04, 2.0, 0.04), MAT.metal, 0.443, 1.0, 0.443);
  part(g, CYL(0.014, 0.014, 1.9, 10), MAT.metal, -0.36, 1.01, -0.38);
  part(g, CYL(0.11, 0.11, 0.02, 20), MAT.metal, -0.28, 1.95, -0.36);
  part(g, B(0.12, 0.02, 0.08), MAT.metal, -0.36, 1.7, -0.35);
  return g;
}

// ---------- 装饰 ----------

function floorLamp() {
  const g = new THREE.Group();
  part(g, CYL(0.18, 0.2, 0.03, 24), MAT.black, 0, 0.015, 0);
  part(g, CYL(0.018, 0.018, 1.45, 10), MAT.metal, 0, 0.75, 0);
  const shade = new THREE.MeshStandardMaterial({
    color: 0xf0e6d4, emissive: 0xffd6a0, emissiveIntensity: 0.9, roughness: 0.92, side: THREE.DoubleSide,
  });
  part(g, new THREE.CylinderGeometry(0.2, 0.27, 0.34, 24, 1, true), shade, 0, 1.6, 0);
  const light = new THREE.PointLight(0xffd7a0, 6, 3.6, 2);
  light.position.set(0, 1.55, 0);
  g.add(light);
  return g;
}

function plant() {
  const g = new THREE.Group();
  part(g, CYL(0.16, 0.12, 0.3, 20), MAT.pot, 0, 0.15, 0);
  part(g, CYL(0.145, 0.145, 0.02, 20), MAT.soil, 0, 0.3, 0);
  part(g, CYL(0.014, 0.018, 0.55, 8), MAT.leaf, 0, 0.55, 0);
  const leaves = [
    [0, 0.85, 0, 0.34, 0.06, 0.2, 0],
    [0.18, 0.78, 0.1, 0.28, 0.05, 0.16, 0.5],
    [-0.17, 0.8, -0.06, 0.3, 0.05, 0.17, -0.5],
    [0.1, 0.98, -0.14, 0.26, 0.04, 0.14, 1.1],
    [-0.12, 1.0, 0.12, 0.24, 0.04, 0.14, 2.0],
    [0.03, 1.1, 0.02, 0.22, 0.04, 0.12, 0.3],
    [0.24, 0.72, -0.16, 0.22, 0.04, 0.13, 2.6],
  ];
  for (const [x, y, z, sx, sy, sz, ry] of leaves) {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), MAT.leafLight);
    leaf.scale.set(sx, sy, sz);
    leaf.position.set(x, y, z);
    leaf.rotation.y = ry;
    leaf.rotation.z = x * 0.9;
    leaf.castShadow = true;
    g.add(leaf);
  }
  return g;
}

// ---------- 目录 ----------

// 名称走 i18n：catalog.<id> / variant.<item>.<variant>
const V = (id, w, d, build) => ({ id, w, d, build });
const bedVariants = (w, l) => [
  V('wood', w, l, () => bedWood(w, l)),
  V('upholstered', w, l, () => bedUpholstered(w, l)),
  V('floating', w, l, () => bedFloating(w, l)),
];

export const CATALOG = [
  {
    id: 'sofa',
    variants: [
      V('straight', 2.1, 0.9, () => sofaStraight(2.1, 2)),
      V('corner', 2.6, 1.7, sofaCorner),
      V('loveseat', 1.6, 0.9, () => sofaStraight(1.6, 1)),
    ],
  },
  {
    id: 'armchair',
    variants: [
      V('lounge', 0.85, 0.85, armchairLounge),
      V('shell', 0.8, 0.8, armchairShell),
      V('rattan', 0.76, 0.74, armchairRattan),
    ],
  },
  {
    id: 'coffee',
    variants: [
      V('rect', 1.1, 0.6, coffeeRect),
      V('round', 0.9, 0.9, coffeeRound),
      V('nesting', 1.2, 0.9, coffeeNesting),
    ],
  },
  {
    id: 'tv',
    variants: [
      V('storage', 1.8, 0.4, tvStorage),
      V('floating', 1.8, 0.34, tvFloating),
      V('long', 2.4, 0.38, tvLong),
    ],
  },
  { id: 'rug', w: 2.4, d: 1.6, build: rug, flat: true },
  {
    id: 'dining',
    variants: [
      V('rect', 1.4, 0.85, diningRect),
      V('round', 1.1, 1.1, diningRound),
      V('oval', 1.5, 0.9, diningOval),
    ],
  },
  {
    id: 'chair',
    variants: [
      V('fabric', 0.46, 0.5, chairFabric),
      V('wood', 0.46, 0.5, chairWood),
      V('rattan', 0.46, 0.5, chairRattan),
    ],
  },
  { id: 'bed', variants: bedVariants(1.8, 2.05) },
  { id: 'singlebed', variants: bedVariants(1.2, 1.95) },
  {
    id: 'nightstand',
    variants: [
      V('drawer', 0.45, 0.4, nightstandDrawer),
      V('round', 0.44, 0.44, nightstandRound),
      V('open', 0.45, 0.38, nightstandOpen),
    ],
  },
  {
    id: 'wardrobe',
    variants: [
      V('flat', 1.6, 0.6, wardrobeFlat),
      V('slat', 1.6, 0.6, wardrobeSlat),
      V('glass', 1.6, 0.6, wardrobeGlass),
    ],
  },
  {
    id: 'desk',
    variants: [
      V('legs', 1.2, 0.6, deskLegs),
      V('pedestal', 1.2, 0.6, deskPedestal),
    ],
  },
  {
    id: 'shelf',
    variants: [
      V('open', 0.9, 0.35, bookshelfOpen),
      V('ladder', 0.72, 0.5, bookshelfLadder),
      V('cabinet', 1.0, 0.38, bookshelfCabinet),
    ],
  },
  { id: 'lamp', w: 0.4, d: 0.4, build: floorLamp },
  { id: 'plant', w: 0.5, d: 0.5, build: plant },
  { id: 'fridge', w: 0.7, d: 0.65, build: fridge },
  { id: 'counter', w: 1.8, d: 0.6, build: counter },
  { id: 'toilet', w: 0.42, d: 0.7, build: toilet },
  { id: 'washbasin', w: 1.0, d: 0.52, build: washbasin },
  { id: 'shower', w: 0.9, d: 0.9, build: shower },
];

// 默认款 = 第一款，占用尺寸跟着默认款走
for (const item of CATALOG) {
  if (!item.variants) continue;
  const [first] = item.variants;
  item.w = first.w;
  item.d = first.d;
  item.build = first.build;
}

const BY_ID = new Map(CATALOG.map((item) => [item.id, item]));

export function catalogItem(id) {
  return BY_ID.get(id);
}

export function catalogVariants(item) {
  return item.variants ?? [{ id: '', w: item.w, d: item.d, build: item.build }];
}

export function furnitureVariant(id, variantId) {
  const item = BY_ID.get(id);
  if (!item) return null;
  return catalogVariants(item).find((v) => v.id === variantId) ?? catalogVariants(item)[0];
}

export function createFurniture(id, variantId) {
  const item = BY_ID.get(id);
  if (!item) return null;
  const variant = furnitureVariant(id, variantId);
  const group = variant.build();
  group.userData.footprint = { w: variant.w, d: variant.d, flat: !!item.flat };
  group.userData.variant = variant.id;
  return group;
}

const GHOST_OK = new THREE.MeshBasicMaterial({ color: 0x74e8b8, transparent: true, opacity: 0.42, depthWrite: false });
const GHOST_BAD = new THREE.MeshBasicMaterial({ color: 0xff6b6b, transparent: true, opacity: 0.42, depthWrite: false });

export function applyGhostMaterial(group, valid) {
  const mat = valid ? GHOST_OK : GHOST_BAD;
  group.traverse((child) => {
    if (child.isMesh) {
      child.material = mat;
      child.castShadow = false;
      child.receiveShadow = false;
    }
    if (child.isPointLight) child.visible = false;
  });
}
