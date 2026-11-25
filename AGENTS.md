# AGENTS.md

本文件面向在此仓库工作的 AI 代理与新成员，说明项目结构、常用命令与既有约定。

## 项目概览

Unit 02 · Building 2 —— 按户型图 1:1 重建的三居室 Three.js 第一人称漫游：

- 建筑外壳与全部家具均为运行时程序化生成，**不含任何 glTF/GLB 模型文件**（历史上 `public/models/` 下的模型已移除，勿恢复）。
- 支持逐房间硬装（地板/墙面/砖规格/阳台围护/洗手台侧墙）、家具摆放、布局存档、中英双语。
- 部署在 GitHub Pages 子路径 `https://chuxia98.github.io/renovation/`，因此 Vite `base` 为 `/renovation/`。

## 常用命令

```bash
npm install                                # 首次
npm run dev -- --port 5178 --strictPort    # 开发服务器（HMR）
npm run test                               # vitest（jsdom），改动数据/目录逻辑后必须通过
npm run build                              # 产物到 dist/
npm run preview -- --port 5179 --strictPort
```

访问地址必须带子路径：`http://localhost:5178/renovation/`（根路径会白屏）。
`dist/` 已 gitignore，由 `main` 分支 push 后的 GitHub Actions 构建发布。

## 目录职责

| 路径 | 职责 |
| --- | --- |
| `src/plan.js` | **户型唯一数据源**：墙、门窗洞、地面分区、飘窗、管道井、吊顶灯、出生点；像素坐标 → 米 |
| `src/build.js` | 按 plan.js 建建筑外壳：墙体/窗洞/门/推拉门/踢脚线、碰撞盒、窗洞面光与日光 |
| `src/core/scene.js` | renderer、scene、camera、PMREM HDRI 环境 |
| `src/core/dayNight.js` | 日夜交替：太阳轨迹/色温、天空与雾色、顶灯与窗洞面光强度、时间滑块状态 |
| `src/core/furnitureState.js` | 家具 placements、碰撞/地面校验、localStorage 布局存档 |
| `src/textures.js` | 地板/墙面材质与贴图（canvas 程序化 + PBR） |
| `src/style.js` | 硬装样式状态（逐房间地板/墙面、铺法、砖规格、阳台模式）与持久化 |
| `src/pbr.js` | ambientCG PBR 贴图加载与去色归一化 |
| `src/furniture/*` | 程序化家具：`catalog.js` 目录/变体，`seating|tables|bedroom|kitchenBath|decor.js` 各品类建模 |
| `src/furniture.js` | 家具模块统一导出入口（供其他模块 import） |
| `src/player.js` | 第一人称控制器（桌面指针锁定 + 触屏拖动/摇杆） |
| `src/minimap.js` | 小地图与雷达 |
| `src/i18n.js` | 中英词典 `DICT`、`t()`、`applyStatic()`、`initLang()` |
| `src/ui/*` | 各交互面板逻辑（家具模式、样式、方案、设置、拾取、触屏、toast） |
| `src/styles/*.css` | 按界面区块拆分的样式，`src/style.css` 统一按顺序 `@import` |
| `index.html` | 全部面板/HUD 的 DOM 骨架 |
| `tests/` | vitest 单测：户型数据、样式常量、家具目录、i18n 键完整性 |
| `tools/*.py` | 户型图分析辅助脚本（产物 `crop_*.png` 等已 gitignore） |
| `public/` | 仅 CC0 贴图与 HDRI；资产来源登记在 `public/CREDITS.md` 与根 `CREDITS.md` |

## 核心约定

### 坐标与建模

- 世界单位是米；X 向东、Z 向南、Y 向上。
- 户型改动只改 `src/plan.js`（像素坐标，`PX_PER_M = 180`，原点 `ORIGIN_PX`），不要在 `build.js` 里写死墙体坐标。
- 家具约定：**原点在地面中心，正面朝 +Z**；变体 id 与尺寸在 `catalog.js` 定义，建模函数放在对应品类文件。
- 不要按像素坐标做判断，统一经 `mx()` / `mz()` 换算。

