// pack.ts — Paczka tresci (manifest + sekcje), walidacja wzgledem schematu i DETERMINISTYCZNE
// scalanie w rejestr tresci. Rdzen i DLC sa instancjami DOKLADNIE tego samego formatu (PLAN 3.2).
// Ten modul jest wspoldzielony: silnik uzywa go do bezpiecznego ladowania, a Studio (Faza 5)
// rozszerzy go o numery linii w komunikatach (single source of truth).
import {
  CONTENT_SECTIONS,
  SCHEMA_VERSION,
  type AchievementDef,
  type BribeDef,
  type CharacterDef,
  type DiplomacyDef,
  type DoctrineDef,
  type EffectDef,
  type EventDef,
  type GeneratorDef,
  type LexiconDef,
  type MilestoneDef,
  type PackContent,
  type PatchDef,
  type ResourceDef,
  type SynergyDef,
  type TickerDef,
  type TreeNodeDef,
  type UpgradeDef,
  type VisualIdentity,
} from './schema';
import { CORE_GENERATOR_IDS, CORE_RESOURCE_IDS, isKnownFunction, isKnownNamespace } from './registry';
import { EFFECTS, isKnownEffect } from './effects';
import { collectRefs, FormulaError, parseFormula } from './formula';

export interface PackManifest {
  id: string;
  name: string;
  version: string;
  author?: string;
  description?: string;
  schemaVersion: number;
  requires?: string[];
  tags?: string[];
  visualIdentity?: VisualIdentity;
  /** Priorytet/kolejnosc scalania (mniejszy = wczesniej). Rdzen domyslnie 0. */
  priority?: number;
}

export type Pack = PackContent & { manifest: PackManifest };

export type IssueLevel = 'error' | 'warning';
export interface ValidationIssue {
  level: IssueLevel;
  message: string;
  /** Sciezka logiczna w paczce, np. "generators[2].cost". */
  path?: string;
}

export interface ValidationResult {
  ok: boolean;
  issues: ValidationIssue[];
  pack?: Pack;
}

const MANIFEST_ID_RE = /^[a-z][a-z0-9_]*$/;
const CONTENT_ID_RE = /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)*$/;
const SEMVER_RE = /^\d+\.\d+\.\d+(?:[-+].+)?$/;

/** Zbior stabilnych ID rdzenia — tylko one moga byc niezprefiksowane (definiuje je paczka rdzenia). */
const CORE_IDS: ReadonlySet<string> = new Set<string>([...CORE_RESOURCE_IDS, ...CORE_GENERATOR_IDS]);

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function pushFormulaIssues(
  formula: unknown,
  path: string,
  issues: ValidationIssue[],
): void {
  if (typeof formula !== 'string') {
    issues.push({ level: 'error', message: `Pole '${path}' musi byc formula (tekstem).`, path });
    return;
  }
  try {
    const node = parseFormula(formula);
    const { refs, functions } = collectRefs(node);
    for (const ref of refs) {
      if (!isKnownNamespace(ref)) {
        issues.push({
          level: 'error',
          message: `Formula '${path}' uzywa nieznanej przestrzeni nazw w '${ref}'.`,
          path,
        });
      }
    }
    for (const fn of functions) {
      if (!isKnownFunction(fn)) {
        issues.push({ level: 'error', message: `Formula '${path}' wola nieznana funkcje '${fn}'.`, path });
      }
    }
  } catch (e) {
    const msg = e instanceof FormulaError ? `${e.message} (pozycja ${e.pos})` : String(e);
    issues.push({ level: 'error', message: `Blad formuly w '${path}': ${msg}`, path });
  }
}

