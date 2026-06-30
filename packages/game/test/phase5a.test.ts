// phase5a.test.ts — Faza 5A: mini-jezyk formul jako UCZCIWY kontrakt dla zewnetrznego DLC.
// Rdzen jezyka (lexer/parser/evaluator) jest sprawdzony w shared/formula.test.ts. Tu pilnujemy, ze:
//  (1) cala tresc bazowa wyraza krzywe/warunki formulami i waliduje sie bez bledow,
//  (2) przestrzenie nazw `tempo` i `doktryna` zwracaja REALNE wartosci (a nie placeholder 0),
//      udowodnione przez paczke-sonde, ktora odblokowuje sie wlasnie tymi warunkami.
import { describe, it, expect } from 'vitest';
import { Decimal, type Pack } from '@kombinat/shared';
import { loadContent } from '../src/engine/loader';
import { Engine } from '../src/engine/engine';
import { makeContext } from '../src/engine/context';
import { basePack } from '../src/content/base';

// Paczka-sonda: dwa generatory bramkowane wylacznie nowymi przestrzeniami nazw (tempo / doktryna).
// Produkcja 0 i absurdalny koszt — istnieje tylko po to, by sprawdzic odblokowanie, nie balans.
const probePack: Pack = {
  manifest: { id: 'probe', name: 'Sonda 5A', version: '1.0.0', schemaVersion: 1 },
  generators: [
    {
      id: 'probe.tempo',
      name: 'Sonda tempa',
      costResource: 'cykle',
      cost: '1e12',
      outputResource: 'cykle',
      production: '0',
      unlock: 'tempo.cykle >= 0.1',
    },
    {
      id: 'probe.doktryna',
      name: 'Sonda doktryny',
      costResource: 'cykle',
      cost: '1e12',
      outputResource: 'cykle',
      production: '0',
      unlock: 'doktryna.rdzen.dok_przemysl == 1',
    },
  ],
};

describe('5A — tresc bazowa to poprawne formuly', () => {
  it('paczka bazowa laduje sie bez bledow (wszystkie koszty/warunki sa formulami)', () => {
    const { ok, issues } = loadContent([basePack]);
    expect(issues.filter((i) => i.level === 'error')).toHaveLength(0);
    expect(ok).toBe(true);
  });

  it('paczka-sonda (tempo/doktryna w unlock) przechodzi walidacje — przestrzenie sa znane', () => {
    const { issues } = loadContent([basePack, probePack]);
    const errs = issues.filter((i) => i.level === 'error');
    expect(errs, JSON.stringify(errs)).toHaveLength(0);
  });
});

describe('5A — przestrzen `tempo` jest uczciwa (biezaca produkcja/sek)', () => {
  function probeEngine(): Engine {
    const { registry, ok } = loadContent([basePack, probePack]);
    expect(ok).toBe(true);
    return new Engine(registry);
  }

  it('przed produkcja tempo=0 → sonda zablokowana', () => {
    const e = probeEngine();
    expect(e.isUnlocked('probe.tempo')).toBe(false);
  });

  it('po ticku z produkcja tempo.cykle>0 → sonda odblokowana', () => {
    const e = probeEngine();
    e.state.generators['liczydlo'] = { owned: new Decimal(5) }; // 5 × 0,2/s = 1,0/s
    e.tick(1);
    expect(e.isUnlocked('probe.tempo')).toBe(true);
  });
});

describe('5A — przestrzen `doktryna` jest uczciwa (wybrana linia Zjazdu)', () => {
  it('bez doktryny zablokowana; po wyborze dok_przemysl odblokowana', () => {
    const { registry } = loadContent([basePack, probePack]);
    const e = new Engine(registry);
    expect(e.isUnlocked('probe.doktryna')).toBe(false);
    e.state.doctrine = 'rdzen.dok_przemysl';
    expect(e.isUnlocked('probe.doktryna')).toBe(true);
    e.state.doctrine = 'rdzen.dok_kredyty'; // inna linia → znowu zablokowana
    expect(e.isUnlocked('probe.doktryna')).toBe(false);
  });
});

describe('5A — resolver makeContext mapuje przestrzenie wprost', () => {
  it('tempo z wstrzyknietego pomiaru, doktryna ze stanu', () => {
    const { registry } = loadContent([basePack]);
    const e = new Engine(registry);
    e.state.doctrine = 'rdzen.dok_liberalizacja';
    const ctx = makeContext(e.state, { tempo: { cykle: new Decimal(7) } });
    expect((ctx.resolve('tempo.cykle') as Decimal).toNumber()).toBe(7);
    expect(ctx.resolve('tempo.dewizy')).toBeDefined(); // brak pomiaru → neutralne 0, nie undefined
    expect(ctx.resolve('doktryna.aktywna')).toBe(1);
    expect(ctx.resolve('doktryna.rdzen.dok_liberalizacja')).toBe(1);
    expect(ctx.resolve('doktryna.rdzen.dok_przemysl')).toBe(0);
  });
});
