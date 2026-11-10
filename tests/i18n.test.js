import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DICT, LANGS, getLang, onLangChange, setLang, t } from '../src/i18n.js';

const keysOf = (table) => Object.keys(table).sort();
const varsOf = (str) => [...str.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('语言字典', () => {
  it('中英文 key 完全一致', () => {
    expect(keysOf(DICT.zh)).toEqual(keysOf(DICT.en));
  });

  it('每条文案非空且占位符一致', () => {
    for (const key of keysOf(DICT.en)) {
      expect(DICT.en[key].trim(), `en ${key}`).not.toBe('');
      expect(DICT.zh[key].trim(), `zh ${key}`).not.toBe('');
      expect(varsOf(DICT.zh[key]), `zh ${key} 占位符`).toEqual(varsOf(DICT.en[key]));
    }
  });

  it('语言列表与下拉选项一致', () => {
    expect(LANGS.map((l) => l.id)).toEqual(['en', 'zh']);
  });
});

describe('t()', () => {
  beforeEach(() => {
    setLang('en');
  });

  it('按当前语言返回文案', () => {
    expect(t('settings.title')).toBe(DICT.en['settings.title']);
    setLang('zh');
    expect(t('settings.title')).toBe(DICT.zh['settings.title']);
    setLang('en');
  });

  it('替换全部占位符', () => {
    setLang('zh');
    const expected = DICT.zh['toast.placed'].split('{name}').join('沙发').split('{n}').join('2');
    expect(t('toast.placed', { name: '沙发', n: 2 })).toBe(expected);
    setLang('en');
  });

  it('多个同名占位符也全部替换', () => {
    const expected = DICT.en['scheme.confirmDelete'].split('{name}').join('A');
    expect(t('scheme.confirmDelete', { name: 'A' })).toBe(expected);
  });

  it('未知 key 原样返回', () => {
    expect(t('missing.key')).toBe('missing.key');
  });
});

describe('setLang()', () => {
  beforeEach(() => {
    setLang('en');
    localStorage.clear();
  });

  it('持久化并同步 <html lang>', () => {
    setLang('zh');
    expect(getLang()).toBe('zh');
    expect(localStorage.getItem('hourse-lang-v1')).toBe('zh');
    expect(document.documentElement.lang).toBe('zh');

    setLang('en');
    expect(getLang()).toBe('en');
    expect(localStorage.getItem('hourse-lang-v1')).toBe('en');
    expect(document.documentElement.lang).toBe('en');
  });

  it('通知监听器', () => {
    const seen = [];
    onLangChange((lang) => seen.push(lang));
    setLang('zh');
    setLang('en');
    expect(seen).toEqual(['zh', 'en']);
  });

  it('忽略不支持的语言', () => {
    setLang('fr');
    expect(getLang()).toBe('en');
  });
});

describe('detectLang()', () => {
  it('优先读取已保存的语言', async () => {
    vi.resetModules();
    localStorage.setItem('hourse-lang-v1', 'zh');
    const mod = await import('../src/i18n.js');
    expect(mod.getLang()).toBe('zh');
    localStorage.clear();
  });

  it('未保存时跟随中文浏览器', async () => {
    vi.resetModules();
    localStorage.clear();
    vi.stubGlobal('navigator', { language: 'zh-CN' });
    const mod = await import('../src/i18n.js');
    expect(mod.getLang()).toBe('zh');
    vi.unstubAllGlobals();
  });

  it('其他浏览器语言回落英文', async () => {
    vi.resetModules();
    localStorage.clear();
    vi.stubGlobal('navigator', { language: 'de-DE' });
    const mod = await import('../src/i18n.js');
    expect(mod.getLang()).toBe('en');
    vi.unstubAllGlobals();
  });
});
