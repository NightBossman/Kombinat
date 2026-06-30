// offline.test.ts — raport powrotu (catchUp). Regres: zarobek liczony z TEMPA × czas, więc waluta
// pojawia się w raporcie NAWET gdy masz jej o rzędy wielkości więcej niż przybyło (różnica „przed/po"
// gubiłaby się w precyzji liczby i raport błędnie ją pomijał).
import { describe, it, expect } from 'vitest';
import { Decimal } from '@kombinat/shared';
import { loadContent } from '../src/engine/loader';
import { Engine } from '../src/engine/engine';
import { basePack } from '../src/content/base';

describe('powrót offline — zarobek z tempa', () => {
  it('pokazuje walutę nawet przy gigantycznym zapasie (brak utraty precyzji)', () => {
    const { registry } = loadContent([basePack]);
    const e = new Engine(registry);
    e.state.generators['spectrum'] = { owned: new Decimal(50) }; // produkuje dewizy
    e.state.resources['dewizy'] = new Decimal('1e40'); // o rzędy wielkości więcej niż przybędzie
    e.recomputeModifiers();
    const r = e.catchUp(3600);
    expect(r.gains.some((g) => g.id === 'dewizy')).toBe(true);
  });

  it('nie raportuje waluty bez produkcji', () => {
    const { registry } = loadContent([basePack]);
    const e = new Engine(registry);
    e.recomputeModifiers();
    const r = e.catchUp(3600);
    // bez generatorów nic nie przybywa
    expect(r.gains.length).toBe(0);
  });
});
