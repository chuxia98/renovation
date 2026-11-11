const STORE_KEY = 'hourse-lang-v1';

export const LANGS = [
  { id: 'en', label: 'English' },
  { id: 'zh', label: '中文' },
];

export const DICT = {
  en: {
    'doc.title': 'Unit 02 · Building 2 · 3D Walkthrough',

    'hud.brand': 'Unit 02 · Building 2',
    'hud.subtitle': '3D Interior Walkthrough',
    'hud.loading': 'Loading…',
    'hud.stats': 'X {x} m · Z {z} m · {n} items',
    'hud.hint': '<b>WASD</b> Move · <b>Mouse</b> Look · <b>Wheel</b> Zoom · <b>Shift</b> Sprint · <b>G</b> Furniture · <b>Click</b> Door',
    'hud.hintLock': '<b>WASD</b> Move · <b>Hold left mouse</b> Look · <b>Wheel</b> Zoom · <b>Shift</b> Sprint · <b>G</b> Furniture · <b>Click</b> Door',
    'hud.hintTouch': '<b>Joystick</b> Move · <b>Drag</b> Look · <b>Tap</b> Door',

    'mode.walkthrough': 'Walkthrough',
    'mode.build': 'Furniture Mode',
    'mode.exploring': 'Exploring',

    'map.overview': 'OVERVIEW',

    'build.title': 'Furniture Catalog',
    'build.sub': 'Left click to place · R rotate · Right click to remove · Esc exit',
    'build.subTouch': 'Tap to place · Rotate button to turn · Long press to remove',
    'build.style': 'Style',
    'build.layouts': 'Layouts',
    'build.rotate': 'Rotate',
    'build.clear': 'Clear',
    'build.exit': 'Exit (G)',
    'build.exitTouch': 'Exit',
    'build.open': 'Furniture mode',
    'build.variantTitle': 'Style',
    'build.variantDone': 'Done',

    'style.title': 'Room Style',
    'style.subtitle': 'Per-room finish · saved with layouts',
    'style.room': 'Room',
    'style.floor': 'Floor',
    'style.wall': 'Wall',
    'style.color': 'Color',
    'style.size': 'Size',
    'style.plankSize': 'Plank {cm} cm',
    'style.kind.wood': 'Wood',
    'style.kind.tile': 'Tile',
    'style.kind.stone': 'Stone',
    'style.finish.paint': 'Paint',
    'style.finish.linen': 'Linen',
    'style.finish.stripe': 'Stripe',
    'style.finish.grid': 'Grid',
    'style.balcony': 'Balcony front',
    'style.balcony.solid': 'Solid wall 1.3 m',
    'style.balcony.glass': 'Floor-to-ceiling glass',

    'scheme.title': 'Layouts',
    'scheme.subtitle': 'Saved in this browser · Load anytime',
    'scheme.namePlaceholder': 'Layout name (optional)',
    'scheme.save': 'Save Current',
    'scheme.load': 'Load',
    'scheme.delete': 'Delete',
    'scheme.empty': 'No saved layouts yet',
    'scheme.meta': '{n} items · {at}',
    'scheme.defaultName': 'Layout {n}',
    'scheme.original': 'Original Layout',
    'scheme.confirmDelete': 'Delete layout "{name}"?',

    'toast.placed': 'Placed {name} · {n} items',
    'toast.removed': 'Removed {name}',
    'toast.noFit': "That doesn't fit here — try another spot",
    'toast.tapFloor': 'Tap on the floor to place it',
    'toast.pickItem': 'Pick a furniture item first',
    'toast.noFurniture': 'No furniture yet',
    'toast.cleared': 'Furniture cleared',
    'toast.savedScheme': 'Saved "{name}" · {n} items',
    'toast.updatedScheme': 'Updated "{name}" · {n} items',
    'toast.loadedScheme': 'Loaded "{name}" · {n} items',
    'toast.deletedScheme': 'Deleted "{name}"',
    'toast.opened': '{name} opened',
    'toast.closed': '{name} closed',

    'interact.door': 'Door',
    'interact.slider': 'Sliding door',

    'settings.title': 'Settings',
    'settings.language': 'Language',
    'settings.env': 'Environment light',
    'settings.open': 'Settings',

    'overlay.kicker': 'Three.js · Real-time 3D',
    'overlay.title': 'Unit 02 · Building 2',
    'overlay.desc': 'A three-bedroom apartment rebuilt 1:1 from the floor plan. Walk through the living room and bedrooms, then furnish it your way — every change is saved locally.',
    'overlay.start': 'Enter Walkthrough',
    'overlay.keys.move': '<b>W A S D</b> Move',
    'overlay.keys.sprint': '<b>Shift</b> Sprint',
    'overlay.keys.look': '<b>Hold left mouse</b> Look',
    'overlay.keys.zoom': '<b>Wheel</b> Zoom',
    'overlay.keys.furniture': '<b>G</b> Furniture',
    'overlay.keys.esc': '<b>Esc</b> Release cursor',
    'overlay.keys.joystick': '<b>Joystick</b> Move',
    'overlay.keys.drag': '<b>Drag</b> Look',
    'overlay.keys.buildTouch': '<b>Furniture</b> Place furniture',

    'room.master': 'Master Bedroom',
    'room.second': 'Second Bedroom',
    'room.multi': 'Multi-room',
    'room.bath': 'Bathroom',
    'room.corridor': 'Hallway',
    'room.kitchen': 'Kitchen',
    'room.living': 'Living / Dining',
    'room.entry': 'Entry Hall',
    'room.balcony': 'Balcony',
    'room.porch': 'Porch',

    'catalog.sofa': 'Sofa',
    'catalog.armchair': 'Armchair',
    'catalog.coffee': 'Coffee Table',
    'catalog.tv': 'TV Stand',
    'catalog.rug': 'Rug',
    'catalog.dining': 'Dining Table',
    'catalog.chair': 'Dining Chair',
    'catalog.bed': 'Double Bed',
    'catalog.singlebed': 'Single Bed',
    'catalog.nightstand': 'Nightstand',
    'catalog.wardrobe': 'Wardrobe',
    'catalog.desk': 'Desk',
    'catalog.shelf': 'Bookshelf',
    'catalog.lamp': 'Floor Lamp',
    'catalog.plant': 'Plant',
    'catalog.fridge': 'Fridge',
    'catalog.counter': 'Counter',
    'catalog.toilet': 'Toilet',
    'catalog.washbasin': 'Washbasin',
    'catalog.shower': 'Shower',

    'variant.sofa.straight': 'Straight',
    'variant.sofa.corner': 'Corner',
    'variant.sofa.loveseat': 'Loveseat',
    'variant.armchair.lounge': 'Lounge',
    'variant.armchair.shell': 'Shell',
    'variant.armchair.rattan': 'Rattan',
    'variant.coffee.rect': 'Rectangular',
    'variant.coffee.round': 'Round',
    'variant.coffee.nesting': 'Nesting',
    'variant.tv.storage': 'Storage',
    'variant.tv.floating': 'Floating',
    'variant.tv.long': 'Long',
    'variant.dining.rect': 'Rectangular',
    'variant.dining.round': 'Round',
    'variant.dining.oval': 'Oval',
    'variant.chair.fabric': 'Fabric',
    'variant.chair.wood': 'Wood',
    'variant.chair.rattan': 'Rattan',
    'variant.bed.wood': 'Wood',
    'variant.bed.upholstered': 'Upholstered',
    'variant.bed.floating': 'Floating',
    'variant.singlebed.wood': 'Wood',
    'variant.singlebed.upholstered': 'Upholstered',
    'variant.singlebed.floating': 'Floating',
    'variant.nightstand.drawer': 'Drawer',
    'variant.nightstand.round': 'Drum',
    'variant.nightstand.open': 'Open',
    'variant.wardrobe.flat': 'Flat Panel',
    'variant.wardrobe.slat': 'Slatted',
    'variant.wardrobe.glass': 'Glass',
    'variant.desk.legs': 'Four Legs',
    'variant.desk.pedestal': 'Pedestal',
    'variant.shelf.open': 'Open',
    'variant.shelf.ladder': 'Ladder',
    'variant.shelf.cabinet': 'Cabinet',
  },

  zh: {
    'doc.title': '02 单元 · 2 号楼 · 3D 室内漫游',

    'hud.brand': '02 单元 · 2 号楼',
    'hud.subtitle': '3D 室内漫游',
    'hud.loading': '加载中…',
    'hud.stats': 'X {x} m · Z {z} m · {n} 件家具',
    'hud.hint': '<b>WASD</b> 移动 · <b>鼠标</b> 视角 · <b>滚轮</b> 缩放 · <b>Shift</b> 加速 · <b>G</b> 家具 · <b>点击</b> 开关门',
    'hud.hintLock': '<b>WASD</b> 移动 · <b>按住左键</b> 转动视角 · <b>滚轮</b> 缩放 · <b>Shift</b> 加速 · <b>G</b> 家具 · <b>点击</b> 开关门',
    'hud.hintTouch': '<b>摇杆</b> 移动 · <b>拖动</b> 视角 · <b>点按</b> 开关门',

    'mode.walkthrough': '漫游模式',
    'mode.build': '家具模式',
    'mode.exploring': '探索中',

    'map.overview': '户型概览',

    'build.title': '家具目录',
    'build.sub': '左键放置 · R 旋转 · 右键移除 · Esc 退出',
    'build.subTouch': '点按放置 · 旋转按钮转向 · 长按移除',
    'build.style': '样式',
    'build.layouts': '布局方案',
    'build.rotate': '旋转',
    'build.clear': '清空',
    'build.exit': '退出 (G)',
    'build.exitTouch': '退出',
    'build.open': '家具模式',
    'build.variantTitle': '款式',
    'build.variantDone': '完成',

    'style.title': '房间样式',
    'style.subtitle': '按房间设置 · 随布局方案保存',
    'style.room': '房间',
    'style.floor': '地板',
    'style.wall': '墙面',
    'style.color': '颜色',
    'style.size': '尺寸',
    'style.plankSize': '板宽 {cm} cm',
    'style.kind.wood': '木质',
    'style.kind.tile': '地砖',
    'style.kind.stone': '石材',
    'style.finish.paint': '乳胶漆',
    'style.finish.linen': '亚麻',
    'style.finish.stripe': '条纹',
    'style.finish.grid': '格纹',
    'style.balcony': '阳台围护',
    'style.balcony.solid': '实墙 1.3 m',
    'style.balcony.glass': '落地玻璃',

    'scheme.title': '布局方案',
    'scheme.subtitle': '保存在本浏览器 · 随时载入',
    'scheme.namePlaceholder': '布局名称（可选）',
    'scheme.save': '保存当前',
    'scheme.load': '载入',
    'scheme.delete': '删除',
    'scheme.empty': '暂无已保存的布局',
    'scheme.meta': '{n} 件家具 · {at}',
    'scheme.defaultName': '布局 {n}',
    'scheme.original': '原始布局',
    'scheme.confirmDelete': '删除布局“{name}”？',

    'toast.placed': '已放置{name} · 共 {n} 件',
    'toast.removed': '已移除{name}',
    'toast.noFit': '这里放不下，换个位置试试',
    'toast.tapFloor': '请点在地面上放置',
    'toast.pickItem': '请先选择家具',
    'toast.noFurniture': '还没有家具',
    'toast.cleared': '已清空家具',
    'toast.savedScheme': '已保存“{name}” · {n} 件',
    'toast.updatedScheme': '已更新“{name}” · {n} 件',
    'toast.loadedScheme': '已载入“{name}” · {n} 件',
    'toast.deletedScheme': '已删除“{name}”',
    'toast.opened': '已打开{name}',
    'toast.closed': '已关闭{name}',

    'interact.door': '门',
    'interact.slider': '推拉门',

    'settings.title': '设置',
    'settings.language': '语言',
    'settings.env': '环境光',
    'settings.open': '设置',

    'overlay.kicker': 'Three.js · 实时 3D',
    'overlay.title': '02 单元 · 2 号楼',
    'overlay.desc': '按户型图 1:1 还原的三居室。漫步客厅与卧室，再按你的方式布置家具——所有改动都会保存在本地。',
    'overlay.start': '进入漫游',
    'overlay.keys.move': '<b>W A S D</b> 移动',
    'overlay.keys.sprint': '<b>Shift</b> 加速',
    'overlay.keys.look': '<b>按住左键</b> 转动视角',
    'overlay.keys.zoom': '<b>滚轮</b> 缩放',
    'overlay.keys.furniture': '<b>G</b> 家具',
    'overlay.keys.esc': '<b>Esc</b> 释放光标',
    'overlay.keys.joystick': '<b>摇杆</b> 移动',
    'overlay.keys.drag': '<b>拖动</b> 转视角',
    'overlay.keys.buildTouch': '<b>家具按钮</b> 布置家具',

    'room.master': '主卧',
    'room.second': '次卧',
    'room.multi': '多功能房',
    'room.bath': '卫生间',
    'room.corridor': '走廊',
    'room.kitchen': '厨房',
    'room.living': '客餐厅',
    'room.entry': '玄关',
    'room.balcony': '阳台',
    'room.porch': '入户平台',

    'catalog.sofa': '沙发',
    'catalog.armchair': '单人沙发',
    'catalog.coffee': '茶几',
    'catalog.tv': '电视柜',
    'catalog.rug': '地毯',
    'catalog.dining': '餐桌',
    'catalog.chair': '餐椅',
    'catalog.bed': '双人床',
    'catalog.singlebed': '单人床',
    'catalog.nightstand': '床头柜',
    'catalog.wardrobe': '衣柜',
    'catalog.desk': '书桌',
    'catalog.shelf': '书架',
    'catalog.lamp': '落地灯',
    'catalog.plant': '绿植',
    'catalog.fridge': '冰箱',
    'catalog.counter': '橱柜',
    'catalog.toilet': '马桶',
    'catalog.washbasin': '洗手台',
    'catalog.shower': '淋浴房',

    'variant.sofa.straight': '直排沙发',
    'variant.sofa.corner': '转角沙发',
    'variant.sofa.loveseat': '双人沙发',
    'variant.armchair.lounge': '休闲椅',
    'variant.armchair.shell': '贝壳椅',
    'variant.armchair.rattan': '藤编椅',
    'variant.coffee.rect': '方形茶几',
    'variant.coffee.round': '圆形茶几',
    'variant.coffee.nesting': '组合套几',
    'variant.tv.storage': '收纳电视柜',
    'variant.tv.floating': '悬浮电视柜',
    'variant.tv.long': '长条电视柜',
    'variant.dining.rect': '长餐桌',
    'variant.dining.round': '圆餐桌',
    'variant.dining.oval': '椭圆餐桌',
    'variant.chair.fabric': '布艺餐椅',
    'variant.chair.wood': '实木餐椅',
    'variant.chair.rattan': '藤编餐椅',
    'variant.bed.wood': '实木床',
    'variant.bed.upholstered': '软包床',
    'variant.bed.floating': '悬浮床',
    'variant.singlebed.wood': '实木床',
    'variant.singlebed.upholstered': '软包床',
    'variant.singlebed.floating': '悬浮床',
    'variant.nightstand.drawer': '抽屉款',
    'variant.nightstand.round': '圆筒款',
    'variant.nightstand.open': '开放款',
    'variant.wardrobe.flat': '平板门',
    'variant.wardrobe.slat': '格栅门',
    'variant.wardrobe.glass': '玻璃门',
    'variant.desk.legs': '四腿书桌',
    'variant.desk.pedestal': '抽屉书桌',
    'variant.shelf.open': '开放书架',
    'variant.shelf.ladder': '梯式书架',
    'variant.shelf.cabinet': '带柜书架',
  },
};

