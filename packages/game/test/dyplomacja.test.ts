// dyplomacja.test.ts — poprawki dyplomacji (2026-07-01): unikalne premie w obrębie bloku, Kuba (RWPG),
// nowe premie (cykle/click/all), opis premii przy relacji zerowej, postęp z miejscem po przecinku.
import { describe, it, expect } from 'vitest';
import { Decimal } from '@kombinat/shared';
import { loadContent } from '../src/engine/loader';
import { Engine } from '../src/engine/engine';
import { basePack } from '../src/content/base';

function eng(): Engine {
  const { registry, ok, issues } = loadContent([basePack]);
  expect(ok, JSON.stringify(issues.filter((i) => i.level === 'error'))).toBe(true);
  const e = new Engine(registry);
  e.state.flags['mechanika.dyplomacja'] = 1; // odblokuj bez Odry
  e.state.generators['liczydlo'] = { owned: new Decimal(100) };
  e.state.generators['arytmometr'] = { owned: new Decimal(10) };
  e.state.resources['dewizy'] = new Decimal('1e6'); // na zacieśnianie
  e.recomputeModifiers();
  return e;
}

describe('Dyplomacja — unikalne premie per blok + Kuba', () => {
  it('w każdym bloku premie (scope) są unikalne; mogą się powtarzać między blokami', () => {
    const byBloc = new Map<string, string[]>();
    for (const d of basePack.diplomacy!) {
      const arr = byBloc.get(d.bloc) ?? [];
      arr.push(d.scope);
      byBloc.set(d.bloc, arr);
    }
    for (const [bloc, scopes] of byBloc) {
      expect(new Set(scopes).size, `blok ${bloc}: ${scopes.join(',')}`).toBe(scopes.length);
    }
  });

  it('RWPG ma 6 krajów, w tym Kubę (premia „all")', () => {
    expect(basePack.diplomacy!.filter((d) => d.bloc === 'wschod').length).toBe(6);
    const kuba = basePack.diplomacy!.find((d) => d.id === 'kuba');
    expect(kuba?.bloc).toBe('wschod');
    expect(kuba?.scope).toBe('all');
  });
});

describe('Dyplomacja — nowe premie działają', () => {
  it('cykle (NRD) podnoszą produkcję cykli', () => {
    const e = eng();
    const before = e.currentRates()['cykle']!.toNumber();
    e.state.flags['relacja.nrd'] = 1000;
    e.recomputeModifiers();
    expect(e.currentRates()['cykle']!.toNumber()).toBeGreaterThan(before);
  });

  it('click (Bułgaria) wzmacnia klikanie', () => {
    const e = eng();
    const before = e.clickPower().toNumber();
    e.state.flags['relacja.bulgaria'] = 1000;
    e.recomputeModifiers();
    expect(e.clickPower().toNumber()).toBeGreaterThan(before);
  });

  it('all (Kuba) podnosi produkcję i OBNIŻA koszty', () => {
    const e = eng();
    const prodBefore = e.currentRates()['cykle']!.toNumber();
    const costBefore = e.cost('arytmometr').toNumber();
    e.state.flags['relacja.kuba'] = 1000;
    e.recomputeModifiers();
    expect(e.currentRates()['cykle']!.toNumber()).toBeGreaterThan(prodBefore);
    expect(e.cost('arytmometr').toNumber()).toBeLessThan(costBefore);
  });
});

describe('Dyplomacja — czytelność (relacja zerowa + bonus po przecinku)', () => {
  it('przy relacji zerowej widać KIERUNEK premii (nie „Brak korzyści"), z uwagą o relacji zerowej', () => {
    const rels = eng().snapshot().dyplomacja.relations;
    expect(rels.length).toBeGreaterThan(0);
    for (const r of rels) {
      expect(r.effectText, r.id).not.toContain('Brak korzyści');
      expect(r.effectText, r.id).toContain('relacja zerowa');
    }
  });

  it('bonus z relacji pokazuje DOKŁADNIE jedno miejsce po przecinku (np. „+7,3%")', () => {
    const e = eng();
    e.state.flags['relacja.nrd'] = 1000; // wysoka relacja → wyraźny bonus, wciąż 1-dziesiętny
    e.recomputeModifiers();
    const nrd = e.snapshot().dyplomacja.relations.find((r) => r.id === 'nrd')!;
    expect(nrd.effectText).toMatch(/,\d%/); // przecinek + jedna cyfra po nim
    expect(nrd.effectText).not.toMatch(/,\d\d%/); // ale nie dwie
  });
});
