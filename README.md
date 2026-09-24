# Zinx Portfolio

Zinx 的个人作品网站。React + TypeScript 管理作品和展览编排，R3F / Three.js 构建可操作的机器入口，GSAP 驱动开场与作品展开。Vite 输出静态文件，可使用 GitHub Pages。

当前版本为可扩展金币展台：红幕揭幕 → 三次操作各转一轮 → 机器冒烟爆开 → 金币落桌 → 翻面预览 → 真实详情。底部可一键翻开/收回，作品按数据配置。
入口支持拉杆、点击、Enter/Space；展墙使用滚动、触摸和章节定位，点击作品展开，Esc 关闭，详情支持上一件/下一件。声音默认开启，首次用户手势解锁，静音偏好保存在本机。首页 `/` 或 `#top` 每次都显示老虎机，`#hub` 直达展墙；旧 `?view=library` 统一显示当前策展结果，静态浏览位于 `?render=static`。

当前展出 5 件：YY、Dating 日记、Monkex、录屏小子、VideoPro。数数城等候选保留在清单，默认不展出。

- [新增作品指南](ADDING_WORKS.md)：直接接入新作品金币、配置预览、组合详情与媒体检查。
- [作品与素材清单](WORKS_INVENTORY.md)：26 个目录条目的位置、展示用途、候选状态与新增模板。
- [统一设计规范](DESIGN_SYSTEM.md)：圆角与倒角、像素玻璃、共享 token、行为与动效验收。
- [公开资源与许可调查](RESOURCE_REFERENCES.md)：已采用、候选、未采用及未来模板销售的复核范围。

## 本地运行

Node.js `>=22.13.0`。

```bash
npm install
npm run dev
```

默认地址 `http://localhost:3000/`。

```bash
npm run lint
npm test
npm run preview
```

`npm test` 先构建，再检查资产引用、静态子路径、阶段坐标、图库循环、布局与动效契约，以及对外文案。浏览器视觉与交互检查作为最终验收。

## 新增作品

1. 复核素材公开权限，把图片放入 `public/projects/<slug>/`，加入 `content-sources/public-assets.json`，并在 `.gitignore` 添加对应的 `!/public/...` 白名单项。
2. 新作品可直接在 `src/content/extra-exhibits.ts` 添加标准记录（见 ADDING_WORKS.md）；现有产品继续维护 `src/content/portfolio.ts`，避免重复记录。
3. 设置 `media` 提供主图；可选的 `gallery` 提供多张真实功能截图及各自说明。新条目保持候选，不自动展出；无媒体条目保持隐藏。
4. 在 `src/content/exhibition.ts` 的 `exhibitionPlacements` 显式设置 `visible: true`，以及分组、顺序、主展权重与媒体顺序。数量、导航与顺序浏览自动更新；移除作品时同步移除其编排条目。
5. `ExhibitMedia` 支持 image、video、animation、yy 和 demo。视频及动图提供 poster，SVG 动作引用现行 YY action ID，本地 demo 采用受限 iframe，外部体验通过链接打开。动态表情包的渲染入口已具备，实际素材留待后续加入。
6. 运行测试并检查桌面、手机和详情中的实际显示。

联系方式和简历入口集中在 `src/content/profile.ts`。留空时不显示对应动作；公开之前由作者确认。

编排示例（现有项目 ID）：`{ id: "yy", group: "selected", order: 0, visible: true, featured: true, mediaIds: ["cover", "action-stinky"] }`。设置 `visible: false` 只改变展厅呈现；浏览器包和资源地址仍可能包含目录与素材。保密内容应从公开内容源和资产清单中移除。

## 内容与动效结构

YY 独立角色与主案例角色图共用 `portfolio.ts` 的 `yyAppearance`。更新 YY 源码后运行 `npm run sync:yy`，原样同步现行 SVG 并记录源码哈希；默认定位相邻的 YY 项目，也可以用 `npm run sync:yy -- --source <YY项目路径>` 指定位置。`predev` / `prebuild` 检查本地源码与站点素材一致。CI 没有 YY 仓库时只检查已同步素材的哈希。

YY 的源生动作由 YYActionStage 呈现在详情中；YYCompanion 在入口和展厅持续陪伴，复用舞句与三种现有衣物组合，支持点击加演与换装，并遵循系统减少动态偏好。默认穿搭随展区变化，手动选择在本次访问内优先。同步脚本导出母版 SVG 分层、现有小黄帽/围巾/脸贴及锚点依赖到 src/vendor/yy/。修改应先回到权威源码，再显式同步。

旧独立角色 PNG 保存在 `archive/yy-legacy-2026-09-06/`，不进入站点素材和发布包。产品 UI 截图保留实机原图；更新 UI 证据需要从新版应用重新捕获。

- `src/main.tsx` / `src/App.tsx`：单次挂载与独立的组件热更新、入口路由边界。
- `src/components/PortalEntrance.tsx`：入口、展厅、音效与 YY 伴随层。
- `src/components/PortalScene.tsx`：机器、滚轮、连杆、部件爆开、程序化烟雾、实体金币、展台与镜头。
- `src/lib/arcade-state.ts` / `useArcade.ts`：不可变状态机与机械时间线。
- `src/content/exhibition.ts`：内容适配、章节与展品编排。
- `src/lib/exhibition-model.ts`：稳定 ID、媒体类型与编排校验。
- `src/components/ProjectCard.tsx`：沿用内容接口的双面作品金币、真实媒体、悬浮翻转与触摸展开。
- `src/components/ExhibitionWall.tsx` / `ExhibitDialog.tsx`：自适应金币展台、来源位置展开、媒体与焦点返回。
- `src/lib/useExhibitionAudio.ts`：声音偏好、手势解锁、页面隐藏时暂停。
- `src/design/tokens.css` / `PanelBar.tsx`：统一几何、材质和窗口标题栏。
- `src/ZinxPortfolio.tsx`：共享真实案例、系统展示与详情组件。
- `src/content/portfolio.ts`：项目、代表案例与工作系统。
- `src/content/profile.ts`：公开作者链接。
- `src/lib/navigation.ts`：图库索引、叙事媒体条件与阶段坐标。
- `src/lib/motion.ts`：系统与站内减少动态设置。
- `src/styles.css`：材质、排版、响应式与可访问状态。
- `content-sources/public-assets.json`：允许进入网站和公开仓库的素材清单。

全流程使用同一个按需渲染 Canvas，保持赌场布景连续；展览空闲时不持续绘制。作品金币与详情保持原生 DOM，WebGL 失败直接抵达同一金币展台。媒体默认展示封面；悬停/焦点可静音预览短片，详情点击后加载视频和本地演示。减少动效保留相同内容，YY 停止持续动作。未来作品数量不影响入口符号与相机。

## GitHub Pages

`.github/workflows/deploy-pages.yml` 配置了静态站点构建与部署。仓库根站点使用 `/`；项目仓库使用 `/<repository>/`。首次发布需要配置仓库 Pages 来源为 GitHub Actions。

本地验证项目子路径时，构建与预览使用相同的前缀：

```bash
VITE_BASE_PATH=/zinx-portfolio/ npm test
VITE_BASE_PATH=/zinx-portfolio/ npm run preview
```

线上地址：https://zxzin.github.io/zinx-portfolio/

推送到 `main` 后，GitHub Actions 自动测试和更新同一网址。提交前运行 `npm run lint` 与 `npm test`。构建只复制 `content-sources/public-assets.json` 中的素材；历史资源、内部规划和发布记录保留在本机。公司、客户、课程材料及未授权人像保持私有。
