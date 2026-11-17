import * as THREE from 'three';
import { part, MAT, B, RB, CYL, LATHE, topOf } from './core.js';
import { modelGroup } from '../models.js';

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

export function plant() {
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


export function floorLampModel() {
  const g = modelGroup('lampOslo', 0.4, 0.4);
  if (!g) return floorLamp();
  const top = topOf(g);
  const light = new THREE.PointLight(0xffd7a0, 5.5, 3.8, 2);
  light.position.set(0, top * 0.74, 0);
  g.add(light);
  return g;
}

// 名称走 i18n：catalog.<id> / variant.<item>.<variant>
