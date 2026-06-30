import { describe, it, expect } from 'vitest';
import { buildRegistry, resolveVisualIdentity, type Pack, type TrustTier } from '../src/index';

const core: Pack = {
  manifest: { id: 'rdzen', name: 'Rdzeń', version: '1.0.0', schemaVersion: 1, priority: 0, visualIdentity: { accentColor: '#5fa86a' } },
  resources: [{ id: 'cykle', name: 'cykle' }],
  generators: [{ id: 'liczydlo', name: 'Liczydło', costResource: 'cykle', cost: '15', outputResource: 'cykle', production: '0.2' }],
};
const dlc: Pack = {
  manifest: { id: 'nrd', name: 'NRD', version: '1.0.0', schemaVersion: 1, priority: 10, visualIdentity: { accentColor: '#c0392b', icon: 'robotron' } },
  generators: [{ id: 'nrd.robotron', name: 'Robotron', costResource: 'cykle', cost: '100', outputResource: 'cykle', production: '8' }],
};
const plain: Pack = {
  // paczka BEZ tożsamości wizualnej — jej treść nie dostaje akcentu (bez szwu)
  manifest: { id: 'szara', name: 'Szara', version: '1.0.0', schemaVersion: 1, priority: 20 },
  generators: [{ id: 'szara.maszyna', name: 'Maszyna', costResource: 'cykle', cost: '50', outputResource: 'cykle', production: '4' }],
};

describe('5D — resolveVisualIdentity (pochodzenie + akcent)', () => {
  it('treść zna swoją paczkę i jej akcent', () => {
    const { registry } = buildRegistry([core, dlc, plain]);
    expect(registry.packOf.get('liczydlo')).toBe('rdzen');
    expect(registry.packOf.get('nrd.robotron')).toBe('nrd');

    const v = resolveVisualIdentity(registry, 'nrd.robotron');
    expect(v?.packId).toBe('nrd');
    expect(v?.accentColor).toBe('#c0392b');
    expect(v?.icon).toBe('robotron');
    expect(v?.official).toBe(false); // bez podanego zaufania
  });

  it('paczka BEZ visualIdentity → brak akcentu (null, treść natywna)', () => {
    const { registry } = buildRegistry([core, dlc, plain]);
    expect(resolveVisualIdentity(registry, 'szara.maszyna')).toBeNull();
  });

  it('zaufanie „official" daje sygnaturę oficjalną; inaczej społecznościowa', () => {
    const { registry } = buildRegistry([core, dlc]);
    const trust = new Map<string, TrustTier>([['nrd', 'official']]);
    expect(resolveVisualIdentity(registry, 'nrd.robotron', trust)?.official).toBe(true);
    const trust2 = new Map<string, TrustTier>([['nrd', 'intact']]);
    expect(resolveVisualIdentity(registry, 'nrd.robotron', trust2)?.official).toBe(false);
  });

  it('nieznane id → null', () => {
    const { registry } = buildRegistry([core]);
    expect(resolveVisualIdentity(registry, 'nie.ma')).toBeNull();
  });
});
