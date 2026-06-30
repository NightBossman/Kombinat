import { describe, it, expect } from 'vitest';
import {
  assessTrust,
  importPublicKeyJwk,
  loadOfficialPublicKey,
  OFFICIAL_PUBLIC_KEY_JWK,
  canonicalJson as sharedCanonical,
  type Pack,
} from '@kombinat/shared';
import { genKeyJwks, sealAndSign, canonicalJson as cliCanonical } from '../tools/sign-dlc.mjs';

// Minimalna, poprawna paczka (waliduje się czysto — jak w trust.test.ts).
function nrd(): Pack {
  return {
    manifest: { id: 'nrd', name: 'NRD', version: '1.0.0', schemaVersion: 1 },
    resources: [{ id: 'cykle', name: 'cykle' }],
    generators: [
      { id: 'nrd.robotron', name: 'Robotron', costResource: 'cykle', cost: '100 * 1.15 ^ posiadane', outputResource: 'cykle', production: '8', unlock: 'true' },
    ],
  };
}

describe('5.5D — narzędzie podpisu jest zgodne BAJTOWO z weryfikacją gry', () => {
  it('kanonikalizacja narzędzia == kanonikalizacja shared (inaczej gra nie zweryfikuje podpisu)', () => {
    const sample = { z: 1, a: [3, { y: 2, x: 1 }], m: 'k', n: [{ b: 2, a: 1 }] };
    expect(cliCanonical(sample)).toBe(sharedCanonical(sample));
  });

  it('paczka podpisana NARZĘDZIEM weryfikuje się jako OFICJALNA przez shared.assessTrust (kod gry)', async () => {
    const { publicJwk, privateJwk } = await genKeyJwks();
    const env = await sealAndSign(nrd(), privateJwk);
    const pub = await importPublicKeyJwk(publicJwk);
    const t = await assessTrust(env, { officialKey: pub });
    expect(t.tier).toBe('official');
    expect(t.officialVerified).toBe(true);
    expect(t.label).toBe('oficjalna');
  });

  it('treść ruszona PO podpisie → traci integralność i oficjalność', async () => {
    const { publicJwk, privateJwk } = await genKeyJwks();
    const env = await sealAndSign(nrd(), privateJwk);
    env.content.generators![0]!.production = '999999'; // ktoś podkręcił po pieczęci
    const pub = await importPublicKeyJwk(publicJwk);
    const t = await assessTrust(env, { officialKey: pub });
    expect(t.intact).toBe(false);
    expect(t.tier).toBe('valid');
  });

  it('PODRÓBKA: podpis obcym kluczem NIE jest oficjalny pod kluczem właściciela', async () => {
    const owner = await genKeyJwks();
    const impostor = await genKeyJwks();
    const env = await sealAndSign(nrd(), impostor.privateJwk);
    const ownerPub = await importPublicKeyJwk(owner.publicJwk);
    const t = await assessTrust(env, { officialKey: ownerPub });
    expect(t.officialVerified).toBe(false);
    expect(t.tier).toBe('intact'); // nadal nienaruszona, ale NIE oficjalna
  });
});

describe('5.5D — WBUDOWANY klucz oficjalny gry jest żywy i odrzuca obce podpisy', () => {
  it('OFFICIAL_PUBLIC_KEY_JWK jest ustawiony i importowalny', async () => {
    expect(OFFICIAL_PUBLIC_KEY_JWK).not.toBeNull();
    expect(await loadOfficialPublicKey()).not.toBeNull();
  });

  it('paczka podpisana NIE-właścicielskim kluczem nie jest oficjalna pod wbudowanym kluczem', async () => {
    const stranger = await genKeyJwks();
    const env = await sealAndSign(nrd(), stranger.privateJwk);
    const t = await assessTrust(env); // bez officialKey → użyje wbudowanego klucza gry
    expect(t.signed).toBe(true);
    expect(t.officialVerified).toBe(false);
    expect(t.tier).toBe('intact');
  });
});
