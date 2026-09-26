import assert from "node:assert/strict";
import test from "node:test";
import { createFloralArrangement, floralPalette, FLOWERS_PER_BOUQUET } from "../src/lib/floral-arrangement.ts";

test("flower varieties merge into seven finite, reusable material batches", () => {
  const batches = createFloralArrangement();
  assert.equal(FLOWERS_PER_BOUQUET, 21);
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
  assert.ok(vertices < 45000, `bouquet budget: ${vertices}`);
});
