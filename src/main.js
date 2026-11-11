import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { buildApartment } from './build.js';
import { PlayerControls } from './player.js';
import { CATALOG, catalogItem, createFurniture, applyGhostMaterial } from './furniture.js';
import { START, FLOORS, ROOMS, mx, mz } from './plan.js';
import { createMinimap, createRadar } from './minimap.js';
import { t, getLang, setLang, applyStatic, initLang, onLangChange } from './i18n.js';
import {
  bindApartment, updateRoom, getRoomStyle, getStyleSnapshot, setStyleSnapshot,
  FLOOR_SIZES, FLOOR_SWATCHES, WALL_SWATCHES,
} from './style.js';
import { FLOOR_DEFAULTS } from './textures.js';

const STORE_KEY = 'hourse-layout-v1';
const SCHEMES_KEY = 'hourse-layout-schemes-v1';
const isTouch = window.matchMedia?.('(pointer: coarse)').matches ?? false;

// ---------- 渲染器 / 场景 ----------

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.86;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('app').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xe4edf2, 26, 80);

const camera = new THREE.PerspectiveCamera(66, window.innerWidth / window.innerHeight, 0.05, 220);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.32;
pmrem.dispose();

const { colliders, floorMeshes, wallMeshes } = buildApartment(scene);
bindApartment({ floorMeshes, wallMeshes });

// ---------- 家具 ----------

const furnitureGroup = new THREE.Group();
furnitureGroup.name = 'furniture';
scene.add(furnitureGroup);

const placements = [];

const floorRects = FLOORS.map((f) => ({
  minX: mx(f.x1), maxX: mx(f.x2), minZ: mz(f.z1), maxZ: mz(f.z2),
}));

function insideFloor(x, z) {
  for (const r of floorRects) {
    if (x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ) return true;
  }
  return false;
}

function insideWall(x, z) {
  for (const c of colliders) {
    if (x >= c.minX && x <= c.maxX && z >= c.minZ && z <= c.maxZ) return true;
  }
  return false;
}

function obbHit(ax, az, arot, aw, ad, bx, bz, brot, bw, bd) {
  const ra = THREE.MathUtils.degToRad(arot);
  const rb = THREE.MathUtils.degToRad(brot);
  const uax = { x: Math.cos(ra), z: -Math.sin(ra) };
  const uaz = { x: Math.sin(ra), z: Math.cos(ra) };
  const ubx = { x: Math.cos(rb), z: -Math.sin(rb) };
  const ubz = { x: Math.sin(rb), z: Math.cos(rb) };
  const dx = bx - ax;
  const dz = bz - az;

  for (const axis of [uax, uaz, ubx, ubz]) {
    const dist = Math.abs(dx * axis.x + dz * axis.z);
    const ea = Math.abs((aw / 2) * (uax.x * axis.x + uax.z * axis.z)) + Math.abs((ad / 2) * (uaz.x * axis.x + uaz.z * axis.z));
    const eb = Math.abs((bw / 2) * (ubx.x * axis.x + ubx.z * axis.z)) + Math.abs((bd / 2) * (ubz.x * axis.x + ubz.z * axis.z));
    if (dist >= ea + eb + 0.02) return false;
  }
  return true;
}

function checkPlacement(type, x, z, rot) {
  const item = catalogItem(type);
  const r = THREE.MathUtils.degToRad(rot);
  const c = Math.cos(r);
  const s = Math.sin(r);
  const hw = item.w / 2;
  const hd = item.d / 2;
  const local = [
    [0, 0],
    [-hw, -hd], [hw, -hd], [-hw, hd], [hw, hd],
  ];
  for (const [lx, lz] of local) {
    const wx = x + lx * c + lz * s;
    const wz = z - lx * s + lz * c;
    if (!insideFloor(wx, wz)) return false;
    if (insideWall(wx, wz)) return false;
  }

  if (!item.flat) {
    for (const p of placements) {
      const other = catalogItem(p.t);
      if (other.flat) continue;
      if (obbHit(x, z, rot, item.w, item.d, p.x, p.z, p.r, other.w, other.d)) return false;
    }
  }
  return true;
}

