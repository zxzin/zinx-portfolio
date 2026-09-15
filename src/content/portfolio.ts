export type Accent = "red" | "yellow" | "blue" | "green";
export const yyAppearance = {
  id: "yy_base_v13",
  src: "/brand/yy-base-v13.svg",
} as const;
export type ArchiveKind = "PRODUCT" | "GAME" | "SYSTEM" | "TOOL";

export type ProjectLink = {
  label: string;
  href: string;
  external?: boolean;
};

export type ProjectMedia = {
  kind: "image";
  src: string;
  alt: string;
  fit?: "contain" | "cover";
};

export type PortfolioProject = {
  slug: string;
  title: string;
  cn: string;
  kind: ArchiveKind;
  status: string;
  note: string;
  copy: string;
  evidence: string;
  accent: Accent;
  tags: string[];
  links?: ProjectLink[];
  media?: ProjectMedia;
  selected?: boolean;
  large?: boolean;
  gallery?: { src: string; title: string; copy: string }[];
  decision?: string;
};

export type YYActionId = "stinky" | "juggle" | "orbit" | "barrage";
export type CaseStep = {
  label: string;
  title: string;
  copy: string;
  image: string;
  proof: string;
  yyAction?: YYActionId;
};

export type FeatureCase = {
  id: "yy" | "dating" | "shushucity";
  number: string;
  eyebrow: string;
  title: string;
  cn: string;
  thesis: string;
  description: string;
  status: string;
  evidence: string;
  accent: Accent;
  scope: string[];
  contribution: string;
  decision: string;
  outcome: string;
  steps: CaseStep[];
};

export type ProductionSystem = {
  id: "videopro" | "runpro";
  name: string;
  kicker: string;
  title: string;
  description: string;
  accent: Accent;
  image: string;
  secondary: string;
  video?: string;
  poster?: string;
  outputStamp: string;
  href: string;
  proof: string;
  stages: string[];
};

export type PortfolioLevel = {
  id: string;
  number: string;
  code: string;
  operation: string;
  name: string;
  accent: Accent;
};

