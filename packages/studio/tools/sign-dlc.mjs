#!/usr/bin/env node
// sign-dlc.mjs — Narzędzie PODPISU OFICJALNOŚCI (Faza 5.5D, STUDIO §7.4 Opcja A).
//
// To jest SAMODZIELNY, LOKALNY skrypt właściciela — NIE część publicznej strony Studia.
// Bierze gotową kopertę „kombinat-dlc" + klucz PRYWATNY z lokalnego pliku i dokłada podpis ECDSA P-256,
// dzięki któremu gra pokazuje pieczęć „oficjalna".
//
//   ŻELAZNA REGUŁA (STUDIO §7.3): wdrożony, publiczny build Studia NIGDY nie zawiera klucza prywatnego.
//   Dlatego podpis żyje TU (osobny plik w `tools/`, nieimportowany przez stronę), a klucz prywatny
//   trzymasz offline, poza repo. Audyt bundla (test bezpieczeństwa) pilnuje, że klucza nie ma w dist/.
//
// Format kanoniczny i bajty podpisu są ZGODNE 1:1 z `packages/shared/src/trust.ts` (sealPack), żeby
// gra (która używa shared) zweryfikowała podpis. Test `sign.test.ts` krzyżowo to potwierdza
// (CLI podpisuje → shared.assessTrust mówi „official”). Jeśli format kiedyś się rozjedzie — test spada.
//
// Użycie:
//   node tools/sign-dlc.mjs keygen [--out <katalog>] [--force]
//   node tools/sign-dlc.mjs sign <koperta.kombinat-dlc.json> --key <klucz.private.jwk> [--out <plik>]
//   node tools/sign-dlc.mjs verify <koperta.kombinat-dlc.json> [--key <klucz.public.jwk>]
//
// Domyślny katalog kluczy: ~/.kombinat-dlc-keys  (POZA repo — nie trafi do builda ani do gita).

import { webcrypto } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const { subtle } = webcrypto;
const ECDSA_PARAMS = { name: 'ECDSA', namedCurve: 'P-256' };
const SIGN_PARAMS = { name: 'ECDSA', hash: 'SHA-256' };
const DEFAULT_KEY_ID = 'kombinat-official-v1';
const DEFAULT_KEY_DIR = join(homedir(), '.kombinat-dlc-keys');

// --- kanonikalizacja (MUSI być identyczna jak w shared/trust.ts) -----------------------------------

