import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { visibleExhibits, entranceEmblems } from "../src/content/exhibition.ts";
import { isLocalDemo } from "../src/lib/exhibition-model.ts";
const read = path => readFile(new URL("../" + path, import.meta.url), "utf8");

test("packaged games match the source provenance record", async () => {
  const record = JSON.parse(await read("content-sources/games-products.json"));
  for (const work of record.works.filter(work => work.gameDestination)) {
    const bytes = await readFile(new URL("../public" + work.gameDestination, import.meta.url));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), work.gameSha256);
  }
});

test("the selected additions use real local games and keep excluded products out", () => {
  for (const id of ["moon-cat", "hamster-pinball"]) {
    const work = visibleExhibits.find(work => work.id === id);
    assert.equal(work.preview.play, "game");
    const media = work.media.find(media => media.kind === "game");
    assert.ok(isLocalDemo(media.src));
    assert.ok(media.instructions);
  }
  for (const id of ["vibetiming", "web-timing", "blue-mouse", "home-guard", "homeguard", "shushucity"]) assert.ok(!visibleExhibits.some(work => work.id === id));
  const judge = visibleExhibits.find(work => work.id === "cat-judge");
  assert.equal(judge.status, "iOS · 待审核");
  assert.equal(judge.links.length, 0);
  assert.equal(judge.media.length, 3);
  assert.deepEqual(entranceEmblems.map(item => item.src), ["/brand/yy-base-v13.svg", "/brand/dating-icon.png", "/brand/monkex-icon.png"]);
});
test("games mount on request, remain origin-isolated, and stop on leaving the page", async () => {
  const source = await read("src/components/GamePreview.tsx");
  assert.match(source, /useState\(false\)/);
  assert.match(source, /playing && isLocalDemo\(media.src\)/);
  assert.match(source, /sandbox="allow-scripts"/);
  assert.doesNotMatch(source, /allow-same-origin|allow-top-navigation|allow-popups/);
  assert.match(source, /document.hidden\) \{ setPlaying\(false\)/);
  assert.match(source, /removeEventListener\("visibilitychange", stop\)/);
  assert.doesNotMatch(await read("src/components/CoinPlay.tsx"), /<dialog|<GamePreview/);
  assert.match(await read("src/components/ExhibitDialog.tsx"), /<GamePreview/);
});
test("packaged pinball tolerates blocked storage without losing in-session unlocks", async () => {
  const html = await read("public/projects/hamster-pinball/play.html");
  assert.match(html, /isMuted: true/);
  assert.match(html, /id="audio-btn">🔇/);
  const restore = html.match(/try \{\s+const saved = Number\(localStorage.getItem[\s\S]*?catch \{ state.maxUnlockedLevel = 1; \}/)?.[0];
  assert.ok(restore);
  const restoreProgress = new Function("state", "localStorage", restore);
  for (const value of [null, "bad", "0", "999"]) {
    const state = { maxLevels: 6 };
    restoreProgress(state, { getItem: () => value });
    assert.equal(state.maxUnlockedLevel, 1);
  }
  const state = { maxLevels: 6 };
  restoreProgress(state, { getItem() { throw new Error("SecurityError"); } });
  assert.equal(state.maxUnlockedLevel, 1);
  restoreProgress(state, { getItem: () => "4" });
  assert.equal(state.maxUnlockedLevel, 4);
  const save = html.match(/try \{ localStorage.setItem[\s\S]*?catch \{[^}]*\}/)?.[0];
  assert.ok(save);
  new Function("state", "localStorage", save)(state, { setItem() { throw new Error("SecurityError"); } });
  assert.equal(state.maxUnlockedLevel, 4);
});
