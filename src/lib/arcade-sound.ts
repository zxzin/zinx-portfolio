import { OPENING_CUES } from "./arcade-state.ts";
/** Original procedural arcade score. Times are relative to the reel's motion start. */
export type SoundNote = { kind: "kick" | "bass" | "pad" | "pluck" | "clap" | "hat" | "metal" | "tick" | "stop" | "rise" | "chord" | "burst"; at: number; duration: number; frequency: number; gain: number; pan?: number };

export const BGM_BPM = 112;
export const BGM_LOOP_SECONDS = 32 * 60 / BGM_BPM;
/** Eight original bars, E minor: low-slung arcade groove with a restrained melodic answer. */
export function backgroundScore(): SoundNote[] {
  const beat = 60 / BGM_BPM, notes: SoundNote[] = [];
  const harmony = [[164.81, 196, 246.94, 369.99], [130.81, 164.81, 196, 246.94], [146.83, 174.61, 220, 329.63], [123.47, 164.81, 185, 246.94]];
  const roots = [82.41, 65.41, 73.42, 61.74];
  for (let bar = 0; bar < 8; bar++) {
    const start = bar * 4 * beat, chord = harmony[Math.floor(bar / 2)];
    chord.forEach((frequency, i) => notes.push({ kind: "pad", at: start + .015, duration: beat * 3.8, frequency, gain: .035, pan: (i - 1.5) * .3 }));
    for (let step = 0; step < 8; step++) {
      const at = start + step * beat / 2 + (step % 2 ? .018 : 0);
      if (step % 2 === 0) notes.push({ kind: "kick", at, duration: .24, frequency: 145, gain: step === 0 ? .3 : .24 });
      if (step === 2 || step === 6) notes.push({ kind: "clap", at, duration: .1, frequency: 1650, gain: .1, pan: -.12 });
      notes.push({ kind: "hat", at, duration: step % 2 ? .08 : .025, frequency: 5800, gain: step % 2 ? .05 : .025, pan: step % 2 ? .32 : -.32 });
      if ([1, 3, 4, 7].includes(step)) notes.push({ kind: "bass", at: at + .025, duration: .17, frequency: roots[Math.floor(bar / 2)] * (step === 7 && bar % 2 ? 2 : 1), gain: .2 });
      if (bar % 2 && [1, 4, 6].includes(step)) notes.push({ kind: "pluck", at: at + .012, duration: .19, frequency: chord[step % 4] * 2, gain: .047, pan: step === 4 ? -.45 : .45 });
    }
  }
  return notes.sort((a, b) => a.at - b.at);
}

/** Render one stable loop once; buffer playback keeps BGM continuous across route changes. */
export async function renderBackgroundLoop(sampleRate: number) {
  const ctx = new OfflineAudioContext(2, Math.ceil(BGM_LOOP_SECONDS * sampleRate), sampleRate);
  scheduleScore(ctx, ctx.destination, backgroundScore(), 0);
  return ctx.startRendering();
}
export function spinScore(round: number, stops: number[]): SoundNote[] {
  const length = Math.max(...stops);
  const notes: SoundNote[] = [{ kind: "rise", at: 0, duration: length, frequency: 180 + round * 90, gain: .13 }];
  const beat = .24 - (round - 1) * .035;
  for (let at = 0, i = 0; at < length - .1; at += beat, i++) {
    notes.push({ kind: "kick", at, duration: .21, frequency: 145 + round * 10, gain: i % 2 ? .27 : .4 });
    notes.push({ kind: "bass", at: at + .055, duration: Math.min(beat * .62, length + .16 - at), frequency: [82.41, 82.41, 98, 73.42][i % 4], gain: .17 + round * .025 });
    if (i % 2) notes.push({ kind: "clap", at, duration: .12, frequency: 1700, gain: .17, pan: -.12 });
    notes.push({ kind: "hat", at: at + beat / 2, duration: .045, frequency: 6500, gain: .065, pan: i % 2 ? .35 : -.35 });
  }
  for (let at = .025, i = 0; at < length - .045; i++) {
    notes.push({ kind: "tick", at, duration: .03, frequency: 950 + i % 3 * 420, gain: .095, pan: Math.sin(i * 1.7) * .45 });
    at += .042 + .058 * (at / length) ** 2;
  }
  stops.forEach((at, i) => {
    notes.push({ kind: "stop", at, duration: .16, frequency: [329.63, 392, 493.88][i], gain: .23, pan: (i - 1) * .3 });
    notes.push({ kind: "metal", at, duration: .075, frequency: 850 + i * 240, gain: .13, pan: (i - 1) * .35 });
  });
  return notes.sort((a, b) => a.at - b.at);
}
export const openingScore: SoundNote[] = [
  { kind: "rise", at: 0, duration: OPENING_CUES.blast - .05, frequency: 120, gain: .2 },
  ...[0, .16, .29, .39, .47].map((at, i) => ({ kind: "bass" as const, at, duration: .065, frequency: 73.42 + i * 7, gain: .15 + i * .025 })),
  // A brief pressure gap separates the wind-up from the impact.
  { kind: "kick", at: OPENING_CUES.blast, duration: .68, frequency: 155, gain: .48 },
  { kind: "burst", at: OPENING_CUES.blast, duration: .12, frequency: 4200, gain: .32 },
  { kind: "burst", at: OPENING_CUES.blast + .018, duration: .9, frequency: 2300, gain: .4 },
  { kind: "kick", at: OPENING_CUES.blast + .035, duration: 1.1, frequency: 62, gain: .22 },
  { kind: "bass", at: OPENING_CUES.blast + .015, duration: .55, frequency: 73.42, gain: .26 },
  { kind: "clap", at: OPENING_CUES.blast + .008, duration: .19, frequency: 1300, gain: .24, pan: -.25 },
  { kind: "metal", at: OPENING_CUES.blast + .025, duration: .32, frequency: 720, gain: .2, pan: .3 },
  ...[.12, .23, .38].map((offset, i) => ({ kind: "burst" as const, at: OPENING_CUES.blast + offset, duration: .18, frequency: 1800 - i * 340, gain: .11 - i * .02 })),
  ...Array.from({ length: 8 }, (_, i) => ({ kind: "stop" as const, at: .95 + i * .16, duration: .11, frequency: 1400 + i % 3 * 260, gain: .11, pan: (i % 2 ? 1 : -1) * (.2 + i * .06) })),
  ...[164.81, 196, 246.94, 329.63].map((frequency, i) => ({ kind: "chord" as const, at: 1.7 + i * .045, duration: .4, frequency, gain: .085, pan: (i - 1.5) * .25 })),
];

