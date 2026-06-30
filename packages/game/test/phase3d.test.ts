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

describe('Faza 3D — kadra (werbunek)', () => {
  it('postać niedostępna, dopóki niespełniony warunek odblokowania', () => {
    const e = eng();
    expect(e.isCharacterAvailable('rdzen.kadra_inzynier')).toBe(false);
    e.state.generators['mera400'] = { owned: new Decimal(1) };
    expect(e.isCharacterAvailable('rdzen.kadra_inzynier')).toBe(true);
  });

  it('werbunek pobiera koszt i zwiększa produkcję', () => {
    const e = eng();
    e.state.generators['mera400'] = { owned: new Decimal(1) };
    e.state.generators['liczydlo'] = { owned: new Decimal(50) };
    e.state.resources['cykle'] = new Decimal('1e6');
    const before = e.currentRates()['cykle']!.toNumber();
    const have = e.state.resources['cykle']!.toNumber();
    expect(e.recruitCharacter('rdzen.kadra_inzynier')).toBe(true);
    expect(e.state.characters['rdzen.kadra_inzynier']).toBe(true);
    expect(e.state.resources['cykle']!.toNumber()).toBeLessThan(have);
    expect(e.currentRates()['cykle']!.toNumber()).toBeGreaterThan(before);
  });

  it('werbunek nieudany bez wystarczających środków', () => {
    const e = eng();
    e.state.generators['mera400'] = { owned: new Decimal(1) };
    e.state.resources['cykle'] = new Decimal(10);
    expect(e.recruitCharacter('rdzen.kadra_inzynier')).toBe(false);
    expect(e.state.characters['rdzen.kadra_inzynier']).toBeUndefined();
  });

  it('kadra znika po Denominacji (bonus per-rozgrywka)', () => {
    const e = eng();
    e.state.generators['mera400'] = { owned: new Decimal(1) };
    e.state.resources['cykle'] = new Decimal('1e6');
    e.recruitCharacter('rdzen.kadra_inzynier');
    e.state.stats.runProduced['cykle'] = new Decimal('4e6');
    e.denominate();
    expect(e.state.characters['rdzen.kadra_inzynier']).toBeUndefined();
  });

  it('migawka pokazuje tylko dostępne lub zwerbowane postaci', () => {
    const e = eng();
    expect(e.snapshot().characters.length).toBe(0);
    e.state.generators['spectrum'] = { owned: new Decimal(1) };
    expect(e.snapshot().characters.some((c) => c.id === 'rdzen.kadra_cinkciarz')).toBe(true);
  });
});

describe('Faza 3D — giełda / kantor', () => {
  it('giełda zablokowana na starcie, odblokowana po posiadaniu Spectrum', () => {
    const e = eng();
    expect(e.gieldaUnlocked()).toBe(false);
    e.state.generators['spectrum'] = { owned: new Decimal(1) };
    expect(e.gieldaUnlocked()).toBe(true);
  });

  it('kupno zamienia cykle na dewizy', () => {
    const e = eng();
    e.state.generators['spectrum'] = { owned: new Decimal(1) };
    e.state.resources['cykle'] = new Decimal('1e6');
    e.state.resources['dewizy'] = new Decimal(0);
    e.exchange('buy', 1);
    expect(e.state.resources['cykle']!.toNumber()).toBeLessThan(1e6);
    expect(e.state.resources['dewizy']!.toNumber()).toBeGreaterThan(0);
  });

  it('obrót w obie strony jest stratny (prowizja)', () => {
    const e = eng();
    e.state.generators['spectrum'] = { owned: new Decimal(1) };
    e.state.resources['cykle'] = new Decimal('1e6');
    e.state.resources['dewizy'] = new Decimal(0);
    e.exchange('buy', 1); // wszystkie cykle -> dewizy
    e.exchange('sell', 1); // wszystkie dewizy -> cykle
    expect(e.state.resources['cykle']!.toNumber()).toBeLessThan(1e6);
  });

  it('migawka niesie kurs i status odblokowania', () => {
    const e = eng();
    e.state.generators['spectrum'] = { owned: new Decimal(1) };
    const g = e.snapshot().gielda;
    expect(g.unlocked).toBe(true);
    expect(g.rateRaw).toBeGreaterThan(0);
    expect(['up', 'down', 'flat']).toContain(g.trend);
  });

  it('kurs jest NIEWIELKI — dewiza to kilka–kilkanaście cykli, nie absurd (stała baza)', () => {
    const e = eng();
    e.state.generators['spectrum'] = { owned: new Decimal(1) };
    // Nawet przy gigantycznej produkcji cykli kurs zostaje mały (baza stała, nie stosunek produkcji).
    e.state.generators['mazovia'] = { owned: new Decimal('1e6') };
    const r = e.snapshot().gielda.rateRaw;
    expect(r).toBeGreaterThan(3);
    expect(r).toBeLessThan(30);
  });
});

describe('Faza 3D — minigra', () => {
  it('nagroda za jakość 1 dodaje cykle, jakość 0 nie', () => {
    const e = eng();
    const start = (e.state.resources['cykle'] ?? new Decimal(0)).toNumber();
    e.minigameReward(0);
    expect((e.state.resources['cykle'] ?? new Decimal(0)).toNumber()).toBe(start);
    e.minigameReward(1);
    expect((e.state.resources['cykle'] ?? new Decimal(0)).toNumber()).toBeGreaterThan(start);
  });
});

describe('Faza 3D — pauza zdarzeń (immersja minigry)', () => {
  it('żadne zdarzenie nie wyskakuje, gdy zdarzenia są zapauzowane', () => {
    const e = eng();
    e.setEventsPaused(true);
    e.state.generators['mera400'] = { owned: new Decimal(1) }; // warunek story-beatu SB
    e.updateEvents(Date.now());
    expect(e.snapshot().activeEvent).toBeNull();
    e.setEventsPaused(false);
    e.updateEvents(Date.now());
    expect(e.snapshot().activeEvent).not.toBeNull();
  });
});
