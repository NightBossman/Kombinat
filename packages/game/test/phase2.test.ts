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

describe('Faza 2 — Denominacja', () => {
  it('zysk = floor(sqrt(wytworzone / skala))', () => {
    const e = eng();
    e.state.stats.runProduced['cykle'] = new Decimal('4e6'); // sqrt(4) = 2
    expect(e.prestigeGain().toNumber()).toBe(2);
    expect(e.canDenominate()).toBe(true);
  });

  it('nie pozwala denominowac ponizej progu', () => {
    const e = eng();
    e.state.stats.runProduced['cykle'] = new Decimal('500000'); // < 1e6
    expect(e.canDenominate()).toBe(false);
    expect(e.denominate()).toBeNull();
  });

  it('Denominacja kasuje rozgrywke, ale dolicza odznaczenia i liczy resety', () => {
    const e = eng();
    e.state.stats.runProduced['cykle'] = new Decimal('4e6');
    e.state.generators['liczydlo'] = { owned: new Decimal(50) };
    e.state.resources['cykle'] = new Decimal('1e6');
    const res = e.denominate();
    expect(res?.gain.toNumber()).toBe(2);
    expect(e.state.resources['odznaczenia']!.toNumber()).toBe(2);
    expect(e.state.generators['liczydlo']!.owned.toNumber()).toBe(0);
    expect(e.state.resources['cykle']!.toNumber()).toBe(0);
    expect(e.state.stats.denominations).toBe(1);
    expect(e.state.stats.runProduced['cykle']!.toNumber()).toBe(0);
  });
});

describe('Faza 2 — drzewo dziedzictwa', () => {
  it('kupno wezla pobiera odznaczenia i stosuje trwaly mnoznik', () => {
    const e = eng();
    e.state.resources['odznaczenia'] = new Decimal(20);
    e.state.generators['liczydlo'] = { owned: new Decimal(10) }; // 2/s bazowo
    expect(e.buyTreeNode('rdzen.t_teczka')).toBe(true); // +10% global (koszt teczki = 2)
    expect(e.state.resources['odznaczenia']!.toNumber()).toBe(18);
    // 2/s × 1,1 (węzeł) × (1 + 0,2%×18 odznaczeń — bonus z uwagi #15)
    expect(e.currentRates()['cykle']!.toNumber()).toBeCloseTo(2 * 1.1 * (1 + 0.002 * 18), 6);
  });

  it('nie kupi wezla z niespelnionymi wymaganiami', () => {
    const e = eng();
    e.state.resources['odznaczenia'] = new Decimal(20);
    expect(e.buyTreeNode('rdzen.t_premia')).toBe(false); // wymaga t_etat <- t_teczka
  });

  it('wezly drzewa PRZEZYWAJA Denominacje (trwalosc)', () => {
    const e = eng();
    e.state.resources['odznaczenia'] = new Decimal(20);
    e.buyTreeNode('rdzen.t_teczka'); // 20 → 18 odznaczeń (koszt teczki = 2)
    e.state.stats.runProduced['cykle'] = new Decimal('4e6');
    e.denominate(); // +2 odznaczenia (sqrt(4e6/1e6)) → 20
    expect(e.state.treeNodes['rdzen.t_teczka']).toBe(1); // poziom 1 (wykupione)
    e.state.generators['liczydlo'] = { owned: new Decimal(10) };
    // 2/s × 1,1 (trwały węzeł) × (1 + 0,2%×20 odznaczeń — bonus z uwagi #15)
    expect(e.currentRates()['cykle']!.toNumber()).toBeCloseTo(2 * 1.1 * (1 + 0.002 * 20), 6);
  });

  it('wezel „startowy” daje zasoby na starcie nowej rozgrywki', () => {
    const e = eng();
    e.state.resources['odznaczenia'] = new Decimal(20);
    // łańcuch konaru „rynek": kantor → bony → zaliczka (startWith cykle 1000)
    e.buyTreeNode('rdzen.t_kantor');
    e.buyTreeNode('rdzen.t_bony');
    e.buyTreeNode('rdzen.t_zaliczka');
    e.state.stats.runProduced['cykle'] = new Decimal('4e6');
    e.denominate();
    expect(e.state.resources['cykle']!.toNumber()).toBe(1000);
  });

  it('zamglony wezel jest ukryty, poki wymagania niespelnione', () => {
    const e = eng();
    const snap = e.snapshot();
    expect(snap.tree.some((n) => n.id === 'rdzen.t_order')).toBe(false);
    expect(snap.tree.some((n) => n.id === 'rdzen.t_teczka')).toBe(true);
  });
});

describe('Faza 2 — migawka prestizu', () => {
  it('zawiera dane prestizu', () => {
    const e = eng();
    const snap = e.snapshot();
    expect(snap.prestige).toBeTruthy();
    expect(snap.prestige.denominations).toBe(0);
    expect(snap.prestige.canDenominate).toBe(false);
  });
});
