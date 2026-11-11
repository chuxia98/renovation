import { beforeEach, describe, expect, it } from 'vitest';
import {
  BALCONY_MODES, FLOOR_SIZES, FLOOR_SWATCHES, WALL_SWATCHES, defaultStyle, getRoomStyle,
  getStyleSnapshot, setStyleSnapshot, updateRoom,
} from '../src/style.js';
import { FLOOR_DEFAULTS, WALL_DEFAULT } from '../src/textures.js';
import { ROOMS } from '../src/plan.js';

const HEX = /^#[0-9a-f]{6}$/i;

describe('样式常量', () => {
  it('每种地板都有尺寸档位且面积递增', () => {
    expect(Object.keys(FLOOR_SIZES).sort()).toEqual(Object.keys(FLOOR_DEFAULTS).sort());
    for (const [kind, sizes] of Object.entries(FLOOR_SIZES)) {
      expect(sizes.length, kind).toBeGreaterThan(0);
      const area = (f) => (kind === 'wood' ? f : f.w * f.d);
      expect([...sizes].sort((a, b) => area(a) - area(b)), kind).toEqual(sizes);
      if (kind === 'wood') {
        expect(sizes.every((s) => s > 0), kind).toBe(true);
      } else {
        expect(sizes.every((f) => f.w > 0 && f.d > 0), kind).toBe(true);
      }
    }
  });

  it('地砖规格覆盖常见装修尺寸', () => {
    expect(FLOOR_SIZES.tile).toContainEqual({ w: 0.3, d: 0.3 });
    expect(FLOOR_SIZES.tile).toContainEqual({ w: 0.6, d: 0.6 });
    expect(FLOOR_SIZES.tile).toContainEqual({ w: 0.8, d: 0.8 });
    expect(FLOOR_SIZES.tile).toContainEqual({ w: 0.6, d: 1.2 });
    expect(FLOOR_SIZES.tile).toContainEqual({ w: 0.75, d: 1.5 });
  });

  it('色板与默认值都是合法颜色', () => {
    for (const [kind, colors] of Object.entries(FLOOR_SWATCHES)) {
      expect(FLOOR_SIZES[kind], kind).toBeTruthy();
      for (const c of colors) expect(c, kind).toMatch(HEX);
    }
    for (const c of WALL_SWATCHES) expect(c).toMatch(HEX);
    for (const [kind, cfg] of Object.entries(FLOOR_DEFAULTS)) {
      expect(cfg.color).toMatch(HEX);
      if (kind === 'wood') {
        expect(cfg.size).toBeGreaterThan(0);
      } else {
        expect(cfg.w).toBeGreaterThan(0);
        expect(cfg.d).toBeGreaterThan(0);
      }
    }
    expect(WALL_DEFAULT.color).toMatch(HEX);
  });
});

describe('样式状态', () => {
  beforeEach(() => {
    localStorage.clear();
    setStyleSnapshot(null);
  });

  it('默认样式覆盖全部房间且取值合法', () => {
    const style = defaultStyle();
    for (const room of ROOMS) {
      const s = style[room.id];
      expect(s, room.id).toBeTruthy();
      if (s.floor.kind === 'wood') {
        expect(FLOOR_SIZES.wood, room.id).toContain(s.floor.size);
      } else {
        expect(FLOOR_SIZES[s.floor.kind], room.id).toContainEqual({ w: s.floor.w, d: s.floor.d });
      }
      expect(s.floor.color).toMatch(HEX);
      expect(['paint', 'linen', 'stripe', 'grid']).toContain(s.wall.finish);
      expect(s.wall.color).toMatch(HEX);
    }
    expect(style.bath.floor).toMatchObject({ kind: 'tile', w: 0.3, d: 0.3 });
    expect(style.balcony.floor).toMatchObject({ kind: 'tile', w: 0.3, d: 0.3 });
    expect(style.kitchen.floor).toMatchObject({ kind: 'tile', w: 0.6, d: 0.6 });
  });

  it('updateRoom 只改指定房间并写入快照', () => {
    const masterBefore = getRoomStyle('master');
    updateRoom('living', { floor: { kind: 'tile', color: '#123456', w: 0.6, d: 1.2 } });
    expect(getRoomStyle('living').floor).toEqual({ kind: 'tile', color: '#123456', w: 0.6, d: 1.2 });
    expect(getRoomStyle('master')).toEqual(masterBefore);

    const snap = getStyleSnapshot();
    expect(snap.living.floor.kind).toBe('tile');
    expect(snap.master.floor.kind).not.toBe('tile');
  });

  it('阳台围护默认实墙且可切换', () => {
    expect(defaultStyle().balcony.enclosure).toBe('solid');
    expect(BALCONY_MODES).toContain('glass');
    updateRoom('balcony', { enclosure: 'glass' });
    expect(getRoomStyle('balcony').enclosure).toBe('glass');
    expect(getStyleSnapshot().balcony.enclosure).toBe('glass');
    setStyleSnapshot(null);
    expect(getRoomStyle('balcony').enclosure).toBe('solid');
  });

  it('快照往返保持样式', () => {
    updateRoom('bath', { wall: { finish: 'grid', color: '#abcdef' } });
    const snap = getStyleSnapshot();
    setStyleSnapshot(null);
    expect(getRoomStyle('bath').wall.finish).not.toBe('grid');
    setStyleSnapshot(snap);
    expect(getRoomStyle('bath').wall).toEqual({ finish: 'grid', color: '#abcdef' });
  });
});
