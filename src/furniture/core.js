import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { pbrTextures } from '../pbr.js';

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
export const MAT = {
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
  driedStem: std(0x9a7f5f, 0.95),
  pampas: std(0xd8caac, 1),
  pot: std(0xa9a49c, 0.75),
  soil: std(0x3a2c21, 1),
  rug: fabric(0xc6b7a2, 1),
  rugBorder: fabric(0x9b8973, 1),
  duvet: fabric(0xded3c2, 0.95),
  duvetAccent: fabric(0xa6ae9f, 0.95),
  pillow: fabric(0xf2eee5, 0.95),
  sheet: fabric(0xf3efe6, 0.97),
  mattress: fabric(0xf4f1ea, 0.98),
  throw: fabric(0x9b6f57, 0.97),
  cushionRust: fabric(0x9b6f57, 0.95),
  cushionSage: fabric(0x8e9783, 0.95),
  appliance: phys({ color: 0xeeece6, roughness: 0.3, metalness: 0, clearcoat: 0.4, clearcoatRoughness: 0.16, envMapIntensity: 0.85 }),
  steel: metalMat(0xc3c7c6, 0.24, 1.1),
  steelBrushed: metalMat(0xb8bcba, 0.4, 0.55),
  blackGlass: phys({ color: 0x0b0d0e, roughness: 0.06, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.3 }),
  cup: phys({ color: 0xe9f2f0, transparent: true, opacity: 0.26, roughness: 0.06, metalness: 0, ior: 1.45, envMapIntensity: 1.5, side: THREE.DoubleSide }),
  shadow: std(0x24211e, 0.9),
  recess: std(0xbfb5a6, 0.86),
  slatGap: std(0x3a2e23, 0.95),
  lampWarm: new THREE.MeshStandardMaterial({ color: 0xfff1d8, emissive: 0xffd2a0, emissiveIntensity: 1.1, roughness: 0.5 }),
  shade: new THREE.MeshStandardMaterial({
    color: 0xf5ecdc, emissive: 0xffcf96, emissiveIntensity: 1.15, roughness: 0.92, side: THREE.DoubleSide,
  }),
  screen: phys({ color: 0x8b98a4, roughness: 0.07, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04, vertexColors: true }),
  bezel: phys({ color: 0x0e1013, roughness: 0.35, metalness: 0, clearcoat: 0.7, clearcoatRoughness: 0.2 }),
  glass: phys({
    color: 0xdfeaeb, transparent: true, opacity: 0.12, roughness: 0.03,
    metalness: 0, ior: 1.5, envMapIntensity: 1.5,
    side: THREE.DoubleSide, depthWrite: false,
  }),
  stoneTop: phys({ color: 0xe6e2d8, roughness: 0.34, metalness: 0, clearcoat: 0.12, clearcoatRoughness: 0.5, envMapIntensity: 0.7 }),
};

const BOOK_COLORS = [0x7a4a3a, 0x3e5a6b, 0x7b6b45, 0x8c8c8c, 0x4f6350, 0x9c7f5f];
export const BOOK_MATS = BOOK_COLORS.map((c) => std(c, 0.9));

const FABRIC_MATS = [
  'fabricGray', 'fabricBeige', 'fabricDark', 'basket', 'basketLight',
  'duvet', 'duvetAccent', 'pillow', 'sheet', 'mattress', 'throw', 'cushionRust', 'cushionSage',
];
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

const GLOSSY_MATS = ['metal', 'brass', 'steel', 'steelBrushed', 'glass', 'cup', 'blackGlass', 'stoneTop', 'screen', 'bezel']; // appliance 走 scene.environment

// 高反射材质单独挂 HDRI，保留玻璃/金属反射；传 null 时清除
export function applyGlossyEnv(envTexture) {
  for (const key of GLOSSY_MATS) {
    const mat = MAT[key];
    mat.envMap = envTexture;
    mat.needsUpdate = true;
  }
}

export function part(parent, geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  mesh.rotation.set(rx, ry, rz);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

export const B = (w, h, d) => new THREE.BoxGeometry(w, h, d);
export const RB = (w, h, d, r = 0.02) => new RoundedBoxGeometry(w, h, d, 3, r);
export const CYL = (rt, rb, h, seg = 20) => new THREE.CylinderGeometry(rt, rb, h, seg);
export const LATHE = (pts, seg = 32) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);

