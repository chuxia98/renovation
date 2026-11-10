import { beforeEach, describe, expect, it } from 'vitest';
import {
  FLOOR_SIZES, FLOOR_SWATCHES, WALL_SWATCHES, defaultStyle, getRoomStyle,
  getStyleSnapshot, setStyleSnapshot, updateRoom,
} from '../src/style.js';
import { FLOOR_DEFAULTS, WALL_DEFAULT } from '../src/textures.js';
import { ROOMS } from '../src/plan.js';

const HEX = /^#[0-9a-f]{6}$/i;

describe('样式常量', () => {
  it('每种地板都有尺寸档位且递增', () => {
    expect(Object.keys(FLOOR_SIZES).sort()).toEqual(Object.keys(FLOOR_DEFAULTS).sort());
    for (const [kind, sizes] of Object.entries(FLOOR_SIZES)) {
      expect(sizes.length, kind).toBeGreaterThan(0);
      const sorted = [...sizes].sort((a, b) => a - b);
      expect(sizes, kind).toEqual(sorted);
      expect(sizes.every((s) => s > 0), kind).toBe(true);
    }
  });

  it('色板与默认值都是合法颜色', () => {
    for (const [kind, colors] of Object.entries(FLOOR_SWATCHES)) {
      expect(FLOOR_SIZES[kind], kind).toBeTruthy();
      for (const c of colors) expect(c, kind).toMatch(HEX);
    }
    for (const c of WALL_SWATCHES) expect(c).toMatch(HEX);
    for (const cfg of Object.values(FLOOR_DEFAULTS)) {
      expect(cfg.color).toMatch(HEX);
      expect(cfg.size).toBeGreaterThan(0);
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
      expect(FLOOR_SIZES[s.floor.kind], room.id).toContain(s.floor.size);
      expect(s.floor.color).toMatch(HEX);
      expect(['paint', 'linen', 'stripe', 'grid']).toContain(s.wall.finish);
      expect(s.wall.color).toMatch(HEX);
    }
  });

  it('updateRoom 只改指定房间并写入快照', () => {
    const masterBefore = getRoomStyle('master');
    updateRoom('living', { floor: { kind: 'tile', color: '#123456', size: 0.6 } });
    expect(getRoomStyle('living').floor).toEqual({ kind: 'tile', color: '#123456', size: 0.6 });
    expect(getRoomStyle('master')).toEqual(masterBefore);

    const snap = getStyleSnapshot();
    expect(snap.living.floor.kind).toBe('tile');
    expect(snap.master.floor.kind).not.toBe('tile');
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
