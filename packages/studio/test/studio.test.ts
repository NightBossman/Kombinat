import { describe, it, expect } from 'vitest';
import { parseJsonc, offsetToLine } from '../src/jsonc';
import { validateWorkingPack, convertToCanonical, sealEnvelope, verifyEnvelope, parsePackFromText, analyzeConflicts } from '../src/studio';
import type { Pack } from '@kombinat/shared';

// Poprawna paczka robocza w JSONC (komentarze + przecinki końcowe — Studio musi je tolerować).
const NRD = `{
  // przykładowa paczka NRD
  "manifest": {
    "id": "nrd",
    "name": "NRD",
    "version": "1.0.0",
    "schemaVersion": 1,
  },
  "generators": [
    {
      "id": "nrd.robotron",
      "name": "Robotron",
      "costResource": "cykle",
      "cost": "200000 * 1.15 ^ posiadane",
      "outputResource": "cykle",
      "production": "120",
      "unlock": "posiadane.odra1305 >= 3",
    },
  ],
  "upgrades": [
    {
      "id": "nrd.u_szyna",
      "name": "Wspólna szyna",
      "costResource": "dewizy",
      "cost": "2000",
      "effects": [
        { "type": "multiplyProduction", "target": "generator:odra1305", "value": "1.5" },
      ],
    },
  ],
}`;

describe('parser JSONC z pozycjami', () => {
  it('parsuje komentarze + przecinki końcowe i zna offsety ścieżek', () => {
    const r = parseJsonc(NRD);
    expect(r.error).toBeUndefined();
    const pack = r.value as Record<string, unknown>;
    expect((pack.manifest as Record<string, unknown>).id).toBe('nrd');
    expect(r.locs.has('generators[0].cost')).toBe(true);
    // linia 'cost' generatora zgadza się z tekstem źródła
    const line = offsetToLine(NRD, r.locs.get('generators[0].cost')!);
    expect(NRD.split('\n')[line - 1]).toContain('"cost"');
  });

  it('zgłasza błąd składni z offsetem', () => {
    const r = parseJsonc('{ "manifest": { "id": ');
    expect(r.error).toBeDefined();
    expect(r.value).toBeUndefined();
  });
});

describe('walidator — paczka poprawna przechodzi czysto (bramka: NRD)', () => {
  it('NRD waliduje się bez błędów', () => {
    const res = validateWorkingPack(NRD);
    expect(res.issues.filter((i) => i.level === 'error'), JSON.stringify(res.issues)).toHaveLength(0);
    expect(res.ok).toBe(true);
    expect(res.pack).toBeTruthy();
  });
});

describe('walidator — łapie typowe błędy z LINIĄ i sugestią', () => {
  it('zła formuła kosztu → błąd z numerem linii', () => {
    const bad = NRD.replace('"200000 * 1.15 ^ posiadane"', '"200000 * ("');
    const res = validateWorkingPack(bad);
    expect(res.ok).toBe(false);
    const e = res.issues.find((i) => i.level === 'error' && (i.path ?? '').includes('cost'));
    expect(e).toBeTruthy();
    expect(e!.line).toBeGreaterThan(0);
  });

  it('nieznany typ efektu → błąd z nazwą', () => {
    const bad = NRD.replace('"multiplyProduction"', '"czaryMary"');
    const res = validateWorkingPack(bad);
    expect(res.issues.some((i) => i.level === 'error' && i.message.includes('czaryMary'))).toBe(true);
  });

  it('ID bez prefiksu paczki → ostrzeżenie', () => {
    const bad = NRD.replace('"nrd.robotron"', '"robotron"');
    const res = validateWorkingPack(bad);
    expect(res.issues.some((i) => i.level === 'warning' && i.message.includes('robotron'))).toBe(true);
  });

  it('cel efektu w nieistniejący generator → błąd z podpowiedzią „czy chodziło o…?"', () => {
    const bad = NRD.replace('"generator:odra1305"', '"generator:mera450"');
    const res = validateWorkingPack(bad);
    const e = res.issues.find((i) => i.level === 'error' && i.message.includes('mera450'));
    expect(e).toBeTruthy();
    expect(e!.message).toContain('mera400'); // najbliższy istniejący → sugestia
    expect(e!.line).toBeGreaterThan(0);
  });

  it('błąd składni JSONC → pojedynczy błąd z linią', () => {
    const res = validateWorkingPack('{\n  "manifest": {\n    "id": \n');
    expect(res.ok).toBe(false);
    expect(res.issues[0]!.message).toContain('składni');
    expect(res.issues[0]!.line).toBeGreaterThan(0);
  });
});

describe('konwerter — deterministyczny i sortuje klucze', () => {
  it('to samo wejście → identyczny wynik; klucze posortowane', () => {
    const res = validateWorkingPack(NRD);
    const a = convertToCanonical(res.pack!);
    const b = convertToCanonical(res.pack!);
    expect(a).toBe(b); // determinizm
    // klucze obiektu posortowane alfabetycznie: 'generators' przed 'manifest' przed 'upgrades'
    expect(a.indexOf('"generators"')).toBeLessThan(a.indexOf('"manifest"'));
    expect(a.indexOf('"manifest"')).toBeLessThan(a.indexOf('"upgrades"'));
  });
});

