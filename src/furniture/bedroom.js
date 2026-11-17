import * as THREE from 'three';
import { part, MAT, B, RB, CYL, LATHE, BOOK_MATS, clothBox, cushion, artCanvasMaterial, topOf } from './core.js';
import { modelGroup } from '../models.js';

export function bedModel(key, w, l, fallback) {
  const g = modelGroup(key, w, l);
  if (!g) return fallback();
  part(g, RB(1.18, 0.66, 0.03, 0.008), MAT.walnut, 0, 1.72, -l / 2 - 0.005);
  part(g, B(1.08, 0.56, 0.01), artCanvasMaterial(2), 0, 1.72, -l / 2 + 0.013);
  return g;
}


function bedding(g, width, length, top = 0.3) {
  part(g, RB(width - 0.04, 0.18, length - 0.05, 0.05), MAT.mattress, 0, top + 0.09, 0.02);
  part(g, RB(width + 0.015, 0.175, length - 0.03, 0.055), MAT.sheet, 0, top + 0.085, 0.02);

  // 被子从床头约 0.55m 处铺到床尾，比床垫略宽，三面自然垂下
  const dLen = length * 0.72;
  const dZ = length * 0.09;
  const dBottom = top + 0.17;
  const dTop = dBottom + 0.13;
  part(g, clothBox(width + 0.06, 0.13, dLen, 0.055, 0.014, 0.4), MAT.duvet, 0, dBottom + 0.065, dZ);
  for (const s of [-1, 1]) {
    part(g, clothBox(0.055, 0.34, dLen + 0.02, 0.022, 0.004, s + 1.3), MAT.duvet, s * (width / 2 + 0.025), dBottom + 0.13, dZ);
  }
  part(g, clothBox(width + 0.13, 0.34, 0.055, 0.022, 0.004, 2.2), MAT.duvet, 0, dBottom + 0.13, dZ + dLen / 2 + 0.005);

  // 床头翻折的床单：薄薄压在被沿上
  const foldZ = dZ - dLen / 2 + 0.09;
  part(g, clothBox(width + 0.07, 0.034, 0.3, 0.016, 0.003, 3.1), MAT.pillow, 0, dTop + 0.016, foldZ);
  part(g, clothBox(width + 0.05, 0.022, 0.08, 0.009, 0.002, 3.5), MAT.pillow, 0, dTop + 0.032, foldZ + 0.17);

  // 床尾搭毯：薄层覆盖 + 边缘垂坠，避免厚重
  const tz = dZ + dLen / 2 - 0.26;
  part(g, clothBox(width + 0.09, 0.03, 0.48, 0.016, 0.008, 4.2), MAT.throw, 0, dTop + 0.022, tz);
  part(g, clothBox(width + 0.02, 0.022, 0.17, 0.01, 0.004, 4.8), MAT.throw, 0, dTop + 0.04, tz + 0.145);
  for (const s of [-1, 1]) {
    part(g, clothBox(0.032, 0.29, 0.44, 0.012, 0.003, 5 + s), MAT.throw, s * (width / 2 + 0.05), dTop - 0.11, tz);
  }

  // 两只睡枕 + 两个装饰靠垫
  const pw = (width - 0.26) / 2;
  const pz = -length / 2 + 0.25;
  for (const s of [-1, 1]) {
    cushion(g, pw - 0.06, 0.42, 0.21, MAT.pillow, s * (pw / 2 + 0.04), top + 0.37, pz + s * 0.015, -0.35, 0, s * 0.03);
  }
  cushion(g, 0.44, 0.38, 0.17, MAT.cushionSage, -0.27, top + 0.36, pz + 0.19, -0.45, 0.12, 0.05);
  cushion(g, 0.44, 0.38, 0.17, MAT.cushionRust, 0.27, top + 0.36, pz + 0.19, -0.47, -0.1, -0.04);
}

export function bedWood(width, length) {
  const g = new THREE.Group();
  part(g, RB(width, 0.3, length, 0.03), MAT.walnut, 0, 0.15, 0);
  for (const s of [-1, 1]) part(g, RB(0.05, 0.16, length - 0.08, 0.015), MAT.oak, s * (width / 2 - 0.01), 0.24, 0.02);
  for (const x of [-width / 2 + 0.1, width / 2 - 0.1]) {
    for (const z of [-length / 2 + 0.1, length / 2 - 0.1]) part(g, CYL(0.028, 0.02, 0.12, 10), MAT.walnut, x, 0.06, z);
  }
  // 木条床头：立柱 + 上下横梁 + 竖向细条
  const hz = -length / 2 - 0.035;
  const hh = 1.02;
  for (const s of [-1, 1]) part(g, RB(0.055, hh, 0.09, 0.015), MAT.walnut, s * (width / 2 - 0.03), hh / 2, hz);
  part(g, RB(width, 0.075, 0.09, 0.02), MAT.walnut, 0, hh - 0.04, hz);
  part(g, RB(width, 0.05, 0.09, 0.015), MAT.oak, 0, hh - 0.24, hz);
  const slats = 9;
  for (let i = 0; i < slats; i++) {
    const x = -width / 2 + 0.12 + (i * (width - 0.24)) / (slats - 1);
    part(g, RB(0.032, 0.48, 0.04, 0.01), MAT.paleWood, x, 0.54, hz);
  }
  bedding(g, width, length);
  return g;
}

