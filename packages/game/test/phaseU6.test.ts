// phaseU6.test.ts — BRAMKA CAŁOŚCI inicjatywy „rozbudowa ulepszeń" (U6, docs/ULEPSZENIA.md).
// Dowodzi, że przy PEŁNEJ zawartości (wszystko wykupione/wyzwolone: setki ulepszeń + kamieni milowych +
// osiągnięć + całe drzewo) gra pozostaje: WYDAJNA (tick/migawka/recompute w budżecie), STABILNA (brak NaN,
// wielokrotna Denominacja OK), ROZSĄDNA w rozmiarze zapisu, oraz że liczba jest czterocyfrowa, a treść
// generowana ma klimat (bez „#N"/undefined). Asercje z zapasem — mają udowodnić, że jest LUŹNO.
import { describe, it, expect } from 'vitest';
import { Decimal } from '@kombinat/shared';
import { loadContent } from '../src/engine/loader';
import { Engine } from '../src/engine/engine';
import { basePack } from '../src/content/base';
import { serializeState, deserializeState } from '../src/engine/state';
import { buildGeneratedUpgrades } from '../src/content/base/genUpgrades';
import { buildMinigameUpgrades } from '../src/content/base/genMinigame';
import { buildGeneratedTree } from '../src/content/base/genTree';
import { buildGeneratedMilestones } from '../src/content/base/genMilestones';

function maxed(): Engine {
  const { registry, ok, issues } = loadContent([basePack]);
  expect(ok, JSON.stringify(issues.filter((i) => i.level === 'error'))).toBe(true);
  const e = new Engine(registry);
  for (const id of registry.generators.keys()) e.state.generators[id] = { owned: new Decimal(5000) };
  e.state.resources['cykle'] = new Decimal('1e30');
  e.state.resources['dewizy'] = new Decimal('1e18');
  e.state.resources['odznaczenia'] = new Decimal('1e6');
  for (const id of registry.upgrades.keys()) e.state.upgrades[id] = true; // WSZYSTKIE ulepszenia
  for (const [id, n] of registry.treeNodes) e.state.treeNodes[id] = n.levels ?? 1; // CAŁE drzewo na maks
  for (const id of registry.milestones.keys()) e.state.milestones[id] = true; // WSZYSTKIE kamienie
  for (const id of registry.characters.keys()) e.state.characters[id] = true; // cała kadra
  // WSZYSTKIE osiągnięcia ustawiamy WPROST z rejestru — nie przez checkAchievements(), które przyznałoby
  // tylko te, których warunek spełnia syntetyczny stan (pominęłoby m.in. osiągnięcia za denominacje, czas
  // gry i liczniki minigier). computeModifiers sumuje mnożniki tylko dla state.achievements[id], więc bez
  // tego bramka mierzyłaby LŻEJSZY przypadek niż „pełna zawartość".
  for (const id of registry.achievements.keys()) e.state.achievements[id] = true;
  e.state.flags['osiagniecia_mnoznik'] = 1; // najcięższa ścieżka: mnożniki z osiągnięć aktywne
  e.recomputeModifiers();
  return e;
}

