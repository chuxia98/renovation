import * as THREE from 'three';
import { buildApartment } from './build.js';
import { PlayerControls } from './player.js';
import { applyFurnitureTextures, applyGlossyEnv } from './furniture.js';
import { START } from './plan.js';
import { createMinimap, createRadar } from './minimap.js';
import { t, applyStatic, initLang, onLangChange } from './i18n.js';
import { bindApartment } from './style.js';
import { loadPbr } from './pbr.js';
import { renderer, scene, camera, envTexture } from './core/scene.js';
import { createDayNight } from './core/dayNight.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/addons/shaders/FXAAShader.js';
import { placements, loadLayout, clearFurniture, bindColliders } from './core/furnitureState.js';
import { toast } from './ui/toast.js';
import { syncPanelOverlay } from './ui/panelOverlay.js';
import { initSchemes, renderSchemes } from './ui/schemes.js';
import { initStylePanel, renderStyleControls, renderRoomOptions } from './ui/stylePanel.js';
import { initSettings, renderLangSelect } from './ui/settings.js';
import { initTouchControls } from './ui/touchControls.js';
import { initPicker, isPicking, pickAt, exitPicker, togglePicker } from './ui/picker.js';
import {
  initBuildMode, isActive, toggleBuild, enterBuild, exitBuild, escapeBuild,
  rotateGhost, deleteTarget, removeUnderPointer, handleTap, pointerMove,
  renderVariantBar, renderCatalogLabels,
} from './ui/buildMode.js';

const isTouch = window.matchMedia?.('(pointer: coarse)').matches ?? false;

await loadPbr();
applyFurnitureTextures();

const {
  colliders, floorMeshes, wallMeshes, interactions, balcony, balconyDoor, nicheWall, updateInteractions,
  glossyMaterials, daylightLights, lights,
} = buildApartment(scene, envTexture);
applyGlossyEnv(envTexture);
bindApartment({ floorMeshes, wallMeshes, balcony, balconyDoor, nicheWall });
bindColliders(colliders);
const interactionRoots = interactions.flatMap((it) => it.roots);

// ---------- 日夜交替 ----------

const dayNight = createDayNight({ scene, ...lights, daylightLights });

// ---------- 后处理 ----------

// 离屏 RT 需要显式 MSAA：renderer 的 antialias 只作用于默认帧缓冲，
// 后处理链路下墙面/吊顶交界的斜线会被放大成锯齿亮带
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(1, 1, {
  type: THREE.HalfFloatType,
  samples: 4,
}));
composer.setSize(window.innerWidth, window.innerHeight);
composer.addPass(new RenderPass(scene, camera));

// 不挂 GTAO：吊顶底面与墙顶严格齐平的 90° 直角会被屏幕空间 AO 当成凹角，
// 沿墙角压出 10cm 以上的柔化暗带（直射灯光也被一并压暗），直角看起来像倒角
composer.addPass(new OutputPass());

// 离屏渲染的 MSAA 依赖驱动/浏览器支持，再补一道 FXAA 兜底：
// 墙顶与吊顶交界的斜边在低角度下会变成明显锯齿
const fxaaPass = new ShaderPass(FXAAShader);
function updateFxaaResolution() {
  const pr = renderer.getPixelRatio();
  fxaaPass.material.uniforms.resolution.value.set(
    1 / (window.innerWidth * pr),
    1 / (window.innerHeight * pr),
  );
}
updateFxaaResolution();
composer.addPass(fxaaPass);

// ---------- 第一人称控制 ----------

const controls = new PlayerControls(camera, renderer.domElement, colliders, START);
// 开发模式下暴露相机，便于按拾取报告里的机位复现视角
if (import.meta.env.DEV) window.__hourseDebug = { controls, camera, scene, composer, renderer, dayNight };

// ---------- HUD ----------

const body = document.body;
if (isTouch) body.classList.add('touch');
const overlay = document.getElementById('overlay');
const modeEl = document.getElementById('mode');
const statsEl = document.getElementById('stats');
const hintEl = document.getElementById('hint');
const barSubEl = document.querySelector('.bar-sub');
const exitBtnEl = document.getElementById('btn-exit');

initLang();

// 跨模块运行时钩子：触屏复位与模式标签由各自模块回填
const ctx = { resetJoystick: () => {}, updateModeLabel: () => {} };

controls.onLockError = () => {
  hintEl.innerHTML = t('hud.hintLock');
};

const getMapState = () => ({
  x: controls.pos.x,
  z: controls.pos.z,
  yaw: controls.yaw,
  placements,
});

const minimap = createMinimap(document.getElementById('minimap-canvas'), getMapState);
const radar = createRadar(document.getElementById('radar-canvas'), getMapState);

// ---------- 视野缩放 ----------

const FOV_MIN = 28;
const FOV_MAX = 85;
let targetFov = camera.fov;

renderer.domElement.addEventListener('wheel', (e) => {
  if (!overlay.classList.contains('gone')) return;
  e.preventDefault();
  const delta = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 100 : 1);
  targetFov = THREE.MathUtils.clamp(targetFov * Math.exp(delta * 0.0012), FOV_MIN, FOV_MAX);
}, { passive: false });

// ---------- 面板 / 设置 / 家具模式 ----------

initSchemes();
initStylePanel();
initSettings({ daylightLights, glossyMaterials, dayNight });
initBuildMode({ controls, ctx, isTouch, floorMeshes });
initPicker({ controls, onEnter: () => { if (isActive()) exitBuild(); } });
initTouchControls({ controls, isTouch, enterBuild, rotateGhost, ctx });

// ---------- 语言切换 ----------

