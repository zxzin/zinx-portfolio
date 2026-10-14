import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { readVisit, toggleTicketPick, TICKET_LIMIT, ticketDate } from "../src/lib/gallery-visit.ts";
const read = path => readFile(new URL("../" + path, import.meta.url), "utf8");
const ids = ["yy", "david-sculpture", "secret-love-vj", "moon-cat"];
const now = "2026-10-05T08:00:00.000Z";

test("a fresh visit has no forced collection and corrupt storage safely starts empty", () => {
  for (const raw of [null, "", "{broken", "null", "23"]) {
    assert.deepEqual(readVisit(raw, ids, now), { date: now, seen: [], picks: [] });
  }
});
test("stored visits reject removed works, duplicates, malformed dates and retired sticker state", () => {
  const visit = readVisit(JSON.stringify({ date: "invalid", seen: ["yy", "hidden", "yy", 2], picks: [...ids, "hidden", "yy"], sticker: "unknown" }), ids, now);
  assert.deepEqual(visit, { date: now, seen: ["yy"], picks: ids.slice(0,3) });
});
test("a souvenir accepts up to three explicit choices, removes and replaces predictably", () => {
  let picks = [];
  for (const id of ids) picks = toggleTicketPick(picks, id, ids);
  assert.equal(picks.length, TICKET_LIMIT);
  assert.deepEqual(picks, ids.slice(0,3));
  assert.equal(toggleTicketPick(picks, "private", ids), picks);
  picks = toggleTicketPick(picks, "yy", ids);
  picks = toggleTicketPick(picks, "moon-cat", ids);
  assert.deepEqual(picks, ["david-sculpture", "secret-love-vj", "moon-cat"]);
});
test("reload preserves chosen order and visit date", () => {
  const value = { date: now, seen: ["yy"], picks: ["secret-love-vj", "yy"] };
  assert.deepEqual(readVisit(JSON.stringify(value), ids, "2026-10-06T08:00:00.000Z"), value);
  assert.match(ticketDate(now), /^2026\.10\.05$/);
});
test("the single stage keeps long copy in disclosure and returns the same coin", async () => {
  const stage = await read("src/components/ExhibitDialog.tsx");
  assert.match(stage, /<details className="stage-exhibit-note"/);
  assert.doesNotMatch(stage, /exhibit-facts|exhibit-dialog-body|<aside/);
  assert.match(stage, /<CoinExperience work=\{work\}/);
  assert.match(stage, /<ExhibitCoin work=\{work\}/);
  assert.match(stage, /origin.width \/ bounds.width/);
  assert.match(stage, /timeline.current\?\.kill/);
  assert.match(stage, /!element \|\| !token \|\| reduced/);
});
test("stage presentation includes mobile, reduced-motion and media safety contracts", async () => {
  const [stage, css, stickers] = await Promise.all(["src/components/ExhibitDialog.tsx", "src/components/exhibit-stage.css", "src/components/StickerGallery.tsx"].map(read));
  assert.match(css, /max-width: 700px/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(css, /\.exhibit-stage::backdrop/);
  assert.match(stage, /current\?\.contentNote/);
  assert.match(stage, /document.hidden/);
  assert.match(stickers, /ArrowLeft.*ArrowRight.*Home.*End/);
  assert.match(stickers, /candidate.poster/);
});
test("stage coins retain curated categories and deep links restore their own coin", async () => {
  const [stage, wall, coin] = await Promise.all(["src/components/ExhibitDialog.tsx", "src/components/ExhibitionWall.tsx", "src/components/ProjectCard.tsx"].map(read));
  assert.match(stage, /suit=\{exhibition.find\(section => section.works.some/);
  assert.doesNotMatch(coin, /suit = "✦"/);
  assert.match(wall, /\[data-exhibit="\$\{selection\?\.id\}"\] \.exhibit-open/);
  assert.match(wall, /target\?\.focus\(\{ preventScroll: true \}\)/);
});
test("souvenir exports a local PNG and releases its resources without public transmission", async () => {
  const [component, image, visit] = await Promise.all(["src/components/SouvenirTicket.tsx", "src/lib/ticket-image.ts", "src/lib/useGalleryVisit.ts"].map(read));
  assert.match(component, /URL.revokeObjectURL/);
  assert.match(component, /if \(!alive.current \|\| snapshot.current !== signature\) return/);
  assert.match(component, /aria-label=\{"从票根移除 "/);
  assert.match(image, /"image\/png"/);
  assert.match(image, /document.fonts.ready/);
  assert.match(visit, /sessionStorage/);
  assert.doesNotMatch(component + image + visit, /fetch\(|XMLHttpRequest|sendBeacon|localStorage/);
  assert.match(component, /createTicketImage\(print.current\)/);
  assert.match(image, /source.cloneNode\(true\)/);
  assert.match(image, /url.origin !== location.origin/);
});
test("sticker stage stays focused on the work and the ticket drops decorative slogans", async () => {
  const source = (await Promise.all(["src/components/StickerGallery.tsx", "src/components/SouvenirTicket.tsx", "src/components/TicketArtwork.tsx", "src/components/ExhibitDialog.tsx"].map(read))).join("\n");
  assert.doesNotMatch(source, /贴上票根|已贴上|这一场的心动|把喜欢的，带回去|谢谢你来玩|点一点，换它登台|留在票根/);
  assert.match(source, /viewBox="0 0 800 1340"/);
  assert.match(source, /viewBox="0 0 1600 780"/);
  assert.match(source, /TicketArtwork svgRef=\{print\}/);
});
test("portrait games keep their native playable orientation inside the stage", async () => {
  const [game, stage] = await Promise.all(["src/components/game-preview.css", "src/components/exhibit-stage.css"].map(read));
  assert.match(game, /aspect-ratio: 9 \/ 16/);
  assert.match(game, /height: var\(--game-height\)/);
  assert.match(game, /width: min\(100%,calc\(var\(--game-height\) \* .5625\)\)/);
  assert.doesNotMatch(stage, /\.game-surface \{[^}]*height:/);
});
