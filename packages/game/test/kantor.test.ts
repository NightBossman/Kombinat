// kantor.test.ts — Kantor (giełda) odblokowuje się DOPIERO po kupnie ZX Spectrum (albo jawną flagą),
// a NIE przez all-time `producedTotal.dewizy` (który przeżywał Denominację → Kantor wyskakiwał od startu).
import { describe, it, expect } from 'vitest';
import { Decimal } from '@kombinat/shared';
import { loadContent } from '../src/engine/loader';
import { Engine } from '../src/engine/engine';
import { basePack } from '../src/content/base';

function eng(): Engine {
  const { registry, ok } = loadContent([basePack]);
  expect(ok).toBe(true);
  const e = new Engine(registry);
  e.recomputeModifiers();
  return e;
}

describe('Kantor — bramka odblokowania', () => {
  it('NIE odblokowuje się przez all-time produkcję dewiz (przeżywa Denominację)', () => {
    const e = eng();
    e.state.stats.producedTotal['dewizy'] = new Decimal('1e9'); // dorobek z poprzednich pięciolatek
    e.recomputeModifiers();
    expect(e.snapshot().gielda.unlocked).toBe(false);
  });

  it('odblokowuje się po kupnie Spectruma (albo flagą)', () => {
    const e = eng();
    e.state.generators['spectrum'] = { owned: new Decimal(1) };
    e.recomputeModifiers();
    expect(e.snapshot().gielda.unlocked).toBe(true);

    const e2 = eng();
    e2.state.flags['mechanika.gielda'] = 1;
    e2.recomputeModifiers();
    expect(e2.snapshot().gielda.unlocked).toBe(true);
  });
});
