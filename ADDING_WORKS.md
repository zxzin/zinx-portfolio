# 把新作品放到 Zinx 金币展台

更新：2026-09-22。老虎机、预览卡、详情页分别独立。新增作品只需要素材、内容记录与展出配置；数量、分类导航、详情前后件和看过记录自动更新。

## 1. 准备真实、可公开的素材

每件作品至少一张清楚的实际截图或作品图片。视频和动图同时提供静态封面。先确认公司、客户、课程与人像的公开权限。

- 素材放入 `public/projects/<稳定ID>/`。
- 路径加入 `content-sources/public-assets.json`，并在 `.gitignore` 添加对应的 `!/public/...` 项。重新执行 `npm run package:assets`，开发服务器和构建都从审核后的资源目录读取。
- 在 WORKS_INVENTORY.md 记录来源、是什么、可以展示什么、是否选入。

## 2. 添加一个内容记录

已有项目继续维护 `src/content/portfolio.ts`，适配器会生成标准记录。全新作品直接加入 `src/content/extra-exhibits.ts` 的数组，避免同时在两个源文件重复登记。稳定 ID 使用小写英文、数字及中间连字符，例如 `my-project`，以便详情链接长期可用。

下面是字段模板，替换成真实内容后再使用；示例路径目前没有对应素材：

```ts
{
  id: "my-project",
  title: "作品名称",
  subtitle: "产品类型或中文名",
  summary: "它解决了什么问题，实际能做什么。",
  status: "公开预览版",
  accent: "blue", // blue / red / yellow / green
  tags: ["macOS", "交互设计"],
  defaultGroup: "selected", // selected / software / practice
  emblem: { src: "/projects/my-project/icon.png", treatment: "tile" },
  preview: {
    mediaId: "home",
    caption: "预览用一句话讲清楚用途。",
  },
  contribution: "自己的实际参与部分。",
  decision: "一项具体的设计取舍。",
  media: [
    {
      id: "home", kind: "image",
      src: "/projects/my-project/home.png",
      alt: "实际界面中正在展示的功能",
      title: "主界面",
      caption: "这张图展示的具体功能。",
    },
    {
      id: "demo", kind: "video",
      src: "/projects/my-project/demo.mp4",
      poster: "/projects/my-project/demo-poster.png",
      title: "操作演示",
    },
  ],
  links: [
    { label: "体验产品", href: "https://你的真实产品地址", external: true },
  ],
}
```

金币使用真实产品标识：`emblem.src` 指向审核后的本地 Logo，`treatment: "silhouette"` 适合透明轮廓（例如 YY），`"tile"` 适合方形 App 图标。没有标识时省略 emblem，自动以名称缩写铸字；加载失败也回退到缩写。原始 Logo 保持不变，通过 SVG 金属包边与阴影呈现浮雕。

作品金币默认背面朝上，悬停或键盘焦点翻到产品标识；手机首次点击翻面，再次打开详情。币面下缘刻编号与分类，名称、状态、用途及已看标记置于币下。底部一键翻开/收回作用于全部公开金币。`preview.mediaId` 保留为媒体选择元数据；详情按照 media 数组顺序展示完整截图、视频与演示。

## 3. 明确选入展览

在 `src/content/exhibition.ts` 的 `exhibitionPlacements` 添加：

```ts
{ id: "my-project", group: "selected", order: 6, visible: true }
```

- `visible: true` 才展出；`false` 或未配置时保持候选。
- `group` 选择类别，`order` 调整组内顺序；分类本身的次序由 `exhibitionGroups` 决定。
- `mediaIds: ["home", "demo"]` 可以只展示部分媒体并调整详情顺序。指定的预览媒体必须在其中。
- `featured` 保留为策展元数据，当前所有作品金币采用统一直径。
- 完整移除记录时，同时移除相应 placement。稳定 ID 应长期保留，现有 `#case-my-project` 链接依赖它。

隐藏仅改变页面呈现；客户端数据和已打包资源仍可能被访问。私有资料应留在公开内容源和打包清单之外。

## 详情媒体模块

| kind | 用途 | 需要的字段 |
| --- | --- | --- |
| image | 真实界面、摄影、作品图 | src、alt |
| video | 操作录屏、真实成片 | src、poster |
| animation | 动态表情、动图 | src、poster、alt |
| yy | 当前 YY 源码动作 | action、poster；action 为 stinky / juggle / orbit / barrage |
| demo | 站内交互演示或指南 | src、poster；仅 `/projects/...html`，受限沙箱 |
| model | 当前大卫三维雕塑 | src（GLB）、poster；点击载入，拖动/方向键旋转，关闭释放视图 |

各模块都有稳定 id、title 和可选 caption。详情按 media 数组顺序展示，包含用途、参与部分、设计取舍、真实链接；关闭/Esc 回到原卡与浏览位置。外部完整产品用 links 明确打开，避免任意第三方页面嵌入。

## 开场房间的背景陈列

背景独立维护在 `src/content/gallery-background.ts`，与金币展出名单分开。当前支持 `kind: "david"` 的现有模型和 `kind: "picture"` 的 9:16 静态画作；其他三维模型接入时需要对应的渲染适配。

- 素材先按上方流程登记、打包，再在 `backgroundExhibits` 添加 `id`、`slot`、`kind`、`visible`；图片额外提供本地 `src`。
- `backgroundSlots` 决定位置、比例和朝向，保留左右远端空位；一件展品占一个槽位。空槽不显示家具。
- 展品位于机器后方，缩小体量，受窄角柔和聚光照射。背景使用静态内容，保留老虎机的亮度与交互优先级。
- 完整作品详情仍在金币内容源维护。背景显示与隐藏独立于金币，不影响详情分享链接。

## 验收与发布

1. `npm run lint` 和 `VITE_BASE_PATH=/zinx-portfolio/ npm test`。
2. 检查三种尺寸：桌面、平板、手机；横图/竖图完整；视频可播；关闭回到卡片；链接正确。
3. 打开 `http://127.0.0.1:3000/#case-稳定ID`，刷新后应直达详情；分享已部署作品时替换为对应网站域名与路径。
4. 调整当前展品时同步维护 WORKS_INVENTORY.md 与 tests/exhibition.test.mjs 的策展名单断言。
5. 本地验收后另行决定提交与发布。本轮只做本地框架。

## 可玩游戏（2026-10-03）

将独立 HTML 作为 `kind: "game"` 媒体，填写 `src`、`poster`、`instructions`；预览指定 `play: "game"`。金币窗口与详情共用 GamePreview。点击试玩后才创建 iframe，关闭、换作品或切走页面即卸载。iframe 仅允许脚本，保持独立来源，无宿主存储、摄像头、麦克风权限。游戏必须容忍 storage 不可用；当前局进度留在游戏内存。作品状态依据实际记录填写，待审核产品保留状态并省略下载链接。

## 动态表情册

同一作品下列出多条 `kind: "animation"` 媒体，设置 `preview.play: "stickers"`。金币窗口与详情共用 StickerGallery：默认只请求 PNG 静帧，点击后只播放一张 GIF，再次点击、切走页面或离开展示区域时恢复静帧。系统减少动效时保持静帧。原始 GIF 的透明边缘、尺寸、帧序与帧延时保持不变；记录已验收来源与逐文件哈希。当前 YY 包仅取已确认的 14 款，待验收项保持排除。
