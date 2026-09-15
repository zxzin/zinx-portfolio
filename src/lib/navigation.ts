export const STORY_MEDIA =
  "(min-width: 1081px) and (min-height: 640px) and (prefers-reduced-motion: no-preference)";

export function wrapIndex(
  index: number,
  direction: number,
  count: number,
): number {
  return count > 0 ? (((index + direction) % count) + count) % count : -1;
}

export function caseStepAt(progress: number, count: number): number {
  return Math.max(
    0,
    Math.min(count - 1, Math.floor(Math.max(0, progress) * count)),
  );
}

export function stepProgress(index: number, count: number): number {
  return (Math.max(0, Math.min(count - 1, index)) + 0.45) / Math.max(1, count);
}
