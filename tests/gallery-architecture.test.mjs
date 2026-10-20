import assert from "node:assert/strict";
import test from "node:test";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

const read = path => readFile(new URL("../" + path, import.meta.url), "utf8");
const digest = bytes => createHash("sha256").update(bytes).digest("hex");

test("the room uses one architecture path and preserves the existing exhibit positions", async () => {
  const [scene, architecture] = await Promise.all([
    read("src/components/PortalScene.tsx"),
    read("src/components/GalleryArchitecture.tsx"),
  ]);
  assert.match(scene, /import \{ CasinoArchitecture, GalleryNiche, ExhibitPlinth \} from "\.\/GalleryArchitecture"/);
  for (const component of ["CasinoArchitecture", "GalleryNiche", "ExhibitPlinth"]) {
    assert.match(architecture, new RegExp("export function " + component + "\\("));
    assert.doesNotMatch(scene, new RegExp("function " + component + "\\("));
  }
  assert.match(scene, /position=\{slot.position\} scale=\{slot.scale\}/);
  assert.match(scene, /position=\{layout.companion\} scale=\{layout.companionScale\}/);
  assert.match(architecture, /name="stone-and-brass-plinth"/);
  assert.match(architecture, /name="rounded-exhibit-alcove"/);
  assert.match(architecture, /name="continuous-inlaid-stone-stage"/);
});

test("the settled velvet backdrop is real static room geometry with owned-resource cleanup", async () => {
  const architecture = await read("src/components/GalleryArchitecture.tsx");
  assert.match(architecture, /name="permanent-velvet-backdrop"/);
  assert.match(architecture, /new THREE\.PlaneGeometry\(16\.25, 6\.9,/);
  assert.match(architecture, /positions\.setZ\(i, fold/);
  assert.match(architecture, /position=\{\[0, 3\.49, -5\.91\]\}/);
  assert.match(architecture, /geo\.computeVertexNormals\(\)/);
  assert.match(architecture, /geometry\.dispose\(\)/);
  assert.doesNotMatch(architecture, /useFrame|requestAnimationFrame|setInterval|<spotLight|<pointLight|StageCurtain/);
});

test("the solid ceiling and restrained floor preserve the machine as the luminous focal point", async () => {
  const architecture = await read("src/components/GalleryArchitecture.tsx");
  assert.match(architecture, /name="solid-walnut-ceiling"/);
  assert.match(architecture, /name="walnut-inset-ceiling"/);
  assert.match(architecture, /"ceiling-recessed-warm-diffuser"/);
  assert.match(architecture, /name="gallery-ceiling-cove" position=\{\[0, 7\.15, -1\]\}/);
  assert.match(architecture, /resolution=\{size.width < 700 \? 256 : 512\}/);
  const mirror = Number(architecture.match(/mirror=\{([\d.]+)\}/)?.[1]);
  const strength = Number(architecture.match(/mixStrength=\{([\d.]+)\}/)?.[1]);
  assert.ok(mirror >= 0 && mirror <= .12);
  assert.ok(strength >= 0 && strength <= .3);
  assert.match(architecture, /source\.clone\(\)/);
  assert.match(architecture, /floor\.dispose\(\); apron\.dispose\(\)/);
});

test("the quiet stone texture is explicitly packaged and matches the built public asset", async () => {
  const asset = "/projects/gallery-theater/plum-stone.jpg";
  const assets = JSON.parse(await read("content-sources/public-assets.json"));
  assert.equal(assets.filter(path => path === asset).length, 1);
  const [source, built] = await Promise.all([
    readFile(new URL("../public" + asset, import.meta.url)),
    readFile(new URL("../dist" + asset, import.meta.url)),
  ]);
  assert.ok(source.length > 0 && source.length < 512 * 1024);
  assert.equal(digest(built), digest(source));
  const architecture = await read("src/components/GalleryArchitecture.tsx");
  assert.match(architecture, /import\.meta\.env\.BASE_URL \+ "projects\/gallery-theater\/plum-stone\.jpg"/);
});
