// k7.ts — Pelny pipeline przenosnego save'a `.k7` (PLAN rozdz. 4).
//   stan -> JSON -> kompresja (gzip/fflate) -> AES-GCM (Web Crypto) -> naglowek+wersja -> HMAC
// Web Crypto dziala identycznie w przegladarce, webview Tauri i Capacitora oraz w Node (testy),
// wiec ten modul jest srodowiskowo-neutralny.
//
// Granica (PLAN 4.3): to jest ANTI-CASUAL, nie anti-determined. Klucz jest na urzadzeniu (staly
// sekret aplikacji). Cel: plik nieczytelny w notatniku, a manipulacja wykrywana (tag GCM + HMAC).
import { gunzipSync, gzipSync } from 'fflate';

const MAGIC = new Uint8Array([0x4b, 0x37, 0x1a]); // 'K' '7' 0x1A
const FORMAT_VERSION = 1;
const FLAG_GZIP = 0x01;

const SALT_LEN = 16;
const IV_LEN = 12;
const HMAC_LEN = 32;
const HEADER_LEN = MAGIC.length + 1 /*ver*/ + 1 /*flags*/ + SALT_LEN + IV_LEN + 4 /*ctLen*/;

// Staly sekret aplikacji (jawnie w bundlu — to swiadomy kompromis anti-casual, PLAN 4.3).
const APP_SECRET = 'kombinat://k7/v1 -- anti-casual, nie anti-determined';

export class K7Error extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'K7Error';
  }
}

const enc = new TextEncoder();
const dec = new TextDecoder();

// TS 6 rozroznia Uint8Array<ArrayBuffer> od <ArrayBufferLike/SharedArrayBuffer>. Web Crypto i Blob
// wymagaja bufora niewspoldzielonego. `ab` gwarantuje swiezy, niewspoldzielony ArrayBuffer.
type Bytes = Uint8Array<ArrayBuffer>;
function ab(u: Uint8Array): Bytes {
  const out = new Uint8Array(u.byteLength);
  out.set(u);
  return out;
}

function getCrypto(): Crypto {
  const c = (globalThis as { crypto?: Crypto }).crypto;
  if (!c?.subtle) throw new K7Error('Web Crypto API niedostepne w tym srodowisku.');
  return c;
}

function concat(...parts: Uint8Array[]): Bytes {
  let total = 0;
  for (const p of parts) total += p.length;
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}

function writeUint32LE(value: number): Bytes {
  const b = new Uint8Array(4);
  new DataView(b.buffer).setUint32(0, value >>> 0, true);
  return b;
}
function readUint32LE(bytes: Uint8Array, offset: number): number {
  return new DataView(bytes.buffer, bytes.byteOffset + offset, 4).getUint32(0, true);
}

/** HKDF z stalego sekretu + per-save salt -> osobny klucz szyfrowania i klucz HMAC. */
async function deriveKeys(salt: Uint8Array): Promise<{ enc: CryptoKey; mac: CryptoKey }> {
  const crypto = getCrypto();
  const ikm = await crypto.subtle.importKey('raw', enc.encode(APP_SECRET), 'HKDF', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt: ab(salt), info: enc.encode('kombinat-k7') },
    ikm,
    512,
  );
  const material = new Uint8Array(bits);
  const encKeyRaw = material.slice(0, 32);
  const macKeyRaw = material.slice(32, 64);
  const encKey = await crypto.subtle.importKey('raw', encKeyRaw, { name: 'AES-GCM' }, false, [
    'encrypt',
    'decrypt',
  ]);
  const macKey = await crypto.subtle.importKey('raw', macKeyRaw, { name: 'HMAC', hash: 'SHA-256' }, false, [
    'sign',
    'verify',
  ]);
  return { enc: encKey, mac: macKey };
}

/** Serializuje dowolny stan (JSON-owalny) do bajtow `.k7`. */
export async function encodeSave(data: unknown): Promise<Bytes> {
  const crypto = getCrypto();
  const json = enc.encode(JSON.stringify(data));
  const compressed = gzipSync(json);

  const salt = crypto.getRandomValues(new Uint8Array(SALT_LEN));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LEN));
  const { enc: encKey, mac: macKey } = await deriveKeys(salt);

  const ctBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, encKey, ab(compressed));
  const ct = new Uint8Array(ctBuf);

  const header = concat(
    MAGIC,
    new Uint8Array([FORMAT_VERSION, FLAG_GZIP]),
    salt,
    iv,
    writeUint32LE(ct.length),
  );
  const body = concat(header, ct);
  const hmacBuf = await crypto.subtle.sign('HMAC', macKey, body);
  return concat(body, new Uint8Array(hmacBuf));
}

/** Odczytuje bajty `.k7` z powrotem do stanu. Rzuca K7Error przy obcym/uszkodzonym/zmanipulowanym pliku. */
export async function decodeSave<T = unknown>(bytes: Uint8Array): Promise<T> {
  const crypto = getCrypto();
  if (bytes.length < HEADER_LEN + HMAC_LEN) throw new K7Error('Plik za krotki, by byl save .k7.');

  for (let i = 0; i < MAGIC.length; i++) {
    if (bytes[i] !== MAGIC[i]) throw new K7Error('To nie jest plik .k7 (zla sygnatura).');
  }
  let off = MAGIC.length;
  const version = bytes[off++];
  if (version !== FORMAT_VERSION) {
    throw new K7Error(`Nieobslugiwana wersja formatu save: ${String(version)}.`);
  }
  const flags = bytes[off++] ?? 0;
  const salt = bytes.slice(off, off + SALT_LEN);
  off += SALT_LEN;
  const iv = bytes.slice(off, off + IV_LEN);
  off += IV_LEN;
  const ctLen = readUint32LE(bytes, off);
  off += 4;
  const ctEnd = off + ctLen;
  if (ctEnd + HMAC_LEN !== bytes.length) throw new K7Error('Niespojna dlugosc pliku .k7.');
  const ct = bytes.slice(off, ctEnd);
  const hmac = bytes.slice(ctEnd);
  const body = bytes.slice(0, ctEnd);

  const { enc: encKey, mac: macKey } = await deriveKeys(salt);

  const hmacOk = await crypto.subtle.verify('HMAC', macKey, ab(hmac), ab(body));
  if (!hmacOk) throw new K7Error('Suma kontrolna (HMAC) sie nie zgadza — plik zmanipulowany lub uszkodzony.');

  let compressed: Uint8Array;
  try {
    const ptBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ab(iv) }, encKey, ab(ct));
    compressed = new Uint8Array(ptBuf);
  } catch {
    throw new K7Error('Deszyfrowanie nie powiodlo sie (tag AES-GCM) — plik zmanipulowany.');
  }

  const jsonBytes = (flags & FLAG_GZIP) !== 0 ? gunzipSync(compressed) : compressed;
  try {
    return JSON.parse(dec.decode(jsonBytes)) as T;
  } catch {
    throw new K7Error('Zawartosc save nie jest poprawnym JSON.');
  }
}

export const K7_FORMAT_VERSION = FORMAT_VERSION;
