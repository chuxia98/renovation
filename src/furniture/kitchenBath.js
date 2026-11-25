import * as THREE from 'three';
import { Reflector } from 'three/addons/objects/Reflector.js';
import { part, MAT, B, RB, CYL, LATHE, tube, taperBox, ovalGeo } from './core.js';

// ---------- 厨卫 ----------

export function fridge() {
  const g = new THREE.Group();
  const W = 0.7;
  const D = 0.65;
  const H = 1.85;
  part(g, RB(W, H, D, 0.035), MAT.appliance, 0, H / 2, 0);
  const fz = D / 2 + 0.005;
  // 微凸的冷藏/冷冻门板，中间只留一道柔和的收口
  part(g, RB(W - 0.02, 0.81, 0.028, 0.014), MAT.appliance, 0, 1.385, fz);
  part(g, RB(W - 0.02, 0.89, 0.028, 0.014), MAT.appliance, 0, 0.555, fz);
  part(g, B(W - 0.06, 0.006, 0.006), MAT.recess, 0, 0.978, fz + 0.014);
  // 竖向长把手（左侧），哑光不锈钢配短支脚
  part(g, CYL(0.011, 0.011, 0.4, 12), MAT.steelBrushed, -W / 2 + 0.105, 1.2, fz + 0.034);
  part(g, CYL(0.011, 0.011, 0.36, 12), MAT.steelBrushed, -W / 2 + 0.105, 0.65, fz + 0.034);
  for (const y of [1.01, 1.39, 0.48, 0.82]) {
    part(g, CYL(0.007, 0.007, 0.034, 8), MAT.steelBrushed, -W / 2 + 0.105, y, fz + 0.017, Math.PI / 2);
  }
  // 底部散热格栅与调平脚
  for (let i = 0; i < 5; i++) part(g, B(0.3, 0.008, 0.014), MAT.metal, 0, 0.085 + i * 0.018, fz + 0.008);
  for (const x of [-W / 2 + 0.07, W / 2 - 0.07]) {
    for (const z of [-D / 2 + 0.07, D / 2 - 0.07]) part(g, CYL(0.016, 0.016, 0.045, 8), MAT.black, x, 0.022, z);
  }
  return g;
}

// 圆角矩形轮廓；用于带孔的台面
function roundedRect(cx, cy, w, h, r = 0.02) {
  const x = cx - w / 2;
  const y = cy - h / 2;
  const s = new THREE.Shape();
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function countertopGeo(w, d, thick, hole) {
  const shape = roundedRect(0, 0, w, d, 0.01);
  if (hole) shape.holes.push(roundedRect(hole.x, -hole.z, hole.w, hole.d, 0.045));
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thick, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 2, curveSegments: 18,
  });
  geo.rotateX(-Math.PI / 2);
  return geo;
}

