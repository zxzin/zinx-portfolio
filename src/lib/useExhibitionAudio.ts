import { useCallback, useEffect, useRef, useState } from "react";
import { createScoreBus, openingScore, renderBackgroundLoop, scheduleScore, spinScore, type SoundNote } from "./arcade-sound";

const SOUND_KEY = "zinx_exhibition_sound_v1";
export function useExhibitionAudio() {
  const [enabled, setEnabled] = useState(() => {
    try { return localStorage.getItem(SOUND_KEY) !== "off"; } catch { return true; }
  });
  const [status, setStatus] = useState("waiting-for-gesture");
  const [bgmStatus, setBgmStatus] = useState("waiting-for-gesture");
  const preference = useRef(enabled), audio = useRef<AudioContext | null>(null);
  const master = useRef<GainNode | null>(null), stopScore = useRef<(() => void) | null>(null);
  const background = useRef<AudioBufferSourceNode | null>(null), backgroundGain = useRef<GainNode | null>(null);
  const backgroundRender = useRef<Promise<AudioBuffer> | null>(null);
  const mixBackground = useCallback((level: number, recoverAt?: number) => {
    const ctx = audio.current, gain = backgroundGain.current?.gain;
    if (!ctx || !gain) return;
    gain.cancelScheduledValues(ctx.currentTime);
    gain.setTargetAtTime(level, ctx.currentTime, .07);
    if (recoverAt !== undefined) gain.setTargetAtTime(.3, recoverAt, .24);
  }, []);
  const silence = useCallback(() => { stopScore.current?.(); stopScore.current = null; mixBackground(.3); }, [mixBackground]);
  const unlock = useCallback(() => {
    if (!preference.current || document.hidden) return;
    try {
      if (!audio.current) {
        audio.current = new AudioContext();
        master.current = createScoreBus(audio.current, audio.current.destination);
        const ctx = audio.current;
        backgroundGain.current = ctx.createGain(); backgroundGain.current.gain.value = 0;
        backgroundGain.current.connect(master.current);
        mixBackground(.3);
        setBgmStatus("rendering");
        backgroundRender.current = renderBackgroundLoop(ctx.sampleRate);
        void backgroundRender.current.then(buffer => {
          if (audio.current !== ctx || ctx.state === "closed" || !backgroundGain.current) return;
          const loop = ctx.createBufferSource(); loop.buffer = buffer; loop.loop = true;
          loop.connect(backgroundGain.current); background.current = loop;
          loop.start(); setBgmStatus("ready");
        }).catch(() => { if (audio.current === ctx) setBgmStatus("unavailable"); });
      }
      void audio.current.resume().then(() => setStatus(audio.current?.state ?? "closed")).catch(() => setStatus("waiting-for-gesture"));
    } catch { setStatus("unavailable"); }
  }, [mixBackground]);
  const play = useCallback((score: SoundNote[]) => {
    silence();
    const ctx = audio.current;
    if (!preference.current || ctx?.state !== "running" || !master.current || document.hidden) return;
    mixBackground(.105, ctx.currentTime + Math.max(...score.map(note => note.at + note.duration)));
    stopScore.current = scheduleScore(ctx, master.current, score, ctx.currentTime + .008);
  }, [silence, mixBackground]);
  const spin = useCallback((round: number, stops: number[]) => play(spinScore(round, stops)), [play]);
  const open = useCallback(() => play(openingScore), [play]);
  // Stable callback keeps the mechanical timeline independent of sound preferences.
  const pulse = useCallback((frequency = 420, duration = 0.08) => {
    const ctx = audio.current;
    if (!preference.current || ctx?.state !== "running" || !master.current || document.hidden) return;
    const osc = ctx.createOscillator(), amp = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(Math.max(65, frequency / 2), ctx.currentTime + duration);
    amp.gain.setValueAtTime(0, ctx.currentTime);
    amp.gain.linearRampToValueAtTime(0.022, ctx.currentTime + 0.008);
    amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(amp); amp.connect(master.current); osc.start(); osc.stop(ctx.currentTime + duration);
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
      silence(); background.current?.stop(); background.current?.disconnect(); backgroundGain.current?.disconnect();
      background.current = null; backgroundGain.current = null; backgroundRender.current = null;
      void audio.current?.close(); audio.current = null; master.current = null;
    };
  }, [unlock, silence]);
  return { enabled, status, bgmStatus, toggle, pulse, spin, open, silence };
}
