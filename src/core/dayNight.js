import * as THREE from 'three';

export const DAYLIGHT_KEY = 'hourse-daylight-v1';

// 6:00 日出、18:00 日落；正午太阳在南侧仰角 60°
const SUNRISE = 6;
const MAX_ELEVATION = THREE.MathUtils.degToRad(60);
const SUN_TARGET = new THREE.Vector3(5.2, 0.4, 5.8);
const SUN_DISTANCE = 22;
const CYCLE_SECONDS = 180;
const DEFAULT_HOUR = 15;

const BASE_SUN = 1.7;
const BASE_HEMI = 0.18;
const BASE_AMBIENT = 0.05;
const BASE_ENV = 0.2;
const BASE_WINDOW = 3.0;
const BASE_LAMP_GLOW = 2.2;

const C = {
  sunHigh: new THREE.Color(0xfff0d6),
  sunLow: new THREE.Color(0xffa766),
  skyDay: new THREE.Color(0xffffff),
  skyDusk: new THREE.Color(0xffc39c),
  skyNight: new THREE.Color(0x27384f),
  fogDay: new THREE.Color(0xe4edf2),
  fogDusk: new THREE.Color(0xe7c9ab),
  fogNight: new THREE.Color(0x0f1823),
  hemiSkyDay: new THREE.Color(0xdfeaf5),
  hemiSkyNight: new THREE.Color(0x33465f),
  hemiGroundDay: new THREE.Color(0x8a7a66),
  hemiGroundNight: new THREE.Color(0x171c23),
  windowDay: new THREE.Color(0xe4edf9),
  windowDusk: new THREE.Color(0xffb27a),
};

function smoothstep(edge0, edge1, x) {
  const t = THREE.MathUtils.clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

export function wrapHour(hour) {
  return ((hour % 24) + 24) % 24;
}

export function formatHour(hour) {
  const total = Math.round(wrapHour(hour) * 60) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

// 纯函数：给定时刻（0–24）返回整场景的日照参数，便于测试与调参
export function daylightState(hour) {
  const h = wrapHour(hour);
  // 6:00 东 → 12:00 南 → 18:00 西 → 0:00 北
  const a = ((h - SUNRISE) / 24) * Math.PI * 2;
  const elevation = Math.sin(a) * MAX_ELEVATION;
  const elevationDeg = THREE.MathUtils.radToDeg(elevation);

  const daylight = smoothstep(1, 14, elevationDeg);
  // 地平线附近冷暖交界最明显，正午归零
  const dusk = smoothstep(-3, 4, elevationDeg) * (1 - smoothstep(4, 26, elevationDeg));

  const horizontal = Math.cos(elevation) * SUN_DISTANCE;
  const sunPos = {
    x: SUN_TARGET.x + Math.cos(a) * horizontal,
    y: SUN_TARGET.y + Math.sin(elevation) * SUN_DISTANCE,
    z: SUN_TARGET.z + Math.sin(a) * horizontal,
  };

  return {
    hour: h,
    daylight,
    dusk,
    sun: {
      ...sunPos,
      intensity: BASE_SUN * daylight,
      color: C.sunLow.clone().lerp(C.sunHigh, smoothstep(6, 28, elevationDeg)),
    },
    skyColor: C.skyNight.clone().lerp(C.skyDay, daylight).lerp(C.skyDusk, dusk),
    fogColor: C.fogNight.clone().lerp(C.fogDay, daylight).lerp(C.fogDusk, dusk),
    hemiSky: C.hemiSkyNight.clone().lerp(C.hemiSkyDay, daylight),
    hemiGround: C.hemiGroundNight.clone().lerp(C.hemiGroundDay, daylight),
    hemiIntensity: BASE_HEMI * daylight + 0.05,
    ambientIntensity: BASE_AMBIENT * daylight + 0.03,
    envIntensity: BASE_ENV * daylight + 0.04,
    windowColor: C.windowDay.clone().lerp(C.windowDusk, dusk),
    windowPower: BASE_WINDOW * smoothstep(-1, 8, elevationDeg),
    lampBoost: 1 + 0.6 * (1 - daylight),
    lampGlow: BASE_LAMP_GLOW * (0.85 + 0.55 * (1 - daylight)),
  };
}

export function createDayNight({ scene, sun, hemi, ambient, sky, daylightLights, ceilingLights, lampMat, ceilMat }) {
  const listeners = new Set();
  let hour = DEFAULT_HOUR;
  let auto = false;
  let lastEmitHour = -1;

  try {
    const data = JSON.parse(localStorage.getItem(DAYLIGHT_KEY) || 'null');
    if (Number.isFinite(data?.hour)) hour = wrapHour(data.hour);
    auto = data?.auto === true;
  } catch {
    // 存档损坏时回到默认时间
  }

  function apply() {
    const s = daylightState(hour);
    sun.position.set(s.sun.x, s.sun.y, s.sun.z);
    sun.color.copy(s.sun.color);
    sun.intensity = s.sun.intensity;

    hemi.color.copy(s.hemiSky);
    hemi.groundColor.copy(s.hemiGround);
    hemi.intensity = s.hemiIntensity;
    ambient.intensity = s.ambientIntensity;

    sky.material.color.copy(s.skyColor);
    scene.fog.color.copy(s.fogColor);
    scene.environmentIntensity = s.envIntensity;

    for (const l of daylightLights) {
      l.color.copy(s.windowColor);
      l.intensity = l.userData.basePower * (s.windowPower / BASE_WINDOW);
    }
    for (const l of ceilingLights) {
      l.intensity = l.userData.basePower * s.lampBoost;
    }
    lampMat.emissiveIntensity = s.lampGlow;
    // 吊顶自发光在白天补足漫反射，夜里压低，避免开灯后顶面像白天一样亮
    ceilMat.emissiveIntensity = 0.14 * (0.3 + 0.7 * s.daylight);
  }

  function emit(force = false) {
    // 自动循环每帧推进；面板读数只需分钟级刷新，避免 60fps 写 DOM
    if (!force && Math.abs(hour - lastEmitHour) < 1 / 240) return;
    lastEmitHour = hour;
    for (const fn of listeners) fn(hour, auto);
  }

  function save() {
    try {
      localStorage.setItem(DAYLIGHT_KEY, JSON.stringify({ hour: +hour.toFixed(3), auto }));
    } catch {
      // localStorage 不可用时静默跳过
    }
  }

  function setHour(value) {
    const v = Number(value);
    if (!Number.isFinite(v)) return;
    hour = wrapHour(v);
    apply();
    emit(true);
    save();
  }

  function setAuto(value) {
    auto = !!value;
    save();
    emit(true);
  }

  function update(dt) {
    if (!auto) return;
    hour = wrapHour(hour + (dt * 24) / CYCLE_SECONDS);
    apply();
    emit();
  }

  function onChange(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  window.addEventListener('pagehide', save);
  apply();

  return {
    get hour() { return hour; },
    get auto() { return auto; },
    setHour,
    setAuto,
    update,
    onChange,
  };
}