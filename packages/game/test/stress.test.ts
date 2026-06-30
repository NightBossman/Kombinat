import { describe, it, expect } from 'vitest';
import { Decimal } from '@kombinat/shared';
import { loadContent } from '../src/engine/loader';
import { Engine } from '../src/engine/engine';
import { basePack } from '../src/content/base';

// Bramka Fazy 3 (PLAN rozdz. 16/17): stress test late game — czy lawina elementów + zdarzeń +
// liczenia mieści się w budżecie klatki. Budżety: tick co 50 ms (20 Hz), migawka co ~100 ms (10 Hz).
// Asercje z dużym zapasem (kilkukrotnym), by udowodnić, że jest LUŹNO, a nie na styk.
function lateGameEngine(): Engine {
  const { registry, ok, issues } = loadContent([basePack]);
  expect(ok, JSON.stringify(issues.filter((i) => i.level === 'error'))).toBe(true);
  const e = new Engine(registry);
  for (const id of registry.generators.keys()) e.state.generators[id] = { owned: new Decimal(5000) };
  e.state.resources['cykle'] = new Decimal('1e15');
  e.state.resources['dewizy'] = new Decimal('1e9');
  e.state.resources['odznaczenia'] = new Decimal(500);
  e.state.stats.producedTotal['cykle'] = new Decimal('1e16');
  e.state.stats.runProduced['cykle'] = new Decimal('1e16');
  for (const id of registry.upgrades.keys()) e.state.upgrades[id] = true; // wszystkie ulepszenia
  for (const [id, n] of registry.treeNodes) e.state.treeNodes[id] = n.levels ?? 1; // całe drzewo na maks.
  e.state.flags['osiagniecia_mnoznik'] = 1; // najcięższa ścieżka: mnożniki z osiągnięć aktywne
  e.checkAchievements(); // zdobądź dużo osiągnięć
  e.recomputeModifiers();
  return e;
}

describe('Bramka Fazy 3 — stress test wydajności late game', () => {
  it('migawka late-game mieści się w budżecie ~10 Hz (z ogromnym zapasem)', () => {
    const e = lateGameEngine();
    e.snapshot(); // rozgrzewka (cache parsowania formuł celów)
    const N = 300;
    const t0 = performance.now();
    for (let i = 0; i < N; i++) e.snapshot();
    const per = (performance.now() - t0) / N;
    expect(per).toBeLessThan(30); // budżet migawki ~100 ms; trzymamy się grubo poniżej
  });

  it('tick late-game mieści się w budżecie kroku 50 ms', () => {
    const e = lateGameEngine();
    e.tick(0.05);
    const N = 500;
    const t0 = performance.now();
    for (let i = 0; i < N; i++) e.tick(0.05);
    const per = (performance.now() - t0) / N;
    expect(per).toBeLessThan(15);
  });

  it('sprawdzanie 300+ osiągnięć jest tanie nawet często wołane', () => {
    const e = lateGameEngine();
    const N = 300;
    const t0 = performance.now();
    for (let i = 0; i < N; i++) e.checkAchievements();
    const per = (performance.now() - t0) / N;
    expect(per).toBeLessThan(15);
  });

  it('pełna minuta gry (1200 ticków + 600 migawek) liczy się dużo szybciej niż real-time', () => {
    const e = lateGameEngine();
    const t0 = performance.now();
    for (let i = 0; i < 1200; i++) {
      e.tick(0.05);
      if (i % 2 === 0) e.snapshot();
    }
    const total = performance.now() - t0;
    // 60 s symulacji musi policzyć się w ułamku tego czasu (inaczej late game by „umierał").
    expect(total).toBeLessThan(3000);
  });
});
