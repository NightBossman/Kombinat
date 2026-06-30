import { describe, it, expect } from 'vitest';
import { Decimal } from '@kombinat/shared';
import { loadContent } from '../src/engine/loader';
import { Engine } from '../src/engine/engine';
import { basePack } from '../src/content/base';
import { encodeSave, decodeSave } from '../src/save/k7';
import type { SaveData } from '../src/engine/state';

function fresh(): Engine {
  const { registry } = loadContent([basePack]);
  return new Engine(registry);
}

// Pelna sciezka jak przy IMPORCIE: stan -> serialize -> encode(.k7) -> decode -> restore.
async function roundTrip(e: Engine): Promise<SaveData> {
  const bytes = await encodeSave(e.serialize());
  return decodeSave<SaveData>(bytes);
}

describe('save -> .k7 -> restore (sciezka importu)', () => {
  it('odtwarza dokladnie zapisany stan', async () => {
    const a = fresh();
    a.state.resources['cykle'] = new Decimal('98765.4321');
    a.state.generators['liczydlo'] = { owned: new Decimal(7) };
    a.state.generators['arytmometr'] = { owned: new Decimal(6) };
    a.state.stats.totalClicks = 123;

    const decoded = await roundTrip(a);
    const b = fresh();
    b.restore(decoded);

    expect(b.state.resources['cykle']!.toString()).toBe('98765.4321');
    expect(b.state.generators['liczydlo']!.owned.toNumber()).toBe(7);
    expect(b.state.generators['arytmometr']!.owned.toNumber()).toBe(6);
    expect(b.state.stats.totalClicks).toBe(123);
  });

  it('RÓŻNE zapisy odtwarzają RÓŻNE stany (nie kolapsują do jednego)', async () => {
    const mk = async (owned: number, cykle: string, clicks: number): Promise<Engine> => {
      const e = fresh();
      e.state.generators['liczydlo'] = { owned: new Decimal(owned) };
      e.state.resources['cykle'] = new Decimal(cykle);
      e.state.stats.totalClicks = clicks;
      const dec = await roundTrip(e);
      const r = fresh();
      r.restore(dec);
      return r;
    };

    const r1 = await mk(3, '1000', 10);
    const r2 = await mk(9, '5000000', 99);

    expect(r1.state.generators['liczydlo']!.owned.toNumber()).toBe(3);
    expect(r2.state.generators['liczydlo']!.owned.toNumber()).toBe(9);
    expect(r1.state.resources['cykle']!.toString()).toBe('1000');
    expect(r2.state.resources['cykle']!.toString()).toBe('5000000');
    expect(r1.state.stats.totalClicks).toBe(10);
    expect(r2.state.stats.totalClicks).toBe(99);
  });

  it('reset czysci stan (brak "ukrytej" rozgrywki w tle)', () => {
    const e = fresh();
    e.state.generators['liczydlo'] = { owned: new Decimal(50) };
    e.state.resources['cykle'] = new Decimal('1e9');
    e.reset();
    expect(e.state.generators['liczydlo']!.owned.toNumber()).toBe(0);
    expect(e.state.resources['cykle']!.toNumber()).toBe(0);
    expect(e.state.stats.totalClicks).toBe(0);
  });
});
