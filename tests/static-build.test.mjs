import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import postcss from "postcss";
import {
  caseStepAt,
  stepProgress,
  wrapIndex,
  STORY_MEDIA,
} from "../src/lib/navigation.ts";
import {
  featureCases,
  portfolioProjects,
  productionSystems,
} from "../src/content/portfolio.ts";

const root = new URL("../", import.meta.url);
const read = (file) => readFile(new URL(file, root), "utf8");

test("release output contains only reviewed media and git uses the same allowlist", async () => {
  const approved = JSON.parse(await read("content-sources/public-assets.json"));
  const entries = await readdir(new URL("dist/", root), { recursive: true, withFileTypes: true });
  const actual = entries.filter(entry => entry.isFile()).map(entry => {
    return "/" + path.relative(fileURLToPath(new URL("dist/", root)), path.join(entry.parentPath, entry.name)).split(path.sep).join("/");
  }).filter(file => file !== "/index.html" && !file.startsWith("/assets/"));
  assert.deepEqual(actual.sort(), [...approved].sort());
  const gitAllowlist = [...(await read(".gitignore")).matchAll(/^!\/public(\/[^*\n]+)$/gm)].map(match => match[1]);
  assert.deepEqual(gitAllowlist.sort(), [...approved].sort());
});

test("build is static and honors GitHub Pages base paths", async () => {
  const html = await read("dist/index.html");
  assert.match(html, /<title>Zinx — AI-Native Product Builder<\/title>/);
  assert.match(html, /assets\/.+\.js/);
  assert.doesNotMatch(html, /_next|wrangler/);
  const base = process.env.VITE_BASE_PATH || "/";
  assert.ok(html.includes(`${base}assets/`));
  await access(new URL("dist/og.png", root));
  assert.ok(
    (await readdir(new URL("dist/assets/", root))).some((file) =>
      file.endsWith(".css"),
    ),
  );
});

test("every public media reference points to a real packaged asset", async () => {
  const paths = [
    ...featureCases.flatMap((item) => item.steps.map((step) => step.image)),
    ...portfolioProjects.flatMap((item) => [
      item.media?.src,
      ...(item.gallery?.map((frame) => frame.src) ?? []),
    ]),
    ...productionSystems.flatMap((item) => [
      item.image,
      item.secondary,
      item.video,
      item.poster,
    ]),
  ].filter(Boolean);
  await Promise.all(
    [...new Set(paths)].map((path) => access(new URL(`dist${path}`, root))),
  );
  assert.equal(featureCases.length, 3);
  assert.equal(
    new Set(portfolioProjects.map((item) => item.slug)).size,
    portfolioProjects.length,
  );
  assert.ok(
    portfolioProjects.find((item) => item.slug === "zinxcord").gallery.length >
      1,
  );
});

test("YY uses one source-locked current appearance across hero, greeting and case", async () => {
  const lock = JSON.parse(await read("content-sources/yy-appearance.json"));
  const svg = await read(`public${lock.asset}`);
  assert.equal(createHash("sha256").update(svg).digest("hex"), lock.sources.reference.sha256);
  assert.match(svg, /ry="32"/);
  assert.match(svg, /cx="116" cy="131" r="14"/);
  assert.match(svg, /cx="184" cy="131" r="14"/);
  assert.doesNotMatch(svg, /ry="35"|r="12"/);
  const component = await read("src/ZinxPortfolio.tsx");
  assert.match(component, /<YYCompanion\s*\/>/);
  assert.equal(featureCases[0].steps[0].image, lock.asset);
  for (const text of [component, JSON.stringify(featureCases)]) {
    assert.doesNotMatch(text, /yy-idle-real\.png|yy-dance-real\.png/);
  }
  for (const file of ["yy-idle-real.png", "yy-dance-real.png"]) {
    await assert.rejects(access(new URL(`public/evidence/${file}`, root)));
    await assert.rejects(access(new URL(`dist/evidence/${file}`, root)));
  }
  assert.equal(await read(`dist${lock.asset}`), svg);
});

