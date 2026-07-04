// zalatwianie.test.ts — poprawki Załatwiania (2026-07-04): limit 6 jednoczesnych bonusów oraz
// nalot SB przy ryzyku 100% (kasuje WSZYSTKIE trwające załatwienia i zeruje ryzyko).
import { describe, it, expect } from 'vitest';
import { Decimal } from '@kombinat/shared';
import { loadContent } from '../src/engine/loader';
import { Engine } from '../src/engine/engine';
import { basePack } from '../src/content/base';

function eng(): Engine {
  const { registry, ok, issues } = loadContent([basePack]);
  expect(ok, JSON.stringify(issues.filter((i) => i.level === 'error'))).toBe(true);
  const e = new Engine(registry);
  e.state.flags['mechanika.zalatwianie'] = 1; // odblokuj bez Odry/Mery
  e.state.resources['dewizy'] = new Decimal('1e30'); // stać na dowolne łapówki
  for (const [rid, rdef] of registry.resources) if (rdef.supply) e.state.resources[rid] = new Decimal('1e9');
  e.recomputeModifiers();
  return e;
}

const firstBribe = (e: Engine): string => e.snapshot().zalatwianie.bribes[0]!.id;

describe('Załatwianie — limit 6 jednoczesnych bonusów', () => {
  it('maxBribes = 6 i 7. zakup jest zablokowany', () => {
    const e = eng();
    expect(e.snapshot().zalatwianie.maxBribes).toBe(6);
    const id = firstBribe(e);
    for (let i = 0; i < 6; i++) {
      e.state.flags['ryzyko'] = 0; // trzymaj ryzyko nisko, by kontrola SB nie mieszała w teście limitu
      expect(e.bribe(id).ok, `zakup #${i + 1}`).toBe(true);
    }
    expect(e.activeBribeCount()).toBe(6);
    expect(e.snapshot().zalatwianie.activeBribes).toBe(6);
    e.state.flags['ryzyko'] = 0;
    const blocked = e.bribe(id);
    expect(blocked.ok).toBe(false);
    expect(blocked.title).toContain('Limit');
    expect(e.activeBribeCount()).toBe(6); // dalej 6 — nic nie doszło
  });
});

describe('Załatwianie — nalot SB przy ryzyku 100%', () => {
  it('ryzyko 100% kasuje WSZYSTKIE trwające załatwienia i zeruje ryzyko', () => {
    const e = eng();
    const id = firstBribe(e);
    e.state.flags['ryzyko'] = 0;
    e.bribe(id);
    e.state.flags['ryzyko'] = 0;
    e.bribe(id);
    expect(e.activeBribeCount()).toBe(2);
    e.state.flags['ryzyko'] = 99.9; // następna łapówka przebije 100%
    const r = e.bribe(id);
    expect(r.kontrola).toBe(true);
    expect(r.title).toContain('Nalot');
    expect(e.activeBribeCount()).toBe(0); // przepadło wszystko (także świeżo kupione)
    expect(e.ryzyko()).toBe(0); // po nalocie ryzyko od zera
  });
});
