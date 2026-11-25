import * as THREE from 'three';
import { scene, camera, renderer } from '../core/scene.js';
import { placements, furnitureGroup } from '../core/furnitureState.js';
import { FLOORS, mx, mz } from '../plan.js';
import { furnitureVariant } from '../furniture.js';
import { t, onLangChange } from '../i18n.js';
import { toast } from './toast.js';

// 场景拾取：点击任意表面，输出「对象 + 房间 + 世界坐标」，方便口头指出建模偏差。
// 生成的报告可直接粘贴到对话里，坐标与 plan.js 的米制世界坐标一致。

const ROOM_RECTS = FLOORS.map((f) => ({
  room: f.room,
  x1: mx(f.x1),
  x2: mx(f.x2),
  z1: mz(f.z1),
  z2: mz(f.z2),
  area: (mx(f.x2) - mx(f.x1)) * (mz(f.z2) - mz(f.z1)),
}));

function roomAt(x, z) {
  let best = null;
  for (const r of ROOM_RECTS) {
    if (x >= r.x1 - 0.02 && x <= r.x2 + 0.02 && z >= r.z1 - 0.02 && z <= r.z2 + 0.02) {
      if (!best || r.area < best.area) best = r;
    }
  }
  return best?.room ?? null;
}

function roomLabel(id) {
  if (!id) return '';
  const key = `room.${id}`;
  const str = t(key);
  return str === key ? id : str;
}

const KIND_LABEL = {
  wall: 'pick.kind.wall',
  floor: 'pick.kind.floor',
  furniture: 'pick.kind.furniture',
  door: 'pick.kind.door',
  slider: 'pick.kind.slider',
  'window-frame': 'pick.kind.window',
  'window-glass': 'pick.kind.glass',
  glass: 'pick.kind.glass',
  'door-frame': 'pick.kind.doorframe',
  group: 'pick.kind.object',
  object: 'pick.kind.object',
};

function kindLabel(info) {
  if (info.kind === 'furniture') {
    const key = `catalog.${info.type}`;
    const name = t(key);
    return name === key ? info.type : name;
  }
  if (info.kind === 'group') {
    const key = `pick.name.${info.name}`;
    const name = t(key);
    return name === key ? info.name : name;
  }
  return t(KIND_LABEL[info.kind] ?? 'pick.kind.object');
}

const markersGroup = new THREE.Group();
markersGroup.name = 'pick-markers';
markersGroup.userData.pickHelper = true;
markersGroup.visible = false;

const hoverHelper = new THREE.Box3Helper(new THREE.Box3(), 0xffb066);
hoverHelper.userData.pickHelper = true;
hoverHelper.visible = false;
hoverHelper.material.depthTest = false;
hoverHelper.material.transparent = true;
hoverHelper.material.opacity = 0.9;
hoverHelper.renderOrder = 998;

const DOT_GEO = new THREE.SphereGeometry(0.035, 16, 12);
const DOT_MAT = new THREE.MeshBasicMaterial({
  color: 0xffa94f, depthTest: false, depthWrite: false, transparent: true, opacity: 0.95,
});

const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();

const picks = [];
let seq = 0;
let active = false;
let controlsRef = null;
let onEnterRef = null;
let inited = false;

let btnEl = null;
let panelEl = null;
let listEl = null;
let tipEl = null;

let hoverFrame = 0;
let hoverAt = null;

// ---------- 射线与对象识别 ----------

function isHelper(object) {
  for (let n = object; n; n = n.parent) {
    if (n.userData?.pickHelper) return true;
  }
  return false;
}

function isHidden(object) {
  for (let n = object; n && n !== scene; n = n.parent) {
    if (n.visible === false) return true;
  }
  return false;
}