// 软包盒：顶面加低频起伏，让被子/坐垫不再像硬盒
export function clothBox(w, h, d, r = 0.03, fold = 0.006, seed = 0) {
  const geo = new RoundedBoxGeometry(w, h, d, 5, r);
  const pos = geo.attributes.position;
  const top = h / 2;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    if (y <= top - 0.03) continue;
    const n = Math.sin(x * 7.3 + seed) * Math.cos(z * 5.1 + seed * 1.7)
      + 0.5 * Math.sin(x * 13.1 - z * 9.7 + seed * 0.6);
    pos.setY(i, y + n * fold);
  }
  geo.computeVertexNormals();
  return geo;
}

// 枕头几何：超椭球把球面拉成圆角矩形，四边自然收薄，中间鼓起
export function softPillowGeo(w, h, t, boxy = 0.62, puff = 0.9) {
  const geo = new THREE.SphereGeometry(0.5, 28, 20);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const nx = pos.getX(i) * 2;
    const ny = pos.getY(i) * 2;
    const nz = pos.getZ(i) * 2;
    const sx = Math.sign(nx) * Math.abs(nx) ** boxy;
    const sy = Math.sign(ny) * Math.abs(ny) ** boxy;
    const sz = Math.sign(nz) * Math.abs(nz) ** puff;
    pos.setXYZ(i, sx * w / 2, sy * h / 2, sz * t / 2);
  }
  geo.computeVertexNormals();
  return geo;
}

// 立放靠枕：高度沿 Y、厚度沿 Z，负 rx 即向床头方向后仰
export function cushion(parent, w, h, t, mat, x, y, z, rx = -0.22, ry = 0, rz = 0, boxy = 0.62) {
  return part(parent, softPillowGeo(w, h, t, boxy), mat, x, y, z, rx, ry, rz);
}

// 上下口径不同的方锥台，用于油烟机罩
export function taperBox(wTop, dTop, wBottom, dBottom, h) {
  const hwT = wTop / 2;
  const hdT = dTop / 2;
  const hwB = wBottom / 2;
  const hdB = dBottom / 2;
  const hy = h / 2;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute([
    -hwB, -hy, -hdB, hwB, -hy, -hdB, hwB, -hy, hdB, -hwB, -hy, hdB,
    -hwT, hy, -hdT, hwT, hy, -hdT, hwT, hy, hdT, -hwT, hy, hdT,
  ], 3));
  geo.setIndex([
    0, 1, 2, 0, 2, 3, 4, 6, 5, 4, 7, 6,
    0, 4, 5, 0, 5, 1, 1, 5, 6, 1, 6, 2,
    2, 6, 7, 2, 7, 3, 3, 7, 4, 3, 4, 0,
  ]);
  geo.computeVertexNormals();
  return geo;
}

// 圆管路径，用于龙头出水弯管
export function tube(parent, pts, radius, mat, seg = 28) {
  const curve = new THREE.CatmullRomCurve3(pts.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
  return part(parent, new THREE.TubeGeometry(curve, seg, radius, 8, false), mat);
}

// 椭圆座圈 / 盖板：带圆角的挤出环，hole 为内孔半径
export function ovalGeo(rx, rz, thick, hole = null, bevel = 0.008) {
  const shape = new THREE.Shape();
  shape.absellipse(0, 0, rx, rz, 0, Math.PI * 2, false, 0);
  if (hole) {
    const path = new THREE.Path();
    path.absellipse(0, 0, hole[0], hole[1], 0, Math.PI * 2, true, 0);
    shape.holes.push(path);
  }
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: thick, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 2, curveSegments: 28,
  });
  geo.rotateX(-Math.PI / 2);
  return geo;
}


