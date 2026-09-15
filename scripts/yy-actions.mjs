import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import postcss from "postcss";

const site = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const yy = path.resolve(site, "../../桌面宠物/pet-yy-mvp");
const gemini = "src/app/PetWindow/gemini/";
const lockFile = path.join(site, "content-sources/yy-actions.json");
const hash = (value) => createHash("sha256").update(value).digest("hex");
const require = createRequire(import.meta.url);
const item = (id, anchor) => ({ id: `yy_wardrobe_daily_${id}`, anchors: [anchor] });
const actions = [
  { id: "stinky", label: "臭臭舞", state: "MUSIC_MEME_TRUE_LOVE", wardrobeItems: [item("yellow_hat", "hat"), item("red_scarf", "body"), item("star_sticker", "face_accessory")] },
  { id: "juggle", label: "手抛球", state: "V13_HAND_BALL_JUGGLE", wardrobeItems: [item("sleep_hat", "hat")], wardrobeItemVariants: { yy_wardrobe_daily_sleep_hat: "yellow" } },
  { id: "orbit", label: "旋转手", state: "V13_HAND_BALL_SHIELD", wardrobeItems: [] },
  { id: "barrage", label: "冲击波", state: "V13_HAND_ENERGY_BARRAGE", wardrobeItems: [item("red_scarf", "body")] },
];