/** Deterministyczny JSON: klucze obiektów posortowane, KOLEJNOŚĆ TABLIC zachowana. */
export function canonicalJson(value) {
  return JSON.stringify(sortDeep(value));
}
function sortDeep(v) {
  if (Array.isArray(v)) return v.map(sortDeep);
  if (v && typeof v === 'object') {
    const out = {};
    for (const k of Object.keys(v).sort()) out[k] = sortDeep(v[k]);
    return out;
  }
  return v;
}
const encoder = new TextEncoder();
async function sha256Hex(text) {
  const buf = await subtle.digest('SHA-256', encoder.encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
/** Bajty podpisu — kanoniczny `content` + '\n' + kanoniczna `integrity` (STUDIO §3.2). */
function signedBytes(content, integrity) {
  return encoder.encode(canonicalJson(content) + '\n' + canonicalJson(integrity));
}

// --- rdzeń: pieczętowanie + podpis ------------------------------------------------------------------

/** Generuje parę kluczy i zwraca JWK (publiczny do wbudowania w grę, prywatny do offline). */
export async function genKeyJwks() {
  const kp = await subtle.generateKey(ECDSA_PARAMS, true, ['sign', 'verify']);
  return {
    publicJwk: await subtle.exportKey('jwk', kp.publicKey),
    privateJwk: await subtle.exportKey('jwk', kp.privateKey),
  };
}

/** Z `content` (paczka) składa kopertę z integralnością i PODPISUJE ją kluczem prywatnym (JWK). */
export async function sealAndSign(content, privateJwk, publicKeyId = DEFAULT_KEY_ID) {
  const integrity = { algo: 'SHA-256', hash: await sha256Hex(canonicalJson(content)) };
  const key = await subtle.importKey('jwk', privateJwk, ECDSA_PARAMS, false, ['sign']);
  const sig = await subtle.sign(SIGN_PARAMS, key, signedBytes(content, integrity));
  return {
    format: 'kombinat-dlc',
    schemaVersion: content.manifest.schemaVersion,
    packId: content.manifest.id,
    version: content.manifest.version,
    content,
    integrity,
    signature: {
      algo: 'ECDSA-P256',
      publicKeyId,
      value: Buffer.from(new Uint8Array(sig)).toString('base64'),
    },
  };
}

/** Publiczna weryfikacja (jak w grze): integralność + (jeśli klucz dany) podpis. */
export async function verifyEnvelope(env, publicJwk) {
  const intact = (await sha256Hex(canonicalJson(env.content))) === env.integrity?.hash;
  let signed = !!env.signature;
  let officialVerified = false;
  if (signed && publicJwk) {
    const key = await subtle.importKey('jwk', publicJwk, ECDSA_PARAMS, true, ['verify']);
    const bytes = Buffer.from(env.signature.value, 'base64');
    officialVerified = intact && (await subtle.verify(SIGN_PARAMS, key, bytes, signedBytes(env.content, env.integrity)));
  }
  return { intact, signed, officialVerified };
}

// --- wejście z pliku (przyjmuje kopertę albo surową paczkę) -----------------------------------------

function contentFromInput(obj) {
  if (obj && obj.format === 'kombinat-dlc' && obj.content) return obj.content; // gotowa koperta
  if (obj && obj.manifest && obj.manifest.id) return obj; // surowa paczka
  throw new Error('To nie jest ani koperta „kombinat-dlc”, ani paczka z polem manifest.id.');
}

// --- CLI --------------------------------------------------------------------------------------------

function flag(args, name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}
function has(args, name) {
  return args.includes(name);
}
function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

const HELP = `Studio DLC — narzędzie podpisu oficjalności (lokalne, klucz prywatny offline).

  keygen [--out <katalog>] [--force]
      Generuje parę kluczy. Prywatny → <katalog>/kombinat-official.private.jwk (TRZYMAJ OFFLINE),
      publiczny → <katalog>/kombinat-official.public.jwk (do wbudowania w grę). Domyślnie: ${DEFAULT_KEY_DIR}

  sign <koperta.kombinat-dlc.json> --key <prywatny.jwk> [--out <plik>] [--id <publicKeyId>]
      Dokłada podpis. Domyślny wynik: obok wejścia, z sufiksem .signed.

  verify <koperta.kombinat-dlc.json> [--key <publiczny.jwk>]
      Sprawdza integralność i (z kluczem publicznym) podpis.`;

async function cmdKeygen(args) {
  const outDir = flag(args, '--out') ?? DEFAULT_KEY_DIR;
  const privPath = join(outDir, 'kombinat-official.private.jwk');
  const pubPath = join(outDir, 'kombinat-official.public.jwk');
  if (existsSync(privPath) && !has(args, '--force')) {
    console.error(`✋ Klucz prywatny już istnieje: ${privPath}\n   Nadpisanie UNIEWAŻNI dotychczasową pieczęć oficjalną. Użyj --force, jeśli na pewno.`);
    process.exit(1);
  }
  mkdirSync(outDir, { recursive: true });
  const { publicJwk, privateJwk } = await genKeyJwks();
  writeFileSync(privPath, JSON.stringify(privateJwk, null, 2));
  writeFileSync(pubPath, JSON.stringify(publicJwk, null, 2));
  console.log(`🔑 Wygenerowano parę kluczy (ECDSA P-256):
   • PRYWATNY:  ${privPath}
     ↳ to jest Twój „sygnet”. NIGDY go nie publikuj, nie wrzucaj do repo, nie wysyłaj. Zrób KOPIĘ w bezpiecznym miejscu.
   • PUBLICZNY: ${pubPath}
     ↳ ten wklej do gry: packages/shared/src/trust.ts → OFFICIAL_PUBLIC_KEY_JWK.

Klucz publiczny do wklejenia:
${JSON.stringify(publicJwk)}`);
}

async function cmdSign(args) {
  const input = args[0];
  const keyPath = flag(args, '--key');
  if (!input || !keyPath) {
    console.error('Użycie: sign <koperta.json> --key <prywatny.jwk> [--out <plik>] [--id <publicKeyId>]');
    process.exit(1);
  }
  const content = contentFromInput(readJson(input));
  const privateJwk = readJson(keyPath);
  const id = flag(args, '--id') ?? DEFAULT_KEY_ID;
  const env = await sealAndSign(content, privateJwk, id);
  const out = flag(args, '--out') ?? join(dirname(input), basename(input).replace(/(\.kombinat-dlc)?\.json$/i, '') + '.signed.kombinat-dlc.json');
  writeFileSync(out, JSON.stringify(env, null, 2));
  console.log(`🖋️  Podpisano paczkę „${env.packId}” (publicKeyId: ${id}).\n   → ${out}\n   Sprawdź: node tools/sign-dlc.mjs verify "${out}" --key <publiczny.jwk>`);
}

async function cmdVerify(args) {
  const input = args[0];
  if (!input) {
    console.error('Użycie: verify <koperta.json> [--key <publiczny.jwk>]');
    process.exit(1);
  }
  const env = readJson(input);
  const keyPath = flag(args, '--key');
  const publicJwk = keyPath ? readJson(keyPath) : undefined;
  const r = await verifyEnvelope(env, publicJwk);
  console.log(`Integralność: ${r.intact ? 'OK ✅' : 'NIE pasuje ❌ (treść ruszana po pieczęci)'}`);
  console.log(`Podpis:       ${!r.signed ? 'brak (społecznościowa)' : publicJwk ? (r.officialVerified ? 'ZWERYFIKOWANY — OFICJALNA ✅' : 'obecny, ale NIE pasuje do tego klucza ❌') : 'obecny (podaj --key, by sprawdzić)'}`);
  process.exit(r.signed && publicJwk && !r.officialVerified ? 1 : 0);
}

async function main() {
  const [cmd, ...args] = process.argv.slice(2);
  try {
    if (cmd === 'keygen') await cmdKeygen(args);
    else if (cmd === 'sign') await cmdSign(args);
    else if (cmd === 'verify') await cmdVerify(args);
    else console.log(HELP);
  } catch (e) {
    console.error('Błąd:', e instanceof Error ? e.message : String(e));
    process.exit(1);
  }
}

// Uruchom main() TYLKO gdy plik jest wywołany bezpośrednio (przy imporcie w teście — nie).
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main();
}
