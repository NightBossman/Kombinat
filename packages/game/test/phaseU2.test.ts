// phaseU2.test.ts — Inicjatywa „rozbudowa ulepszeń" (faza U2: pełna fala główna; docs/ULEPSZENIA.md).
//  - generator urósł do pełnej fali (6 rodzin), w tym NOWA rodzina „filar" (posiadanie maszyny → bonus
//    globalny),
//  - łączna pula ulepszeń rdzenia liczy kilkaset wpisów, dalej bez kolizji i waliduje się czysto,
//  - rodzina „filar" jest bramkowana posiadaniem maszyny.
import { describe, it, expect } from 'vitest';
import { Decimal, validatePack } from '@kombinat/shared';
import { loadContent } from '../src/engine/loader';
import { Engine } from '../src/engine/engine';
import { basePack } from '../src/content/base';
import { buildGeneratedUpgrades } from '../src/content/base/genUpgrades';

describe('U2 — pełna fala główna', () => {
  it('generator produkuje pełną falę (6 rodzin) i wpisy są unikalne', () => {
    const gen = buildGeneratedUpgrades();
    expect(gen.length).toBe(276); // 154 per-maszyna + 66 filar + 16 glob + 12 koszty + 12 klik + 16 dewizy
    const ids = gen.map((u) => u.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('łączna pula ulepszeń rdzenia to kilkaset wpisów i waliduje się czysto', () => {
    expect(basePack.upgrades!.length).toBeGreaterThanOrEqual(300);
    const v = validatePack(basePack);
    expect(v.issues.filter((i) => i.level === 'error'), JSON.stringify(v.issues.slice(0, 5))).toHaveLength(0);
  });

  it('rodzina „filar" daje bonus globalny i jest bramkowana posiadaniem maszyny', () => {
    const { registry, ok, issues } = loadContent([basePack]);
    expect(ok, JSON.stringify(issues)).toBe(true);
    const e = new Engine(registry);
    // gu_pillar_liczydlo_0 jest bramkowane `posiadane.liczydlo >= 60`
    expect(e.isUpgradeAvailable('rdzen.gu_pillar_liczydlo_0')).toBe(false);
    e.state.generators['liczydlo'] = { owned: new Decimal(60) };
    e.recomputeModifiers();
    expect(e.isUpgradeAvailable('rdzen.gu_pillar_liczydlo_0')).toBe(true);
    const def = registry.upgrades.get('rdzen.gu_pillar_liczydlo_0')!;
    expect(def.effects[0]!.target).toBe('global');
  });
});