const SUPPORTED = LANGS.map((l) => l.id);

function detectLang() {
  try {
    const saved = localStorage.getItem(STORE_KEY);
    if (SUPPORTED.includes(saved)) return saved;
  } catch {
    // 隐私模式等场景无法读取
  }
  return (navigator.language || '').toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

let lang = detectLang();
const listeners = new Set();

export function getLang() {
  return lang;
}

export function t(key, vars) {
  const table = DICT[lang] || DICT.en;
  let str = table[key] ?? DICT.en[key] ?? key;
  if (vars) {
    for (const [name, value] of Object.entries(vars)) str = str.split(`{${name}}`).join(String(value));
  }
  return str;
}

export function setLang(next) {
  if (!SUPPORTED.includes(next) || next === lang) return;
  lang = next;
  try {
    localStorage.setItem(STORE_KEY, lang);
  } catch {
    // 无法持久化时仅本次生效
  }
  document.documentElement.lang = lang;
  for (const fn of listeners) fn(lang);
}

export function onLangChange(fn) {
  listeners.add(fn);
}

export function applyStatic(root = document) {
  for (const el of root.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
  for (const el of root.querySelectorAll('[data-i18n-html]')) el.innerHTML = t(el.dataset.i18nHtml);
  for (const el of root.querySelectorAll('[data-i18n-placeholder]')) el.placeholder = t(el.dataset.i18nPlaceholder);
  for (const el of root.querySelectorAll('[data-i18n-aria]')) el.setAttribute('aria-label', t(el.dataset.i18nAria));
}

export function initLang() {
  document.documentElement.lang = lang;
}