export const featureCases: FeatureCase[] = [
  {
    id: "yy",
    number: "01",
    eyebrow: "FLAGSHIP IP / DESKTOP COMPANION",
    title: "YY",
    cn: "仓鼠歪歪",
    thesis: "一只住在 Mac 桌面上的蓝色仓鼠。",
    description:
      "YY 会贴着 Dock 活动，右键即可聊天。“歪歪之家”收纳了换装、小手账、鼠鼠学校和培育基金。",
    status: "macOS 应用",
    evidence: "MACOS · TAURI · WARDROBE · JOURNAL",
    accent: "blue",
    scope: ["PRODUCT", "IP SYSTEM", "TAURI", "MOTION", "STOREKIT"],
    contribution: "产品构思 · 角色与交互设计 · AI 协同开发",
    decision: "陪伴留在桌面，换装、记录与动作课程收进「歪歪之家」。",
    outcome: "桌面角色与歪歪之家",
    steps: [
      {
        label: "臭臭舞",
        title: "捂住嘴，也停不下来",
        copy: "一只圆手捂在脸前，另一只快速摆动，身体跟着左右摇摆。",
        image: yyAppearance.src,
        proof: "YY / MUSIC_MEME_TRUE_LOVE",
        yyAction: "stinky",
      },
      {
        label: "手抛球",
        title: "抛起来，再接回来",
        copy: "圆手、耳朵和鼻点一起散开，高速绕行，最后重新归位。",
        image: yyAppearance.src,
        proof: "YY / V13_HAND_BALL_JUGGLE",
        yyAction: "juggle",
      },
      {
        label: "旋转手",
        title: "转出一圈小旋风",
        copy: "两只圆手沿着身体高速旋转，带出环绕的轨迹。",
        image: yyAppearance.src,
        proof: "YY / V13_HAND_BALL_SHIELD",
        yyAction: "orbit",
      },
      {
        label: "冲击波",
        title: "蓄力，发射！",
        copy: "双手聚拢蓄力，向前放大推出，身体随着冲击向后弹开。",
        image: yyAppearance.src,
        proof: "YY / V13_HAND_ENERGY_BARRAGE",
        yyAction: "barrage",
      },
    ],
  },
  {
    id: "dating",
    number: "02",
    eyebrow: "PRIVATE JOURNAL / IOS PRODUCT",
    title: "Dating Diary",
    cn: "Dating 日记",
    thesis: "只属于自己的约会记录和复盘。",
    description:
      "用户可以建立对象档案、记录每次约会、查看历史与排名。数据保存在本地，不做真人搜索或公开榜单。",
    status: "iOS 0.4 · 开发版",
    evidence: "IOS 0.4 · LOCAL-FIRST · PRIVATE JOURNAL",
    accent: "red",
    scope: ["PRODUCT", "IOS", "PRIVACY", "SUBSCRIPTION", "CONTENT"],
    contribution: "产品构思 · 信息与交互设计 · AI 协同开发",
    decision: "对象、约会与回顾围绕个人记录组织，数据保存在本地。",
    outcome: "对象档案、记录与回顾",
    steps: [
      {
        label: "记录",
        title: "继续记录一次约会",
        copy: "从最近对象和上次记录继续，给下一次约会留一个入口。",
        image: "/evidence/dating-home-real.png",
        proof: "IOS 0.4 / HOME",
      },
      {
        label: "回顾",
        title: "历史对象",
        copy: "同一页查看状态、来源和最近综合分。",
        image: "/evidence/dating-history-real.png",
        proof: "IOS 0.4 / HISTORY",
      },
      {
        label: "对比",
        title: "对象对比",
        copy: "可按状态、渠道和综合分排序，保留持续复盘的视图。",
        image: "/evidence/dating-ranking-real.png",
        proof: "IOS 0.4 / RANKING",
      },
    ],
  },
  {
    id: "shushucity",
    number: "03",
    eyebrow: "LIVE-DISGUISE VIDEO TOY / PIXEL WORLD",
    title: "ShushuCity",
    cn: "数数城 · 直播伪装器",
    thesis: "让一段视频，变成虚拟像素直播。",
    description:
      "数数城在本地分析画面和声音，驱动像素居民、评论、礼物与投掷反馈，再把整场演出导出为视频。",
    status: "iOS · 本地版本",
    evidence: "SWIFTUI · OFFLINE ANALYSIS · VIDEO EXPORT",
    accent: "yellow",
    scope: ["WORLD", "SWIFTUI", "VISION", "AVFOUNDATION", "EXPORT"],
    contribution: "玩法构思 · 像素视觉与交互 · AI 协同开发",
    decision: "居民、评论和礼物跟随素材演出，预览与导出沿用同一组事件。",
    outcome: "素材选择、演出与视频导出",
    steps: [
      {
        label: "素材",
        title: "选素材与演出气氛",
        copy: "选择视频或直接拍摄，再设置“轻轻围观”、“热闹开场”或“损友起哄”。",
        image: "/cases/shushucity-home.png",
        proof: "IOS / SOURCE",
      },
      {
        label: "演出",
        title: "像素居民进入演出",
        copy: "热度、评论、投掷和居民反应叠加在原视频上。",
        image: "/cases/shushucity-stage.png",
        proof: "IOS / STAGE",
      },
      {
        label: "导出",
        title: "保存完整演出",
        copy: "预览与导出共用事件、角色和时机，成片可保存或分享。",
        image: "/cases/shushucity-export.png",
        proof: "IOS / EXPORT",
      },
    ],
  },
];

