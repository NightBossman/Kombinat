// state.ts — Ksztalt autorytatywnego stanu gry (zyje w Web Workerze) + serializacja do/z save'a.
// Liczby trzymamy jako Decimal (break_infinity). W save'ie sa stringami (deterministyczne, ASCII).
import { Decimal, ONE, SCHEMA_VERSION, ZERO, type ContentRegistry } from '@kombinat/shared';

export interface GeneratorState {
  owned: Decimal;
}

export interface GameStats {
  totalClicks: number;
  /** Sumaryczna produkcja per zasob od poczatku gry (all-time). */
  producedTotal: Record<string, Decimal>;
  /** Produkcja w BIEZACEJ rozgrywce (od ostatniej Denominacji) — metryka zysku z prestizu. */
  runProduced: Record<string, Decimal>;
  /** Liczba wykonanych Denominacji. */
  denominations: number;
  playTimeSec: number;
  createdAt: number;
  /** Czas ostatniej aktywnosci — do doliczenia postepu po powrocie. */
  lastSeen: number;
  /** Elastyczny worek licznikow all-time (uwaga #22): gielda_transakcje, tasma_lacznie,
   *  zlote_klikniecia, seria_klikniec_max itd. Latwo dodawac nowe bez zmiany schematu. */
  counters: Record<string, number>;
}

export interface GameState {
  schemaVersion: number;
  resources: Record<string, Decimal>;
  generators: Record<string, GeneratorState>;
  upgrades: Record<string, boolean>;
  /** Osiagniete kamienie milowe (trwale, jednorazowe wyzwolenie). */
  milestones: Record<string, boolean>;
  /** Wezly drzewa dziedzictwa — TRWALE (PLAN 7.5). Wartosc = POSIADANY POZIOM (0/brak = niekupiony). */
  treeNodes: Record<string, number>;
  /** Zdarzenia, ktore juz wystapily (dla once / lancuchow) — resetowane przy Denominacji. */
  eventsFired: Record<string, boolean>;
  /** Odkryte wpisy Leksykonu — TRWALE (kolekcja przezywa Denominacje, to „bank”). */
  lexiconUnlocked: Record<string, boolean>;
  /** Zdobyte osiagniecia — TRWALE (kolekcja all-time; mnozniki aktywuje wezel drzewa). */
  achievements: Record<string, boolean>;
  /** Zwerbowana kadra (per-rozgrywka, resetowana przy Denominacji) — pasywne bonusy. */
  characters: Record<string, boolean>;
  /** Wybrana doktryna ze Zjazdu PZPR na TĘ pięciolatkę (Faza 4B). '' = brak. Reset przy Denominacji. */
  doctrine: string;
  /** Faza „limbo" MIĘDZY pięciolatkami (0.4.3): '' = normalna gra; 'ceremony' → 'tree' → 'zjazd' →
   *  'splash'. Gdy ustawiona, GRA JEST WSTRZYMANA (nic nie produkuje) — stara rozgrywka już się skończyła,
   *  nowa jeszcze się nie zaczęła. TRWAŁE w save → po zamknięciu gry wracamy do tego samego etapu. */
  interRun: string;
  /** Ile odznaczeń dała Denominacja, która otworzyła to limbo — do ekranu ceremonii (odporne na reload). */
  interRunGain: Decimal;
  flags: Record<string, number>;
  clickPower: Decimal;
  stats: GameStats;
}

/** Postac zapisywalna (czysty JSON, Decimale jako stringi). */
export interface SaveData {
  schemaVersion: number;
  resources: Record<string, string>;
  generators: Record<string, string>;
  upgrades: Record<string, boolean>;
  milestones: Record<string, boolean>;
  /** Poziomy wezlow drzewa (number). Stare zapisy moga miec boolean — deserializacja koersuje. */
  treeNodes: Record<string, number>;
  eventsFired: Record<string, boolean>;
  lexiconUnlocked: Record<string, boolean>;
  achievements: Record<string, boolean>;
  characters: Record<string, boolean>;
  doctrine?: string;
  interRun?: string;
  interRunGain?: string;
  flags: Record<string, number>;
  clickPower: string;
  stats: {
    totalClicks: number;
    producedTotal: Record<string, string>;
    runProduced: Record<string, string>;
    denominations: number;
    playTimeSec: number;
    createdAt: number;
    lastSeen: number;
    counters?: Record<string, number>;
  };
}

