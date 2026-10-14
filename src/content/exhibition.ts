import { featureCases, portfolioProjects, productionSystems } from "./portfolio.ts";
import { extraExhibits } from "./extra-exhibits.ts";
import { composeExhibition, type Exhibit, type ExhibitMedia, type ExhibitionGroup, type Placement } from "../lib/exhibition-model.ts";

const previews: Record<string, Exhibit["preview"]> = {
  yy: { caption: "桌面陪伴、换装与动作。", play: "yy" },
  "dating-diary": { caption: "记录约会，回顾相处。", play: "diary" },
  shushucity: { caption: "给视频加上弹幕与直播效果。" },
  monkex: { caption: "桌面查看 Codex 任务与额度。", play: "tasks" },
  zinxcord: { caption: "框好画面，把声音和人像一起录下。", play: "capture" },
  videopro: { caption: "车内办公 · 剪辑成片", mediaId: "output", play: "film" },
};
const emblems: Record<string, Exhibit["emblem"]> = {
  yy: { src: "/brand/yy-base-v13.svg", treatment: "silhouette" },
  "dating-diary": { src: "/brand/dating-icon.png", treatment: "tile" },
  shushucity: { src: "/brand/shushu-icon.png", treatment: "tile" },
  monkex: { src: "/brand/monkex-icon.png", treatment: "tile" },
  zinxcord: { src: "/projects/zinxcord/icon.png", treatment: "tile" },
};

// Product facts stay in portfolio.ts. This adapter gives every kind of work one presentation contract.
export const exhibitCatalog: Exhibit[] = [
  ...portfolioProjects.map((project): Exhibit => {
    const detail = featureCases.find(item => (item.id === "dating" ? "dating-diary" : item.id) === project.slug);
    const media: ExhibitMedia[] = [];
    const seen = new Set<string>();
    const addImage = (id: string, src: string, title: string, caption?: string, alt = title) => {
      if (seen.has(src)) return;
      seen.add(src); media.push({ id, kind: "image", src, title, caption, alt });
    };
    if (project.media) addImage("cover", project.media.src, project.media.title ?? project.media.alt, undefined, project.media.alt);
    for (const [index, frame] of (project.gallery ?? []).entries()) addImage(`gallery-${index + 1}`, frame.src, frame.title, frame.copy);
    for (const [index, step] of (detail?.steps ?? []).entries()) {
      if (step.yyAction) media.push({ id: `action-${step.yyAction}`, kind: "yy", action: step.yyAction, poster: "/brand/yy-base-v13.svg", title: step.title, caption: step.copy });
      else addImage(`step-${index + 1}`, step.image, step.title, step.copy);
    }
    if (project.slug === "monkex") media.push({ id: "guide", kind: "demo", src: "/projects/monkex/guide.html", poster: project.media!.src, title: "打开 Monkex 使用指南" });
    return { id: project.slug, title: project.title, subtitle: project.cn, summary: project.copy,
      status: project.status, accent: project.accent, tags: project.tags, media, links: project.links ?? [], preview: previews[project.slug],
      contribution: detail?.contribution, decision: detail?.decision ?? project.decision, emblem: emblems[project.slug],
      defaultGroup: detail ? "selected" : project.media ? "software" : "index" };
  }),
  ...productionSystems.map((system): Exhibit => ({
    id: system.id, title: system.name, subtitle: system.id === "videopro" ? "视频剪辑工作流" : system.title, summary: system.description, preview: previews[system.id],
    status: "创作工具", accent: system.accent, tags: system.stages, links: [{ label: "项目链接", href: system.href, external: true }], defaultGroup: "practice",
    media: [
      ...(system.video && system.poster ? [{ id: "output", kind: "video" as const, src: system.video, poster: system.poster, title: system.name + " · 成片片段" }] : []),
      { id: "cover", kind: "image", src: system.image, alt: system.title, title: system.title },
      ...(system.secondary !== system.image ? [{ id: "detail", kind: "image" as const, src: system.secondary, alt: system.name + " 产出", title: system.name + " 产出" }] : []),
    ],
  })),
  ...extraExhibits,
];

// The exhibition sequence and placement are independent of the entrance and media renderer.
export const exhibitionGroups: ExhibitionGroup[] = [
  { id: "selected", title: "产品", label: "PRODUCTS", suit: "♥", layout: "salon" },
  { id: "software", title: "工具", label: "TOOLS", suit: "♣", layout: "grid" },
  { id: "games", title: "游戏", label: "PLAY", suit: "✦", layout: "grid" },
  { id: "practice", title: "影像", label: "FILMS", suit: "♦", layout: "grid" },
  { id: "stickers", title: "表情", label: "STICKERS", suit: "✿", layout: "grid" },
  { id: "sculpture", title: "雕塑", label: "SCULPTURES", suit: "♠", layout: "grid" },
  { id: "index", title: "还有这些尝试", label: "WORK INDEX", layout: "index" },
];
export const exhibitionPlacements: Placement[] = [
  { id: "yy", order: 0, featured: true, visible: true },
  { id: "dating-diary", order: 1, visible: true },
  { id: "shushucity", order: 2, visible: false },
  { id: "monkex", group: "software", order: 3, visible: true },
  { id: "zinxcord", group: "software", order: 4, visible: true },
  { id: "videopro", order: 5, visible: false },
  { id: "zinxcord-yy-film", order: 5, featured: true, visible: true },
  { id: "secret-love-vj", order: 6, visible: true },
  { id: "david-sculpture", order: 7, visible: true },
  { id: "cat-judge", order: 8, visible: true },
  { id: "moon-cat", order: 9, visible: true },
  { id: "hamster-pinball", order: 10, visible: true },
  { id: "airflow-study", order: 11, visible: true },
  { id: "yy-stickers", order: 12, visible: true },
];
export const exhibition = composeExhibition(exhibitCatalog, exhibitionGroups, exhibitionPlacements);
export const visibleExhibits = exhibition.flatMap(section => section.works);
// The machine's three approved stickers are curated independently of new exhibits.
export const entranceEmblems = ["yy", "dating-diary", "monkex"].flatMap(id => {
  const work = visibleExhibits.find(item => item.id === id);
  return work?.emblem ? [work.emblem] : [];
});