// Add a new work here. The selected grid, archive filters and project viewer
// all read from this single catalog, so no page component needs to be rewritten.
export const portfolioProjects: PortfolioProject[] = [
  {
    slug: "yy",
    title: "YY",
    cn: "仓鼠歪歪",
    kind: "PRODUCT",
    status: "FLAGSHIP",
    note: "AI desktop companion",
    copy: "从桌面角色延展到聊天、手账、音乐、换装与商店链路的完整 IP 产品。",
    evidence: "DESKTOP · IP SYSTEM · RELEASE TRACK",
    accent: "blue",
    tags: ["PRODUCT", "IP", "TAURI", "MOTION"],
    media: {
      kind: "image",
      src: "/evidence/yy-wardrobe-real.jpg",
      alt: "YY 歪歪之家衣柜实际界面",
    },
    links: [{ label: "VIEW FLAGSHIP CASE", href: "#selected-work" }],
    gallery: [
      { src: "/evidence/yy-wardrobe-real.jpg", title: "歪歪之家 · 衣柜", copy: "套装、皮肤、帽子、耳饰、眼镜和身体装饰统一放在衣柜。" },
      { src: "/evidence/yy-journal-real.jpg", title: "小手账", copy: "按日期和吃喝、消费、心情、地点、事件整理生活片段。" },
      { src: "/evidence/yy-school-real.jpg", title: "鼠鼠学校", copy: "移动、跳跃、舞步和情绪表达被组织成不同课程。" },
    ],
  },
  {
    slug: "dating-diary",
    title: "Dating Diary",
    cn: "Dating 日记",
    kind: "PRODUCT",
    status: "RELEASE TRACK",
    note: "private dating review",
    copy: "只属于自己的约会记录、趋势与比较系统，覆盖原生 iOS、订阅结构和内容表达。",
    evidence: "IOS · PRIVACY · SUBSCRIPTION",
    accent: "red",
    tags: ["PRODUCT", "IOS", "PRIVACY", "CONTENT"],
    media: {
      kind: "image",
      src: "/evidence/dating-home-real.png",
      alt: "Dating 日记 0.4 模拟器实际界面",
    },
    links: [{ label: "VIEW FLAGSHIP CASE", href: "#selected-work" }],
  },
  {
    slug: "shushucity",
    title: "ShushuCity",
    cn: "数数城 · 直播伪装器",
    kind: "PRODUCT",
    status: "LOCAL COMPLETE",
    note: "virtual broadcast creator",
    copy: "用虚拟角色、像素居民、评论和投掷反馈重构普通自拍视频。",
    evidence: "IOS · VISION · AVFOUNDATION · EXPORT",
    accent: "yellow",
    tags: ["WORLD", "IOS", "MOTION", "VIDEO"],
    media: {
      kind: "image",
      src: "/cases/shushucity-stage.png",
      alt: "数数城实际演出界面",
    },
    links: [{ label: "VIEW FLAGSHIP CASE", href: "#selected-work" }],
  },
  {
    slug: "zinxcord",
    title: "Zinxcord",
    cn: "录屏小子",
    kind: "PRODUCT",
    status: "SHIPPED",
    note: "native screen studio",
    copy: "macOS 录屏与轻量编辑工具。用 HUD 控制区域、声音和摄像头，录完后进入工作台继续整理。",
    evidence: "MACOS · SCREENCAPTUREKIT · APP STORE",
    accent: "blue",
    tags: ["MACOS", "RECORDING", "EDITOR", "APP STORE"],
    media: {
      kind: "image",
      src: "/evidence/zinxcord-hud-real.png",
      alt: "Zinxcord 正在运行的录屏 HUD",
    },
    decision: "用紧凑的 HUD 控制录制，把剪辑与导出集中在工作台。",
    gallery: [
      {
        src: "/evidence/zinxcord-hud-real.png",
        title: "录制 HUD",
        copy: "录制区域、声音与摄像头控制集中在一条工具栏中。",
      },
      {
        src: "/evidence/zinxcord-workbench-real.png",
        title: "导入素材",
        copy: "从本地视频或已保存的录屏项目进入编辑，继续完成整理与导出。",
      },
    ],
    links: [
      {
        label: "在 App Store 查看",
        href: "https://apps.apple.com/cn/app/id6789016284",
        external: true,
      },
    ],
    selected: true,
    large: true,
  },
  {
    slug: "zinxbee",
    title: "ZinxBee",
    cn: "用量小蜜蜂",
    kind: "PRODUCT",
    status: "PUBLIC",
    note: "usage companion",
    copy: "把 Codex 与 Claude 的配额变成一眼可读的蜂巢格。",
    evidence: "MACOS · WINDOWS · OPEN SOURCE",
    accent: "yellow",
    tags: ["MACOS", "WINDOWS", "OPEN SOURCE"],
    media: {
      kind: "image",
      src: "/evidence/zinxbee-real.jpg",
      alt: "ZinxBee 正在运行的用量界面",
    },
    links: [
      {
        label: "OPEN REPO",
        href: "https://github.com/zxzin/zinxbee",
        external: true,
      },
    ],
    selected: true,
  },
  {
    slug: "vibetiming",
    title: "VibeTiming",
    cn: "代码等待小游戏",
    kind: "GAME",
    status: "PUBLIC",
    note: "12 micro games",
    copy: "12 个单输入像素小游戏，把 Agent 等待时间变成一小局。",
    evidence: "WEB · CODEX PLUGIN · OPEN SOURCE",
    accent: "green",
    tags: ["WEB", "ARCADE", "PLUGIN", "OPEN SOURCE"],
    media: {
      kind: "image",
      src: "/projects/vibetiming.png",
      alt: "VibeTiming 像素小游戏",
    },
    links: [
      {
        label: "OPEN REPO",
        href: "https://github.com/zxzin/vibe-timing",
        external: true,
      },
    ],
    selected: true,
  },
  {
    slug: "terms-of-surrender",
    title: "Terms of Surrender",
    cn: "权限投降书",
    kind: "GAME",
    status: "PROTOTYPE",
    note: "privacy allegory",
    copy: "四份权限条款、两条路径，把抽象的数据代价变成可触发的游戏事件。",
    evidence: "PHASER · TYPESCRIPT · PLAYWRIGHT",
    accent: "red",
    tags: ["GAME", "PRIVACY", "PHASER"],
    media: {
      kind: "image",
      src: "/projects/terms.png",
      alt: "权限投降书游戏画面",
    },
    selected: true,
  },
  {
    slug: "zinxpromo",
    title: "ZinxPromo",
    cn: "营销工作记忆系统",
    kind: "SYSTEM",
    status: "LOCAL LAB",
    note: "agent marketing OS",
    copy: "从证据、策略、生产、交付到复盘的 Agent 工作台。",
    evidence: "AGENT HARNESS · EVIDENCE LEDGER",
    accent: "blue",
    tags: ["AGENT", "MARKETING", "EVIDENCE"],
    media: {
      kind: "image",
      src: "/projects/zinxpromo.png",
      alt: "ZinxPromo 工作台",
    },
    selected: true,
  },
  {
    slug: "zinxpho",
    title: "Zinxpho",
    cn: "看我",
    kind: "PRODUCT",
    status: "PRODUCT LAB",
    note: "personal marketing kit",
    copy: "围绕个人形象与视觉方向建立的可选择、可追踪创作产品。",
    evidence: "PRODUCT LAB · VISUAL DIRECTION",
    accent: "red",
    tags: ["PRODUCT", "VISUAL", "AGENT"],
  },
  {
    slug: "party-starter",
    title: "今晚开局",
    cn: "聚会开局工具",
    kind: "PRODUCT",
    status: "FIELD PROTOTYPE",
    note: "offline party utility",
    copy: "一组共享设备即可运行的线下聚会开局工具。",
    evidence: "MOBILE WEB · OFFLINE · PARTY",
    accent: "green",
    tags: ["PRODUCT", "PARTY", "OFFLINE"],
  },
  {
    slug: "favor-ledger",
    title: "来还没往",
    cn: "人情关系",
    kind: "PRODUCT",
    status: "IOS BUILD",
    note: "relationship ledger",
    copy: "把往来事件整理成人情关系账本的 iOS 产品实验。",
    evidence: "IOS · RELATIONSHIP LEDGER",
    accent: "blue",
    tags: ["IOS", "PRODUCT"],
  },
  {
    slug: "rental-guardian",
    title: "租房大保镖",
    cn: "租房检查助手",
    kind: "PRODUCT",
    status: "PROTOTYPE",
    note: "rental safety flow",
    copy: "把看房风险和检查动作组织成可执行流程。",
    evidence: "PROTOTYPE · CHECKLIST",
    accent: "yellow",
    tags: ["PRODUCT", "RENTAL", "SAFETY"],
  },
  {
    slug: "gaokao-agent",
    title: "高考智能体",
    cn: "志愿与信息助手",
    kind: "SYSTEM",
    status: "AGENT PRODUCT",
    note: "evidence-first guidance",
    copy: "以证据状态和信息边界为核心的志愿与信息辅助系统。",
    evidence: "AGENT · EVIDENCE · GUIDANCE",
    accent: "red",
    tags: ["AGENT", "SYSTEM", "EVIDENCE"],
  },
  {
    slug: "mouse-mystery",
    title: "鼠鼠杀",
    cn: "鼠鼠推理游戏",
    kind: "GAME",
    status: "GAME LAB",
    note: "social deduction",
    copy: "围绕仓鼠角色世界展开的社交推理实验。",
    evidence: "GAME LAB · SOCIAL DEDUCTION",
    accent: "red",
    tags: ["GAME", "SOCIAL", "IP"],
  },
  {
    slug: "mouse-security",
    title: "鼠鼠安保公司",
    cn: "仓鼠安保经营",
    kind: "GAME",
    status: "GAME LAB",
    note: "management experiment",
    copy: "把仓鼠世界扩展到安保公司经营的玩法实验。",
    evidence: "GAME LAB · MANAGEMENT",
    accent: "blue",
    tags: ["GAME", "MANAGEMENT", "IP"],
  },
  {
    slug: "mouse-war",
    title: "鼠鼠争霸",
    cn: "仓鼠策略实验",
    kind: "GAME",
    status: "GAME LAB",
    note: "strategy prototype",
    copy: "围绕仓鼠阵营与选择关系展开的策略玩法实验。",
    evidence: "GAME LAB · STRATEGY",
    accent: "yellow",
    tags: ["GAME", "STRATEGY", "IP"],
  },
  {
    slug: "moleme",
    title: "摸了么",
    cn: "休闲游戏实验",
    kind: "GAME",
    status: "GAME LAB",
    note: "tiny interaction",
    copy: "用极短反馈完成一次轻量休闲互动。",
    evidence: "GAME LAB · MICRO INTERACTION",
    accent: "green",
    tags: ["GAME", "CASUAL"],
  },
  {
    slug: "beat-cat-boss",
    title: "打倒猫老板",
    cn: "职场小游戏",
    kind: "GAME",
    status: "GAME LAB",
    note: "office satire",
    copy: "把职场情绪装进短时战斗反馈的小游戏。",
    evidence: "GAME LAB · OFFICE SATIRE",
    accent: "red",
    tags: ["GAME", "OFFICE", "SATIRE"],
  },
  {
    slug: "zinxmarketing",
    title: "ZinxMarketing",
    cn: "营销工具箱",
    kind: "SYSTEM",
    status: "LOCAL BUILD",
    note: "campaign toolkit",
    copy: "围绕营销活动生产、整理和复用的本地工具组合。",
    evidence: "SYSTEM · LOCAL BUILD",
    accent: "green",
    tags: ["SYSTEM", "MARKETING"],
  },
  {
    slug: "hackathon-proof-systems",
    title: "Hackathon Proof Systems",
    cn: "黑客松验证系统集",
    kind: "SYSTEM",
    status: "R&D ARCHIVE",
    note: "agents · proof · data",
    copy: "面向多次黑客松积累的代理、证据和数据验证系统。",
    evidence: "R&D · AGENTS · PROOF",
    accent: "yellow",
    tags: ["SYSTEM", "R&D", "EVIDENCE"],
  },
  {
    slug: "mobile-codex-control",
    title: "手机控制 Codex",
    cn: "远程控制实验",
    kind: "TOOL",
    status: "TOOL LAB",
    note: "mobile control path",
    copy: "探索从移动设备进入本地 Codex 工作流的控制路径。",
    evidence: "TOOL LAB · REMOTE CONTROL",
    accent: "blue",
    tags: ["TOOL", "CODEX", "MOBILE"],
  },
  {
    slug: "frame-overlay",
    title: "叠帧红线",
    cn: "视觉叠帧工具",
    kind: "TOOL",
    status: "CREATIVE TOOL",
    note: "frame comparison",
    copy: "用叠帧与参考线快速检查画面变化和视觉差异。",
    evidence: "TOOL · VISUAL QA",
    accent: "red",
    tags: ["TOOL", "VISUAL", "QA"],
  },
  {
    slug: "zinx-skill-suite",
    title: "Zinx Skill Suite",
    cn: "创作与交付工具组",
    kind: "TOOL",
    status: "PUBLIC + PRIVATE",
    note: "design · video · delivery",
    copy: "覆盖设计、视频、项目执行与交付验证的可复用 Skill 组合。",
    evidence: "SKILLS · DESIGN · VIDEO · DELIVERY",
    accent: "green",
    tags: ["TOOL", "SKILLS", "AI"],
  },
];

