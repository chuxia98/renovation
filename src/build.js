import * as THREE from 'three';
import { WALL_H, WALLS, FLOORS, BAYS, CEILING_LIGHTS, PX_PER_M, mx, mz } from './plan.js';
import { createFloorMaterial, createWallMaterial, WALL_TEX_METERS, skyTexture } from './textures.js';

const LIGHT_BOOST = 0.32;
const ROOM_PROBE = 0.45; // 墙面取样点距墙中心线的距离（米）

export function buildApartment(scene) {
  const root = new THREE.Group();
  root.name = 'apartment';
  scene.add(root);

  const colliders = [];
  const floorMeshes = [];
  const wallMeshes = [];
  const interactions = [];

  // 房间矩形（米），用于判断墙体两侧归属
  const roomRects = FLOORS.map((f) => ({
    room: f.room,
    x1: mx(f.x1), x2: mx(f.x2), z1: mz(f.z1), z2: mz(f.z2),
  }));

  function roomAt(x, z) {
    for (const r of roomRects) {
      if (x >= r.x1 - 0.01 && x <= r.x2 + 0.01 && z >= r.z1 - 0.01 && z <= r.z2 + 0.01) return r.room;
    }
    return null;
  }

  // BoxGeometry 每个面 UV 都是 0..1，按面的实际尺寸换算成重复次数
  function scaleWallUVs(geo, sx, sy, sz) {
    const uv = geo.attributes.uv;
    const faceDims = [
      [sz, sy], [sz, sy], // +x, -x
      [sx, sz], [sx, sz], // +y, -y
      [sx, sy], [sx, sy], // +z, -z
    ];
    for (let f = 0; f < 6; f++) {
      const su = faceDims[f][0] / WALL_TEX_METERS;
      const sv = faceDims[f][1] / WALL_TEX_METERS;
      for (let i = f * 4; i < f * 4 + 4; i++) {
        uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
      }
    }
    uv.needsUpdate = true;
  }

  // 其他方向的墙体在本墙上的交点，用于把长墙切成单房间段
  const hBreaks = WALLS.filter((w) => w.o === 'h').map((w) => ({ at: mz(w.at), from: mx(w.from), to: mx(w.to) }));
  const vBreaks = WALLS.filter((w) => w.o === 'v').map((w) => ({ at: mx(w.at), from: mz(w.from), to: mz(w.to) }));

  function splitByJunctions(o, c, s, e) {
    const breaks = (o === 'v' ? hBreaks : vBreaks)
      .filter((b) => b.from - 0.02 <= c && c <= b.to + 0.02 && b.at > s + 0.005 && b.at < e - 0.005)
      .map((b) => b.at)
      .sort((p, q) => p - q);
    const spans = [];
    let cursor = s;
    for (const at of breaks) {
      spans.push([cursor, at]);
      cursor = at;
    }
    spans.push([cursor, e]);
    return spans;
  }

  // ---------- 材质 ----------

  const wallMat = createWallMaterial();
  const ceilMat = new THREE.MeshStandardMaterial({
    color: 0xe6e0d6, roughness: 0.96, emissive: 0xe8e0d2, emissiveIntensity: 0.32,
  });
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x43484c, roughness: 0.42, metalness: 0.55 });
  const doorFrameMat = new THREE.MeshStandardMaterial({ color: 0xe8e2d7, roughness: 0.62 });
  const doorMat = new THREE.MeshStandardMaterial({ color: 0xf0ebe2, roughness: 0.55 });
  const entryDoorMat = new THREE.MeshStandardMaterial({ color: 0x473327, roughness: 0.48 });
  const doorPanelMat = new THREE.MeshStandardMaterial({ color: 0xe2dbcf, roughness: 0.64 });
  const glassMat = new THREE.MeshPhysicalMaterial({
    color: 0xc4dce4, transparent: true, opacity: 0.17, roughness: 0.05, metalness: 0,
    side: THREE.DoubleSide, depthWrite: false,
  });
  const metalMat = new THREE.MeshStandardMaterial({ color: 0x8b9094, roughness: 0.33, metalness: 0.82 });
  const lampMat = new THREE.MeshStandardMaterial({
    color: 0x2a2622, emissive: 0xffe4b8, emissiveIntensity: 2.6, roughness: 0.4,
  });

  // ---------- 工具 ----------

  function box(sx, sy, sz, mat, x, y, z, { cast = true, receive = true, parent = root } = {}) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(sx, sy, sz), mat);
    mesh.position.set(x, y, z);
    mesh.castShadow = cast;
    mesh.receiveShadow = receive;
    parent.add(mesh);
    return mesh;
  }

  function addCollider(x1, x2, z1, z2) {
    const collider = {
      minX: Math.min(x1, x2), maxX: Math.max(x1, x2),
      minZ: Math.min(z1, z2), maxZ: Math.max(z1, z2),
    };
    colliders.push(collider);
    return collider;
  }

  function setColliderRect(collider, x1, x2, z1, z2) {
    collider.minX = Math.min(x1, x2);
    collider.maxX = Math.max(x1, x2);
    collider.minZ = Math.min(z1, z2);
    collider.maxZ = Math.max(z1, z2);
  }

  function updateInteractions(dt) {
    for (const it of interactions) it.update(dt);
  }

  // ---------- 地面 ----------

  for (const f of FLOORS) {
    const x1 = mx(f.x1);
    const x2 = mx(f.x2);
    const z1 = mz(f.z1);
    const z2 = mz(f.z2);
    const w = x2 - x1;
    const d = z2 - z1;
    const mat = createFloorMaterial(f.mat, w, d);
    const mesh = box(w, 0.08, d, mat, (x1 + x2) / 2, -0.04, (z1 + z2) / 2, { cast: false });
    mesh.name = 'floor';
    mesh.userData.roomId = f.room;
    mesh.userData.floorSize = { w, d };
    floorMeshes.push(mesh);

    // 顶棚
    box(w, 0.1, d, ceilMat, (x1 + x2) / 2, WALL_H + 0.04, (z1 + z2) / 2, { cast: false });
  }

  // ---------- 墙体 ----------

  for (const w of WALLS) {
    const t = w.t / PX_PER_M;
    const o = w.o;
    const a0 = o === 'v' ? mz(w.from) : mx(w.from);
    const a1 = o === 'v' ? mz(w.to) : mx(w.to);
    const c = o === 'v' ? mx(w.at) : mz(w.at);

    const seg = (s, e, y0, y1, collide) => {
      const len = e - s;
      if (len < 1e-4) return;
      for (const [ss, se] of splitByJunctions(o, c, s, e)) {
        const slen = se - ss;
        if (slen < 1e-4) continue;
        const mesh = o === 'v'
          ? box(t, y1 - y0, slen, wallMat, c, (y0 + y1) / 2, (ss + se) / 2)
          : box(slen, y1 - y0, t, wallMat, (ss + se) / 2, (y0 + y1) / 2, c);
        scaleWallUVs(mesh.geometry, o === 'v' ? t : slen, y1 - y0, o === 'v' ? slen : t);
        const smid = (ss + se) / 2;
        mesh.userData.wallSides = o === 'v'
          ? { axis: 'v', plus: roomAt(c + ROOM_PROBE, smid), minus: roomAt(c - ROOM_PROBE, smid) }
          : { axis: 'h', plus: roomAt(smid, c + ROOM_PROBE), minus: roomAt(smid, c - ROOM_PROBE) };
        wallMeshes.push(mesh);
      }
      // 踢脚线
      const mid = (s + e) / 2;
      const off = t / 2 + 0.007;
      if (y0 < 0.01) {
        if (o === 'v') {
          box(0.014, 0.09, len, doorFrameMat, c - off, 0.045, mid, { cast: false });
          box(0.014, 0.09, len, doorFrameMat, c + off, 0.045, mid, { cast: false });
        } else {
          box(len, 0.09, 0.014, doorFrameMat, mid, 0.045, c - off, { cast: false });
          box(len, 0.09, 0.014, doorFrameMat, mid, 0.045, c + off, { cast: false });
        }
      }
      if (collide) {
        if (o === 'v') addCollider(c - t / 2, c + t / 2, s, e);
        else addCollider(s, e, c - t / 2, c + t / 2);
      }
    };

    const ops = w.openings
      .map((op) => ({
        ...op,
        a0: o === 'v' ? mz(op.from) : mx(op.from),
        a1: o === 'v' ? mz(op.to) : mx(op.to),
      }))
      .sort((p, q) => p.a0 - q.a0);

    let cursor = a0;
    for (const op of ops) {
      if (op.a0 > cursor) seg(cursor, op.a0, 0, WALL_H, true);
      if (op.sill > 0) seg(op.a0, op.a1, 0, op.sill, true);
      if (op.top < WALL_H) seg(op.a0, op.a1, op.top, WALL_H, false);

      if (op.kind === 'window' && !op.bay) addWindow(o, w, op);
      if (op.kind === 'door') addDoor(o, w, op);
      if (op.kind === 'slider') addSlider(o, w, op);

      cursor = Math.max(cursor, op.a1);
    }
    if (cursor < a1) seg(cursor, a1, 0, WALL_H, true);
  }

  // ---------- 窗 ----------

  function addWindow(o, w, op) {
    const c = o === 'v' ? mx(w.at) : mz(w.at);
    const depth = w.t / PX_PER_M + 0.02;
    const mid = (op.a0 + op.a1) / 2;
    const span = op.a1 - op.a0;
    const h = op.top - op.sill;
    const yMid = (op.sill + op.top) / 2;

    const bar = (ac, len, y, hh) => {
      if (o === 'v') box(depth, hh, len, frameMat, c, y, ac);
      else box(len, hh, depth, frameMat, ac, y, c);
    };

    bar(mid, span, op.sill + 0.03, 0.06);
    bar(mid, span, op.top - 0.03, 0.06);
    bar(op.a0 + 0.035, 0.07, yMid, h);
    bar(op.a1 - 0.035, 0.07, yMid, h);

    const mullions = span > 1.7 ? 2 : span > 1.0 ? 1 : 0;
    for (let i = 1; i <= mullions; i++) bar(op.a0 + (span * i) / (mullions + 1), 0.05, yMid, h);

    if (o === 'v') box(0.016, h - 0.1, span - 0.1, glassMat, c, yMid, mid, { cast: false, receive: false });
    else box(span - 0.1, h - 0.1, 0.016, glassMat, mid, yMid, c, { cast: false, receive: false });

    if (o === 'v') box(depth + 0.16, 0.035, span + 0.14, doorFrameMat, c, op.sill - 0.017, mid);
    else box(span + 0.14, 0.035, depth + 0.16, doorFrameMat, mid, op.sill - 0.017, c);
  }

  // ---------- 门 ----------

  function addDoor(o, w, op) {
    const c = o === 'v' ? mx(w.at) : mz(w.at);
    const t = w.t / PX_PER_M;
    const mid = (op.a0 + op.a1) / 2;
    const span = op.a1 - op.a0;
    const top = op.top;
    const jambW = 0.05;

    const jamb = (ac) => {
      if (o === 'v') box(t + 0.02, top, jambW, doorFrameMat, c, top / 2, ac);
      else box(jambW, top, t + 0.02, doorFrameMat, ac, top / 2, c);
    };
    jamb(op.a0 + jambW / 2);
    jamb(op.a1 - jambW / 2);
    if (o === 'v') box(t + 0.02, 0.06, span, doorFrameMat, c, top - 0.03, mid);
    else box(span, 0.06, t + 0.02, doorFrameMat, mid, top - 0.03, c);

    const hingeAtA = op.hinge !== 'b';
    const dir = hingeAtA ? 1 : -1;
    const hingeX = o === 'v' ? c : hingeAtA ? op.a0 : op.a1;
    const hingeZ = o === 'v' ? (hingeAtA ? op.a0 : op.a1) : c;

    const baseYaw = o === 'h'
      ? (dir > 0 ? 0 : Math.PI)
      : (dir > 0 ? -Math.PI / 2 : Math.PI / 2);
    const swing = THREE.MathUtils.degToRad(op.angle ?? 65);
    const closedYaw = baseYaw;
    const openYaw = baseYaw + swing;

    const group = new THREE.Group();
    group.position.set(hingeX, 0, hingeZ);
    group.rotation.y = closedYaw;
    root.add(group);

    const leafW = span - 0.06;
    const leafMat = op.style === 'entry' ? entryDoorMat : doorMat;
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(leafW, top - 0.08, 0.045), leafMat);
    leaf.position.set(0.03 + leafW / 2, (top - 0.08) / 2 + 0.02, 0);
    leaf.castShadow = true;
    leaf.receiveShadow = true;
    group.add(leaf);

    if (op.style === 'entry') {
      const upper = new THREE.Mesh(new THREE.BoxGeometry(leafW * 0.64, (top - 0.08) * 0.34, 0.012), new THREE.MeshStandardMaterial({ color: 0x35241a, roughness: 0.5 }));
      upper.position.set(0.03 + leafW / 2, (top - 0.08) * 0.68, 0.029);
      group.add(upper);
      const lower = new THREE.Mesh(new THREE.BoxGeometry(leafW * 0.64, (top - 0.08) * 0.36, 0.012), new THREE.MeshStandardMaterial({ color: 0x35241a, roughness: 0.5 }));
      lower.position.set(0.03 + leafW / 2, (top - 0.08) * 0.29, 0.029);
      group.add(lower);
    } else {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(leafW * 0.6, (top - 0.08) * 0.56, 0.012), doorPanelMat);
      panel.position.set(0.03 + leafW / 2, (top - 0.08) * 0.52, 0.029);
      group.add(panel);
    }

    // 把手（两侧）
    const metalDark = new THREE.MeshStandardMaterial({ color: 0x9a9187, roughness: 0.32, metalness: 0.85 });
    for (const side of [1, -1]) {
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.13, 12), metalDark);
      handle.rotation.x = Math.PI / 2;
      handle.position.set(0.03 + leafW - 0.1, 1.02, side * 0.055);
      group.add(handle);
      const rose = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.012, 16), metalDark);
      rose.rotation.x = Math.PI / 2;
      rose.position.set(0.03 + leafW - 0.1, 1.02, side * 0.026);
      group.add(rose);
    }

    // 关门时挡住门洞，开门后放行
    const wallT = w.t / PX_PER_M;
    const collider = o === 'v'
      ? addCollider(c - wallT / 2, c + wallT / 2, op.a0, op.a1)
      : addCollider(op.a0, op.a1, c - wallT / 2, c + wallT / 2);

    let yaw = closedYaw;
    let targetYaw = closedYaw;
    const record = {
      kind: 'door',
      open: false,
      roots: [group],
      toggle() {
        record.open = !record.open;
        targetYaw = record.open ? openYaw : closedYaw;
        if (record.open) collider.enabled = false;
      },
      update(dt) {
        if (Math.abs(targetYaw - yaw) < 1e-3) {
          if (yaw !== targetYaw) {
            yaw = targetYaw;
            group.rotation.y = yaw;
          }
          if (!record.open) collider.enabled = true;
          return;
        }
        yaw += (targetYaw - yaw) * Math.min(1, dt * 7);
        group.rotation.y = yaw;
      },
    };
    group.userData.interact = record;
    interactions.push(record);
  }

  // ---------- 推拉门 ----------

  function addSlider(o, w, op) {
    const c = o === 'v' ? mx(w.at) : mz(w.at);
    const depth = w.t / PX_PER_M + 0.02;
    const mid = (op.a0 + op.a1) / 2;
    const span = op.a1 - op.a0;
    const h = op.top;
    const panelW = span / 2;
    const yMid = h / 2;

    const bar = (ac, len, y, hh) => {
      if (o === 'v') box(depth, hh, len, frameMat, c, y, ac);
      else box(len, hh, depth, frameMat, ac, y, c);
    };
    bar(mid, span, 0.03, 0.06);
    bar(mid, span, h - 0.03, 0.06);
    bar(op.a0 + 0.03, 0.06, yMid, h);
    bar(op.a1 - 0.03, 0.06, yMid, h);

    const panels = [];
    for (let i = 0; i < 2; i++) {
      const ac = op.a0 + panelW * (i + 0.5);
      const pc = c + (i === 0 ? -1 : 1) * 0.03;
      const panel = new THREE.Group();
      root.add(panel);
      panels.push(panel);

      const frame = (a, y, hh, len) => {
        if (o === 'v') box(0.06, hh, len, frameMat, pc, y, a, { parent: panel });
        else box(len, hh, 0.06, frameMat, a, y, pc, { parent: panel });
      };
      // 面板边框
      if (o === 'v') {
        frame(ac - panelW / 2 + 0.03, yMid, h - 0.1, 0.05);
        frame(ac + panelW / 2 - 0.03, yMid, h - 0.1, 0.05);
        frame(ac, 0.1, 0.05, panelW - 0.06);
        frame(ac, h - 0.09, 0.05, panelW - 0.06);
        box(0.016, h - 0.2, panelW - 0.12, glassMat, pc, yMid, ac, { cast: false, receive: false, parent: panel });
      } else {
        frame(ac - panelW / 2 + 0.03, yMid, h - 0.1, 0.05);
        frame(ac + panelW / 2 - 0.03, yMid, h - 0.1, 0.05);
        frame(ac, 0.1, 0.05, panelW - 0.06);
        frame(ac, h - 0.09, 0.05, panelW - 0.06);
        box(panelW - 0.12, h - 0.2, 0.016, glassMat, ac, yMid, pc, { cast: false, receive: false, parent: panel });
      }
    }

    // 右扇向左滑到左扇后面，开启后只剩左半幅遮挡
    const wallT = w.t / PX_PER_M;
    const collider = o === 'v'
      ? addCollider(c - wallT / 2, c + wallT / 2, op.a0, op.a1)
      : addCollider(op.a0, op.a1, c - wallT / 2, c + wallT / 2);

    const slide = o === 'v' ? 'z' : 'x';
    let progress = 0;
    let target = 0;

    const applyProgress = (p) => {
      panels[1].position[slide] = -panelW * p;
      const edge = op.a1 - panelW * p;
      if (o === 'v') setColliderRect(collider, c - wallT / 2, c + wallT / 2, op.a0, edge);
      else setColliderRect(collider, op.a0, edge, c - wallT / 2, c + wallT / 2);
    };

    const record = {
      kind: 'slider',
      open: false,
      roots: panels,
      toggle() {
        record.open = !record.open;
        target = record.open ? 1 : 0;
      },
      update(dt) {
        if (progress === target) return;
        const step = dt * 1.5;
        progress = target > progress
          ? Math.min(target, progress + step)
          : Math.max(target, progress - step);
        const eased = progress * progress * (3 - 2 * progress);
        applyProgress(eased);
      },
    };
    for (const panel of panels) panel.userData.interact = record;
    interactions.push(record);
  }

  // ---------- 飘窗 ----------

  for (const bay of BAYS) {
    addBay(bay);
  }

  function addBay(bay) {
    const wall = WALLS.find(
      (w) => w.openings.some((op) => (bay.side === 'west' ? w.o === 'v' : w.o === 'h') && op.from === (bay.z0 ?? bay.x0) && op.bay),
    );
    if (!wall) return;
    const t = wall.t / PX_PER_M;
    const depth = bay.depth / PX_PER_M;
    const h = bay.top - bay.sill;
    const yMid = (bay.sill + bay.top) / 2;
    const fw = 0.06;

    if (bay.side === 'west') {
      const c = mx(wall.at);
      const outerX = c - t / 2;
      const bayOuter = outerX - depth;
      const z0 = mz(bay.z0);
      const z1 = mz(bay.z1);
      const midZ = (z0 + z1) / 2;
      const span = z1 - z0;

      // 台面 / 顶板
      box(depth + 0.15, 0.08, span, doorFrameMat, (outerX + bayOuter) / 2 + 0.05, bay.sill - 0.04, midZ);
      box(depth + 0.15, 0.08, span, ceilMat, (outerX + bayOuter) / 2 + 0.05, bay.top + 0.04, midZ);

      // 外侧玻璃与框
      const gx = bayOuter + 0.035;
      box(0.016, h - 0.1, span - 0.1, glassMat, gx, yMid, midZ, { cast: false, receive: false });
      box(fw, 0.06, span, frameMat, gx, bay.sill + 0.03, midZ);
      box(fw, 0.06, span, frameMat, gx, bay.top - 0.03, midZ);
      for (const zc of [z0 + 0.035, midZ, z1 - 0.035]) box(fw, h, 0.06, frameMat, gx, yMid, zc);

      // 两侧实墙
      for (const zc of [z0 + 0.03, z1 - 0.03]) {
        const side = box(depth + 0.06, h, 0.06, wallMat, (outerX + bayOuter) / 2, yMid, zc);
        scaleWallUVs(side.geometry, depth + 0.06, h, 0.06);
      }
    } else {
      const c = mz(wall.at);
      const outerZ = c + t / 2;
      const bayOuter = outerZ + depth;
      const x0 = mx(bay.x0);
      const x1 = mx(bay.x1);
      const midX = (x0 + x1) / 2;
      const span = x1 - x0;

      box(span, 0.08, depth + 0.15, doorFrameMat, midX, bay.sill - 0.04, (outerZ + bayOuter) / 2 + 0.05);
      box(span, 0.08, depth + 0.15, ceilMat, midX, bay.top + 0.04, (outerZ + bayOuter) / 2 + 0.05);

      const gz = bayOuter - 0.035;
      box(span - 0.1, h - 0.1, 0.016, glassMat, midX, yMid, gz, { cast: false, receive: false });
      box(span, 0.06, fw, frameMat, midX, bay.sill + 0.03, gz);
      box(span, 0.06, fw, frameMat, midX, bay.top - 0.03, gz);
      for (const xc of [x0 + 0.035, midX, x1 - 0.035]) box(0.06, h, fw, frameMat, xc, yMid, gz);

      for (const xc of [x0 + 0.03, x1 - 0.03]) {
        const side = box(0.06, h, depth + 0.06, wallMat, xc, yMid, (outerZ + bayOuter) / 2);
        scaleWallUVs(side.geometry, 0.06, h, depth + 0.06);
      }
    }
  }

  // ---------- 阳台半封闭围护 ----------

  const eastWallT = 0.12;
  const eastWallX = mx(2103) - eastWallT / 2;
  const balconySolid = new THREE.Group();
  const balconyGlass = new THREE.Group();
  balconySolid.name = 'balcony-solid';
  balconyGlass.name = 'balcony-glass';
  root.add(balconySolid, balconyGlass);
  addBalconyEnclosure(eastWallX, eastWallT);

  const balcony = {
    setMode(mode) {
      const solid = mode !== 'glass';
      balconySolid.visible = solid;
      balconyGlass.visible = !solid;
    },
  };

  // 半封闭阳台：两侧实墙，正面可选 1.3m 实墙 + 上方玻璃，或整面落地玻璃
  function addBalconyEnclosure(eastX, eastT) {
    const x0 = mx(1318);
    const x1 = eastX - eastT / 2;
    const z0 = mz(2157);
    const zEnd = mz(2470);
    const southT = 0.12;
    const southZ = zEnd - southT / 2;
    const parapetH = 1.3;
    const top = WALL_H - 0.04;

    // 东侧实墙
    const east = box(eastT, WALL_H, zEnd - z0, wallMat, eastX, WALL_H / 2, (z0 + zEnd) / 2);
    scaleWallUVs(east.geometry, eastT, WALL_H, zEnd - z0);
    addCollider(eastX - eastT / 2, eastX + eastT / 2, z0, zEnd);

    const southSpan = x1 - x0;
    const southMid = (x0 + x1) / 2;

    // 南侧正面矮墙
    const south = box(southSpan, parapetH, southT, wallMat, southMid, parapetH / 2, southZ, { parent: balconySolid });
    scaleWallUVs(south.geometry, southSpan, parapetH, southT);
    addCollider(x0, x1, southZ - southT / 2, southZ + southT / 2);

    addFrontGlazing(balconySolid, x0, x1, southZ, parapetH, top, true);
    addFrontGlazing(balconyGlass, x0, x1, southZ, 0.08, top, false);

    // 北侧与客厅东外墙之间的缺口，补实墙
    const nx0 = mx(2052);
    const notch = box(x1 - nx0, WALL_H, eastT, wallMat, (nx0 + x1) / 2, WALL_H / 2, z0);
    scaleWallUVs(notch.geometry, x1 - nx0, WALL_H, eastT);
    addCollider(nx0, x1, z0 - eastT / 2, z0 + eastT / 2);

    function addFrontGlazing(parent, gx0, gx1, z, base, glassTop, transom) {
      const span = gx1 - gx0;
      const mid = (gx0 + gx1) / 2;
      const yMid = (base + glassTop) / 2;
      const glassH = glassTop - base - 0.12;
      const mullionH = glassTop - base;

      box(span, 0.06, 0.07, frameMat, mid, glassTop, z, { parent });
      box(span, 0.05, 0.07, frameMat, mid, base, z, { parent });
      if (transom) box(span, 0.045, 0.06, frameMat, mid, 2.2, z, { parent });
      const n = Math.max(2, Math.round(span / 1.05));
      for (let i = 0; i <= n; i++) {
        box(0.06, mullionH, 0.06, frameMat, gx0 + (span * i) / n, yMid, z, { parent });
      }
      box(span - 0.12, glassH, 0.014, glassMat, mid, yMid, z, { parent, cast: false, receive: false });
    }
  }

  // ---------- 灯光 ----------

  scene.add(new THREE.AmbientLight(0xfff3e4, 0.08));

  const hemi = new THREE.HemisphereLight(0xdfeaf5, 0x8a7a66, 0.3);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff0d6, 2.2);
  sun.position.set(-8, 15, 18);
  sun.target.position.set(5.2, 0.4, 5.8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -16;
  sun.shadow.camera.right = 16;
  sun.shadow.camera.top = 16;
  sun.shadow.camera.bottom = -16;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 60;
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.025;
  scene.add(sun);
  scene.add(sun.target);

  for (const l of CEILING_LIGHTS) {
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.02, 28), lampMat);
    disc.position.set(l.x, WALL_H - 0.012, l.z);
    root.add(disc);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.175, 0.012, 8, 32), metalMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(l.x, WALL_H - 0.02, l.z);
    root.add(ring);

    const light = new THREE.PointLight(0xffe9cc, l.power * LIGHT_BOOST, 8.5, 2);
    light.position.set(l.x, WALL_H - 0.28, l.z);
    scene.add(light);
  }

  // ---------- 室外 ----------

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(90, 40, 20),
    new THREE.MeshBasicMaterial({ map: skyTexture(), side: THREE.BackSide, fog: false, depthWrite: false }),
  );
  scene.add(sky);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(240, 240),
    new THREE.MeshStandardMaterial({ color: 0x6f7d65, roughness: 1 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.09;
  ground.receiveShadow = true;
  scene.add(ground);

  // ---------- 室外景观 ----------

  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5b4634, roughness: 1 });
  const leafMats = [0x4f7a45, 0x5f8a4e, 0x6d9458].map(
    (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.95 }),
  );
  const treeSpots = [
    [-6.5, 1.5, 1.2], [-8.0, 5.0, 1.35], [-6.8, 9.0, 1.1], [-7.5, 12.5, 1.25],
    [-4.0, 16.0, 1.0], [2.0, 17.0, 1.2], [6.0, 18.5, 1.3], [10.5, 17.5, 1.0],
    [15.5, 12.0, 1.25], [16.0, 7.5, 1.15], [15.0, 3.0, 1.0], [-1.0, -7.0, 1.1],
    [4.0, -8.0, 0.95], [9.0, -7.5, 1.2], [16.0, -3.0, 1.05],
  ];

  for (const [x, z, s] of treeSpots) {
    const tg = new THREE.Group();
    tg.position.set(x, -0.09, z);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.1 * s, 0.15 * s, 2.4 * s, 8), trunkMat);
    trunk.position.y = 1.2 * s;
    trunk.castShadow = true;
    tg.add(trunk);
    const blobs = [
      [0, 2.9, 0, 0.85],
      [0.52, 2.5, 0.2, 0.56],
      [-0.48, 2.55, -0.2, 0.54],
      [0.08, 3.45, -0.1, 0.52],
    ];
    blobs.forEach(([bx, by, bz, br], i) => {
      const leaf = new THREE.Mesh(new THREE.SphereGeometry(br * s, 12, 9), leafMats[i % leafMats.length]);
      leaf.position.set(bx * s, by * s, bz * s);
      leaf.castShadow = true;
      tg.add(leaf);
    });
    scene.add(tg);
  }

  const facadeTex = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = '#9aa3a5';
    g.fillRect(0, 0, 128, 128);
    g.fillStyle = 'rgba(64,80,92,0.4)';
    for (let r = 0; r < 8; r++) {
      for (let col = 0; col < 6; col++) g.fillRect(6 + col * 20, 8 + r * 15, 11, 8);
    }
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    return tex;
  })();

  const buildingSpots = [
    [-62, 46, 30, 20, 18], [-40, 70, 36, 24, 24], [4, 74, 44, 24, 20],
    [52, 60, 32, 22, 22], [64, 12, 28, 20, 16], [-14, -62, 32, 22, 20],
  ];
  for (const [x, z, w, d, h] of buildingSpots) {
    const tex = facadeTex.clone();
    tex.needsUpdate = true;
    tex.repeat.set(Math.max(2, Math.round(w / 7)), Math.max(2, Math.round(h / 6)));
    const b = new THREE.Mesh(
      new THREE.BoxGeometry(w, h, d),
      new THREE.MeshStandardMaterial({ map: tex, color: 0xb9c2c4, roughness: 0.9 }),
    );
    b.position.set(x, h / 2 - 0.09, z);
    b.castShadow = false;
    b.receiveShadow = false;
    scene.add(b);
  }

  return { root, colliders, floorMeshes, wallMeshes, interactions, balcony, updateInteractions };
}
