import * as THREE from 'three';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { setSkyTexture } from '../textures.js';

export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
// 吊顶与墙顶齐平，PCF 在该交界处会出现规律锯齿状半影；
// VSM 用方差估计软边，贴齐的投影边界不再走样
renderer.shadowMap.type = THREE.VSMShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.62;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('app').appendChild(renderer.domElement);

export const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xe4edf2, 26, 80);

export const camera = new THREE.PerspectiveCamera(66, window.innerWidth / window.innerHeight, 0.05, 220);

// 真实晴天 HDRI：Poly Haven / Kloofendal 48d Partly Cloudy (Pure Sky), CC0
const pmrem = new THREE.PMREMGenerator(renderer);
pmrem.compileEquirectangularShader();
const hdri = await new RGBELoader().loadAsync(
  `${import.meta.env.BASE_URL}hdri/kloofendal_48d_partly_cloudy_puresky_1k.hdr`,
);
export const envTexture = pmrem.fromEquirectangular(hdri).texture;
scene.environment = envTexture;
// 全局环境光只留弱补光，窗边亮度交给窗洞面光，避免整屋均匀发亮
scene.environmentIntensity = 0.2;
pmrem.dispose();

hdri.mapping = THREE.EquirectangularReflectionMapping;
setSkyTexture(hdri);