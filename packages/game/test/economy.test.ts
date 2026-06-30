import { describe, it, expect } from 'vitest';
import { Decimal } from '@kombinat/shared';
import { loadContent } from '../src/engine/loader';
import { Engine } from '../src/engine/engine';
import { basePack } from '../src/content/base';

function makeEngine(): Engine {
  const { registry, ok, issues } = loadContent([basePack]);
  expect(ok, JSON.stringify(issues)).toBe(true);
  return new Engine(registry);
}

describe('ladowanie tresci bazowej', () => {
  it('paczka bazowa przechodzi walidacje i scalanie czysto', () => {
    const { ok, issues } = loadContent([basePack]);
    expect(issues.filter((i) => i.level === 'error')).toHaveLength(0);
    expect(ok).toBe(true);
  });
});

describe('klikanie i kupowanie', () => {
  it('klikanie produkuje zasob klikalny', () => {
    const e = makeEngine();
    e.click();
    e.click();
    expect(e.state.resources['cykle']!.toNumber()).toBe(2);
    expect(e.state.stats.totalClicks).toBe(2);
  });

  it('kupno odejmuje koszt i zwieksza posiadanie', () => {
    const e = makeEngine();
    e.state.resources['cykle'] = new Decimal(1000);
    const bought = e.buy('liczydlo');
    expect(bought).toBe(1);
    expect(e.state.generators['liczydlo']!.owned.toNumber()).toBe(1);
    expect(e.state.resources['cykle']!.toNumber()).toBe(985); // 1000 - 15
  });

  it('nie kupi, gdy brak srodkow', () => {
    const e = makeEngine();
    e.state.resources['cykle'] = new Decimal(5);
    expect(e.buy('liczydlo')).toBe(0);
    expect(e.state.generators['liczydlo']!.owned.toNumber()).toBe(0);
  });

  it('koszt rosnie wykladniczo z posiadaniem', () => {
    const e = makeEngine();
    expect(e.cost('liczydlo').toNumber()).toBeCloseTo(15, 6);
    e.state.generators['liczydlo'] = { owned: new Decimal(1) };
    expect(e.cost('liczydlo').toNumber()).toBeCloseTo(17.25, 4); // 15 * 1.15
  });

  it('koszt zbiorczy x10 = suma 10 kolejnych cen (geometryczna)', () => {
    const e = makeEngine();
    // 15 × (1.15^10 − 1)/(1.15 − 1) ≈ 304,5
    const c10 = e.costForCount('liczydlo', 10).toNumber();
    let sum = 0;
    for (let i = 0; i < 10; i++) sum += 15 * Math.pow(1.15, i);
    expect(c10).toBeCloseTo(Math.ceil(sum), -1); // ~305 (zaokrąglone)
    expect(c10).toBeGreaterThan(e.cost('liczydlo').toNumber() * 10); // drożej niż 10× pierwsza cena
  });

  it('Max kupuje dokładnie tyle, na ile stać', () => {
    const e = makeEngine();
    e.state.resources['cykle'] = new Decimal(1000); // stać na kilka liczydeł
    const n = e.maxBuyCount('liczydlo');
    expect(n).toBeGreaterThanOrEqual(1);
    const bought = e.buy('liczydlo', n);
    expect(bought).toBe(n);
    // po wykupieniu Max nie stać już na kolejne
    expect(e.state.resources['cykle']!.toNumber()).toBeLessThan(e.cost('liczydlo').toNumber());
  });

  it('resolveBuyCount zależy od wybranej opcji (x10/Max)', () => {
    const e = makeEngine();
    e.state.resources['cykle'] = new Decimal(1000);
    e.buyAmount = 10;
    expect(e.resolveBuyCount('liczydlo')).toBe(10);
    e.buyAmount = 'max';
    expect(e.resolveBuyCount('liczydlo')).toBe(e.maxBuyCount('liczydlo'));
  });
});

describe('odblokowania', () => {
  it('arytmometr odblokowuje sie po pierwszym liczydle', () => {
    const e = makeEngine();
    expect(e.isUnlocked('arytmometr')).toBe(false);
    e.state.generators['liczydlo'] = { owned: new Decimal(1) };
    expect(e.isUnlocked('arytmometr')).toBe(true);
  });

  it('liczydlo jest dostepne od poczatku (brak unlock => true)', () => {
    const e = makeEngine();
    expect(e.isUnlocked('liczydlo')).toBe(true);
  });
});

describe('produkcja i postep offline', () => {
  it('tick dolicza produkcje proporcjonalnie do czasu', () => {
    const e = makeEngine();
    e.state.generators['liczydlo'] = { owned: new Decimal(1) }; // 0.2/s
    e.tick(10);
    expect(e.state.resources['cykle']!.toNumber()).toBeCloseTo(2, 6); // 0.2 * 10
  });

  it('catchUp liczy postep w postaci zamknietej (O(1)) i raportuje zarobek', () => {
    const e = makeEngine();
    e.state.generators['liczydlo'] = { owned: new Decimal(1) };
    const result = e.catchUp(50);
    expect(result.seconds).toBe(50);
    expect(e.state.resources['cykle']!.toNumber()).toBeCloseTo(10, 6); // 0.2 * 50
    expect(result.gains.some((g) => g.id === 'cykle')).toBe(true);
  });

  it('catchUp ma gorny limit (Faza 1: 14 dni)', () => {
    const e = makeEngine();
    e.state.generators['liczydlo'] = { owned: new Decimal(1) };
    const result = e.catchUp(30 * 24 * 3600); // 30 dni
    expect(result.seconds).toBe(14 * 24 * 3600); // przyciete do 14 dni
  });
});
