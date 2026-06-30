import { describe, it, expect } from 'vitest';
import { Decimal } from '@kombinat/shared';
import { decodeSave, encodeSave, K7Error } from '../src/save/k7';
import { loadContent } from '../src/engine/loader';
import { Engine } from '../src/engine/engine';
import { basePack } from '../src/content/base';

describe('.k7 round-trip', () => {
  it('serializacja -> kompresja -> AES-GCM -> deszyfrowanie = identyczny stan', async () => {
    const { registry } = loadContent([basePack]);
    const e = new Engine(registry);
    e.state.resources['cykle'] = new Decimal('123456789.5');
    e.state.generators['liczydlo'] = { owned: new Decimal(7) };
    e.state.generators['arytmometr'] = { owned: new Decimal(3) };
    e.state.stats.totalClicks = 42;

    const data = e.serialize();
    const bytes = await encodeSave(data);
    const back = await decodeSave<typeof data>(bytes);

    expect(back).toEqual(data);
  });

  it('zachowuje wielkie liczby (poza float64) bez utraty precyzji', async () => {
    const value = new Decimal('1.23e120').toString();
    const bytes = await encodeSave({ big: value });
    const back = await decodeSave<{ big: string }>(bytes);
    expect(back.big).toBe(value);
    expect(new Decimal(back.big).eq(new Decimal('1.23e120'))).toBe(true);
  });
});

describe('.k7 wykrywanie manipulacji', () => {
  it('zmiana ostatniego bajtu (HMAC) jest wykrywana', async () => {
    const bytes = await encodeSave({ hello: 'swiat', n: 42 });
    const tampered = bytes.slice();
    tampered[tampered.length - 1] = (tampered[tampered.length - 1]! ^ 0xff) & 0xff;
    await expect(decodeSave(tampered)).rejects.toBeInstanceOf(K7Error);
  });

  it('zmiana bajtu w ciphertext jest wykrywana', async () => {
    const bytes = await encodeSave({ a: 1, b: 2, c: 3 });
    const tampered = bytes.slice();
    const mid = Math.floor(tampered.length / 2);
    tampered[mid] = (tampered[mid]! ^ 0x01) & 0xff;
    await expect(decodeSave(tampered)).rejects.toBeInstanceOf(K7Error);
  });

  it('odrzuca obcy plik (zla sygnatura)', async () => {
    const junk = new Uint8Array(128); // same zera — zla magiczna sygnatura
    await expect(decodeSave(junk)).rejects.toBeInstanceOf(K7Error);
  });

  it('odrzuca plik za krotki', async () => {
    await expect(decodeSave(new Uint8Array(4))).rejects.toBeInstanceOf(K7Error);
  });
});
