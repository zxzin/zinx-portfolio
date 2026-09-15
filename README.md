# Zinx Portfolio

Zinx 的个人作品网站。React + TypeScript 管理内容和交互，GSAP / ScrollTrigger 驱动案例叙事，Canvas 实现短暂的像素分散与重组。Vite 输出静态文件，可使用 GitHub Pages。

视觉遵循冷白液态玻璃、现代粗黑体和四原色像素语言。代表作品为 YY、Dating 日记、数数城；后续展示软件与实验、项目存档、VideoPro / RunPro 和作者介绍。

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
2. 在 `src/content/portfolio.ts` 的 `portfolioProjects` 中增加项目，填写名称、简短用途、真实状态、类型和现有链接。
3. 设置 `media` 提供主图；可选的 `gallery` 提供多张真实功能截图及各自说明。设置 `selected: true` 进入软件与实验区。
4. 普通项目自动进入目录；带图项目自动进入详情浏览集合。
5. 三条代表作品使用 `featureCases` 的阶段结构。每个阶段提供功能标签、标题、说明和截图；详情复用同一组阶段素材。
6. 运行测试并检查桌面、手机和详情中的实际显示。

联系方式和简历入口集中在 `src/content/profile.ts`。留空时不显示对应动作；公开之前由作者确认。

## 内容与动效结构

YY 独立角色与主案例角色图共用 `portfolio.ts` 的 `yyAppearance`。更新 YY 源码后运行 `npm run sync:yy`，原样同步现行 SVG 并记录源码哈希；默认定位相邻的 YY 项目，也可以用 `npm run sync:yy -- --source <YY项目路径>` 指定位置。`predev` / `prebuild` 检查本地源码与站点素材一致。CI 没有 YY 仓库时只检查已同步素材的哈希。

首页舞蹈由 `src/components/YYCompanion.tsx` 控制。同步脚本同时导出母版 SVG 分层、现有小黄帽/围巾/脸贴及其锚点依赖、两个现行 `PetSvg` 舞句到 `src/vendor/yy/`。这些导出保持来源哈希校验；修改应先回到权威源码，再显式同步。本网站的改动保持在网站仓库内。

旧独立角色 PNG 保存在 `archive/yy-legacy-2026-09-06/`，不进入站点素材和发布包。产品 UI 截图保留实机原图；更新 UI 证据需要从新版应用重新捕获。

- `src/ZinxPortfolio.tsx`：首屏、导航、案例、目录、系统与详情组件。
- `src/content/portfolio.ts`：项目、代表案例与工作系统。
- `src/content/profile.ts`：公开作者链接。
- `src/components/PixelMatter.tsx`：事件触发的像素引擎。
- `src/lib/navigation.ts`：图库索引、叙事媒体条件与阶段坐标。
- `src/lib/motion.ts`：系统与站内减少动态设置。
- `src/styles.css`：材质、排版、响应式与可访问状态。
- `content-sources/public-assets.json`：允许进入网站和公开仓库的素材清单。

桌面视口满足宽高条件时，滚动驱动案例阶段。手机、低高度视口与减少动态模式采用紧凑的手动浏览。停用动效后保留所有内容和交互。

## GitHub Pages

`.github/workflows/deploy-pages.yml` 配置了静态站点构建与部署。仓库根站点使用 `/`；项目仓库使用 `/<repository>/`。首次发布需要配置仓库 Pages 来源为 GitHub Actions。

本地验证项目子路径时，构建与预览使用相同的前缀：

```bash
VITE_BASE_PATH=/zinx-portfolio/ npm test
VITE_BASE_PATH=/zinx-portfolio/ npm run preview
```

线上地址：https://zxzin.github.io/zinx-portfolio/

推送到 `main` 后，GitHub Actions 自动测试和更新同一网址。提交前运行 `npm run lint` 与 `npm test`。构建只复制 `content-sources/public-assets.json` 中的素材；历史资源、内部规划和发布记录保留在本机。公司、客户、课程材料及未授权人像保持私有。