export function createInitialState(registry: ContentRegistry): GameState {
  const resources: Record<string, Decimal> = {};
  const producedTotal: Record<string, Decimal> = {};
  const runProduced: Record<string, Decimal> = {};
  for (const id of registry.resources.keys()) {
    resources[id] = ZERO;
    producedTotal[id] = ZERO;
    runProduced[id] = ZERO;
  }
  const generators: Record<string, GeneratorState> = {};
  for (const id of registry.generators.keys()) {
    generators[id] = { owned: ZERO };
  }
  const now = Date.now();
  return {
    schemaVersion: SCHEMA_VERSION,
    resources,
    generators,
    upgrades: {},
    milestones: {},
    treeNodes: {},
    eventsFired: {},
    lexiconUnlocked: {},
    achievements: {},
    characters: {},
    doctrine: '',
    interRun: '',
    interRunGain: ZERO,
    flags: {},
    clickPower: ONE,
    stats: {
      totalClicks: 0,
      producedTotal,
      runProduced,
      denominations: 0,
      playTimeSec: 0,
      createdAt: now,
      lastSeen: now,
      counters: {},
    },
  };
}

export function serializeState(s: GameState): SaveData {
  const resources: Record<string, string> = {};
  for (const [k, v] of Object.entries(s.resources)) resources[k] = v.toString();
  const generators: Record<string, string> = {};
  for (const [k, v] of Object.entries(s.generators)) generators[k] = v.owned.toString();
  const producedTotal: Record<string, string> = {};
  for (const [k, v] of Object.entries(s.stats.producedTotal)) producedTotal[k] = v.toString();
  const runProduced: Record<string, string> = {};
  for (const [k, v] of Object.entries(s.stats.runProduced)) runProduced[k] = v.toString();
  return {
    schemaVersion: s.schemaVersion,
    resources,
    generators,
    upgrades: { ...s.upgrades },
    milestones: { ...s.milestones },
    treeNodes: { ...s.treeNodes },
    eventsFired: { ...s.eventsFired },
    lexiconUnlocked: { ...s.lexiconUnlocked },
    achievements: { ...s.achievements },
    characters: { ...s.characters },
    doctrine: s.doctrine,
    interRun: s.interRun,
    interRunGain: s.interRunGain.toString(),
    flags: { ...s.flags },
    clickPower: s.clickPower.toString(),
    stats: {
      totalClicks: s.stats.totalClicks,
      producedTotal,
      runProduced,
      denominations: s.stats.denominations,
      playTimeSec: s.stats.playTimeSec,
      createdAt: s.stats.createdAt,
      lastSeen: s.stats.lastSeen,
      counters: { ...s.stats.counters },
    },
  };
}

/**
 * Odtwarza stan z save'a wzgledem AKTUALNEGO rejestru tresci. Odporny na rozbieznosci:
 * brakujace ID dostaja wartosc domyslna, nieznane ID z save'a sa pomijane (PLAN 4.5 — migracja,
 * toggling DLC). Dzieki temu save z innym zestawem paczek wczytuje sie sensownie.
 */
export function deserializeState(data: SaveData, registry: ContentRegistry): GameState {
  const base = createInitialState(registry);

  for (const id of registry.resources.keys()) {
    const raw = data.resources?.[id];
    if (raw !== undefined) base.resources[id] = new Decimal(raw);
    const prod = data.stats?.producedTotal?.[id];
    if (prod !== undefined) base.stats.producedTotal[id] = new Decimal(prod);
    const run = data.stats?.runProduced?.[id];
    if (run !== undefined) base.stats.runProduced[id] = new Decimal(run);
  }
  for (const id of registry.generators.keys()) {
    const raw = data.generators?.[id];
    if (raw !== undefined) base.generators[id] = { owned: new Decimal(raw) };
  }

  base.upgrades = { ...(data.upgrades ?? {}) };
  base.milestones = { ...(data.milestones ?? {}) };
  // Poziomy wezlow drzewa — koersja ze starych zapisow (boolean true -> poziom 1).
  base.treeNodes = {};
  for (const [k, v] of Object.entries((data.treeNodes ?? {}) as Record<string, number | boolean>)) {
    base.treeNodes[k] = typeof v === 'number' ? v : v ? 1 : 0;
  }
  base.eventsFired = { ...(data.eventsFired ?? {}) };
  base.lexiconUnlocked = { ...(data.lexiconUnlocked ?? {}) };
  base.achievements = { ...(data.achievements ?? {}) };
  base.characters = { ...(data.characters ?? {}) };
  base.doctrine = data.doctrine ?? '';
  base.interRun = data.interRun ?? '';
  base.interRunGain = data.interRunGain !== undefined ? new Decimal(data.interRunGain) : ZERO;
  base.flags = { ...(data.flags ?? {}) };
  if (data.clickPower !== undefined) base.clickPower = new Decimal(data.clickPower);
  if (data.stats) {
    base.stats.totalClicks = data.stats.totalClicks ?? 0;
    base.stats.denominations = data.stats.denominations ?? 0;
    base.stats.playTimeSec = data.stats.playTimeSec ?? 0;
    base.stats.createdAt = data.stats.createdAt ?? base.stats.createdAt;
    base.stats.lastSeen = data.stats.lastSeen ?? base.stats.lastSeen;
    base.stats.counters = { ...(data.stats.counters ?? {}) };
  }
  return base;
}
