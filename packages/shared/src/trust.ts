// trust.ts — Faza 5C: trójstopniowy model zaufania paczek DLC (PLAN 5C, DLC §11, STUDIO §3/§7).
//   poprawne (valid)     — przeszła walidację schematu (każdy może wyprodukować; „społecznościowa"),
//   nienaruszone (intact)— suma kontrolna SHA-256 nad `content` się zgadza (nie ruszano od zapieczętowania),
//   oficjalne (official) — podpis ECDSA P-256 weryfikuje się WBUDOWANYM kluczem publicznym właściciela.
//
// Ten moduł to WERYFIKACJA + pakowanie (kopertowanie). Podpisywanie wymaga klucza PRYWATNEGO i jest
// operacją wyłącznie właściciela (Studio, Faza 5.5) — tu jest tylko po to, by dało się to PRZETESTOWAĆ
// (testy generują efemeryczną parę kluczy). Web Crypto działa w grze (przeglądarka/worker) i w Node 18+.
import { validatePack, type Pack, type ValidationIssue } from './pack';

export type TrustTier = 'invalid' | 'valid' | 'intact' | 'official';

export interface Integrity {
  algo: 'SHA-256';
  hash: string; // hex SHA-256 nad kanonicznymi bajtami `content`
}
export interface Signature {
  algo: 'ECDSA-P256';
  publicKeyId: string;
  value: string; // base64 podpisu nad kanonicznymi bajtami (content + integrity)
}
/** Koperta dystrybucyjna (format „kombinat-dlc", STUDIO §3.2). */
export interface SealedPack {
  format: 'kombinat-dlc';
  schemaVersion: number;
  packId: string;
  version: string;
  content: Pack;
  integrity: Integrity;
  signature?: Signature;
}

export interface TrustResult {
  tier: TrustTier;
  /** Czy SHA-256 nad `content` się zgadza. */
  intact: boolean;
  /** Czy koperta NIESIE podpis (niezależnie od tego, czy się zweryfikował). */
  signed: boolean;
  /** Czy podpis zweryfikował się wbudowanym kluczem publicznym. */
  officialVerified: boolean;
  /** Etykieta do UI (pieczęć). */
  label: 'oficjalna' | 'społecznościowa' | 'niepoprawna';
  issues: ValidationIssue[];
}

// Wbudowany klucz PUBLICZNY właściciela (Faza 5.5D). Para wygenerowana lokalnie narzędziem
// `packages/studio/tools/sign-dlc.mjs keygen`; klucz PRYWATNY został OFFLINE u właściciela (poza repo,
// poza buildem — ŻELAZNA REGUŁA STUDIO §7.3). TYLKO posiadacz klucza prywatnego potrafi wyprodukować
// paczkę „oficjalną"; każdy (gra, podgląd w Studiu) może ją tym kluczem publicznym ZWERYFIKOWAĆ.
// Rotacja (STUDIO §7.5): nowa para → podbij publicKeyId (…-v2) i podmień klucz poniżej.
export const OFFICIAL_PUBLIC_KEY_ID = 'kombinat-official-v1';
export const OFFICIAL_PUBLIC_KEY_JWK: JsonWebKey | null = {
  kty: 'EC',
  crv: 'P-256',
  x: 'FnMFEzCLkvCrxZTR77cBugxmLaglhy_iXdp4NNxihFg',
  y: 'w2D7ATIascwZAWFPuspMqTpDYVroCnHC8UU_fZo3-3Y',
  key_ops: ['verify'],
  ext: true,
};

const ECDSA_PARAMS = { name: 'ECDSA', namedCurve: 'P-256' } as const;
const SIGN_PARAMS = { name: 'ECDSA', hash: 'SHA-256' } as const;

// --- kanonikalizacja i hash ---------------------------------------------------

/** Deterministyczny JSON: klucze obiektów posortowane, KOLEJNOŚĆ TABLIC zachowana (ma znaczenie przy
 *  scalaniu). Ten sam logiczny pack zawsze daje te same bajty → stabilny hash i podpis. */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(sortDeep(value));
}
function sortDeep(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(sortDeep);
  if (v && typeof v === 'object') {
    const src = v as Record<string, unknown>;
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(src).sort()) out[k] = sortDeep(src[k]);
    return out;
  }
  return v;
}

