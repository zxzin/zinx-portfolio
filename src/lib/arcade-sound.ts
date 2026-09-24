import { OPENING_CUES } from "./arcade-state.ts";
/** Original procedural arcade score. Times are relative to the reel's motion start. */
export type SoundNote = { kind: "kick" | "tick" | "stop" | "rise" | "chord" | "burst"; at: number; duration: number; frequency: number; gain: number };
export function spinScore(round: number, stops: number[]): SoundNote[] {
  const length = Math.max(...stops);
  const notes: SoundNote[] = [{ kind: "rise", at: 0, duration: length, frequency: 240 + round * 100, gain: .075 }];
  const beat = .24 - (round - 1) * .035;
  for (let at = 0, i = 0; at < length - .1; at += beat, i++) {
    notes.push({ kind: "kick", at, duration: .16, frequency: 125 + round * 10, gain: i % 2 ? .2 : .34 });
  }
  for (let at = .025, i = 0; at < length - .045; i++) {
    notes.push({ kind: "tick", at, duration: .028, frequency: 1500 + i % 3 * 350, gain: .11 });
    at += .042 + .058 * (at / length) ** 2;
  }
  stops.forEach((at, i) => notes.push({ kind: "stop", at, duration: .14, frequency: [523.25, 659.25, 783.99][i] * (round === 3 ? 1.25 : 1), gain: .22 }));
  return notes.sort((a, b) => a.at - b.at);
}
export const openingScore: SoundNote[] = [
  { kind: "rise", at: 0, duration: OPENING_CUES.blast - .05, frequency: 180, gain: .08 },
  // A brief pressure gap separates the wind-up from the impact.
  { kind: "kick", at: OPENING_CUES.blast, duration: .68, frequency: 155, gain: .48 },
  { kind: "burst", at: OPENING_CUES.blast, duration: .12, frequency: 4200, gain: .32 },
  { kind: "burst", at: OPENING_CUES.blast + .018, duration: .9, frequency: 2300, gain: .4 },
  { kind: "kick", at: OPENING_CUES.blast + .035, duration: 1.1, frequency: 62, gain: .22 },
  ...[.12, .23, .38].map((offset, i) => ({ kind: "burst" as const, at: OPENING_CUES.blast + offset, duration: .18, frequency: 1800 - i * 340, gain: .11 - i * .02 })),
  ...Array.from({ length: 8 }, (_, i) => ({ kind: "stop" as const, at: .95 + i * .16, duration: .11, frequency: 1400 + i % 3 * 260, gain: .11 })),
  ...[523.25, 659.25, 783.99, 1046.5].map((frequency, i) => ({ kind: "chord" as const, at: 1.7 + i * .045, duration: .4, frequency, gain: .06 })),
];

/** Shared by the live context and OfflineAudioContext for reproducible sound QA. */
export function scheduleScore(ctx: BaseAudioContext, destination: AudioNode, score: SoundNote[], start: number) {
  const sources: AudioScheduledSourceNode[] = [];
  for (const note of score) {
    const at = start + note.at, end = at + note.duration;
    const gain = ctx.createGain(), filter = ctx.createBiquadFilter();
    let source: OscillatorNode | AudioBufferSourceNode;
    if (note.kind === "tick" || note.kind === "rise" || note.kind === "burst") {
      const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * note.duration), ctx.sampleRate);
      const data = buffer.getChannelData(0);
      // Deterministic noise: identical timbre in the live mix and test render.
      let seed = 731;
      for (let i = 0; i < data.length; i++) { seed = (seed * 16807) % 2147483647; data[i] = seed / 1073741823.5 - 1; }
      source = ctx.createBufferSource(); source.buffer = buffer;
      filter.type = note.kind === "burst" ? "lowpass" : "bandpass"; filter.Q.value = note.kind === "burst" ? .7 : note.kind === "rise" ? .6 : 1.8;
      filter.frequency.setValueAtTime(note.frequency, at);
      if (note.kind === "rise") filter.frequency.exponentialRampToValueAtTime(3400, end);
      if (note.kind === "burst") filter.frequency.exponentialRampToValueAtTime(90, end);
    } else {
      source = ctx.createOscillator(); source.type = note.kind === "kick" ? "sine" : "triangle";
      source.frequency.setValueAtTime(note.frequency, at);
      if (note.kind === "kick") source.frequency.exponentialRampToValueAtTime(46, end);
      filter.type = "lowpass"; filter.frequency.value = 4500;
    }
    gain.gain.setValueAtTime(.0001, at);
    gain.gain.exponentialRampToValueAtTime(note.gain, at + Math.min(.007, note.duration / 4));
    if (note.kind === "rise") gain.gain.setValueAtTime(note.gain, end - .025);
    gain.gain.exponentialRampToValueAtTime(.0001, end);
    source.connect(filter); filter.connect(gain); gain.connect(destination);
    source.start(at); source.stop(end + .008); sources.push(source);
    source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); };
  }
  return () => sources.forEach(source => { try { source.stop(); } catch { /* Already ended. */ } });
}
