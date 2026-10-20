import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  BACKGROUND_FLORAL_PLACEMENTS, BACKGROUND_FLORAL_RHYTHM, BACKGROUND_FLOWER_COUNT,
  createFloralArrangement, floralPalette,
} from "../src/lib/floral-arrangement.ts";

test("background sprigs remain sparse, naturally tall, matte and genuinely lit", () => {
  assert.equal(BACKGROUND_FLOWER_COUNT, 9);
  assert.equal(BACKGROUND_FLORAL_RHYTHM.filter(kind => kind === "rose" || kind === "lily").length, 7);
  const batches = createFloralArrangement("background");
  let vertices = 0, height = 0;
  for (const { color, geometry, material } of batches) {
    for (const name of ["position", "normal", "uv", "color"]) {
      assert.ok(geometry.getAttribute(name).array.every(Number.isFinite), `${color} ${name} is finite`);
    }
    geometry.computeBoundingBox();
    assert.ok(geometry.boundingBox.min.y >= 0);
    assert.ok(geometry.boundingBox.min.x > -1.05 && geometry.boundingBox.max.x < 1.05);
    height = Math.max(height, geometry.boundingBox.max.y);
    vertices += geometry.getAttribute("position").count;
    assert.equal(material.emissive.getHex(), 0);
    assert.equal(material.emissiveIntensity, 0);
    assert.equal(material.roughness, .93);
    assert.equal(material.metalness, 0);
    assert.ok(material.color.r < 1 && material.color.g < 1 && material.color.b < 1);
    geometry.dispose(); material.dispose();
  }
  assert.ok(height > 2.6 && height < 3.1, `natural staggered branch height: ${height}`);
  assert.ok(vertices < 32000, `background sprig vertex budget: ${vertices}`);
  assert.ok(batches.some(batch => batch.color === floralPalette.violet));
});

test("background floral wings stay behind and outside existing exhibits without animation or lights", async () => {
  assert.equal(BACKGROUND_FLORAL_PLACEMENTS.length, 2);
  for (const { position: [x, y, z], scale } of BACKGROUND_FLORAL_PLACEMENTS) {
    assert.equal(Math.abs(x), 7.2);
    assert.equal(y, 0);
    assert.equal(z, -4.3);
    assert.ok(scale < .75);
  }
  const source = await readFile(new URL("../src/components/CasinoFlorals.tsx", import.meta.url), "utf8");
  const frameLoop = source.slice(source.indexOf("useFrame", source.indexOf("export default")), source.indexOf("useEffect", source.indexOf("export default")));
  assert.doesNotMatch(frameLoop, /backgroundBranches|BACKGROUND_FLORAL_PLACEMENTS/);
  assert.doesNotMatch(source, /<pointLight|<spotLight/);
  assert.match(source, /\[\.\.\.batches, \.\.\.garland, \.\.\.backgroundBranches\]/);
  assert.match(source, /geometry\.dispose\(\); material\.dispose\(\)/);
});

test("existing foreground bouquets and cabinet garlands retain their exact approved geometry", () => {
  const expected = {
    bouquet: "7a8c23a662dad5180003876da3e9546b9ab71d5af88ad6fcbf4f4032b066d98b",
    garland: "a0cb999c7bcda46b8ed10e08b520ecf99e632ae9abc8b33c07baaad8795093e2",
  };
  for (const [layout, checksum] of Object.entries(expected)) {
    const hash = createHash("sha256");
    for (const { color, geometry, material } of createFloralArrangement(layout)) {
      hash.update(color);
      for (const key of ["position", "normal", "uv", "color"]) {
        const array = geometry.getAttribute(key).array;
        hash.update(Buffer.from(array.buffer, array.byteOffset, array.byteLength));
      }
      geometry.dispose(); material.dispose();
    }
    assert.equal(hash.digest("hex"), checksum, `${layout} matches the pre-background geometry`);
  }
});