function addFurniture(type, x, z, rot, save = true) {
  const group = createFurniture(type);
  if (!group) return null;
  group.position.set(x, 0, z);
  group.rotation.y = THREE.MathUtils.degToRad(rot);
  furnitureGroup.add(group);
  const entry = { t: type, x, z, r: rot, group };
  placements.push(entry);
  if (save) saveLayout();
  return group;
}

function snapshot() {
  return placements.map((p) => ({
    t: p.t, x: +p.x.toFixed(3), z: +p.z.toFixed(3), r: Math.round(p.r),
  }));
}

function saveLayout() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(snapshot()));
  } catch {
    /* localStorage 不可用时静默跳过 */
  }
}

function applyLayout(data) {
  for (const p of placements) furnitureGroup.remove(p.group);
  placements.length = 0;
  for (const p of data) {
    if (!catalogItem(p.t)) continue;
    addFurniture(p.t, p.x, p.z, p.r, false);
  }
}

function loadLayout() {
  let data = [];
  try {
    const raw = localStorage.getItem(STORE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (Array.isArray(parsed)) data = parsed;
  } catch {
    data = [];
  }
  applyLayout(data);
}

function clearFurniture() {
  applyLayout([]);
  saveLayout();
}

// ---------- 第一人称控制 ----------

const controls = new PlayerControls(camera, renderer.domElement, colliders, START);

// ---------- UI ----------

const body = document.body;
if (isTouch) body.classList.add('touch');
const overlay = document.getElementById('overlay');
const buildbar = document.getElementById('buildbar');
const catalogEl = document.getElementById('catalog');
const modeEl = document.getElementById('mode');
const statsEl = document.getElementById('stats');
const toastEl = document.getElementById('toast');
const hintEl = document.getElementById('hint');
const schemePanel = document.getElementById('scheme-panel');
const schemeNameEl = document.getElementById('scheme-name');
const schemeListEl = document.getElementById('scheme-list');
const settingsBtn = document.getElementById('btn-settings');
const settingsPanel = document.getElementById('settings-panel');
const langSelect = document.getElementById('lang-select');
const barSubEl = document.querySelector('.bar-sub');
const exitBtnEl = document.getElementById('btn-exit');
const joystickEl = document.getElementById('joystick');
const joystickKnob = document.getElementById('joystick-knob');
const buildFab = document.getElementById('build-fab');

initLang();

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

let toastTimer = 0;

function toast(msg, warn = false) {
  toastEl.textContent = msg;
  toastEl.classList.remove('hidden');
  toastEl.classList.toggle('warn', warn);
  requestAnimationFrame(() => toastEl.classList.add('show'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toastEl.classList.remove('show');
    setTimeout(() => toastEl.classList.add('hidden'), 220);
  }, 1800);
}

function itemName(id) {
  return t(`catalog.${id}`);
}

function catalogLabel(item) {
  return `${itemName(item.id)}<span class="cat-size">${item.w.toFixed(2)} × ${item.d.toFixed(2)} m</span>`;
}

for (const item of CATALOG) {
  const btn = document.createElement('button');
  btn.className = 'cat-item';
  btn.dataset.id = item.id;
  btn.innerHTML = catalogLabel(item);
  btn.addEventListener('click', () => selectType(item.id));
  catalogEl.appendChild(btn);
}

// ---------- 布局方案 ----------

function readSchemes() {
  try {
    const parsed = JSON.parse(localStorage.getItem(SCHEMES_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSchemes(list) {
  try {
    localStorage.setItem(SCHEMES_KEY, JSON.stringify(list));
  } catch {
    /* localStorage 不可用时静默跳过 */
  }
}

// 旧版本只有一份自动保存的布局：升级时收为「原布置」方案，场景默认改为空
function migrateLegacyLayout() {
  try {
    if (localStorage.getItem(SCHEMES_KEY) !== null) return;
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (!Array.isArray(data) || !data.length) return;
    const items = data.filter((p) => catalogItem(p.t));
    if (!items.length) return;
    const at = Date.now();
    writeSchemes([{ id: at, name: t('scheme.original'), at, items }]);
    localStorage.removeItem(STORE_KEY);
  } catch {
    /* 数据损坏时按空场景启动 */
  }
}

migrateLegacyLayout();
let schemes = readSchemes();

function formatStamp(at) {
  const d = new Date(at);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function renderSchemes() {
  schemeListEl.textContent = '';
  if (!schemes.length) {
    const empty = document.createElement('div');
    empty.className = 'scheme-empty';
    empty.textContent = t('scheme.empty');
    schemeListEl.appendChild(empty);
    return;
  }
  for (const s of schemes.slice().sort((a, b) => b.at - a.at)) {
    const row = document.createElement('div');
    row.className = 'scheme-item';

    const info = document.createElement('div');
    info.className = 'scheme-info';
    const name = document.createElement('div');
    name.className = 'scheme-name';
    name.textContent = s.name;
    const meta = document.createElement('div');
    meta.className = 'scheme-meta';
    meta.textContent = t('scheme.meta', { n: s.items.length, at: formatStamp(s.at) });
    info.append(name, meta);

    const loadBtn = document.createElement('button');
    loadBtn.type = 'button';
    loadBtn.textContent = t('scheme.load');
    loadBtn.addEventListener('click', () => loadScheme(s.id));

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.textContent = t('scheme.delete');
    delBtn.addEventListener('click', () => deleteScheme(s.id));

    row.append(info, loadBtn, delBtn);
    schemeListEl.appendChild(row);
  }
}

function saveScheme() {
  let name = schemeNameEl.value.trim();
  if (!name) {
    let n = 1;
    while (schemes.some((s) => s.name === t('scheme.defaultName', { n }))) n += 1;
    name = t('scheme.defaultName', { n });
  }
  const items = snapshot();
  const styleSnap = getStyleSnapshot();
  const existing = schemes.find((s) => s.name === name);
  if (existing) {
    existing.items = items;
    existing.style = styleSnap;
    existing.at = Date.now();
    toast(t('toast.updatedScheme', { name, n: items.length }));
  } else {
    const at = Date.now();
    schemes.push({ id: at, name, at, items, style: styleSnap });
    toast(t('toast.savedScheme', { name, n: items.length }));
  }
  writeSchemes(schemes);
  schemeNameEl.value = '';
  renderSchemes();
}

function loadScheme(id) {
  const scheme = schemes.find((s) => s.id === id);
  if (!scheme) return;
  applyLayout(scheme.items);
  if (scheme.style) {
    setStyleSnapshot(scheme.style);
    renderStyleControls();
  }
  saveLayout();
  schemePanel.classList.add('hidden');
  toast(t('toast.loadedScheme', { name: scheme.name, n: placements.length }));
}

function deleteScheme(id) {
  const idx = schemes.findIndex((s) => s.id === id);
  if (idx < 0) return;
  if (!window.confirm(t('scheme.confirmDelete', { name: schemes[idx].name }))) return;
  const [removed] = schemes.splice(idx, 1);
  writeSchemes(schemes);
  renderSchemes();
  toast(t('toast.deletedScheme', { name: removed.name }));
}

renderSchemes();

document.getElementById('btn-schemes').addEventListener('click', () => {
  schemePanel.classList.toggle('hidden');
  if (!schemePanel.classList.contains('hidden')) {
    stylePanel.classList.add('hidden');
    schemeNameEl.focus();
  }
});

document.getElementById('btn-save-scheme').addEventListener('click', saveScheme);

schemeNameEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') saveScheme();
});

// ---------- 房间样式 ----------

const stylePanel = document.getElementById('style-panel');
const styleRoomEl = document.getElementById('style-room');
const floorKindEl = document.getElementById('style-floor-kind');
const floorSwatchesEl = document.getElementById('style-floor-swatches');
const floorColorEl = document.getElementById('style-floor-color');
const floorSizeEl = document.getElementById('style-floor-size');
const wallFinishEl = document.getElementById('style-wall-finish');
const wallSwatchesEl = document.getElementById('style-wall-swatches');
const wallColorEl = document.getElementById('style-wall-color');

let styleRoom = ROOMS[0].id;

for (const r of ROOMS) {
  const opt = document.createElement('option');
  opt.value = r.id;
  opt.textContent = t(`room.${r.id}`);
  styleRoomEl.appendChild(opt);
}

function renderSwatches(el, colors, active, onPick) {
  el.textContent = '';
  for (const c of colors) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'swatch';
    btn.style.background = c;
    btn.title = c;
    btn.classList.toggle('active', c.toLowerCase() === String(active).toLowerCase());
    btn.addEventListener('click', () => onPick(c));
    el.appendChild(btn);
  }
}

function renderFloorSizes(kind, size) {
  floorSizeEl.textContent = '';
  for (const v of FLOOR_SIZES[kind]) {
    const opt = document.createElement('option');
    opt.value = String(v);
    const cm = Math.round(v * 100);
    opt.textContent = kind === 'wood' ? t('style.plankSize', { cm }) : `${cm} cm`;
    floorSizeEl.appendChild(opt);
  }
  floorSizeEl.value = String(size);
}

function renderStyleControls() {
  const conf = getRoomStyle(styleRoom);
  styleRoomEl.value = styleRoom;

  for (const btn of floorKindEl.children) btn.classList.toggle('active', btn.dataset.kind === conf.floor.kind);
  renderSwatches(floorSwatchesEl, FLOOR_SWATCHES[conf.floor.kind], conf.floor.color, (color) => {
    updateRoom(styleRoom, { floor: { color } });
    renderStyleControls();
  });
  floorColorEl.value = conf.floor.color;
  renderFloorSizes(conf.floor.kind, conf.floor.size);

  for (const btn of wallFinishEl.children) btn.classList.toggle('active', btn.dataset.finish === conf.wall.finish);
  renderSwatches(wallSwatchesEl, WALL_SWATCHES, conf.wall.color, (color) => {
    updateRoom(styleRoom, { wall: { color } });
    renderStyleControls();
  });
  wallColorEl.value = conf.wall.color;
}

styleRoomEl.addEventListener('change', () => {
  styleRoom = styleRoomEl.value;
  renderStyleControls();
});

floorKindEl.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const kind = btn.dataset.kind;
  if (getRoomStyle(styleRoom).floor.kind === kind) return;
  updateRoom(styleRoom, { floor: { kind, ...FLOOR_DEFAULTS[kind] } });
  renderStyleControls();
});

floorColorEl.addEventListener('change', () => {
  updateRoom(styleRoom, { floor: { color: floorColorEl.value } });
  renderStyleControls();
});

floorSizeEl.addEventListener('change', () => {
  updateRoom(styleRoom, { floor: { size: Number(floorSizeEl.value) } });
});

wallFinishEl.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  updateRoom(styleRoom, { wall: { finish: btn.dataset.finish } });
  renderStyleControls();
});

