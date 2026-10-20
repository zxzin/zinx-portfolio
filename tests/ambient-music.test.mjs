import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { createAmbientMusic, hasAudibleMedia, MUSIC_PREFERENCE_KEY, MUSIC_VOLUME, readMusicPreference } from '../src/lib/ambient-music.ts';

function harness() {
  let time = 0, id = 0, created = 0;
  const frames = new Map(), delays = new Map(), events = new Map(), changes = [];
  const audio = { paused: true, volume: 0, currentTime: 7, plays: 0, pauses: 0, loads: 0,
    play() { this.plays++; this.paused = false; return Promise.resolve(); },
    pause() { this.pauses++; this.paused = true; },
    addEventListener(name, listener) { events.set(name, listener); },
    removeAttribute(name) { delete this[name]; }, load() { this.loads++; },
  };
  const runtime = {
    createAudio() { created++; return audio; }, now: () => time,
    frame(callback) { frames.set(++id, callback); return id; }, cancelFrame(frame) { frames.delete(frame); },
    delay(callback, ms) { delays.set(++id, { callback, at: time + ms }); return id; }, cancelDelay(delay) { delays.delete(delay); },
  };
  const music = createAmbientMusic('/zinx-portfolio/audio/gallery-ambient.mp3', state => changes.push(state), runtime);
  const tick = (ms) => {
    time += ms;
    const queued = [...frames.values()]; frames.clear(); queued.forEach(callback => callback(time));
    for (const [key, task] of delays) if (task.at <= time) { delays.delete(key); task.callback(); }
  };
  return { music, audio, tick, changes, events, frames, delays, created: () => created };
}
const settle = async () => { await Promise.resolve(); await Promise.resolve(); };

test('music defaults on, preserves explicit mute, and tolerates blocked storage', () => {
  assert.equal(MUSIC_PREFERENCE_KEY, 'zinx-music-enabled');
  for (const stored of [null, 'true', 'on']) assert.equal(readMusicPreference({ getItem: () => stored }), true);
  assert.equal(readMusicPreference({ getItem: () => 'false' }), false);
  assert.equal(readMusicPreference({ getItem() { throw Error('blocked'); } }), true);
  assert.equal(readMusicPreference(), true);
});

test('the player waits for the preference before creating audio', () => {
  const h = harness(); h.music.unlock();
  assert.equal(h.created(), 0);
  assert.deepEqual(h.music.snapshot, { desired: false, playing: false, status: 'muted' });
});

test('one looping track fades in, ducks for effects, and resumes its position', async () => {
  const h = harness(); h.music.setEnabled(true); h.music.unlock();
  assert.equal(h.audio.plays, 1);
  assert.equal(h.music.snapshot.playing, false);
  await settle(); h.tick(650);
  assert.equal(h.music.snapshot.status, 'playing');
  assert.equal(h.audio.loop, true);
  assert.equal(h.audio.volume, MUSIC_VOLUME);
  h.music.duck(2); h.tick(650); assert.ok(h.audio.volume < .11);
  h.tick(1350); h.tick(650); assert.equal(h.audio.volume, MUSIC_VOLUME);
  h.music.setEnabled(false); assert.equal(h.audio.paused, true); assert.equal(h.audio.volume, 0);
  h.music.setEnabled(true); await settle();
  assert.equal(h.created(), 1); assert.equal(h.audio.currentTime, 7);
});

test('default-on autoplay waits for a gesture without claiming playback', async () => {
  const h = harness();
  h.audio.play = () => Promise.reject(Object.assign(new Error('gesture needed'), { name: 'NotAllowedError' }));
  h.music.setEnabled(readMusicPreference({ getItem: () => null })); await settle();
  assert.deepEqual(h.music.snapshot, { desired: true, playing: false, status: 'waiting-for-gesture' });
  h.audio.play = () => { h.audio.paused = false; return Promise.resolve(); };
  h.music.unlock(); await settle(); assert.equal(h.music.snapshot.status, 'playing');
});

test('audible media and hidden pages pause music, and off stays off after return', async () => {
  const h = harness(); h.music.setEnabled(true); await settle();
  h.music.setMediaBusy(true); assert.equal(h.audio.paused, true); assert.equal(h.music.snapshot.status, 'paused-media');
  h.music.unlock(); assert.equal(h.audio.plays, 1);
  h.music.setMediaBusy(false); await settle(); assert.equal(h.music.snapshot.status, 'playing');
  h.music.setHidden(true); assert.equal(h.audio.paused, true); assert.equal(h.music.snapshot.status, 'hidden');
  h.music.setEnabled(false); h.music.setHidden(false); await settle();
  assert.equal(h.music.snapshot.status, 'muted'); assert.equal(h.audio.plays, 2);
  const muted = { paused: false, ended: false, muted: true, volume: 1 };
  assert.equal(hasAudibleMedia([muted]), false);
  assert.equal(hasAudibleMedia([{ ...muted, muted: false }]), true);
  assert.equal(hasAudibleMedia([{ ...muted, muted: false, volume: 0 }]), false);
  assert.equal(hasAudibleMedia([{ ...muted, muted: false, paused: true }]), false);
});

test('a pending play cannot turn music on after the user disables it', async () => {
  const h = harness(); let resolve;
  h.audio.play = () => new Promise(done => { resolve = done; });
  h.music.setEnabled(true); h.music.setEnabled(false); h.audio.paused = false; resolve(); await settle();
  assert.equal(h.music.snapshot.status, 'muted'); assert.equal(h.audio.paused, true);
  assert.equal(h.changes.filter(state => state.playing).length, 0);
});

test('errors and disposal cancel the track, fades and recovery timers', async () => {
  const h = harness(); h.music.setEnabled(true); await settle(); h.music.duck(4);
  h.events.get('error')(); assert.equal(h.music.snapshot.status, 'unavailable'); assert.equal(h.audio.paused, true);
  h.music.unlock(); await settle(); h.music.duck(4);
  const before = h.changes.length; h.music.dispose(); h.tick(5000);
  assert.equal(h.frames.size, 0); assert.equal(h.delays.size, 0); assert.equal(h.audio.loads, 1);
  assert.equal(h.audio.src, undefined); assert.equal(h.changes.length, before);
});


test('reviewed music is packaged intact and film controls fit within their frame', async () => {
  const root = new URL('../', import.meta.url);
  const read = file => readFile(new URL(file, root));
  const record = JSON.parse(await read('content-sources/gallery-music.json'));
  const approved = JSON.parse(await read('content-sources/public-assets.json'));
  assert.ok(approved.includes(record.asset));
  for (const prefix of ['public', 'dist']) {
    const file = await read(prefix + record.asset);
    assert.equal(createHash('sha256').update(file).digest('hex'), record.sha256);
    assert.equal(file.length, record.bytes);
  }
  const css = String(await read('src/components/exhibit-stage.css'));
  assert.match(css, /\.stage-film \{[^}]*min-width: 0; min-height: 0;/);
});
