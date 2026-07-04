// phaseU3.test.ts — Inicjatywa „rozbudowa ulepszeń" (faza U3: Dziedzictwo głębsze; docs/ULEPSZENIA.md).
//  - generator ogonów drzewa jest deterministyczny, bez kolizji, waliduje się,
//  - ogony są ZAMGLONE i odsłaniają się dopiero po wykupieniu poprzednika (łańcuch),
//  - liczba poziomów ROŚNIE w głąb.
import { describe, it, expect } from 'vitest';
import { Decimal, validatePack } from '@kombinat/shared';
import { loadContent } from '../src/engine/loader';
import { Engine } from '../src/engine/engine';
import { basePack } from '../src/content/base';
import { buildGeneratedTree } from '../src/content/base/genTree';

describe('U3 — głębokie ogony drzewa Dziedzictwa', () => {
  it('generator jest deterministyczny, daje 3 ogony i ID mają prefiks rdzen.gt_', () => {
    const a = buildGeneratedTree();
    expect(JSON.stringify(a)).toBe(JSON.stringify(buildGeneratedTree()));
    expect(a.length).toBe(42); // 3 konary × 14
    expect(a.every((n) => n.id.startsWith('rdzen.gt_'))).toBe(true);
  });

  it('brak kolizji ID w całym drzewie i treść waliduje się czysto', () => {
    const ids = basePack.treeNodes!.map((n) => n.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(basePack.treeNodes!.length).toBeGreaterThanOrEqual(60);
    const v = validatePack(basePack);
    expect(v.issues.filter((i) => i.level === 'error'), JSON.stringify(v.issues.slice(0, 5))).toHaveLength(0);
  });

  it('poziomy = numer rzędu (ogon startuje od rzędu 11), rośnie o 1 na węzeł', () => {
    const tree = buildGeneratedTree();
    const aparat = tree.filter((n) => n.id.startsWith('rdzen.gt_aparat_'));
    // Rzędy 1–9 ręczne + finał rzędu 10 → ogon to rzędy 11..24 (reguła: numer rzędu = liczba poziomów).
    aparat.forEach((n, i) => expect(n.levels).toBe(11 + i));
    expect(tree.find((n) => n.id === 'rdzen.gt_aparat_0')!.levels).toBe(11);
    expect(tree.find((n) => n.id === 'rdzen.gt_aparat_13')!.levels).toBe(24);
  });

  it('koszty wejścia ogona rosną monotonicznie i są droższe niż finał rzędu 10', () => {
    const tree = buildGeneratedTree();
    const aparat = tree.filter((n) => n.id.startsWith('rdzen.gt_aparat_'));
    const costs = aparat.map((n) => new Decimal(n.cost as string).toNumber());
    for (let i = 1; i < costs.length; i++) expect(costs[i]!).toBeGreaterThan(costs[i - 1]!);
    expect(costs[0]!).toBeGreaterThan(10000); // finał (t_*) kosztuje 10000 — ogon startuje wyżej, bez „dziury"
  });

  it('konary są SYMETRYCZNE — każdy ma tyle samo węzłów (finał R&D i Rynku dorobiony)', () => {
    const byBranch = new Map<string, number>();
    for (const n of basePack.treeNodes!) byBranch.set(n.branch ?? '', (byBranch.get(n.branch ?? '') ?? 0) + 1);
    const counts = [...byBranch.values()];
    expect(new Set(counts).size, `liczności konarów: ${[...byBranch.entries()].map(([b, c]) => `${b}:${c}`).join(', ')}`).toBe(1);
    // finały R&D i Rynku istnieją (symetria z „Order" Aparatu)
    expect(basePack.treeNodes!.some((n) => n.id === 'rdzen.t_fin_rd')).toBe(true);
    expect(basePack.treeNodes!.some((n) => n.id === 'rdzen.t_fin_rynek')).toBe(true);
  });

  it('ogon jest zamglony — odsłania się dopiero po wykupieniu zwornika', () => {
    const { registry, ok, issues } = loadContent([basePack]);
    expect(ok, JSON.stringify(issues)).toBe(true);
    const e = new Engine(registry);
    e.state.resources['odznaczenia'] = new Decimal('1e9');
    e.recomputeModifiers();
    // bez „Order" pierwszy węzeł ogona aparatu jest niewidoczny (fogged + requires niespełnione)
    expect(e.snapshot().tree.some((n) => n.id === 'rdzen.gt_aparat_0')).toBe(false);
    // po wykupieniu „Order" (poziom ≥1) ogon się odsłania
    e.state.treeNodes['rdzen.t_order'] = 1;
    e.recomputeModifiers();
    expect(e.snapshot().tree.some((n) => n.id === 'rdzen.gt_aparat_0')).toBe(true);
  });
});
