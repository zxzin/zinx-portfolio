import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { arcadeReducer, arcadeStateForRoute, blastEnvelope, canPull, clamp01, initialArcadeState, makeArcadeMotion, nextReelAngle, OPENING_CUES, PULL_THRESHOLD, reelStopSymbol, reelSuits, routeFromHash, spinLightLevel, SYMBOL_COUNT, symbolSuit, TAU } from "../src/lib/arcade-state.ts";
const event = (state, type, round) => arcadeReducer(state, { type, round });
const read = path => readFile(new URL("../" + path, import.meta.url), "utf8");
test("lever light plaque guides ready input and swaps to reels while busy", async () => {
  const scene = await read("src/components/PortalScene.tsx");
  const css = await read("src/components/arcade.css");
  assert.match(scene, /className="lever-guide"[^>]*data-busy=\{!canPull\(state\)\}[^>]*data-phase=\{state.phase\}/);
  assert.match(scene, /data-lit=\{round < state.shakes\} data-current=\{round === state.shakes\}/);
  assert.match(scene, /className="lever-hit" data-ready=\{canPull\(state\)\}/);
  assert.match(css, /\.lever-guide\[data-busy=true\] \.lever-guide-arrow.*display: none/);
  assert.match(css, /\.lever-guide\[data-phase=spinning\] \.lever-guide-reels \{ display: flex/);
  assert.match(css, /html\[data-motion=reduced\] \.lever-guide.*animation: none !important/);
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)\s*\{\s*\.lever-guide/);
  assert.doesNotMatch(css, /\.lever-guide\[data-busy=true\] \{ opacity:/);
});
test("curtain reveal gates the lever and direct routes cancel its completion", () => {
  const opening = initialArcadeState();
  assert.equal(opening.phase, "revealing");
  assert.equal(canPull(opening), false);
  assert.equal(event(opening, "PULL"), opening);
  const ready = event(opening, "REVEALED");
  assert.equal(canPull(ready), true);
  assert.equal(event(ready, "REVEALED"), ready);
  for (const command of ["UNLOCK", "FALLBACK"]) {
    const skipped = event(opening, command);
    assert.equal(event(skipped, "REVEALED"), skipped);
    assert.equal(skipped.inputMode, "exhibition");
    assert.equal(event(skipped, "RESTART").phase, "revealing");
  }
  assert.equal(arcadeStateForRoute("#hub").phase, "idle");
  assert.equal(makeArcadeMotion().spotlight, 0);
  assert.equal(makeArcadeMotion().curtain, 0);
});
test("reveal waits for scene readiness and uses the shared cancellable motion clock", async () => {
  const controller = await read("src/lib/useArcade.ts");
  assert.match(controller, /phase === "revealing"[\s\S]*?if \(simple\)[\s\S]*?REVEALED[\s\S]*?else if \(sceneReady\)/);
  assert.match(controller, /curtain: 1, duration: 2.4/);
  assert.match(controller, /spotlight: 1, duration: 1.65/);
  assert.match(controller, /curtain: 0, spotlight: 0/);
  const entrance = await read("src/components/PortalEntrance.tsx");
  assert.match(entrance, /phase === "revealing" && !reduced && !state.fallback/);
  const scene = await read("src/components/PortalScene.tsx");
  assert.match(scene, /name="machine-stage-spotlights"/);
  assert.match(scene, /motion.spotlight \* \(1 - motion.travel\)/);
});
test("velvet gathers as a deforming 3D surface with smooth normals and a weighted hem", async () => {
  const cloth = await read("src/components/StageCurtain.tsx");
  const css = await read("src/components/arcade.css");
  const controller = await read("src/lib/useArcade.ts");
  assert.match(cloth, /name="gathering-velvet-curtain"/);
  assert.match(cloth, /planeGeometry args=\{\[1, 1, 144, 64\]\}/);
  assert.match(cloth, /float pull=clamp\(p-lag,0\.,1\.\)/);
  assert.match(cloth, /float gather=1\.-\.88\*pull/);
  assert.match(cloth, /clothNormal=normalMatrix\*normalize\(cross\(tangent,bitangent\)\)/);
  assert.match(cloth, /uniforms.progress.value = motion.curtain/);
  assert.match(cloth, /root.current.visible = motion.curtain < .999/);
  assert.doesNotMatch(css + controller, /curtain-leaf|curtain-valance|--curtain-left|--curtain-right/);
});
test("console progress and lightbox share concentric bevels and inset optics", async () => {
  const scene = await read("src/components/PortalScene.tsx");
  assert.match(scene, /name="round-counter-lightbox"/);
  assert.match(scene, /name="inlaid-console-instruments"/);
  assert.match(scene, /<ConsoleInstruments rounds=\{state.shakes\}/);
  assert.match(scene, /radius - rim/);
  assert.match(scene, /torusGeometry args=\{\[.066, .012, 8, 40\]\}/);
  assert.match(scene, /i < rounds \? 2 : .03/);
  assert.doesNotMatch(scene, /state.shakes \+ " \/ 3"/);
});
test("spin lighting travels smoothly, stays bounded and clears with timeline cancellation", async () => {
  const motion = makeArcadeMotion();
  assert.equal(motion.spinGlow, 0);
  assert.equal(motion.stopGlow, 0);
  for (let i = 0; i <= 100; i++) {
    const phase = i / 100;
    assert.equal(spinLightLevel(phase, .25, 0, 0), 0);
    const level = spinLightLevel(phase, .25, 1, 1);
    assert.ok(level >= .97 && level <= 1.65);
    assert.ok(Math.abs(spinLightLevel(phase, .25, 1, 0) - spinLightLevel(phase + 1, .25, 1, 0)) < 1e-12);
  }
  assert.ok(spinLightLevel(.25, .25, 1, 0) > spinLightLevel(.25, .75, 1, 0));
  const controller = await read("src/lib/useArcade.ts");
  assert.match(controller, /tl.kill\(\); motion.spinGlow = 0; motion.stopGlow = 0; update\(\)/);
  assert.match(controller, /if \(simple\) \{[\s\S]*?SETTLED[\s\S]*?\} else \{[\s\S]*?spinGlow: \.75/);
  const scene = await read("src/components/PortalScene.tsx");
  assert.match(scene, /name="spin-light-trim"/);
  assert.match(scene, /spinLightLevel\(motion.spinPhase/);
});
test("home reliably shows the slot machine while explicit gallery and work links stay direct", async () => {
  for (const hash of ["", "#top"]) assert.equal(arcadeStateForRoute(hash).inputMode, "entrance");
  for (const hash of ["#hub", "#about", "#case-yy", "#products"]) assert.equal(arcadeStateForRoute(hash).inputMode, "exhibition");
  assert.ok(arcadeStateForRoute("#top", true).fallback);
  const controller = await read("src/lib/useArcade.ts");
  assert.doesNotMatch(controller, /sessionStorage|UNLOCK_KEY/);
  const entrance = await read("src/components/PortalEntrance.tsx");
  assert.match(entrance, /className="opening-link"/);
  assert.match(entrance, /老虎机开场/);
  assert.match(entrance, /<Pixels \/><b>ZINX<\/b>/);
  assert.doesNotMatch(entrance, /产品 · 设计 · 影像/);
});

test("three separate pulls run three rounds; duplicate input and stale completions are rejected", () => {
  let state = event(initialArcadeState(), "REVEALED");
  assert.ok(canPull(state));
  state = event(state, "PULL");
  for (let i = 0; i < 3; i++) {
    assert.ok(!canPull(state));
    assert.equal(state.phase, "spinning");
    assert.equal(event(state, "PULL"), state);
    assert.equal(event(state, "SETTLED", i + 2), state);
    state = event(state, "SETTLED", i + 1);
    assert.equal(state.shakes, i + 1);
    assert.equal(event(state, "SETTLED", i + 1), state);
    if (i < 2) { assert.equal(state.phase, "ready"); assert.ok(canPull(state)); state = event(state, "PULL"); }
  }
  assert.equal(state.phase, "opening");
  assert.equal(event(state, "UNLOCK").inputMode, "exhibition");
  assert.ok(!("hubIndex" in state));
});

test("skip, fallback and restart cancel every active round", () => {
  let state = event(event(initialArcadeState(), "REVEALED"), "PULL");
  for (let round = 1; round <= 3; round++) {
    for (const command of ["UNLOCK", "FALLBACK", "RESTART"]) {
      const cancelled = event(state, command);
      assert.equal(event(cancelled, "SETTLED", round), cancelled);
    }
    state = event(state, "SETTLED", round);
    if (round < 3) state = event(state, "PULL");
  }
});

test("static fallback, skip and restart are usable independently of content", () => {
  const fallback = event(initialArcadeState(), "FALLBACK");
  assert.equal(fallback.inputMode, "exhibition");
  assert.ok(fallback.fallback);
  assert.deepEqual(event(fallback, "RESTART"), initialArcadeState());
  assert.equal(event(event(initialArcadeState(), "UNLOCK"), "RESTART").shakes, 0);
  for (const id of ["yy", "videopro", "runpro", "future-project"]) assert.equal(routeFromHash("#case-" + id).open, id);
  assert.equal(routeFromHash("#case-dating").open, "dating-diary");
  assert.equal(routeFromHash("#project-live-disguise").open, "shushucity");
});

test("physical reel stops remain independent from the exhibition catalog", () => {
  assert.equal(SYMBOL_COUNT, 10);
  for (let round = 1; round <= 3; round++) for (let reel = 0; reel < 3; reel++) {
    const symbol = reelStopSymbol(reel, round);
    const next = nextReelAngle(11.123, symbol, 3 + reel);
    assert.ok(next > 11.123 + 2 * TAU);
    assert.ok(Math.abs(((next % TAU) / TAU * SYMBOL_COUNT) - symbol) < 1e-9);
    assert.ok(reelSuits[symbolSuit(symbol)]);
  }
  assert.ok(PULL_THRESHOLD > .5 && PULL_THRESHOLD < .8);
  assert.equal(clamp01(-1), 0); assert.equal(clamp01(5), 1);
  const motion = makeArcadeMotion(); let count = 0; const draw = () => count++;
  motion.frames.add(draw); motion.invalidate(); assert.equal(count, 1);
  motion.frames.delete(draw); motion.invalidate(); assert.equal(count, 1);
});
test("reel lightbox uses individual glass panes, bevelled frame and side payline guides", async () => {
  const scene = await read("src/components/PortalScene.tsx");
  assert.match(scene, /name="reel-lightbox"/);
  assert.match(scene, /name="payline-light-guides"/);
  assert.match(scene, /shape.holes.push\(hole\)/);
  assert.match(scene, /rim.dispose\(\)/);
  assert.match(scene, /\[-1.62, 0, 1.62\].map/);
  assert.match(scene, /ctx.scale\(2,2\); drawReelEmblem\(ctx, i\)/);
  assert.doesNotMatch(scene, /WindowGlass|2.475, \.013, \.015/);
  assert.match(scene, /motion.stopGlow \* 1.5/);
});

test("original reel insignia and inset capsule lamps replace font suits and exposed blocks", async () => {
  const scene = await read("src/components/PortalScene.tsx");
  const art = await read("src/lib/reel-art.ts");
  assert.match(scene, /c.width = 1024; c.height = 576/);
  assert.match(scene, /name="recessed-lamp-channels"/);
  assert.match(scene, /name="bevelled-lamp-capsule"/);
  assert.match(scene, /lamp.children\[1\]/);
  assert.match(scene, /clearcoatRoughness=\{.08\}/);
  assert.match(art, /function suitPath/);
  assert.match(art, /const wing = new Path2D/);
  assert.match(art, /ctx.clip\(path\)/);
  assert.match(art, /index===1/);
  assert.match(art, /index===2/);
  assert.match(art, /index===3/);
  assert.doesNotMatch(art, /fillText|ctx.font/);
});

test("one React root and one physical entrance canvas retain their lifecycle boundaries", async () => {
  const [main, app, scene, entrance] = await Promise.all(["src/main.tsx", "src/App.tsx", "src/components/PortalScene.tsx", "src/components/PortalEntrance.tsx"].map(read));
  assert.equal((main.match(/createRoot\(root\)/g) ?? []).length, 1);
  assert.match(app, /export default function App/);
  assert.doesNotMatch(app, /HUB_SLUGS/);
  assert.equal((scene.match(/<Canvas\b/g) ?? []).length, 1);
  assert.match(scene, /frameloop="demand"/);
  assert.match(scene, /webglcontextlost/);
  assert.doesNotMatch(scene, /function Cabinet|railOffset|hubProjects|caseProgress/);
  assert.match(entrance, /<ExhibitionWall/);
  assert.match(entrance, /className="skip-link"/);
  assert.match(entrance, /key="replay-opening"/);
  assert.doesNotMatch(main, /<StrictMode>/);
});

test("lever is the physical entry; lightbox and real stickers replace the console buttons", async () => {
  const [scene, entrance, css] = await Promise.all(["src/components/PortalScene.tsx", "src/components/PortalEntrance.tsx", "src/components/arcade.css"].map(read));
  assert.doesNotMatch(entrance + css, /entrance-hud|entrance-start|entrance-keys|entrance-skip|shake-status/);
  assert.match(scene, /name="machine-control-deck"/);
  assert.match(scene, /aria-keyshortcuts="Space"/);
  assert.match(scene, /下拉启动/);
  assert.match(scene, /name="console-display-lightbox"/);
  assert.match(scene, /name="real-product-stickers"/);
  assert.doesNotMatch(scene + css, /machine-hit|machine-skip-hit|onDirect/);
  assert.match(scene, /disabled=\{!canPull\(state\)\}/);
  assert.match(entrance, /className="skip-link"/);
  assert.match(entrance, /className="sr-only" role="status"/);
});

test("scene-mounted settings and companion controls retain semantic inputs and touch targets", async () => {
  const [entrance, css, wall] = await Promise.all(["src/components/PortalEntrance.tsx", "src/components/arcade.css", "src/components/exhibition.css"].map(read));
  assert.match(entrance, /className="scene-control-rail" aria-label="展示设置"/);
  assert.match(entrance, /aria-pressed=\{enabled\}/);
  assert.doesNotMatch(entrance, /toggleMotion|少动效|aria-pressed=\{reduced\}/);
  assert.match(entrance, /useReducedMotion\(\)/);
  assert.match(entrance, /className="rail-indicator" aria-hidden="true"/);
  assert.match(entrance, /className="rail-about"/);
  assert.match(entrance, /data-outfit=\{outfit\}/);
  assert.match(css, /\.rail-indicator \{[^}]*height: 13px; flex: 0 0 auto/);
  assert.match(css, /\[aria-pressed=true\] \.rail-indicator::after \{ transform: translateX\(12px\)/);
  assert.match(wall, /\.companion-outfit\[data-outfit=scarf\] span \{ transform: rotate\(40deg\)/);
  assert.match(css, /\.scene-control-rail::after \{[^}]*pointer-events: none/);
  assert.match(css, /\.arcade-header nav a, \.arcade-header nav button \{[^}]*min-height: 44px/);
  assert.match(wall, /\.companion-outfit \{[^}]*min-height: 44px/);
  assert.doesNotMatch(entrance, /yy-dance-pause|entrance-hud/);
});

test("sound defaults on, unlocks on user gesture and stays outside entrance timeline dependencies", async () => {
  const audio = await read("src/lib/useExhibitionAudio.ts");
  const controller = await read("src/lib/useArcade.ts");
  assert.match(audio, /!== "off"/);
  assert.match(audio, /"pointerdown", unlock, true/);
  assert.match(audio, /"keydown", unlock, true/);
  assert.match(audio, /visibilitychange/);
  assert.match(audio, /audio.current\?\.close/);
  assert.doesNotMatch(controller, /state.sound|new AudioContext/);
});

test("entrance uses a backlit sign and bounded shared casino lighting", async () => {
  const scene = await read("src/components/PortalScene.tsx");
  assert.match(scene, /name="backlit-marquee"/);
  assert.match(scene, /background="transparent"/);
  assert.match(scene, /<rectAreaLight/);
  assert.match(scene, /name="marquee-edge-bloom"/);
  assert.match(scene, /name="casino-salon"/);
  assert.match(scene, /resolution=\{size.width < 700 \? 256 : 512\}/);
  assert.match(scene, /sheen=\{\.7\}/);
  assert.doesNotMatch(scene, /WorkshopArchitecture|function Plant/);
});
test("one shared scene smokes, bursts the machine and throws gold coins onto the table", async () => {
  const scene = await read("src/components/PortalScene.tsx");
  const entrance = await read("src/components/PortalEntrance.tsx");
  const controller = await read("src/lib/useArcade.ts");
  assert.match(scene, /name="burst-gold-coins"/);
  assert.match(scene, /name="project-coin-table"/);
  assert.match(scene, /name="machine-smoke-cloud"/);
  assert.match(scene, /texture.dispose\(\)/);
  assert.match(controller, /smoke: 1, duration: OPENING_CUES.blast/);
  assert.match(controller, /blast: 1, duration: OPENING_CUES.blastDuration, ease: "none"/);
  assert.match(scene, /name="explosion-impact"/);
  assert.match(scene, /blastEnvelope\(motion.blast\)/);
  assert.match(controller, /deal: 1, duration: 1.6/);
  assert.match(controller, /tableReveal: 1, duration: \.8/);
  assert.doesNotMatch(scene, /motion\.gate|physical-opening|reel-project-cartridge/);
  assert.doesNotMatch(entrance, /!exhibition && <div className="arcade-world"/);
  assert.match(entrance, /aria-hidden=\{exhibition \|\| undefined\}/);
});
test("explosion has a single bounded flash and settles before the gallery opens", () => {
  assert.equal(OPENING_CUES.blast, .65);
  assert.ok(OPENING_CUES.blast + OPENING_CUES.blastDuration < OPENING_CUES.complete);
  assert.ok(OPENING_CUES.coins > OPENING_CUES.blast);
  for (const p of [0, 1]) {
    const envelope = blastEnvelope(p);
    assert.ok(Math.abs(envelope.glow) < 1e-12);
    assert.ok(Math.abs(envelope.recoil) < 1e-12);
    assert.equal(envelope.sparks, 0);
  }
  assert.equal(blastEnvelope(.15).glow, 1);
  for (let i = 0; i <= 100; i++) {
    const e = blastEnvelope(i / 100);
    assert.ok(e.glow >= 0 && e.glow <= 1);
    assert.ok(Math.abs(e.recoil) <= 1);
    assert.ok(e.ring >= 0 && e.ring <= 1);
    if (i >= 30) assert.ok(e.glow < 1e-12);
  }
});
