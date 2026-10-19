export const MUSIC_PREFERENCE_KEY = "zinx-music-enabled";
export const MUSIC_VOLUME = .6;
export type MusicStatus = "muted" | "loading" | "playing" | "waiting-for-gesture" | "paused-media" | "hidden" | "unavailable";
export type MusicSnapshot = { desired: boolean; playing: boolean; status: MusicStatus };
type MusicRuntime = {
  createAudio: () => HTMLAudioElement;
  now: () => number;
  frame: (callback: FrameRequestCallback) => number;
  cancelFrame: (id: number) => void;
  delay: (callback: () => void, milliseconds: number) => ReturnType<typeof setTimeout>;
  cancelDelay: (id: ReturnType<typeof setTimeout>) => void;
};

export function readMusicPreference(storage: Pick<Storage, "getItem">): boolean {
  try { return storage.getItem(MUSIC_PREFERENCE_KEY) === "true"; } catch { return false; }
}

export function hasAudibleMedia(elements: Iterable<Pick<HTMLMediaElement, "paused" | "ended" | "muted" | "volume">>): boolean {
  return [...elements].some(media => !media.paused && !media.ended && !media.muted && media.volume > 0);
}

/** One looping track. Playback state follows the browser's play promise. */
export function createAmbientMusic(source: string, changed: (snapshot: MusicSnapshot) => void, runtime: MusicRuntime = {
  createAudio: () => new Audio(), now: () => performance.now(),
  frame: callback => requestAnimationFrame(callback), cancelFrame: id => cancelAnimationFrame(id),
  delay: (callback, milliseconds) => setTimeout(callback, milliseconds), cancelDelay: id => clearTimeout(id),
}) {
  let audio: HTMLAudioElement | undefined, desired = false, hidden = false, mediaBusy = false, disposed = false;
  let status: MusicStatus = "muted", pending = false, generation = 0, fadeFrame = 0;
  let recover: ReturnType<typeof setTimeout> | undefined;
  const eligible = () => desired && !hidden && !mediaBusy && !disposed;
  const publish = (next: MusicStatus) => {
    status = next;
    if (!disposed) changed({ desired, playing: next === "playing", status: next });
  };
  const fade = (target: number) => {
    runtime.cancelFrame(fadeFrame);
    if (!audio) return;
    const start = audio.volume, started = runtime.now();
    const step = () => {
      if (!audio || !eligible()) return;
      const progress = Math.min(1, (runtime.now() - started) / 650);
      audio.volume = start + (target - start) * (1 - Math.pow(1 - progress, 3));
      if (progress < 1) fadeFrame = runtime.frame(step);
    };
    fadeFrame = runtime.frame(step);
  };
  const pause = (next: MusicStatus) => {
    generation++; pending = false;
    runtime.cancelFrame(fadeFrame);
    if (recover !== undefined) runtime.cancelDelay(recover);
    recover = undefined;
    if (audio) { audio.pause(); audio.volume = 0; }
    publish(next);
  };
  const refresh = () => {
    if (disposed) return;
    if (!desired) { pause("muted"); return; }
    if (hidden) { pause("hidden"); return; }
    if (mediaBusy) { pause("paused-media"); return; }
    if (pending || (audio && !audio.paused && status === "playing")) return;
    if (!audio) {
      audio = runtime.createAudio(); audio.src = source; audio.loop = true; audio.preload = "none"; audio.volume = 0;
      audio.addEventListener("error", () => { if (!disposed) pause("unavailable"); });
    }
    const ticket = ++generation;
    pending = true; publish("loading");
    try {
      void audio.play().then(() => {
        if (ticket !== generation || disposed) { if (!eligible()) audio?.pause(); return; }
        pending = false;
        if (!eligible()) { refresh(); return; }
        if (audio?.paused) { publish("waiting-for-gesture"); return; }
        publish("playing"); fade(MUSIC_VOLUME);
      }).catch((error: unknown) => {
        if (ticket !== generation || disposed) return;
        pending = false;
        publish(error instanceof Error && error.name === "NotAllowedError" ? "waiting-for-gesture" : "unavailable");
      });
    } catch { pending = false; publish("unavailable"); }
  };
  return {
    get snapshot(): MusicSnapshot { return { desired, playing: status === "playing", status }; },
    setEnabled(value: boolean) { desired = value; refresh(); },
    setHidden(value: boolean) { if (hidden !== value) { hidden = value; refresh(); } },
    setMediaBusy(value: boolean) { if (mediaBusy !== value) { mediaBusy = value; refresh(); } },
    unlock: refresh,
    duck(seconds: number) {
      if (!eligible() || status !== "playing") return;
      if (recover !== undefined) runtime.cancelDelay(recover);
      fade(.1);
      recover = runtime.delay(() => { recover = undefined; if (eligible()) fade(MUSIC_VOLUME); }, seconds * 1000);
    },
    dispose() {
      disposed = true; pause("muted");
      if (audio) { audio.removeAttribute("src"); audio.load(); }
      audio = undefined;
    },
  };
}
