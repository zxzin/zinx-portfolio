import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { createFloralArrangement, floralPalette, FLOWERS_PER_BOUQUET, FLORAL_VARIETIES } from "../src/lib/floral-arrangement.ts";

test("five flower varieties merge into finite, reusable material batches", () => {
  const batches = createFloralArrangement();
  assert.equal(FLOWERS_PER_BOUQUET, 21);
  assert.equal(FLORAL_VARIETIES.length, 5);
  assert.equal(batches.length, Object.keys(floralPalette).length);
  let vertices = 0;
  for (const { geometry, material } of batches) {
    for (const name of ["position", "normal", "uv"]) {
      assert.ok(geometry.getAttribute(name).array.every(Number.isFinite));
    }
    vertices += geometry.getAttribute("position").count;
    geometry.computeBoundingBox();
    assert.ok(geometry.boundingBox.min.y >= .3);
    assert.ok(geometry.boundingBox.max.y < 2.5);
    assert.equal(material.metalness, 0);
    geometry.dispose(); material.dispose();
  }
  assert.ok(vertices < 85000, `bouquet budget: ${vertices}`);
});

test("marquee keeps the English gallery name and invitation with no Chinese subtitle", async () => {
  const scene = await readFile(new URL("../src/components/PortalScene.tsx", import.meta.url), "utf8");
  assert.match(scene, /text="ZINX PLAY GALLERY"/);
  assert.match(scene, /text="ZINX PLAY GALLERY" at=\{\[0, 4\.70, 1\.505\]\} size=\{\[5\.1, \.40\]\}/);
  assert.doesNotMatch(scene, /text="作\s*品\s*乐\s*园"/);
  assert.doesNotMatch(scene, /CREATIVE PORTAL/);
  assert.match(scene, /来把大的/);
});

test("cabinet garland frames the left side and roof while leaving the sign and lever open", () => {
  const batches = createFloralArrangement("garland");
  for (const { geometry, material } of batches) {
    const positions = geometry.getAttribute("position");
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i), y = positions.getY(i);
      assert.ok(Number.isFinite(x) && Number.isFinite(y));
      assert.ok(!(x > -2.8 && x < 2.2 && y > 4.4 && y < 4.95), "sign text remains clear");
      assert.ok(!(x > 3.5 && y > 2.5 && y < 4.4), "lever remains clear");
    }
    geometry.dispose(); material.dispose();
  }
});