if (process.argv.includes("--sync")) {
  const dependencies = new Map();
  const modules = new Map();
  const styles = new Map();
  function source(file) {
    const content = readFileSync(file, "utf8");
    dependencies.set(path.relative(yy, file), hash(content));
    return content;
  }
  // Evaluate the current, local rendering modules only. Native app entrypoints
  // and archived renderers never enter this export graph.
  function load(request, parent = path.join(yy, "entry.ts")) {
    if (!request.startsWith(".")) {
      assert.match(request, /^react(?:\/jsx-runtime)?$/, `Review renderer dependency ${request}`);
      return require(request);
    }
    const base = path.resolve(path.dirname(parent), request);
    const file = [base, ...[".ts", ".tsx", ".js", ".json", "/index.ts", "/index.tsx"].map(ext => base + ext)]
      .find(candidate => existsSync(candidate) && path.extname(candidate));
    assert.ok(file && file.startsWith(yy + path.sep), `Unresolved YY module ${request}`);
    assert.doesNotMatch(path.relative(yy, file), /(?:^|\/)(?:archive|history|legacy)(?:\/|$)/i);
    if (modules.has(file)) return modules.get(file).exports;
    if (/\.(?:png|webp|svg|jpg)$/.test(file)) return file;
    const content = source(file);
    if (file.endsWith(".css")) { styles.set(file, content); return {}; }
    if (file.endsWith(".json")) return JSON.parse(content);
    const module = { exports: {} };
    modules.set(file, module);
    const compiled = ts.transpileModule(content, { fileName: file, compilerOptions: {
      target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true,
    } });
    // Exports select the canonical appearance explicitly, independent of a
    // developer's Vite environment skin overrides.
    const executable = compiled.outputText.replaceAll("import.meta.env", "({})");
    new Function("require", "module", "exports", executable)(id => load(id, file), module, module.exports);
    return module.exports;
  }
  const { PetSvg } = load(`./${gemini}components/PetSvg.tsx`);
  const { PetState } = load(`./${gemini}types.ts`);
  const { PET_THEMES } = load(`./${gemini}data/themeConfig.ts`);
  source(path.join(yy, `${gemini}motion/presetManifest.json`));
  source(path.join(yy, `${gemini}v13/manifest.json`));
  source(path.join(yy, "tailwind.config.cjs"));

  function exportAction(action) {
    const props = {
      pupilOffset: { x: 0, y: 0 },
      theme: PET_THEMES.iceBlue, wardrobeSkin: null,
      wardrobeItems: action.wardrobeItems, wardrobeItemVariants: action.wardrobeItemVariants,
      stabilizeOpenEyeGaze: true,
    };
    const markup = renderToStaticMarkup(React.createElement(PetSvg, { ...props, state: PetState[action.state] }));
    const still = renderToStaticMarkup(React.createElement(PetSvg, { ...props, state: PetState.IDLE }));
    assert.match(markup, /data-yy-base-appearance-id="yy_base_v13"/);
    let svg = markup.slice(markup.indexOf("<svg"));
    assert.doesNotMatch(svg, /<image\b|<script\b|(?:href|src)="(?:https?:|\/Users\/)/);
    const classes = new Set([...svg.matchAll(/class="([^"]+)"/g)].flatMap(match => match[1].split(/\s+/)));
    const inline = [...markup.matchAll(/<style>([\s\S]*?)<\/style>/g)].map(match => match[1]).join("\n");
    const sheet = postcss.parse([...styles.values(), inline].join("\n"));
    const usedRules = [];
    sheet.walkRules(rule => {
      if (rule.parent.type === "atrule" && rule.parent.name.endsWith("keyframes")) return;
      const selectors = rule.selectors.filter(selector => [...selector.matchAll(/\.([\w-]+)/g)].some(match => classes.has(match[1])));
      if (selectors.length) { const selected = rule.clone(); selected.selectors = selectors; usedRules.push(selected); }
    });
    const declarations = usedRules.map(rule => rule.toString()).join("\n");
    const keyframes = [];
    sheet.walkAtRules("keyframes", rule => {
      if (new RegExp(`\\b${rule.params}\\b`).test(declarations)) keyframes.push(rule.clone());
    });
    assert.ok(keyframes.length >= 5, `${action.id} must preserve its body, ears and hand timelines`);
    const scope = `.yy-action-art[data-action="${action.id}"]`;
    const css = postcss.root({ nodes: [...usedRules, ...keyframes] });
    const names = new Map(keyframes.map(rule => [rule.params, `yy-case-${action.id}-${rule.params}`]));
    css.walkAtRules("keyframes", rule => { rule.params = names.get(rule.params); });
    css.walkDecls(/^animation/, decl => {
      for (const [from, to] of names) decl.value = decl.value.replace(new RegExp(`(?<![\\w-])${from}(?![\\w-])`, "g"), to);
    });
    for (const rule of usedRules) rule.selectors = rule.selectors.map(selector => `${scope} ${selector}`);
    css.walkComments(comment => comment.remove());
    // Reproduce the source app's Tailwind utilities before its motion rules.
    const utilities = `${scope} .origin-bottom{transform-origin:center bottom}
${scope} .origin-center{transform-origin:center}
${scope} [class~="[transform-box:fill-box]"]{transform-box:fill-box}
${scope} [class~="origin-[150px_130px]"]{transform-origin:150px 130px}
${scope} .fill-pupil-black{fill:#1a1a1a}
${scope} .pointer-events-none{pointer-events:none}
${scope} .w-full{width:100%}${scope} .h-full{height:100%}${scope} .overflow-visible{overflow:visible}`;
    function namespace(value) {
      for (const id of [...value.matchAll(/\sid="([^"]+)"/g)].map(match => match[1])) {
        const unique = `yy-case-${action.id}-${id}`;
        value = value.replaceAll(` id="${id}"`, ` id="${unique}"`).replaceAll(`url(#${id})`, `url(#${unique})`).replaceAll(`href="#${id}"`, `href="#${unique}"`);
      }
      return value;
    }
    svg = namespace(svg);
    return { svg, stillSvg: namespace(still.slice(still.indexOf("<svg"))), css: utilities + "\n" + css.toString(), state: action.state, label: action.label };
  }
  const outputs = {
    "src/vendor/yy/actions.json": JSON.stringify(Object.fromEntries(actions.map(action => [action.id, exportAction(action)]))) + "\n",
  };
  for (const [file, content] of Object.entries(outputs)) {
    await mkdir(path.dirname(path.join(site, file)), { recursive: true });
    await writeFile(path.join(site, file), content);
  }
  await writeFile(lockFile, JSON.stringify({ appearance: "yy_base_v13", syncedAt: new Date().toISOString(), actions,
    sources: Object.fromEntries([...dependencies].sort(([a], [b]) => a.localeCompare(b))),
    outputs: Object.fromEntries(Object.entries(outputs).map(([file, content]) => [file, hash(content)])),
  }, null, 2) + "\n");
}

const lock = JSON.parse(await readFile(lockFile, "utf8"));
assert.equal(lock.appearance, "yy_base_v13");
assert.deepEqual(lock.actions, actions);
for (const [file, expected] of Object.entries(lock.outputs)) assert.equal(hash(await readFile(path.join(site, file))), expected, `Re-sync YY action export: ${file}`);
if (existsSync(yy)) {
  for (const [file, expected] of Object.entries(lock.sources)) assert.equal(hash(await readFile(path.join(yy, file))), expected, `YY source changed; run npm run sync:yy and visually review ${file}`);
}
console.log("[YY] Four current-source action renderings and dependency hashes verified.");