export function counter() {
  const g = new THREE.Group();
  const W = 1.8;
  const D = 0.6;

  // 踢脚 + 柜体 + Shaker 门板
  part(g, B(W - 0.08, 0.1, D - 0.1), MAT.shadow, 0, 0.05, -0.01);
  part(g, RB(W, 0.76, D - 0.03, 0.012), MAT.cream, 0, 0.48, 0);
  for (const x of [-0.6, 0, 0.6]) {
    part(g, RB(0.576, 0.72, 0.022, 0.008), MAT.cream, x, 0.48, 0.292);
    part(g, B(0.53, 0.674, 0.004), MAT.recess, x, 0.48, 0.304);
    part(g, RB(0.5, 0.644, 0.012, 0.006), MAT.cream, x, 0.48, 0.308);
    part(g, B(0.16, 0.014, 0.014), MAT.metal, x, 0.78, 0.322);
  }

  // 石英石台面（真实开孔）与水槽盆体
  part(g, countertopGeo(W + 0.02, D + 0.02, 0.04, { x: 0.42, z: 0.02, w: 0.48, d: 0.38 }), MAT.stoneTop, 0, 0.86, 0);
  const bx = 0.42;
  const bz = 0.02;
  const bw = 0.44;
  const bd = 0.34;
  part(g, B(bw, 0.012, bd), MAT.steel, bx, 0.7, bz);
  for (const s of [-1, 1]) {
    part(g, B(0.012, 0.17, bd), MAT.steel, bx + s * bw / 2, 0.785, bz);
    part(g, B(bw, 0.17, 0.012), MAT.steel, bx, 0.785, bz + s * bd / 2);
  }
  part(g, CYL(0.032, 0.032, 0.006, 18), MAT.metal, bx, 0.708, bz);
  // 龙头：立柱 + 弧形出水弯管 + 把手
  part(g, CYL(0.026, 0.03, 0.02, 20), MAT.steel, bx, 0.912, -0.21);
  tube(g, [
    [bx, 0.9, -0.21], [bx, 1.01, -0.21], [bx, 1.12, -0.19],
    [bx, 1.17, -0.1], [bx, 1.14, -0.01], [bx, 1.09, 0.03],
  ], 0.014, MAT.steel);
  part(g, CYL(0.012, 0.012, 0.05, 12), MAT.steel, bx, 1.06, 0.03);
  part(g, CYL(0.03, 0.03, 0.012, 14), MAT.steel, bx + 0.055, 1.0, -0.18, 0, 0, Math.PI / 2);
  part(g, B(0.075, 0.012, 0.018), MAT.steel, bx + 0.085, 1.0, -0.18);
  // 皂液瓶
  part(g, CYL(0.028, 0.032, 0.09, 14), MAT.ceramic, 0.76, 0.945, -0.18);
  part(g, CYL(0.006, 0.006, 0.06, 8), MAT.metal, 0.76, 1.02, -0.18);
  part(g, B(0.045, 0.01, 0.014), MAT.metal, 0.775, 1.045, -0.18);

  // 灶台
  const cx = -0.45;
  part(g, RB(0.62, 0.016, 0.46, 0.006), MAT.blackGlass, cx, 0.908, 0);
  for (const [dx, dz, r] of [[-0.16, -0.13, 0.075], [0.16, -0.13, 0.06], [-0.16, 0.12, 0.06], [0.16, 0.12, 0.075]]) {
    part(g, new THREE.TorusGeometry(r, 0.006, 6, 28), MAT.metal, cx + dx, 0.917, dz, Math.PI / 2);
  }
  for (let i = 0; i < 4; i++) part(g, CYL(0.007, 0.007, 0.004, 10), MAT.metal, cx - 0.15 + i * 0.1, 0.918, 0.2);

  // 整面石英石防溅板
  part(g, RB(W + 0.02, 0.55, 0.02, 0.006), MAT.stoneTop, 0, 1.175, -0.3);

  // 油烟机：锥形罩 + 烟道 + 暖光灯
  part(g, taperBox(0.3, 0.24, 0.62, 0.46, 0.18), MAT.steelBrushed, cx, 1.71, -0.06);
  part(g, B(0.62, 0.022, 0.46), MAT.steelBrushed, cx, 1.615, -0.06);
  part(g, B(0.24, 1.02, 0.22), MAT.steelBrushed, cx, 2.32, -0.14);
  part(g, B(0.34, 0.02, 0.3), MAT.steelBrushed, cx, 2.84, -0.14);
  part(g, B(0.18, 0.035, 0.01), MAT.black, cx, 1.705, 0.172);
  for (const dx of [-0.13, 0.13]) {
    part(g, CYL(0.036, 0.036, 0.012, 16), MAT.lampWarm, cx + dx, 1.603, -0.06);
  }

  // 靠墙斜放的木砧板与台面小水壶
  part(g, RB(0.34, 0.46, 0.018, 0.01), MAT.oak, -0.03, 1.13, -0.272, -0.1);
  part(g, LATHE([[0.05, 0], [0.075, 0.01], [0.082, 0.08], [0.07, 0.16], [0.052, 0.2], [0.046, 0.21]], 24), MAT.black, 0.78, 0.9, 0.12);
  part(g, CYL(0.03, 0.024, 0.025, 14), MAT.steel, 0.78, 1.12, 0.12);
  part(g, new THREE.SphereGeometry(0.014, 10, 8), MAT.steel, 0.78, 1.138, 0.12);
  tube(g, [[0.72, 1.04, 0.12], [0.7, 1.18, 0.12], [0.78, 1.23, 0.12], [0.86, 1.18, 0.12], [0.84, 1.04, 0.12]], 0.011, MAT.black, 24);
  // 侧面的出水嘴
  part(g, CYL(0.01, 0.016, 0.12, 10), MAT.black, 0.85, 0.98, 0.12, 0, 0, -0.7);
  return g;
}