function validateEffect(effect: EffectDef, path: string, issues: ValidationIssue[]): void {
  if (!isObject(effect) || typeof effect.type !== 'string') {
    issues.push({ level: 'error', message: `Efekt '${path}' nie ma pola 'type'.`, path });
    return;
  }
  if (!isKnownEffect(effect.type)) {
    issues.push({
      level: 'error',
      message: `Efekt '${path}' uzywa nieznanego typu '${effect.type}'. Sprawdz slownik efektow.`,
      path,
    });
    return;
  }
  const spec = EFFECTS[effect.type];
  if (spec) {
    for (const field of spec.fields) {
      if (!(field in effect) || (effect as Record<string, unknown>)[field] === undefined) {
        issues.push({
          level: 'error',
          message: `Efekt '${effect.type}' w '${path}' wymaga pola '${field}'.`,
          path,
        });
      }
    }
  }
  // Pola formularne moga byc liczba (OK) albo formula-tekstem (musi sie parsowac).
  for (const f of ['value', 'amount', 'delta'] as const) {
    const v = effect[f];
    if (typeof v === 'string') pushFormulaIssues(v, `${path}.${f}`, issues);
  }
  // Opcjonalny warunek efektu (Faza 5B) — formula logiczna „zastosuj efekt, jesli…".
  if (typeof effect.condition === 'string') pushFormulaIssues(effect.condition, `${path}.condition`, issues);
}

function validateEffects(effects: unknown, path: string, issues: ValidationIssue[]): void {
  if (effects === undefined) return;
  if (!Array.isArray(effects)) {
    issues.push({ level: 'error', message: `Pole '${path}' musi byc lista efektow.`, path });
    return;
  }
  effects.forEach((e, i) => validateEffect(e as EffectDef, `${path}[${i}]`, issues));
}

function checkId(id: unknown, packId: string, path: string, issues: ValidationIssue[]): void {
  if (typeof id !== 'string' || !CONTENT_ID_RE.test(id)) {
    issues.push({
      level: 'error',
      message: `ID w '${path}' musi byc ASCII, male litery (np. '${packId}.cos'). Otrzymano: ${String(id)}.`,
      path,
    });
    return;
  }
  const prefixed = id.startsWith(packId + '.');
  if (!prefixed && !CORE_IDS.has(id)) {
    issues.push({
      level: 'warning',
      message: `ID '${id}' bez prefiksu paczki — zalecane '${packId}.${id}', by uniknac kolizji.`,
      path,
    });
  }
}

function validateManifest(raw: unknown, issues: ValidationIssue[]): PackManifest | undefined {
  if (!isObject(raw)) {
    issues.push({ level: 'error', message: 'Brak obiektu "manifest".', path: 'manifest' });
    return undefined;
  }
  const id = raw.id;
  if (typeof id !== 'string' || !MANIFEST_ID_RE.test(id)) {
    issues.push({
      level: 'error',
      message: `manifest.id musi byc ASCII, male litery, bez kropek (np. "nrd"). Otrzymano: ${String(id)}.`,
      path: 'manifest.id',
    });
  }
  if (typeof raw.name !== 'string' || raw.name.length === 0) {
    issues.push({ level: 'error', message: 'manifest.name jest wymagane.', path: 'manifest.name' });
  }
  if (typeof raw.version !== 'string' || !SEMVER_RE.test(raw.version)) {
    issues.push({
      level: 'error',
      message: `manifest.version musi byc semver (np. "1.0.0"). Otrzymano: ${String(raw.version)}.`,
      path: 'manifest.version',
    });
  }
  if (raw.schemaVersion !== SCHEMA_VERSION) {
    issues.push({
      level: 'warning',
      message: `Paczka pisana pod schemat ${String(raw.schemaVersion)}, gra uzywa ${SCHEMA_VERSION}. Mozliwa migracja lub niezgodnosc.`,
      path: 'manifest.schemaVersion',
    });
  }
  return raw as unknown as PackManifest;
}

function validateResource(r: ResourceDef, packId: string, idx: number, issues: ValidationIssue[]): void {
  const path = `resources[${idx}]`;
  checkId(r.id, packId, `${path}.id`, issues);
  if (typeof r.name !== 'string') issues.push({ level: 'error', message: `${path}.name wymagane.`, path });
  if (r.supply !== undefined) pushFormulaIssues(r.supply.price, `${path}.supply.price`, issues);
}

