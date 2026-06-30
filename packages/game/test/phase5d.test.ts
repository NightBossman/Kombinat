// phase5d.test.ts — Faza 5D: tożsamość wizualna paczek na żywym silniku. Treść DLC dostaje akcent +
// pieczęć (z manifestu, automatycznie); treść RDZENIA wygląda natywnie (bez akcentu, bez pieczęci).
import { describe, it, expect } from 'vitest';
import { type Pack, type TrustTier } from '@kombinat/shared';
import { loadContent } from '../src/engine/loader';
import { Engine } from '../src/engine/engine';
import { basePack } from '../src/content/base';

const dlc: Pack = {
  manifest: { id: 'nrd', name: 'NRD', version: '1.0.0', schemaVersion: 1, priority: 10, visualIdentity: { accentColor: '#c0392b', icon: 'robotron' } },
  generators: [
    { id: 'nrd.robotron', name: 'Robotron', costResource: 'cykle', cost: '100 * 1.15 ^ posiadane', outputResource: 'cykle', production: '8', unlock: 'true' },
  ],
};

function eng(): Engine {
  const { registry, ok, issues } = loadContent([basePack, dlc]);
  expect(ok, JSON.stringify(issues)).toBe(true);
  return new Engine(registry);
}

describe('5D — akcent i pieczęć DLC w migawce', () => {
  it('treść DLC niesie akcent z manifestu i pieczęć społecznościową; rdzeń bez szwu', () => {
    const e = eng();
    const gens = e.snapshot().generators;
    const robotron = gens.find((g) => g.id === 'nrd.robotron');
    expect(robotron?.accent).toBe('#c0392b');
    expect(robotron?.dlcSeal).toBe('community'); // brak podpisu → społecznościowa

    const liczydlo = gens.find((g) => g.id === 'liczydlo');
    expect(liczydlo?.accent).toBeUndefined(); // rdzeń wygląda natywnie
    expect(liczydlo?.dlcSeal).toBeUndefined();
  });

  it('paczka oznaczona jako oficjalna dostaje pieczęć oficjalną', () => {
    const e = eng();
    e.trustByPack = new Map<string, TrustTier>([['nrd', 'official']]);
    const robotron = e.snapshot().generators.find((g) => g.id === 'nrd.robotron');
    expect(robotron?.dlcSeal).toBe('official');
    expect(robotron?.accent).toBe('#c0392b');
  });
});