export function bedUpholstered(width, length) {
  const g = new THREE.Group();
  part(g, B(width - 0.16, 0.08, length - 0.16), MAT.black, 0, 0.04, 0.02);
  part(g, RB(width, 0.28, length, 0.035), MAT.fabricBeige, 0, 0.16, 0);
  // 通道软包床头
  const hh = 1.05;
  const hz = -length / 2 - 0.045;
  const panels = Math.max(2, Math.round(width / 0.42));
  const panelW = (width + 0.02) / panels;
  for (let i = 0; i < panels; i++) {
    const x = -(width + 0.02) / 2 + panelW * (i + 0.5);
    part(g, RB(panelW - 0.016, hh - 0.18, 0.1, 0.05), MAT.fabricBeige, x, hh / 2 + 0.08, hz);
  }
  part(g, RB(width + 0.06, 0.07, 0.12, 0.03), MAT.fabricBeige, 0, hh + 0.02, hz);
  part(g, B(width + 0.02, 0.03, 0.02), MAT.walnut, 0, 0.3, hz + 0.055);
  bedding(g, width, length);
  return g;
}

export function bedFloating(width, length) {
  const g = new THREE.Group();
  part(g, B(width - 0.36, 0.12, length - 0.36), MAT.black, 0, 0.06, 0.02);
  part(g, RB(width, 0.22, length, 0.025), MAT.paleWood, 0, 0.24, 0);
  part(g, RB(width - 0.08, 0.04, length - 0.08, 0.015), MAT.shadow, 0, 0.33, 0.01);
  const hz = -length / 2 - 0.035;
  part(g, RB(width + 0.04, 0.9, 0.08, 0.025), MAT.walnut, 0, 0.5, hz);
  part(g, RB(width + 0.12, 0.045, 0.1, 0.02), MAT.oak, 0, 0.955, hz);
  bedding(g, width, length, 0.35);
  return g;
}

function addTableLamp(g, y) {
  part(g, LATHE([[0.02, 0], [0.055, 0.005], [0.07, 0.04], [0.06, 0.08], [0.025, 0.1], [0.012, 0.12]]), MAT.ceramic, 0, y, 0);
  part(g, CYL(0.008, 0.008, 0.12, 8), MAT.brass, 0, y + 0.17, 0);
  part(g, new THREE.CylinderGeometry(0.08, 0.115, 0.15, 24, 1, true), MAT.shade, 0, y + 0.28, 0);
  part(g, new THREE.SphereGeometry(0.022, 12, 8), MAT.lampWarm, 0, y + 0.26, 0);
  const light = new THREE.PointLight(0xffd8a8, 0.85, 2.4, 2);
  light.position.set(0, y + 0.26, 0);
  g.add(light);
}

export function nightstandDrawer() {
  const g = new THREE.Group();
  part(g, B(0.36, 0.035, 0.32), MAT.shadow, 0, 0.0175, 0);
  part(g, RB(0.45, 0.36, 0.4, 0.012), MAT.oak, 0, 0.22, 0);
  part(g, RB(0.47, 0.03, 0.42, 0.008), MAT.walnut, 0, 0.415, 0);
  for (const y of [0.15, 0.31]) {
    part(g, RB(0.4, 0.145, 0.018, 0.006), MAT.paleWood, 0, y, 0.203);
    part(g, CYL(0.011, 0.011, 0.022, 10), MAT.brass, 0, y, 0.218, Math.PI / 2);
  }
  addTableLamp(g, 0.43);
  return g;
}

export function nightstandRound() {
  const g = new THREE.Group();
  part(g, CYL(0.18, 0.18, 0.03, 28), MAT.shadow, 0, 0.015, 0);
  part(g, CYL(0.21, 0.21, 0.36, 32), MAT.oak, 0, 0.21, 0);
  part(g, CYL(0.23, 0.23, 0.03, 32), MAT.walnut, 0, 0.405, 0);
  part(g, new THREE.TorusGeometry(0.211, 0.003, 6, 40), MAT.shadow, 0, 0.27, 0, Math.PI / 2);
  part(g, CYL(0.012, 0.012, 0.02, 10), MAT.brass, 0, 0.27, 0.215, Math.PI / 2);
  addTableLamp(g, 0.42);
  return g;
}