function raycast(clientX, clientY) {
  ndc.set((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const hits = raycaster.intersectObjects(scene.children, true);
  for (const hit of hits) {
    if (isHelper(hit.object) || isHidden(hit.object)) continue;
    return hit;
  }
  return null;
}

function describe(hit) {
  const object = hit.object;

  // 家具：找到挂在 furnitureGroup 下的放置组
  let group = object;
  while (group && group.parent !== furnitureGroup) group = group.parent;
  if (group && group.parent === furnitureGroup) {
    const placement = placements.find((entry) => entry.group === group);
    if (placement) {
      const variant = furnitureVariant(placement.t, placement.v);
      return {
        kind: 'furniture',
        node: group,
        type: placement.t,
        variant: placement.v,
        size: variant ? [variant.w, variant.d] : null,
        pos: [placement.x, placement.z],
        rot: placement.r,
        room: roomAt(placement.x, placement.z),
      };
    }
  }

  // 地面：每块 mesh 带房间 id
  if (object.name === 'floor' && object.userData.roomId) {
    return { kind: 'floor', node: object, room: object.userData.roomId };
  }

  // 墙体与风道：带两侧房间信息
  if (object.userData.wallSides) {
    const sides = object.userData.wallSides;
    return { kind: 'wall', node: object, rooms: [sides.plus, sides.minus].filter(Boolean) };
  }

  // 门 / 推拉门：交互记录挂在祖先组上
  let node = object;
  while (node && !node.userData.interact) node = node.parent;
  if (node) {
    const record = node.userData.interact;
    return {
      kind: record.kind === 'door' ? 'door' : 'slider',
      node,
      open: !!record.open,
    };
  }

  // 窗框 / 玻璃 / 门套：build.js 打的语义标签
  if (object.userData.surface) {
    return { kind: object.userData.surface, node: object };
  }

  // 命名组（阳台围护等）
  let named = object;
  while (named && named !== scene) {
    if (named.name && named.name !== 'apartment') {
      return { kind: 'group', node: named, name: named.name };
    }
    named = named.parent;
  }

  return { kind: 'object', node: object };
}

// ---------- 标记与报告 ----------

function addMarker(point, normal, number) {
  const marker = new THREE.Group();
  marker.userData.pickHelper = true;

  const dot = new THREE.Mesh(DOT_GEO, DOT_MAT);
  dot.position.copy(point).addScaledVector(normal, 0.03);
  dot.renderOrder = 999;
  marker.add(dot);

  marker.add(numberSprite(number, dot.position));
  markersGroup.add(marker);
  return marker;
}

function numberSprite(number, at) {
  const canvas = document.createElement('canvas');
  canvas.width = 96;
  canvas.height = 96;
  const g = canvas.getContext('2d');
  g.beginPath();
  g.arc(48, 48, 40, 0, Math.PI * 2);
  g.fillStyle = 'rgba(14, 16, 20, 0.92)';
  g.fill();
  g.lineWidth = 6;
  g.strokeStyle = '#ffa94f';
  g.stroke();
  g.fillStyle = '#ffd9b0';
  g.font = 'bold 46px system-ui, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(String(number), 48, 51);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture, depthTest: false, depthWrite: false, transparent: true,
  }));
  sprite.scale.set(0.13, 0.13, 1);
  sprite.position.copy(at).add(new THREE.Vector3(0, 0.1, 0));
  sprite.renderOrder = 1000;
  return sprite;
}

function disposeMarker(marker) {
  marker.traverse((n) => {
    if (n.isSprite) {
      n.material.map?.dispose();
      n.material.dispose();
    }
  });
  markersGroup.remove(marker);
}

export function pickAt(clientX, clientY) {
  if (!active) return;
  const hit = raycast(clientX, clientY);
  if (!hit) {
    toast(t('pick.nothing'));
    return;
  }

  const info = describe(hit);
  const point = hit.point.clone();
  const normal = hit.face
    ? hit.face.normal.clone().transformDirection(hit.object.matrixWorld).normalize()
    : new THREE.Vector3(0, 1, 0);

  if (!info.room && !info.rooms) {
    info.room = roomAt(point.x + normal.x * 0.2, point.z + normal.z * 0.2) ?? roomAt(point.x, point.z);
  }

  seq += 1;
  picks.push({ n: seq, info, point, normal, marker: addMarker(point, normal, seq) });
  markersGroup.visible = true;
  renderList();
  toast(t('pick.marked', { n: seq }));
  console.info('[picker]\n' + reportText());
}

