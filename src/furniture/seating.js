import * as THREE from 'three';
import { part, MAT, B, RB, CYL, clothBox, cushion, artCanvasMaterial, tube } from './core.js';
import { modelGroup } from '../models.js';

export function sofaStraight(w = 2.1, seats = 2) {
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
    part(g, clothBox(cw - 0.02, 0.17, 0.7, 0.07, 0.005, i + 2), MAT.fabricBeige, x, 0.425, 0.04);
    const bc = part(g, clothBox(cw - 0.04, 0.42, 0.17, 0.07, 0.004, i + 4), MAT.fabricBeige, x, 0.63, -0.23);
    bc.rotation.x = -0.14;
  }
  for (const x of [-(w / 2 - armW / 2), w / 2 - armW / 2]) {
    part(g, RB(armW, 0.46, 0.88, 0.06), MAT.fabricGray, x, 0.38, 0);
    part(g, CYL(armW / 2, armW / 2, 0.88, 16), MAT.fabricGray, x, 0.6, 0, Math.PI / 2, 0, 0);
  }
  cushion(g, 0.4, 0.36, 0.16, MAT.cushionSage, -w / 4, 0.69, -0.08, -0.3, 0.24, 0.14);
  cushion(g, 0.4, 0.36, 0.16, MAT.cushionRust, w / 4, 0.68, -0.08, -0.34, -0.2, -0.1);
  return g;
}

export function sofaCorner() {
  const g = new THREE.Group();
  for (const x of [-1.2, -0.2, 1.2]) {
    for (const z of [-0.8, -0.05]) part(g, CYL(0.025, 0.018, 0.14, 10), MAT.walnut, x, 0.07, z);
  }
  for (const x of [0.35, 1.2]) part(g, CYL(0.025, 0.018, 0.14, 10), MAT.walnut, x, 0.07, 0.8);

  part(g, RB(2.6, 0.24, 0.9, 0.05), MAT.fabricGray, 0, 0.26, -0.4);
  part(g, RB(1.0, 0.24, 0.8, 0.05), MAT.fabricGray, 0.8, 0.26, 0.45);
  const back = part(g, RB(2.6, 0.55, 0.2, 0.07), MAT.fabricGray, 0, 0.63, -0.75);
  back.rotation.x = -0.05;
  part(g, RB(0.18, 0.5, 0.9, 0.07), MAT.fabricGray, -1.22, 0.44, -0.4);
  part(g, CYL(0.09, 0.09, 0.9, 18), MAT.fabricGray, -1.22, 0.71, -0.4, Math.PI / 2, 0, 0);
  part(g, RB(1.0, 0.38, 0.16, 0.06), MAT.fabricGray, 0.8, 0.35, 0.82);

  for (const x of [-0.62, 0.58]) {
    part(g, clothBox(1.14, 0.18, 0.72, 0.075, 0.006, x), MAT.fabricBeige, x, 0.445, -0.34);
    const bc = part(g, clothBox(1.1, 0.42, 0.17, 0.075, 0.005, x + 1), MAT.fabricBeige, x, 0.67, -0.6);
    bc.rotation.x = -0.16;
    // 坐垫前缘的滚边
    part(g, CYL(0.009, 0.009, 1.1, 8), MAT.fabricBeige, x, 0.385, 0.015, 0, 0, Math.PI / 2);
  }
  part(g, clothBox(0.9, 0.18, 0.72, 0.075, 0.005, 3), MAT.fabricBeige, 0.8, 0.445, 0.45);
  part(g, CYL(0.009, 0.009, 0.86, 8), MAT.fabricBeige, 0.8, 0.385, 0.805, 0, 0, Math.PI / 2);
  cushion(g, 0.4, 0.36, 0.16, MAT.cushionSage, -0.85, 0.7, -0.47, -0.36, 0.25, 0.12);
  cushion(g, 0.4, 0.36, 0.16, MAT.cushionRust, -0.2, 0.68, -0.47, -0.38, -0.2, -0.1);
  cushion(g, 0.36, 0.32, 0.14, MAT.pillow, 0.78, 0.615, 0.62, 0.38, -0.3, 0.12);
  // 搭在贵妃榻尾端的薄毯：一条垂下前缘，避免叠成厚板
  part(g, clothBox(0.34, 0.03, 0.74, 0.018, 0.006, 7.2), MAT.throw, 1.06, 0.552, 0.45);
  part(g, clothBox(0.3, 0.28, 0.035, 0.012, 0.004, 8.1), MAT.throw, 1.06, 0.4, 0.83);
  return g;
}