function validateGenerator(g: GeneratorDef, packId: string, idx: number, issues: ValidationIssue[]): void {
  const path = `generators[${idx}]`;
  checkId(g.id, packId, `${path}.id`, issues);
  if (typeof g.name !== 'string') issues.push({ level: 'error', message: `${path}.name wymagane.`, path });
  if (typeof g.costResource !== 'string') {
    issues.push({ level: 'error', message: `${path}.costResource wymagane.`, path });
  }
  if (typeof g.outputResource !== 'string') {
    issues.push({ level: 'error', message: `${path}.outputResource wymagane.`, path });
  }
  pushFormulaIssues(g.cost, `${path}.cost`, issues);
  pushFormulaIssues(g.production, `${path}.production`, issues);
  if (g.unlock !== undefined) pushFormulaIssues(g.unlock, `${path}.unlock`, issues);
}

/** Walidacja strukturalna + formul + efektow. Cross-ref (czy ID istnieja) robi `buildRegistry`. */
export function validatePack(raw: unknown): ValidationResult {
  const issues: ValidationIssue[] = [];
  if (!isObject(raw)) {
    return { ok: false, issues: [{ level: 'error', message: 'Paczka nie jest obiektem JSON.' }] };
  }
  const manifest = validateManifest(raw.manifest, issues);
  const packId = manifest?.id ?? '?';

  // Sekcje musza byc listami.
  for (const section of CONTENT_SECTIONS) {
    const val = (raw as Record<string, unknown>)[section];
    if (val !== undefined && !Array.isArray(val)) {
      issues.push({ level: 'error', message: `Sekcja '${section}' musi byc lista.`, path: section });
    }
  }

  const r = raw as Partial<PackContent>;
  (r.resources ?? []).forEach((x, i) => validateResource(x, packId, i, issues));
  (r.generators ?? []).forEach((x, i) => validateGenerator(x, packId, i, issues));
  (r.upgrades ?? []).forEach((u, i) => {
    checkId(u.id, packId, `upgrades[${i}].id`, issues);
    pushFormulaIssues(u.cost, `upgrades[${i}].cost`, issues);
    if (u.unlock !== undefined) pushFormulaIssues(u.unlock, `upgrades[${i}].unlock`, issues);
    validateEffects(u.effects, `upgrades[${i}].effects`, issues);
  });
  (r.milestones ?? []).forEach((m: MilestoneDef, i) => {
    checkId(m.id, packId, `milestones[${i}].id`, issues);
    pushFormulaIssues(m.trigger, `milestones[${i}].trigger`, issues);
    validateEffects(m.effects, `milestones[${i}].effects`, issues);
  });
  (r.achievements ?? []).forEach((a: AchievementDef, i) => {
    checkId(a.id, packId, `achievements[${i}].id`, issues);
    pushFormulaIssues(a.condition, `achievements[${i}].condition`, issues);
    if (a.multiplier !== undefined) pushFormulaIssues(a.multiplier, `achievements[${i}].multiplier`, issues);
  });
  (r.events ?? []).forEach((e: EventDef, i) => {
    checkId(e.id, packId, `events[${i}].id`, issues);
    if (e.trigger !== undefined) pushFormulaIssues(e.trigger, `events[${i}].trigger`, issues);
    validateEffects(e.effects, `events[${i}].effects`, issues);
    (e.options ?? []).forEach((o, j) => validateEffects(o.effects, `events[${i}].options[${j}].effects`, issues));
  });
  (r.treeNodes ?? []).forEach((n: TreeNodeDef, i) => {
    checkId(n.id, packId, `treeNodes[${i}].id`, issues);
    pushFormulaIssues(n.cost, `treeNodes[${i}].cost`, issues);
    validateEffects(n.effects, `treeNodes[${i}].effects`, issues);
  });
  (r.lexicon ?? []).forEach((l: LexiconDef, i) => checkId(l.id, packId, `lexicon[${i}].id`, issues));
  (r.ticker ?? []).forEach((t: TickerDef, i) => {
    checkId(t.id, packId, `ticker[${i}].id`, issues);
    if (t.condition !== undefined) pushFormulaIssues(t.condition, `ticker[${i}].condition`, issues);
  });
  (r.characters ?? []).forEach((c: CharacterDef, i) => {
    checkId(c.id, packId, `characters[${i}].id`, issues);
    validateEffects(c.passive, `characters[${i}].passive`, issues);
  });
  (r.bribes ?? []).forEach((b: BribeDef, i) => {
    checkId(b.id, packId, `bribes[${i}].id`, issues);
    pushFormulaIssues(b.cost, `bribes[${i}].cost`, issues);
    if (b.unlock !== undefined) pushFormulaIssues(b.unlock, `bribes[${i}].unlock`, issues);
  });
  (r.doctrines ?? []).forEach((d: DoctrineDef, i) => {
    checkId(d.id, packId, `doctrines[${i}].id`, issues);
    validateEffects(d.effects, `doctrines[${i}].effects`, issues);
    if (d.unlock !== undefined) pushFormulaIssues(d.unlock, `doctrines[${i}].unlock`, issues);
  });
  (r.diplomacy ?? []).forEach((d: DiplomacyDef, i) => {
    checkId(d.id, packId, `diplomacy[${i}].id`, issues);
    pushFormulaIssues(d.cost, `diplomacy[${i}].cost`, issues);
    if (d.unlock !== undefined) pushFormulaIssues(d.unlock, `diplomacy[${i}].unlock`, issues);
  });
  (r.synergies ?? []).forEach((s: SynergyDef, i) => {
    if (typeof s.requiresPack !== 'string' || s.requiresPack === '') {
      issues.push({ level: 'error', message: `Synergia synergies[${i}] musi mieć 'requiresPack' (id paczki).`, path: `synergies[${i}].requiresPack` });
    }
    validateEffects(s.effects, `synergies[${i}].effects`, issues);
  });
  (r.patches ?? []).forEach((p: PatchDef, i) => {
    if (typeof p.target !== 'string' || p.target === '') {
      issues.push({ level: 'error', message: `Łatka patches[${i}] musi mieć 'target' w formacie '<rodzaj>:<id>'.`, path: `patches[${i}].target` });
    }
    if (p.addCondition !== undefined) pushFormulaIssues(p.addCondition, `patches[${i}].addCondition`, issues);
  });

  const ok = !issues.some((x) => x.level === 'error') && manifest !== undefined;
  return { ok, issues, pack: ok ? (raw as unknown as Pack) : undefined };
}