// 分体式：旋成体 pedestal + 空心桶身 + 座圈盖板 + 双档冲水按钮
export function toiletStandard() {
  const g = new THREE.Group();
  const bowl = part(g, LATHE([
    [0.14, 0], [0.13, 0.015], [0.1, 0.1], [0.095, 0.16], [0.12, 0.24],
    [0.16, 0.31], [0.185, 0.36], [0.19, 0.4], [0.16, 0.4], [0.13, 0.35], [0.09, 0.31], [0, 0.29],
  ]), MAT.ceramic, 0, 0, 0.08);
  bowl.scale.z = 1.3;
  part(g, ovalGeo(0.185, 0.235, 0.02, [0.125, 0.165]), MAT.ceramic, 0, 0.4, 0.08);
  part(g, ovalGeo(0.19, 0.24, 0.016), MAT.ceramic, 0, 0.432, 0.08);
  // 桶身尾部安装平台：水箱坐在其上，与桶身连成整体
  part(g, RB(0.32, 0.14, 0.26, 0.04), MAT.ceramic, 0, 0.32, -0.21);
  part(g, B(0.06, 0.025, 0.05), MAT.metal, 0, 0.435, -0.16);
  part(g, RB(0.4, 0.4, 0.17, 0.025), MAT.ceramic, 0, 0.56, -0.26);
  part(g, RB(0.42, 0.03, 0.19, 0.012), MAT.ceramic, 0, 0.775, -0.26);
  part(g, CYL(0.016, 0.016, 0.01, 14), MAT.metal, -0.022, 0.795, -0.26);
  part(g, CYL(0.013, 0.013, 0.01, 14), MAT.metal, 0.022, 0.795, -0.26);
  return g;
}

// 一体式智能马桶：连续曲面机身、集成盖板 + 侧控板 + 夜灯
export function toiletSmart() {
  const g = new THREE.Group();
  const led = new THREE.MeshStandardMaterial({ color: 0x9fd8ff, emissive: 0x6fc4ff, emissiveIntensity: 1.4, roughness: 0.4 });
  const body = part(g, LATHE([
    [0.16, 0], [0.15, 0.02], [0.125, 0.12], [0.13, 0.22], [0.17, 0.32],
    [0.19, 0.4], [0.16, 0.405], [0.12, 0.36], [0, 0.34],
  ]), MAT.ceramic, 0, 0, 0.05);
  body.scale.z = 1.3;
  part(g, RB(0.36, 0.18, 0.22, 0.07), MAT.ceramic, 0, 0.46, -0.24);
  part(g, ovalGeo(0.185, 0.235, 0.018, [0.125, 0.165]), MAT.white, 0, 0.405, 0.05);
  part(g, ovalGeo(0.19, 0.24, 0.02), MAT.white, 0, 0.432, 0.05);
  // 侧控板 + 旋钮
  part(g, RB(0.03, 0.06, 0.2, 0.012), MAT.bezel, 0.19, 0.44, -0.02);
  part(g, CYL(0.015, 0.015, 0.02, 14), MAT.metal, 0.2, 0.47, -0.1, 0, 0, Math.PI / 2);
  part(g, B(0.012, 0.02, 0.05), led, 0.205, 0.44, 0.04);
  // 底部夜灯：贴合机身的弧形灯带
  const night = new THREE.TorusGeometry(0.14, 0.006, 8, 24, 1.1);
  night.rotateZ(Math.PI / 2 - 0.55);
  night.rotateX(Math.PI / 2);
  const strip = part(g, night, led, 0, 0.06, 0.05);
  strip.scale.z = 1.3;
  return g;
}

