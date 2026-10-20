import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { machineLightCue } from "../src/lib/gallery-lighting.ts";

test("the cabinet has a warm idle light and smoothly gains light when spinning or stopping", () => {
  const idle = machineLightCue(1, 0, 0, 0, 0);
  const spin = machineLightCue(1, 1, 0, 0, 0);
  const stop = machineLightCue(1, 0, 1, 0, 0);
  assert.ok(idle.key > idle.fill && idle.fill > 0);
  assert.ok(idle.rim > 0 && idle.trim > 0 && idle.halo > 0);
  for (const key of ["key", "fill", "rim", "trim", "halo"]) {
    assert.ok(spin[key] > idle[key]);
    assert.ok(stop[key] > idle[key]);
  }
  let previous = idle.key;
  for (let i = 1; i <= 100; i++) {
    const cue = machineLightCue(1, i / 100, 0, 0, 0);
    assert.ok(cue.key >= previous && cue.key - previous < 1);
    previous = cue.key;
  }
});

test("lamp accents share the cabinet visibility envelope through the complete transition", async () => {
  const scene = await readFile(new URL("../src/components/PortalScene.tsx", import.meta.url), "utf8");
  assert.match(scene, /spinLightLevel\(motion.spinPhase, i \/ positions.length, motion.spinGlow, motion.stopGlow\) \* cue.visible \* fade/);
  assert.match(scene, /material.emissiveIntensity = cue.trim \* fade \+ level \* 3.8/);
});

test("cabinet lighting clears on closed curtain, travel, blackout and bounds invalid input", () => {
  for (const args of [[0, 1, 1, 0, 0], [1, 1, 1, 1, 0], [1, 1, 1, 0, 1]]) {
    assert.ok(Object.values(machineLightCue(...args)).every(value => value === 0));
  }
  const bright = machineLightCue(1, 1, 1, 0, 0);
  assert.deepEqual(machineLightCue(5, 5, 5, -2, -2), bright);
  assert.ok(bright.key < 300 && bright.fill < 180 && bright.halo < .3 && bright.beam < .07);
  assert.ok(Object.values(machineLightCue(.5, .7, .4, .2, .3)).every(Number.isFinite));
});
