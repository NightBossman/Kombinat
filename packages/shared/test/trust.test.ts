import { describe, it, expect } from 'vitest';
import {
  sealPack,
  assessTrust,
  verifyIntegrity,
  generateOfficialKeyPair,
  exportPublicKeyJwk,
  importPublicKeyJwk,
  type Pack,
} from '../src/index';

function validPack(): Pack {
  return {
    manifest: { id: 'nrd', name: 'NRD', version: '1.0.0', schemaVersion: 1 },
    resources: [{ id: 'cykle', name: 'cykle' }],
    generators: [
      { id: 'nrd.robotron', name: 'Robotron', costResource: 'cykle', cost: '100 * 1.15 ^ posiadane', outputResource: 'cykle', production: '8', unlock: 'true' },
    ],
  };
}

describe('5C — integralność (nienaruszone)', () => {
  it('koperta bez podpisu jest „nienaruszona" (intact), schemat OK', async () => {
    const sealed = await sealPack(validPack());
    expect(await verifyIntegrity(sealed)).toBe(true);
    const t = await assessTrust(sealed);
    expect(t.tier).toBe('intact');
    expect(t.intact).toBe(true);
    expect(t.signed).toBe(false);
    expect(t.label).toBe('społecznościowa');
  });

  it('ruszona treść psuje integralność → spada do „valid", nie „intact"', async () => {
    const sealed = await sealPack(validPack());
    sealed.content.generators![0]!.cost = '1'; // ktoś podkręcił liczby po zapieczętowaniu
    expect(await verifyIntegrity(sealed)).toBe(false);
    const t = await assessTrust(sealed);
    expect(t.intact).toBe(false);
    expect(t.tier).toBe('valid');
    expect(t.issues.some((i) => i.path === 'integrity')).toBe(true);
  });
});

describe('5C — podpis (oficjalne)', () => {
  it('podpisana kluczem właściciela i zweryfikowana → „oficjalna"', async () => {
    const kp = await generateOfficialKeyPair();
    const sealed = await sealPack(validPack(), { privateKey: kp.privateKey });
    const pub = await importPublicKeyJwk(await exportPublicKeyJwk(kp.publicKey));
    const t = await assessTrust(sealed, { officialKey: pub });
    expect(t.tier).toBe('official');
    expect(t.officialVerified).toBe(true);
    expect(t.label).toBe('oficjalna');
  });

  it('PODRÓBKA: podpis innym kluczem NIE weryfikuje się kluczem oficjalnym', async () => {
    const owner = await generateOfficialKeyPair();
    const impostor = await generateOfficialKeyPair();
    const sealed = await sealPack(validPack(), { privateKey: impostor.privateKey });
    const ownerPub = owner.publicKey;
    const t = await assessTrust(sealed, { officialKey: ownerPub });
    expect(t.officialVerified).toBe(false);
    expect(t.tier).toBe('intact'); // wciąż nienaruszona, ale NIE oficjalna
    expect(t.issues.some((i) => i.path === 'signature')).toBe(true);
  });

  it('podpisana, ale podmieniona treść → ani intact, ani oficjalna', async () => {
    const kp = await generateOfficialKeyPair();
    const sealed = await sealPack(validPack(), { privateKey: kp.privateKey });
    sealed.content.generators![0]!.production = '999';
    const t = await assessTrust(sealed, { officialKey: kp.publicKey });
    expect(t.intact).toBe(false);
    expect(t.officialVerified).toBe(false);
    expect(t.tier).toBe('valid');
  });

  it('bez wbudowanego klucza gry podpis NIE czyni paczki oficjalną (uczciwie: brak klucza = brak pieczęci)', async () => {
    const kp = await generateOfficialKeyPair();
    const sealed = await sealPack(validPack(), { privateKey: kp.privateKey });
    const t = await assessTrust(sealed, { officialKey: null });
    expect(t.signed).toBe(true);
    expect(t.officialVerified).toBe(false);
    expect(t.tier).toBe('intact');
  });
});

describe('5C — schemat niepoprawny', () => {
  it('zła treść → tier „invalid", nawet jeśli zapieczętowana', async () => {
    const bad = validPack();
    bad.generators![0]!.cost = '15 * ('; // niedokończona formuła
    const sealed = await sealPack(bad);
    const t = await assessTrust(sealed);
    expect(t.tier).toBe('invalid');
    expect(t.label).toBe('niepoprawna');
    expect(t.issues.some((i) => i.level === 'error')).toBe(true);
  });
});
