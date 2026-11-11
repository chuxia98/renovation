import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  CATALOG, catalogItem, catalogVariants, furnitureVariant, createFurniture,
} from '../src/furniture.js';
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

  it('每款家具都能生成包含网格的模型', () => {
    for (const item of CATALOG) {
      for (const variant of catalogVariants(item)) {
        const group = createFurniture(item.id, variant.id);
        expect(group.isGroup, `${item.id}/${variant.id}`).toBe(true);
        expect(group.children.length, `${item.id}/${variant.id}`).toBeGreaterThan(0);
        expect(group.userData.footprint.w, `${item.id}/${variant.id}`).toBe(variant.w);
        expect(group.userData.footprint.d, `${item.id}/${variant.id}`).toBe(variant.d);
        expect(group.userData.variant).toBe(variant.id);
      }
    }
  });

  it('款式模型几何有效（有限、落地、有高度）', () => {
    for (const item of CATALOG) {
      for (const variant of catalogVariants(item)) {
        const box = new THREE.Box3().setFromObject(createFurniture(item.id, variant.id));
        const tag = `${item.id}/${variant.id}`;
        expect(box.isEmpty(), tag).toBe(false);
        expect(Number.isFinite(box.max.y), tag).toBe(true);
        expect(box.min.y, tag).toBeGreaterThanOrEqual(-0.05);
        expect(box.max.y, tag).toBeGreaterThan(0.005);
        expect(box.max.y, tag).toBeLessThan(3);
      }
    }
  });

  it('款式 id 在同一件家具内唯一且尺寸为正', () => {
    for (const item of CATALOG) {
      if (!item.variants) continue;
      expect(item.variants.length, item.id).toBeGreaterThan(1);
      const ids = item.variants.map((v) => v.id);
      expect(new Set(ids).size, item.id).toBe(ids.length);
      for (const v of item.variants) {
        expect(v.w, `${item.id}/${v.id}`).toBeGreaterThan(0);
        expect(v.d, `${item.id}/${v.id}`).toBeGreaterThan(0);
        expect(typeof v.build, `${item.id}/${v.id}`).toBe('function');
      }
    }
  });

  it('每款款式都有中英文名称', () => {
    for (const item of CATALOG) {
      if (!item.variants) continue;
      for (const v of item.variants) {
        const key = `variant.${item.id}.${v.id}`;
        expect(DICT.en[key], `${key} en`).toBeTruthy();
        expect(DICT.zh[key], `${key} zh`).toBeTruthy();
      }
    }
  });

  it('未指定或无效款式时回落到默认款', () => {
    for (const item of CATALOG) {
      const fallback = furnitureVariant(item.id, 'missing');
      expect(fallback).toEqual(catalogVariants(item)[0]);
      const group = createFurniture(item.id, 'missing');
      expect(group.userData.variant).toBe(fallback.id);
    }
    expect(furnitureVariant('missing', 'x')).toBeNull();
  });
});
