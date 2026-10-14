import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { visibleExhibits } from "../src/content/exhibition.ts";

const read = path => readFile(new URL("../" + path, import.meta.url), "utf8");
const digest = bytes => createHash("sha256").update(bytes).digest("hex");
const binary = path => readFile(new URL("../" + path, import.meta.url));

test("latest films keep full versions, source context and qualitative science wording", async () => {
  const vj = visibleExhibits.find(x => x.id === "secret-love-vj");
  assert.match(vj.subtitle, /V26/);
  assert.match(vj.media[0].src, /v26/);
  const airflow = visibleExhibits.find(x => x.id === "airflow-study");
  assert.equal(airflow.preview.play, "film");
  assert.match(airflow.media[0].caption, /60 fps/);
  assert.match(airflow.decision, /非实测数据/);
  assert.match(airflow.media[0].src, /v17/);
  const record = JSON.parse(await read("content-sources/airflow-study.json"));
  assert.equal(digest(await binary("dist" + record.asset)), record.sha256);
  assert.equal(record.probe.streams[0].r_frame_rate, "60/1");
  assert.equal(Number(record.probe.format.duration), 32.619);
});

test("airflow coin fills its original rounded tile with the selected source frame", async () => {
  const work = visibleExhibits.find(x => x.id === "airflow-study");
  const record = JSON.parse(await read("content-sources/airflow-study.json"));
  assert.equal(work.emblem.src, record.emblem.asset);
  assert.equal(work.emblem.treatment, "tile");
  assert.equal(work.emblem.fit, "cover");
  assert.equal(record.emblem.timeSeconds, 28);
  assert.equal(digest(await binary("public" + record.emblem.asset)), record.emblem.sha256);
  assert.equal(digest(await binary("dist" + record.emblem.asset)), record.emblem.sha256);
  assert.equal(work.media[0].poster, "/projects/airflow-study/poster.jpg");
  assert.match(await read("src/components/ProjectCard.tsx"), /emblem\.fit === "cover"/);
});

test("recorder uses current UI captures and approved icon with recorder-only copy", async () => {
  const work = visibleExhibits.find(x => x.id === "zinxcord");
  assert.doesNotMatch(JSON.stringify(work), /轻剪辑|轻量编辑|工作台|EDITOR|zinxcord-hud-real|zinxcord-workbench/);
  assert.match(work.decision, /当前产品组件/);
  assert.equal(work.media.length, 3);
  assert.equal(work.media[0].title, "框好画面，开始录制");
  assert.match(work.media[0].alt, /新版仓鼠图标/);
  assert.equal(work.emblem.src, "/projects/zinxcord/icon.png");
  const record = JSON.parse(await read("content-sources/zinxcord-current.json"));
  for (const asset of record.assets) assert.equal(digest(await binary("dist" + asset.asset)), asset.sha256);
});

test("only the 14 accepted YY animations are packaged with identical frames and static posters", async () => {
  const work = visibleExhibits.find(x => x.id === "yy-stickers");
  const record = JSON.parse(await read("content-sources/yy-stickers.json"));
  assert.equal(work.media.length, 14);
  assert.equal(record.items.length, 14);
  assert.equal(work.preview.play, "stickers");
  for (const [index, media] of work.media.entries()) {
    assert.equal(media.kind, "animation");
    assert.equal(media.src, record.items[index].asset);
    assert.equal(digest(await binary("public" + media.src)), record.items[index].sha256);
    assert.equal(digest(await binary("dist" + media.src)), record.items[index].sha256);
    const poster = await binary("dist" + media.poster);
    assert.equal(digest(poster), record.items[index].posterSha256);
    assert.equal(poster.readUInt32BE(16), 240); assert.equal(poster.readUInt32BE(20), 240);
  }
});

test("sticker interaction loads one GIF on demand and restores posters when hidden or reduced", async () => {
  const code = await read("src/components/StickerGallery.tsx");
  assert.match(code, /useState<string \| null>\(null\)/);
  assert.match(code, /active === item.id && !reduced/);
  assert.match(code, /playing \? item.src : item.poster/);
  assert.match(code, /setActive\(playing \? null : item.id\)/);
  assert.match(code, /visibilitychange/);
  assert.match(code, /observer.disconnect\(\)/);
  assert.match(code, /aria-pressed=\{playing\}/);
  assert.match(await read("src/components/ExhibitDialog.tsx"), /<StickerGallery media=\{work.media\}/);
  assert.doesNotMatch(await read("src/components/CoinPlay.tsx"), /<dialog/);
  assert.match(code, /assetPath\(candidate.poster\)/);
  assert.match(code, /className="sticker-star"/);
});
