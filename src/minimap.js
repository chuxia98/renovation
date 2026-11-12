import {
  WALLS, FLOORS, BAYS, PX_PER_M, mx, mz,
} from './plan.js';
import { catalogItem } from './furniture.js';

const PAD = 9;
const CSS_W = 148;

const FLOOR_COLORS = { wood: '#a17b56', tile: '#9aa09a', stone: '#8d938f' };

const BAY_RECTS = [];
for (const b of BAYS) {
  const depth = b.depth / PX_PER_M;
  const w = WALLS.find((wall) => (wall.openings || []).some(
    (o) => o.bay && (b.side === 'west' ? o.from === b.z0 : o.from === b.x0),
  ));
  if (!w) continue;
  const half = w.t / 2 / PX_PER_M;
  if (b.side === 'west') {
    BAY_RECTS.push({
      minX: mx(w.at) - half - depth, maxX: mx(w.at) + half,
      minZ: mz(b.z0), maxZ: mz(b.z1),
    });
  } else {
    BAY_RECTS.push({
      minX: mx(b.x0), maxX: mx(b.x1),
      minZ: mz(w.at) - half, maxZ: mz(w.at) + half + depth,
    });
  }
}

function wallSpans(w) {
  const spans = [];
  let cur = w.from;
  for (const o of (w.openings || []).slice().sort((a, b) => a.from - b.from)) {
    if (o.from > cur) spans.push([cur, o.from]);
    cur = Math.max(cur, o.to);
  }
  if (cur < w.to) spans.push([cur, w.to]);
  return spans;
}