// --- Scalanie w rejestr tresci ------------------------------------------------

export interface ContentRegistry {
  packs: PackManifest[];
  resources: Map<string, ResourceDef>;
  generators: Map<string, GeneratorDef>;
  generatorOrder: string[];
  upgrades: Map<string, UpgradeDef>;
  milestones: Map<string, MilestoneDef>;
  achievements: Map<string, AchievementDef>;
  events: Map<string, EventDef>;
  treeNodes: Map<string, TreeNodeDef>;
  lexicon: Map<string, LexiconDef>;
  ticker: TickerDef[];
  characters: Map<string, CharacterDef>;
  bribes: Map<string, BribeDef>;
  doctrines: Map<string, DoctrineDef>;
  diplomacy: Map<string, DiplomacyDef>;
  synergies: SynergyDef[];
  patches: PatchDef[];
  /** Pochodzenie treści (Faza 5D): id elementu → id paczki, która go wniosła (pierwszy definiujący wygrywa).
   *  Pozwala silnikowi AUTOMATYCZNIE nałożyć tożsamość wizualną paczki na całą jej treść (bez kodu per paczka). */
  packOf: Map<string, string>;
  /** Tożsamość wizualna paczek (Faza 5D / PLAN 3.5): id paczki → akcent/ikona. Rdzeń zwykle jej nie ma. */
  visualIdentities: Map<string, VisualIdentity>;
}

function emptyRegistry(): ContentRegistry {
  return {
    packs: [],
    resources: new Map(),
    generators: new Map(),
    generatorOrder: [],
    upgrades: new Map(),
    milestones: new Map(),
    achievements: new Map(),
    events: new Map(),
    treeNodes: new Map(),
    lexicon: new Map(),
    ticker: [],
    characters: new Map(),
    bribes: new Map(),
    doctrines: new Map(),
    diplomacy: new Map(),
    synergies: [],
    patches: [],
    packOf: new Map(),
    visualIdentities: new Map(),
  };
}

