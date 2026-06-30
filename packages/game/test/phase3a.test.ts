import { describe, it, expect } from 'vitest';
import { Decimal } from '@kombinat/shared';
import { loadContent } from '../src/engine/loader';
import { Engine } from '../src/engine/engine';
import { basePack } from '../src/content/base';

function eng(): Engine {
  const { registry, ok, issues } = loadContent([basePack]);
  expect(ok, JSON.stringify(issues.filter((i) => i.level === 'error'))).toBe(true);
  return new Engine(registry);
}

describe('Faza 3A — silnik zdarzeń', () => {
  it('story-beat odpala się, gdy warunek spełniony', () => {
    const e = eng();
    e.state.generators['mera400'] = { owned: new Decimal(1) };
    e.updateEvents(Date.now());
    expect(e.snapshot().activeEvent?.id).toBe('rdzen.ev_sb_wizyta');
  });

  it('łańcuch: opcja z triggerEvent odpala kolejne ogniwo', () => {
    const e = eng();
    e.state.generators['mera400'] = { owned: new Decimal(1) };
    e.updateEvents(Date.now());
    e.chooseEventOption(1); // „Zbywać” → triggerEvent ev_sb_powrot
    e.updateEvents(Date.now());
    expect(e.snapshot().activeEvent?.id).toBe('rdzen.ev_sb_powrot');
  });

  it('decyzja stosuje efekty i nie schodzi poniżej zera', () => {
    const e = eng();
    e.state.resources['cykle'] = new Decimal(10000);
    e.state.generators['mera400'] = { owned: new Decimal(1) };
    e.updateEvents(Date.now());
    e.chooseEventOption(0); // setFlag sb_zna=1 + grantResource -2% cykli
    expect(e.state.flags['sb_zna']).toBe(1);
    const c = e.state.resources['cykle']!.toNumber();
    expect(c).toBeLessThan(10000);
    expect(c).toBeGreaterThan(0);
    expect(e.snapshot().activeEvent).toBeNull();
  });

  it('zdarzenie once nie wraca po rozstrzygnięciu', () => {
    const e = eng();
    e.state.generators['mera400'] = { owned: new Decimal(1) };
    e.updateEvents(Date.now());
    e.chooseEventOption(0);
    e.updateEvents(Date.now());
    expect(e.snapshot().activeEvent).toBeNull();
  });
});

describe('Faza 3A — Leksykon', () => {
  it('wpis odblokowuje się po zdobyciu treści', () => {
    const e = eng();
    const before = e.snapshot().lexicon.entries.find((x) => x.id === 'rdzen.lex_k202');
    expect(before?.unlocked).toBe(false);
    e.state.generators['k202'] = { owned: new Decimal(1) };
    e.tick(0.05);
    const after = e.snapshot().lexicon.entries.find((x) => x.id === 'rdzen.lex_k202');
    expect(after?.unlocked).toBe(true);
  });

  it('kolekcja Leksykonu przeżywa Denominację', () => {
    const e = eng();
    e.state.generators['k202'] = { owned: new Decimal(1) };
    e.tick(0.05);
    e.state.stats.runProduced['cykle'] = new Decimal('4e6');
    e.denominate();
    expect(e.state.lexiconUnlocked['rdzen.lex_k202']).toBe(true);
  });
});
