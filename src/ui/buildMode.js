import * as THREE from 'three';
import { t } from '../i18n.js';
import {
  CATALOG, catalogItem, catalogVariants, furnitureVariant, createFurniture, applyGhostMaterial,
} from '../furniture.js';
import {
  furnitureGroup, placements, checkPlacement, addFurniture, saveLayout,
} from '../core/furnitureState.js';
import { scene, camera } from '../core/scene.js';
import { toast } from './toast.js';
import { syncPanelOverlay } from './panelOverlay.js';

const body = document.body;
const buildbar = document.getElementById('buildbar');
const catalogEl = document.getElementById('catalog');
const variantBarEl = document.getElementById('variant-bar');
const variantTitleEl = document.getElementById('variant-title');
const variantOptionsEl = document.getElementById('variant-options');
const variantDoneEl = document.getElementById('variant-done');
const variantDeleteEl = document.getElementById('variant-delete');
const modeEl = document.getElementById('mode');
const schemePanel = document.getElementById('scheme-panel');
const stylePanel = document.getElementById('style-panel');

let controlsRef = null;
let ctxRef = null;
let touchMode = false;

let buildMode = false;
let ghost = null;
let ghostType = null;
let ghostVariant = null;
let ghostRot = 0;
let ghostValid = false;
let editing = null;
const pointer = new THREE.Vector2(0, -0.35);
const raycaster = new THREE.Raycaster();

// 选中指示环：点选家具时贴地显示，标明选中/删除目标
const selectRing = new THREE.Mesh(
  new THREE.RingGeometry(0.9, 1, 48),
  new THREE.MeshBasicMaterial({ color: 0xe0a96d, transparent: true, opacity: 0.9, side: THREE.DoubleSide, depthWrite: false }),
);
selectRing.rotation.x = -Math.PI / 2;
selectRing.visible = false;

function showSelectRing(group) {
  const bb = new THREE.Box3().setFromObject(group);
  const size = bb.getSize(new THREE.Vector3());
  const center = bb.getCenter(new THREE.Vector3());
  selectRing.scale.setScalar(Math.max(size.x, size.z) * 0.5 + 0.1);
  selectRing.position.set(center.x, 0.02, center.z);
  selectRing.visible = true;
}

function hideSelectRing() {
  selectRing.visible = false;
}

export function itemName(id) {
  return t(`catalog.${id}`);
}

function catalogLabel(item) {
  return `${itemName(item.id)}<span class="cat-size">${item.w.toFixed(2)} × ${item.d.toFixed(2)} m</span>`;
}

export function renderCatalogLabels() {
  for (const btn of catalogEl.children) {
    const item = catalogItem(btn.dataset.id);
    if (item) btn.innerHTML = catalogLabel(item);
  }
}

function selectType(id) {
  editing = null;
  hideSelectRing();
  ghostType = id;
  ghostVariant = null;
  ghostRot = 0;
  setActiveCatalog(id);
  rebuildGhost();
  renderVariantBar();
  updateGhost();
}

function setActiveCatalog(id) {
  for (const btn of catalogEl.children) btn.classList.toggle('active', btn.dataset.id === id);
}

function activeGhostVariant(item) {
  const variants = catalogVariants(item);
  return variants.find((v) => v.id === ghostVariant)?.id ?? variants[0].id;
}

export function renderVariantBar() {
  const target = editing ? editing.t : ghostType;
  const item = target ? catalogItem(target) : null;
  const variants = item ? catalogVariants(item) : [];
  if (!editing && variants.length < 2) {
    variantBarEl.classList.add('hidden');
    return;
  }
  const active = editing ? editing.v : activeGhostVariant(item);
  variantBarEl.classList.remove('hidden');
  const titleKey = editing && variants.length < 2 ? 'build.selected' : 'build.variantTitle';
  variantTitleEl.textContent = `${itemName(item.id)} · ${t(titleKey)}`;
  variantOptionsEl.textContent = '';
  if (variants.length >= 2) {
    for (const v of variants) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'variant-item';
      btn.classList.toggle('active', v.id === active);
      btn.textContent = t(`variant.${item.id}.${v.id}`);
      btn.addEventListener('click', () => chooseVariant(v.id));
      variantOptionsEl.appendChild(btn);
    }
  }
  variantDoneEl.classList.toggle('hidden', !editing);
  variantDeleteEl.classList.toggle('hidden', !editing);
}

function chooseVariant(variantId) {
  const target = editing ? editing.t : ghostType;
  if (!target) return;
  const variant = furnitureVariant(target, variantId);
  if (!variant) return;
  if (editing) {
    const group = createFurniture(editing.t, variant.id);
    group.position.copy(editing.group.position);
    group.rotation.copy(editing.group.rotation);
    furnitureGroup.remove(editing.group);
    furnitureGroup.add(group);
    editing.group = group;
    editing.v = variant.id;
    showSelectRing(group);
    saveLayout();
    renderVariantBar();
    return;
  }
  ghostVariant = variant.id;
  rebuildGhost();
  renderVariantBar();
  updateGhost();
}

function openVariantEditor(entry) {
  const item = catalogItem(entry.t);
  if (!item) return false;
  editing = entry;
  setActiveCatalog(entry.t);
  if (ghost) ghost.visible = false;
  showSelectRing(entry.group);
  renderVariantBar();
  return true;
}

function finishEditing() {
  if (!editing) return;
  ghostType = editing.t;
  ghostVariant = editing.v;
  ghostRot = Math.round(editing.r);
  editing = null;
  hideSelectRing();
  setActiveCatalog(ghostType);
  rebuildGhost();
  renderVariantBar();
  updateGhost();
}

