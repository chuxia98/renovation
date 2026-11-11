// 户型数据：图纸像素 → 米（1m = 180px）
// 世界坐标：X 向东（图纸右），Z 向南（图纸下），Y 向上

export const PX_PER_M = 180;
export const ORIGIN_PX = { x: 350, y: 464 };
export const WALL_H = 2.9;

export const mx = (px) => (px - ORIGIN_PX.x) / PX_PER_M;
export const mz = (py) => (py - ORIGIN_PX.y) / PX_PER_M;

// o: 'v' 沿 Z 走向（图纸竖墙）；'h' 沿 X 走向（图纸横墙）
// at: 墙中心线（v 为 x 像素，h 为 y 像素）；from/to: 墙沿轴起止像素；t: 厚度像素
// openings: from/to 沿轴像素；sill/top 米；kind: window | door | slider
// light: 窗洞天光面光的朝向（v 墙为 x 方向，h 墙为 z 方向），没有则该洞不进光
export const WALLS = [
  {
    // 西外墙：主卧 + 次卧，两处 TC1517 飘窗
    o: 'v', at: 368, from: 795, to: 1853, t: 36,
    openings: [
      { from: 922, to: 1188, sill: 0.5, top: 2.2, kind: 'window', bay: true, light: 1 },
      { from: 1442, to: 1708, sill: 0.5, top: 2.2, kind: 'window', bay: true, light: 1 },
    ],
  },
  {
    // 卧室与走廊的隔墙，两扇卧室门
    o: 'v', at: 950, from: 832, to: 1853, t: 20,
    openings: [
      { from: 1100, to: 1260, sill: 0, top: 2.1, kind: 'door', hinge: 'b', angle: 65 },
      { from: 1333, to: 1494, sill: 0, top: 2.1, kind: 'door', hinge: 'b', angle: 65 },
    ],
  },
  {
    // 多功能房西外墙
    o: 'v', at: 619, from: 1816, to: 2480, t: 37,
    openings: [],
  },
  {
    // 厨房西墙（上段）/ 卫生间东墙：北端 C0914 窗
    o: 'v', at: 1300, from: 464, to: 1315, t: 38,
    openings: [
      { from: 567, to: 728, sill: 0.9, top: 2.3, kind: 'window', light: 1 },
    ],
  },
  {
    // 客餐厅西墙下段 / 多功能房东墙
    o: 'v', at: 1300, from: 1530, to: 2480, t: 38,
    openings: [],
  },
  {
    // 厨房与入户门厅之间的隔墙
    o: 'v', at: 1746, from: 464, to: 975, t: 38,
    openings: [],
  },
  {
    // 客餐厅东外墙（实墙）
    o: 'v', at: 2034, from: 688, to: 2157, t: 37,
    openings: [],
  },
  {
    // 厨房北外墙
    o: 'h', at: 483, from: 1282, to: 1766, t: 40,
    openings: [],
  },
  {
    // 入户门厅北墙 / 入户门 HM1021
    o: 'h', at: 676, from: 1766, to: 2016, t: 30,
    openings: [
      { from: 1781, to: 1963, sill: 0, top: 2.15, kind: 'door', hinge: 'a', angle: -78, style: 'entry' },
    ],
  },
  {
    // 北外墙：主卧北墙 + 卫生间北墙（C0914 高窗）
    o: 'h', at: 813, from: 350, to: 1318, t: 38,
    openings: [
      { from: 996, to: 1209, sill: 1.1, top: 2.5, kind: 'window', light: 1 },
    ],
  },
  {
    // 厨房南墙 / 厨房门 M0821
    o: 'h', at: 966, from: 1318, to: 1766, t: 19,
    openings: [
      { from: 1569, to: 1711, sill: 0, top: 2.1, kind: 'door', hinge: 'b', angle: -65 },
    ],
  },
  {
    // 卫生间南墙 / 卫生间门
    o: 'h', at: 1091, from: 960, to: 1318, t: 19,
    openings: [
      { from: 960, to: 1102, sill: 0, top: 2.1, kind: 'door', hinge: 'a', angle: 65 },
    ],
  },
  {
    // 主卧 / 次卧隔墙
    o: 'h', at: 1297, from: 350, to: 960, t: 37,
    openings: [],
  },
  {
    // 洗手台凹口南侧短墙
    o: 'h', at: 1306, from: 1138, to: 1318, t: 19,
    openings: [],
  },
  {
    // 走廊南墙 / 乙级防火门 FM乙0921
    o: 'h', at: 1548, from: 960, to: 1281, t: 37,
    openings: [
      { from: 1103, to: 1263, sill: 0, top: 2.1, kind: 'door', hinge: 'b', angle: 65 },
    ],
  },
  {
    // 次卧南墙
    o: 'h', at: 1835, from: 350, to: 960, t: 37,
    openings: [],
  },
  {
    // 客厅南墙 / 阳台推拉门 TLM2423
    o: 'h', at: 2139, from: 1281, to: 2052, t: 37,
    openings: [
      { from: 1461, to: 1890, sill: 0, top: 2.3, kind: 'slider', light: -1 },
    ],
  },
  {
    // 多功能房南外墙 / FCZ1817 飘窗
    o: 'h', at: 2461, from: 601, to: 1318, t: 38,
    openings: [
      { from: 799, to: 1119, sill: 0.5, top: 2.2, kind: 'window', bay: true, light: -1 },
    ],
  },
];

