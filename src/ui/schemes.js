import { t } from '../i18n.js';
import { catalogItem } from '../furniture.js';
import { defaultStyle, getStyleSnapshot, setStyleSnapshot } from '../style.js';
import { STORE_KEY, snapshot, applyLayout, saveLayout, placements, LAYOUT_PRESETS } from '../core/furnitureState.js';
import { toast } from './toast.js';
import { syncPanelOverlay } from './panelOverlay.js';
import { renderStyleControls } from './stylePanel.js';

const SCHEMES_KEY = 'hourse-layout-schemes-v1';

const schemePanel = document.getElementById('scheme-panel');
const schemeNameEl = document.getElementById('scheme-name');
const schemeListEl = document.getElementById('scheme-list');
const stylePanel = document.getElementById('style-panel');
const buildbar = document.getElementById('buildbar');

let schemes = [];

// 示例软装：同一套户型，用不同家具与硬装组合成当季流行风格
const BASE_ITEMS = [
  { t: 'rug', v: '', x: 7.3, z: 7.2, r: 0 },
  { t: 'sofa', v: 'corner', x: 6.5, z: 7.35, r: 90 },
  { t: 'coffee', v: 'round', x: 7.55, z: 7.2, r: 0 },
  { t: 'armchair', v: 'rattan', x: 7.45, z: 5.85, r: 0 },
  { t: 'tv', v: 'long', x: 8.85, z: 7.2, r: 270 },
  { t: 'plant', v: '', x: 8.85, z: 8.9, r: 0 },
  { t: 'lamp', v: '', x: 5.75, z: 8.75, r: 0 },
  { t: 'dining', v: 'round', x: 7.3, z: 4.35, r: 0 },
  { t: 'chair', v: 'fabric', x: 6.4, z: 4.35, r: 90 },
  { t: 'chair', v: 'fabric', x: 8.2, z: 4.35, r: 270 },
  { t: 'chair', v: 'fabric', x: 7.3, z: 3.65, r: 0 },
  { t: 'chair', v: 'fabric', x: 7.3, z: 5.05, r: 180 },
  { t: 'counter', v: '', x: 6.1, z: 0.55, r: 0 },
  { t: 'fridge', v: '', x: 7.25, z: 0.6, r: 0 },
  // 主卧：床头靠西墙，床尾朝东；衣柜移到东墙，避开南侧飘窗
  { t: 'bed', v: 'upholstered', x: 2.65, z: 9.3, r: 90 },
  { t: 'nightstand', v: 'drawer', x: 1.82, z: 8.12, r: 90 },
  { t: 'nightstand', v: 'round', x: 1.82, z: 10.48, r: 90 },
  { t: 'wardrobe', v: 'slat', x: 4.87, z: 9.3, r: 270 },
];

const swap = (type, variant, items = BASE_ITEMS) =>
  items.map((it) => (it.t === type ? { ...it, v: variant } : { ...it }));

// 硬装主题：木地板 + 墙面 + 砖石规格 + 阳台围护
function themeStyle(opt) {
  const s = defaultStyle();
  s.floorLay.mode = 'room';
  const paint = (id, color) => { s[id].wall = { finish: opt.finish ?? 'paint', color }; };
  for (const id of ['master', 'bedUpper', 'bedLower', 'living', 'entry']) {
    s[id].floor = { kind: 'wood', color: opt.wood, size: opt.woodSize ?? 0.2 };
    paint(id, opt.wall);
  }
  s.corridor.floor = { kind: 'tile', color: opt.corridor ?? '#c8c4bd', w: 0.6, d: 0.6 };
  paint('corridor', opt.wall);
  paint('porch', opt.wall);
  for (const [id, conf] of Object.entries(opt.rooms ?? {})) {
    if (conf.floor) s[id].floor = { ...s[id].floor, ...conf.floor };
    if (conf.wall) paint(id, conf.wall);
  }
  s.balcony.enclosure = opt.glass === false ? 'solid' : 'glass';
  s.balcony.door = true;
  s.sliderOpening = opt.opening ?? 0;
  s.livingIncludesBalcony = true;
  s.nicheWall = { semi: !opt.nicheFull, height: opt.nicheHeight ?? 1.3 };
  return s;
}

