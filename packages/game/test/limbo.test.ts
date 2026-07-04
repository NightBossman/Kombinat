// limbo.test.ts — „limbo" MIĘDZY pięciolatkami (0.4.3): po Denominacji stara gra jest skończona, a nowa
// STOI (nic nie produkuje), dopóki gracz nie przejdzie ceremonia → drzewo → (Zjazd) → plansza. Etap jest
// TRWAŁY w save (można wrócić do niego po zamknięciu gry). Formalny start = wyjście z limbo ('play').
import { describe, it, expect } from 'vitest';
import { Decimal } from '@kombinat/shared';
import { loadContent } from '../src/engine/loader';
import { Engine } from '../src/engine/engine';
import { serializeState, deserializeState } from '../src/engine/state';
import { basePack } from '../src/content/base';

function eng(): Engine {
  const { registry, ok, issues } = loadContent([basePack]);
  expect(ok, JSON.stringify(issues.filter((i) => i.level === 'error'))).toBe(true);
  const e = new Engine(registry);
  e.state.generators['liczydlo'] = { owned: new Decimal(100) };
  e.state.stats.runProduced['cykle'] = new Decimal('1e14'); // żeby Denominacja dała odznaczenia
  e.state.stats.producedTotal['cykle'] = new Decimal('1e14');
  e.recomputeModifiers();
  return e;
}

describe('Limbo między pięciolatkami', () => {
  it('Denominacja wchodzi w limbo (faza ceremony) i zapamiętuje zysk odznaczeń', () => {
    const e = eng();
    expect(e.denominate()).not.toBeNull();
    expect(e.state.interRun).toBe('ceremony');
    expect(e.snapshot().interRun.phase).toBe('ceremony');
    expect(e.state.interRunGain.gt(0)).toBe(true);
  });

  it('w limbo GRA STOI — ani tick, ani catchUp nic nie produkują', () => {
    const e = eng();
    e.denominate();
    e.state.generators['liczydlo'] = { owned: new Decimal(100) }; // nowa gra ma sprzęt, ale STOI
    e.recomputeModifiers();
    const before = (e.state.resources['cykle'] ?? new Decimal(0)).toString();
    e.tick(10);
    expect(e.state.resources['cykle']!.toString(), 'tick nie może produkować w limbo').toBe(before);
    const cu = e.catchUp(3600);
    expect(cu.seconds).toBe(0);
    expect(cu.gains.length).toBe(0);
  });

  it('wyjście z limbo (play) wznawia produkcję i zeruje fazę', () => {
    const e = eng();
    e.denominate();
    e.setInterRun('play');
    expect(e.state.interRun).toBe('');
    expect(e.snapshot().interRun.phase).toBe('');
    e.state.generators['liczydlo'] = { owned: new Decimal(100) };
    e.recomputeModifiers();
    const before = (e.state.resources['cykle'] ?? new Decimal(0)).toNumber();
    e.tick(1);
    expect(e.state.resources['cykle']!.toNumber()).toBeGreaterThan(before);
  });

  it('zatwierdzenie doktryny domyka Zjazd → plansza (splash), nie od razu play', () => {
    const e = eng();
    e.denominate();
    e.setInterRun('zjazd');
    e.chooseDoctrine(''); // „bez doktryny"
    expect(e.state.interRun).toBe('splash');
  });

  it('faza limbo i zysk PRZEŻYWAJĄ zapis/odczyt — wracamy do tego samego etapu', () => {
    const { registry } = loadContent([basePack]);
    const e = eng();
    e.denominate();
    e.setInterRun('tree');
    const restored = deserializeState(serializeState(e.state), registry);
    expect(restored.interRun).toBe('tree');
    expect(restored.interRunGain.gt(0)).toBe(true);
  });
});
