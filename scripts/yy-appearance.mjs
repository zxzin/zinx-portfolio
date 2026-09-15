import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const siteRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const sync = args.includes("--sync");
const sourceArg = args.indexOf("--source");
assert.ok(sourceArg < 0 || args[sourceArg + 1], "--source requires the YY repository path");
const yyRoot = sourceArg < 0
  ? path.resolve(siteRoot, "../../桌面宠物/pet-yy-mvp")
  : path.resolve(args[sourceArg + 1]);
const asset = "/brand/yy-base-v13.svg";
const manifestFile = path.join(siteRoot, "content-sources/yy-appearance.json");
const assetFile = path.join(siteRoot, "public", asset);
const sources = {
  reference: "design/icon/yy-base-shape-reference.svg",
  anatomy: "src/app/PetWindow/gemini/appearance/base-v13/anatomy.ts",
  face: "src/app/PetWindow/gemini/appearance/base-v13/V13BaseFaceRenderer.tsx",
  anchors: "src/app/PetWindow/gemini/wardrobe/anchors.ts",
  wardrobeShared: "src/app/PetWindow/gemini/wardrobe/daily-outing/components/shared.tsx",
  scarf: "src/app/PetWindow/gemini/wardrobe/daily-outing/components/DailyRedScarf.tsx",
  hat: "src/app/PetWindow/gemini/wardrobe/daily-outing/components/DailyYellowHat.tsx",
  sticker: "src/app/PetWindow/gemini/wardrobe/daily-outing/components/DailyStarSticker.tsx",
  motion: "src/app/PetWindow/gemini/components/PetSvg.tsx",
};
const hash = (value) => createHash("sha256").update(value).digest("hex");
const exists = (file) => access(file).then(() => true, () => false);

function keyframes(source, name) {
  const start = source.indexOf(`@keyframes ${name} {`);
  assert.ok(start >= 0, `Current runtime motion ${name} must exist.`);
  let depth = 0;
  for (let end = source.indexOf("{", start); end < source.length; end++) {
    if (source[end] === "{") depth++;
    if (source[end] === "}" && --depth === 0) {
      return source.slice(start, end + 1).replace(name, `yy-site-${name}`);
    }
  }
  assert.fail(`Incomplete current runtime motion ${name}`);
}

function runtimeExports(authority) {
  const shapes = authority.reference.match(/<(?:circle|ellipse)\b[^>]*\/>/g);
  assert.equal(shapes?.length, 10, "Review source segmentation when the mother SVG changes.");
  const parts = {
    defs: authority.reference.match(/<radialGradient\b[\s\S]*?<\/radialGradient>/)?.[0],
    earLeft: shapes[0], earRight: shapes[1], body: shapes[2],
    face: shapes.slice(3, 8).join("\n    "), handLeft: shapes[8], handRight: shapes[9],
  };
  assert.ok(parts.defs);
  const exports = {
    [`public${asset}`]: authority.reference,
    "src/vendor/yy/base-parts.json": JSON.stringify(parts, null, 2) + "\n",
    "src/vendor/yy/dance.css": ["music-dance-combo-01", "music-spin-short"].flatMap(name =>
      ["body", "ear-left", "ear-right", "hand-left", "hand-right"].map(part => keyframes(authority.motion, `${name}-${part}`))
    ).join("\n\n") + "\n",
  };
  for (const key of ["anchors", "wardrobeShared", "scarf", "hat", "sticker"]) {
    exports[sources[key].replace("src/app/PetWindow/gemini/", "src/vendor/yy/")] = authority[key];
  }
  return exports;
}

async function readAuthority() {
  const files = Object.entries(sources);
  const values = await Promise.all(files.map(async ([key, file]) => [key, await readFile(path.join(yyRoot, file), "utf8")]));
  const authority = Object.fromEntries(values);
  assert.match(authority.anatomy, /YY_BASE_V13_APPEARANCE_ID = "yy_base_v13"/);
  assert.match(authority.anatomy, /shape: \{ rx: 30, ry: 32 \}/);
  assert.match(authority.anatomy, /pupil: \{ r: 14, inward: 6, yBias: 1 \}/);
  assert.match(authority.face, /YY_BASE_V13_ANATOMY\.eyes\.shape\.ry/);
  assert.match(authority.reference, /cx="116" cy="131" r="14"/);
  assert.match(authority.reference, /cx="184" cy="131" r="14"/);
  assert.match(authority.reference, /ry="32"/);
  return authority;
}

if (sync) {
  const authority = await readAuthority();
  const exports = runtimeExports(authority);
  const lock = {
    appearanceId: "yy_base_v13",
    asset,
    syncedAt: new Date().toISOString(),
    sources: Object.fromEntries(Object.entries(sources).map(([key, file]) => [key, { file, sha256: hash(authority[key]) }])),
    outputs: Object.fromEntries(Object.entries(exports).map(([file, content]) => [file, hash(content)])),
  };
  await mkdir(path.dirname(assetFile), { recursive: true });
  await mkdir(path.dirname(manifestFile), { recursive: true });
  // Export the authoritative SVG unchanged; the site does not redraw YY.
  for (const [file, content] of Object.entries(exports)) {
    await mkdir(path.dirname(path.join(siteRoot, file)), { recursive: true });
    await writeFile(path.join(siteRoot, file), content);
  }
  await writeFile(manifestFile, JSON.stringify(lock, null, 2) + "\n");
  console.log(`[YY] Synced ${lock.appearanceId} from the current source reference.`);
}

const lock = JSON.parse(await readFile(manifestFile, "utf8"));
assert.equal(lock.asset, asset);
assert.equal(lock.appearanceId, "yy_base_v13");
assert.equal(hash(await readFile(assetFile)), lock.sources.reference.sha256, "YY asset differs from the source lock. Run npm run sync:yy and review the result.");
assert.ok(lock.outputs, "Synchronize the current YY runtime before building.");
for (const [file, sha256] of Object.entries(lock.outputs)) {
  assert.equal(hash(await readFile(path.join(siteRoot, file))), sha256, `YY exported file ${file} changed. Run npm run sync:yy.`);
}
if (await exists(yyRoot)) {
  const authority = await readAuthority();
  const expected = runtimeExports(authority);
  assert.deepEqual(Object.keys(lock.outputs).sort(), Object.keys(expected).sort());
  for (const [file, content] of Object.entries(expected)) {
    assert.equal(lock.outputs[file], hash(content), `YY ${file} must be derived from its locked source. Run npm run sync:yy.`);
  }
  for (const [key, file] of Object.entries(sources)) {
    assert.equal(lock.sources[key].file, file);
    assert.equal(hash(authority[key]), lock.sources[key].sha256, `YY ${key} source changed. Run npm run sync:yy and review the result.`);
  }
  console.log("[YY] Bundled appearance matches current YY source.");
} else {
  assert.ok(sourceArg < 0, "The explicitly selected YY repository is unavailable.");
  console.log("[YY] Bundled appearance hash verified; upstream repository is unavailable on this host.");
}