const STYLE_SCHEMES = [
  {
    id: 'theme-cream',
    nameKey: 'scheme.themeCream',
    items: swap('dining', 'pedestal'),
    style: themeStyle({
      wood: '#b08a62', wall: '#efeae2', finish: 'paint', woodSize: 0.18,
      rooms: {
        bath: { floor: { kind: 'tile', color: '#dfd9ce', w: 0.4, d: 0.4 }, wall: '#e9e4da' },
        kitchen: { floor: { kind: 'tile', color: '#d9cdb9', w: 0.6, d: 0.6 }, wall: '#efeae2' },
        balcony: { floor: { kind: 'tile', color: '#c8c4bd', w: 0.4, d: 0.4 }, wall: '#e9e4da' },
      },
    }),
  },
  {
    id: 'theme-japandi',
    nameKey: 'scheme.themeJapandi',
    items: swap('chair', 'rattan', swap('dining', 'oval', swap('armchair', 'shell'))),
    style: themeStyle({
      wood: '#9c7b57', wall: '#e3ddd1', finish: 'paint', woodSize: 0.15,
      rooms: {
        bath: { floor: { kind: 'tile', color: '#b8b3a8', w: 0.4, d: 0.4 }, wall: '#d8d2c6' },
        kitchen: { floor: { kind: 'tile', color: '#c8c4bd', w: 0.6, d: 0.6 }, wall: '#ddd7ca' },
        balcony: { floor: { kind: 'tile', color: '#9a9388', w: 0.4, d: 0.4 }, wall: '#d8d2c6' },
      },
    }),
  },
  {
    id: 'theme-luxe',
    nameKey: 'scheme.themeLuxe',
    items: swap('bed', 'floating', swap('wardrobe', 'glass', swap('armchair', 'lounge'))),
    style: themeStyle({
      wood: '#5f4632', wall: '#d8d2c6', finish: 'paint', woodSize: 0.2,
      rooms: {
        bath: { floor: { kind: 'tile', color: '#6f6d68', w: 0.6, d: 0.6 }, wall: '#c2bdb4' },
        kitchen: { floor: { kind: 'tile', color: '#8f8d88', w: 0.8, d: 0.8 }, wall: '#d8d2c6' },
        balcony: { floor: { kind: 'tile', color: '#8f8d88', w: 0.6, d: 0.6 }, wall: '#c2bdb4' },
        porch: { floor: { kind: 'stone', color: '#6f6a62', w: 0.8, d: 0.8 } },
      },
      opening: 0.55,
    }),
  },
  {
    id: 'theme-midcentury',
    nameKey: 'scheme.themeMidcentury',
    items: swap('chair', 'wood', swap('dining', 'oval', swap('armchair', 'lounge'))),
    style: themeStyle({
      wood: '#8c6b4b', wall: '#c3cbb8', finish: 'paint', woodSize: 0.12,
      rooms: {
        living: { wall: '#c9a693' },
        bath: { floor: { kind: 'tile', color: '#c8c4bd', w: 0.4, d: 0.4 }, wall: '#d7b8a5' },
        kitchen: { floor: { kind: 'tile', color: '#d9cdb9', w: 0.6, d: 0.6 }, wall: '#c3cbb8' },
        balcony: { floor: { kind: 'tile', color: '#c8c4bd', w: 0.4, d: 0.4 }, wall: '#a9a49b' },
      },
      glass: false,
    }),
  },
  {
    id: 'theme-italian',
    nameKey: 'scheme.themeItalian',
    items: swap('dining', 'rect', swap('coffee', 'rect', swap('chair', 'wood', swap('armchair', 'shell', swap('wardrobe', 'flat'))))),
    style: themeStyle({
      wood: '#8a6d4f', wall: '#f5f0e6', finish: 'paint', woodSize: 0.2,
      rooms: {
        bath: { floor: { kind: 'stone', color: '#a9a49b', w: 0.8, d: 0.8 }, wall: '#e7e1d6' },
        kitchen: { floor: { kind: 'tile', color: '#a9a49b', w: 0.8, d: 0.8 }, wall: '#f5f0e6' },
        balcony: { floor: { kind: 'stone', color: '#8f8a82', w: 0.8, d: 0.8 }, wall: '#e7e1d6' },
        porch: { floor: { kind: 'stone', color: '#8f8a82', w: 0.8, d: 0.8 } },
      },
    }),
  },
];

