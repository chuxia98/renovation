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
    this.keys = new Set();
    this.onLockChange = null;
    this.onLockError = null;
    this.dragging = false;
    this.dragX = 0;
    this.dragY = 0;

    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === this.dom;
      if (!this.locked) this.keys.clear();
      this.onLockChange?.(this.locked);
    });

    document.addEventListener('pointerlockerror', () => this.onLockError?.());

    // 浏览器不允许指针锁定时（如内嵌 iframe），按住左键拖拽同样可以转动视角
    dom.addEventListener('pointerdown', (e) => {
      if (e.button !== 0 || this.locked || !this.enabled) return;
      this.dragging = true;
      this.dragX = e.clientX;
      this.dragY = e.clientY;
    });
    window.addEventListener('pointerup', () => {
      this.dragging = false;
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.enabled) return;
      let dx;
      let dy;
      if (this.locked) {
        dx = e.movementX;
        dy = e.movementY;
      } else if (this.dragging) {
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

  hit(x, z) {
    const r = RADIUS;
    for (const c of this.colliders) {
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
    if (this.enabled) {
      if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) forward += 1;
      if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) forward -= 1;
      if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) strafe += 1;
      if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) strafe -= 1;
    }

    if (forward !== 0 && strafe !== 0) {
      const inv = Math.SQRT1_2;
      forward *= inv;
      strafe *= inv;
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