export function armchairLounge() {
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

export function armchairShell() {
  const g = new THREE.Group();
  for (const x of [-0.2, 0.2]) {
    for (const z of [-0.2, 0.2]) part(g, CYL(0.022, 0.017, 0.4, 10), MAT.walnut, x, 0.2, z);
  }
  part(g, new THREE.CylinderGeometry(0.38, 0.34, 0.6, 28, 1, true, 0.62, Math.PI * 2 - 1.24), MAT.basket, 0, 0.66, 0);
  part(g, CYL(0.32, 0.3, 0.12, 28), MAT.fabricBeige, 0, 0.42, 0);
  part(g, RB(0.5, 0.34, 0.12, 0.05), MAT.basketLight, 0, 0.68, -0.22, -0.15);
  return g;
}

export function armchairRattan() {
  const g = new THREE.Group();
  for (const x of [-0.3, 0.3]) {
    for (const z of [-0.27, 0.27]) part(g, CYL(0.022, 0.016, 0.42, 10), MAT.oak, x, 0.21, z);
  }
  part(g, RB(0.72, 0.06, 0.68, 0.02), MAT.oak, 0, 0.44, 0);
  part(g, clothBox(0.62, 0.1, 0.6, 0.04, 0.004, 1), MAT.fabricBeige, 0, 0.5, 0.02);

  for (const x of [-0.33, 0.33]) {
    const post = part(g, CYL(0.022, 0.02, 0.62, 10), MAT.oak, x, 0.75, -0.3);
    post.rotation.x = -0.06;
  }
  part(g, CYL(0.022, 0.022, 0.68, 10), MAT.oak, 0, 1.04, -0.335, 0, 0, Math.PI / 2);
  part(g, CYL(0.022, 0.022, 0.68, 10), MAT.oak, 0, 0.5, -0.29, 0, 0, Math.PI / 2);

  for (let i = 0; i <= 10; i++) {
    part(g, CYL(0.007, 0.007, 0.5, 6), MAT.paleWood, -0.29 + i * 0.058, 0.77, -0.305);
  }
  for (const y of [0.62, 0.74, 0.86, 0.98]) {
    part(g, CYL(0.006, 0.006, 0.6, 6), MAT.paleWood, 0, y, -0.307, 0, 0, Math.PI / 2);
  }
  for (const s of [-1, 1]) {
    tube(g, [[s * 0.32, 0.45, 0.24], [s * 0.34, 0.55, 0.05], [s * 0.34, 0.62, -0.25]], 0.018, MAT.oak);
  }
  cushion(g, 0.36, 0.34, 0.12, MAT.cushionSage, 0, 0.72, -0.14, -0.4, 0, 0.04);
  return g;
}

export function sofaSquaryModel() {
  const g = modelGroup('sofaSquary', 2.6, 1.7);
  if (!g) return sofaCorner();
  part(g, RB(1.46, 0.82, 0.032, 0.01), MAT.walnut, 0, 1.86, -1.12);
  part(g, B(1.36, 0.72, 0.01), artCanvasMaterial(1), 0, 1.86, -1.1);
  return g;
}

// 真实床：床头墙上一幅横向挂画

export function chairFabric() {
  const g = new THREE.Group();
  part(g, RB(0.46, 0.045, 0.46, 0.02), MAT.fabricBeige, 0, 0.45, 0);
  for (const x of [-0.19, 0.19]) {
    for (const z of [-0.19, 0.19]) part(g, B(0.035, 0.44, 0.035), MAT.walnut, x, 0.22, z);
  }
  for (const x of [-0.19, 0.19]) part(g, B(0.035, 0.42, 0.035), MAT.walnut, x, 0.68, -0.2);
  part(g, RB(0.43, 0.3, 0.04, 0.012), MAT.fabricBeige, 0, 0.78, -0.205);
  return g;
}

export function chairWood() {
  const g = new THREE.Group();
  part(g, RB(0.45, 0.045, 0.44, 0.015), MAT.oak, 0, 0.45, 0);
  for (const x of [-0.18, 0.18]) {
    for (const z of [-0.18, 0.18]) part(g, CYL(0.018, 0.015, 0.44, 8), MAT.walnut, x, 0.22, z);
  }
  for (const x of [-0.18, 0.18]) part(g, B(0.035, 0.44, 0.035), MAT.walnut, x, 0.69, -0.2);
  for (const y of [0.66, 0.74, 0.82]) part(g, B(0.4, 0.045, 0.03), MAT.oak, 0, y, -0.2);
  return g;
}

export function chairRattan() {
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