const BUILTINS = [
  { id: 'preset-empty', nameKey: 'scheme.presetEmpty', items: LAYOUT_PRESETS.empty },
  { id: 'preset-sanitary', nameKey: 'scheme.presetSanitary', items: LAYOUT_PRESETS.sanitary },
  ...STYLE_SCHEMES.map((s) => ({ ...s, kind: 'style' })),
];

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

function formatStamp(at) {
  const d = new Date(at);
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function schemeRow(s, builtin) {
  const row = document.createElement('div');
  row.className = 'scheme-item';

  const info = document.createElement('div');
  info.className = 'scheme-info';
  const name = document.createElement('div');
  name.className = 'scheme-name';
  name.textContent = builtin ? t(s.nameKey) : s.name;
  const meta = document.createElement('div');
  meta.className = 'scheme-meta';
  meta.textContent = builtin
    ? t(s.kind === 'style' ? 'scheme.styleMeta' : 'scheme.builtinMeta', { n: s.items.length })
    : t('scheme.meta', { n: s.items.length, at: formatStamp(s.at) });
  info.append(name, meta);

  const loadBtn = document.createElement('button');
  loadBtn.type = 'button';
  loadBtn.textContent = t('scheme.load');
  loadBtn.addEventListener('click', () => loadScheme(s.id));
  row.append(info, loadBtn);

  if (!builtin) {
    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.textContent = t('scheme.delete');
    delBtn.addEventListener('click', () => deleteScheme(s.id));
    row.append(delBtn);
  }
  return row;
}

export function renderSchemes() {
  schemeListEl.textContent = '';
  for (const s of BUILTINS) schemeListEl.appendChild(schemeRow(s, true));
  if (!schemes.length) {
    const empty = document.createElement('div');
    empty.className = 'scheme-empty';
    empty.textContent = t('scheme.empty');
    schemeListEl.appendChild(empty);
    return;
  }
  for (const s of schemes.slice().sort((a, b) => b.at - a.at)) {
    schemeListEl.appendChild(schemeRow(s, false));
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
  const scheme = BUILTINS.find((s) => s.id === id) || schemes.find((s) => s.id === id);
  if (!scheme) return;
  applyLayout(scheme.items);
  if (scheme.style) {
    setStyleSnapshot(scheme.style);
    renderStyleControls();
  }
  saveLayout();
  schemePanel.classList.add('hidden');
  buildbar.classList.remove('subpanel');
  toast(t('toast.loadedScheme', { name: scheme.nameKey ? t(scheme.nameKey) : scheme.name, n: placements.length }));
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

function closeSchemePanel() {
  schemePanel.classList.add('hidden');
  buildbar.classList.remove('subpanel');
}

export function initSchemes() {
  migrateLegacyLayout();
  schemes = readSchemes();
  renderSchemes();

  document.getElementById('btn-schemes').addEventListener('click', () => {
    if (schemePanel.classList.contains('hidden')) {
      schemePanel.classList.remove('hidden');
      stylePanel.classList.add('hidden');
      buildbar.classList.add('subpanel');
      schemeNameEl.focus();
    } else {
      closeSchemePanel();
    }
    syncPanelOverlay();
  });

  document.getElementById('scheme-close').addEventListener('click', () => {
    closeSchemePanel();
    syncPanelOverlay();
  });

  document.getElementById('btn-save-scheme').addEventListener('click', saveScheme);

  schemeNameEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveScheme();
  });
}