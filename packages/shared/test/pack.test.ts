import { describe, it, expect } from 'vitest';
import { validatePack, buildRegistry, mergeOrder, type Pack } from '../src/index';

const goodPack: Pack = {
  manifest: { id: 'baza', name: 'Baza', version: '1.0.0', schemaVersion: 1 },
  resources: [{ id: 'cykle', name: 'cykle' }],
  generators: [
    {
      id: 'liczydlo',
      name: 'Liczydlo',
      costResource: 'cykle',
      cost: '15 * 1.15 ^ posiadane',
      outputResource: 'cykle',
      production: '0.2',
      unlock: 'true',
    },
  ],
};

describe('validatePack', () => {
  it('przepuszcza poprawna paczke', () => {
    const res = validatePack(goodPack);
    expect(res.ok).toBe(true);
    expect(res.issues.filter((i) => i.level === 'error')).toHaveLength(0);
  });

  it('lapie bledna formule z podaniem sciezki', () => {
    const bad = JSON.parse(JSON.stringify(goodPack)) as Pack;
    bad.generators![0]!.cost = '15 * ('; // niedokonczony nawias
    const res = validatePack(bad);
    expect(res.ok).toBe(false);
    expect(res.issues.some((i) => i.level === 'error' && i.path === 'generators[0].cost')).toBe(true);
  });

  it('odrzuca nieznany typ efektu', () => {
    const bad: Pack = {
      manifest: { id: 'x', name: 'X', version: '1.0.0', schemaVersion: 1 },
      upgrades: [
        {
          id: 'x.u1',
          name: 'U1',
          costResource: 'cykle',
          cost: '10',
          effects: [{ type: 'doWhatever', target: 'global', value: '2' }],
        },
      ],
    };
    const res = validatePack(bad);
    expect(res.ok).toBe(false);
    expect(res.issues.some((i) => i.message.includes('doWhatever'))).toBe(true);
  });

  it('ostrzega o ID bez prefiksu paczki', () => {
    const pack: Pack = {
      manifest: { id: 'nrd', name: 'NRD', version: '1.0.0', schemaVersion: 1 },
      generators: [
        {
          id: 'robotron', // brak prefiksu 'nrd.'
          name: 'Robotron',
          costResource: 'cykle',
          cost: '100',
          outputResource: 'cykle',
          production: '8',
        },
      ],
      resources: [{ id: 'cykle', name: 'cykle' }],
    };
    const res = validatePack(pack);
    expect(res.issues.some((i) => i.level === 'warning' && i.message.includes('robotron'))).toBe(true);
  });
});

describe('buildRegistry', () => {
  it('scala paczke i porzadkuje generatory', () => {
    const { registry, issues } = buildRegistry([goodPack]);
    expect(issues.filter((i) => i.level === 'error')).toHaveLength(0);
    expect(registry.generators.has('liczydlo')).toBe(true);
    expect(registry.generatorOrder).toEqual(['liczydlo']);
  });

  it('flaguje generator wskazujacy nieistniejacy zasob', () => {
    const bad: Pack = {
      manifest: { id: 'baza', name: 'Baza', version: '1.0.0', schemaVersion: 1 },
      resources: [{ id: 'cykle', name: 'cykle' }],
      generators: [
        {
          id: 'liczydlo',
          name: 'Liczydlo',
          costResource: 'dewizy', // nie istnieje w tej paczce
          cost: '15',
          outputResource: 'cykle',
          production: '1',
        },
      ],
    };
    const { issues } = buildRegistry([bad]);
    expect(issues.some((i) => i.level === 'error' && i.message.includes('dewizy'))).toBe(true);
  });

  it('mergeOrder jest deterministyczny wg priorytetu i id', () => {
    const a: Pack = { manifest: { id: 'aaa', name: 'A', version: '1.0.0', schemaVersion: 1, priority: 5 } };
    const b: Pack = { manifest: { id: 'bbb', name: 'B', version: '1.0.0', schemaVersion: 1, priority: 0 } };
    const c: Pack = { manifest: { id: 'ccc', name: 'C', version: '1.0.0', schemaVersion: 1, priority: 0 } };
    const order = mergeOrder([a, b, c]).map((p) => p.manifest.id);
    expect(order).toEqual(['bbb', 'ccc', 'aaa']);
  });
});