describe('5.5B — pakowanie (koperta + integralność) i podgląd weryfikacji', () => {
  it('koperta ma format i sumę kontrolną SHA-256; nietknięta weryfikuje się jako NIENARUSZONA', async () => {
    const pack = validateWorkingPack(NRD).pack!;
    const env = await sealEnvelope(pack);
    expect(env.format).toBe('kombinat-dlc');
    expect(env.packId).toBe('nrd');
    expect(env.integrity.algo).toBe('SHA-256');
    expect(env.integrity.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(env.signature).toBeUndefined(); // Studio NIE podpisuje (to robi właściciel, 5.5D)

    const v = await verifyEnvelope(JSON.stringify(env));
    expect(v.ok).toBe(true);
    expect(v.trust!.intact).toBe(true);
    expect(v.trust!.tier).toBe('intact'); // społecznościowa, nienaruszona
    expect(v.trust!.label).toBe('społecznościowa');
  });

  it('edycja `content` po spakowaniu PSUJE sumę kontrolną (wykrycie manipulacji)', async () => {
    const pack = validateWorkingPack(NRD).pack!;
    const env = await sealEnvelope(pack);
    const tampered = JSON.parse(JSON.stringify(env));
    tampered.content.generators[0].production = '999999';
    const v = await verifyEnvelope(JSON.stringify(tampered));
    expect(v.trust!.intact).toBe(false);
    expect(v.trust!.tier).toBe('valid'); // schemat OK, ale integralność nie pasuje → była ruszana
  });

  it('śmieci zamiast koperty → czytelny błąd, bez wywrotki', async () => {
    expect((await verifyEnvelope('{ "nope": true }')).ok).toBe(false);
    expect((await verifyEnvelope('to nie json')).ok).toBe(false);
  });
});

describe('5.5C — sprawdzanie konfliktów (tryb wielu paczek)', () => {
  const eff = (target: string) => ({ type: 'multiplyProduction', target, value: '1.5' });
  const pk = (id: string, priority: number, target: string): Pack => ({
    manifest: { id, name: id, version: '1.0.0', schemaVersion: 1, priority },
    upgrades: [{ id: `${id}.u`, name: 'U', costResource: 'dewizy', cost: '10', effects: [eff(target)] }],
  });

  it('dwie paczki celujące w odra1305 → raport kumulacji z kolejnością scalania', () => {
    const r = analyzeConflicts([pk('zsrr', 20, 'generator:odra1305'), pk('nrd', 10, 'generator:odra1305')]);
    expect(r.order).toEqual(['nrd', 'zsrr']); // wg priorytetu
    const f = r.findings.find((x) => x.message.includes('odra1305'));
    expect(f, JSON.stringify(r.findings)).toBeTruthy();
    expect(f!.message).toContain('nrd');
    expect(f!.message).toContain('zsrr');
    expect(f!.message).toContain('nrd → zsrr'); // kolejność kumulacji
  });

  it('różne cele → brak konfliktu', () => {
    const r = analyzeConflicts([pk('nrd', 10, 'generator:odra1305'), pk('csr', 20, 'generator:k202')]);
    expect(r.findings.some((x) => x.message.includes('celują'))).toBe(false);
  });

  it('kolizja ID między paczkami → błąd', () => {
    const a: Pack = { manifest: { id: 'a', name: 'A', version: '1.0.0', schemaVersion: 1 }, generators: [{ id: 'dup.gen', name: 'G', costResource: 'cykle', cost: '1', outputResource: 'cykle', production: '1' }] };
    const b: Pack = { manifest: { id: 'b', name: 'B', version: '1.0.0', schemaVersion: 1 }, generators: [{ id: 'dup.gen', name: 'G2', costResource: 'cykle', cost: '1', outputResource: 'cykle', production: '1' }] };
    const r = analyzeConflicts([a, b]);
    expect(r.findings.some((x) => x.level === 'error' && x.message.includes('dup.gen'))).toBe(true);
  });

  it('parsePackFromText przyjmuje paczkę roboczą i kopertę', async () => {
    const pack = validateWorkingPack(NRD).pack!;
    const fromWorking = parsePackFromText(NRD, 'nrd.jsonc');
    expect(fromWorking.ok).toBe(true);
    expect(fromWorking.pack?.manifest.id).toBe('nrd');
    const env = await sealEnvelope(pack);
    const fromEnvelope = parsePackFromText(JSON.stringify(env), 'nrd.kombinat-dlc.json');
    expect(fromEnvelope.ok).toBe(true);
    expect(fromEnvelope.pack?.manifest.id).toBe('nrd');
    expect(parsePackFromText('{}', 'x').ok).toBe(false); // brak manifest.id
  });
});
