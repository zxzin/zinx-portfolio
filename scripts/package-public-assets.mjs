import { cp, mkdir, readFile, realpath, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const source = path.join(root, "public");
const output = path.join(root, ".public-release");
const assets = JSON.parse(await readFile(path.join(root, "content-sources/public-assets.json"), "utf8"));

// Validate every reviewed source before replacing the disposable staging directory.
if (!Array.isArray(assets) || new Set(assets).size !== assets.length) {
  throw new Error("Public asset manifest must contain unique paths.");
}
for (const asset of assets) {
  if (typeof asset !== "string" || !/^\/[\w./-]+$/.test(asset) || asset.includes("..")) {
    throw new Error(`Invalid public asset path: ${asset}`);
  }
  const resolved = await realpath(path.join(source, asset));
  if (!resolved.startsWith(`${source}${path.sep}`)) throw new Error(`Asset escapes public directory: ${asset}`);
}
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const asset of assets) {
  const destination = path.join(output, asset);
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(path.join(source, asset), destination);
}
console.log(`Packaged ${assets.length} reviewed public assets.`);
