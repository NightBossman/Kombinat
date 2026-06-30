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

  it('liczba poziomów rośnie w głąb ogona', () => {
    const tree = buildGeneratedTree();
    const a0 = tree.find((n) => n.id === 'rdzen.gt_aparat_0')!;
    const a13 = tree.find((n) => n.id === 'rdzen.gt_aparat_13')!;
    expect(a0.levels).toBe(3);
    expect(a13.levels!).toBeGreaterThan(a0.levels!);
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
