import * as THREE from 'three';

// 家具统一约定：原点在地面中心，正面朝 +Z

const std = (color, roughness = 0.8, metalness = 0) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

const MAT = {
  walnut: std(0x6a4a34, 0.55),
  oak: std(0xb08a62, 0.6),
  paleWood: std(0xd3b48d, 0.62),
  fabricGray: std(0x8e8b85, 0.95),
  fabricBeige: std(0xb7a894, 0.95),
  fabricDark: std(0x55564f, 0.95),
  cream: std(0xe9e3d8, 0.85),
  white: std(0xf2f1ed, 0.55),
  ceramic: std(0xf4f3ef, 0.28),
  black: std(0x1d1e20, 0.55),
  metal: std(0x9298a0, 0.32, 0.85),
  brass: std(0xb08d5a, 0.35, 0.8),
  leaf: std(0x3f7a45, 0.85),
  leafLight: std(0x5d9558, 0.85),
  pot: std(0xa9a49c, 0.75),
  soil: std(0x3a2c21, 1),
  rug: std(0xc9b79d, 1),
  rugBorder: std(0x9d8567, 1),
  duvet: std(0xe7dfd0, 0.95),
  duvetAccent: std(0x9aa896, 0.95),
  pillow: std(0xf5f2ea, 0.95),
  screen: std(0x0b0f12, 0.22, 0.35),
  mirror: std(0xc9d8de, 0.08, 0.9),
  glass: new THREE.MeshPhysicalMaterial({
    color: 0xd6e6ea, transparent: true, opacity: 0.24, roughness: 0.06,
    metalness: 0, side: THREE.DoubleSide, depthWrite: false,
  }),
  stoneTop: std(0xe7e3d9, 0.32),
};

const BOOK_COLORS = [0x7a4a3a, 0x3e5a6b, 0x7b6b45, 0x8c8c8c, 0x4f6350, 0x9c7f5f];
const BOOK_MATS = BOOK_COLORS.map((c) => std(c, 0.9));

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
const CYL = (rt, rb, h, seg = 20) => new THREE.CylinderGeometry(rt, rb, h, seg);

// ---------- 软装 ----------

function sofa() {
  const g = new THREE.Group();
  for (const x of [-0.92, 0.92]) {
    for (const z of [-0.34, 0.34]) part(g, CYL(0.025, 0.025, 0.12, 10), MAT.walnut, x, 0.06, z);
  }
  part(g, B(2.1, 0.22, 0.9), MAT.fabricGray, 0, 0.23, 0);
  for (const x of [-0.51, 0.51]) part(g, B(1.0, 0.16, 0.68), MAT.fabricBeige, x, 0.42, 0.04);
  part(g, B(2.1, 0.52, 0.2), MAT.fabricGray, 0, 0.6, -0.35);
  for (const x of [-0.51, 0.51]) part(g, B(0.98, 0.4, 0.14), MAT.fabricBeige, x, 0.62, -0.22, -0.12);
  for (const x of [-0.97, 0.97]) part(g, B(0.16, 0.5, 0.9), MAT.fabricGray, x, 0.37, 0);
  for (const [x, rz] of [[-0.62, 0.18], [0.62, -0.18]]) {
    part(g, B(0.34, 0.34, 0.1), MAT.duvetAccent, x, 0.66, -0.1, 0, 0, rz);
  }
  return g;
}

function armchair() {
  const g = new THREE.Group();
  for (const x of [-0.34, 0.34]) {
    for (const z of [-0.32, 0.32]) part(g, CYL(0.022, 0.022, 0.12, 10), MAT.walnut, x, 0.06, z);
  }
  part(g, B(0.85, 0.2, 0.85), MAT.fabricBeige, 0, 0.22, 0);
  part(g, B(0.66, 0.15, 0.64), MAT.fabricBeige, 0, 0.39, 0.04);
  part(g, B(0.85, 0.5, 0.18), MAT.fabricBeige, 0, 0.57, -0.33);
  for (const x of [-0.39, 0.39]) part(g, B(0.14, 0.42, 0.85), MAT.fabricBeige, x, 0.34, 0);
  return g;
}

function coffeeTable() {
  const g = new THREE.Group();
  part(g, B(1.1, 0.05, 0.6), MAT.walnut, 0, 0.4, 0);
  part(g, B(1.0, 0.03, 0.5), MAT.walnut, 0, 0.15, 0);
  for (const x of [-0.5, 0.5]) {
    for (const z of [-0.25, 0.25]) part(g, B(0.045, 0.4, 0.045), MAT.black, x, 0.2, z);
  }
  part(g, B(0.24, 0.03, 0.17), MAT.fabricDark, -0.2, 0.43, 0.05);
  part(g, B(0.22, 0.025, 0.16), MAT.cream, -0.19, 0.455, 0.04, 0, 0.12);
  return g;
}

