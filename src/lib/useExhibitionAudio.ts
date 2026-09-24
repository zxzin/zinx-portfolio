import { useCallback, useEffect, useRef, useState } from "react";
import { openingScore, scheduleScore, spinScore, type SoundNote } from "./arcade-sound";

const SOUND_KEY = "zinx_exhibition_sound_v1";
export function useExhibitionAudio() {
  const [enabled, setEnabled] = useState(() => {
    try { return localStorage.getItem(SOUND_KEY) !== "off"; } catch { return true; }
  });
  const [status, setStatus] = useState("waiting-for-gesture");
  const preference = useRef(enabled), audio = useRef<AudioContext | null>(null);
  const master = useRef<GainNode | null>(null), stopScore = useRef<(() => void) | null>(null);
  const silence = useCallback(() => { stopScore.current?.(); stopScore.current = null; }, []);
  const unlock = useCallback(() => {
    if (!preference.current || document.hidden) return;
    try {
      if (!audio.current) {
        audio.current = new AudioContext();
        const limiter = audio.current.createDynamicsCompressor();
        limiter.threshold.value = -12; limiter.knee.value = 8; limiter.ratio.value = 12;
        limiter.attack.value = .003; limiter.release.value = .12;
        master.current = audio.current.createGain(); master.current.gain.value = .48;
        master.current.connect(limiter); limiter.connect(audio.current.destination);
      }
      void audio.current.resume().then(() => setStatus(audio.current?.state ?? "closed")).catch(() => setStatus("waiting-for-gesture"));
    } catch { setStatus("unavailable"); }
  }, []);
  const play = useCallback((score: SoundNote[]) => {
    silence();
    const ctx = audio.current;
    if (!preference.current || ctx?.state !== "running" || !master.current || document.hidden) return;
    stopScore.current = scheduleScore(ctx, master.current, score, ctx.currentTime + .008);
  }, [silence]);
  const spin = useCallback((round: number, stops: number[]) => play(spinScore(round, stops)), [play]);
  const open = useCallback(() => play(openingScore), [play]);
  // Stable callback keeps the mechanical timeline independent of sound preferences.
  const pulse = useCallback((frequency = 420, duration = 0.08) => {
    const ctx = audio.current;
    if (!preference.current || ctx?.state !== "running" || document.hidden) return;
    const osc = ctx.createOscillator(), amp = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(65, frequency / 2), ctx.currentTime + duration);
    amp.gain.setValueAtTime(0, ctx.currentTime);
    amp.gain.linearRampToValueAtTime(0.022, ctx.currentTime + 0.008);
    amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(amp); amp.connect(ctx.destination); osc.start(); osc.stop(ctx.currentTime + duration);
    osc.onended = () => { osc.disconnect(); amp.disconnect(); };
  }, []);
  const toggle = useCallback(() => {
    const next = !preference.current;
    preference.current = next; setEnabled(next);
    try { localStorage.setItem(SOUND_KEY, next ? "on" : "off"); } catch { /* Keep the session preference. */ }
    if (next) unlock(); else { silence(); void audio.current?.suspend(); setStatus("muted"); }
  }, [unlock, silence]);
  useEffect(() => {
    const visibility = () => {
      if (document.hidden) { silence(); void audio.current?.suspend(); setStatus("suspended"); }
      else if (audio.current) unlock();
    };
    window.addEventListener("pointerdown", unlock, true);
    window.addEventListener("keydown", unlock, true);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("pointerdown", unlock, true);
      window.removeEventListener("keydown", unlock, true);
      document.removeEventListener("visibilitychange", visibility);
      silence(); void audio.current?.close(); audio.current = null; master.current = null;
    };
  }, [unlock, silence]);
  return { enabled, status, toggle, pulse, spin, open, silence };
}
