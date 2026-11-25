import { describe, expect, it } from 'vitest';
import { daylightState, formatHour, wrapHour } from '../src/core/dayNight.js';

describe('日夜交替', () => {
  it('时间在 0–24 之间环绕', () => {
    expect(wrapHour(24)).toBe(0);
    expect(wrapHour(-3)).toBe(21);
    expect(wrapHour(30)).toBe(6);
    expect(formatHour(6.25)).toBe('06:15');
    expect(formatHour(24)).toBe('00:00');
    expect(formatHour(-0.5)).toBe('23:30');
  });

  it('正午最亮，太阳在南侧最高处', () => {
    const noon = daylightState(12);
    expect(noon.daylight).toBe(1);
    expect(noon.sun.intensity).toBeCloseTo(1.7);
    expect(noon.sun.y).toBeGreaterThan(19);
    expect(noon.sun.x).toBeCloseTo(5.2, 5);
    expect(noon.sun.z).toBeGreaterThan(5.8);
    expect(noon.lampBoost).toBe(1);
  });

  it('15:00 太阳在西南，与默认机位光线一致', () => {
    const s = daylightState(15);
    expect(s.daylight).toBe(1);
    expect(s.dusk).toBe(0);
    expect(s.sun.x).toBeLessThan(5.2);
    expect(s.sun.z).toBeGreaterThan(5.8);
    expect(s.sun.y).toBeGreaterThan(5.8);
    expect(s.windowPower).toBeCloseTo(3);
    expect(s.skyColor.getHex()).toBe(0xffffff);
  });

  it('日出日落附近出现暖色暮光，太阳强度压低', () => {
    const dusk = daylightState(17.8);
    expect(dusk.dusk).toBeGreaterThan(0.3);
    expect(dusk.sun.intensity).toBeLessThan(0.4);
    expect(dusk.skyColor.r).toBeGreaterThan(dusk.skyColor.b);
    expect(dusk.windowColor.r).toBeGreaterThan(dusk.windowColor.b);
  });

  it('夜间没有日照，靠顶灯照明', () => {
    const night = daylightState(0);
    expect(night.daylight).toBe(0);
    expect(night.sun.intensity).toBe(0);
    expect(night.windowPower).toBe(0);
    expect(night.lampBoost).toBeGreaterThan(1.5);
    expect(night.skyColor.r).toBeLessThan(0.1);
    expect(night.envIntensity).toBeLessThan(0.1);
  });

  it('跨过 24 点后状态连续', () => {
    const a = daylightState(0);
    const b = daylightState(24);
    expect(b.sun).toEqual(a.sun);
    expect(b.skyColor.equals(a.skyColor)).toBe(true);
    expect(b.daylight).toBe(a.daylight);
  });
});