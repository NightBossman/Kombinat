import { describe, it, expect } from 'vitest';
import { Decimal } from '@kombinat/shared';
import { loadContent } from '../src/engine/loader';
import { Engine } from '../src/engine/engine';
import { basePack } from '../src/content/base';

// Bramka wydajnosciowa Fazy 0 (PLAN 16, 17): pojedynczy tick miesci sie w budzecie ms.
// Faza 0 ma kilka generatorow — tick jest banalny; sprawdzamy, ze nie ma patologii.
function loadedEngine(owned: number): Engine {
  const { registry } = loadContent([basePack]);
  const e = new Engine(registry);
  for (const id of registry.generators.keys()) {
    e.state.generators[id] = { owned: new Decimal(owned) };
  }
  e.state.resources['cykle'] = new Decimal('1e30');
  return e;
}

describe('budzet ticku', () => {
  it('tick przy pelnej drabinie jest znaczaco ponizej 1 ms', () => {
    const e = loadedEngine(1000);
    for (let i = 0; i < 100; i++) e.tick(0.05); // rozgrzewka

    const N = 2000;
    const t0 = performance.now();
    for (let i = 0; i < N; i++) e.tick(0.05);
    const perTick = (performance.now() - t0) / N;

    expect(perTick).toBeLessThan(1);
  });

  it('budowanie migawki jest tanie', () => {
    const e = loadedEngine(500);
    for (let i = 0; i < 50; i++) e.snapshot(); // rozgrzewka

    const N = 1000;
    const t0 = performance.now();
    for (let i = 0; i < N; i++) e.snapshot();
    const perSnap = (performance.now() - t0) / N;

    expect(perSnap).toBeLessThan(2);
  });
});
