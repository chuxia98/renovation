import * as THREE from 'three';
import {
  sofaStraight, sofaCorner,
  armchairLounge, armchairShell, armchairRattan,
  chairFabric, chairWood, chairRattan,
} from './seating.js';
import {
  coffeeRect, coffeeRound, coffeeNesting,
  tvStorage, tvFloating, tvLong,
  diningRect, diningRoundLegs, diningRound, diningOval,
  deskLegs, deskPedestal,
  bookshelfOpen, bookshelfLadder, bookshelfCabinet,
} from './tables.js';
import {
  bedWood, bedUpholstered, bedFloating,
  nightstandDrawer, nightstandRound, nightstandOpen,
  wardrobeFlat, wardrobeSlat, wardrobeGlass,
} from './bedroom.js';
import { fridge, counter, toiletStandard, toiletSmart, toiletWall, washbasin, shower } from './kitchenBath.js';
import { rug, floorLamp, plant } from './decor.js';

const V = (id, w, d, build) => ({ id, w, d, build });
const bedVariants = (w, l) => [
  V('wood', w, l, () => bedWood(w, l)),
  V('upholstered', w, l, () => bedUpholstered(w, l)),
  V('floating', w, l, () => bedFloating(w, l)),
];

export const CATALOG = [
  {
    id: 'sofa',
    variants: [
      V('straight', 2.1, 1.0, () => sofaStraight(2.1, 2)),
      V('corner', 2.6, 1.7, sofaCorner),
      V('loveseat', 1.6, 0.76, () => sofaStraight(1.6, 1)),
    ],
  },
  {
    id: 'armchair',
    variants: [
      V('lounge', 0.85, 1.0, armchairLounge),
      V('shell', 0.8, 0.56, armchairShell),
      V('rattan', 0.76, 0.74, armchairRattan),
    ],
  },
  {
    id: 'coffee',
    variants: [
      V('rect', 1.1, 0.55, coffeeRect),
      V('round', 0.9, 0.9, coffeeRound),
      V('nesting', 1.2, 0.9, coffeeNesting),
    ],
  },
  {
    id: 'tv',
    variants: [
      V('storage', 1.8, 0.4, tvStorage),
      V('floating', 1.8, 0.34, tvFloating),
      V('long', 2.4, 0.5, tvLong),
    ],
  },
  { id: 'rug', w: 2.4, d: 1.6, build: rug, flat: true },
  {
    id: 'dining',
    variants: [
      V('rect', 1.4, 0.85, diningRect),
      V('round', 1.1, 1.1, diningRoundLegs),
      V('pedestal', 1.1, 1.1, diningRound),
      V('oval', 1.5, 0.9, diningOval),
    ],
  },
  {
    id: 'chair',
    variants: [
      V('fabric', 0.45, 0.6, chairFabric),
      V('wood', 0.46, 0.5, chairWood),
      V('rattan', 0.46, 0.5, chairRattan),
    ],
  },
  { id: 'bed', variants: bedVariants(1.8, 2.05) },
  { id: 'singlebed', variants: bedVariants(1.2, 1.95) },
  {
    id: 'nightstand',
    variants: [
      V('drawer', 0.45, 0.4, nightstandDrawer),
      V('round', 0.44, 0.44, nightstandRound),
      V('open', 0.45, 0.38, nightstandOpen),
    ],
  },
  {
    id: 'wardrobe',
    variants: [
      V('flat', 1.6, 0.6, wardrobeFlat),
      V('slat', 1.6, 0.6, wardrobeSlat),
      V('glass', 1.6, 0.6, wardrobeGlass),
    ],
  },
  {
    id: 'desk',
    variants: [
      V('legs', 1.2, 0.6, deskLegs),
      V('pedestal', 1.2, 0.6, deskPedestal),
    ],
  },
  {
    id: 'shelf',
    variants: [
      V('open', 0.9, 0.24, bookshelfOpen),
      V('ladder', 0.72, 0.5, bookshelfLadder),
      V('cabinet', 1.0, 0.38, bookshelfCabinet),
    ],
  },
  { id: 'lamp', w: 0.4, d: 0.4, build: floorLamp },
  { id: 'plant', w: 0.6, d: 0.56, build: plant },
  { id: 'fridge', w: 0.7, d: 0.65, build: fridge },
  { id: 'counter', w: 1.8, d: 0.6, build: counter },
  {
    id: 'toilet',
    variants: [
      V('standard', 0.42, 0.7, toiletStandard),
      V('smart', 0.42, 0.72, toiletSmart),
      V('wall', 0.5, 0.62, toiletWall),
    ],
  },
  { id: 'washbasin', w: 1.0, d: 0.52, build: washbasin },
  { id: 'shower', w: 0.9, d: 0.9, build: shower },
];

// 默认款 = 第一款，占用尺寸跟着默认款走
for (const item of CATALOG) {
  if (!item.variants) continue;
  const [first] = item.variants;
  item.w = first.w;
  item.d = first.d;
  item.build = first.build;
}

const BY_ID = new Map(CATALOG.map((item) => [item.id, item]));

export function catalogItem(id) {
  return BY_ID.get(id);
}

export function catalogVariants(item) {
  return item.variants ?? [{ id: '', w: item.w, d: item.d, build: item.build }];
}

export function furnitureVariant(id, variantId) {
  const item = BY_ID.get(id);
  if (!item) return null;
  return catalogVariants(item).find((v) => v.id === variantId) ?? catalogVariants(item)[0];
}

export function createFurniture(id, variantId) {
  const item = BY_ID.get(id);
  if (!item) return null;
  const variant = furnitureVariant(id, variantId);
  const group = variant.build();
  group.userData.footprint = { w: variant.w, d: variant.d, flat: !!item.flat };
  group.userData.variant = variant.id;
  return group;
}

const GHOST_OK = new THREE.MeshBasicMaterial({ color: 0x74e8b8, transparent: true, opacity: 0.42, depthWrite: false });
const GHOST_BAD = new THREE.MeshBasicMaterial({ color: 0xff6b6b, transparent: true, opacity: 0.42, depthWrite: false });

export function applyGhostMaterial(group, valid) {
  const mat = valid ? GHOST_OK : GHOST_BAD;
  group.traverse((child) => {
    if (child.isMesh) {
      child.material = mat;
      child.castShadow = false;
      child.receiveShadow = false;
    }
    if (child.isPointLight) child.visible = false;
  });
}
