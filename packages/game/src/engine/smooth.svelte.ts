// smooth.svelte.ts — Plynne WYSWIETLANIE liczników KAZDEGO zasobu (PLAN 12). Warstwa renderu:
// worker liczy skokowo co ~100 ms, a tu interpolujemy na 60 fps (rAF). Ekstrapolacja wg tempa +
// lagodne dochodzenie do wartosci z migawki => liczba plynie, nie skacze. Per-zasob (cykle, dewizy,
// i kazdy przyszly). Gdy karta ukryta (rAF wstrzymany) — doklejamy do wartosci autorytatywnej.
import { snapshot } from './bridge';
import type { Snapshot } from './snapshot';

let displayed = $state<Record<string, number>>({});
let finiteMap = $state<Record<string, boolean>>({});

const target: Record<string, number> = {};
const rate: Record<string, number> = {};
const targetTime: Record<string, number> = {};
const seeded: Record<string, boolean> = {};

// Ogolny PLYNNY PASEK (PLAN 12, reguła właściciela): KAŻDY pasek, ktory cos odlicza/wypelnia, ma plynac
// jak licznik liczb — nie skakac. UI podaje ciagla wartosc docelowa 0..1 (`setSmoothBar`), a ta sama
// petla rAF interpoluje ja na 60 fps. Duzy skok (zmiana fazy/cyklu) snapujemy bez animacji.
const bar = $state<Record<string, number>>({});
const barTarget: Record<string, number> = {};
const barSeeded: Record<string, boolean> = {};

let last = 0;
let started = false;

function onSnap(s: Snapshot | null): void {
  if (!s) return;
  for (const r of s.resources) {
    if (Number.isFinite(r.amountRaw)) {
      finiteMap[r.id] = true;
      target[r.id] = r.amountRaw;
      rate[r.id] = Number.isFinite(r.rateRaw) ? r.rateRaw : 0;
      targetTime[r.id] = performance.now();
      if (!seeded[r.id] || (typeof document !== 'undefined' && document.hidden)) {
        displayed[r.id] = r.amountRaw;
        seeded[r.id] = true;
      }
    } else {
      finiteMap[r.id] = false;
    }
  }
}

function frame(now: number): void {
  let dt = (now - last) / 1000;
  last = now;
  if (!(dt > 0)) dt = 0;
  else if (dt > 0.05) dt = 0.05;
  const k = 1 - Math.exp(-16 * dt);

  for (const id in target) {
    if (!finiteMap[id]) continue;
    const tg = target[id] ?? 0;
    const rt = rate[id] ?? 0;
    const tt = targetTime[id] ?? now;
    const expected = tg + rt * Math.max(0, (now - tt) / 1000);
    let d = displayed[id] ?? expected;
    d += (expected - d) * k;
    if (Math.abs(expected - d) < 0.5) d = expected; // dobij do celu (m.in. 0 po resecie)
    if (d < 0) d = 0;
    displayed[id] = d;
  }
  // Plynne paski (0..1) — ta sama interpolacja, ale duzy skok (zmiana cyklu) snapujemy natychmiast.
  for (const id in barTarget) {
    const tg = barTarget[id] ?? 0;
    let d = bar[id] ?? tg;
    if (Math.abs(tg - d) > 0.5) d = tg; // przeskok fazy (np. start/koniec promocji) — bez animacji
    else {
      d += (tg - d) * k;
      if (Math.abs(tg - d) < 0.002) d = tg;
    }
    bar[id] = d;
  }
  requestAnimationFrame(frame);
}

export function startSmooth(): void {
  if (started) return;
  started = true;
  last = performance.now();
  snapshot.subscribe(onSnap);
  requestAnimationFrame(frame);
}

export function smoothValueOf(id: string): number {
  return displayed[id] ?? 0;
}
/** Wartosc do WYSWIETLENIA — cala (bez ulamkowych jednostek). */
export function smoothFloorOf(id: string): number {
  return Math.floor(displayed[id] ?? 0);
}
export function smoothFiniteOf(id: string): boolean {
  return finiteMap[id] ?? false;
}

/** Ustaw ciagla wartosc docelowa plynnego paska (0..1). Wywoluj z migawki/efektu — petla rAF dochodzi
 *  do niej na 60 fps. Reguła: KAŻDY odliczajacy/wypelniajacy pasek ma byc plynny (jak liczniki liczb). */
export function setSmoothBar(key: string, value: number): void {
  barTarget[key] = value;
  if (!barSeeded[key] || (typeof document !== 'undefined' && document.hidden)) {
    bar[key] = value; // pierwsze podanie / ukryta karta — bez animacji, od razu na miejsce
    barSeeded[key] = true;
  }
}
/** Aktualna (zinterpolowana) wartosc plynnego paska 0..1. */
export function smoothBarOf(key: string): number {
  return bar[key] ?? barTarget[key] ?? 0;
}
