import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { exhibitCatalog, exhibition, visibleExhibits } from "../src/content/exhibition.ts";

const read = path => readFile(new URL("../" + path, import.meta.url));
const digest = bytes => createHash("sha256").update(bytes).digest("hex");

test("the film gallery exhibits approved films and preserves the hidden VideoPro source", () => {
  assert.ok(exhibitCatalog.some(work => work.id === "videopro"));
  assert.ok(!visibleExhibits.some(work => work.id === "videopro"));
  const films = exhibition.find(section => section.id === "practice");
  assert.deepEqual(films.works.map(work => work.id), ["zinxcord-yy-film", "secret-love-vj", "airflow-study"]);
  const work = films.works[0];
  assert.equal(work.preview.play, "film");
  assert.equal(work.preview.mediaId, work.media[0].id);
  assert.equal(work.media[0].kind, "video");
  assert.equal(work.emblem.fit, "cover");
});

test("the packaged film and poster match the human-selected publication master", async () => {
  const source = JSON.parse(await read("content-sources/approved-films.json"));
  const allowlist = JSON.parse(await read("content-sources/public-assets.json"));
  for (const film of source.films) {
    assert.match(film.userApproval, /可以.*小红书/);
    const work = visibleExhibits.find(item => item.id === film.id);
    assert.ok(work);
    for (const path of [work.media[0].src, work.media[0].poster, work.emblem.src]) {
      const asset = film.assets.find(item => item.asset === path);
      assert.ok(asset);
      assert.ok(allowlist.includes(path));
      for (const root of ["public", "dist"]) assert.equal(digest(await read(root + path)), asset.sha256);
    }
  }
});