function updateModeLabel() {
  modeEl.textContent = isActive() ? t('mode.build') : controls.locked ? t('mode.exploring') : t('mode.walkthrough');
}
ctx.updateModeLabel = updateModeLabel;

function renderLocalizedUI() {
  applyStatic();
  document.title = t('doc.title');
  renderLangSelect();
  if (isTouch) {
    hintEl.innerHTML = t('hud.hintTouch');
    barSubEl.textContent = t('build.subTouch');
    exitBtnEl.textContent = t('build.exitTouch');
  }
  renderCatalogLabels();
  renderRoomOptions();
  renderSchemes();
  renderStyleControls();
  renderVariantBar();
  updateModeLabel();
}

onLangChange(renderLocalizedUI);

// ---------- 交互 ----------

const INTERACT_REACH = 2.6;
const raycaster = new THREE.Raycaster();

function toggleInteractive(ndcX, ndcY) {
  raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);
  const hits = raycaster.intersectObjects(interactionRoots, true);
  let it = null;
  for (const h of hits) {
    if (h.distance > INTERACT_REACH) break;
    let node = h.object;
    while (node && !node.userData.interact) node = node.parent;
    const rec = node?.userData.interact;
    // 拆除的推拉门隐藏后仍会被射线命中，跳过已禁用的交互
    if (rec && rec.enabled !== false) { it = rec; break; }
  }
  if (!it) return false;
  it.toggle();
  const name = t(`interact.${it.kind}`);
  toast(t(it.open ? 'toast.opened' : 'toast.closed', { name }));
  return true;
}

document.getElementById('btn-start').addEventListener('click', () => {
  overlay.classList.add('gone');
  body.classList.add('started');
  if (isTouch) updateModeLabel();
  else controls.lock();
});

document.getElementById('btn-clear').addEventListener('click', () => {
  if (!placements.length) {
    toast(t('toast.noFurniture'));
    return;
  }
  clearFurniture();
  toast(t('toast.cleared'));
});

document.getElementById('btn-exit').addEventListener('click', exitBuild);

controls.onLockChange = (locked) => {
  body.classList.toggle('locked', locked);
  if (!locked && isActive()) return;
  updateModeLabel();
};

renderer.domElement.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  if (isActive()) removeUnderPointer(e.clientX, e.clientY);
});

// 鼠标按下即放置；触屏用点按放置、长按移除，拖动则只转视角
let tapStart = null;
let pressTimer = 0;
let pressHandled = false;

function cancelPress() {
  clearTimeout(pressTimer);
  pressTimer = 0;
}

renderer.domElement.addEventListener('pointerdown', (e) => {
  if (e.button !== 0 || tapStart) return;
  tapStart = { id: e.pointerId, x: e.clientX, y: e.clientY, at: performance.now(), moved: false };
  pressHandled = false;
  if (!isActive() || !isTouch) return;
  const press = tapStart;
  pressTimer = setTimeout(() => {
    if (tapStart !== press || press.moved) return;
    pressHandled = true;
    removeUnderPointer(press.x, press.y);
  }, 550);
});

window.addEventListener('pointerup', (e) => {
  if (!tapStart || e.pointerId !== tapStart.id) return;
  const tap = tapStart;
  tapStart = null;
  cancelPress();
  if (tap.moved || pressHandled || performance.now() - tap.at > 500) return;
  if (isPicking()) {
    pickAt(e.clientX, e.clientY);
    return;
  }
  if (isActive()) {
    handleTap(e.clientX, e.clientY);
  } else {
    const nx = controls.locked && !isTouch ? 0 : (e.clientX / window.innerWidth) * 2 - 1;
    const ny = controls.locked && !isTouch ? 0 : -(e.clientY / window.innerHeight) * 2 + 1;
    if (!toggleInteractive(nx, ny) && !controls.locked && !isTouch) controls.lock();
  }
});

window.addEventListener('pointercancel', () => {
  tapStart = null;
  cancelPress();
});

window.addEventListener('pointermove', (e) => {
  if (tapStart && e.pointerId === tapStart.id
    && Math.hypot(e.clientX - tapStart.x, e.clientY - tapStart.y) > 10) {
    tapStart.moved = true;
    cancelPress();
  }
  pointerMove(e);
});

window.addEventListener('keydown', (e) => {
  if (!overlay.classList.contains('gone')) return;
  if (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
  if (e.code === 'KeyG') {
    if (isPicking()) exitPicker();
    toggleBuild();
    return;
  }
  if (e.code === 'KeyP') {
    togglePicker();
    return;
  }
  if (e.code === 'Escape') {
    if (isPicking()) exitPicker();
    else escapeBuild();
    return;
  }
  if (!isActive()) return;
  if (e.code === 'KeyR') rotateGhost();
  if (e.code === 'Delete' || e.code === 'Backspace') deleteTarget();
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
  updateFxaaResolution();
  syncPanelOverlay();
});

// ---------- 启动 ----------

renderLocalizedUI();
loadLayout();

let last = performance.now();
let statTimer = 0;

function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;

  controls.update(dt);
  updateInteractions(dt);
  dayNight.update(dt);

  if (Math.abs(targetFov - camera.fov) > 0.01) {
    camera.fov += (targetFov - camera.fov) * Math.min(1, dt * 14);
    camera.updateProjectionMatrix();
  }

  minimap.draw();
  radar.draw();

  statTimer += dt;
  if (statTimer > 0.2) {
    statTimer = 0;
    statsEl.textContent = t('hud.stats', {
      x: controls.pos.x.toFixed(1),
      z: controls.pos.z.toFixed(1),
      n: placements.length,
    });
  }

  composer.render();
}

requestAnimationFrame(loop);