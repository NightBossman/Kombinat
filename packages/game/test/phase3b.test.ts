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

describe('Faza 3B — osiągnięcia', () => {
  it('pula osiągnięć liczy co najmniej 300', () => {
    const { registry } = loadContent([basePack]);
    expect(registry.achievements.size).toBeGreaterThanOrEqual(300);
  });

  it('osiągnięcie zdobywane, gdy warunek spełniony', () => {
    const e = eng();
    e.state.generators['liczydlo'] = { owned: new Decimal(10) };
    e.checkAchievements();
    expect(e.state.achievements['rdzen.a_liczydlo_10']).toBe(true);
    expect(e.snapshot().achievements.earned).toBeGreaterThan(0);
  });

  it('osiągnięcia przeżywają Denominację', () => {
    const e = eng();
    e.state.generators['liczydlo'] = { owned: new Decimal(10) };
    e.checkAchievements();
    e.state.stats.runProduced['cykle'] = new Decimal('4e6');
    e.denominate();
    expect(e.state.achievements['rdzen.a_liczydlo_10']).toBe(true);
  });

  it('mnożnik z osiągnięć nieaktywny bez węzła, aktywny po nim (retroaktywnie)', () => {
    const e = eng();
    e.state.generators['liczydlo'] = { owned: new Decimal(10) };
    e.checkAchievements(); // zdobywa liczydlo ×1/×5/×10
    e.state.resources['odznaczenia'] = new Decimal(500);
    // łańcuch konaru „aparat": teczka → etat → premia (3 poziomy!) → tablica (enableAchievementMultipliers)
    e.buyTreeNode('rdzen.t_teczka');
    e.buyTreeNode('rdzen.t_etat');
    e.buyTreeNode('rdzen.t_premia'); // poziom 1
    e.buyTreeNode('rdzen.t_premia'); // poziom 2
    e.buyTreeNode('rdzen.t_premia'); // poziom 3 (max — odblokowuje dalej)
    const before = e.currentRates()['cykle']!.toNumber(); // BEZ mnożników osiągnięć
    expect(e.buyTreeNode('rdzen.t_tablica')).toBe(true);
    const after = e.currentRates()['cykle']!.toNumber();
    expect(after).toBeGreaterThan(before);
  });

  it('osiagniecia.zdobyte odzwierciedla licznik', () => {
    const e = eng();
    expect(e.snapshot().achievements.earned).toBe(0);
    e.state.generators['liczydlo'] = { owned: new Decimal(1) };
    e.checkAchievements();
    expect(e.snapshot().achievements.earned).toBeGreaterThan(0);
  });

  it('świeżo zdobyte trafia do migawki (toast) i jest opróżniane po wysłaniu', () => {
    const e = eng();
    e.state.generators['liczydlo'] = { owned: new Decimal(10) };
    e.checkAchievements();
    const first = e.snapshot();
    expect(first.achievements.justEarned.length).toBeGreaterThan(0);
    expect(first.achievements.justEarned[0]!.earned).toBe(true);
    // druga migawka — bufor już pusty (każde zdobycie zgłaszane dokładnie raz)
    expect(e.snapshot().achievements.justEarned.length).toBe(0);
  });

  it('sekretne osiągnięcie ukryte, gdy niezdobyte', () => {
    const e = eng();
    const secret = e.achievementsList().find((a) => a.id === 'rdzen.a_nocna_zmiana');
    expect(secret).toBeTruthy();
    if (secret && !secret.earned) expect(secret.name).toBe('???');
  });
});