test("YY dancer exports only current source parts, wardrobe and motion", async () => {
  const lock = JSON.parse(await read("content-sources/yy-appearance.json"));
  assert.ok(Object.keys(lock.outputs).length >= 8);
  for (const [file, sha256] of Object.entries(lock.outputs)) {
    assert.equal(createHash("sha256").update(await read(file)).digest("hex"), sha256);
  }
  for (const { file } of Object.values(lock.sources)) {
    assert.doesNotMatch(file, /archive|history|preview|legacy/i);
  }
  const parts = JSON.parse(await read("src/vendor/yy/base-parts.json"));
  const reference = await read(`public${lock.asset}`);
  for (const part of Object.values(parts)) assert.ok(reference.includes(part));
  const dancer = await read("src/components/YYCompanion.tsx");
  for (const item of ["DailyRedScarf", "DailyYellowHat", "DailyStarSticker"]) {
    assert.match(dancer, new RegExp(`<${item}`));
  }
  assert.doesNotMatch(dancer, /<video|<canvas|yy-(?:idle|dance)-real|archive\//);
});

test("YY dance loops visibly, pauses accessibly and returns after an encore", async () => {
  const dancer = await read("src/components/YYCompanion.tsx");
  assert.match(dancer, /IntersectionObserver/);
  assert.match(dancer, /visibilitychange/);
  assert.match(dancer, /useReducedMotion/);
  assert.match(dancer, /onAnimationEnd/);
  assert.match(dancer, /暂停 YY 跳舞/);
  const css = await read("src/components/YYCompanion.css");
  assert.match(css, /animation-iteration-count:\s*infinite/);
  assert.match(css, /animation-play-state:\s*paused/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});

test("case tab destinations and scroll phases share the same coordinate", () => {
  for (const count of [1, 3, 4, 7]) {
    for (let index = 0; index < count; index++)
      assert.equal(caseStepAt(stepProgress(index, count), count), index);
    assert.equal(caseStepAt(-1, count), 0);
    assert.equal(caseStepAt(1, count), count - 1);
    assert.equal(caseStepAt(2, count), count - 1);
  }
  assert.match(STORY_MEDIA, /min-width: 1081px/);
  assert.match(STORY_MEDIA, /min-height: 640px/);
  assert.match(STORY_MEDIA, /prefers-reduced-motion: no-preference/);
});

test("YY case tabs each use their real current-source expression and retain native UI details", async () => {
  const expected = {
    stinky: "MUSIC_MEME_TRUE_LOVE",
    juggle: "V13_HAND_BALL_JUGGLE",
    orbit: "V13_HAND_BALL_SHIELD",
    barrage: "V13_HAND_ENERGY_BARRAGE",
  };
  const bundle = JSON.parse(await read("src/vendor/yy/actions.json"));
  const lock = JSON.parse(await read("content-sources/yy-actions.json"));
  assert.deepEqual(featureCases[0].steps.map(step => step.yyAction), Object.keys(expected));
  assert.deepEqual(featureCases[0].steps.map(step => step.label), ["臭臭舞", "手抛球", "旋转手", "冲击波"]);
  for (const [id, state] of Object.entries(expected)) {
    assert.equal(bundle[id].state, state);
    assert.match(bundle[id].svg, /data-yy-base-appearance-id="yy_base_v13"/);
    assert.doesNotMatch(bundle[id].svg, /<image\b|<script\b|\/Users\/|yy-idle-real/);
    const ids = [...bundle[id].svg.matchAll(/\sid="([^"]+)"/g)].map(match => match[1]);
    assert.equal(new Set(ids).size, ids.length);
    assert.ok(ids.every(value => value.startsWith(`yy-case-${id}-`)));
    const sheet = postcss.parse(bundle[id].css);
    const names = new Set();
    sheet.walkAtRules("keyframes", rule => names.add(rule.params));
    assert.ok(names.size >= 5);
    sheet.walkDecls(/^animation(?:-name)?$/, decl => {
      assert.ok(names.has(decl.value.split(/\s+/)[0]), `Missing timeline ${decl.value}`);
    });
    assert.match(bundle[id].stillSvg, /data-yy-base-appearance-id="yy_base_v13"/);
  }
  assert.match(bundle.stinky.svg, /yy_wardrobe_daily_red_scarf/);
  assert.match(bundle.stinky.svg, /yy_wardrobe_daily_yellow_hat/);
  assert.match(bundle.stinky.svg, /yy_wardrobe_daily_star_sticker/);
  assert.match(bundle.juggle.svg, /data-sleep-hat-colorway="yellow"/);
  assert.match(bundle.barrage.svg, /yy_wardrobe_daily_red_scarf/);
  for (const source of Object.keys(lock.sources)) assert.doesNotMatch(source, /(?:^|\/)(?:archive|history|legacy)(?:\/|$)/i);
  for (const [file, sha256] of Object.entries(lock.outputs)) assert.equal(createHash("sha256").update(await read(file)).digest("hex"), sha256);
  const gallery = portfolioProjects.find(project => project.slug === "yy").gallery;
  assert.deepEqual(gallery.map(frame => frame.src), ["/evidence/yy-wardrobe-real.jpg", "/evidence/yy-journal-real.jpg", "/evidence/yy-school-real.jpg"]);
  assert.match(await read("src/ZinxPortfolio.tsx"), /if \(project.gallery\) return project.gallery/);
});

test("YY case playback has per-action lifecycle and a dressed reduced-motion still", async () => {
  const component = await read("src/components/YYActionStage.tsx");
  const page = await read("src/ZinxPortfolio.tsx");
  const css = await read("src/components/YYActionStage.css");
  assert.match(component, /IntersectionObserver/);
  assert.match(component, /visibilitychange/);
  assert.match(component, /inView && visible && !paused && !reduced/);
  assert.match(component, /reduced \? current.stillSvg : current.svg/);
  assert.match(component, /setReplay\(value => value \+ 1\)/);
  assert.match(page, /YYActionStage key=\{current.yyAction\}/);
  assert.match(page, /current.yyAction \? 0 : step/);
  assert.match(css, /animation-play-state: paused !important/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});

test("gallery wraps within the media-only collection in both directions", () => {
  const projects = portfolioProjects.filter((item) => item.media);
  assert.ok(projects.length < portfolioProjects.length);
  assert.equal(wrapIndex(projects.length - 1, 1, projects.length), 0);
  assert.equal(wrapIndex(0, -1, projects.length), projects.length - 1);
  for (let index = 0; index < projects.length; index++) {
    assert.ok(projects[wrapIndex(index, 1, projects.length)].media);
    assert.ok(projects[wrapIndex(index, -1, projects.length)].media);
  }
  assert.equal(wrapIndex(0, 1, 0), -1);
});

test("layout and motion contracts guard the reproduced regressions", async () => {
  const [component, css, matter] = await Promise.all([
    read("src/ZinxPortfolio.tsx"),
    read("src/styles.css"),
    read("src/components/PixelMatter.tsx"),
  ]);
  assert.match(css, /\.zinx-site\s*\{[^}]*overflow:\s*clip/s);
  assert.match(css, /\.case-stage\s*\{[^}]*position:\s*sticky[^}]*100svh/s);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /backdrop-filter:\s*blur/);
  assert.match(component, /galleryProjects\[index\]\.slug/);
  assert.match(component, /element\.showModal\(\)/);
  assert.match(component, /event\.key === "Tab"/);
  assert.match(component, /document\.activeElement === last/);
  assert.match(component, /tabIndex=\{i === active \? 0 : -1\}/);
  assert.doesNotMatch(
    component,
    /autoAlpha|ChapterTransition|StoryDock|GenomeBus/,
  );
  assert.match(matter, /elapsed < 1100/);
  assert.match(matter, /motion\.addEventListener\("change", clear\)/);
  assert.doesNotMatch(matter, /addEventListener\("scroll"/);
});

test("visitor-facing copy excludes internal correction and animation labels", async () => {
  const builtFiles = (await readdir(new URL("dist/assets/", root))).filter(
    (file) => file.endsWith(".js"),
  );
  const content = [
    await read("src/ZinxPortfolio.tsx"),
    JSON.stringify({ featureCases, portfolioProjects, productionSystems }),
    ...(await Promise.all(
      builtFiles.map((file) => read(`dist/assets/${file}`)),
    )),
  ].join("\n");
  const denylist = [
    "REASSEMBLING",
    "PIXEL MATTER",
    "CASE PATH",
    "FRAME_",
    "这里不只陈列成品",
    "下方展示对应产出",
    "无脚的蓝色仓鼠",
    "哈希质量回执",
    "关上完整交付",
  ];
  for (const text of denylist) assert.ok(!content.includes(text), text);
  for (const item of featureCases) {
    assert.ok(item.contribution && item.decision);
    assert.ok(
      item.steps.every(
        (step) =>
          !step.image.includes("virtual") && !step.image.includes("generated"),
      ),
    );
  }
});