function infoLabel(info) {
  const kind = kindLabel(info);
  if (info.kind === 'wall') {
    const rooms = (info.rooms ?? []).map(roomLabel).filter(Boolean).join(' / ');
    return rooms ? `${kind} · ${rooms}` : kind;
  }
  const room = roomLabel(info.room);
  return room ? `${kind} · ${room}` : kind;
}

function fmt(v) {
  return v.toFixed(2);
}

function hitPart(pick) {
  return `hit=(${fmt(pick.point.x)}, ${fmt(pick.point.y)}, ${fmt(pick.point.z)})`
    + ` normal=(${fmt(pick.normal.x)}, ${fmt(pick.normal.y)}, ${fmt(pick.normal.z)})`;
}

function reportText() {
  const yaw = ((THREE.MathUtils.radToDeg(camera.rotation.y) % 360) + 360) % 360;
  const head = t('pick.reportHeader', {
    n: picks.length,
    x: camera.position.x.toFixed(1),
    z: camera.position.z.toFixed(1),
    yaw: Math.round(yaw),
  });
  if (!picks.length) return `${head}\n${t('pick.reportEmpty')}`;

  const lines = picks.map((pick) => {
    const info = pick.info;
    const parts = [`#${pick.n}`, info.kind];
    if (info.kind === 'furniture') {
      parts.push(`type=${info.type}`);
      parts.push(`variant=${info.variant || '-'}`);
      if (info.size) parts.push(`size=${info.size[0].toFixed(2)}×${info.size[1].toFixed(2)}`);
      parts.push(`pos=(${fmt(info.pos[0])}, ${fmt(info.pos[1])})`);
      parts.push(`rot=${info.rot}°`);
    }
    if (info.kind === 'wall') parts.push(`rooms=${info.rooms.join('|') || '?'}`);
    if (info.kind === 'door' || info.kind === 'slider') parts.push(`open=${info.open}`);
    if (info.kind === 'group') parts.push(`name=${info.name}`);
    if (info.room) parts.push(`room=${info.room}`);
    const box = info.node?.geometry?.parameters;
    if (box && box.width != null) {
      parts.push(`box=${fmt(box.width)}×${fmt(box.height)}×${fmt(box.depth)}`);
    }
    return `${parts.join(' ')} | ${hitPart(pick)}`;
  });
  return [head, ...lines].join('\n');
}

// ---------- 面板 ----------

function renderList() {
  if (!listEl) return;
  listEl.textContent = '';
  if (!picks.length) {
    const empty = document.createElement('div');
    empty.className = 'picker-empty';
    empty.textContent = t('pick.empty');
    listEl.appendChild(empty);
    return;
  }
  for (const pick of picks) {
    const row = document.createElement('div');
    row.className = 'pick-row';

    const no = document.createElement('span');
    no.className = 'pick-no';
    no.textContent = String(pick.n);

    const text = document.createElement('div');
    text.className = 'pick-info';
    const name = document.createElement('div');
    name.className = 'pick-name';
    name.textContent = infoLabel(pick.info);
    const meta = document.createElement('div');
    meta.className = 'pick-meta';
    meta.textContent = `(${fmt(pick.point.x)}, ${fmt(pick.point.y)}, ${fmt(pick.point.z)})`;
    text.append(name, meta);

    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'pick-del';
    del.textContent = '×';
    del.addEventListener('click', () => removePick(pick));

    row.append(no, text, del);
    listEl.appendChild(row);
  }
}

function removePick(pick) {
  const idx = picks.indexOf(pick);
  if (idx < 0) return;
  picks.splice(idx, 1);
  disposeMarker(pick.marker);
  markersGroup.visible = picks.length > 0;
  renderList();
}

function clearPicks() {
  for (const pick of picks) disposeMarker(pick.marker);
  picks.length = 0;
  seq = 0;
  renderList();
}