describe('U6 — wydajność przy pełnej zawartości', () => {
  it('recomputeModifiers (suma setek ulepszeń+kamieni+osiągnięć) jest tanie', () => {
    const e = maxed();
    // gwarancja, że mierzymy PEŁNĄ zawartość: wszystkie ulepszenia, kamienie i osiągnięcia są zaliczone
    expect(Object.keys(e.state.upgrades).length).toBe(e.registry.upgrades.size);
    expect(Object.keys(e.state.milestones).length).toBe(e.registry.milestones.size);
    expect(Object.keys(e.state.achievements).length).toBe(e.registry.achievements.size);
    const N = 200;
    const t0 = performance.now();
    for (let i = 0; i < N; i++) e.recomputeModifiers();
    const per = (performance.now() - t0) / N;
    console.log(`[U6] recomputeModifiers: ${per.toFixed(3)} ms/op`);
    expect(per).toBeLessThan(10);
  });

  it('migawka i tick mieszczą się w budżecie (10 Hz / 20 Hz)', () => {
    const e = maxed();
    e.snapshot();
    let t0 = performance.now();
    for (let i = 0; i < 200; i++) e.snapshot();
    const snap = (performance.now() - t0) / 200;
    t0 = performance.now();
    for (let i = 0; i < 300; i++) e.tick(0.05);
    const tick = (performance.now() - t0) / 300;
    console.log(`[U6] snapshot: ${snap.toFixed(3)} ms · tick: ${tick.toFixed(3)} ms`);
    expect(snap).toBeLessThan(30);
    expect(tick).toBeLessThan(15);
  });

  it('rozmiar zapisu jest rozsądny, a round-trip zachowuje stan', () => {
    const e = maxed();
    const json = JSON.stringify(serializeState(e.state));
    console.log(`[U6] save JSON: ${(json.length / 1024).toFixed(1)} KB`);
    expect(json.length).toBeLessThan(400 * 1024); // surowy JSON < 400 KB (potem kompresja fflate w .k7)
    const restored = deserializeState(JSON.parse(json), e.registry);
    expect(Object.keys(restored.upgrades).length).toBe(Object.keys(e.state.upgrades).length);
    expect(Object.keys(restored.milestones).length).toBe(Object.keys(e.state.milestones).length);
    expect(Object.keys(restored.treeNodes).length).toBe(Object.keys(e.state.treeNodes).length);
  });
});

describe('U6 — stabilność i balans', () => {
  it('żadne tempo nie jest NaN przy pełnej zawartości', () => {
    const e = maxed();
    for (const [id, r] of Object.entries(e.currentRates())) {
      expect(Number.isNaN(r.toNumber()), `tempo ${id} = NaN`).toBe(false);
    }
    const snap = e.snapshot();
    expect(snap.clickPower).not.toContain('NaN');
    for (const rv of snap.resources) expect(`${rv.amount} ${rv.rate}`).not.toContain('NaN');
  });

  it('wielokrotna Denominacja z pełną zawartością nie wywala i zachowuje drzewo', () => {
    const e = maxed();
    const treeCount = Object.keys(e.state.treeNodes).length;
    for (let i = 0; i < 3; i++) {
      e.state.stats.runProduced['cykle'] = new Decimal('1e20');
      expect(e.denominate()).not.toBeNull();
    }
    expect(e.state.stats.denominations).toBe(3);
    expect(Object.keys(e.state.treeNodes).length).toBe(treeCount); // drzewo TRWAŁE
    expect(Object.keys(e.state.upgrades).length).toBe(0); // ulepszenia zresetowane
    // po Denominacji gra dalej liczy sensownie
    e.tick(0.3);
    expect(Number.isNaN(e.currentRates()['cykle']?.toNumber() ?? 0)).toBe(false);
  });
});

describe('U6 — liczba i klimat (bez wypełniacza)', () => {
  it('łączna liczba trwałych bonusów ≥ 1000', () => {
    const total =
      (basePack.upgrades?.length ?? 0) +
      (basePack.treeNodes?.length ?? 0) +
      (basePack.milestones?.length ?? 0) +
      (basePack.achievements?.length ?? 0) +
      (basePack.characters?.length ?? 0) +
      (basePack.doctrines?.length ?? 0) +
      (basePack.diplomacy?.length ?? 0);
    console.log(`[U6] łączna liczba trwałych bonusów: ${total}`);
    expect(total).toBeGreaterThanOrEqual(1000);
  });

  it('nazwy generowanych wpisów są klimatyczne (bez „#", undefined, pustych)', () => {
    const named = [...buildGeneratedUpgrades(), ...buildMinigameUpgrades(), ...buildGeneratedMilestones()];
    for (const x of named) {
      expect(x.name.trim().length, x.id).toBeGreaterThan(2);
      expect(x.name, x.id).not.toContain('#');
      expect(x.name, x.id).not.toContain('undefined');
    }
    for (const n of buildGeneratedTree()) {
      expect(n.name.trim().length, n.id).toBeGreaterThan(2);
      expect(n.name, n.id).not.toContain('undefined');
    }
  });
});