/** Common live/offline bus: compression preserves punch, soft ceiling leaves headroom. */
export function createScoreBus(ctx: BaseAudioContext, destination: AudioNode) {
  const input = ctx.createGain(), compressor = ctx.createDynamicsCompressor(), ceiling = ctx.createWaveShaper();
  input.gain.value = .85;
  compressor.threshold.value = -14; compressor.knee.value = 10; compressor.ratio.value = 5;
  compressor.attack.value = .006; compressor.release.value = .16;
  const curve = new Float32Array(4097);
  for (let i = 0; i < curve.length; i++) curve[i] = .89 * Math.tanh((i / (curve.length - 1) * 2 - 1) * 1.6);
  ceiling.curve = curve; ceiling.oversample = "2x";
  input.connect(compressor); compressor.connect(ceiling); ceiling.connect(destination);
  return input;
}

/** Shared by the live context and OfflineAudioContext for reproducible sound QA. */
export function scheduleScore(ctx: BaseAudioContext, destination: AudioNode, score: SoundNote[], start: number) {
  const sources: AudioScheduledSourceNode[] = [];
  for (const note of score) {
    const at = start + note.at, end = at + note.duration;
    const gain = ctx.createGain(), filter = ctx.createBiquadFilter(), pan = ctx.createStereoPanner();
    pan.pan.value = note.pan ?? 0;
    let source: OscillatorNode | AudioBufferSourceNode;
    if (["tick", "rise", "burst", "clap", "hat", "metal"].includes(note.kind)) {
      const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * note.duration), ctx.sampleRate);
      const data = buffer.getChannelData(0);
      // Deterministic noise: identical timbre in the live mix and test render.
      let seed = 731 + Math.round(note.at * 1000) + Math.round(note.frequency);
      for (let i = 0; i < data.length; i++) { seed = (seed * 16807) % 2147483647; data[i] = seed / 1073741823.5 - 1; }
      source = ctx.createBufferSource(); source.buffer = buffer;
      filter.type = note.kind === "burst" ? "lowpass" : note.kind === "hat" ? "highpass" : "bandpass";
      filter.Q.value = note.kind === "metal" ? 5 : note.kind === "burst" ? .7 : note.kind === "rise" ? .6 : 1.2;
      filter.frequency.setValueAtTime(note.frequency, at);
      if (note.kind === "rise") filter.frequency.exponentialRampToValueAtTime(3400, end);
      if (note.kind === "burst") filter.frequency.exponentialRampToValueAtTime(90, end);
    } else {
      source = ctx.createOscillator(); source.type = note.kind === "kick" ? "sine" : note.kind === "bass" || note.kind === "chord" ? "sawtooth" : "triangle";
      source.frequency.setValueAtTime(note.frequency, at);
      if (note.kind === "kick") {
        source.frequency.exponentialRampToValueAtTime(52, at + Math.min(.055, note.duration / 3));
        source.frequency.exponentialRampToValueAtTime(46, end);
      }
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(note.kind === "bass" ? 1100 : note.kind === "pad" ? 850 : note.kind === "pluck" ? 2300 : note.kind === "chord" ? 1700 : 4500, at);
      if (note.kind === "bass") { filter.Q.value = 1.1; filter.frequency.exponentialRampToValueAtTime(180, end); }
    }
    gain.gain.setValueAtTime(.0001, at);
    gain.gain.exponentialRampToValueAtTime(note.gain, at + Math.min(note.kind === "pad" ? .18 : .007, note.duration / 4));
    if (note.kind === "rise") {
      gain.gain.setValueAtTime(note.gain * .16, at + .008);
      gain.gain.exponentialRampToValueAtTime(note.gain, end - .025);
    }
    if (note.kind === "kick" || note.kind === "bass") gain.gain.exponentialRampToValueAtTime(note.gain * .4, at + note.duration * .42);
    if (note.kind === "clap") {
      for (const offset of [.018, .036]) {
        gain.gain.exponentialRampToValueAtTime(note.gain * .14, at + offset - .004);
        gain.gain.exponentialRampToValueAtTime(note.gain, at + offset);
      }
    }
    gain.gain.exponentialRampToValueAtTime(.0001, end);
    source.connect(filter); filter.connect(gain); gain.connect(pan); pan.connect(destination);
    source.start(at); source.stop(end + .008); sources.push(source);
    source.onended = () => { source.disconnect(); filter.disconnect(); gain.disconnect(); pan.disconnect(); };
  }
  return () => sources.forEach(source => { try { source.stop(); } catch { /* Already ended. */ } });
}
