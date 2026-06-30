// studio.ts — Logika walidatora i konwertera. Cały „rozum" pochodzi z `@kombinat/shared` (JEDNO ŹRÓDŁO
// PRAWDY — STUDIO §8): walidacja schematu, parser formuł, słownik efektów, rejestr stabilnych ID,
// kanonikalizacja. Tu tylko: parsujemy JSONC z pozycjami, mapujemy błędy na LINIE i dokładamy kontrolę
// odwołań do nieistniejących ID rdzenia/paczki z podpowiedzią („czy chodziło o…?").
import {
  validatePack,
  buildRegistry,
  mergeOrder,
  canonicalJson,
  sealPack,
  assessTrust,
  CORE_GENERATOR_IDS,
  CORE_RESOURCE_IDS,
  type Pack,
  type SealedPack,
  type TrustResult,
} from '@kombinat/shared';
import { parseJsonc, offsetToLine } from './jsonc';

export interface StudioIssue {
  level: 'error' | 'warning';
  message: string;
  path?: string;
  line?: number;
}
export interface ValidateResult {
  ok: boolean;
  issues: StudioIssue[];
  /** Zwalidowana paczka (gdy ok) — do konwersji. */
  pack?: Pack;
}

/** Pełna walidacja paczki roboczej (tekst JSONC) → błędy z liniami + sugestiami, wszystkie naraz. */
export function validateWorkingPack(text: string): ValidateResult {
  const parsed = parseJsonc(text);
  if (parsed.error || parsed.value === undefined) {
    const off = parsed.error?.offset ?? 0;
    return {
      ok: false,
      issues: [{ level: 'error', message: `Błąd składni JSONC: ${parsed.error?.message ?? 'nie udało się sparsować'}`, line: offsetToLine(text, off) }],
    };
  }
  const lineOf = (path?: string): number | undefined =>
    path != null ? locLine(parsed.locs, text, path) : undefined;

  const issues: StudioIssue[] = [];
  // 1) Schemat + formuły + typy efektów + prefiksy ID — przez TEN SAM walidator co gra.
  const res = validatePack(parsed.value);
  for (const iss of res.issues) {
    issues.push({ level: iss.level, message: iss.message, path: iss.path, line: lineOf(iss.path) });
  }
  // 2) Odwołania efektów/łatek do generatorów/zasobów: muszą istnieć (rdzeń albo własne w paczce).
  crossRefIssues(parsed.value, issues, lineOf);

  const ok = !issues.some((i) => i.level === 'error');
  return { ok, issues, pack: ok ? (parsed.value as Pack) : undefined };
}

/** Konwersja do kanonicznego, deterministycznego JSON (pole `content` koperty). */
export function convertToCanonical(pack: Pack): string {
  return canonicalJson(pack);
}

// --- 5.5B: integralność + pakowanie (koperta dystrybucyjna „kombinat-dlc") ------------------------

/** Składa kopertę dystrybucyjną z sumą kontrolną SHA-256 (stopień „nienaruszone"/społecznościowa).
 *  Podpisu NIE dokładamy — to operacja WYŁĄCZNIE właściciela (klucz prywatny, faza 5.5D). */
export async function sealEnvelope(pack: Pack): Promise<SealedPack> {
  return sealPack(pack);
}

export interface VerifyResult {
  ok: boolean;
  error?: string;
  trust?: TrustResult;
  sealed?: SealedPack;
}

/** Podgląd weryfikacji: wczytuje GOTOWĄ kopertę (tekst JSON), przelicza sumę kontrolną i (jeśli jest
 *  podpis) weryfikuje go — pokazując stopień zaufania. Weryfikacja jest PUBLICZNA (każdy może sprawdzić). */
export async function verifyEnvelope(text: string): Promise<VerifyResult> {
  let sealed: SealedPack;
  try {
    sealed = JSON.parse(text) as SealedPack;
  } catch {
    return { ok: false, error: 'To nie jest poprawny plik JSON koperty.' };
  }
  if (!sealed || sealed.format !== 'kombinat-dlc' || !sealed.content || !sealed.integrity) {
    return { ok: false, error: 'Brak pól koperty „kombinat-dlc" (content / integrity). To nie jest spakowana paczka.' };
  }
  const trust = await assessTrust(sealed);
  return { ok: true, trust, sealed };
}