export const selectedProducts = portfolioProjects.filter(
  (project) => project.selected,
);

export const productionSystems: ProductionSystem[] = [
  {
    id: "videopro",
    name: "VideoPro",
    kicker: "RAW FOOTAGE → DELIVERY-READY VIDEO",
    title: "把素材剪成\n完整的意思。",
    description:
      "先整理素材与表达重点，再完成剪辑、字幕和动效。这里是车内办公片段的成片：保留真实场景，用节奏与标注交代正在做的事。",
    accent: "red",
    image: "/systems/videopro-car-office-poster.png",
    secondary: "/systems/videopro-car-office-contact.png",
    video: "/systems/videopro-car-office-loop.mp4",
    poster: "/systems/videopro-car-office-poster.png",
    outputStamp: "NO-FACE CUT / REAL OUTPUT",
    href: "https://github.com/zxzin/videopro",
    proof: "短片 / 长视频 / 访谈 / 产品演示 / 录屏教程",
    stages: ["SOURCE", "STORY", "MOTION", "SUBTITLE", "FINAL QA"],
  },
  {
    id: "runpro",
    name: "RunPro",
    kicker: "MESSY FOLDER → REVIEWABLE HANDOFF",
    title: "把复杂要求，\n落实到交付。",
    description:
      "把分散的材料、要求与反馈整理成清楚的任务，再调用对应工具完成制作、修订与检查。交付前，逐项核对内容和最终呈现。",
    accent: "green",
    image: "/systems/runpro-cover.png",
    secondary: "/systems/runpro-cover.png",
    outputStamp: "REAL OUTPUT",
    href: "https://github.com/zxzin/runpro",
    proof: "论文 / 报告 / 反馈修订 / 演示文稿 / 代码与结果包",
    stages: ["INVENTORY", "LOCK", "EXECUTE", "VALIDATE", "HANDOFF"],
  },
];

export const moods: Accent[] = ["red", "yellow", "blue", "green"];

export const portfolioLevels: PortfolioLevel[] = [
  {
    id: "selected-work",
    number: "01",
    code: "WORK",
    operation: "SELECTED WORK",
    name: "代表作品",
    accent: "yellow",
  },
  {
    id: "products",
    number: "02",
    code: "RELEASE",
    operation: "PRODUCTS",
    name: "软件与实验",
    accent: "red",
  },
  {
    id: "archive",
    number: "03",
    code: "ARCHIVE",
    operation: "ARCHIVE",
    name: "项目存档",
    accent: "blue",
  },
  {
    id: "systems",
    number: "04",
    code: "PROCESS",
    operation: "PROCESS",
    name: "工作方法",
    accent: "green",
  },
  {
    id: "about",
    number: "05",
    code: "ABOUT",
    operation: "ABOUT",
    name: "关于我",
    accent: "blue",
  },
];
