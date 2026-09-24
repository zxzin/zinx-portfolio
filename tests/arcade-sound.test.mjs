import assert from "node:assert/strict";
import test from "node:test";
import { spinScore, openingScore, scheduleScore } from "../src/lib/arcade-sound.ts";
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
  const node = () => ({ connect() {}, disconnect() {}, frequency: param(), gain: param(), Q: param() });
  const source = () => { const s = { ...node(), startAt: -1, stops: [], start(at) { this.startAt = at; }, stop(at) { this.stops.push(at); } }; sources.push(s); return s; };
  const ctx = { sampleRate: 8000, createGain: node, createBiquadFilter: node, createOscillator: source, createBufferSource: source,
    createBuffer: (_, length) => ({ getChannelData: () => new Float32Array(length) }) };
  const score = [...spinScore(1, reelRoundDurations(1)), ...openingScore];
  const cancel = scheduleScore(ctx, node(), score, 2);
  assert.equal(sources.length, score.length);
  sources.forEach((s, i) => assert.equal(s.startAt, 2 + score[i].at));
  cancel();
  assert.ok(sources.every(s => s.stops.length === 2 && s.stops[1] === undefined));
  sources.forEach(s => s.onended());
});
