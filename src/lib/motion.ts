import { useSyncExternalStore } from "react";

let paused = false;
export const isMotionReduced = () =>
  paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export function toggleMotion() {
  paused = !isMotionReduced();
  window.dispatchEvent(new Event("zinx:motion"));
}
function subscribe(callback: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", callback);
  window.addEventListener("zinx:motion", callback);
  return () => {
    media.removeEventListener("change", callback);
    window.removeEventListener("zinx:motion", callback);
  };
}
export function useReducedMotion() {
  return useSyncExternalStore(subscribe, isMotionReduced, () => false);
}
