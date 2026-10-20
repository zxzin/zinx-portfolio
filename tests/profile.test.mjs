import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { profile } from "../src/content/profile.ts";

test("the gallery about control opens the approved public resume", async () => {
  assert.equal(profile.resume, "https://zxzin.github.io/zinx-resume/");
  const entrance = await readFile(new URL("../src/components/PortalEntrance.tsx", import.meta.url), "utf8");
  assert.match(entrance, /className="rail-about" href=\{profile.resume\} aria-label="关于我：打开个人简历"/);
});
