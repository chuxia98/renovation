import * as THREE from 'three';
import { part, MAT, B, RB, CYL, LATHE, tube } from './core.js';

export function rug() {
  const g = new THREE.Group();
  part(g, RB(2.4, 0.018, 1.6, 0.012), MAT.rugBorder, 0, 0.009, 0);
  part(g, RB(2.24, 0.022, 1.44, 0.01), MAT.rug, 0, 0.014, 0);
  // 内圈缝线，让包边更有层次
  for (const s of [-1, 1]) {
    part(g, B(2.24, 0.004, 0.012), MAT.rugBorder, 0, 0.026, s * 0.72);
    part(g, B(0.012, 0.004, 1.44), MAT.rugBorder, s * 1.12, 0.026, 0);
  }
  // 两端短流苏
  const fringe = CYL(0.0045, 0.0035, 0.065, 5);
  for (const s of [-1, 1]) {
    for (let i = 0; i < 12; i++) {
      const x = -1.05 + i * (2.1 / 11);
      part(g, fringe, MAT.rugBorder, x, 0.007, s * (0.8 + 0.03), Math.PI / 2);
    }
  }
  return g;
}

// 电视墙挂画：生成低饱和的抽象画布（三套配色）

export function floorLamp() {
  const g = new THREE.Group();
  part(g, LATHE([[0.12, 0], [0.17, 0.01], [0.18, 0.025], [0.12, 0.04], [0.03, 0.05], [0.018, 0.08]]), MAT.black, 0, 0, 0);
  part(g, CYL(0.014, 0.014, 1.42, 10), MAT.metal, 0, 0.78, 0);
  part(g, new THREE.CylinderGeometry(0.17, 0.24, 0.34, 28, 1, true), MAT.shade, 0, 1.62, 0);
  part(g, new THREE.TorusGeometry(0.17, 0.009, 8, 28), MAT.metal, 0, 1.79, 0, Math.PI / 2);
  part(g, new THREE.TorusGeometry(0.24, 0.009, 8, 28), MAT.metal, 0, 1.45, 0, Math.PI / 2);
  part(g, new THREE.SphereGeometry(0.028, 12, 8), MAT.lampWarm, 0, 1.56, 0);
  const light = new THREE.PointLight(0xffd7a0, 6, 3.6, 2);
  light.position.set(0, 1.55, 0);
  g.add(light);
  return g;
}

// 龟背竹叶片：贝塞尔轮廓 + 沿长度微弯、两侧微翘
const LEAF_LEN = 0.46;
const LEAF_WID = 0.31;
const MONSTERA_LEAF_GEO = (() => {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.bezierCurveTo(LEAF_WID * 0.5, LEAF_LEN * 0.06, LEAF_WID * 0.52, LEAF_LEN * 0.38, LEAF_WID * 0.24, LEAF_LEN * 0.7);
  s.bezierCurveTo(LEAF_WID * 0.12, LEAF_LEN * 0.86, LEAF_WID * 0.05, LEAF_LEN * 0.96, 0, LEAF_LEN);
  s.bezierCurveTo(-LEAF_WID * 0.05, LEAF_LEN * 0.96, -LEAF_WID * 0.12, LEAF_LEN * 0.86, -LEAF_WID * 0.24, LEAF_LEN * 0.7);
  s.bezierCurveTo(-LEAF_WID * 0.52, LEAF_LEN * 0.38, -LEAF_WID * 0.5, LEAF_LEN * 0.06, 0, 0);
  const geo = new THREE.ShapeGeometry(s, 16);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const t = y / LEAF_LEN;
    const cup = 0.09 * (x / (LEAF_WID * 0.55)) ** 2;
    const bend = -0.16 * Math.sin(t * Math.PI) * (0.35 + t);
    pos.setZ(i, cup + bend);
  }
  geo.computeVertexNormals();
  return geo;
})();

const LEAF_MATS = [
  new THREE.MeshStandardMaterial({ color: 0x3f7a45, roughness: 0.68, side: THREE.DoubleSide }),
  new THREE.MeshStandardMaterial({ color: 0x5d9558, roughness: 0.72, side: THREE.DoubleSide }),
];

export function plant() {
  const g = new THREE.Group();
  part(g, LATHE([
    [0.12, 0], [0.135, 0.01], [0.17, 0.07], [0.17, 0.29], [0.175, 0.3], [0.16, 0.31],
  ], 28), MAT.pot, 0, 0, 0);
  part(g, CYL(0.155, 0.155, 0.016, 24), MAT.pot, 0, 0.302, 0);
  part(g, CYL(0.142, 0.142, 0.018, 24), MAT.soil, 0, 0.312, 0);

  const leaves = [
    [0.15, 0.09, 0.64, 0.95, 1.0, 0],
    [2.35, 0.16, 0.76, 0.88, 0.92, 1],
    [4.2, 0.13, 0.86, 0.82, 1.02, 0],
    [1.25, 0.2, 0.94, 0.72, 0.96, 1],
    [3.3, 0.21, 1.02, 0.66, 1.08, 0],
    [5.25, 0.18, 1.08, 0.6, 1.0, 1],
    [0.6, 0.24, 1.16, 0.55, 0.88, 0],
    [2.75, 0.14, 1.22, 0.45, 0.84, 1],
    [4.85, 0.08, 1.28, 0.35, 0.78, 0],
  ];
  for (const [a, r, h, tilt, scale, mat] of leaves) {
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    tube(g, [[0, 0.31, 0], [x * 0.35, h * 0.55, z * 0.35], [x * 0.8, h - 0.18, z * 0.8], [x, h, z]], 0.006, MAT.leaf, 20);
    const leaf = new THREE.Mesh(MONSTERA_LEAF_GEO, LEAF_MATS[mat]);
    leaf.position.set(x, h, z);
    leaf.rotation.order = 'YXZ';
    leaf.rotation.y = Math.PI / 2 - a;
    leaf.rotation.x = tilt;
    leaf.rotation.z = (mat ? -1 : 1) * 0.08;
    leaf.scale.setScalar(scale);
    leaf.castShadow = true;
    leaf.receiveShadow = true;
    g.add(leaf);
  }
  return g;
}

// 名称走 i18n：catalog.<id> / variant.<item>.<variant>
