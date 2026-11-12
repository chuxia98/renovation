import { ROOMS } from '../plan.js';
import { t } from '../i18n.js';
import {
  updateRoom, getRoomStyle, getFloorLay, setFloorLay, getNicheWall, setNicheWall,
  getGlobalFloor, setGlobalFloor, FLOOR_SIZES, FLOOR_SWATCHES, WALL_SWATCHES,
} from '../style.js';
import { FLOOR_DEFAULTS } from '../textures.js';
import { syncPanelOverlay } from './panelOverlay.js';

const stylePanel = document.getElementById('style-panel');
const schemePanel = document.getElementById('scheme-panel');
const styleRoomEl = document.getElementById('style-room');
const floorHeadEl = document.getElementById('style-floor-head');
const floorKindEl = document.getElementById('style-floor-kind');
const floorSwatchesEl = document.getElementById('style-floor-swatches');
const floorColorEl = document.getElementById('style-floor-color');
const floorSizeEl = document.getElementById('style-floor-size');
const wallFinishEl = document.getElementById('style-wall-finish');
const wallSwatchesEl = document.getElementById('style-wall-swatches');
const wallColorEl = document.getElementById('style-wall-color');
const balconyModeEl = document.getElementById('style-balcony-mode');
const balconyDoorEl = document.getElementById('style-balcony-door');
const balconyRowEl = document.getElementById('style-balcony-row');
const nicheModeEl = document.getElementById('style-niche-mode');
const nicheHeightEl = document.getElementById('style-niche-height');
const nicheHeightRow = document.getElementById('style-niche-height-row');
const nicheHeightVal = document.getElementById('style-niche-height-val');
const floorLayEl = document.getElementById('style-floor-lay');
const layXEl = document.getElementById('style-lay-offset-x');
const layXRow = document.getElementById('style-lay-offset-x-row');
const layXVal = document.getElementById('style-lay-offset-x-val');
const layZEl = document.getElementById('style-lay-offset-z');
const layZRow = document.getElementById('style-lay-offset-z-row');
const layZVal = document.getElementById('style-lay-offset-z-val');

let styleRoom = ROOMS[0].id;

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

function renderFloorSizes(kind, conf) {
  floorSizeEl.textContent = '';
  for (const f of FLOOR_SIZES[kind]) {
    const opt = document.createElement('option');
    if (kind === 'wood') {
      opt.value = String(f);
      opt.textContent = t('style.plankSize', { cm: Math.round(f * 100) });
    } else {
      opt.value = `${f.w}x${f.d}`;
      opt.textContent = `${Math.round(f.w * 100)}×${Math.round(f.d * 100)} cm`;
    }
    floorSizeEl.appendChild(opt);
  }
  floorSizeEl.value = kind === 'wood' ? String(conf.size) : `${conf.w}x${conf.d}`;
}

function renderFloorLay() {
  const lay = getFloorLay();
  for (const btn of floorLayEl.children) btn.classList.toggle('active', btn.dataset.lay === lay.mode);
  const continuous = lay.mode === 'continuous';
  layXRow.classList.toggle('hidden', !continuous);
  layZRow.classList.toggle('hidden', !continuous);
  layXEl.value = String(lay.offsetX);
  layZEl.value = String(lay.offsetZ);
  layXVal.textContent = `${lay.offsetX.toFixed(2)} m`;
  layZVal.textContent = `${lay.offsetZ.toFixed(2)} m`;
}

// 通铺时地板是整屋单一配置；分房时才落到当前房间
function floorConf() {
  return getFloorLay().mode === 'continuous' ? getGlobalFloor() : getRoomStyle(styleRoom).floor;
}

function applyFloorPatch(patch) {
  if (getFloorLay().mode === 'continuous') setGlobalFloor(patch);
  else updateRoom(styleRoom, { floor: patch });
}

export function renderStyleControls() {
  const conf = getRoomStyle(styleRoom);
  styleRoomEl.value = styleRoom;
  renderFloorLay();

  const continuous = getFloorLay().mode === 'continuous';
  const fconf = floorConf();
  floorHeadEl.textContent = t(continuous ? 'style.floor.global' : 'style.floor');
  for (const btn of floorKindEl.children) btn.classList.toggle('active', btn.dataset.kind === fconf.kind);
  renderSwatches(floorSwatchesEl, FLOOR_SWATCHES[fconf.kind], fconf.color, (color) => {
    applyFloorPatch({ color });
    renderStyleControls();
  });
  floorColorEl.value = fconf.color;
  renderFloorSizes(fconf.kind, fconf);

  for (const btn of wallFinishEl.children) btn.classList.toggle('active', btn.dataset.finish === conf.wall.finish);
  renderSwatches(wallSwatchesEl, WALL_SWATCHES, conf.wall.color, (color) => {
    updateRoom(styleRoom, { wall: { color } });
    renderStyleControls();
  });
  wallColorEl.value = conf.wall.color;

  const niche = getNicheWall();
  for (const btn of nicheModeEl.children) btn.classList.toggle('active', (btn.dataset.mode === 'semi') === niche.semi);
  nicheHeightRow.classList.toggle('hidden', !niche.semi);
  nicheHeightEl.value = niche.height;
  nicheHeightVal.textContent = `${niche.height.toFixed(2)} m`;

  balconyRowEl.classList.toggle('hidden', styleRoom !== 'balcony');
  if (styleRoom === 'balcony') {
    for (const btn of balconyModeEl.children) btn.classList.toggle('active', btn.dataset.mode === conf.enclosure);
    for (const btn of balconyDoorEl.children) btn.classList.toggle('active', (btn.dataset.door === 'yes') === conf.door);
  }
}

