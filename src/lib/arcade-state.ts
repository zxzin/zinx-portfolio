export const SYMBOL_COUNT = 10;
export const TAU = Math.PI * 2;
export const PULL_THRESHOLD = 0.62;
export const OPENING_CUES = { blast: .65, blastDuration: 1.25, coins: .72, complete: 2.4 } as const;
/** One linear explosion clock drives the shockwave, debris and camera recoil. */
export function blastEnvelope(progress: number) {
  const p = clamp01(progress);
  return { recoil: Math.sin(p * Math.PI * 10) * (1 - p) ** 3,
    glow: Math.sin(Math.min(1, p / .3) * Math.PI),
    ring: Math.min(1, p / .5), sparks: Math.sin(p * Math.PI) * (1 - p) };
}
// Entrance symbols are independent of exhibition content and count.
export const reelSuits = ["♥", "♦", "♠", "♣"];
export type InputMode = "entrance" | "travelling" | "exhibition";
export type Phase = "revealing" | "ready" | "spinning" | "opening" | "idle";
export type ArcadeState = { inputMode: InputMode; phase: Phase; shakes: number; fallback: boolean };
export type ArcadeEvent = { type: "PULL" | "REVEALED" | "UNLOCK" | "FALLBACK" | "RESTART" } | { type: "SETTLED"; round: number };
export const reelRoundDurations = (round: number) => round === 3 ? [.62, .78, .96] : round === 2 ? [.76, .94, 1.12] : [.88, 1.08, 1.3];
export const initialArcadeState = (): ArcadeState => ({ inputMode: "entrance", phase: "revealing", shakes: 0, fallback: false });
/** The URL owns entry intent. Visiting home always shows the machine. */
export function arcadeStateForRoute(hash: string, staticRender = false): ArcadeState {
  const route = routeFromHash(hash);
  return staticRender || hash === "#hub" || route.open || route.section
    ? { inputMode: "exhibition", phase: "idle", shakes: 3, fallback: staticRender }
    : initialArcadeState();
}
export const canPull = (s: ArcadeState) => s.inputMode === "entrance" && s.phase === "ready" && s.shakes < 3;
export function arcadeReducer(s: ArcadeState, e: ArcadeEvent): ArcadeState {
  switch (e.type) {
    case "REVEALED": return s.phase === "revealing" ? { ...s, phase: "ready" } : s;
    case "PULL": return canPull(s) ? { ...s, phase: "spinning" } : s;
    case "SETTLED":
      if (s.phase !== "spinning" || e.round !== s.shakes + 1) return s;
      return s.shakes === 2 ? { ...s, shakes: 3, inputMode: "travelling", phase: "opening" } : { ...s, shakes: s.shakes + 1, phase: "ready" };
    case "UNLOCK": return { ...s, shakes: 3, inputMode: "exhibition", phase: "idle" };
    case "FALLBACK": return { fallback: true, shakes: 3, inputMode: "exhibition", phase: "idle" };
    case "RESTART": return initialArcadeState();
  }
}
export type ScreenRect = { x: number; y: number; width: number; height: number };
export type ArcadeMotion = {
  reels: number[]; lights: number[]; lever: number; tableReveal: number; travel: number;
  darkness: number; deal: number; smoke: number; blast: number;
  parallaxX: number; parallaxY: number; blackout: number; kick: number;
  spinGlow: number; spinPhase: number; stopGlow: number;
  curtain: number; spotlight: number;
  frames: Set<() => void>; invalidate: () => void;
};
export function makeArcadeMotion(): ArcadeMotion {
  const frames = new Set<() => void>();
  return { reels: [0, 0, 0], lights: [0, 0, 0, 0], lever: 0, tableReveal: 0, travel: 0,
    darkness: 0, deal: 0, smoke: 0, blast: 0, parallaxX: 0, parallaxY: 0, blackout: 0, kick: 0,
    spinGlow: 0, spinPhase: 0, stopGlow: 0, curtain: 0, spotlight: 0,
    frames, invalidate: () => frames.forEach(fn => fn()) };
}
export const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
/** A travelling, soft light crest; brightness stays bounded and never strobes. */
export function spinLightLevel(phase: number, position: number, energy: number, stop: number) {
  const crest = .5 + .5 * Math.cos(TAU * (phase - position));
  return clamp01(energy) * (.32 + .68 * crest * crest) + clamp01(stop) * .65;
}
export function nextReelAngle(current: number, symbol: number, turns: number) {
  return Math.ceil(current / TAU) * TAU + turns * TAU + (symbol % SYMBOL_COUNT) * TAU / SYMBOL_COUNT;
}
export function symbolSuit(index: number) { return [0, 1, 2, 3, 0, 2, 1, 3, 2, 0][index % SYMBOL_COUNT]; }
export function reelStopSymbol(reel: number, round: number) {
  return reel === 0 ? 0 : reel === 1 && round >= 2 ? 1 : reel === 2 && round === 3 ? 3 : (round + reel + 2) % SYMBOL_COUNT;
}
export function routeFromHash(hash: string) {
  const aliases: Record<string, string> = { dating: "dating-diary", "live-disguise": "shushucity" };
  const match = hash.match(/^#(?:case-|project-)([a-z0-9-]+)$/);
  if (match) return { open: aliases[match[1]] ?? match[1], section: "selected-work" };
  const section = hash.replace(/^#/, "");
  return { open: null, section: ["selected-work", "products", "motion-lab", "systems", "archive", "about"].includes(section) ? section : null };
}