// --- 5.5C: sprawdzanie konfliktów (tryb wielu paczek) --------------------------------------------

export interface LoadedPack {
  name: string;
  ok: boolean;
  pack?: Pack;
  error?: string;
}

/** Parsuje plik wejściowy: paczkę roboczą (JSONC) ALBO gotową kopertę (bierze `content`). */
export function parsePackFromText(text: string, name = 'paczka'): LoadedPack {
  const parsed = parseJsonc(text);
  if (parsed.error || typeof parsed.value !== 'object' || parsed.value === null) {
    return { name, ok: false, error: 'Nie udało się sparsować pliku (JSON/JSONC).' };
  }
  const v = parsed.value as Record<string, unknown>;
  const pack =
    v.format === 'kombinat-dlc' && v.content && typeof v.content === 'object'
      ? (v.content as Pack)
      : (v as unknown as Pack);
  const id = (pack as { manifest?: { id?: unknown } }).manifest?.id;
  if (typeof id !== 'string' || id === '') return { name, ok: false, error: 'Brak manifest.id — to nie wygląda na paczkę.' };
  return { name, ok: true, pack };
}

export interface ConflictFinding {
  level: 'error' | 'info';
  message: string;
}
export interface ConflictReport {
  order: string[];
  findings: ConflictFinding[];
}

/** Wykrywa konflikty między WIELOMA paczkami: kolizje ID (błąd), kumulacja łatek i wspólne cele efektów
 *  (info z kolejnością scalania). Echo `DLC.md` §8.5 — uprzedza niespodzianki, zanim gracz wczyta paczki. */
export function analyzeConflicts(packs: Pack[]): ConflictReport {
  const ordered = mergeOrder(packs);
  const order = ordered.map((p) => p.manifest.id);
  const findings: ConflictFinding[] = [];

  // Kolizje ID + kumulacja łatek — z mechanizmu scalania gry (te same reguły).
  for (const iss of buildRegistry(ordered).issues) {
    if (iss.level === 'error' && iss.message.includes('Kolizja')) findings.push({ level: 'error', message: iss.message });
    else if (iss.level === 'warning' && iss.message.includes('kumulacja')) findings.push({ level: 'info', message: iss.message });
  }

  // Wspólne cele efektów/łatek między paczkami → kumulacja w kolejności scalania.
  const byTarget = new Map<string, Set<string>>();
  for (const p of ordered) {
    forEachTarget(p, (target) => {
      if (target.indexOf(':') === -1) return; // pomiń 'global'
      if (!byTarget.has(target)) byTarget.set(target, new Set());
      byTarget.get(target)!.add(p.manifest.id);
    });
  }
  for (const [target, ids] of byTarget) {
    if (ids.size > 1) {
      const chain = order.filter((id) => ids.has(id)).join(' → ');
      findings.push({
        level: 'info',
        message: `Paczki ${[...ids].join(', ')} celują w „${target}". Efekty skumulują się w kolejności ${chain}.`,
      });
    }
  }
  return { order, findings };
}

// --- kontrola odwołań do ID (cel efektu/łatki = `generator:<id>` / `resource:<id>`) ---------------

// Sekcje z listami efektów (każdy efekt może mieć `target`).
const EFFECT_SECTIONS: { sec: string; field: string }[] = [
  { sec: 'upgrades', field: 'effects' },
  { sec: 'milestones', field: 'effects' },
  { sec: 'treeNodes', field: 'effects' },
  { sec: 'doctrines', field: 'effects' },
  { sec: 'synergies', field: 'effects' },
  { sec: 'characters', field: 'passive' },
  { sec: 'events', field: 'effects' },
];

