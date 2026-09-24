# 组件与动效资源记录

历史调查日期：2026-09-20。以下表格保留当时的采用记录，具体实现以当前代码为准。区分“网页中商用”和“把组件/模板作为商品再分发”。本文件记录工程采用决策，不构成完整法律审查；发售前按实际版本与交付包再次核查。

| 来源 | 本轮采用方式 | 许可与边界 |
| --- | --- | --- |
| [GSAP Staggers 官方文档](https://gsap.com/resources/getting-started/Staggers/) | 复用现有 GSAP 的网格错峰能力，为 6×12 像素进入编排中心向外的节奏；保留现有机械时间线和详情位移 | [Standard License](https://gsap.com/community/standard-license/) 是专门许可，并非 MIT。当前网站使用与未来源码模板分别复核；未来若发展为无代码动画编辑器，需要重新审查其中关于竞争性可视化动画工具的限制。 |
| [React Three Fiber / Drei](https://github.com/pmndrs/drei) | 继续复用已安装的场景、几何和渲染组件。开场结束卸载 Canvas，展品内容使用 DOM | [Drei LICENSE](https://github.com/pmndrs/drei/blob/master/LICENSE) 为 MIT；实际发售包须保留对应版本版权与许可。现有所有传递依赖仍需做完整 SBOM 审核。 |
| [Magic UI](https://github.com/magicuidesign/magicui) | 列入公开组件候选，参考其组件粒度；本轮未拷贝代码或安装依赖，避免引入另一套 motion/Tailwind 依赖来重复已有能力 | [公开仓库 LICENSE.md](https://github.com/magicuidesign/magicui/blob/main/LICENSE.md) 标示 MIT。该判断仅覆盖对应开源仓库，不自动覆盖收费模板、图片、品牌资源。 |
| [React Bits](https://github.com/DavidHDev/react-bits) | 仅做动效资源调查，本轮没有复制实现，也未打包组件 | [LICENSE.md](https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md) 是 MIT + Commons Clause，限制销售、转授权或再分发组件本身，包括捆绑或移植版本。未来可售组件包不直接纳入这些代码。 |

## 采用原则

1. 先利用现有 React / GSAP / R3F 生态的成熟能力，再考虑新增库。
2. 复制任何第三方实现前核对具体文件、版本与许可；保留来源与版权，不从教程截图推断使用权。
3. 组件统一映射到 Zinx Exhibit Kit 的 token 和行为规范，不带入整站默认皮肤。
4. 只采用确实改善开场、浏览或理解的交互，要求键盘路径、减少动效、清理生命周期和手机预算。
5. 所有产品截图、YY、动态表情、字体与音乐独立核查权利，组件代码许可不替它们授权。

## 当前实现（2026-09-24）

运行时使用 React、GSAP、Three.js、R3F 和 Drei；相对上一公开版本新增了 Three.js / R3F / Drei。单个按需渲染 Canvas 保持机器与展台场景连续，作品金币与详情使用 DOM。转轮图案、灯框、绒幕和合成音效由项目代码绘制与生成。后续售卖需要单独准备中性演示内容、素材/IP 许可范围、安装文档、版本支持政策及完整依赖清单。
