import assert from "node:assert/strict";
import test from "node:test";
import { backgroundScore, BGM_LOOP_SECONDS, spinScore, openingScore, scheduleScore, createScoreBus } from "../src/lib/arcade-sound.ts";
import { readFile } from "node:fs/promises";
import { OPENING_CUES, reelRoundDurations } from "../src/lib/arcade-state.ts";

test("original sound score aligns three rounds, smoke, explosion and coin landing", () => {
  let previousDuration = Infinity, previousBeat = Infinity;
  let total = 2.4;
  for (let round = 1; round <= 3; round++) {
    const stops = reelRoundDurations(round), score = spinScore(round, stops);
    assert.deepEqual(score.filter(n => n.kind === "stop").map(n => n.at), stops);
    const beats = score.filter(n => n.kind === "kick");
    assert.ok(beats[1].at < previousBeat);
    assert.ok(stops[2] < previousDuration);
    previousDuration = stops[2]; previousBeat = beats[1].at;
    total += stops[2] + .3;
    assert.ok(score.every(n => n.at >= 0 && n.duration > 0 && n.gain <= .42 && n.frequency >= 40));
  }
  assert.ok(total < 7 && total > 6);
  assert.equal(openingScore.filter(n => n.kind === "chord").length, 4);
  assert.equal(openingScore.find(n => n.kind === "burst").at, .65);
  assert.ok(openingScore.filter(n => n.kind === "stop").length >= 6);
});
test("explosion score separates pressure, impact, rumble and metallic coin tails", () => {
  const rise = openingScore.find(n => n.kind === "rise");
  assert.ok(rise.at + rise.duration < OPENING_CUES.blast);
  assert.ok(openingScore.some(n => n.kind === "kick" && n.at === OPENING_CUES.blast && n.gain >= .45));
  assert.ok(openingScore.some(n => n.kind === "burst" && n.at === OPENING_CUES.blast && n.duration <= .15));
  assert.ok(openingScore.some(n => n.kind === "burst" && n.duration >= .9));
  assert.ok(openingScore.some(n => n.kind === "kick" && n.frequency < 70 && n.duration >= 1));
  assert.ok(openingScore.every(n => n.gain <= .48 && n.at + n.duration < OPENING_CUES.complete));
});

test("sound scheduling disconnects voices and cancellation stops scheduled sources", () => {
  const sources = [];
  const param = () => ({ value: 0, setValueAtTime() {}, exponentialRampToValueAtTime() {} });
  const node = () => ({ connect() {}, disconnect() {}, frequency: param(), gain: param(), pan: param(), Q: param() });
  const source = () => { const s = { ...node(), startAt: -1, stops: [], start(at) { this.startAt = at; }, stop(at) { this.stops.push(at); } }; sources.push(s); return s; };
  const ctx = { sampleRate: 8000, createGain: node, createBiquadFilter: node, createStereoPanner: node, createOscillator: source, createBufferSource: source,
    createBuffer: (_, length) => ({ getChannelData: () => new Float32Array(length) }) };
  const score = [...spinScore(1, reelRoundDurations(1)), ...openingScore, ...backgroundScore()];
  const cancel = scheduleScore(ctx, node(), score, 2);
  assert.equal(sources.length, score.length);
  sources.forEach((s, i) => assert.equal(s.startAt, 2 + score[i].at));
  cancel();
  assert.ok(sources.every(s => s.stops.length === 2 && s.stops[1] === undefined));
  sources.forEach(s => s.onended());
});

test("background groove fits an eight-bar loop with center bass and stereo details", () => {
  const score = backgroundScore();
  assert.ok(BGM_LOOP_SECONDS > 17 && BGM_LOOP_SECONDS < 18);
  assert.ok(score.every(n => n.at >= 0 && n.at + n.duration < BGM_LOOP_SECONDS && n.gain <= .3));
  for (const kind of ["kick", "bass", "pad", "hat", "clap", "pluck"]) assert.ok(score.some(n => n.kind === kind));
  assert.ok(score.filter(n => ["bass", "kick"].includes(n.kind)).every(n => !n.pan));
  assert.ok(score.some(n => n.pan < 0) && score.some(n => n.pan > 0));
});
test("shared mix has a bounded soft ceiling and background ducks without restarting", async () => {
  let shaper;
  const param = () => ({value:0});
  const node = () => ({connect(){},gain:param(),threshold:param(),knee:param(),ratio:param(),attack:param(),release:param()});
  createScoreBus({createGain:node,createDynamicsCompressor:node,createWaveShaper:()=> (shaper=node())},node());
  assert.ok(shaper.curve.every(n => Number.isFinite(n) && Math.abs(n) < .9));
  const hook = await readFile(new URL("../src/lib/useExhibitionAudio.ts",import.meta.url),"utf8");
  assert.match(hook,/loop.loop = true/);
  assert.match(hook,/mixBackground\(\.105/);
  assert.match(hook,/audio.current !== ctx/);
  assert.match(hook,/background.current\?\.stop\(\)/);
  assert.match(hook,/document.hidden/);
  assert.match(hook,/amp.connect\(master.current\)/);
});