export function nightstandOpen() {
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

// 衣柜公共柜体：内收踢脚、柜身、顶部压线
function wardrobeShell(g) {
  part(g, B(1.5, 0.08, 0.48), MAT.shadow, 0, 0.04, -0.02);
  part(g, RB(1.6, 1.98, 0.6, 0.015), MAT.oak, 0, 1.06, 0);
  part(g, RB(1.64, 0.045, 0.62, 0.012), MAT.walnut, 0, 2.075, 0);
}

export function wardrobeFlat() {
  const g = new THREE.Group();
  wardrobeShell(g);
  for (const x of [-0.395, 0.395]) {
    // 门板基板 + 凸起的 Shaker 边框
    part(g, RB(0.77, 1.94, 0.018, 0.006), MAT.paleWood, x, 1.08, 0.312);
    const top = 1.08 + 0.97;
    const bot = 1.08 - 0.97;
    part(g, RB(0.77, 0.055, 0.012, 0.004), MAT.paleWood, x, top - 0.0275, 0.322);
    part(g, RB(0.77, 0.055, 0.012, 0.004), MAT.paleWood, x, bot + 0.0275, 0.322);
    part(g, RB(0.055, 1.94, 0.012, 0.004), MAT.paleWood, x - 0.3575, 1.08, 0.322);
    part(g, RB(0.055, 1.94, 0.012, 0.004), MAT.paleWood, x + 0.3575, 1.08, 0.322);
    // 长条金属拉手
    part(g, CYL(0.01, 0.01, 0.34, 10), MAT.metal, x + (x < 0 ? 0.29 : -0.29), 1.28, 0.338);
    for (const y of [1.13, 1.43]) {
      part(g, CYL(0.007, 0.007, 0.03, 8), MAT.metal, x + (x < 0 ? 0.29 : -0.29), y, 0.328, Math.PI / 2);
    }
  }
  part(g, B(0.008, 1.94, 0.012), MAT.shadow, 0, 1.08, 0.324);
  return g;
}

export function wardrobeSlat() {
  const g = new THREE.Group();
  wardrobeShell(g);
  // 深色背衬让板条之间出现真实缝隙
  part(g, B(1.5, 1.9, 0.012), MAT.slatGap, 0, 1.08, 0.296);
  part(g, RB(1.54, 0.05, 0.03, 0.008), MAT.paleWood, 0, 2.02, 0.315);
  part(g, RB(1.54, 0.05, 0.03, 0.008), MAT.paleWood, 0, 0.14, 0.315);
  for (let i = 0; i < 31; i++) {
    part(g, RB(0.036, 1.86, 0.026, 0.008), MAT.paleWood, -0.744 + i * 0.0496, 1.08, 0.312);
  }
  for (const x of [-0.06, 0.06]) {
    part(g, CYL(0.01, 0.01, 0.4, 10), MAT.metal, x, 1.22, 0.342);
    for (const y of [1.06, 1.38]) part(g, CYL(0.007, 0.007, 0.03, 8), MAT.metal, x, y, 0.332, Math.PI / 2);
  }
  return g;
}

export function wardrobeGlass() {
  const g = new THREE.Group();
  wardrobeShell(g);
  // 内胆：背板、层板、挂衣杆和叠放衣物
  part(g, RB(1.5, 1.9, 0.02, 0.006), MAT.paleWood, 0, 1.08, -0.275);
  part(g, RB(1.48, 0.03, 0.5, 0.006), MAT.walnut, 0, 1.06, -0.01);
  part(g, CYL(0.012, 0.012, 1.42, 10), MAT.metal, 0, 1.66, -0.08, 0, 0, Math.PI / 2);
  for (const x of [-0.42, 0.36]) {
    part(g, RB(0.34, 0.07, 0.4, 0.02), MAT.fabricBeige, x, 1.105, -0.02);
    part(g, RB(0.3, 0.2, 0.24, 0.03), MAT.duvetAccent, x + 0.25, 1.56, -0.03);
  }
  // 玻璃门 + 窄金属框
  for (const x of [-0.395, 0.395]) {
    part(g, RB(0.77, 1.94, 0.012, 0.004), MAT.glass, x, 1.08, 0.305);
    const top = 1.08 + 0.97;
    const bot = 1.08 - 0.97;
    part(g, RB(0.77, 0.045, 0.018, 0.004), MAT.paleWood, x, top - 0.0225, 0.312);
    part(g, RB(0.77, 0.045, 0.018, 0.004), MAT.paleWood, x, bot + 0.0225, 0.312);
    part(g, RB(0.045, 1.94, 0.018, 0.004), MAT.paleWood, x - 0.3625, 1.08, 0.312);
    part(g, RB(0.045, 1.94, 0.018, 0.004), MAT.paleWood, x + 0.3625, 1.08, 0.312);
    part(g, CYL(0.01, 0.01, 0.36, 10), MAT.metal, x + (x < 0 ? 0.29 : -0.29), 1.28, 0.328);
    for (const y of [1.13, 1.43]) {
      part(g, CYL(0.007, 0.007, 0.03, 8), MAT.metal, x + (x < 0 ? 0.29 : -0.29), y, 0.318, Math.PI / 2);
    }
  }
  return g;
}


export function nightstandModel(key, w, d) {
  const g = modelGroup(key, w, d);
  if (!g) return null;
  const top = topOf(g);
  addTableLamp(g, top);
  part(g, B(0.15, 0.022, 0.11), BOOK_MATS[1], -w * 0.22, top + 0.011, d * 0.1, 0, 0.18);
  part(g, B(0.13, 0.018, 0.1), BOOK_MATS[3], -w * 0.2, top + 0.031, d * 0.08, 0, -0.1);
  return g;
}

// 真实餐桌：在模型顶面加中心摆件和餐具
