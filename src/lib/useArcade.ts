import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { gsap } from "gsap";
import {
  arcadeReducer, canPull, clamp01,
  arcadeStateForRoute, makeArcadeMotion, nextReelAngle,
  PULL_THRESHOLD, OPENING_CUES, reelRoundDurations, reelStopSymbol, routeFromHash,
} from "./arcade-state";

function initial() {
  return arcadeStateForRoute(location.hash, new URLSearchParams(location.search).get("render") === "static");
}
export function useArcade(reduced: boolean, spin: (round: number, stops: number[]) => void, openSound: () => void, silence: () => void, sceneReady: boolean) {
  const [state, dispatch] = useReducer(arcadeReducer, undefined, initial);
  const [motion] = useState(() => {
    const m = makeArcadeMotion(), s = initial();
    if (s.shakes === 3) { m.curtain = 1; m.spotlight = 1; m.tableReveal = 1; m.travel = 1; m.darkness = 1; m.blast = 1; m.deal = 1; m.lights.fill(1); }
    return m;
  });
  const stage = useRef<HTMLDivElement>(null);
  const pull = useCallback(() => dispatch({ type: "PULL" }), []);
  const fail = useCallback(() => dispatch({ type: "FALLBACK" }), []);
  const direct = useCallback(() => dispatch({ type: "UNLOCK" }), []);
  const update = useCallback(() => {
    stage.current?.style.setProperty("--blackout", String(motion.blackout));
    if (stage.current) stage.current.dataset.reveal = motion.curtain >= .999 ? "open" : motion.curtain > .4 ? "gathering" : "closed";
    if (stage.current) stage.current.dataset.cameraPass = motion.travel > 0.65 ? "inside" : motion.travel > 0 ? "crossing" : "outside";
    if (stage.current) stage.current.dataset.effect = motion.blast >= .99 ? "settled" : motion.blast > .05 ? "burst" : motion.smoke > .1 ? "smoke" : "ready";
    motion.invalidate();
  }, [motion]);
  const dragLever = useCallback((value: number) => {
    if (!canPull(state) || reduced) return;
    gsap.killTweensOf(motion, "lever");
    motion.lever = clamp01(value);
    update();
  }, [state, reduced, motion, update]);
  const releaseLever = useCallback((value: number, tapped: boolean) => {
    if (!canPull(state)) return;
    if (value >= PULL_THRESHOLD || tapped) pull();
    else gsap.to(motion, { lever: 0, duration: 0.38, ease: "power3.out", onUpdate: update });
  }, [state, motion, pull, update]);
  const restart = useCallback(() => {
    Object.assign(motion, { lever: 0, tableReveal: 0, travel: 0, darkness: 0, deal: 0, smoke: 0, blast: 0, blackout: 0, parallaxX: 0, parallaxY: 0, kick: 0, spinGlow: 0, spinPhase: 0, stopGlow: 0, curtain: 0, spotlight: 0 });
    motion.reels.fill(0); motion.lights.fill(0);
    const url = new URL(location.href);
    url.searchParams.delete("render"); url.hash = "top";
    history.replaceState(null, "", url.pathname + url.search + url.hash);
    dispatch({ type: "RESTART" });
    update();
  }, [motion, update]);

  useEffect(() => {
    const tl = gsap.timeline({ onUpdate: update });
    const simple = reduced || state.fallback;
    if (state.phase === "revealing") {
      if (simple) {
        motion.curtain = 1; motion.spotlight = 1; update();
        tl.call(() => dispatch({ type: "REVEALED" }), [], 0);
      } else if (sceneReady) {
        tl.to(motion, { curtain: 1, duration: 2.4, ease: "power2.inOut" }, .15);
        tl.to(motion, { spotlight: 1, duration: 1.65, ease: "power2.inOut" }, .5);
        tl.call(() => dispatch({ type: "REVEALED" }), [], 2.55);
      }
    } else if (state.phase === "spinning") {
      const round = state.shakes + 1;
      if (simple) {
        motion.reels = motion.reels.map((a, i) => nextReelAngle(a, reelStopSymbol(i, round), 0));
        tl.call(() => dispatch({ type: "SETTLED", round }), [], 0.16);
      } else {
        {
          tl.to(motion, { lever: 1, duration: .1, ease: "power2.out" }, 0);
          tl.to(motion, { lever: 0, duration: .4, ease: "power3.out" }, .12);
        }
        const durations = reelRoundDurations(round);
        tl.to(motion, { spinGlow: .75 + round * .08, duration: .18, ease: "power2.out" }, 0);
        tl.to(motion, { spinPhase: motion.spinPhase + durations[2] * 1.1, duration: .06 + durations[2], ease: "none" }, 0);
        tl.call(() => spin(round, durations), [], .06);
        for (let i = 0; i < 3; i++) {
          const angle = nextReelAngle(motion.reels[i], reelStopSymbol(i, round), 3 + round + i);
          const lane = { angle: motion.reels[i] };
          const sync = () => { motion.reels[i] = lane.angle; update(); };
          tl.to(lane, { angle: angle + 0.03, duration: durations[i], ease: "power2.out", onUpdate: sync }, .06);
          tl.to(lane, { angle, duration: .08, ease: "power2.out", onUpdate: sync }, .06 + durations[i]);
        }
        const lockAt = .06 + durations[2];
        tl.to(motion, { spinGlow: 0, duration: .24, ease: "power2.out" }, lockAt);
        tl.to(motion, { stopGlow: 1, duration: .08, ease: "power2.out" }, lockAt);
        tl.to(motion, { stopGlow: 0, duration: .16, ease: "power2.inOut" }, lockAt + .08);
        tl.call(() => { motion.lights[round - 1] = 1; if (round === 3) motion.lights[3] = 1; }, [], lockAt);
        tl.to(motion, { darkness: round * .22, duration: .22 }, lockAt);
        tl.to(motion, { kick: 1, duration: .05 }, lockAt).to(motion, { kick: 0, duration: .14 }, lockAt + .05);
        tl.call(() => dispatch({ type: "SETTLED", round }), [], lockAt + .24);
      }
    } else if (state.phase === "opening") {
      if (simple) tl.call(() => dispatch({ type: "UNLOCK" }), [], 0.12);
      else {
        tl.call(openSound, [], 0);
        tl.to(motion, { smoke: 1, duration: OPENING_CUES.blast, ease: "power2.in" }, 0);
        tl.to(motion, { blast: 1, duration: OPENING_CUES.blastDuration, ease: "none" }, OPENING_CUES.blast);
        tl.to(motion, { deal: 1, duration: 1.6, ease: "none" }, OPENING_CUES.coins);
        tl.to(motion, { tableReveal: 1, duration: .8, ease: "power3.inOut" }, .75);
        tl.to(motion, { travel: 1, duration: 1.3, ease: "power2.inOut" }, 1);
        tl.to(motion, { smoke: 0, duration: .85, ease: "power2.in" }, 1.5);
        tl.call(() => dispatch({ type: "UNLOCK" }), [], OPENING_CUES.complete);
      }
    } else if (state.inputMode === "exhibition") {
      motion.curtain = 1; motion.spotlight = 1;
      motion.travel = 1; motion.tableReveal = 1; motion.darkness = 1; motion.blast = 1; motion.smoke = 0; motion.deal = 1; motion.lights.fill(1);
      update();
    }
    const busy = state.phase !== "ready" && state.phase !== "idle";
    const watchdog = busy ? window.setTimeout(() => dispatch({ type: "FALLBACK" }), 12000) : 0;
    return () => { tl.kill(); motion.spinGlow = 0; motion.stopGlow = 0; update(); silence(); clearTimeout(watchdog); };
  }, [state.phase, state.shakes, state.inputMode, state.fallback, reduced, motion, update, spin, openSound, silence, sceneReady]);
  useEffect(() => {
    const route = routeFromHash(location.hash);
    if (state.inputMode === "exhibition" && !route.open && !route.section) history.replaceState(null, "", "#hub");
  }, [state.inputMode, state.shakes]);
  useEffect(() => {
    const route = () => {
      const target = routeFromHash(location.hash);
      if (target.open || target.section || location.hash === "#hub") dispatch({ type: "UNLOCK" });
      else if (location.hash === "#top" || !location.hash) restart();
    };
    window.addEventListener("hashchange", route);
    return () => window.removeEventListener("hashchange", route);
  }, [restart]);
  useEffect(() => {
    const keyboard = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (e.repeat || document.hidden || target.closest("input,textarea,select,[role=tab],dialog")) return;
      const nativeAction = target.closest("button,a");
      if (canPull(state) && !nativeAction && [" ", "Enter"].includes(e.key)) { e.preventDefault(); pull(); }

    };
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  }, [state, pull]);
  useEffect(() => {
    if (reduced || state.inputMode !== "entrance") return;
    const x = gsap.quickTo(motion, "parallaxX", { duration: 0.5, ease: "power2.out", onUpdate: update });
    const y = gsap.quickTo(motion, "parallaxY", { duration: 0.5, ease: "power2.out", onUpdate: update });
    const pointer = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" || e.buttons) return;
      x((e.clientX / innerWidth - 0.5) * 0.3); y((e.clientY / innerHeight - 0.5) * 0.08);
    };
    window.addEventListener("pointermove", pointer);
    return () => { window.removeEventListener("pointermove", pointer); x.tween.kill(); y.tween.kill(); };
  }, [state.inputMode, reduced, motion, update]);
  useEffect(() => () => { gsap.killTweensOf(motion); }, [motion]);
  return { state, motion, stage, pull, fail, direct, restart, dragLever, releaseLever };
}