wallColorEl.addEventListener('change', () => {
  updateRoom(styleRoom, { wall: { color: wallColorEl.value } });
  renderStyleControls();
});

document.getElementById('btn-style').addEventListener('click', () => {
  stylePanel.classList.toggle('hidden');
  if (!stylePanel.classList.contains('hidden')) {
    schemePanel.classList.add('hidden');
    renderStyleControls();
  }
});

renderStyleControls();

// ---------- 设置 ----------

settingsBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  settingsPanel.classList.toggle('hidden');
});

langSelect.addEventListener('change', () => setLang(langSelect.value));

document.addEventListener('pointerdown', (e) => {
  if (settingsPanel.classList.contains('hidden')) return;
  if (e.target.closest('#settings')) return;
  settingsPanel.classList.add('hidden');
});

window.addEventListener('keydown', (e) => {
  if (e.code !== 'Escape' || settingsPanel.classList.contains('hidden')) return;
  e.stopImmediatePropagation();
  e.preventDefault();
  settingsPanel.classList.add('hidden');
}, { capture: true });

// ---------- 触屏操作 ----------

document.getElementById('btn-rotate').addEventListener('click', () => {
  ghostRot = (ghostRot + 15) % 360;
  updateGhost();
});

let resetJoystick = () => {};

if (isTouch) {
  buildFab.classList.remove('hidden');
  buildFab.addEventListener('click', () => {
    if (!buildMode) enterBuild();
  });

  joystickEl.classList.remove('hidden');
  const JOY_RADIUS = 44;
  let joyId = null;

  const moveJoystick = (e) => {
    const rect = joystickEl.getBoundingClientRect();
    let dx = e.clientX - (rect.left + rect.width / 2);
    let dy = e.clientY - (rect.top + rect.height / 2);
    const len = Math.hypot(dx, dy);
    if (len > JOY_RADIUS) {
      dx = (dx / len) * JOY_RADIUS;
      dy = (dy / len) * JOY_RADIUS;
    }
    joystickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
    controls.setTouchInput(dx / JOY_RADIUS, -dy / JOY_RADIUS);
  };

  joystickEl.addEventListener('pointerdown', (e) => {
    if (joyId !== null) return;
    joyId = e.pointerId;
    joystickEl.setPointerCapture(e.pointerId);
    moveJoystick(e);
  });
  joystickEl.addEventListener('pointermove', (e) => {
    if (e.pointerId === joyId) moveJoystick(e);
  });
  resetJoystick = () => {
    joyId = null;
    joystickKnob.style.transform = 'translate(0, 0)';
    controls.setTouchInput(0, 0);
  };
  const endJoystick = (e) => {
    if (e.pointerId !== joyId) return;
    resetJoystick();
  };
  joystickEl.addEventListener('pointerup', endJoystick);
  joystickEl.addEventListener('pointercancel', endJoystick);
}

