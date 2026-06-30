import { describe, it, expect } from 'vitest';
import { pushCapped } from '../src/engine/log';

// Bramka Fazy 3: Dziennik z twardym limitem i rotacją pamięci (PLAN 14/16) — log nie rośnie w nieskończoność.
describe('Dziennik — rotacja pamięci', () => {
  it('trzyma najwyżej `max` wpisów, najstarsze wypadają', () => {
    let log: number[] = [];
    for (let i = 0; i < 1000; i++) log = pushCapped(log, i, 200);
    expect(log.length).toBe(200);
    expect(log[0]).toBe(800); // najstarszy zachowany to 1000-200
    expect(log[log.length - 1]).toBe(999); // najnowszy
  });

  it('poniżej limitu zachowuje wszystko w kolejności', () => {
    let log: string[] = [];
    for (const x of ['a', 'b', 'c']) log = pushCapped(log, x, 200);
    expect(log).toEqual(['a', 'b', 'c']);
  });
});
