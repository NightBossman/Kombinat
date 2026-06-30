// phase5f.test.ts — BRAMKA Fazy 5 (PLAN). Bierzemy przykładową paczkę DLC napisaną WYŁĄCZNIE jako dane
// wg DLC.md (test/fixtures/nrd.example.pack.json — zero kodu gry) i dowodzimy, że cały ekosystem działa:
//   • ładuje się czysto i wtapia w rdzeń (5A formuły, 5B hooki/łatki, 5D tożsamość wizualna),
//   • walidacja łapie błędy ZROZUMIALE (ze ścieżką),
//   • konflikty/łatki w nieistniejący cel są wykrywane,
//   • pieczęć oficjalna weryfikuje się kluczem publicznym, a podróbki — nie (5C).
import { describe, it, expect } from 'vitest';
import {
  validatePack,
  buildRegistry,
  sealPack,
  assessTrust,
  generateOfficialKeyPair,
  type Pack,
  type TrustTier,
} from '@kombinat/shared';
import { Decimal } from '@kombinat/shared';
import { loadContent } from '../src/engine/loader';
import { Engine } from '../src/engine/engine';
import { computeModifiers } from '../src/engine/effects';
import { basePack } from '../src/content/base';
import nrdRaw from './fixtures/nrd.example.pack.json';

const nrd = nrdRaw as unknown as Pack;
function clone(): Pack {
  return JSON.parse(JSON.stringify(nrdRaw)) as Pack;
}
const zsrrStub: Pack = { manifest: { id: 'zsrr', name: 'ZSRR', version: '1.0.0', schemaVersion: 1 } };

describe('5F — przykładowa paczka ładuje się czysto i wtapia w rdzeń', () => {
  it('paczka z samego DLC.md przechodzi walidację bez błędów', () => {
    const res = validatePack(nrdRaw);
    expect(res.issues.filter((i) => i.level === 'error'), JSON.stringify(res.issues)).toHaveLength(0);
    expect(res.ok).toBe(true);
  });

  it('scala się z rdzeniem: nowa treść + łatki + pochodzenie/tożsamość wizualna', () => {
    const { registry, ok, issues } = loadContent([basePack, nrd]);
    expect(issues.filter((i) => i.level === 'error'), JSON.stringify(issues)).toHaveLength(0);
    expect(ok).toBe(true);
    // nowa treść
    expect(registry.generators.has('nrd.robotron')).toBe(true);
    expect(registry.upgrades.has('nrd.u_robotron_szyna')).toBe(true);
    expect(registry.synergies.length).toBe(1);
    // łatka SET na rdzeniu (re-flavor Spectrum) + łatka addCondition na rdzeniu (Meritum)
    expect(registry.generators.get('spectrum')!.flavor).toContain('Robotron');
    expect(registry.generators.get('meritum')!.unlock).toContain('posiadane.nrd.robotron >= 1');
    // pochodzenie + tożsamość wizualna (5D)
    expect(registry.packOf.get('nrd.robotron')).toBe('nrd');
    expect(registry.visualIdentities.get('nrd')?.accentColor).toBe('#b0563a');
  });

  it('migawka: treść DLC dostaje akcent + pieczęć społecznościową, rdzeń bez szwu (5D)', () => {
    const { registry } = loadContent([basePack, nrd]);
    const gens = new Engine(registry).snapshot().generators;
    const robotron = gens.find((g) => g.id === 'nrd.robotron');
    expect(robotron?.accent).toBe('#b0563a');
    expect(robotron?.dlcSeal).toBe('community');
    expect(gens.find((g) => g.id === 'liczydlo')?.accent).toBeUndefined();
  });
});