// 壁挂式：隐藏水箱面板 + 双冲水面板 + 悬空旋成体桶身
export function toiletWall() {
  const g = new THREE.Group();
  part(g, RB(0.5, 0.98, 0.14, 0.02), MAT.white, 0, 0.49, -0.24);
  part(g, RB(0.16, 0.1, 0.015, 0.008), MAT.metal, 0, 0.92, -0.165);
  part(g, B(0.06, 0.07, 0.008), MAT.bezel, -0.04, 0.92, -0.155);
  part(g, B(0.05, 0.07, 0.008), MAT.bezel, 0.04, 0.92, -0.155);
  const bowl = part(g, LATHE([
    [0, 0.26], [0.07, 0.27], [0.13, 0.3], [0.17, 0.35], [0.185, 0.4],
    [0.15, 0.4], [0.12, 0.36], [0, 0.34],
  ]), MAT.ceramic, 0, 0, 0.06);
  bowl.scale.z = 1.25;
  part(g, B(0.24, 0.12, 0.1), MAT.ceramic, 0, 0.36, -0.12);
  part(g, ovalGeo(0.18, 0.225, 0.02, [0.12, 0.16]), MAT.ceramic, 0, 0.4, 0.06);
  part(g, ovalGeo(0.185, 0.23, 0.016), MAT.ceramic, 0, 0.432, 0.06);
  return g;
}

export function washbasin() {
  const g = new THREE.Group();
  // 内收踢脚 + 柜体 + 双层抽屉面板
  part(g, B(0.9, 0.08, 0.4), MAT.black, 0, 0.04, -0.02);
  part(g, RB(0.96, 0.66, 0.46, 0.02), MAT.oak, 0, 0.41, 0);
  for (const y of [0.28, 0.56]) {
    part(g, RB(0.9, 0.24, 0.02, 0.008), MAT.oak, 0, y, 0.235);
    part(g, CYL(0.008, 0.008, 0.3, 10), MAT.brass, 0, y + 0.09, 0.25, 0, 0, Math.PI / 2);
  }
  // 石英石台面 + 空心台上盆 + 下水
  part(g, RB(1.0, 0.04, 0.52, 0.012), MAT.stoneTop, 0, 0.76, 0);
  const basin = part(g, LATHE([
    [0.09, 0], [0.14, 0.015], [0.17, 0.06], [0.165, 0.12], [0.15, 0.125], [0.12, 0.1], [0.08, 0.05], [0, 0.04],
  ]), MAT.ceramic, 0, 0.78, 0.06);
  basin.scale.z = 1.15;
  part(g, CYL(0.02, 0.02, 0.008, 12), MAT.metal, 0, 0.825, 0.06);
  // 龙头：立管 + 弯头 + 出水管 + 把手
  part(g, CYL(0.014, 0.016, 0.26, 12), MAT.metal, 0, 0.91, -0.19);
  part(g, new THREE.SphereGeometry(0.016, 12, 10), MAT.metal, 0, 1.04, -0.19);
  part(g, CYL(0.011, 0.011, 0.16, 10), MAT.metal, 0, 1.03, -0.11, Math.PI / 2 - 0.18);
  part(g, CYL(0.006, 0.006, 0.07, 8), MAT.metal, 0.03, 1.06, -0.19, 0, 0, -0.5);
  // 黄铜框镜：实时平面反射照出室内，金属+HDRI 只会映出天空黑地
  part(g, RB(0.94, 0.76, 0.025, 0.01), MAT.brass, 0, 1.55, -0.235);
  part(g, B(0.88, 0.7, 0.012), MAT.bezel, 0, 1.55, -0.222);
  const mirror = new Reflector(new THREE.PlaneGeometry(0.88, 0.7), {
    textureWidth: 1024,
    textureHeight: 1024,
    color: 0xc9d8de,
  });
  mirror.position.set(0, 1.55, -0.215);
  g.add(mirror);
  return g;
}

export function shower() {
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

