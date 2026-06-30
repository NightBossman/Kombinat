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

describe('Uwagi#2 — poprawki silnika', () => {
  it('#1 odznaczenia są oznaczone jako waluta prestiżowa (UI ukrywa „/s")', () => {
    const e = eng();
    e.state.resources['odznaczenia'] = new Decimal(3);
    const odz = e.snapshot().resources.find((r) => r.id === 'odznaczenia');
    expect(odz?.prestige).toBe(true);
    const cykle = e.snapshot().resources.find((r) => r.id === 'cykle');
    expect(cykle?.prestige).toBeFalsy();
  });

  it('#15 każde odznaczenie podbija produkcję cykli (+0,2%)', () => {
    const e = eng();
    e.state.generators['liczydlo'] = { owned: new Decimal(10) }; // 2/s bazowo
    const base = e.currentRates()['cykle']!.toNumber();
    e.state.resources['odznaczenia'] = new Decimal(100);
    e.recomputeModifiers(); // w grze dzieje się to przy Denominacji (gdy zmienia się liczba odznaczeń)
    const boosted = e.currentRates()['cykle']!.toNumber();
    expect(boosted).toBeCloseTo(base * (1 + 0.002 * 100), 6); // +20%
  });

  it('#5 nagroda z minigry skaluje się mnożnikiem trudności', () => {
    const e = eng();
    const start = (e.state.resources['cykle'] ?? new Decimal(0)).toNumber();
    e.minigameReward(1, 1);
    const easy = (e.state.resources['cykle'] ?? new Decimal(0)).toNumber() - start;
    const mid = (e.state.resources['cykle'] ?? new Decimal(0)).toNumber();
    e.minigameReward(1, 4);
    const hard = (e.state.resources['cykle'] ?? new Decimal(0)).toNumber() - mid;
    expect(hard).toBeCloseTo(easy * 4, 4);
  });

  it('#6 minigra „Taśma" zablokowana, dopóki nie ustawiona flaga mechaniki', () => {
    const e = eng();
    expect(e.snapshot().tasmaUnlocked).toBe(false);
    e.state.flags['mechanika.minigra_tasma'] = 1;
    expect(e.snapshot().tasmaUnlocked).toBe(true);
  });

  it('#19 uśpione waluty są ukryte, dopóki nie zdobyte', () => {
    const e = eng();
    const ids0 = e.snapshot().resources.map((r) => r.id);
    expect(ids0).not.toContain('dolary');
    e.state.resources['dolary'] = new Decimal(5);
    const ids1 = e.snapshot().resources.map((r) => r.id);
    expect(ids1).toContain('dolary');
  });

  it('#8 opis węzła „Tablica wyróżnień" jest po polsku, nie surowy typ efektu', () => {
    const e = eng();
    const node = e.snapshot().tree.find((n) => n.id === 'rdzen.t_tablica');
    expect(node).toBeTruthy();
    expect(node!.effectText).not.toContain('enableAchievementMultipliers');
    expect(node!.effectText.length).toBeGreaterThan(0);
  });
});

