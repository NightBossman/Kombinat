// phaseU5.test.ts — Inicjatywa „rozbudowa ulepszeń" (faza U5: pozostałe + DOMKNIĘCIE liczby ≥1000;
// docs/ULEPSZENIA.md). Masowo generowane kamienie milowe + więcej kadry/doktryn/dyplomacji.
import { describe, it, expect } from 'vitest';
import { Decimal, validatePack } from '@kombinat/shared';
import { loadContent } from '../src/engine/loader';
import { Engine } from '../src/engine/engine';
import { basePack } from '../src/content/base';
import { buildGeneratedMilestones } from '../src/content/base/genMilestones';

describe('U5 — masowe kamienie milowe', () => {
  it('generator deterministyczny, kilkaset wpisów, ID rdzen.ms_', () => {
    const a = buildGeneratedMilestones();
    expect(JSON.stringify(a)).toBe(JSON.stringify(buildGeneratedMilestones()));
    expect(a.length).toBe(386);
    expect(a.every((m) => m.id.startsWith('rdzen.ms_'))).toBe(true);
  });

  it('brak kolizji ID i cała treść waliduje się czysto', () => {
    const ids = basePack.milestones!.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    const v = validatePack(basePack);
    expect(v.issues.filter((i) => i.level === 'error'), JSON.stringify(v.issues.slice(0, 5))).toHaveLength(0);
  });

  it('kamień milowy parku wyzwala się po osiągnięciu progu (z throttlingiem ~4 Hz)', () => {
    const { registry } = loadContent([basePack]);
    const e = new Engine(registry);
    e.state.generators['liczydlo'] = { owned: new Decimal(50) };
    e.recomputeModifiers();
    expect(e.state.milestones['rdzen.ms_park_liczydlo_50']).toBeUndefined();
    e.tick(0.3);
    expect(e.state.milestones['rdzen.ms_park_liczydlo_50']).toBe(true);
  });
});

describe('U5 — więcej kadry/doktryn/dyplomacji', () => {
  it('przybyło kadry, doktryn i krajów', () => {
    expect(basePack.characters!.length).toBeGreaterThanOrEqual(9);
    expect(basePack.doctrines!.length).toBeGreaterThanOrEqual(7);
    expect(basePack.diplomacy!.length).toBeGreaterThanOrEqual(8);
  });
});

describe('U5 — DOMKNIĘCIE: czterocyfrowa liczba ulepszeń', () => {
  it('łączna liczba trwałych bonusów (ulepszenia + drzewo + kamienie + osiągnięcia + kadra/doktryny/dyplomacja) ≥ 1000', () => {
    const total =
      (basePack.upgrades?.length ?? 0) +
      (basePack.treeNodes?.length ?? 0) +
      (basePack.milestones?.length ?? 0) +
      (basePack.achievements?.length ?? 0) +
      (basePack.characters?.length ?? 0) +
      (basePack.doctrines?.length ?? 0) +
      (basePack.diplomacy?.length ?? 0);
    expect(total).toBeGreaterThanOrEqual(1000);
  });
});
