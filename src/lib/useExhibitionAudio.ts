import { useCallback, useEffect, useRef, useState } from "react";
import { createScoreBus, openingScore, scheduleScore, spinScore, type SoundNote } from "./arcade-sound";
import { createAmbientMusic, hasAudibleMedia, MUSIC_PREFERENCE_KEY, readMusicPreference, type MusicSnapshot } from "./ambient-music";

export function useExhibitionAudio() {
  const [music, setMusic] = useState<MusicSnapshot>({ desired: true, playing: false, status: "waiting-for-gesture" });
  const [status, setStatus] = useState("waiting-for-gesture");
  const preference = useRef(true), audio = useRef<AudioContext | null>(null), mediaBusy = useRef(false);
  const master = useRef<GainNode | null>(null), stopScore = useRef<(() => void) | null>(null);
  const background = useRef<ReturnType<typeof createAmbientMusic> | null>(null);
  const silence = useCallback(() => { stopScore.current?.(); stopScore.current = null; }, []);
  const unlock = useCallback(() => {
    if (!preference.current || document.hidden || mediaBusy.current) return;
    // Both calls happen synchronously in the user gesture, including on mobile Safari.
    background.current?.unlock();
    try {
      if (!audio.current) {
        audio.current = new AudioContext();
        master.current = createScoreBus(audio.current, audio.current.destination);
      }
      const ctx = audio.current;
      void ctx.resume().then(() => { if (audio.current === ctx) setStatus(ctx.state); }).catch(() => setStatus("waiting-for-gesture"));
    } catch { setStatus("unavailable"); }
  }, []);
  const play = useCallback((score: SoundNote[]) => {
    silence();
    const ctx = audio.current;
    if (!preference.current || ctx?.state !== "running" || !master.current || document.hidden || mediaBusy.current) return;
    background.current?.duck(Math.max(...score.map(note => note.at + note.duration)));
    stopScore.current = scheduleScore(ctx, master.current, score, ctx.currentTime + .008);
  }, [silence]);
  const spin = useCallback((round: number, stops: number[]) => play(spinScore(round, stops)), [play]);
  const open = useCallback(() => play(openingScore), [play]);
  // Stable callback keeps the mechanical timeline independent of music preferences.
  const pulse = useCallback((frequency = 420, duration = 0.08) => {
    const ctx = audio.current;
    if (!preference.current || ctx?.state !== "running" || !master.current || document.hidden || mediaBusy.current) return;
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
    const blocked = ["waiting-for-gesture", "unavailable"].includes(background.current?.snapshot.status ?? "muted");
    const next = blocked || !preference.current;
    preference.current = next;
    try { sessionStorage.setItem(MUSIC_PREFERENCE_KEY, String(next)); } catch { /* The current tab still keeps the chosen setting. */ }
    background.current?.setEnabled(next);
    if (next) unlock(); else { silence(); void audio.current?.suspend(); setStatus("muted"); }
  }, [unlock, silence]);
  useEffect(() => {
    const player = createAmbientMusic(import.meta.env.BASE_URL + "audio/gallery-ambient.mp3", setMusic);
    background.current = player;
    const scanMedia = () => {
      const busy = hasAudibleMedia(document.querySelectorAll<HTMLMediaElement>("video, audio"));
      if (busy === mediaBusy.current) return;
      mediaBusy.current = busy;
      player.setMediaBusy(busy);
      if (busy) { silence(); void audio.current?.suspend(); setStatus("paused-media"); }
      else unlock();
    };
    const visibility = () => {
      if (document.hidden) { player.setHidden(true); silence(); void audio.current?.suspend(); setStatus("suspended"); }
      else { scanMedia(); player.setHidden(false); unlock(); }
    };
    const gesture = (event: Event) => {
      // The toggle owns its gesture, so a blocked retry cannot become an immediate mute.
      if (event.target instanceof Element && event.target.closest("[data-music-control]")) return;
      unlock();
    };
    const mediaEvents = ["play", "playing", "pause", "ended", "volumechange", "emptied"];
    mediaEvents.forEach(event => document.addEventListener(event, scanMedia, true));
    // Removing a playing film closes its audio focus even when no pause event fires.
    const observer = new MutationObserver(scanMedia);
    observer.observe(document.body, { childList: true, subtree: true });
    player.setHidden(document.hidden);
    scanMedia();
    try { preference.current = readMusicPreference(sessionStorage); } catch { preference.current = readMusicPreference(); }
    player.setEnabled(preference.current);
    window.addEventListener("pointerdown", gesture, true);
    window.addEventListener("keydown", gesture, true);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("pointerdown", gesture, true);
      window.removeEventListener("keydown", gesture, true);
      document.removeEventListener("visibilitychange", visibility);
      mediaEvents.forEach(event => document.removeEventListener(event, scanMedia, true));
      observer.disconnect(); player.dispose(); background.current = null;
      silence(); void audio.current?.close(); audio.current = null; master.current = null;
    };
  }, [unlock, silence]);
  const label = music.status === "loading" ? "加载中" : music.status === "paused-media" ? "影片中" : music.status === "waiting-for-gesture" ? "待播放" : music.status === "unavailable" ? "重试" : music.playing ? "开" : "关";
  return { enabled: music.playing, desired: music.desired, label, status, bgmStatus: music.status, toggle, pulse, spin, open, silence };
}