function placementUnderPointer(clientX, clientY) {
  const ndc = new THREE.Vector2(
    (clientX / window.innerWidth) * 2 - 1,
    -(clientY / window.innerHeight) * 2 + 1,
  );
  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObjects(furnitureGroup.children, true);
  if (!hits.length) return null;
  let obj = hits[0].object;
  while (obj.parent && obj.parent !== furnitureGroup) obj = obj.parent;
  return placements.find((p) => p.group === obj) ?? null;
}

function rebuildGhost() {
  if (ghost) {
    scene.remove(ghost);
    ghost = null;
  }
  if (!ghostType) return;
  ghost = createFurniture(ghostType, ghostVariant);
  ghost.position.y = 0.005;
  applyGhostMaterial(ghost, true);
  scene.add(ghost);
  ghostValid = true;
}

function updateGhost() {
  if (!buildMode || !ghost || editing) return;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(floorMeshesRef, false);
  if (!hits.length) {
    ghost.visible = false;
    ghostValid = false;
    return;
  }
  const p = hits[0].point;
  const x = Math.round(p.x / 0.05) * 0.05;
  const z = Math.round(p.z / 0.05) * 0.05;
  ghost.visible = true;
  ghost.position.set(x, 0.005, z);
  ghost.rotation.y = THREE.MathUtils.degToRad(ghostRot);

  const valid = checkPlacement(ghostType, x, z, ghostRot, ghostVariant);
  if (valid !== ghostValid) {
    ghostValid = valid;
    applyGhostMaterial(ghost, valid);
  }
}

let floorMeshesRef = [];

export function enterBuild() {
  if (buildMode) return;
  buildMode = true;
  controlsRef.enabled = true;
  controlsRef.lookOnly = true;
  controlsRef.unlock();
  ctxRef.resetJoystick();
  body.classList.add('build');
  buildbar.classList.remove('hidden');
  modeEl.classList.add('build');
  ctxRef.updateModeLabel();
  renderVariantBar();
  if (ghostType) {
    if (!ghost) rebuildGhost();
    pointer.set(0, -0.35);
    updateGhost();
  }
}

export function exitBuild() {
  buildMode = false;
  editing = null;
  hideSelectRing();
  controlsRef.enabled = true;
  controlsRef.lookOnly = false;
  body.classList.remove('build');
  buildbar.classList.add('hidden');
  buildbar.classList.remove('subpanel');
  schemePanel.classList.add('hidden');
  stylePanel.classList.add('hidden');
  syncPanelOverlay();
  modeEl.classList.remove('build');
  ctxRef.updateModeLabel();
  renderVariantBar();
  if (ghost) {
    scene.remove(ghost);
    ghost = null;
  }
}

export function toggleBuild() {
  if (buildMode) exitBuild();
  else enterBuild();
}

export function isActive() {
  return buildMode;
}

function placeGhost() {
  if (!ghost || !ghost.visible) return;
  if (!ghostValid) {
    toast(t('toast.noFit'), true);
    return;
  }
  const x = +ghost.position.x.toFixed(3);
  const z = +ghost.position.z.toFixed(3);
  const r = Math.round(ghostRot);
  addFurniture(ghostType, x, z, r, true, ghostVariant);
  toast(t('toast.placed', { name: itemName(ghostType), n: placements.length }));
  updateGhost();
  // 触屏没有悬停指针，放置后隐藏预览，避免盖住刚放下的家具
  if (touchMode) ghost.visible = false;
}

function removePlacement(entry) {
  const idx = placements.indexOf(entry);
  if (idx < 0) return;
  placements.splice(idx, 1);
  furnitureGroup.remove(entry.group);
  if (editing === entry) {
    editing = null;
    hideSelectRing();
    renderVariantBar();
  }
  saveLayout();
  toast(t('toast.removed', { name: itemName(entry.t) }));
}

export function removeUnderPointer(clientX, clientY) {
  const hit = placementUnderPointer(clientX, clientY);
  if (hit) removePlacement(hit);
}

export function deleteTarget() {
  const target = editing ?? placements[placements.length - 1];
  if (target) removePlacement(target);
}

export function rotateGhost() {
  ghostRot = (ghostRot + 15) % 360;
  updateGhost();
}

export function escapeBuild() {
  if (editing) finishEditing();
  else if (buildMode) exitBuild();
}

// 点按：选中家具进编辑条；否则落预览/放置
export function handleTap(clientX, clientY) {
  const hit = placementUnderPointer(clientX, clientY);
  if (hit && openVariantEditor(hit)) return;
  if (editing) {
    finishEditing();
    return;
  }
  pointer.set(
    (clientX / window.innerWidth) * 2 - 1,
    -(clientY / window.innerHeight) * 2 + 1,
  );
  updateGhost();
  if (!ghostType) toast(t('toast.pickItem'));
  else if (!ghost || !ghost.visible) toast(t('toast.tapFloor'));
  else placeGhost();
}

export function pointerMove(e) {
  if (!buildMode || e.pointerType !== 'mouse') return;
  pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  updateGhost();
}

export function initBuildMode({ controls, ctx, isTouch, floorMeshes }) {
  controlsRef = controls;
  ctxRef = ctx;
  touchMode = isTouch;
  floorMeshesRef = floorMeshes;
  scene.add(furnitureGroup);
  scene.add(selectRing);

  for (const item of CATALOG) {
    const btn = document.createElement('button');
    btn.className = 'cat-item';
    btn.dataset.id = item.id;
    btn.innerHTML = catalogLabel(item);
    btn.addEventListener('click', () => selectType(item.id));
    catalogEl.appendChild(btn);
  }

  variantDoneEl.addEventListener('click', finishEditing);
  variantDeleteEl.addEventListener('click', () => {
    if (editing) removePlacement(editing);
  });
}