describe('Uwagi#2 — eventy, okazje, unikalne osiągnięcia', () => {
  it('#14 pula eventów jest trzycyfrowa (100+) i nadal ważna', () => {
    const { registry, ok } = loadContent([basePack]);
    expect(ok).toBe(true);
    expect(registry.events.size).toBeGreaterThanOrEqual(100);
  });

  it('#22 pula osiągnięć ma kategorię „Unikalne" (≥30)', () => {
    const { registry } = loadContent([basePack]);
    let uniq = 0;
    for (const a of registry.achievements.values()) if (a.category === 'Unikalne') uniq += 1;
    expect(uniq).toBeGreaterThanOrEqual(30);
  });

  it('#21 okazja odblokowuje się po rozkręceniu i liczy kliknięcia', () => {
    const e = eng();
    expect(e.okazjeUnlocked()).toBe(false);
    e.state.stats.producedTotal['cykle'] = new Decimal(200);
    expect(e.okazjeUnlocked()).toBe(true);
    e.clickOkazja();
    expect(e.state.stats.counters['zlote_klikniecia']).toBe(1);
  });

  it('#22 seria kliknięć i jej szczyt są liczone', () => {
    const e = eng();
    for (let i = 0; i < 10; i++) e.click();
    expect(e.state.stats.counters['seria_klikniec']).toBe(10);
    expect(e.state.stats.counters['seria_klikniec_max']).toBe(10);
  });

  it('#22 transakcje giełdowe i gry w Taśmę są liczone', () => {
    const e = eng();
    e.state.generators['spectrum'] = { owned: new Decimal(1) };
    e.state.resources['cykle'] = new Decimal('1e6');
    e.exchange('buy', 0.5);
    expect(e.state.stats.counters['gielda_transakcje']).toBe(1);
    e.minigameReward(1, 1);
    expect(e.state.stats.counters['tasma_lacznie']).toBe(1);
    expect(e.state.stats.counters['tasma_seria']).toBe(1);
  });

  it('#16 „Co dalej?" to wiele żywych celów, w tym najbliższe osiągnięcie', () => {
    const e = eng();
    e.state.resources['cykle'] = new Decimal(1000);
    e.state.generators['liczydlo'] = { owned: new Decimal(3) }; // blisko progu „×5"
    const goals = e.snapshot().goals;
    expect(Array.isArray(goals)).toBe(true);
    expect(goals.length).toBeGreaterThanOrEqual(2);
    expect(goals.some((g) => g.horizon === 'Teraz')).toBe(true);
    expect(goals.some((g) => g.horizon === 'Osiągnięcie')).toBe(true);
  });

  it('ulepszeń jest znacznie więcej, w tym late-game (kategoria nie świeci pustkami)', () => {
    const { registry } = loadContent([basePack]);
    expect(registry.upgrades.size).toBeGreaterThanOrEqual(35);
    expect(registry.upgrades.has('rdzen.u_internet')).toBe(true); // globalny ×5 late-game
    expect(registry.upgrades.has('rdzen.u_spolka3')).toBe(true);
  });

  it('drzewo dziedzictwa: 3 konary-łańcuchy + wielki finał + dawne zworniki wpięte w konary', () => {
    const { registry } = loadContent([basePack]);
    const nodes = [...registry.treeNodes.values()];
    const inBranch = (b: string) => nodes.filter((n) => n.branch === b);
    // KAŻDY węzeł ma teraz konar (sekcja osobnych „zworników" usunięta — wpięte w konary).
    expect(nodes.every((n) => !!n.branch)).toBe(true);
    for (const b of ['aparat', 'rd', 'rynek']) {
      const col = inBranch(b);
      expect(col.length, b).toBeGreaterThanOrEqual(6); // konary wydłużone (więcej ulepszeń)
      const roots = col.filter((n) => (n.requires ?? []).length === 0);
      expect(roots.length, `${b} ma jeden korzeń`).toBe(1);
      // każdy nie-korzeń wymaga węzła z TEGO SAMEGO konaru (łańcuch) — z WYJĄTKIEM wielkiego finału
      // (Order), który celowo wymaga końca wszystkich trzech konarów.
      for (const n of col) {
        if (n.id === 'rdzen.t_order') continue;
        for (const r of n.requires ?? []) {
          expect(registry.treeNodes.get(r)?.branch, `${n.id} wymaga z tego samego konaru`).toBe(b);
        }
      }
    }
    // dawne „zworniki" wpięte w konary
    expect(registry.treeNodes.get('rdzen.t_attache')?.branch).toBe('rynek');
    expect(registry.treeNodes.get('rdzen.t_druga_gospodarka')?.branch).toBe('aparat');
    // nowe, głębsze węzły (drzewo ciągnie się dłużej, „nie kończy się")
    for (const id of ['rdzen.t_centrala', 'rdzen.t_dolina', 'rdzen.t_offshore', 'rdzen.t_cinkciarz', 'rdzen.t_aparatczyk']) {
      expect(registry.treeNodes.has(id), id).toBe(true);
    }
    // wielki finał wymaga końca wszystkich trzech konarów
    expect(registry.treeNodes.get('rdzen.t_order')?.requires).toEqual([
      'rdzen.t_centrala',
      'rdzen.t_dolina',
      'rdzen.t_offshore',
    ]);
  });

  it('#3 wielopoziomowe węzły drzewa: rosnący koszt + następny wymaga ≥1 poziomu poprzednika', () => {
    const e = eng();
    e.state.resources['odznaczenia'] = new Decimal(1000);
    e.buyTreeNode('rdzen.t_teczka');
    e.buyTreeNode('rdzen.t_etat');
    const premia0 = e.snapshot().tree.find((n) => n.id === 'rdzen.t_premia')!;
    expect(premia0.maxLevel).toBe(3);
    // póki premia ma 0 poziomów, tablica zablokowana
    expect(e.buyTreeNode('rdzen.t_tablica')).toBe(false);
    const c1 = premia0.costRaw;
    e.buyTreeNode('rdzen.t_premia'); // poziom 1
    const c2 = e.snapshot().tree.find((n) => n.id === 'rdzen.t_premia')!.costRaw;
    expect(c2).toBeGreaterThan(c1); // koszt kolejnego poziomu rośnie
    // wystarczy 1 poziom premii, by ruszyć dalej (nie trzeba maksować — drogie węzły nie blokują gałęzi)
    expect(e.treeNodeLevel('rdzen.t_premia')).toBe(1);
    expect(e.buyTreeNode('rdzen.t_tablica')).toBe(true);
  });

  it('liczba poziomów węzłów drzewa skaluje się z rzędem (1→2→3→4→5→6)', () => {
    const { registry } = loadContent([basePack]);
    const lvl = (id: string): number => registry.treeNodes.get(id)?.levels ?? 1;
    for (const chain of [
      ['rdzen.t_teczka', 'rdzen.t_etat', 'rdzen.t_premia', 'rdzen.t_tablica', 'rdzen.t_plan', 'rdzen.t_nomenklatura'],
      ['rdzen.t_lab', 'rdzen.t_karpinski', 'rdzen.t_palce', 'rdzen.t_elwro', 'rdzen.t_zapas', 'rdzen.t_instytut'],
      ['rdzen.t_kantor', 'rdzen.t_bony', 'rdzen.t_zaliczka', 'rdzen.t_gielda', 'rdzen.t_spekulant', 'rdzen.t_holding'],
    ]) {
      expect(chain.map(lvl)).toEqual([1, 2, 3, 4, 5, 6]);
    }
  });

  it('#11 migawka giełdy niesie historię kursu do wykresu', () => {
    const e = eng();
    e.state.generators['spectrum'] = { owned: new Decimal(1) };
    const h = e.snapshot().gielda.history;
    expect(Array.isArray(h)).toBe(true);
    expect(h.length).toBeGreaterThanOrEqual(24);
    expect(h.every((v) => v > 0)).toBe(true);
  });

  it('#22 liczniki all-time przeżywają Denominację', () => {
    const e = eng();
    for (let i = 0; i < 5; i++) e.click();
    e.state.stats.runProduced['cykle'] = new Decimal('4e6');
    e.denominate();
    expect(e.state.stats.counters['seria_klikniec_max']).toBe(5);
  });
});