function tvCabinet() {
  const g = new THREE.Group();
  part(g, B(1.8, 0.42, 0.4), MAT.walnut, 0, 0.24, 0);
  part(g, B(1.84, 0.03, 0.42), MAT.walnut, 0, 0.465, 0);
  for (const x of [-0.45, 0.45]) {
    part(g, B(0.88, 0.3, 0.012), MAT.paleWood, x, 0.24, 0.203);
    part(g, CYL(0.008, 0.008, 0.12, 8), MAT.metal, x + (x < 0 ? 0.36 : -0.36), 0.24, 0.23, 0, 0, Math.PI / 2);
  }
  // 电视
  part(g, B(0.42, 0.02, 0.2), MAT.black, 0, 0.49, -0.02);
  part(g, B(0.07, 0.12, 0.05), MAT.black, 0, 0.55, -0.05);
  part(g, B(1.32, 0.75, 0.045), MAT.black, 0, 0.99, 0.0);
  part(g, B(1.24, 0.67, 0.01), MAT.screen, 0, 1.0, 0.028);
  // 摆件
  part(g, CYL(0.05, 0.06, 0.18, 16), MAT.ceramic, -0.75, 0.57, 0);
  for (let i = 0; i < 3; i++) {
    part(g, B(0.2, 0.03, 0.14), BOOK_MATS[i], 0.72, 0.495 + i * 0.03, 0);
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

function diningTable() {
  const g = new THREE.Group();
  part(g, B(1.4, 0.055, 0.85), MAT.oak, 0, 0.73, 0);
  part(g, B(1.3, 0.07, 0.75), MAT.walnut, 0, 0.68, 0);
  for (const x of [-0.62, 0.62]) {
    for (const z of [-0.34, 0.34]) part(g, B(0.055, 0.7, 0.055), MAT.walnut, x, 0.35, z);
  }
  part(g, CYL(0.11, 0.08, 0.08, 20), MAT.ceramic, 0, 0.8, 0);
  return g;
}

function chair() {
  const g = new THREE.Group();
  part(g, B(0.46, 0.045, 0.46), MAT.fabricBeige, 0, 0.45, 0);
  for (const x of [-0.19, 0.19]) {
    for (const z of [-0.19, 0.19]) part(g, B(0.035, 0.44, 0.035), MAT.walnut, x, 0.22, z);
  }
  for (const x of [-0.19, 0.19]) part(g, B(0.035, 0.42, 0.035), MAT.walnut, x, 0.68, -0.2);
  part(g, B(0.43, 0.3, 0.04), MAT.fabricBeige, 0, 0.78, -0.205);
  return g;
}

function desk() {
  const g = new THREE.Group();
  part(g, B(1.2, 0.05, 0.6), MAT.oak, 0, 0.74, 0);
  for (const x of [-0.55, 0.55]) {
    for (const z of [-0.26, 0.26]) part(g, B(0.045, 0.72, 0.045), MAT.black, x, 0.36, z);
  }
  part(g, B(0.9, 0.02, 0.5), MAT.paleWood, 0, 0.2, 0);
  part(g, B(0.3, 0.06, 0.2), MAT.cream, -0.28, 0.795, -0.05);
  part(g, B(0.26, 0.03, 0.18), BOOK_MATS[0], -0.28, 0.84, -0.05);
  part(g, B(0.16, 0.015, 0.01), MAT.metal, 0.36, 0.78, 0.14, -0.35);
  return g;
}

function bookshelf() {
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

// ---------- 卧室 ----------

function bedBase(width, length) {
  const g = new THREE.Group();
  part(g, B(width, 0.3, length), MAT.walnut, 0, 0.15, 0);
  part(g, B(width - 0.1, 0.22, length - 0.12), MAT.pillow, 0, 0.41, 0.03);
  part(g, B(width + 0.04, 0.95, 0.09), MAT.walnut, 0, 0.5, -length / 2 - 0.03);
  part(g, B(width - 0.08, 0.09, length * 0.62), MAT.duvet, 0, 0.565, length * 0.16);
  part(g, B(width - 0.06, 0.05, 0.3), MAT.duvetAccent, 0, 0.63, length * 0.38);
  const pw = width / 2 - 0.12;
  for (const x of [-pw / 2 - 0.02, pw / 2 + 0.02]) {
    part(g, B(pw - 0.06, 0.14, 0.34), MAT.pillow, x, 0.59, -length / 2 + 0.28, -0.18);
  }
  return g;
}

function bed() {
  return bedBase(1.8, 2.05);
}

function singleBed() {
  return bedBase(1.2, 1.95);
}

function nightstand() {
  const g = new THREE.Group();
  part(g, B(0.45, 0.42, 0.4), MAT.oak, 0, 0.21, 0);
  part(g, B(0.47, 0.03, 0.42), MAT.walnut, 0, 0.435, 0);
  part(g, B(0.39, 0.16, 0.012), MAT.paleWood, 0, 0.3, 0.203);
  part(g, CYL(0.012, 0.012, 0.03, 10), MAT.brass, 0, 0.3, 0.22, Math.PI / 2);
  // 小台灯
  part(g, CYL(0.06, 0.08, 0.12, 16), MAT.ceramic, 0, 0.51, 0);
  part(g, CYL(0.012, 0.012, 0.2, 8), MAT.brass, 0, 0.66, 0);
  part(g, CYL(0.1, 0.14, 0.16, 20), MAT.cream, 0, 0.79, 0);
  return g;
}

function wardrobe() {
  const g = new THREE.Group();
  part(g, B(1.6, 2.1, 0.6), MAT.oak, 0, 1.06, 0);
  part(g, B(1.64, 0.04, 0.62), MAT.walnut, 0, 2.13, 0);
  part(g, B(1.6, 0.06, 0.58), MAT.walnut, 0, 0.03, 0);
  for (const x of [-0.395, 0.395]) {
    part(g, B(0.77, 2.0, 0.02), MAT.paleWood, x, 1.06, 0.31);
    part(g, CYL(0.009, 0.009, 0.24, 8), MAT.metal, x + (x < 0 ? 0.3 : -0.3), 1.06, 0.33);
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
    color: 0xf2e7d2, emissive: 0xffd9a0, emissiveIntensity: 1.1, roughness: 0.9, side: THREE.DoubleSide,
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

export const CATALOG = [
  { id: 'sofa', name: 'Sofa', w: 2.1, d: 0.9, build: sofa },
  { id: 'armchair', name: 'Armchair', w: 0.85, d: 0.85, build: armchair },
  { id: 'coffee', name: 'Coffee Table', w: 1.1, d: 0.6, build: coffeeTable },
  { id: 'tv', name: 'TV Stand', w: 1.8, d: 0.4, build: tvCabinet },
  { id: 'rug', name: 'Rug', w: 2.4, d: 1.6, build: rug, flat: true },
  { id: 'dining', name: 'Dining Table', w: 1.4, d: 0.85, build: diningTable },
  { id: 'chair', name: 'Dining Chair', w: 0.46, d: 0.5, build: chair },
  { id: 'bed', name: 'Double Bed', w: 1.8, d: 2.05, build: bed },
  { id: 'singlebed', name: 'Single Bed', w: 1.2, d: 1.95, build: singleBed },
  { id: 'nightstand', name: 'Nightstand', w: 0.45, d: 0.4, build: nightstand },
  { id: 'wardrobe', name: 'Wardrobe', w: 1.6, d: 0.6, build: wardrobe },
  { id: 'desk', name: 'Desk', w: 1.2, d: 0.6, build: desk },
  { id: 'shelf', name: 'Bookshelf', w: 0.9, d: 0.35, build: bookshelf },
  { id: 'lamp', name: 'Floor Lamp', w: 0.4, d: 0.4, build: floorLamp },
  { id: 'plant', name: 'Plant', w: 0.5, d: 0.5, build: plant },
  { id: 'fridge', name: 'Fridge', w: 0.7, d: 0.65, build: fridge },
  { id: 'counter', name: 'Counter', w: 1.8, d: 0.6, build: counter },
  { id: 'toilet', name: 'Toilet', w: 0.42, d: 0.7, build: toilet },
  { id: 'washbasin', name: 'Washbasin', w: 1.0, d: 0.52, build: washbasin },
  { id: 'shower', name: 'Shower', w: 0.9, d: 0.9, build: shower },
];

const BY_ID = new Map(CATALOG.map((item) => [item.id, item]));

export function catalogItem(id) {
  return BY_ID.get(id);
}

export function createFurniture(id) {
  const item = BY_ID.get(id);
  if (!item) return null;
  const group = item.build();
  group.userData.footprint = { w: item.w, d: item.d, flat: !!item.flat };
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
