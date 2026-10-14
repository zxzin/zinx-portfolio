import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { readFile, stat } from "node:fs/promises";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { prepareDavid, sculptureMaterial } from "../src/lib/david-model.ts";
import { visibleExhibits } from "../src/content/exhibition.ts";
const read = path => readFile(new URL("../" + path, import.meta.url), "utf8");

test("VJ and sculpture are independent curated works with source credits and playback warning", () => {
  const film = visibleExhibits.find(work => work.id === "secret-love-vj");
  const sculpture = visibleExhibits.find(work => work.id === "david-sculpture");
  assert.equal(film.preview.play, "film"); assert.match(film.media[0].contentNote, /闪光/);
  assert.match(film.media[0].caption, /声音玩具/);
  assert.equal(sculpture.preview.play, "sculpture"); assert.equal(sculpture.media[0].kind, "model");
  assert.match(sculpture.media[0].caption, /SMK.*CC0/);
});
test("packaged source model and full video match their provenance records", async () => {
  const record = JSON.parse(await read("content-sources/david-vj.json"));
  for (const asset of [record.model, record.film]) {
    const file = await readFile(new URL("../public" + asset.asset, import.meta.url));
    assert.equal(createHash("sha256").update(file).digest("hex"), asset.sha256);
    assert.equal((await stat(new URL("../dist" + asset.asset, import.meta.url))).size, file.length);
  }
});
test("portrait emblems use clean source covers and preserve their original pixels", async () => {
  const record = JSON.parse(await read("content-sources/david-vj.json"));
  const manifest = await read("content-sources/public-assets.json");
  for (const portrait of record.portraits) {
    const file = await readFile(new URL("../public" + portrait.asset, import.meta.url));
    assert.equal(createHash("sha256").update(file).digest("hex"), portrait.sha256);
    assert.equal((await stat(new URL("../dist" + portrait.asset, import.meta.url))).size, file.length);
    const work = visibleExhibits.find(work => work.emblem?.src === portrait.asset);
    assert.ok(work);
    assert.equal(work.emblem.treatment, "portrait");
  }
  assert.doesNotMatch(manifest, /david-sculpture\/poster\.jpg/);
  assert.equal(visibleExhibits.find(work => work.id === "david-sculpture").emblem.focus, "top");
});
test("David is grounded, normalized and uses owned meshes without changing the cached scan", async () => {
  const file = await readFile(new URL("../public/projects/david-sculpture/david.glb", import.meta.url));
  const loaded = await new GLTFLoader().parseAsync(file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength), "");
  const before = new THREE.Box3().setFromObject(loaded.scene);
  const model = prepareDavid(loaded.scene), bounds = new THREE.Box3();
  model.parts.forEach(part => { bounds.union(part.boundingBox); assert.ok(part.attributes.normal); });
  assert.ok(Math.abs(bounds.min.y) < 1e-6);
  assert.ok(Math.abs(bounds.max.y - 2.5) < 1e-6);
  assert.deepEqual(new THREE.Box3().setFromObject(loaded.scene), before);
  assert.ok([...model.tape.attributes.position.array].every(Number.isFinite));
  assert.equal(model.parts.reduce((sum, part) => sum + part.index.count / 3, 0), 90000);
  model.dispose();
  for (const finish of ["mixed", "plaster", "chrome"]) { const material = sculptureMaterial(finish); assert.ok(material.isMeshPhysicalMaterial); material.dispose(); }
});
test("sculpture rendering is demand-driven, isolated, keyboard accessible and explicitly loaded", async () => {
  const [viewer, model, preview, scene] = await Promise.all(["src/components/SculptureViewer.tsx", "src/components/DavidSculpture.tsx", "src/components/ModelPreview.tsx", "src/components/PortalScene.tsx"].map(read));
  assert.match(viewer, /frameloop="demand"/); assert.doesNotMatch(viewer, /autoRotate|requestAnimationFrame|useFrame/);
  assert.match(viewer, /ArrowLeft/); assert.match(viewer, /onPointerCancel/); assert.match(viewer, /onLostPointerCapture/);
  assert.match(preview, /lazy\(\(\) => import/); assert.match(preview, /<MediaBoundary fallback=/);
  assert.match(model, /model.dispose\(\)/); assert.match(model, /material.dispose\(\)/);
  assert.match(scene, /"david-display-shelf"/);
  assert.match(scene, /position=\{slot.position\}/);
  assert.match(scene, /<MediaBoundary><Suspense fallback=\{null\}><DavidSculpture/);
});