const enc = new TextEncoder();
/** UTF-8 → Uint8Array backed by a plain ArrayBuffer (Web Crypto nie przyjmuje SharedArrayBuffer). */
function u8(text: string): Uint8Array<ArrayBuffer> {
  return new Uint8Array(enc.encode(text));
}

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', u8(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function abToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return btoa(bin);
}
function base64ToBytes(b64: string): Uint8Array<ArrayBuffer> {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

/** Bajty podpisu/weryfikacji — kanoniczny `content` + kanoniczna `integrity` (STUDIO §3.2). */
function signedBytes(content: Pack, integrity: Integrity): Uint8Array<ArrayBuffer> {
  return u8(canonicalJson(content) + '\n' + canonicalJson(integrity));
}

// --- klucze (głównie dla Studia/testów) --------------------------------------

export async function generateOfficialKeyPair(): Promise<CryptoKeyPair> {
  return crypto.subtle.generateKey(ECDSA_PARAMS, true, ['sign', 'verify']);
}
export async function exportPublicKeyJwk(key: CryptoKey): Promise<JsonWebKey> {
  return crypto.subtle.exportKey('jwk', key);
}
export async function importPublicKeyJwk(jwk: JsonWebKey): Promise<CryptoKey> {
  return crypto.subtle.importKey('jwk', jwk, ECDSA_PARAMS, true, ['verify']);
}
/** Wbudowany klucz publiczny gry (lub null, gdy jeszcze nieskonfigurowany — Faza 5.5). */
export async function loadOfficialPublicKey(): Promise<CryptoKey | null> {
  if (!OFFICIAL_PUBLIC_KEY_JWK) return null;
  return importPublicKeyJwk(OFFICIAL_PUBLIC_KEY_JWK);
}

// --- pakowanie (koperta) ------------------------------------------------------

/** Składa kopertę: integralność ZAWSZE; podpis TYLKO gdy podano klucz prywatny (operacja właściciela). */
export async function sealPack(
  pack: Pack,
  opts: { privateKey?: CryptoKey; publicKeyId?: string } = {},
): Promise<SealedPack> {
  const integrity: Integrity = {
    algo: 'SHA-256',
    hash: await sha256Hex(canonicalJson(pack)),
  };
  const sealed: SealedPack = {
    format: 'kombinat-dlc',
    schemaVersion: pack.manifest.schemaVersion,
    packId: pack.manifest.id,
    version: pack.manifest.version,
    content: pack,
    integrity,
  };
  if (opts.privateKey) {
    const sig = await crypto.subtle.sign(SIGN_PARAMS, opts.privateKey, signedBytes(pack, integrity));
    sealed.signature = {
      algo: 'ECDSA-P256',
      publicKeyId: opts.publicKeyId ?? OFFICIAL_PUBLIC_KEY_ID,
      value: abToBase64(sig),
    };
  }
  return sealed;
}

// --- weryfikacja --------------------------------------------------------------

/** Czy SHA-256 nad `content` zgadza się z `integrity.hash` (wykrywa uszkodzenie / casualową przeróbkę). */
export async function verifyIntegrity(sealed: SealedPack): Promise<boolean> {
  if (sealed.integrity?.algo !== 'SHA-256' || typeof sealed.integrity.hash !== 'string') return false;
  const hash = await sha256Hex(canonicalJson(sealed.content));
  return timingSafeEqualHex(hash, sealed.integrity.hash);
}

/** Czy podpis weryfikuje się danym kluczem publicznym (i pasuje publicKeyId). */
export async function verifySignature(sealed: SealedPack, publicKey: CryptoKey, keyId = OFFICIAL_PUBLIC_KEY_ID): Promise<boolean> {
  const sig = sealed.signature;
  if (!sig || sig.algo !== 'ECDSA-P256' || sig.publicKeyId !== keyId) return false;
  let bytes: Uint8Array<ArrayBuffer>;
  try {
    bytes = base64ToBytes(sig.value);
  } catch {
    return false;
  }
  return crypto.subtle.verify(SIGN_PARAMS, publicKey, bytes, signedBytes(sealed.content, sealed.integrity));
}

/** Pełna ocena zaufania: schemat → integralność → podpis. `officialKey` = wbudowany klucz gry (lub null). */
export async function assessTrust(
  sealed: SealedPack,
  opts: { officialKey?: CryptoKey | null; officialKeyId?: string } = {},
): Promise<TrustResult> {
  const issues: ValidationIssue[] = [];
  // 1) schemat
  const v = validatePack(sealed.content);
  issues.push(...v.issues);
  if (!v.ok) {
    return { tier: 'invalid', intact: false, signed: !!sealed.signature, officialVerified: false, label: 'niepoprawna', issues };
  }
  // 2) integralność
  const intact = await verifyIntegrity(sealed);
  if (!intact) {
    issues.push({ level: 'warning', message: 'Suma kontrolna integralności się nie zgadza — paczka była ruszana po zapieczętowaniu. Ładuję jako społecznościową.', path: 'integrity' });
  }
  // 3) podpis (oficjalność)
  const signed = !!sealed.signature;
  let officialVerified = false;
  if (signed) {
    const key = opts.officialKey ?? (await loadOfficialPublicKey());
    if (intact && key) {
      officialVerified = await verifySignature(sealed, key, opts.officialKeyId ?? OFFICIAL_PUBLIC_KEY_ID);
      if (!officialVerified) {
        issues.push({ level: 'warning', message: 'Paczka niesie podpis, ale NIE zweryfikował się kluczem oficjalnym — to NIE jest paczka oficjalna (możliwa podróbka).', path: 'signature' });
      }
    }
  }
  const tier: TrustTier = officialVerified ? 'official' : intact ? 'intact' : 'valid';
  const label = officialVerified ? 'oficjalna' : 'społecznościowa';
  return { tier, intact, signed, officialVerified, label, issues };
}

/** Porównanie hexów w stałym czasie (drobny utrudniacz; integralność i tak jest anti-casual). */
function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