const artMats = new Map();
const ART_PALETTES = [
  ['#ded4c3', '#f2ece2', '#b5724f', '#8e9885', '#5e5a55'],
  ['#e7e0d4', '#f4efe6', '#8c9a8b', '#c9a26b', '#6b6b60'],
  ['#e3ddd5', '#f3eee6', '#68798a', '#c4a17c', '#7f746b'],
];
export function artCanvasMaterial(variant = 0) {
  const key = variant % ART_PALETTES.length;
  if (artMats.has(key)) return artMats.get(key);
  const [bg0, bg1, shapeA, shapeB, shapeC] = ART_PALETTES[key];
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 320;
  const x = c.getContext('2d');
  const grad = x.createLinearGradient(0, 0, 512, 320);
  grad.addColorStop(0, bg0);
  grad.addColorStop(1, bg1);
  x.fillStyle = grad;
  x.fillRect(0, 0, 512, 320);
  x.fillStyle = shapeA;
  x.beginPath();
  x.arc(155, 235, 105, 0, Math.PI * 2);
  x.fill();
  x.fillStyle = shapeB;
  x.fillRect(235, 55, 190, 160);
  x.fillStyle = shapeC;
  x.beginPath();
  x.arc(365, 245, 58, 0, Math.PI * 2);
  x.fill();
  const img = x.getImageData(0, 0, 512, 320);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 10;
    img.data[i] += n;
    img.data[i + 1] += n;
    img.data[i + 2] += n;
  }
  x.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.92 });
  artMats.set(key, mat);
  return mat;
}

const PLUME_GEO = new THREE.SphereGeometry(1, 7, 6);

// 单人位餐具：编织餐垫、瓷盘、布餐巾和玻璃杯
export function placeSetting(g, x, z, y, rotY = 0) {
  const s = new THREE.Group();
  s.position.set(x, y, z);
  s.rotation.y = rotY;
  g.add(s);
  part(s, CYL(0.135, 0.135, 0.006, 28), MAT.basket, 0, 0.003, 0);
  part(s, LATHE([
    [0, 0.006], [0.085, 0.006], [0.106, 0.014], [0.112, 0.024], [0.104, 0.027], [0.086, 0.017], [0, 0.013],
  ], 28), MAT.ceramic, 0, 0.008, 0);
  part(s, RB(0.1, 0.012, 0.11, 0.004), MAT.cushionSage, 0.01, 0.044, 0, 0, 0.18, 0);
  part(s, RB(0.012, 0.005, 0.15, 0.002), MAT.steel, -0.155, 0.008, 0.01);
  part(s, RB(0.012, 0.005, 0.15, 0.002), MAT.steel, 0.155, 0.008, 0.01);
  part(s, new THREE.CylinderGeometry(0.032, 0.026, 0.095, 16, 1, true), MAT.cup, 0.17, 0.048, -0.1);
  return s;
}

// 餐桌中心摆件：陶瓶 + 几枝干花
export function centerpiece(g, y, ox = 0, oz = 0) {
  part(g, LATHE([[0.03, 0], [0.07, 0.015], [0.09, 0.07], [0.07, 0.15], [0.05, 0.19], [0.055, 0.21]]), MAT.ceramic, ox, y, oz);
  const stems = [
    [-0.03, 0.01, 0.28, 0.12],
    [0.035, -0.02, 0.34, -0.16],
    [0.0, 0.035, 0.24, 0.04],
  ];
  for (const [x, z, h, tilt] of stems) {
    const stem = part(g, CYL(0.003, 0.004, h, 6), MAT.driedStem, ox + x, y + 0.2 + h / 2, oz + z);
    stem.rotation.z = tilt;
    const topX = ox + x + Math.sin(tilt) * h * 0.5;
    const topY = y + 0.2 + Math.cos(tilt) * h;
    for (const side of [-1, 1]) {
      for (let k = 0; k < 7; k++) {
        const t = k / 6;
        const plume = new THREE.Mesh(PLUME_GEO, MAT.pampas);
        plume.scale.set(0.007 + 0.002 * Math.sin(k * 2.1), 0.038 - 0.016 * t, 0.007);
        plume.position.set(
          topX + side * (0.008 + 0.022 * t),
          topY + 0.035 - 0.065 * t,
          oz + z + side * (0.008 + 0.012 * t),
        );
        plume.rotation.set(0.12, side * 0.4, side * (0.45 + 0.65 * t));
        plume.castShadow = true;
        g.add(plume);
      }
    }
  }
}


export const topOf = (g) => new THREE.Box3().setFromObject(g).max.y;