### 资源与部署

- 加载 `public/` 资源必须加 `import.meta.env.BASE_URL` 前缀，禁止以 `/` 开头的绝对路径。
- 只引入 CC0 资产，并在两份 `CREDITS.md` 登记来源。
- 项目刻意不打包 3D 模型文件，体量控制优先（贴图压到 512 的规则见 `pbr.js` / `textures.js`）。

### UI 与国际化

- 所有用户可见文案写入 `DICT.en` 与 `DICT.zh`（键名保持一致，测试会校验）；不要在代码里硬编码中英文串。
- 静态 DOM 用 `data-i18n` / `data-i18n-html` / `data-i18n-aria` / `data-i18n-placeholder` 属性；动态面板在 `renderLocalizedUI()`（`main.js`）里统一重渲染，语言切换经 `onLangChange` 触发。
- 面板 DOM 在 `index.html`，逻辑在 `src/ui/`，样式加到 `src/styles/` 对应分区文件，不要新增独立样式入口。

### 持久化

localStorage 键存在版本号，改动数据结构时要兼容旧存档（或升级键名版本）：

- `hourse-lang-v1`（语言）
- `hourse-env-v1`（环境光开关）
- `hourse-style-v2`（硬装样式）
- `hourse-layout-v1`（当前家具布局）
- `hourse-layout-schemes-v1`（保存的布局方案）
- `hourse-daylight-v1`（日光时刻与日夜循环开关）

### 渲染链路

- 后处理为 `RenderPass → OutputPass → FXAA`；离屏 RT 显式开了 MSAA（`samples: 4`），renderer 的 `antialias` 只作用于默认帧缓冲，**不要因为“已有抗锯齿”删掉 FXAA 兜底**。
- 阴影用 `VSMShadowMap`：吊顶底面与墙顶齐平，PCFSoft 在该交界处会产生规律锯齿状半影（bias / 分辨率都压不掉）；改回 PCF 前先复核该处。
- **不要加回 GTAO**：吊顶底面与墙顶严格齐平的 90° 直角会被屏幕空间 AO 当成凹角，沿墙角压出 10cm 以上的柔化暗带（直射灯光也一并压暗），直角看起来像倒角；要接触阴影优先靠阴影贴图。
- 日照由 `src/core/dayNight.js` 统一驱动（太阳位置/色温、天空与雾色、半球光、窗洞面光、顶灯亮度）；`daylightState(hour)` 是纯函数，改参数后跑 `npm run test` 并截图对比日夜各时段。
- 环境贴图、窗洞面光、顶灯共同决定观感，调整灯光参数后用截图对比，不要只看代码推断。

## 验证要求

1. 改动数据/目录/样式常量：`npm run test` 必须全绿。
2. 改动 UI/渲染：启动 dev server 并在浏览器实际走一遍（进入漫游、家具模式、样式面板、语言切换），必要时用 headless Chrome + CDP 截图核对；自动截图脚本里 `chrome.kill()` 后要 `process.exit(0)`。
3. DEV 模式下可经 `window.__hourseDebug` 取到 `controls / camera / scene / composer / renderer / dayNight` 复现机位与时刻；不要在生产代码依赖它。
4. 内置浏览器若不可见，`requestAnimationFrame` 会暂停、stats 停在 Loading，这是环境假象，不可据此判定 bug。

## 不要做的事

- 不要恢复 `public/models/` 下的 GLB 资源或引入新的 3D 模型依赖。
- 不要提交 `dist/`、`.shots/`、`crop_*.png`、`walls_*.json/png` 等产物。
- 不要为单次需求引入抽象层或“可配置化”；改动保持最小范围。
- 不要在未运行测试与浏览器验证前宣称完成。