/** Odwiedza KAŻDY `target` w paczce (efekty wymienionych sekcji + łatki), oddając jego wartość i ścieżkę. */
function forEachTarget(value: unknown, cb: (target: string, path: string) => void): void {
  if (typeof value !== 'object' || value === null) return;
  const pack = value as Record<string, unknown>;
  for (const { sec, field } of EFFECT_SECTIONS) {
    const items = pack[sec];
    if (!Array.isArray(items)) continue;
    items.forEach((item, i) => {
      const effects = (item as Record<string, unknown>)?.[field];
      if (!Array.isArray(effects)) return;
      effects.forEach((eff, j) => {
        const t = (eff as Record<string, unknown>)?.target;
        if (typeof t === 'string') cb(t, `${sec}[${i}].${field}[${j}].target`);
      });
    });
  }
  if (Array.isArray(pack.patches)) {
    pack.patches.forEach((p, i) => {
      const t = (p as Record<string, unknown>)?.target;
      if (typeof t === 'string') cb(t, `patches[${i}].target`);
    });
  }
}

function idsOfSection(pack: Record<string, unknown>, section: string): string[] {
  return Array.isArray(pack[section])
    ? (pack[section] as unknown[])
        .map((x) => (x && typeof x === 'object' ? String((x as Record<string, unknown>).id ?? '') : ''))
        .filter(Boolean)
    : [];
}

function crossRefIssues(
  value: unknown,
  issues: StudioIssue[],
  lineOf: (path?: string) => number | undefined,
): void {
  if (typeof value !== 'object' || value === null) return;
  const pack = value as Record<string, unknown>;
  const knownGen = new Set<string>([...CORE_GENERATOR_IDS, ...idsOfSection(pack, 'generators')]);
  const knownRes = new Set<string>([...CORE_RESOURCE_IDS, ...idsOfSection(pack, 'resources')]);

  forEachTarget(value, (target, path) => {
    const ci = target.indexOf(':');
    if (ci === -1) return; // 'global' itd. — bez id
    const kind = target.slice(0, ci);
    const id = target.slice(ci + 1);
    const pool = kind === 'generator' ? knownGen : kind === 'resource' ? knownRes : null;
    if (!pool || pool.has(id)) return;
    const hint = suggest(id, [...pool]);
    issues.push({
      level: 'error',
      message: `Cel '${target}' wskazuje na ${kind === 'generator' ? 'generator' : 'zasób'} '${id}', którego nie ma.${hint ? ` Czy chodziło o '${hint}'?` : ''}`,
      path,
      line: lineOf(path),
    });
  });
}

/** Linia dla ścieżki — dokładna, a gdy brak (np. ścieżka cross-ref z buildRegistry) — najbliższy przodek. */
function locLine(locs: Map<string, number>, text: string, path: string): number | undefined {
  let p: string = path;
  for (;;) {
    const off = locs.get(p);
    if (off != null) return offsetToLine(text, off);
    const cut = Math.max(p.lastIndexOf('.'), p.lastIndexOf('['));
    if (cut <= 0) {
      const root = locs.get('');
      return root != null ? offsetToLine(text, root) : undefined;
    }
    p = p.slice(0, cut);
  }
}

/** Najbliższy kandydat (mała odległość edycyjna) do podpowiedzi „czy chodziło o…?". */
function suggest(id: string, candidates: string[]): string | undefined {
  let best: string | undefined;
  let bestD = Infinity;
  for (const c of candidates) {
    const d = editDistance(id, c);
    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }
  // sugeruj tylko, gdy naprawdę blisko (do ~2 znaków różnicy lub 1/3 długości)
  return best != null && bestD <= Math.max(2, Math.floor(id.length / 3)) ? best : undefined;
}

function editDistance(a: string, b: string): number {
  const m = a.length;
  const k = b.length;
  let prev = Array.from({ length: k + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= k; j++) {
      const cost = a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1;
      cur[j] = Math.min(prev[j]! + 1, cur[j - 1]! + 1, prev[j - 1]! + cost);
    }
    prev = cur;
  }
  return prev[k]!;
}
