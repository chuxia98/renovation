import { describe, expect, it } from 'vitest';
import {
  BAYS, CEILING_LIGHTS, FLOORS, ORIGIN_PX, PX_PER_M, ROOMS, START, WALLS, WALL_H, mx, mz,
} from '../src/plan.js';
import { DICT } from '../src/i18n.js';

const FLOOR_KINDS = ['wood', 'tile', 'stone'];

describe('户型基础数据', () => {
  it('比例与原点有效', () => {
    expect(PX_PER_M).toBeGreaterThan(0);
    expect(ORIGIN_PX.x).toBeGreaterThan(0);
    expect(ORIGIN_PX.y).toBeGreaterThan(0);
    expect(WALL_H).toBeGreaterThan(2);
  });

  it('像素到米换算正确', () => {
    expect(mx(ORIGIN_PX.x)).toBe(0);
    expect(mz(ORIGIN_PX.y)).toBe(0);
    expect(mx(ORIGIN_PX.x + PX_PER_M)).toBeCloseTo(1, 6);
  });
});

describe('房间与地面', () => {
  it('房间 id 唯一且都有中英文名称', () => {
    const ids = ROOMS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      expect(DICT.en[`room.${id}`], `room.${id} en`).toBeTruthy();
      expect(DICT.zh[`room.${id}`], `room.${id} zh`).toBeTruthy();
    }
  });

  it('每个地面都有合法矩形、材质与所属房间', () => {
    expect(FLOORS.length).toBeGreaterThan(0);
    const ids = new Set(ROOMS.map((r) => r.id));
    for (const f of FLOORS) {
      expect(f.x2, `floor ${f.room}`).toBeGreaterThan(f.x1);
      expect(f.z2, `floor ${f.room}`).toBeGreaterThan(f.z1);
      expect(FLOOR_KINDS, `floor ${f.room} 材质`).toContain(f.mat);
      expect(ids.has(f.room), `floor ${f.room} 未登记房间`).toBe(true);
    }
  });

  it('每个房间至少有一块地面', () => {
    for (const r of ROOMS) {
      expect(FLOORS.some((f) => f.room === r.id), `room ${r.id} 缺地面`).toBe(true);
    }
  });

  it('出生点位于地面范围内', () => {
    const inside = FLOORS.some((f) => (
      START.x >= mx(f.x1) && START.x <= mx(f.x2) && START.z >= mz(f.z1) && START.z <= mz(f.z2)
    ));
    expect(inside).toBe(true);
  });
});

describe('墙体与门窗', () => {
  it('墙体走向与尺寸合法', () => {
    expect(WALLS.length).toBeGreaterThan(0);
    for (const w of WALLS) {
      expect(['v', 'h']).toContain(w.o);
      expect(w.to).toBeGreaterThan(w.from);
      expect(w.t).toBeGreaterThan(0);
      expect(typeof w.at).toBe('number');
    }
  });

  it('门窗洞落在墙段内且高度合理', () => {
    for (const w of WALLS) {
      for (const o of w.openings) {
        expect(o.from, `${w.o}@${w.at}`).toBeGreaterThanOrEqual(w.from);
        expect(o.to, `${w.o}@${w.at}`).toBeLessThanOrEqual(w.to);
        expect(o.to).toBeGreaterThan(o.from);
        expect(o.sill).toBeGreaterThanOrEqual(0);
        expect(o.top).toBeGreaterThan(o.sill);
        expect(['window', 'door', 'slider']).toContain(o.kind);
      }
    }
  });

  it('飘窗与吸顶灯数据完整', () => {
    expect(BAYS.length).toBeGreaterThan(0);
    for (const b of BAYS) {
      expect(['west', 'east', 'south', 'north']).toContain(b.side);
      expect(b.depth).toBeGreaterThan(0);
      expect(b.top).toBeGreaterThan(b.sill);
    }
    expect(CEILING_LIGHTS.length).toBeGreaterThan(0);
    for (const l of CEILING_LIGHTS) {
      expect(Number.isFinite(l.x)).toBe(true);
      expect(Number.isFinite(l.z)).toBe(true);
      expect(l.power).toBeGreaterThan(0);
    }
  });
});