function copyText(text) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
  }
  fallbackCopy(text);
  return Promise.resolve();
}

function fallbackCopy(text) {
  const area = document.createElement('textarea');
  area.value = text;
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  try {
    document.execCommand('copy');
  } catch {
    /* 剪贴板不可用时至少保留 console 输出 */
  }
  area.remove();
}

function copyReport() {
  const text = reportText();
  console.info('[picker] copy\n' + text);
  copyText(text).then(() => toast(t('pick.copied')));
}

// ---------- 悬停高亮 ----------

function setTip(label, point, clientX, clientY) {
  if (!tipEl) return;
  tipEl.innerHTML = '';
  const head = document.createElement('div');
  head.className = 'pick-tip-head';
  head.textContent = label;
  const coords = document.createElement('div');
  coords.className = 'pick-tip-coords';
  coords.textContent = `(${fmt(point.x)}, ${fmt(point.y)}, ${fmt(point.z)})`;
  tipEl.append(head, coords);
  tipEl.classList.remove('hidden');

  const pad = 12;
  const width = tipEl.offsetWidth;
  const height = tipEl.offsetHeight;
  let x = clientX + 16;
  let y = clientY + 18;
  if (x + width > window.innerWidth - pad) x = clientX - width - 16;
  if (y + height > window.innerHeight - pad) y = clientY - height - 16;
  tipEl.style.transform = `translate(${Math.max(pad, x)}px, ${Math.max(pad, y)}px)`;
}

function hoverEnd() {
  hoverAt = null;
  hoverHelper.visible = false;
  tipEl?.classList.add('hidden');
}

function hover(clientX, clientY) {
  if (!active) return;
  const hit = raycast(clientX, clientY);
  if (!hit) {
    hoverEnd();
    return;
  }
  const info = describe(hit);
  hoverHelper.box.setFromObject(info.node);
  hoverHelper.box.expandByScalar(0.015);
  hoverHelper.visible = true;
  setTip(infoLabel(info), hit.point, clientX, clientY);
}

function queueHover(clientX, clientY) {
  hoverAt = { clientX, clientY };
  if (hoverFrame) return;
  hoverFrame = requestAnimationFrame(() => {
    hoverFrame = 0;
    if (hoverAt) hover(hoverAt.clientX, hoverAt.clientY);
  });
}

// ---------- 开关 ----------

function setActive(next) {
  if (next === active) return;
  active = next;
  document.body.classList.toggle('picking', active);
  btnEl?.classList.toggle('active', active);
  panelEl?.classList.toggle('hidden', !active);
  markersGroup.visible = active && picks.length > 0;
  hoverHelper.visible = false;
  tipEl?.classList.add('hidden');
  if (active) {
    onEnterRef?.();
    controlsRef?.unlock?.();
    renderList();
  } else {
    hoverEnd();
  }
}

export function isPicking() {
  return active;
}

export function enterPicker() {
  if (!active) setActive(true);
}

export function exitPicker() {
  if (active) setActive(false);
}

export function togglePicker() {
  setActive(!active);
}

export function initPicker({ controls, onEnter } = {}) {
  if (inited) return;
  inited = true;
  controlsRef = controls;
  onEnterRef = onEnter;

  scene.add(markersGroup, hoverHelper);

  btnEl = document.getElementById('btn-pick');
  panelEl = document.getElementById('picker');
  listEl = document.getElementById('picker-list');
  tipEl = document.getElementById('pick-tip');

  btnEl?.addEventListener('click', () => togglePicker());
  document.getElementById('picker-close')?.addEventListener('click', () => exitPicker());
  document.getElementById('picker-copy')?.addEventListener('click', copyReport);
  document.getElementById('picker-clear')?.addEventListener('click', clearPicks);

  renderer.domElement.addEventListener('pointerleave', hoverEnd);
  window.addEventListener('pointermove', (e) => {
    if (!active) return;
    if (e.target === renderer.domElement) queueHover(e.clientX, e.clientY);
    else hoverEnd();
  });

  onLangChange(() => {
    renderList();
    hoverEnd();
  });
}