export function renderRoomOptions() {
  for (const opt of styleRoomEl.options) opt.textContent = t(`room.${opt.value}`);
}

// 拖动偏移/墙高滑杆时让弹窗半透明，便于看清背后 3D 效果；松手恢复
let previewDrag = null;
function bindDragPreview(el) {
  // 只允许当前正在拖动的滑杆关闭预览，避免上一个滑杆的 blur/change 误关
  const off = () => {
    if (previewDrag !== el) return;
    previewDrag = null;
    stylePanel.classList.remove('drag-preview');
  };
  el.addEventListener('pointerdown', () => {
    previewDrag = el;
    stylePanel.classList.add('drag-preview');
  });
  el.addEventListener('pointerup', off);
  el.addEventListener('pointercancel', off);
  el.addEventListener('change', off);
  el.addEventListener('keyup', off);
  el.addEventListener('blur', off);
}

export function initStylePanel() {
  for (const r of ROOMS) {
    const opt = document.createElement('option');
    opt.value = r.id;
    opt.textContent = t(`room.${r.id}`);
    styleRoomEl.appendChild(opt);
  }

  styleRoomEl.addEventListener('change', () => {
    styleRoom = styleRoomEl.value;
    renderStyleControls();
  });

  floorKindEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const kind = btn.dataset.kind;
    if (floorConf().kind === kind) return;
    applyFloorPatch({ kind, ...FLOOR_DEFAULTS[kind] });
    renderStyleControls();
  });

  floorColorEl.addEventListener('change', () => {
    applyFloorPatch({ color: floorColorEl.value });
    renderStyleControls();
  });

  floorSizeEl.addEventListener('change', () => {
    const kind = floorConf().kind;
    if (kind === 'wood') {
      applyFloorPatch({ size: Number(floorSizeEl.value) });
    } else {
      const [w, d] = floorSizeEl.value.split('x').map(Number);
      applyFloorPatch({ w, d });
    }
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

  balconyModeEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn || getRoomStyle('balcony').enclosure === btn.dataset.mode) return;
    updateRoom('balcony', { enclosure: btn.dataset.mode });
    renderStyleControls();
  });

  balconyDoorEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const present = btn.dataset.door === 'yes';
    if (getRoomStyle('balcony').door === present) return;
    updateRoom('balcony', { door: present });
    renderStyleControls();
  });

  nicheModeEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const semi = btn.dataset.mode === 'semi';
    if (getNicheWall().semi === semi) return;
    setNicheWall({ semi });
    renderStyleControls();
  });

  nicheHeightEl.addEventListener('input', () => {
    const v = Number(nicheHeightEl.value);
    setNicheWall({ height: v });
    nicheHeightVal.textContent = `${v.toFixed(2)} m`;
  });

  floorLayEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn || getFloorLay().mode === btn.dataset.lay) return;
    setFloorLay({ mode: btn.dataset.lay });
    // 切换铺法后地板区要在整屋/分房配置间立即刷新
    renderStyleControls();
  });

  layXEl.addEventListener('input', () => {
    const v = Number(layXEl.value);
    setFloorLay({ offsetX: v });
    layXVal.textContent = `${v.toFixed(2)} m`;
  });

  layZEl.addEventListener('input', () => {
    const v = Number(layZEl.value);
    setFloorLay({ offsetZ: v });
    layZVal.textContent = `${v.toFixed(2)} m`;
  });

  for (const el of [layXEl, layZEl, nicheHeightEl]) bindDragPreview(el);
  window.addEventListener('pointerup', () => {
    previewDrag = null;
    stylePanel.classList.remove('drag-preview');
  });

  document.getElementById('btn-style').addEventListener('click', () => {
    stylePanel.classList.toggle('hidden');
    if (!stylePanel.classList.contains('hidden')) {
      schemePanel.classList.add('hidden');
      renderStyleControls();
    }
    syncPanelOverlay();
  });

  renderStyleControls();
}