export function createMinimap(canvas, getState) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);

  let minX = Infinity;
  let maxX = -Infinity;
  let minZ = Infinity;
  let maxZ = -Infinity;
  const grow = (x1, x2, z1, z2) => {
    minX = Math.min(minX, x1);
    maxX = Math.max(maxX, x2);
    minZ = Math.min(minZ, z1);
    maxZ = Math.max(maxZ, z2);
  };

  for (const f of FLOORS) grow(mx(f.x1), mx(f.x2), mz(f.z1), mz(f.z2));
  for (const w of WALLS) {
    const half = w.t / 2 / PX_PER_M;
    if (w.o === 'v') grow(mx(w.at) - half, mx(w.at) + half, mz(w.from), mz(w.to));
    else grow(mx(w.from), mx(w.to), mz(w.at) - half, mz(w.at) + half);
  }

  for (const r of BAY_RECTS) grow(r.minX, r.maxX, r.minZ, r.maxZ);

  minX -= 0.1;
  maxX += 0.1;
  minZ -= 0.1;
  maxZ += 0.1;

  const spanX = maxX - minX;
  const spanZ = maxZ - minZ;
  const cssW = CSS_W;
  const cssH = Math.round(cssW * (spanZ / spanX));
  canvas.width = Math.round(cssW * dpr);
  canvas.height = Math.round(cssH * dpr);
  canvas.style.width = `${cssW}px`;
  canvas.style.height = `${cssH}px`;

  const ctx = canvas.getContext('2d');
  const scale = Math.min((cssW - PAD * 2) / spanX, (cssH - PAD * 2) / spanZ);
  const offX = (cssW - spanX * scale) / 2 - minX * scale;
  const offZ = (cssH - spanZ * scale) / 2 - minZ * scale;
  const X = (x) => offX + x * scale;
  const Z = (z) => offZ + z * scale;

  function rect(x1, x2, z1, z2) {
    ctx.rect(X(x1), Z(z1), (x2 - x1) * scale, (z2 - z1) * scale);
  }

  function wallLine(w, a, b) {
    ctx.beginPath();
    if (w.o === 'v') {
      ctx.moveTo(X(mx(w.at)), Z(mz(a)));
      ctx.lineTo(X(mx(w.at)), Z(mz(b)));
    } else {
      ctx.moveTo(X(mx(a)), Z(mz(w.at)));
      ctx.lineTo(X(mx(b)), Z(mz(w.at)));
    }
    ctx.stroke();
  }

  function draw() {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, cssW, cssH);

    for (const f of FLOORS) {
      ctx.beginPath();
      rect(mx(f.x1), mx(f.x2), mz(f.z1), mz(f.z2));
      ctx.fillStyle = FLOOR_COLORS[f.mat] || FLOOR_COLORS.wood;
      ctx.fill();
    }
    for (const r of BAY_RECTS) {
      ctx.beginPath();
      rect(r.minX, r.maxX, r.minZ, r.maxZ);
      ctx.fillStyle = FLOOR_COLORS.wood;
      ctx.fill();
    }

    for (const w of WALLS) {
      const thick = Math.max(1.4, (w.t / PX_PER_M) * scale);
      const openings = w.openings || [];
      const spans = wallSpans(w);

      ctx.strokeStyle = '#ece5d7';
      ctx.lineWidth = thick;
      for (const [a, b] of spans) wallLine(w, a, b);

      for (const o of openings) {
        if (o.kind === 'door') continue;
        ctx.strokeStyle = 'rgba(158, 196, 201, 0.9)';
        ctx.lineWidth = Math.max(1.2, thick * 0.55);
        wallLine(w, o.from, o.to);
      }
    }

    // 阳台栏板（南、东两侧）
    ctx.strokeStyle = 'rgba(158, 196, 201, 0.85)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(X(mx(1318)), Z(mz(2470) - 0.03));
    ctx.lineTo(X(mx(2034)), Z(mz(2470) - 0.03));
    ctx.moveTo(X(mx(2034) - 0.03), Z(mz(2157)));
    ctx.lineTo(X(mx(2034) - 0.03), Z(mz(2470)));
    ctx.stroke();

    const s = getState();
    const flat = [];
    const solid = [];
    for (const p of s.placements) {
      const item = catalogItem(p.t);
      if (!item) continue;
      (item.flat ? flat : solid).push([p, item]);
    }
    for (const group of [flat, solid]) {
      for (const [p, item] of group) {
        const w = item.w * scale;
        const d = item.d * scale;
        ctx.save();
        ctx.translate(X(p.x), Z(p.z));
        ctx.rotate((-p.r * Math.PI) / 180);
        ctx.beginPath();
        ctx.rect(-w / 2, -d / 2, w, d);
        if (item.flat) {
          ctx.fillStyle = 'rgba(214, 200, 174, 0.24)';
          ctx.fill();
        } else {
          ctx.fillStyle = 'rgba(205, 133, 82, 0.82)';
          ctx.fill();
          ctx.strokeStyle = 'rgba(18, 14, 10, 0.5)';
          ctx.lineWidth = 0.7;
          ctx.stroke();
        }
        ctx.restore();
      }
    }

    const px = X(s.x);
    const pz = Z(s.z);
    const fx = -Math.sin(s.yaw);
    const fy = -Math.cos(s.yaw);
    const rx = -fy;
    const ry = fx;

    ctx.beginPath();
    ctx.moveTo(px, pz);
    ctx.arc(px, pz, 20, Math.atan2(fy, fx) - 0.58, Math.atan2(fy, fx) + 0.58);
    ctx.closePath();
    ctx.fillStyle = 'rgba(224, 169, 109, 0.16)';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(px + fx * 5.4, pz + fy * 5.4);
    ctx.lineTo(px - fx * 3.2 + rx * 3.4, pz - fy * 3.2 + ry * 3.4);
    ctx.lineTo(px - fx * 3.2 - rx * 3.4, pz - fy * 3.2 - ry * 3.4);
    ctx.closePath();
    ctx.fillStyle = '#e0a96d';
    ctx.fill();
    ctx.strokeStyle = 'rgba(22, 15, 8, 0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  return { draw };
}

