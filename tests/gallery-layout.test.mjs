import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { galleryLayout } from "../src/lib/gallery-layout.ts";
import { backgroundExhibits, backgroundSlots } from "../src/content/gallery-background.ts";
const read = path => readFile(new URL("../" + path, import.meta.url), "utf8");

test("camera keeps the machine primary and YY on a smaller grounded perch", () => {
  for (const aspect of [1, 4 / 3, 16 / 9, 21 / 9]) {
    const layout = galleryLayout(aspect);
    assert.equal(layout.portrait, false);
    assert.ok(layout.companion[0] > 5 && layout.companion[2] < 0);
    assert.ok(layout.companionScale < .8);
    assert.ok(layout.distance >= 14.2);
  }
});
test("portrait preserves the room's background depth instead of lifting exhibits over the machine", () => {
  for (const aspect of [320 / 740, 390 / 844, 600 / 900]) {
    const layout = galleryLayout(aspect);
    assert.equal(layout.portrait, true);
    assert.equal(layout.companion[1], 0);
    assert.ok(layout.companionScale < .7);
    assert.equal(layout.sculpture, undefined);
    assert.equal(layout.film, undefined);
    assert.ok(Number.isFinite(layout.distance));
  }
});
test("extensible background slots stay small, grounded, behind the machine and in front of the rear wall", () => {
  const occupied = backgroundExhibits.filter(item => item.visible).map(item => item.slot);
  assert.equal(new Set(occupied).size, occupied.length);
  for (const item of backgroundExhibits) assert.ok(backgroundSlots[item.slot]);
  for (const slot of Object.values(backgroundSlots)) {
    assert.ok(Math.abs(slot.position[0]) > 6);
    assert.ok(slot.position[1] >= 0 && slot.position[1] <= .1);
    assert.ok(slot.position[2] > -5.5 && slot.position[2] < -4);
    assert.ok(slot.scale > 0 && slot.scale < .8);
  }
});
test("YY entrance uses the same camera and real plinth; wall companion remains accessible", async () => {
  const [scene, entrance, css] = await Promise.all(["src/components/PortalScene.tsx", "src/components/PortalEntrance.tsx", "src/components/arcade.css"].map(read));
  assert.match(scene, /name="yy-gallery-podium"/);
  assert.match(scene, /<Html center transform sprite/);
  assert.match(scene, /ref=\{placeCompanion\}/);
  assert.match(scene, /if \(node\) invalidate\(\)/);
  assert.match(scene, /<ExhibitPlinth height=\{1.16\}/);
  assert.match(scene, /<YYCompanion outfit=\{outfit\} onInteract=\{onCompanion\}/);
  assert.match(entrance, /\{exhibition && <aside className="exhibition-companion"/);
  assert.match(scene, /idleDance=\{false\}/);
  assert.match(scene, /distanceFactor=\{6 \* layout.companionScale\}/);
  assert.match(scene, /wrapperClass="gallery-yy-projection"/);
  assert.match(css, /\.gallery-yy-projection \{ overflow: clip !important/);
  assert.doesNotMatch(scene, /gallery-work-label/);
  assert.doesNotMatch(css, /gallery-work-label/);
  assert.match(css, /\.gallery-yy-outfit \{[^}]*min-height: 44px/);
  assert.match(css, /\.gallery-yy-outfit \{[^}]*opacity: 0; pointer-events: none/);
  assert.match(css, /\.gallery-yy-outfit:focus-visible/);
  assert.doesNotMatch(scene, /velvet-banquette|brass-and-opal-sconce/);
});
test("background displays use still media, narrow soft spotlights and the shared blackout", async () => {
  const scene = await read("src/components/PortalScene.tsx");
  assert.match(scene, /backgroundExhibits.filter\(item => item.visible\).map/);
  const picture = scene.slice(scene.indexOf("function GalleryPicture"), scene.indexOf("function GallerySpotlight"));
  assert.match(picture, /meshStandardMaterial map=\{texture\}/);
  assert.doesNotMatch(picture, /meshBasicMaterial|video|emissive/);
  const lights = scene.slice(scene.indexOf("function GallerySpotlight"), scene.indexOf("function GalleryExhibits"));
  assert.match(lights, /angle=\{.29\} penumbra=\{.85\}/);
  assert.match(lights, /1 - motion.blackout/);
  assert.match(lights, /lightPosition: source.clone\(\).addScaledVector\(direction, .19\)/);
  assert.match(lights, /position=\{setup.lightPosition\}/);
});
