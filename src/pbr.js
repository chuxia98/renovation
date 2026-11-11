import * as THREE from 'three';

const BASE = `${import.meta.env.BASE_URL}textures/`;
const ANISO = 8;

// ambientCG 1K CC0 贴图，压到 512 以控制包体与显存
const FILES = {
  oak: ['oak-color.jpg', 'oak-normal.jpg', 'oak-rough.jpg'],
  walnut: ['walnut-color.jpg', 'walnut-normal.jpg', 'walnut-rough.jpg'],
  linen: ['linen-color.jpg', 'linen-normal.jpg', 'linen-rough.jpg'],
  marble: ['marble-color.jpg', 'marble-normal.jpg', 'marble-rough.jpg'],
  plaster: [null, 'plaster-normal.jpg', 'plaster-rough.jpg'],
};

let sets = null;
const variants = new Map();

// 木纹/织物贴图去色并归一化明度，颜色仍由材质色控制，保证换色不脏
function neutralTexture(tex) {
  const { image } = tex;
  const c = document.createElement('canvas');
  c.width = image.width;
  c.height = image.height;
  const g = c.getContext('2d');
  g.drawImage(image, 0, 0);
  const data = g.getImageData(0, 0, c.width, c.height);
  const px = data.data;
  const count = px.length / 4;
  let mean = 0;
  for (let i = 0; i < px.length; i += 4) {
    mean += (px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114) / 255;
  }
  mean /= count;
  const scale = 0.92 / Math.max(mean, 0.05);
  for (let i = 0; i < px.length; i += 4) {
    const lum = px[i] * 0.299 + px[i + 1] * 0.587 + px[i + 2] * 0.114;
    const v = Math.max(0, Math.min(255, lum * scale));
    px[i] = v;
    px[i + 1] = v;
    px[i + 2] = v;
  }
  g.putImageData(data, 0, 0);
  const out = new THREE.CanvasTexture(c);
  out.wrapS = THREE.RepeatWrapping;
  out.wrapT = THREE.RepeatWrapping;
  out.colorSpace = THREE.SRGBColorSpace;
  out.anisotropy = ANISO;
  return out;
}

const NEUTRAL = new Set(['oak', 'walnut', 'linen']);

export async function loadPbr() {
  const loader = new THREE.TextureLoader();
  const entries = await Promise.all(
    Object.entries(FILES).map(async ([id, files]) => {
      const [rawColor, normal, rough] = await Promise.all(
        files.map((f) => (f ? loader.loadAsync(BASE + f) : null)),
      );
      const color = rawColor && NEUTRAL.has(id) ? neutralTexture(rawColor) : rawColor;
      for (const [tex, srgb] of [[color, true], [normal, false], [rough, false]]) {
        if (!tex) continue;
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
        tex.anisotropy = ANISO;
      }
      return [id, { color, normal, rough }];
    }),
  );
  sets = Object.fromEntries(entries);
  return sets;
}

export function pbrSet(id) {
  return sets?.[id] ?? null;
}

// 同一套贴图在 repeat 相同时共享纹理对象，避免重复上传显存
export function pbrTextures(id, repeat = 1) {
  const set = sets?.[id];
  if (!set) return null;
  const key = `${id}|${repeat}`;
  let entry = variants.get(key);
  if (!entry) {
    const clone = (tex) => {
      if (!tex) return null;
      const t = tex.clone();
      t.repeat.set(repeat, repeat);
      t.needsUpdate = true;
      return t;
    };
    entry = { map: clone(set.color), normalMap: clone(set.normal), roughnessMap: clone(set.rough) };
    variants.set(key, entry);
  }
  return entry;
}
