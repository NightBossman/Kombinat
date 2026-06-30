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

describe('Faza 4B — Zjazd PZPR + doktryny', () => {
  it('Zjazd odblokowany dopiero po pierwszej Denominacji', () => {
    const e = eng();
    expect(e.zjazdUnlocked()).toBe(false);
    e.state.stats.denominations = 1;
    expect(e.zjazdUnlocked()).toBe(true);
  });

  it('doktryna nakłada TRWAŁE modyfikatory na całą pięciolatkę', () => {
    const e = eng();
    e.state.generators['liczydlo'] = { owned: new Decimal(10) };
    const before = e.currentRates()['cykle']!.toNumber();
    expect(e.chooseDoctrine('rdzen.dok_przemysl')).toBe(true); // cała produkcja ×2
    const after = e.currentRates()['cykle']!.toNumber();
    expect(after).toBeGreaterThan(before * 1.9);
  });

  it('„Dobra konsumpcyjne" podbijają produkcję dewiz', () => {
    const e = eng();
    e.state.generators['spectrum'] = { owned: new Decimal(5) }; // produkuje dewizy
    const before = e.currentRates()['dewizy']?.toNumber() ?? 0;
    expect(before).toBeGreaterThan(0);
    e.chooseDoctrine('rdzen.dok_konsumpcja');
    const after = e.currentRates()['dewizy']!.toNumber();
    expect(after).toBeGreaterThan(before);
  });

  it('doktryna resetuje się przy Denominacji (nowa pięciolatka = nowy wybór)', () => {
    const e = eng();
    e.chooseDoctrine('rdzen.dok_przemysl');
    expect(e.state.doctrine).toBe('rdzen.dok_przemysl');
    e.state.stats.runProduced['cykle'] = new Decimal('4e6');
    e.denominate();
    expect(e.state.doctrine).toBe('');
  });

  it('„Kredyty zachodnie": boom teraz, bomba zadłużenia po czasie (boom-bust gierkowski)', () => {
    const e = eng();
    e.state.generators['liczydlo'] = { owned: new Decimal(10) };
    e.state.resources['dewizy'] = new Decimal(1000);
    const neutral = e.currentRates()['cykle']!.toNumber();
    e.chooseDoctrine('rdzen.dok_kredyty');
    const boom = e.currentRates()['cykle']!.toNumber();
    expect(boom).toBeGreaterThan(neutral); // BOOM

    e.tick(100); // przed progiem 150 s — spokój
    expect(e.state.flags['kryzys_fired']).toBeFalsy();
    e.tick(60); // łącznie 160 s — wpina się zdarzenie kryzysu
    expect(e.state.flags['kryzys_fired']).toBe(1);

    e.updateEvents(Date.now()); // aktywuje zakolejkowane zdarzenie kryzysu
    e.chooseEventOption(0); // „przełknij" — ustawia flagę kryzysu
    expect(e.state.flags['kryzys']).toBe(1);
    const bust = e.currentRates()['cykle']!.toNumber();
    expect(bust).toBeLessThan(boom); // BUST — produkcja w dół do końca pięciolatki
  });

  it('migawka niesie panel Zjazdu (doktryny + bomba + aktywna)', () => {
    const e = eng();
    const z0 = e.snapshot().zjazd;
    expect(z0.unlocked).toBe(false);
    expect(z0.doctrines.length).toBeGreaterThanOrEqual(4);
    expect(z0.doctrines.some((d) => d.id === 'rdzen.dok_kredyty' && d.hasDebt)).toBe(true);
    expect(z0.activeId).toBe('');
    e.chooseDoctrine('rdzen.dok_liberalizacja');
    const z1 = e.snapshot().zjazd;
    expect(z1.activeId).toBe('rdzen.dok_liberalizacja');
    expect(z1.activeName.length).toBeGreaterThan(0);
  });
});
