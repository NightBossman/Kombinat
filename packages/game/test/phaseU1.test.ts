// phaseU1.test.ts — Inicjatywa „rozbudowa ulepszeń" (faza U1, docs/ULEPSZENIA.md).
//  - generator ulepszeń jest DETERMINISTYCZNY i bez kolizji ID,
//  - cała treść (z generowanymi) waliduje się czysto,
//  - bramkowanie progresją działa (ulepszenie pojawia się dopiero po osiągnięciu progu),
//  - migawka niesie grupę + licznik wykupionych, helper grupowania klasyfikuje poprawnie.
import { describe, it, expect } from 'vitest';
import { Decimal, validatePack } from '@kombinat/shared';
import { loadContent } from '../src/engine/loader';
import { Engine } from '../src/engine/engine';
import { basePack } from '../src/content/base';
import { buildGeneratedUpgrades } from '../src/content/base/genUpgrades';
import { upgradeGroup } from '../src/engine/snapshot';

describe('U1 — generator ulepszeń: dane, determinizm, brak kolizji', () => {
  it('jest deterministyczny (to samo wejście → identyczny wynik)', () => {
    expect(JSON.stringify(buildGeneratedUpgrades())).toBe(JSON.stringify(buildGeneratedUpgrades()));
  });

  it('produkuje falę ulepszeń i wszystkie ID mają prefiks rdzen.gu_', () => {
    const gen = buildGeneratedUpgrades();
    expect(gen.length).toBeGreaterThanOrEqual(122);
    expect(gen.every((u) => u.id.startsWith('rdzen.gu_'))).toBe(true);
  });

  it('brak kolizji ID w całej puli ulepszeń rdzenia (ręczne + generowane)', () => {
    const ids = basePack.upgrades!.map((u) => u.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(basePack.upgrades!.length).toBeGreaterThanOrEqual(150);
  });

  it('cała treść bazowa (z generowanymi ulepszeniami) waliduje się bez błędów', () => {
    const v = validatePack(basePack);
    expect(v.issues.filter((i) => i.level === 'error'), JSON.stringify(v.issues)).toHaveLength(0);
  });
});

describe('U1 — bramkowanie progresją', () => {
  it('ulepszenie per-maszyna pojawia się dopiero po osiągnięciu progu posiadania', () => {
    const { registry, ok, issues } = loadContent([basePack]);
    expect(ok, JSON.stringify(issues)).toBe(true);
    const e = new Engine(registry);
    // gu_mul_osrodek_0 jest bramkowane `posiadane.osrodek >= 40`
    expect(e.isUpgradeAvailable('rdzen.gu_mul_osrodek_0')).toBe(false);
    e.state.generators['osrodek'] = { owned: new Decimal(40) };
    e.recomputeModifiers();
    expect(e.isUpgradeAvailable('rdzen.gu_mul_osrodek_0')).toBe(true);
  });
});

describe('U1 — migawka: grupy + licznik', () => {
  it('migawka niesie upgradeStats (total = liczba ulepszeń) i grupę przy dostępnych', () => {
    const { registry } = loadContent([basePack]);
    const e = new Engine(registry);
    e.state.generators['osrodek'] = { owned: new Decimal(40) };
    e.state.resources['cykle'] = new Decimal('1e12');
    e.recomputeModifiers();
    const snap = e.snapshot();
    expect(snap.upgradeStats.total).toBe(registry.upgrades.size);
    expect(snap.upgradeStats.available).toBe(snap.upgrades.length);
    expect(snap.upgrades.every((u) => typeof u.group === 'string' && u.group.length > 0)).toBe(true);
  });

  it('helper upgradeGroup klasyfikuje wg pierwszego efektu', () => {
    const names = { gen: (id: string) => (id === 'mera400' ? 'MERA-400' : undefined), res: () => undefined };
    expect(upgradeGroup([{ type: 'multiplyProduction', target: 'global', value: '2' }], names)).toBe('Globalne');
    expect(upgradeGroup([{ type: 'multiplyProduction', target: 'generator:mera400', value: '2' }], names)).toBe('MERA-400');
    expect(upgradeGroup([{ type: 'multiplyProduction', target: 'resource:dewizy', value: '2' }], names)).toBe('Dewizy');
    expect(upgradeGroup([{ type: 'divideCost', target: 'global', value: '1.5' }], names)).toBe('Koszty');
    expect(upgradeGroup([{ type: 'addFlat', target: 'global', value: '100' }], names)).toBe('Klikanie');
  });
});