/** Sekcje treści niosące `id` — do zapisu pochodzenia (packOf) i tożsamości wizualnej. */
const ID_SECTIONS = [
  'resources', 'generators', 'upgrades', 'milestones', 'achievements',
  'events', 'treeNodes', 'lexicon', 'ticker', 'characters', 'bribes', 'doctrines', 'diplomacy',
] as const;

/** Deterministyczna kolejnosc scalania: wg priorytetu, potem alfabetycznie po id paczki (PLAN 3.4). */
export function mergeOrder(packs: Pack[]): Pack[] {
  return [...packs].sort((a, b) => {
    const pa = a.manifest.priority ?? 0;
    const pb = b.manifest.priority ?? 0;
    if (pa !== pb) return pa - pb;
    return a.manifest.id.localeCompare(b.manifest.id);
  });
}

function addUnique<T extends { id: string }>(
  map: Map<string, T>,
  items: T[] | undefined,
  section: string,
  issues: ValidationIssue[],
  order?: string[],
): void {
  for (const item of items ?? []) {
    if (map.has(item.id)) {
      issues.push({ level: 'error', message: `Kolizja ID '${item.id}' w sekcji '${section}'.`, path: section });
      continue;
    }
    map.set(item.id, item);
    if (order) order.push(item.id);
  }
}

export interface BuildResult {
  registry: ContentRegistry;
  issues: ValidationIssue[];
  order: string[];
}

/** Nakłada łatki (`patches`) na scaloną treść. Cel = `<rodzaj>:<id>`; `set` nadpisuje pola (poza `id`),
 *  `addCondition` dokleja warunek (AND) do pola warunkowego. Konflikty raportuje czytelnie (DLC 8.5). */
function applyPatches(reg: ContentRegistry, issues: ValidationIssue[]): void {
  type Cond = 'unlock' | 'trigger' | 'condition';
  const sections: Record<string, { map: Map<string, { id: string }>; cond?: Cond }> = {
    generator: { map: reg.generators, cond: 'unlock' },
    resource: { map: reg.resources },
    upgrade: { map: reg.upgrades, cond: 'unlock' },
    milestone: { map: reg.milestones, cond: 'trigger' },
    achievement: { map: reg.achievements, cond: 'condition' },
    event: { map: reg.events, cond: 'trigger' },
    treeNode: { map: reg.treeNodes },
    lexicon: { map: reg.lexicon },
    character: { map: reg.characters, cond: 'unlock' },
    bribe: { map: reg.bribes, cond: 'unlock' },
    doctrine: { map: reg.doctrines, cond: 'unlock' },
    diplomacy: { map: reg.diplomacy, cond: 'unlock' },
  };
  const touched = new Set<string>(); // "target.field" już raz tknięte — drugie tknięcie = kumulacja
  for (const patch of reg.patches) {
    const target = typeof patch.target === 'string' ? patch.target : '';
    const ci = target.indexOf(':');
    const kind = ci === -1 ? target : target.slice(0, ci);
    const id = ci === -1 ? '' : target.slice(ci + 1);
    const entry = sections[kind];
    if (!entry || !id || !entry.map.has(id)) {
      issues.push({
        level: 'error',
        message: `Łatka wskazuje nieistniejący cel '${target}'. Czy ID rdzenia i rodzaj są poprawne?`,
        path: `patches.${target || '?'}`,
      });
      continue;
    }
    const def = entry.map.get(id) as unknown as Record<string, unknown>;
    if (patch.set) {
      for (const [field, value] of Object.entries(patch.set)) {
        if (field === 'id') {
          issues.push({
            level: 'warning',
            message: `Łatka nie może zmienić 'id' celu '${target}' — pominięto to pole.`,
            path: `patches.${target}.set.id`,
          });
          continue;
        }
        const key = target + '.' + field;
        if (touched.has(key)) {
          issues.push({
            level: 'warning',
            message: `Pole '${field}' celu '${target}' łatane wielokrotnie — kumulacja, ostatnia łatka wygrywa.`,
            path: key,
          });
        }
        touched.add(key);
        def[field] = value;
      }
    }
    if (patch.addCondition !== undefined) {
      if (!entry.cond) {
        issues.push({
          level: 'warning',
          message: `Cel '${target}' nie ma pola warunkowego — 'addCondition' pominięto.`,
          path: `patches.${target}.addCondition`,
        });
      } else {
        const existing = def[entry.cond];
        def[entry.cond] =
          typeof existing === 'string' && existing.trim() !== ''
            ? `(${existing}) and (${patch.addCondition})`
            : patch.addCondition;
      }
    }
  }
}