describe('5F — hooki działają na żywym silniku (5B)', () => {
  it('efekt WARUNKOWy wzmacnia rdzenną Odrę dopiero po 8 Robotronach', () => {
    const { registry } = loadContent([basePack, nrd]);
    const e = new Engine(registry);
    e.state.upgrades['nrd.u_odra_wsparcie'] = true;
    e.state.generators['nrd.robotron'] = { owned: new Decimal(5) };
    expect(computeModifiers(registry, e.state).prodGenMul.get('odra1305')).toBeUndefined(); // 5 < 8 → brak
    e.state.generators['nrd.robotron'] = { owned: new Decimal(10) };
    expect(computeModifiers(registry, e.state).prodGenMul.get('odra1305')!.toNumber()).toBeCloseTo(1.5, 6);
  });

  it('synergia ZSRR działa TYLKO gdy obecny jest pakiet zsrr (łagodna degradacja)', () => {
    const withoutZsrr = loadContent([basePack, nrd]).registry;
    const withZsrr = loadContent([basePack, nrd, zsrrStub]).registry;
    const e1 = new Engine(withoutZsrr);
    const e2 = new Engine(withZsrr);
    const cyk1 = computeModifiers(withoutZsrr, e1.state).prodResMul.get('cykle');
    const cyk2 = computeModifiers(withZsrr, e2.state).prodResMul.get('cykle');
    expect(cyk1).toBeUndefined(); // bez zsrr — synergia nieaktywna
    expect(cyk2!.toNumber()).toBeCloseTo(1.15, 6); // z zsrr — ×1,15
  });
});

describe('5F — walidacja łapie błędy ZROZUMIALE', () => {
  it('zła formuła kosztu → błąd ze ścieżką', () => {
    const bad = clone();
    bad.generators![0]!.cost = '200000 * (';
    const res = validatePack(bad);
    expect(res.ok).toBe(false);
    expect(res.issues.some((i) => i.level === 'error' && i.path === 'generators[0].cost')).toBe(true);
  });

  it('nieznany typ efektu → błąd z nazwą efektu', () => {
    const bad = clone();
    bad.upgrades![0]!.effects = [{ type: 'czaryMary', target: 'global', value: '2' }];
    expect(validatePack(bad).issues.some((i) => i.message.includes('czaryMary'))).toBe(true);
  });

  it('łatka w nieistniejący cel → błąd przy scalaniu', () => {
    const bad = clone();
    bad.patches = [{ target: 'generator:mera450', set: { flavor: 'x' } }];
    const { issues } = buildRegistry([basePack as Pack, bad]);
    expect(issues.some((i) => i.level === 'error' && i.message.includes('mera450'))).toBe(true);
  });

  it('ID bez prefiksu paczki → ostrzeżenie', () => {
    const bad = clone();
    bad.generators![0]!.id = 'robotron'; // brak 'nrd.'
    expect(validatePack(bad).issues.some((i) => i.level === 'warning' && i.message.includes('robotron'))).toBe(true);
  });
});

describe('5F — pieczęć oficjalna weryfikuje się, podróbka nie (5C)', () => {
  it('podpisana kluczem właściciela → oficjalna; obcy klucz → tylko nienaruszona', async () => {
    const owner = await generateOfficialKeyPair();
    const sealed = await sealPack(nrd, { privateKey: owner.privateKey });

    const real = await assessTrust(sealed, { officialKey: owner.publicKey });
    expect(real.tier).toBe('official');
    expect(real.officialVerified).toBe(true);

    const impostor = await generateOfficialKeyPair();
    const fake = await assessTrust(sealed, { officialKey: impostor.publicKey });
    expect(fake.officialVerified).toBe(false);
    expect(fake.tier).toBe('intact'); // nadal nienaruszona, ale NIE oficjalna
  });

  it('bez podpisu → społecznościowa (nienaruszona); ruszona treść traci integralność', async () => {
    const sealed = await sealPack(nrd);
    expect((await assessTrust(sealed)).tier).toBe('intact');
    const tampered = await sealPack(nrd);
    tampered.content.generators![0]!.production = '999999';
    const t = await assessTrust(tampered);
    expect(t.intact).toBe(false);
    expect(t.tier).toBe('valid');
  });
});

// Smoke: stopień zaufania paczki steruje pieczęcią w grze (5C→5D spięte).
describe('5F — zaufanie steruje pieczęcią w migawce', () => {
  it('paczka oznaczona oficjalną → pieczęć oficjalna na jej treści', () => {
    const { registry } = loadContent([basePack, nrd]);
    const e = new Engine(registry);
    e.trustByPack = new Map<string, TrustTier>([['nrd', 'official']]);
    expect(e.snapshot().generators.find((g) => g.id === 'nrd.robotron')?.dlcSeal).toBe('official');
  });
});