// 可单独设置地面 / 墙面样式的房间（名称走 i18n：room.<id>）
export const ROOMS = [
  { id: 'master' },
  { id: 'second' },
  { id: 'multi' },
  { id: 'bath' },
  { id: 'corridor' },
  { id: 'kitchen' },
  { id: 'living' },
  { id: 'entry' },
  { id: 'balcony' },
  { id: 'porch' },
];

// 地面分区（像素矩形）；room 指向 ROOMS；同房间可有多块地面
export const FLOORS = [
  { x1: 386, z1: 832, x2: 941, z2: 1279, mat: 'wood', room: 'master' },    // 主卧
  { x1: 386, z1: 1315, x2: 941, z2: 1816, mat: 'wood', room: 'second' },   // 次卧
  { x1: 637, z1: 1853, x2: 1281, z2: 2443, mat: 'wood', room: 'multi' },   // 多功能房
  { x1: 960, z1: 1566, x2: 1281, z2: 1853, mat: 'wood', room: 'multi' },   // 多功能房北区
  { x1: 960, z1: 832, x2: 1281, z2: 1082, mat: 'tile', room: 'bath' },     // 卫生间
  { x1: 960, z1: 1100, x2: 1281, z2: 1566, mat: 'tile', room: 'corridor' },// 走廊 + 洗手区
  { x1: 1318, z1: 503, x2: 1727, z2: 956, mat: 'tile', room: 'kitchen' },  // 厨房
  { x1: 1318, z1: 966, x2: 2016, z2: 2121, mat: 'wood', room: 'living' },  // 客餐厅
  { x1: 1766, z1: 690, x2: 2016, z2: 966, mat: 'wood', room: 'entry' },    // 玄关
  { x1: 1318, z1: 2157, x2: 2103, z2: 2470, mat: 'tile', room: 'balcony' },// 阳台
  { x1: 1766, z1: 464, x2: 2016, z2: 662, mat: 'stone', room: 'porch' },   // 入户平台

  // 门洞 / 过门石，跟随相邻房间样式
  { x1: 941, z1: 1100, x2: 960, z2: 1260, mat: 'wood', room: 'master' },
  { x1: 941, z1: 1333, x2: 960, z2: 1494, mat: 'wood', room: 'second' },
  { x1: 960, z1: 1082, x2: 1102, z2: 1100, mat: 'tile', room: 'bath' },
  { x1: 1569, z1: 956, x2: 1711, z2: 966, mat: 'tile', room: 'kitchen' },
  { x1: 1281, z1: 1316, x2: 1318, z2: 1530, mat: 'wood', room: 'living' },
  { x1: 1461, z1: 2121, x2: 1890, z2: 2157, mat: 'tile', room: 'balcony' },
  { x1: 1781, z1: 662, x2: 1963, z2: 690, mat: 'wood', room: 'entry' },
];

// 飘窗：side 为外凸方向
export const BAYS = [
  { side: 'west', z0: 922, z1: 1188, sill: 0.5, top: 2.2, depth: 115 },
  { side: 'west', z0: 1442, z1: 1708, sill: 0.5, top: 2.2, depth: 115 },
  { side: 'south', x0: 799, x1: 1119, sill: 0.5, top: 2.2, depth: 115 },
];

// 吸顶灯位置（世界坐标，米）
export const CEILING_LIGHTS = [
  { x: 1.70, z: 3.30, power: 22 },  // 主卧
  { x: 1.70, z: 6.10, power: 22 },  // 次卧
  { x: 2.60, z: 9.20, power: 24 },  // 多功能房
  { x: 4.45, z: 6.90, power: 16 },  // 多功能房北区
  { x: 4.20, z: 2.65, power: 18 },  // 卫生间
  { x: 4.10, z: 4.45, power: 14 },  // 洗手区
  { x: 6.55, z: 1.45, power: 24 },  // 厨房
  { x: 8.30, z: 2.00, power: 16 },  // 玄关
  { x: 7.30, z: 6.40, power: 30 },  // 客厅
  { x: 7.30, z: 4.20, power: 22 },  // 餐厅
  { x: 7.50, z: 10.30, power: 14 }, // 阳台
];

// 出生点与朝向（yaw：0 = 北 / -Z）
export const START = { x: 8.45, z: 1.95, yaw: 2.55, pitch: -0.04 };
