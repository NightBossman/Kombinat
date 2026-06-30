// audio.ts — Dzwiek przez Web Audio API (PLAN 13). Dwie magistrale (muzyka/SFX) + master.
// SFX syntezowane „beeperowo” (zero plikow = zero licencji); muzyka prosta, generatywna, ambient.
// Kontekst startuje dopiero po gescie uzytkownika (polityka autoplay). Glosnosc z `settings()`.
import { settings } from './settings.svelte';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let musicTimer: ReturnType<typeof setTimeout> | null = null;
let droneNodes: OscillatorNode[] = [];

interface SfxDef {
  freq: number;
  dur: number;
  type: OscillatorType;
}
const DEFAULT_SFX: SfxDef = { freq: 660, dur: 0.05, type: 'square' };
const SFX: Record<string, SfxDef> = {
  click: { freq: 660, dur: 0.05, type: 'square' },
  buy: { freq: 440, dur: 0.09, type: 'square' },
  upgrade: { freq: 880, dur: 0.12, type: 'square' },
  tree: { freq: 520, dur: 0.14, type: 'triangle' },
  event: { freq: 300, dur: 0.16, type: 'sawtooth' },
  denom: { freq: 160, dur: 0.55, type: 'sawtooth' },
  achievement: { freq: 990, dur: 0.18, type: 'square' },
};

export function ensureAudio(): void {
  if (ctx) {
    void ctx.resume();
    applyVolumes();
    return;
  }
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AC();
    master = ctx.createGain();
    master.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.connect(master);
    sfxGain = ctx.createGain();
    sfxGain.connect(master);
    applyVolumes();
  } catch {
    ctx = null;
  }
}

export function applyVolumes(): void {
  if (!ctx || !master || !musicGain || !sfxGain) return;
  const cfg = settings();
  master.gain.setTargetAtTime(cfg.mute ? 0 : cfg.master, ctx.currentTime, 0.02);
  musicGain.gain.setTargetAtTime(cfg.music, ctx.currentTime, 0.05);
  sfxGain.gain.setTargetAtTime(cfg.sfx, ctx.currentTime, 0.02);
  if (!cfg.mute && cfg.music > 0) startMusic();
  else stopMusic();
}

export function playSfx(type: string): void {
  if (!ctx || !sfxGain) return;
  const cfg = settings();
  if (cfg.mute || cfg.sfx <= 0 || cfg.master <= 0) return;
  const def = SFX[type] ?? DEFAULT_SFX;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = def.type;
  osc.frequency.setValueAtTime(def.freq, t);
  osc.frequency.exponentialRampToValueAtTime(def.freq * 0.8, t + def.dur);
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(0.5, t + 0.005);
  env.gain.exponentialRampToValueAtTime(0.0001, t + def.dur);
  osc.connect(env);
  env.connect(sfxGain);
  osc.start(t);
  osc.stop(t + def.dur + 0.02);
}

// --- generatywny ambient (PRL: powolny, molowy, melancholijny; bez plikow = bez licencji) ---
// Bed: niski dron (oktawa + kwinta) z „oddychajacym" filtrem; na to rzadkie, miekkie akordy
// pentatoniki molowej i sporadyczna wyzsza nuta melodii. Cicho i bez natrectwa.
const SCALE = [0, 3, 5, 7, 10]; // pentatonika molowa
const ROOT = 220;

function lowpass(freq: number, q = 0.6): BiquadFilterNode {
  const f = ctx!.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = freq;
  f.Q.value = q;
  return f;
}

function startDrone(): void {
  if (!ctx || !musicGain || droneNodes.length) return;
  const t = ctx.currentTime;
  const lp = lowpass(560);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.06, t + 3);
  lp.connect(g);
  g.connect(musicGain);
  for (const mult of [0.5, 0.75]) {
    // oktawa nizej + kwinta
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = ROOT * mult;
    o.connect(lp);
    o.start(t);
    droneNodes.push(o);
  }
  // powolne LFO na filtr — efekt „oddechu"
  const lfo = ctx.createOscillator();
  const lfoGain = ctx.createGain();
  lfo.frequency.value = 0.05;
  lfoGain.gain.value = 140;
  lfo.connect(lfoGain);
  lfoGain.connect(lp.frequency);
  lfo.start(t);
  droneNodes.push(lfo);
}

function stopDrone(): void {
  for (const o of droneNodes) {
    try {
      o.stop();
    } catch {
      /* juz zatrzymany */
    }
  }
  droneNodes = [];
}

function playNote(semi: number, dur: number, peak: number, octave = 0): void {
  if (!ctx || !musicGain) return;
  const t = ctx.currentTime;
  const f = ROOT * Math.pow(2, (semi + octave * 12) / 12);
  const lp = lowpass(1400);
  const osc = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = 'triangle';
  osc2.type = 'triangle';
  osc.frequency.value = f;
  osc2.frequency.value = f * 1.005; // lekki chorus
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(peak, t + dur * 0.25);
  env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(lp);
  osc2.connect(lp);
  lp.connect(env);
  env.connect(musicGain);
  osc.start(t);
  osc2.start(t);
  osc.stop(t + dur + 0.05);
  osc2.stop(t + dur + 0.05);
}

function pick(): number {
  return SCALE[Math.floor(Math.random() * SCALE.length)] ?? 0;
}

function playPad(): void {
  if (!ctx) return;
  playNote(pick(), 3.2, 0.13, 0); // nuta bazowa
  if (Math.random() < 0.5) playNote(pick(), 3.0, 0.09, 0); // miekki wspolbrzmiacy akord
  if (Math.random() < 0.35) playNote(pick(), 1.8, 0.07, 1); // rzadka wyzsza melodia
}

function scheduleNextPad(): void {
  if (!musicTimer) return; // zatrzymano w miedzyczasie
  playPad();
  musicTimer = setTimeout(scheduleNextPad, 2600 + Math.random() * 2200); // 2,6–4,8 s
}

function startMusic(): void {
  if (musicTimer || !ctx) return;
  startDrone();
  musicTimer = setTimeout(scheduleNextPad, 300); // marker „gra" + pierwszy akord wkrotce
}
function stopMusic(): void {
  if (musicTimer) {
    clearTimeout(musicTimer);
    musicTimer = null;
  }
  stopDrone();
}
