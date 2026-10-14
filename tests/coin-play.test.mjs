import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { leverDeflection, coinFlight, COIN_COUNT, COIN_FLIGHT_SECONDS, coinContactProgress, petalFlight, PETAL_COUNT, constrainCapture } from "../src/lib/arcade-physics.ts";
import { OPENING_CUES, PULL_THRESHOLD } from "../src/lib/arcade-state.ts";
import { openingScore } from "../src/lib/arcade-sound.ts";
import { visibleExhibits } from "../src/content/exhibition.ts";
const read = path => readFile(new URL("../" + path, import.meta.url), "utf8");

test("lever resistance is continuous, monotonic, bounded and releases after the detent", () => {
  assert.equal(leverDeflection(-1), 0); assert.equal(leverDeflection(2), 1);
  assert.equal(leverDeflection(PULL_THRESHOLD), .64);
  for (let i = 0; i < 1000; i++) assert.ok(leverDeflection(i / 1000) <= leverDeflection((i + 1) / 1000));
  assert.ok(leverDeflection(.55) - leverDeflection(.5) < leverDeflection(.2) - leverDeflection(.15));
});
test("physical coins contact the table with synchronized sound and settle without sinking", () => {
  for (let i = 0; i < COIN_COUNT; i++) {
    const at = OPENING_CUES.coins + coinContactProgress(i) * COIN_FLIGHT_SECONDS;
    assert.ok(openingScore.some(note => note.kind === "metal" && Math.abs(note.at - at) < 1e-9));
    assert.ok(at < OPENING_CUES.complete);
    for (let p = 0; p <= 100; p++) {
      const pose = coinFlight(p / 100, i);
      assert.ok(Object.values(pose).every(Number.isFinite));
      assert.ok(pose.y >= .97 - 1e-10);
    }
    assert.ok(Math.abs(coinFlight(coinContactProgress(i), i).y - .97) < 1e-10);
    assert.ok(Math.abs(coinFlight(1, i).y - .97) < 1e-10);
    assert.equal(coinFlight(1, i).rx, -Math.PI / 2);
  }
});
test("petals have deterministic soft flight and remain flat on the shared table", () => {
  for (let i = 0; i < PETAL_COUNT; i++) {
    for (let p = 0; p <= 100; p++) assert.ok(Object.values(petalFlight(p / 100, i)).every(Number.isFinite));
    const end = petalFlight(1, i);
    assert.ok(end.y >= .96 && end.y < 1);
    assert.ok(Math.abs(end.x) <= 3.5 && end.z >= 3 && end.z <= 5.5);
    assert.equal(end.rx, -Math.PI / 2);
    assert.deepEqual(end, petalFlight(2, i));
  }
});
test("playable coins have modular play types and image exhibits open directly; capture stays inside the stage", () => {
  assert.deepEqual(new Set(visibleExhibits.map(work => work.preview?.play).filter(Boolean)), new Set(["yy", "diary", "tasks", "capture", "film", "sculpture", "game", "stickers"]));
  assert.ok(visibleExhibits.filter(work => !work.preview?.play).every(work => work.media.every(media => media.kind === "image")));
  assert.deepEqual(constrainCapture({ x: -500, y: 500 }), { x: 4, y: 42 });
  assert.deepEqual(constrainCapture({ x: 25, y: 24 }), { x: 25, y: 24 });
  assert.ok(visibleExhibits.find(work => work.preview?.play === "film").media.some(media => media.kind === "video"));
});
test("coin play and direct details share one stage with explicit media playback", async () => {
  const [play, card, wall, css, stage] = await Promise.all(["src/components/CoinPlay.tsx", "src/components/ProjectCard.tsx", "src/components/ExhibitionWall.tsx", "src/components/coin-play.css", "src/components/ExhibitDialog.tsx"].map(read));
  assert.match(card, /aria-label=\{"直接查看 " \+ work.title\}/);
  assert.match(card, /work.preview\?\.play && onPlay \? onPlay : onOpen/);
  assert.doesNotMatch(wall, /playSelection|<CoinPlay/);
  assert.match(wall, /open\(id, target, true\)/);
  assert.match(stage, /onCancel=/); assert.match(stage, /element.close\(\)/);
  assert.match(stage, /context.revert\(\)/);
  assert.match(stage, /visibilitychange/);
  assert.match(stage, /preload="none"/); assert.doesNotMatch(stage + play, /autoPlay|getDisplayMedia|getUserMedia/);
  assert.match(play, /ArrowLeft/); assert.match(play, /setPointerCapture/);
  assert.match(css, /prefers-reduced-motion/);
});
