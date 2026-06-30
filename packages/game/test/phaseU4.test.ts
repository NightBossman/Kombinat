// phaseU4.test.ts — Inicjatywa „rozbudowa ulepszeń" (faza U4: ulepszenia ZA GRANIE; docs/ULEPSZENIA.md).
//  - generator jest deterministyczny, bez kolizji, waliduje się,
//  - ulepszenia są bramkowane LICZNIKAMI minigier (odblokowują się dopiero, gdy zagrasz dość razy).
import { describe, it, expect } from 'vitest';
import { validatePack } from '@kombinat/shared';
import { loadContent } from '../src/engine/loader';
import { Engine } from '../src/engine/engine';
import { basePack } from '../src/content/base';
import { buildMinigameUpgrades } from '../src/content/base/genMinigame';

describe('U4 — ulepszenia za granie', () => {
  it('generator deterministyczny, 4 rodziny, ID rdzen.gm_', () => {
    const a = buildMinigameUpgrades();
    expect(JSON.stringify(a)).toBe(JSON.stringify(buildMinigameUpgrades()));
    expect(a.length).toBe(30); // 8 Taśma + 8 Kantor + 8 Załatwianie + 6 Okazje
    expect(a.every((u) => u.id.startsWith('rdzen.gm_'))).toBe(true);
  });

  it('brak kolizji ID w całej puli i treść waliduje się czysto', () => {
    const ids = basePack.upgrades!.map((u) => u.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(basePack.upgrades!.length).toBeGreaterThanOrEqual(340);
    const v = validatePack(basePack);
    expect(v.issues.filter((i) => i.level === 'error'), JSON.stringify(v.issues.slice(0, 5))).toHaveLength(0);
  });

  it('ulepszenie „za Taśmę" odblokowuje się dopiero po dość rozegranych grach', () => {
    const { registry, ok, issues } = loadContent([basePack]);
    expect(ok, JSON.stringify(issues)).toBe(true);
    const e = new Engine(registry);
    // gm_tasma_0 jest bramkowane `licznik.tasma_lacznie >= 10`
    expect(e.isUpgradeAvailable('rdzen.gm_tasma_0')).toBe(false);
    e.state.stats.counters['tasma_lacznie'] = 10;
    e.recomputeModifiers();
    expect(e.isUpgradeAvailable('rdzen.gm_tasma_0')).toBe(true);
  });
});
