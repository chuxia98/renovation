import { describe, expect, it } from 'vitest';
import { CATALOG, catalogItem, createFurniture } from '../src/furniture.js';
import { DICT } from '../src/i18n.js';

describe('家具目录', () => {
  it('id 唯一且尺寸为正', () => {
    const ids = CATALOG.map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(CATALOG.length).toBeGreaterThan(0);
    for (const item of CATALOG) {
      expect(item.w).toBeGreaterThan(0);
      expect(item.d).toBeGreaterThan(0);
      expect(typeof item.build).toBe('function');
    }
  });

  it('每件家具都有中英文名称', () => {
    for (const item of CATALOG) {
      expect(DICT.en[`catalog.${item.id}`], `catalog.${item.id} en`).toBeTruthy();
      expect(DICT.zh[`catalog.${item.id}`], `catalog.${item.id} zh`).toBeTruthy();
    }
  });

  it('catalogItem 按 id 查找', () => {
    const first = CATALOG[0];
    expect(catalogItem(first.id)).toBe(first);
    expect(catalogItem('missing')).toBeUndefined();
  });

  it('每件家具都能生成包含网格的模型', () => {
    for (const item of CATALOG) {
      const group = createFurniture(item.id);
      expect(group.isGroup, item.id).toBe(true);
      expect(group.children.length, item.id).toBeGreaterThan(0);
    }
  });
});
