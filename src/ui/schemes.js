import { t } from '../i18n.js';
import { catalogItem } from '../furniture.js';
import { getStyleSnapshot, setStyleSnapshot } from '../style.js';
import { STORE_KEY, snapshot, applyLayout, saveLayout, placements } from '../core/furnitureState.js';
import { toast } from './toast.js';
import { syncPanelOverlay } from './panelOverlay.js';
import { renderStyleControls } from './stylePanel.js';

const SCHEMES_KEY = 'hourse-layout-schemes-v1';

const schemePanel = document.getElementById('scheme-panel');
const schemeNameEl = document.getElementById('scheme-name');
const schemeListEl = document.getElementById('scheme-list');
const stylePanel = document.getElementById('style-panel');

let schemes = [];

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

export function renderSchemes() {
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

export function initSchemes() {
  migrateLegacyLayout();
  schemes = readSchemes();
  renderSchemes();

  document.getElementById('btn-schemes').addEventListener('click', () => {
    schemePanel.classList.toggle('hidden');
    if (!schemePanel.classList.contains('hidden')) {
      stylePanel.classList.add('hidden');
      schemeNameEl.focus();
    }
    syncPanelOverlay();
  });

  document.getElementById('btn-save-scheme').addEventListener('click', saveScheme);

  schemeNameEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveScheme();
  });
}