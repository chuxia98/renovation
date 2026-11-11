import * as THREE from 'three';

const EYE = 1.62;
const RADIUS = 0.26;
const WALK = 2.7;
const SPRINT = 4.6;
const SENS = 0.0022;

export class PlayerControls {
  constructor(camera, dom, colliders, spawn) {
    this.camera = camera;
    this.dom = dom;
    this.colliders = colliders;
    this.pos = new THREE.Vector3(spawn.x, EYE, spawn.z);
    this.yaw = spawn.yaw ?? 0;
    this.pitch = spawn.pitch ?? 0;
    this.velX = 0;
    this.velZ = 0;
    this.bob = 0;
    this.locked = false;
    this.enabled = true;
    this.lookOnly = false;
    this.keys = new Set();
    this.onLockChange = null;
    this.onLockError = null;
    this.dragging = false;
    this.dragX = 0;
    this.dragY = 0;
    this.dragId = null;
    this.touchX = 0;
    this.touchY = 0;

    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === this.dom;
      if (!this.locked) this.keys.clear();
      this.onLockChange?.(this.locked);
    });

    document.addEventListener('pointerlockerror', () => this.onLockError?.());

    // 浏览器不允许指针锁定时（如内嵌 iframe），按住拖拽同样可以转动视角；
    // 触屏只跟踪第一根手指，避免多指时视角跳动
    dom.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || this.locked || !this.enabled || this.dragId !== null) return;
      this.dragging = true;
      this.dragId = e.pointerId;
      this.dragX = e.clientX;
      this.dragY = e.clientY;
    });
    const endDrag = (e) => {
      if (e.pointerId !== this.dragId) return;
      this.dragging = false;
      this.dragId = null;
    };
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);

    window.addEventListener('pointermove', (e) => {
      if (!this.enabled) return;
      let dx;
      let dy;
      if (this.locked) {
        dx = e.movementX;
        dy = e.movementY;
      } else if (this.dragging && e.pointerId === this.dragId) {
        dx = e.clientX - this.dragX;
        dy = e.clientY - this.dragY;
        this.dragX = e.clientX;
        this.dragY = e.clientY;
      } else {
        return;
      }
      this.yaw -= dx * SENS;
      this.pitch -= dy * SENS;
      this.pitch = Math.max(-1.45, Math.min(1.45, this.pitch));
    });

    window.addEventListener('keydown', (e) => {
      this.keys.add(e.code);
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.dragging = false;
      this.dragId = null;
      this.touchX = 0;
      this.touchY = 0;
    });

    camera.rotation.order = 'YXZ';
    this.camera.position.set(this.pos.x, EYE, this.pos.z);
    this.camera.rotation.set(this.pitch, this.yaw, 0);
  }

  lock() {
    const p = this.dom.requestPointerLock?.();
    if (p && typeof p.catch === 'function') p.catch(() => {});
  }

  unlock() {
    if (document.pointerLockElement === this.dom) document.exitPointerLock();
  }

  // 虚拟摇杆：x 为右向，y 为前向，范围 -1..1
  setTouchInput(x, y) {
    this.touchX = x;
    this.touchY = y;
  }

  hit(x, z) {
    const r = RADIUS;
    for (const c of this.colliders) {
      if (c.enabled === false) continue;
      if (x > c.minX - r && x < c.maxX + r && z > c.minZ - r && z < c.maxZ + r) return true;
    }
    return false;
  }

  move(dx, dz) {
    const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dz)) / 0.08));
    const sx = dx / steps;
    const sz = dz / steps;
    for (let i = 0; i < steps; i++) {
      if (!this.hit(this.pos.x + sx, this.pos.z)) this.pos.x += sx;
      if (!this.hit(this.pos.x, this.pos.z + sz)) this.pos.z += sz;
    }
  }

  update(dt) {
    dt = Math.min(dt, 0.05);

    let forward = 0;
    let strafe = 0;
    if (this.enabled && !this.lookOnly) {
      if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) forward += 1;
      if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) forward -= 1;
      if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) strafe += 1;
      if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) strafe -= 1;
      forward += this.touchY;
      strafe += this.touchX;
    }

    const mag = Math.hypot(forward, strafe);
    if (mag > 1) {
      forward /= mag;
      strafe /= mag;
    }

    const speed = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight') ? SPRINT : WALK;
    const sy = Math.sin(this.yaw);
    const cy = Math.cos(this.yaw);
    const targetX = (-sy * forward + cy * strafe) * speed;
    const targetZ = (-cy * forward - sy * strafe) * speed;

    const k = Math.min(1, dt * 11);
    this.velX += (targetX - this.velX) * k;
    this.velZ += (targetZ - this.velZ) * k;

    if (Math.abs(this.velX) > 0.001 || Math.abs(this.velZ) > 0.001) {
      this.move(this.velX * dt, this.velZ * dt);
    }

    const planar = Math.hypot(this.velX, this.velZ);
    if (planar > 0.2 && this.enabled) {
      this.bob += dt * planar * 2.6;
    }
    const bobY = Math.sin(this.bob * Math.PI) * 0.022 * Math.min(1, planar / WALK);

    this.camera.position.set(this.pos.x, EYE + bobY, this.pos.z);
    this.camera.rotation.set(this.pitch, this.yaw, 0);
  }
}