// ---------- 语言切换 ----------

function updateModeLabel() {
  modeEl.textContent = buildMode ? t('mode.build') : controls.locked ? t('mode.exploring') : t('mode.walkthrough');
}

function renderLocalizedUI() {
  applyStatic();
  document.title = t('doc.title');
  langSelect.value = getLang();
  if (isTouch) {
    hintEl.innerHTML = t('hud.hintTouch');
    barSubEl.textContent = t('build.subTouch');
    exitBtnEl.textContent = t('build.exitTouch');
  }
  for (const btn of catalogEl.children) {
    const item = catalogItem(btn.dataset.id);
    if (item) btn.innerHTML = catalogLabel(item);
  }
  for (const opt of styleRoomEl.options) opt.textContent = t(`room.${opt.value}`);
  renderSchemes();
  renderStyleControls();
  updateModeLabel();
}

onLangChange(renderLocalizedUI);

// ---------- 家具模式 ----------

let buildMode = false;
let ghost = null;
let ghostType = null;
let ghostRot = 0;
let ghostValid = false;
const pointer = new THREE.Vector2(0, -0.35);
const raycaster = new THREE.Raycaster();

function selectType(id) {
  ghostType = id;
  ghostRot = 0;
  setActiveCatalog(id);
  rebuildGhost();
  updateGhost();
}

