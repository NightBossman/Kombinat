import { describe, it, expect } from 'vitest';
import { Decimal } from '@kombinat/shared';
import { loadContent } from '../src/engine/loader';
import { Engine } from '../src/engine/engine';
import { basePack } from '../src/content/base';

function eng(): Engine {
  const { registry, ok, issues } = loadContent([basePack]);
  expect(ok, JSON.stringify(issues.filter((i) => i.level === 'error'))).toBe(true);
  return new Engine(registry);
}

describe('Faza 1 — ulepszenia i efekty', () => {
  it('addFlat global zwieksza moc klikania', () => {
    const e = eng();
    e.state.resources['cykle'] = new Decimal(1000);
    expect(e.clickPower().toNumber()).toBe(1);
    expect(e.buyUpgrade('rdzen.u_wprawa')).toBe(true);
    expect(e.clickPower().toNumber()).toBe(5); // (1 + 4) * 1
    e.click();
    expect(e.state.resources['cykle']!.toNumber()).toBeCloseTo(1000 - 100 + 5, 6);
  });

  it('multiplyProduction na generator podwaja jego tempo', () => {
    const e = eng();
    e.state.generators['liczydlo'] = { owned: new Decimal(5) };
    e.state.resources['cykle'] = new Decimal(1000);
    expect(e.currentRates()['cykle']!.toNumber()).toBeCloseTo(1.0, 6); // 5 * 0.2
    expect(e.buyUpgrade('rdzen.u_talon_czesci')).toBe(true);
    expect(e.currentRates()['cykle']!.toNumber()).toBeCloseTo(2.0, 6); // podwojone
  });

  it('divideCost global obniza koszty', () => {
    const e = eng();
    e.state.generators['k202'] = { owned: new Decimal(1) };
    e.state.resources['cykle'] = new Decimal(5_000_000);
    expect(e.cost('liczydlo').toNumber()).toBeCloseTo(15, 6);
    expect(e.buyUpgrade('rdzen.u_przekupienie_magazyniera')).toBe(true);
    expect(e.cost('liczydlo').toNumber()).toBeCloseTo(15 / 1.5, 4);
  });

  it('nie kupi ulepszenia bez spelnionego warunku', () => {
    const e = eng();
    e.state.resources['cykle'] = new Decimal(1e9);
    expect(e.buyUpgrade('rdzen.u_talon_czesci')).toBe(false); // wymaga liczydlo >= 5
  });

  it('ulepszenie jednorazowe znika z dostepnych po kupnie', () => {
    const e = eng();
    e.state.resources['cykle'] = new Decimal(1000);
    expect(e.isUpgradeAvailable('rdzen.u_wprawa')).toBe(true);
    e.buyUpgrade('rdzen.u_wprawa');
    expect(e.isUpgradeAvailable('rdzen.u_wprawa')).toBe(false);
  });
});

describe('Faza 1 — kamienie milowe', () => {
  it('kamien milowy wyzwala sie i daje trwaly efekt', () => {
    const e = eng();
    e.state.generators['liczydlo'] = { owned: new Decimal(100) };
    expect(e.state.milestones['rdzen.m_pierwsza_setka']).toBeUndefined();
    const rateBefore = e.currentRates()['cykle']!.toNumber(); // 100 * 0.2 = 20
    e.tick(0.3); // kamienie milowe sprawdzane z throttlingiem ~4 Hz (>=0.25 s) — wydajność przy setkach
    expect(e.state.milestones['rdzen.m_pierwsza_setka']).toBe(true);
    // ≥ ×2: „Pierwsza setka" daje ×2, a przy 100 liczydłach wpadają też generowane kamienie parku (U5),
    // więc tempo jest co najmniej podwojone (dawniej dokładnie ×2 — sprzed masowych kamieni milowych).
    expect(e.currentRates()['cykle']!.toNumber()).toBeGreaterThanOrEqual(rateBefore * 2);
  });
});

describe('Faza 1 — offline wielozasobowe', () => {
  it('catchUp dolicza wszystkie zasoby (cykle i dewizy)', () => {
    const e = eng();
    e.state.generators['liczydlo'] = { owned: new Decimal(10) }; // cykle
    e.state.generators['spectrum'] = { owned: new Decimal(10) }; // dewizy 0.08 * 10
    const r = e.catchUp(100);
    expect(r.gains.some((g) => g.id === 'cykle')).toBe(true);
    expect(r.gains.some((g) => g.id === 'dewizy')).toBe(true);
    expect(e.state.resources['dewizy']!.toNumber()).toBeCloseTo(80, 4); // 0.8 * 100
  });
});

describe('Faza 1 — cele „Co dalej?”', () => {
  it('snapshot zawiera cel „Teraz" i dostepne ulepszenia', () => {
    const e = eng();
    e.state.resources['cykle'] = new Decimal(1000);
    const snap = e.snapshot();
    const teraz = snap.goals.find((g) => g.horizon === 'Teraz');
    expect(teraz).toBeTruthy();
    expect(snap.upgrades.some((u) => u.id === 'rdzen.u_wprawa')).toBe(true);
  });

  it('cel z zasobem klikalnym niesie surowe pola do plynnego paska', () => {
    const e = eng();
    const snap = e.snapshot();
    const teraz = snap.goals.find((g) => g.horizon === 'Teraz');
    expect(teraz?.resourceId).toBe('cykle');
    expect(typeof teraz?.needRaw).toBe('number');
  });
});

describe('Faza 1 — opis efektow procentowo', () => {
  it('mnoznik produkcji opisany jako +procent', () => {
    const e = eng();
    e.state.generators['liczydlo'] = { owned: new Decimal(5) }; // odblokowuje u_talon_czesci
    e.state.resources['cykle'] = new Decimal(1000);
    const snap = e.snapshot();
    const talon = snap.upgrades.find((u) => u.id === 'rdzen.u_talon_czesci');
    expect(talon?.effectText).toContain('+100%'); // x2 => +100%
  });
});
