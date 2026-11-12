import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// 真实模型注册表：正面朝 +Z（与家具约定一致），rotateY 仅用于纠正资产朝向
const REGISTRY = {
  sofaVelvet: { url: 'khronos/glam-velvet-sofa.glb' },
  sheenChair: { url: 'khronos/sheen-chair.glb' },
  shelf01: { url: 'ph/_shelf_01/Shelf_01_1k.gltf' },
  coffeeRound: { url: 'ph/coffee_table_round_01/coffee_table_round_01_1k.gltf' },
  diningChair: { url: 'ph/dining_chair_02/dining_chair_02_1k.gltf' },
  loungeChair: { url: 'ph/mid_century_lounge_chair/mid_century_lounge_chair_1k.gltf' },
  coffeeModern: { url: 'ph/modern_coffee_table_01/modern_coffee_table_01_1k.gltf', rotateY: Math.PI / 2 },
  cabinet: { url: 'ph/modern_wooden_cabinet/modern_wooden_cabinet_1k.gltf' },
  plant02: { url: 'ph/potted_plant_02/potted_plant_02_1k.gltf' },
  sideTable: { url: 'ph/side_table_01/side_table_01_1k.gltf' },
};

const cache = new Map();
const envMats = new Set();

async function loadOne(key, def) {
  const gltf = await new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}models/${def.url}`);
  const root = gltf.scene;
  if (def.rotateY) root.rotation.y = def.rotateY;
  const drop = [];
  root.traverse((o) => {
    if (o.isLight || o.isCamera) drop.push(o);
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  for (const o of drop) o.parent?.remove(o);

  // 归一化：max(x,z)=1、XZ 居中、落地，原型缓存后按目标尺寸 uniform scale
  root.updateMatrixWorld(true);
  const size = new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3());
  root.scale.setScalar(1 / Math.max(size.x, size.z));
  root.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(root);
  const center = box.getCenter(new THREE.Vector3());
  root.position.x -= center.x;
  root.position.y -= box.min.y;
  root.position.z -= center.z;

  const proto = new THREE.Group();
  proto.add(root);
  proto.updateMatrixWorld(true);
  const finalSize = new THREE.Box3().setFromObject(proto).getSize(new THREE.Vector3());
  proto.traverse((o) => {
    if (!o.isMesh) return;
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) envMats.add(m);
  });
  cache.set(key, { proto, size: finalSize });
}

// 单个资产失败只警告并跳过，对应变体回落程序化构建
export async function loadModels() {
  await Promise.all(Object.entries(REGISTRY).map(async ([key, def]) => {
    try {
      await loadOne(key, def);
    } catch (err) {
      console.warn(`model ${key} load failed, fallback to procedural`, err);
    }
  }));
}

export function modelGroup(key, w, d) {
  const hit = cache.get(key);
  if (!hit) return null;
  const g = hit.proto.clone();
  g.scale.setScalar(Math.min(w / hit.size.x, d / hit.size.z));
  return g;
}

// 只给无贴图的金属/亮面材质挂显式 envMap；带 ORM 贴图的材质 metalness 缺省为 1，不能按阈值命中
export function applyModelEnv(envTexture) {
  for (const mat of envMats) {
    const glossy = (!mat.metalnessMap && mat.metalness > 0.5)
      || (!mat.roughnessMap && mat.roughness < 0.25);
    if (!glossy) continue;
    mat.envMap = envTexture;
    mat.envMapIntensity = 1;
    mat.needsUpdate = true;
  }
}