function setActiveCatalog(id) {
  for (const btn of catalogEl.children) btn.classList.toggle('active', btn.dataset.id === id);
}

function rebuildGhost() {
  if (ghost) {
    scene.remove(ghost);
    ghost = null;
  }
  if (!ghostType) return;
  ghost = createFurniture(ghostType);
  ghost.position.y = 0.005;
  applyGhostMaterial(ghost, true);
  scene.add(ghost);
  ghostValid = true;
}

function updateGhost() {
  if (!buildMode || !ghost) return;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(floorMeshes, false);
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

  const valid = checkPlacement(ghostType, x, z, ghostRot);
  if (valid !== ghostValid) {
    ghostValid = valid;
    applyGhostMaterial(ghost, valid);
  }
}

function enterBuild() {
  buildMode = true;
  controls.enabled = true;
  controls.lookOnly = true;
  controls.unlock();
  resetJoystick();
  body.classList.add('build');
  buildbar.classList.remove('hidden');
  modeEl.classList.add('build');
  updateModeLabel();
  if (ghostType) {
    if (!ghost) rebuildGhost();
    pointer.set(0, -0.35);
    updateGhost();
  }
}

function exitBuild() {
  buildMode = false;
  controls.enabled = true;
  controls.lookOnly = false;
  body.classList.remove('build');
  buildbar.classList.add('hidden');
  schemePanel.classList.add('hidden');
  stylePanel.classList.add('hidden');
  modeEl.classList.remove('build');
  updateModeLabel();
  if (ghost) {
    scene.remove(ghost);
    ghost = null;
  }
}

