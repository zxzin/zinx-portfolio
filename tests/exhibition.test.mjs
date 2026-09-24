import assert from "node:assert/strict";
import test from "node:test";
import { access, readFile } from "node:fs/promises";
import { coinInitials, composeExhibition, isLocalDemo, mediaPoster, previewMedia } from "../src/lib/exhibition-model.ts";
import { exhibitCatalog, exhibition, visibleExhibits, entranceEmblems } from "../src/content/exhibition.ts";

const groups = [{ id: "main", title: "Main", label: "MAIN", layout: "salon" }, { id: "later", title: "Later", label: "LATER", layout: "grid" }];
const fixture = id => ({ id, title: id, subtitle: id, summary: "", status: "", accent: "blue", tags: [], links: [], defaultGroup: "main", media: [{ id: "cover", kind: "image", src: "/cover.png", alt: "", title: "" }] });
test("adding, replacing, hiding, moving and reordering works needs only catalog/placement changes", () => {
  const catalog = Array.from({length:7}, (_, i) => fixture("work-" + i));
  assert.deepEqual(composeExhibition(catalog, groups), []);
  const enabled = catalog.map(work => ({ id: work.id, visible: true }));
  assert.equal(composeExhibition(catalog, groups, enabled)[0].works.length, 7);
  const sections = composeExhibition(catalog, groups, enabled.map(placement => ({ ...placement, ...([
    {id:"work-0", visible:false}, {id:"work-6", order:0, featured:true}, {id:"work-1", group:"later"},
  ].find(setting => setting.id === placement.id) ?? {}) })));
  assert.equal(sections[0].works[0].id, "work-6");
  assert.ok(sections[0].works[0].featured);
  assert.equal(sections.flatMap(s => s.works).length, 6);
  assert.equal(sections[1].works[0].id, "work-1");
  assert.equal(composeExhibition([fixture("replacement")], groups, [{ id: "replacement", visible: true }])[0].works[0].id, "replacement");
  assert.deepEqual(composeExhibition([], groups), []);
});
test("bad references fail early with specific content errors", () => {
  assert.throws(() => composeExhibition([fixture("My Project")], groups), /Invalid exhibit ID/);
  assert.throws(() => composeExhibition([fixture("a"), fixture("a")], groups), /Duplicate exhibit/);
  assert.throws(() => composeExhibition([fixture("a")], groups, [{id:"a", group:"missing"}]), /Unknown group/);
  assert.throws(() => composeExhibition([fixture("a")], groups, [{id:"a", mediaIds:["missing"]}]), /Unknown media/);
  assert.throws(() => composeExhibition([fixture("a")], groups, [{id:"missing"}]), /Invalid placement/);
});
test("one preview contract selects actual media and rejects stale preview references", () => {
  const work = fixture("new-project");
  assert.equal(previewMedia(work).id, "cover");
  assert.equal(previewMedia({ ...work, media: [] }), undefined);
  work.media.push({ id: "film", kind: "video", src: "/film.mp4", poster: "/poster.png", title: "Film" });
  work.preview = { mediaId: "film", caption: "A real output" };
  const [section] = composeExhibition([work], groups, [{ id: work.id, visible: true }]);
  assert.equal(previewMedia(section.works[0]).kind, "video");
  assert.throws(() => composeExhibition([work], groups, [{ id: work.id, visible: true, mediaIds: ["cover"] }]), /Unknown preview/);
  assert.throws(() => composeExhibition([{ ...work, preview: {mediaId:"missing", caption:""} }], groups), /Unknown preview/);
});
test("coins use real identity assets and keep screenshots and playback in details", async () => {
  const card = await readFile(new URL("../src/components/ProjectCard.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../src/components/exhibition.css", import.meta.url), "utf8");
  assert.match(card, /assetPath\(emblem.src\)/);
  assert.doesNotMatch(card, /<video|mediaPoster|previewMedia|card-preview/);
  assert.match(card, /image.onerror = \(\) => setFailed\(true\)/);
  assert.match(card, /image.onerror = null/);
  assert.match(card, /coinInitials\(work.title\)/);
  assert.equal(coinInitials("VideoPro"), "VP");
  assert.equal(coinInitials("Zinxcord"), "ZI");
  assert.equal(coinInitials("Future Project"), "FP");
  assert.match(card, /visibilitychange/);
  assert.match(card, /onPointerLeave=\{reset\}/);
  assert.match(card, /onBlur=\{reset\}/);
  assert.match(css, /\.coin-product-emblem \{[^}]*pointer-events: none/);
  for (const work of visibleExhibits.filter(work => work.emblem)) await access(new URL("../dist" + work.emblem.src, import.meta.url));
});
test("coin fronts share a concentric bezel and isolated curved inscriptions", async () => {
  const card = await readFile(new URL("../src/components/ProjectCard.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../src/components/exhibition.css", import.meta.url), "utf8");
  assert.match(card, /const id = useId\(\)/);
  assert.match(card, /<CoinRim inscribed \/><CoinInscription/);
  assert.match(card, /<textPath href=\{"#" \+ id \+ "-title"\}/);
  assert.match(card, /<textPath href=\{"#" \+ id \+ "-action"\}/);
  assert.match(css, /\.coin-inscription \{[^}]*z-index: 1;[^}]*pointer-events: none/);
  assert.match(css, /\.coin-metal-field \{[^}]*border-radius: 50%/);
  assert.match(card, /className="coin-visit"/);
  assert.doesNotMatch(card, /已看过 · 再看看/);
});
test("table controls keep copy brief and allow redealing and keyboard selection without hiding works", async () => {
  const read = p => readFile(new URL("../" + p, import.meta.url), "utf8");
  const wall = await read("src/components/ExhibitionWall.tsx");
  const entrance = await read("src/components/PortalEntrance.tsx");
  assert.doesNotMatch(wall + entrance, /一些做出来的东西|作品上桌|拉一次，连转三轮|约 6 秒|往下还有更多/);
  assert.match(wall, /重新散币/);
  assert.match(wall, /onInterrupt: \(\) => setDealing\(false\)/);
  assert.match(wall, /dealTimeline.current\?\.kill\(\)/);
  assert.match(wall, /clearProps: "transform,opacity"/);
  assert.match(wall, /ArrowLeft.*ArrowRight.*Home.*End/);
  assert.match(wall, /element.removeEventListener\('keydown', keyboard\)/);
  assert.match(wall, /if \(reduced\) \{ cards\[0\]/);
});
test("independent 3D cards use a stable pointer footprint, layered faces and reduced motion", async () => {
  const card = await readFile(new URL("../src/components/ProjectCard.tsx", import.meta.url), "utf8");
  const css = await readFile(new URL("../src/components/exhibition.css", import.meta.url), "utf8");
  assert.match(card, /footprint.current\?\.getBoundingClientRect/);
  assert.match(card, /Math.max\(-1, Math.min\(1/);
  assert.match(card, /event.pointerType !== "mouse"/);
  assert.match(card, /onPointerCancel=\{reset\}/);
  assert.match(card, /className="card-face"/);
  assert.match(card, /function CoinRim\(/);
  assert.match(card, /className="coin-rim"[^>]*aria-hidden="true"[^>]*focusable="false"/);
  assert.match(css, /\.coin-rim \{[^}]*pointer-events: none/);
  assert.match(css, /backface-visibility: hidden/);
  assert.match(css, /\.coin-turner::before \{ transform: translateZ\(-7px\)/);
  assert.doesNotMatch(css, /\.project-card::before/);
  assert.match(card, /const faceUp = revealed \|\| active/);
  assert.match(card, /if \(!faceUp\) \{ onReveal\(work.id\); return; \}/);
  const wall = await readFile(new URL("../src/components/ExhibitionWall.tsx", import.meta.url), "utf8");
  assert.match(wall, /new Set\(visibleExhibits.map\(item => item.id\)\)/);
  assert.match(wall, /一键翻开/);
  assert.match(css, /translateZ\(-7px\)/);
  assert.match(css, /--card-lift: -16px/);
  assert.match(css, /repeat\(3, minmax\(0, 280px\)\)/);
  assert.match(css, /html\[data-motion=reduced\] \.project-card \{ transform: none/);
});
test("all real catalog media are packaged, unique and format-specific", async () => {
  assert.equal(new Set(visibleExhibits.map(item => item.id)).size, visibleExhibits.length);
  assert.equal(exhibition.reduce((n, s) => n + s.works.length, 0), visibleExhibits.length);
  assert.equal(visibleExhibits.length, 5);
  assert.ok(exhibitCatalog.length > visibleExhibits.length);
  assert.ok(visibleExhibits.every(work => work.media.length > 0));
  assert.deepEqual(visibleExhibits.map(work => work.id), ["yy", "dating-diary", "monkex", "zinxcord", "videopro"]);
  for (const work of visibleExhibits) {
    for (const media of work.media) {
      await access(new URL("../dist" + mediaPoster(media), import.meta.url));
      if (media.kind === "video" || media.kind === "demo" || media.kind === "animation") await access(new URL("../dist" + media.src, import.meta.url));
    }
  }
  assert.deepEqual(visibleExhibits.find(w => w.id === "yy").media.filter(m => m.kind === "yy").map(m => m.action), ["stinky","juggle","orbit","barrage"]);
});
test("deferred works retain their media and stay out of the wall and entrance", async () => {
  assert.ok(exhibitCatalog.find(work => work.id === "shushucity").media.length > 0);
  assert.ok(!visibleExhibits.some(work => work.id === "shushucity"));
  assert.deepEqual(entranceEmblems.map(emblem => emblem.src), ["/brand/yy-base-v13.svg", "/brand/dating-icon.png", "/brand/monkex-icon.png"]);
  const scene = await readFile(new URL("../src/components/PortalScene.tsx", import.meta.url), "utf8");
  assert.match(scene, /useTexture\(entranceEmblems.map/);
});
test("new catalog items and text-only records stay off the public wall until curated", () => {
  const catalog = [fixture("published"), fixture("future"), { ...fixture("text-only"), media: [] }];
  const result = composeExhibition(catalog, groups, [{ id: "published", visible: true }, { id: "text-only", visible: true }]);
  assert.deepEqual(result.flatMap(group => group.works).map(work => work.id), ["published"]);
});
test("source inventory and design system cover the current content and shared chrome", async () => {
  const inventory = await readFile(new URL("../WORKS_INVENTORY.md", import.meta.url), "utf8");
  for (const work of exhibitCatalog) assert.ok(inventory.includes("`" + work.id + "`"), `Inventory missing ${work.id}`);
  const tokens = await readFile(new URL("../src/design/tokens.css", import.meta.url), "utf8");
  assert.match(tokens, /--zx-radius-shell: 24px/);
  assert.match(tokens, /--zx-radius-panel: 18px/);
  assert.match(tokens, /--zx-radius-control: 14px/);
  const arcadeCss = await readFile(new URL("../src/components/arcade.css", import.meta.url), "utf8");
  assert.doesNotMatch(arcadeCss, /\.arcade-experience button:disabled\s*\{[^}]*opacity/);
  const app = await readFile(new URL("../src/App.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(app, /<Library|import\("\.\/CreativeWorkshop"\)/);
});
test("local demo boundary rejects remote URLs and traversal", () => {
  assert.ok(isLocalDemo("/projects/monkex/guide.html"));
  for (const path of ["https://example.com", "//example.com/test.html", "/projects/../secret.html", "javascript:alert(1)"]) assert.ok(!isLocalDemo(path));
});
test("renderers preserve full image proportions, focus, paused media and source-bound YY", async () => {
  const read = p => readFile(new URL("../" + p, import.meta.url), "utf8");
  const [wall, dialog, css, yy] = await Promise.all(["src/components/ExhibitionWall.tsx", "src/components/ExhibitDialog.tsx", "src/components/exhibition.css", "src/components/YYCompanion.tsx"].map(read));
  assert.match(wall, /exhibition.map/);
  assert.match(wall, /popstate/);
  assert.match(wall, /preventScroll: true/);
  assert.match(dialog, /element.close\(\); returnFocus\(\)/);
  assert.doesNotMatch(dialog, /document.activeElement/);
  assert.match(dialog, /element.showModal/);
  assert.match(dialog, /onCancel/);
  assert.match(dialog, /visibilitychange/);
  assert.match(dialog, /sandbox="allow-scripts"/);
  assert.match(css, /object-fit: contain/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(yy, /data-outfit/);
  assert.doesNotMatch(wall, /hubIndex|railOffset|HUB_SLUGS/);
});
