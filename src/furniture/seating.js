import * as THREE from 'three';
import { part, MAT, B, RB, CYL, clothBox, cushion, tube, framedArt } from './core.js';

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
  // 搭在贵妃榻上的毛毯：多层折叠后垂过外侧和前端，避免整块硬板感
  const blanket = part(g, clothBox(0.55, 0.032, 0.64, 0.018, 0.012, 7.2), MAT.throw, 1.02, 0.556, 0.42);
  blanket.rotation.y = 0.06;
  const fold = part(g, clothBox(0.48, 0.05, 0.2, 0.018, 0.008, 9.1), MAT.throw, 1.02, 0.586, 0.16);
  fold.rotation.y = -0.05;
  part(g, clothBox(0.034, 0.3, 0.62, 0.014, 0.006, 8.1), MAT.throw, 1.315, 0.4, 0.42);
  const drape = part(g, clothBox(0.46, 0.2, 0.032, 0.014, 0.006, 8.6), MAT.throw, 1.04, 0.45, 0.775);
  drape.rotation.y = 0.04;
  // 沙发背后的挂画，填补大面积空墙
  const art = framedArt(1.18, 0.6, 1);
  art.position.set(0, 1.56, -0.83);
  g.add(art);
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

// 三条餐椅共用：微外撇的锥形腿与前/后横撑
function chairLegs(g, mat, spread = 0.14) {
  for (const x of [-0.18, 0.18]) {
    for (const z of [-0.18, 0.18]) {
      const leg = part(g, CYL(0.017, 0.012, 0.45, 10), mat, x, 0.225, z);
      leg.rotation.z = -x * spread;
      leg.rotation.x = z * spread;
    }
  }
  for (const z of [-0.16, 0.16]) {
    part(g, CYL(0.0065, 0.0065, 0.33, 8), mat, 0, 0.16, z, 0, 0, Math.PI / 2);
  }
}

export function chairFabric() {
  const g = new THREE.Group();
  chairLegs(g, MAT.walnut, 0.16);
  // 座框 + 软包坐垫
  part(g, RB(0.43, 0.045, 0.43, 0.012), MAT.walnut, 0, 0.435, 0);
  part(g, clothBox(0.45, 0.075, 0.45, 0.022, 0.004, 1.2), MAT.fabricBeige, 0, 0.49, 0.004);
  // 靠背立柱、上横梁与软包背板
  for (const x of [-0.18, 0.18]) {
    const stile = part(g, RB(0.036, 0.5, 0.042, 0.012), MAT.walnut, x, 0.69, -0.195);
    stile.rotation.x = -0.09;
  }
  const top = part(g, RB(0.41, 0.055, 0.048, 0.014), MAT.walnut, 0, 0.925, -0.218);
  top.rotation.x = -0.09;
  const back = part(g, clothBox(0.34, 0.33, 0.06, 0.022, 0.004, 2.1), MAT.fabricBeige, 0, 0.715, -0.196);
  back.rotation.x = -0.09;
  for (const x of [-0.095, 0.095]) {
    part(g, new THREE.SphereGeometry(0.011, 10, 8), MAT.fabricDark, x, 0.72, -0.161);
  }
  return g;
}

export function chairWood() {
  const g = new THREE.Group();
  chairLegs(g, MAT.walnut, 0.14);
  part(g, RB(0.44, 0.045, 0.43, 0.012), MAT.oak, 0, 0.435, 0);
  for (const x of [-0.185, 0.185]) {
    const stile = part(g, RB(0.034, 0.5, 0.04, 0.012), MAT.walnut, x, 0.69, -0.195);
    stile.rotation.x = -0.08;
  }
  const top = part(g, RB(0.42, 0.055, 0.045, 0.014), MAT.oak, 0, 0.925, -0.216);
  top.rotation.x = -0.08;
  for (const y of [0.71, 0.79, 0.87]) {
    const slat = part(g, RB(0.37, 0.038, 0.022, 0.008), MAT.oak, 0, y, -0.2);
    slat.rotation.x = -0.08;
  }
  return g;
}

export function chairRattan() {
  const g = new THREE.Group();
  chairLegs(g, MAT.oak, 0.15);
  part(g, RB(0.43, 0.045, 0.42, 0.012), MAT.oak, 0, 0.435, 0);
  part(g, clothBox(0.4, 0.065, 0.39, 0.022, 0.004, 1.4), MAT.fabricBeige, 0, 0.487, 0.01);
  for (const x of [-0.18, 0.18]) {
    const stile = part(g, RB(0.034, 0.52, 0.038, 0.012), MAT.oak, x, 0.69, -0.195);
    stile.rotation.x = -0.06;
  }
  const top = part(g, RB(0.4, 0.045, 0.042, 0.014), MAT.oak, 0, 0.925, -0.213);
  top.rotation.x = -0.06;
  for (let i = 0; i <= 8; i++) {
    const x = -0.16 + i * 0.04;
    const reed = part(g, CYL(0.007, 0.007, 0.38, 6), MAT.paleWood, x, 0.725, -0.2);
    reed.rotation.x = -0.06;
  }
  for (const y of [0.58, 0.68, 0.78, 0.88]) {
    part(g, CYL(0.0065, 0.0065, 0.37, 6), MAT.paleWood, 0, y, -0.203, 0, 0, Math.PI / 2);
  }
  return g;
}

