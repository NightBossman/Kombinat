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

describe('Faza 4A — załatwianie / łapówki', () => {
  it('mechanika odblokowana dopiero przy realnym sprzęcie (MERA-400)', () => {
    const e = eng();
    expect(e.zalatwianieUnlocked()).toBe(false);
    e.state.generators['mera400'] = { owned: new Decimal(1) };
    expect(e.zalatwianieUnlocked()).toBe(true);
  });

  it('zaopatrzenie: kupujesz towar za dewizy (PLAN 9.1 — smarowanie towarem)', () => {
    const e = eng();
    e.state.generators['mera400'] = { owned: new Decimal(1) };
    e.state.resources['dewizy'] = new Decimal(1000);
    expect((e.state.resources['kawa'] ?? new Decimal(0)).toNumber()).toBe(0);
    expect(e.buySupply('kawa')).toBe(true);
    expect(e.state.resources['kawa']!.toNumber()).toBeGreaterThan(0);
    expect(e.state.resources['dewizy']!.toNumber()).toBeLessThan(1000); // zapłacone dewizami
  });

  it('bez dewiz nie zaopatrzysz się w towar', () => {
    const e = eng();
    e.state.generators['mera400'] = { owned: new Decimal(1) };
    e.state.resources['dewizy'] = new Decimal(0);
    expect(e.buySupply('kawa')).toBe(false);
  });

  it('promocja: rzadka (2 min przerwy), trwa 12 s, odliczana OD KOŃCA', () => {
    const e = eng();
    const t0 = 1_000_000; // dowolny punkt startu
    // Na starcie brak promocji — pierwsza dopiero po pełnej przerwie (2 min).
    const before = e.supplyDeal(t0);
    expect(before.active).toBe(false);
    expect(before.secondsLeft).toBeCloseTo(120, 0); // ~2 min do pierwszej
    // Po przerwie 2 min wskakuje promocja na 12 s.
    const on = e.supplyDeal(t0 + 120_000);
    expect(on.active).toBe(true);
    expect(on.mult).toBeLessThan(1);
    expect([55, 75, 90]).toContain(on.pct);
    expect(on.secondsLeft).toBeCloseTo(12, 0);
    // Tuż przed końcem wciąż trwa; po 12 s kończy się i ZACZYNA odliczać od TERAZ pełne 2 min.
    expect(e.supplyDeal(t0 + 131_000).active).toBe(true);
    const off = e.supplyDeal(t0 + 132_000);
    expect(off.active).toBe(false);
    expect(off.mult).toBe(1);
    expect(off.secondsLeft).toBeCloseTo(120, 0); // odliczanie od KOŃCA promocji, nie od początku
  });

  it('promocja losuje rabat 55/75/90% — równe pule, NIGDY dwa takie same z rzędu', () => {
    const e = eng();
    e.supplyDeal(0); // inicjalizacja: pierwsza promocja zaplanowana na +2 min
    let t = 0;
    const seen: number[] = [];
    for (let i = 0; i < 12; i++) {
      t += 120_000; // przerwa do następnej promocji
      const on = e.supplyDeal(t);
      expect(on.active).toBe(true);
      seen.push(on.pct);
      t += 12_000; // przeczekaj okno promocji
      e.supplyDeal(t); // zamknij promocję (planuje następną od końca)
    }
    for (const p of seen) expect([55, 75, 90]).toContain(p);
    for (let i = 1; i < seen.length; i++) expect(seen[i]).not.toBe(seen[i - 1]); // brak powtórki z rzędu
  });

  it('łapówka w towarze pobiera towar, dolicza ryzyko i daje czasowy bonus produkcji', () => {
    const e = eng();
    e.state.generators['mera400'] = { owned: new Decimal(1) };
    e.state.generators['liczydlo'] = { owned: new Decimal(10) };
    e.state.resources['dewizy'] = new Decimal(1000);
    e.buySupply('papierosy');
    e.buySupply('papierosy'); // 2 kartony — tyle kosztuje „Marlboro dla urzędnika"
    const papBefore = e.state.resources['papierosy']!.toNumber();
    const rateBefore = e.currentRates()['cykle']!.toNumber();
    const res = e.bribe('rdzen.lap_urz_marlboro'); // prod ×1.5, płaci papierosami
    expect(res.ok).toBe(true);
    expect(res.kontrola).toBe(false);
    expect(e.state.resources['papierosy']!.toNumber()).toBeLessThan(papBefore);
    expect(e.ryzyko()).toBeGreaterThan(0);
    expect(e.currentRates()['cykle']!.toNumber()).toBeGreaterThan(rateBefore);
  });

  it('łapówka w towarze dla magazyniera czasowo obniża koszty', () => {
    const e = eng();
    e.state.generators['mera400'] = { owned: new Decimal(1) };
    e.state.resources['dewizy'] = new Decimal(1000);
    e.buySupply('kawa');
    e.buySupply('kawa');
    const costBefore = e.cost('liczydlo').toNumber();
    expect(e.bribe('rdzen.lap_mag_kawa').ok).toBe(true); // koszty ×0,7
    expect(e.cost('liczydlo').toNumber()).toBeLessThan(costBefore);
  });

  it('koperta (poważniejsza sprawa) płaci dewizami, nie towarem', () => {
    const e = eng();
    e.state.generators['mera400'] = { owned: new Decimal(1) };
    e.state.generators['osrodek'] = { owned: new Decimal(1) }; // odblokowuje dygnitarza
    e.state.resources['dewizy'] = new Decimal(1000);
    expect(e.bribe('rdzen.lap_dyg_kolacja').ok).toBe(true);
    expect(e.state.resources['dewizy']!.toNumber()).toBeLessThan(1000);
  });

  it('bez towaru łapówka w towarze się nie udaje', () => {
    const e = eng();
    e.state.generators['mera400'] = { owned: new Decimal(1) };
    e.state.resources['papierosy'] = new Decimal(0);
    expect(e.bribe('rdzen.lap_urz_marlboro').ok).toBe(false);
  });

  it('talon na samochód — mały kamień milowy po wielu załatwieniach (PLAN 9.1)', () => {
    const e = eng();
    e.state.generators['liczydlo'] = { owned: new Decimal(10) };
    const before = e.currentRates()['cykle']!.toNumber();
    expect(e.state.milestones['rdzen.m_talon_samochod']).toBeFalsy();
    e.state.stats.counters['lapowki'] = 12; // tyle załatwień „wpisuje na listę"
    e.checkMilestones();
    expect(e.state.milestones['rdzen.m_talon_samochod']).toBe(true);
    expect(e.currentRates()['cykle']!.toNumber()).toBeGreaterThan(before); // trwały bonus produkcji
  });

  it('ryzyko kontroli opada w czasie', () => {
    const e = eng();
    e.state.flags['ryzyko'] = 50;
    e.tick(10); // 10 s × 1,5 = −15
    expect(e.ryzyko()).toBeCloseTo(35, 1);
  });

  it('migawka niesie panel załatwiania (cele + ryzyko + zaopatrzenie) po odblokowaniu', () => {
    const e = eng();
    expect(e.snapshot().zalatwianie.unlocked).toBe(false);
    // dygnitarz wymaga ośrodka (a koperty k202/spectrum) — ustawiamy, by wszystkie cele były na liście
    for (const id of ['mera400', 'k202', 'spectrum', 'osrodek']) e.state.generators[id] = { owned: new Decimal(1) };
    const z = e.snapshot().zalatwianie;
    expect(z.unlocked).toBe(true);
    expect(z.bribes.length).toBeGreaterThan(0);
    for (const t of ['magazynier', 'celnik', 'urzednik', 'dygnitarz']) {
      expect(z.bribes.some((b) => b.target === t), t).toBe(true);
    }
    // zaopatrzenie w towar (kawa/wódka/papierosy) jest na liście
    expect(z.supplies.length).toBeGreaterThanOrEqual(3);
    for (const g of ['kawa', 'wodka', 'papierosy']) {
      expect(z.supplies.some((s) => s.id === g), g).toBe(true);
    }
  });

  it('dwukrotne kupno tej samej łapówki → dwa bonusy o UNIKALNYCH id (nie zamraża UI)', () => {
    const e = eng();
    e.state.generators['mera400'] = { owned: new Decimal(1) }; // odblokuj załatwianie
    e.state.resources['kawa'] = new Decimal(10);
    expect(e.bribe('rdzen.lap_mag_kawa').ok).toBe(true);
    expect(e.bribe('rdzen.lap_mag_kawa').ok).toBe(true); // to samo drugi raz
    const same = e.snapshot().buffs.filter((b) => b.label === 'Kawa dla magazyniera');
    expect(same.length).toBe(2); // stosują się dwa bonusy o tej samej nazwie
    expect(same[0]!.id).not.toBe(same[1]!.id); // ale id UNIKALNE → brak duplikatu klucza listy w UI
  });

  it('Dygnitarz: dwa ulepszenia (w tym koniak), efekt na KLIKANIE (nie produkcję jak Urzędnik)', () => {
    const { registry } = loadContent([basePack]);
    const dyg = [...registry.bribes.values()].filter((b) => b.target === 'dygnitarz');
    expect(dyg.length).toBe(2); // teraz dwa (koniak + kolacja)
    expect(dyg.some((b) => b.costResource === 'koniak')).toBe(true); // jeden płacony specjalnym towarem
    expect(dyg.every((b) => b.scope === 'click')).toBe(true); // KLIKANIE — odróżnia od Urzędnika (prod)
    // Urzędnik nadal daje produkcję — efekty się NIE powtarzają
    const urz = [...registry.bribes.values()].filter((b) => b.target === 'urzednik');
    expect(urz.every((b) => b.scope === 'prod')).toBe(true);
  });

  it('towary-waluty są LOKALNE — nie trafiają na globalną stopkę (regula właściciela)', () => {
    const e = eng();
    // daj trochę towaru, by nie był ukryty (hidden do zdobycia)
    e.state.resources['wodka'] = new Decimal(5);
    const res = e.snapshot().resources;
    const wodka = res.find((r) => r.id === 'wodka');
    expect(wodka?.local).toBe(true); // towar = lokalny → stopka go odfiltruje
    const cykle = res.find((r) => r.id === 'cykle');
    expect(cykle?.local).toBeFalsy(); // globalna waluta zostaje na stopce
  });
});
