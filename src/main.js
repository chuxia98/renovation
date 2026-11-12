import * as THREE from 'three';
import { buildApartment } from './build.js';
import { PlayerControls } from './player.js';
import { applyFurnitureTextures, applyGlossyEnv } from './furniture.js';
import { START } from './plan.js';
import { createMinimap, createRadar } from './minimap.js';
import { t, applyStatic, initLang, onLangChange } from './i18n.js';
import { bindApartment } from './style.js';
import { loadPbr } from './pbr.js';
import { loadModels } from './models.js';
import { renderer, scene, camera, envTexture } from './core/scene.js';
import { placements, loadLayout, clearFurniture, bindColliders } from './core/furnitureState.js';
import { toast } from './ui/toast.js';
import { syncPanelOverlay } from './ui/panelOverlay.js';
import { initSchemes, renderSchemes } from './ui/schemes.js';
import { initStylePanel, renderStyleControls, renderRoomOptions } from './ui/stylePanel.js';
import { initSettings, renderLangSelect } from './ui/settings.js';
import { initTouchControls } from './ui/touchControls.js';
import {
  initBuildMode, isActive, toggleBuild, enterBuild, exitBuild, escapeBuild,
  rotateGhost, deleteTarget, removeUnderPointer, handleTap, pointerMove,
  renderVariantBar, renderCatalogLabels,
} from './ui/buildMode.js';

const isTouch = window.matchMedia?.('(pointer: coarse)').matches ?? false;

await Promise.all([loadPbr(), loadModels()]);
applyFurnitureTextures();

const {
  colliders, floorMeshes, wallMeshes, interactions, balcony, balconyDoor, nicheWall, updateInteractions,
  glossyMaterials, daylightLights,
} = buildApartment(scene, envTexture);
applyGlossyEnv(envTexture);
bindApartment({ floorMeshes, wallMeshes, balcony, balconyDoor, nicheWall });
bindColliders(colliders);
const interactionRoots = interactions.flatMap((it) => it.roots);

// ---------- 第一人称控制 ----------

const controls = new PlayerControls(camera, renderer.domElement, colliders, START);

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
initSettings({ daylightLights, glossyMaterials });
initBuildMode({ controls, ctx, isTouch, floorMeshes });
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
  const name = t(it.kind === 'door' ? 'interact.door' : 'interact.slider');
  toast(t(it.open ? 'toast.opened' : 'toast.closed', { name }));
  return true;
}

document.getElementById('btn-start').addEventListener('click', () => {
  overlay.classList.add('gone');
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
    toggleBuild();
    return;
  }
  if (e.code === 'Escape') {
    escapeBuild();
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

  renderer.render(scene, camera);
}

requestAnimationFrame(loop);