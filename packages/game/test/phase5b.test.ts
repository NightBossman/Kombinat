// phase5b.test.ts — Faza 5B: hooki wpinania DLC w działaniu (na żywym silniku).
//  - synergie aktywują się TYLKO gdy obecna jest wymagana paczka (łagodna degradacja, DLC 8.3),
//  - efekty warunkowe (`condition`) wchodzą tylko, gdy warunek prawdziwy (DLC 8.2).
import { describe, it, expect } from 'vitest';
import { Decimal, type Pack } from '@kombinat/shared';
import { loadContent } from '../src/engine/loader';
import { Engine } from '../src/engine/engine';
import { basePack } from '../src/content/base';

// Minimalna paczka-świadek: sama obecność jej id 'beta' aktywuje synergię paczki-dawcy.
const beta: Pack = { manifest: { id: 'beta', name: 'Beta', version: '1.0.0', schemaVersion: 1 } };

// Paczka-dawca: bonus ×2 do CAŁEJ produkcji, ale tylko gdy obecna jest 'beta'.
const alfa: Pack = {
  manifest: { id: 'alfa', name: 'Alfa', version: '1.0.0', schemaVersion: 1 },
  synergies: [{ requiresPack: 'beta', effects: [{ type: 'multiplyProduction', target: 'global', value: '2' }] }],
};

// Paczka-dawca z efektem WARUNKOWYM: ×2 tylko gdy masz ≥5 liczydeł (i obecna 'beta').
const cond: Pack = {
  manifest: { id: 'cond', name: 'Cond', version: '1.0.0', schemaVersion: 1 },
  synergies: [
    {
      requiresPack: 'beta',
      effects: [{ type: 'multiplyProduction', target: 'global', value: '2', condition: 'posiadane.liczydlo >= 5' }],
    },
  ],
};

function cykleRate(owned: number, extra: Pack[]): number {
  const { registry, ok, issues } = loadContent([basePack, ...extra]);
  expect(ok, JSON.stringify(issues)).toBe(true);
  const e = new Engine(registry);
  e.state.generators['liczydlo'] = { owned: new Decimal(owned) };
  e.recomputeModifiers();
  return e.currentRates()['cykle']!.toNumber();
}

describe('5B — synergie (łagodna degradacja)', () => {
  it('bez wymaganej paczki synergia NIE działa; z nią daje bonus', () => {
    const baseline = cykleRate(10, []);
    const synergyOff = cykleRate(10, [alfa]); // brak 'beta' → bonus nieaktywny
    const synergyOn = cykleRate(10, [alfa, beta]); // 'beta' obecna → ×2
    expect(synergyOff).toBeCloseTo(baseline, 6); // dawca działa, ale bez bonusu (degradacja)
    expect(synergyOn).toBeCloseTo(baseline * 2, 6);
  });
});

describe('5B — efekty warunkowe (modify-if)', () => {
  it('efekt z condition wchodzi tylko, gdy warunek prawdziwy', () => {
    // condition: posiadane.liczydlo >= 5
    const off = cykleRate(2, [cond, beta]); // 2 < 5 → bez bonusu
    const offBaseline = cykleRate(2, []);
    expect(off).toBeCloseTo(offBaseline, 6);

    const on = cykleRate(10, [cond, beta]); // 10 >= 5 → ×2
    const onBaseline = cykleRate(10, []);
    expect(on).toBeCloseTo(onBaseline * 2, 6);
  });
});