// --- Faza 5B: łatki (pre-patch) i synergie ---

function freshCore(): Pack {
  return JSON.parse(JSON.stringify(goodPack)) as Pack; // klon — buildRegistry mutuje cele łatek
}
function dlc(id: string, patches: Pack['patches']): Pack {
  return { manifest: { id, name: id, version: '1.0.0', schemaVersion: 1 }, patches };
}

describe('buildRegistry — łatki (DLC 8.4 / Faza 5B)', () => {
  it('set nadpisuje pole istniejącej treści rdzenia', () => {
    const { registry, issues } = buildRegistry([freshCore(), dlc('mod', [{ target: 'generator:liczydlo', set: { flavor: 'Nowy opis.' } }])]);
    expect(issues.filter((i) => i.level === 'error')).toHaveLength(0);
    expect(registry.generators.get('liczydlo')!.flavor).toBe('Nowy opis.');
  });

  it('łatka w nieistniejący cel = błąd', () => {
    const { issues } = buildRegistry([freshCore(), dlc('mod', [{ target: 'generator:nieistnieje', set: { flavor: 'x' } }])]);
    expect(issues.some((i) => i.level === 'error' && i.message.includes('nieistnieje'))).toBe(true);
  });

  it('dwie łatki w to samo pole = ostrzeżenie o kumulacji, ostatnia (wg kolejności) wygrywa', () => {
    const p1 = dlc('aaa', [{ target: 'generator:liczydlo', set: { flavor: 'A' } }]);
    const p2 = dlc('zzz', [{ target: 'generator:liczydlo', set: { flavor: 'Z' } }]);
    const { registry, issues } = buildRegistry([freshCore(), p2, p1]); // mergeOrder: baza, aaa, zzz
    expect(registry.generators.get('liczydlo')!.flavor).toBe('Z');
    expect(issues.some((i) => i.level === 'warning' && i.message.includes('kumulacja'))).toBe(true);
  });

  it('addCondition zaostrza unlock (AND z istniejącym warunkiem)', () => {
    const { registry } = buildRegistry([freshCore(), dlc('mod', [{ target: 'generator:liczydlo', addCondition: 'zasob.cykle >= 100' }])]);
    const u = registry.generators.get('liczydlo')!.unlock!;
    expect(u).toContain('and');
    expect(u).toContain('zasob.cykle >= 100');
  });

  it('łatka nie może zmienić id (ostrzeżenie, id zostaje)', () => {
    const { registry, issues } = buildRegistry([freshCore(), dlc('mod', [{ target: 'generator:liczydlo', set: { id: 'podmiana', flavor: 'ok' } }])]);
    expect(registry.generators.get('liczydlo')!.id).toBe('liczydlo');
    expect(registry.generators.get('liczydlo')!.flavor).toBe('ok'); // reszta pól łaty wchodzi
    expect(issues.some((i) => i.level === 'warning' && i.message.includes("'id'"))).toBe(true);
  });
});

describe('validatePack — synergie i warunki (Faza 5B)', () => {
  it('synergia bez requiresPack = błąd', () => {
    const bad = { manifest: { id: 's', name: 'S', version: '1.0.0', schemaVersion: 1 }, synergies: [{ requiresPack: '', effects: [] }] } as unknown as Pack;
    expect(validatePack(bad).issues.some((i) => i.level === 'error' && (i.path ?? '').includes('requiresPack'))).toBe(true);
  });

  it('zła formuła w condition efektu = błąd ze ścieżką', () => {
    const bad: Pack = {
      manifest: { id: 's', name: 'S', version: '1.0.0', schemaVersion: 1 },
      upgrades: [{ id: 's.u', name: 'U', costResource: 'cykle', cost: '10', effects: [{ type: 'multiplyProduction', target: 'global', value: '2', condition: '1 +' }] }],
    };
    expect(validatePack(bad).issues.some((i) => i.level === 'error' && (i.path ?? '').includes('condition'))).toBe(true);
  });
});