/** Scala juz-zwalidowane paczki w jeden rejestr i sprawdza odwolania miedzy tresciami. */
export function buildRegistry(packs: Pack[]): BuildResult {
  const issues: ValidationIssue[] = [];
  const reg = emptyRegistry();
  const ordered = mergeOrder(packs);

  for (const pack of ordered) {
    reg.packs.push(pack.manifest);
    addUnique(reg.resources, pack.resources, 'resources', issues);
    addUnique(reg.generators, pack.generators, 'generators', issues, reg.generatorOrder);
    addUnique(reg.upgrades, pack.upgrades, 'upgrades', issues);
    addUnique(reg.milestones, pack.milestones, 'milestones', issues);
    addUnique(reg.achievements, pack.achievements, 'achievements', issues);
    addUnique(reg.events, pack.events, 'events', issues);
    addUnique(reg.treeNodes, pack.treeNodes, 'treeNodes', issues);
    addUnique(reg.lexicon, pack.lexicon, 'lexicon', issues);
    addUnique(reg.characters, pack.characters, 'characters', issues);
    addUnique(reg.bribes, pack.bribes, 'bribes', issues);
    addUnique(reg.doctrines, pack.doctrines, 'doctrines', issues);
    addUnique(reg.diplomacy, pack.diplomacy, 'diplomacy', issues);
    if (pack.ticker) reg.ticker.push(...pack.ticker);
    if (pack.synergies) reg.synergies.push(...pack.synergies);
    if (pack.patches) reg.patches.push(...pack.patches);
    // Pochodzenie treści + tożsamość wizualna paczki (Faza 5D). Pierwszy definiujący id wygrywa
    // (zgodnie z addUnique — kolizje to błąd i nie nadpisują). Rdzeń bez visualIdentity = bez akcentu.
    for (const key of ID_SECTIONS) {
      const arr = pack[key] as { id: string }[] | undefined;
      if (!arr) continue;
      for (const item of arr) {
        if (item && typeof item.id === 'string' && !reg.packOf.has(item.id)) reg.packOf.set(item.id, pack.manifest.id);
      }
    }
    if (pack.manifest.visualIdentity) reg.visualIdentities.set(pack.manifest.id, pack.manifest.visualIdentity);
  }

  // Łatki (pre-patch, DLC 8.4 / Faza 5B) — nakladane PO scaleniu calej tresci, w deterministycznej
  // kolejnosci paczek (reg.patches juz w kolejnosci mergeOrder). Cel musi istniec; kumulacja A→B.
  applyPatches(reg, issues);

  // Cross-ref: doktryna z „bombą" musi wskazywac istniejace zdarzenie kryzysowe.
  for (const d of reg.doctrines.values()) {
    if (d.debt && !reg.events.has(d.debt.crisisEvent)) {
      issues.push({
        level: 'error',
        message: `Doktryna '${d.id}' odwoluje sie do zdarzenia '${d.debt.crisisEvent}', ktorego nie ma.`,
        path: `doctrines.${d.id}.debt.crisisEvent`,
      });
    }
  }

  // Cross-ref: kazdy generator musi wskazywac istniejace zasoby.
  for (const g of reg.generators.values()) {
    if (!reg.resources.has(g.costResource)) {
      issues.push({
        level: 'error',
        message: `Generator '${g.id}' placi zasobem '${g.costResource}', ktorego nie ma.`,
        path: `generators.${g.id}.costResource`,
      });
    }
    if (!reg.resources.has(g.outputResource)) {
      issues.push({
        level: 'error',
        message: `Generator '${g.id}' produkuje zasob '${g.outputResource}', ktorego nie ma.`,
        path: `generators.${g.id}.outputResource`,
      });
    }
  }

  return { registry: reg, issues, order: ordered.map((p) => p.manifest.id) };
}
