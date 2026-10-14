import { clamp01, PULL_THRESHOLD } from "./arcade-state.ts";

/** The detent resists near the latch, then lets the arm fall through. Input stays linear. */
export function leverDeflection(input: number) {
  const p = clamp01(input);
  return p <= PULL_THRESHOLD ? .64 * (1 - (1 - p / PULL_THRESHOLD) ** 1.6)
    : .64 + .36 * ((p - PULL_THRESHOLD) / (1 - PULL_THRESHOLD)) ** .45;
}
export const COIN_FLIGHT_SECONDS = 1.6;
export const COIN_COUNT = 12;
export const coinContactProgress = (index: number) => index * .018 + .76 * (1 - index * .018);
export function coinFlight(progress: number, index: number) {
  const p = clamp01((progress - index * .018) / (1 - index * .018));
  const flight = Math.min(1, p / .76), settle = clamp01((p - .76) / .24), angle = index * 2.39996;
  const bounce = .12 * Math.abs(Math.sin(settle * Math.PI * 2)) * (1 - settle) ** 2;
  return {
    x: Math.cos(angle) * (1 + index % 3) * flight,
    y: 2.6 * (1 - flight) + .97 * flight + Math.sin(flight * Math.PI) * (2 + index % 3 * .4) + bounce,
    z: 1.6 + (3.2 + Math.sin(angle) * 1.5) * flight,
    rx: -Math.PI / 2 * flight + Math.sin(settle * Math.PI * 5) * .22 * (1 - settle) ** 2,
    ry: Math.PI * 4 * flight,
    rz: angle + Math.sin(flight * Math.PI) * 3 + Math.sin(settle * Math.PI * 4) * .1 * (1 - settle) ** 2,
  };
}

/** Petals take a slower, fluttering path and remain on the same table after the transition. */
export const PETAL_COUNT = 22;
export function petalFlight(progress: number, index: number) {
  const delay = index % 7 * .035, p = clamp01((progress - delay) / (1 - delay));
  const a = index * 2.39996;
  const origin = index % 4;
  const start = origin === 0 ? { x: 2.4 + index % 3 * .35, y: 5.24, z: 1.6 }
    : origin === 1 ? { x: -3.43 + Math.sin(a) * .08, y: 2.1 + index % 10 * .3, z: 1.6 }
    : { x: (origin === 2 ? -3.65 : 3.65) + Math.sin(a) * .55, y: 1.5 + index % 5 * .15, z: origin === 2 ? 1.8 : 1.3 };
  const end = { x: Math.cos(a) * (1.2 + index % 4 * .75), y: .963 + index % 3 * .008, z: 4.25 + Math.sin(a) * 1.25 };
  const flutter = Math.sin(p * Math.PI * (5 + index % 3)) * Math.sin(p * Math.PI);
  return { x: start.x * (1 - p) + end.x * p + flutter * .22,
    y: start.y * (1 - p) + end.y * p + Math.sin(p * Math.PI) * (1 + index % 3 * .18),
    z: start.z * (1 - p) + end.z * p,
    rx: -Math.PI / 2 * p + flutter * .6, ry: a + Math.sin(p * Math.PI) * 3, rz: flutter * .5,
  };
}

export type CapturePosition = { x: number; y: number };
export const constrainCapture = ({ x, y }: CapturePosition): CapturePosition => ({ x: Math.min(54, Math.max(4, x)), y: Math.min(42, Math.max(5, y)) });
