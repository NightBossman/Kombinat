#!/usr/bin/env node
// audit-bundle.mjs — Audyt bezpieczeństwa (Faza 5.5D, ŻELAZNA REGUŁA STUDIO §7.3).
//
//   Wdrożony, PUBLICZNY build Studia NIGDY nie może zawierać klucza PRYWATNEGO.
//
// Skrypt buduje Studio do katalogu tymczasowego i skanuje WSZYSTKIE pliki bundla pod kątem:
//   • prywatnego klucza EC (pole „d” przy krzywej P-256) — klucz PUBLICZNY pola „d” nie ma,
//   • wycieku narzędzia podpisu (`sign-dlc`) lub ścieżki pliku z kluczem prywatnym,
// oraz POTWIERDZA (kontrola pozytywna), że klucz PUBLICZNY faktycznie jest w bundlu (czyli skan działa
// na realnym wyjściu, a shared z wbudowanym kluczem został wkompilowany).
//
// Tryb CLI: `node packages/studio/tools/audit-bundle.mjs` → buduje realny dist i kończy 1 przy wycieku.
// Wywoływany też z testu `audit.test.ts` (bramka, której nie wolno pominąć — STUDIO §9).

import { build } from 'vite';
import { readdirSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const studioRoot = fileURLToPath(new URL('..', import.meta.url)); // packages/studio
// Marker wbudowanego klucza PUBLICZNEGO (współrzędna x) — MA się znaleźć w bundlu (kontrola pozytywna).
const PUBLIC_KEY_X = 'FnMFEzCLkvCrxZTR77cBugxmLaglhy_iXdp4NNxihFg';

function listFiles(dir) {
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...listFiles(p));
    else out.push(p);
  }
  return out;
}

// Detektor PRYWATNEGO klucza P-256: pole „d” (skalar prywatny) blisko markera krzywej „P-256”.
// Działa i dla JSON (`"d":"…"`), i dla zminifikowanego literału JS (`d:"…"`); publiczny klucz „d” nie ma.
function hasPrivateKey(text) {
  const re = /P-256/g;
  let m;
  while ((m = re.exec(text))) {
    const win = text.slice(Math.max(0, m.index - 300), m.index + 300);
    if (/(?:"d"|(?<![\w$])d)\s*:\s*["'][A-Za-z0-9_-]{30,}["']/.test(win)) return true;
  }
  return false;
}

export function scanDir(dir) {
  const files = listFiles(dir);
  const privateKeyHits = [];
  const toolLeaks = [];
  let hasPublicKey = false;
  for (const f of files) {
    let text;
    try {
      text = readFileSync(f, 'utf8');
    } catch {
      continue;
    }
    if (hasPrivateKey(text)) privateKeyHits.push(f);
    if (text.includes('kombinat-official.private') || /sign-dlc/.test(f)) toolLeaks.push(f);
    if (text.includes(PUBLIC_KEY_X)) hasPublicKey = true;
  }
  return { fileCount: files.length, privateKeyHits, toolLeaks, hasPublicKey };
}

export async function buildAndAudit() {
  const out = join(tmpdir(), 'kombinat-studio-audit-' + Date.now());
  await build({
    configFile: join(studioRoot, 'vite.config.ts'),
    root: studioRoot,
    logLevel: 'error',
    build: { outDir: out, emptyOutDir: true },
  });
  const report = scanDir(out);
  try {
    rmSync(out, { recursive: true, force: true });
  } catch {
    /* sprzątanie best-effort */
  }
  return report;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const r = await buildAndAudit();
  console.log(`Audyt bundla: ${r.fileCount} plików; klucz publiczny obecny: ${r.hasPublicKey ? 'tak ✅' : 'NIE ❌'}`);
  if (r.privateKeyHits.length || r.toolLeaks.length) {
    console.error('❌ WYCIEK do bundla:', { privateKeyHits: r.privateKeyHits, toolLeaks: r.toolLeaks });
    process.exit(1);
  }
  if (!r.hasPublicKey) {
    console.error('❌ Nie znaleziono klucza publicznego — skan mógł nie objąć modułu shared.');
    process.exit(1);
  }
  console.log('✅ Brak klucza prywatnego i narzędzia podpisu w bundlu. Klucz publiczny obecny.');
}