function toggleBuild() {
  if (buildMode) exitBuild();
  else enterBuild();
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
  addFurniture(ghostType, x, z, r);
  toast(t('toast.placed', { name: itemName(ghostType), n: placements.length }));
  updateGhost();
  // 触屏没有悬停指针，放置后隐藏预览，避免盖住刚放下的家具
  if (isTouch) ghost.visible = false;
}

function removeUnderPointer(clientX, clientY) {
  const ndc = new THREE.Vector2(
    (clientX / window.innerWidth) * 2 - 1,
    -(clientY / window.innerHeight) * 2 + 1,
  );
  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObjects(furnitureGroup.children, true);
  if (!hits.length) return;
  let obj = hits[0].object;
  while (obj.parent && obj.parent !== furnitureGroup) obj = obj.parent;
  const idx = placements.findIndex((p) => p.group === obj);
  if (idx < 0) return;
  const [removed] = placements.splice(idx, 1);
  furnitureGroup.remove(removed.group);
  saveLayout();
  toast(t('toast.removed', { name: itemName(removed.t) }));
}

// ---------- 交互 ----------

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
  if (!locked && buildMode) return;
  updateModeLabel();
};

renderer.domElement.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  if (buildMode) removeUnderPointer(e.clientX, e.clientY);
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
  if (!buildMode || !isTouch) return;
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
  if (buildMode) {
    pointer.set(
      (e.clientX / window.innerWidth) * 2 - 1,
      -(e.clientY / window.innerHeight) * 2 + 1,
    );
    updateGhost();
    if (!ghostType) toast(t('toast.pickItem'));
    else if (!ghost || !ghost.visible) toast(t('toast.tapFloor'));
    else placeGhost();
  } else if (!controls.locked && !isTouch) {
    controls.lock();
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
  if (!buildMode || e.pointerType !== 'mouse') return;
  pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  updateGhost();
});

window.addEventListener('keydown', (e) => {
  if (!overlay.classList.contains('gone')) return;
  if (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
  if (e.code === 'KeyG') {
    toggleBuild();
    return;
  }
  if (e.code === 'Escape') {
    if (buildMode) exitBuild();
    return;
  }
  if (!buildMode) return;
  if (e.code === 'KeyR') {
    ghostRot = (ghostRot + 15) % 360;
    updateGhost();
  }
  if (e.code === 'Delete' || e.code === 'Backspace') {
    const last = placements.pop();
    if (last) {
      furnitureGroup.remove(last.group);
      saveLayout();
      toast(t('toast.removed', { name: itemName(last.t) }));
    }
  }
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
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
