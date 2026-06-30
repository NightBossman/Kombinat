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

describe('Faza 4C — dyplomacja bloków', () => {
  it('mechanika odblokowana przy realnym sprzęcie (Odra 1305)', () => {
    const e = eng();
    expect(e.dyplomacjaUnlocked()).toBe(false);
    e.state.generators['odra1305'] = { owned: new Decimal(1) };
    expect(e.dyplomacjaUnlocked()).toBe(true);
  });

  it('zacieśnienie relacji pobiera dewizy i podnosi relację o +5 (krok bazowy)', () => {
    const e = eng();
    e.state.generators['odra1305'] = { owned: new Decimal(1) };
    e.state.resources['dewizy'] = new Decimal('1e6');
    expect(e.relation('zsrr')).toBe(0);
    expect(e.improveRelation('zsrr')).toBe(true);
    expect(e.relation('zsrr')).toBe(5); // ręczny krok = +5
    expect(e.state.resources['dewizy']!.toNumber()).toBeLessThan(1e6);
  });

  it('ulepszenie z dziedzictwa „Attaché handlowy" zwiększa krok zacieśniania (do +15)', () => {
    const e = eng();
    e.state.generators['odra1305'] = { owned: new Decimal(1) };
    e.state.resources['dewizy'] = new Decimal('1e9');
    e.improveRelation('zsrr');
    expect(e.relation('zsrr')).toBe(5); // bez węzła: +5
    e.state.treeNodes['rdzen.t_attache'] = 5; // maks (5 × +2 = +10) → krok 15
    e.state.flags['relacja.zsrr'] = 0;
    e.improveRelation('zsrr');
    expect(e.relation('zsrr')).toBe(15);
  });

  it('relacja z ZSRR obniża koszty (tania radziecka energia)', () => {
    const e = eng();
    e.state.generators['odra1305'] = { owned: new Decimal(1) };
    e.state.generators['liczydlo'] = { owned: new Decimal(10) };
    e.state.resources['dewizy'] = new Decimal('1e12');
    const before = e.cost('liczydlo').toNumber();
    for (let i = 0; i < 60; i++) e.improveRelation('zsrr'); // krok +5 → relacja ~300
    expect(e.relation('zsrr')).toBeGreaterThanOrEqual(100);
    expect(e.cost('liczydlo').toNumber()).toBeLessThan(before);
  });

  it('USA (obejście CoCom) podbija dewizy — ale jest gated mazovią', () => {
    const e = eng();
    e.state.generators['odra1305'] = { owned: new Decimal(1) };
    e.state.generators['spectrum'] = { owned: new Decimal(5) }; // produkuje dewizy
    e.state.resources['dewizy'] = new Decimal('1e7');
    expect(e.improveRelation('usa')).toBe(false); // bez mazovii niedostępna
    e.state.generators['mazovia'] = { owned: new Decimal(1) };
    const before = e.currentRates()['dewizy']!.toNumber();
    expect(e.improveRelation('usa')).toBe(true);
    expect(e.currentRates()['dewizy']!.toNumber()).toBeGreaterThan(before);
  });

  it('relacja ma sufit 1000 — na maksie nie da się zacieśnić', () => {
    const e = eng();
    e.state.generators['odra1305'] = { owned: new Decimal(1) };
    e.state.resources['dewizy'] = new Decimal('1e12');
    e.state.flags['relacja.zsrr'] = 1000; // już na maksie
    expect(e.improveRelation('zsrr')).toBe(false);
    e.state.flags['relacja.zsrr'] = 996;
    expect(e.improveRelation('zsrr')).toBe(true);
    expect(e.relation('zsrr')).toBe(1000); // krok +5 (996→1000, dobity do sufitu)
  });

  it('są zdarzenia dyplomatyczne ruszające relacje (modifyRelation)', () => {
    const { registry } = loadContent([basePack]);
    const szczyt = registry.events.get('rdzen.ev_szczyt_rwpg');
    expect(szczyt).toBeTruthy();
    const effs = szczyt!.effects ?? [];
    expect(effs.some((x) => x.type === 'modifyRelation' && x.country === 'zsrr')).toBe(true);
    expect(registry.events.has('rdzen.ev_delegacja')).toBe(true);
    expect(registry.events.has('rdzen.ev_sankcje_1981')).toBe(true);
  });

  it('migawka niesie panel dyplomacji (kraje wg bloku)', () => {
    const e = eng();
    expect(e.snapshot().dyplomacja.unlocked).toBe(false);
    e.state.generators['odra1305'] = { owned: new Decimal(1) };
    e.state.generators['spectrum'] = { owned: new Decimal(1) };
    e.state.generators['mazovia'] = { owned: new Decimal(1) };
    const dyp = e.snapshot().dyplomacja;
    expect(dyp.unlocked).toBe(true);
    expect(dyp.relations.length).toBeGreaterThanOrEqual(7); // +RFN, +Czechosłowacja
    expect(dyp.relations.some((r) => r.id === 'usa' && r.bloc === 'zachod')).toBe(true);
    expect(dyp.relations.some((r) => r.id === 'rfn' && r.bloc === 'zachod')).toBe(true);
    expect(dyp.relations.some((r) => r.id === 'czechoslowacja' && r.bloc === 'wschod')).toBe(true);
    // Japonia przeniesiona do „Zachodu" (nie RWPG, kategoria „most" usunięta)
    expect(dyp.relations.find((r) => r.id === 'japonia')?.bloc).toBe('zachod');
    expect(dyp.relations.some((r) => r.bloc === 'most')).toBe(false);
    // nagłówek USA bez „/ Zachód" (to nazwa kategorii)
    expect(dyp.relations.find((r) => r.id === 'usa')?.name).toBe('USA');
  });

  it('zacieśnianie relacji NIE tanieje po zakupie — koszt wg produkcji dewiz, nie portfela', () => {
    const e = eng();
    e.state.generators['odra1305'] = { owned: new Decimal(1) }; // odblokuj dyplomację
    e.state.generators['spectrum'] = { owned: new Decimal(100) }; // produkcja dewiz → tempo.dewizy > 0
    e.tick(1); // ustaw lastRates (tempo.dewizy zasila koszt)
    e.state.resources['dewizy'] = new Decimal('1e12'); // duży portfel na kilka kroków
    const stepCost = (): number => {
      const before = e.state.resources['dewizy']!.toNumber();
      expect(e.improveRelation('zsrr')).toBe(true);
      return before - e.state.resources['dewizy']!.toNumber();
    };
    const c1 = stepCost();
    const c2 = stepCost();
    const c3 = stepCost();
    // Każdy kolejny krok co najmniej tak drogi jak poprzedni (rośnie z poziomem relacji, nie maleje).
    expect(c2).toBeGreaterThanOrEqual(c1);
    expect(c3).toBeGreaterThanOrEqual(c2);
  });
});