// 游戏式小地图：以玩家为中心、朝向朝上、圆形裁切
export function createRadar(canvas, getState) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const R = 64;
  const VIEW_R = 6.5;
  const size = R * 2;
  canvas.width = Math.round(size * dpr);
  canvas.height = Math.round(size * dpr);
  const ctx = canvas.getContext('2d');
  const scale = R / VIEW_R;

  function draw() {
    const st = getState();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.beginPath();
    ctx.arc(R, R, R - 1, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = 'rgba(12, 14, 17, 0.62)';
    ctx.fillRect(0, 0, size, size);

    // 世界坐标 → 玩家为中心、朝向朝上
    ctx.save();
    ctx.translate(R, R);
    ctx.rotate(st.yaw);
    ctx.scale(scale, scale);
    ctx.translate(-st.x, -st.z);

    for (const f of FLOORS) {
      ctx.beginPath();
      ctx.rect(mx(f.x1), mz(f.z1), mx(f.x2) - mx(f.x1), mz(f.z2) - mz(f.z1));
      ctx.fillStyle = FLOOR_COLORS[f.mat] || FLOOR_COLORS.wood;
      ctx.fill();
    }
    for (const r of BAY_RECTS) {
      ctx.beginPath();
      ctx.rect(r.minX, r.minZ, r.maxX - r.minX, r.maxZ - r.minZ);
      ctx.fillStyle = FLOOR_COLORS.wood;
      ctx.fill();
    }

    for (const w of WALLS) {
      const thick = Math.max(1.3 / scale, w.t / PX_PER_M);
      ctx.strokeStyle = '#ece5d7';
      ctx.lineWidth = thick;
      for (const [a, b] of wallSpans(w)) {
        ctx.beginPath();
        if (w.o === 'v') {
          ctx.moveTo(mx(w.at), mz(a));
          ctx.lineTo(mx(w.at), mz(b));
        } else {
          ctx.moveTo(mx(a), mz(w.at));
          ctx.lineTo(mx(b), mz(w.at));
        }
        ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(158, 196, 201, 0.9)';
      ctx.lineWidth = Math.max(1 / scale, thick * 0.55);
      for (const o of w.openings || []) {
        if (o.kind === 'door') continue;
        ctx.beginPath();
        if (w.o === 'v') {
          ctx.moveTo(mx(w.at), mz(o.from));
          ctx.lineTo(mx(w.at), mz(o.to));
        } else {
          ctx.moveTo(mx(o.from), mz(w.at));
          ctx.lineTo(mx(o.to), mz(w.at));
        }
        ctx.stroke();
      }
    }

    // 阳台栏板（南、东两侧）
    ctx.strokeStyle = 'rgba(158, 196, 201, 0.85)';
    ctx.lineWidth = Math.max(1 / scale, 0.08);
    ctx.beginPath();
    ctx.moveTo(mx(1318), mz(2470) - 0.03);
    ctx.lineTo(mx(2034), mz(2470) - 0.03);
    ctx.moveTo(mx(2034) - 0.03, mz(2157));
    ctx.lineTo(mx(2034) - 0.03, mz(2470));
    ctx.stroke();

    for (const p of st.placements) {
      const item = catalogItem(p.t);
      if (!item) continue;
      ctx.save();
      ctx.translate(p.x, p.z);
      ctx.rotate((-p.r * Math.PI) / 180);
      ctx.beginPath();
      ctx.rect(-item.w / 2, -item.d / 2, item.w, item.d);
      ctx.fillStyle = item.flat ? 'rgba(214, 200, 174, 0.28)' : 'rgba(205, 133, 82, 0.85)';
      ctx.fill();
      if (!item.flat) {
        ctx.strokeStyle = 'rgba(18, 14, 10, 0.55)';
        ctx.lineWidth = 0.8 / scale;
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.restore();

    ctx.beginPath();
    ctx.moveTo(R, R);
    ctx.arc(R, R, 38, -Math.PI / 2 - 0.58, -Math.PI / 2 + 0.58);
    ctx.closePath();
    ctx.fillStyle = 'rgba(224, 169, 109, 0.14)';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(R, R - 7);
    ctx.lineTo(R - 4.8, R + 5);
    ctx.lineTo(R + 4.8, R + 5);
    ctx.closePath();
    ctx.fillStyle = '#e0a96d';
    ctx.fill();
    ctx.strokeStyle = 'rgba(22, 15, 8, 0.8)';
    ctx.lineWidth = 1;
    ctx.stroke();

    const nx = R + Math.sin(st.yaw) * (R - 10);
    const ny = R - Math.cos(st.yaw) * (R - 10);
    ctx.font = '9px "PingFang SC", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(243, 238, 230, 0.55)';
    ctx.fillText('N', nx, ny);

    ctx.restore();

    ctx.beginPath();
    ctx.arc(R, R, R - 1, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1.2;
    ctx.stroke();
  }

  return { draw };
}
