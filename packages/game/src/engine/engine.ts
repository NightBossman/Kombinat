// engine.ts — Czysta logika rdzenia (bez DOM, bez Workera) — dzieki temu testowalna wprost.
// Faza 1: silnik efektow (ulepszenia + kamienie milowe), dwa zasoby, pelna drabina, offline O(1),
// cele "Co dalej?". Worker (worker.ts) jest cienka powloka czasowo-komunikacyjna wokol tej klasy.
import {
  Decimal,
  ONE,
  ZERO,
  evalBool,
  evalNumber,
  formatNumber,
  pluralizePL,
  pluralizePLStable,
  resolveVisualIdentity,
  type ContentRegistry,
  type EvalContext,
  type PluralFormsPL,
  type ResourceDef,
  type TrustTier,
} from '@kombinat/shared';
import { makeContext } from './context';
import {
  applyImmediateEffects,
  applyStartWith,
  computeModifiers,
  effNum,
  emptyModifiers,
  genCostMul,
  genProdAdd,
  genProdMul,
  parseTarget,
  ODZNACZENIE_BONUS,
  type Modifiers,
} from './effects';
import type { EventDef } from '@kombinat/shared';
import { describeEffects, thresholdProgress, type ThresholdInfo } from './present';
import {
  createInitialState,
  deserializeState,
  serializeState,
  type GameState,
  type SaveData,
} from './state';
import type {
  AchievementView,
  ActiveEventView,
  BribeView,
  CharacterView,
  DoctrineView,
  DyplomacjaView,
  GeneratorView,
  GieldaView,
  Goals,
  GoalView,
  LexiconView,
  PrestigeView,
  RelationView,
  ResourceView,
  Snapshot,
  SupplyView,
  TreeNodeStatus,
  TreeNodeView,
  UpgradeView,
  ZalatwianieView,
  ZjazdView,
} from './snapshot';
import { upgradeGroup } from './snapshot';

/** Maksymalne doliczenie po powrocie (Faza 1). Closed-form O(1) — nie zalezy od wielkosci `elapsed`. */
const MAX_CATCHUP_SEC = 14 * 24 * 3600;

// Skala prestizu (Faza 2, STARTOWA — stroic na zywo): odznaczenia = floor(sqrt(wytworzone / SKALA)).
// Pierwsza Denominacja dostepna po wytworzeniu SKALA jednostek glownego zasobu w jednej rozgrywce.
const PRESTIGE_SCALE = new Decimal('1e6');

// Zdarzenia (Faza 3A): losowe co ~EVENT_ROLL_SEC; po kazdym zdarzeniu min. przerwa EVENT_GAP_SEC.
// Rzadziej niz wczesniej (uwaga #14) — event ma byc wydarzeniem, nie szumem.
const EVENT_ROLL_SEC = 150;
const EVENT_GAP_SEC = 70;

// Gielda (Faza 3D): prowizja przy sprzedazy (czyni round-trip lekko stratnym; zysk z timingu kursu).
const GIELDA_SPREAD = 0.05;
// Bazowy kurs kantoru — SPECJALNIE niewielki: 1 dewiza to KILKA–KILKANAŚCIE cykli, nie przelicznik
// całej produkcji (decyzja właściciela 2026-06-24). Oscylacja (gieldaRateAt) daje wahania ~6–17.
const GIELDA_BASE_RATE = 12;

// Liczniki „serii" (uwaga #22): przerwa dluzsza niz ponizsza zeruje serie.
const CLICK_STREAK_GAP_MS = 3000; // klikanie „pod rzad"
const TASMA_GAP_MS = 60000; // gry w Tasme „za jednym zamachem"

// Załatwianie/łapówki (Faza 4A): ryzyko kontroli 0..100, opada w czasie; powyżej progu rośnie
// szansa, że łapówka ściągnie kontrolę (kara + reset). Decydent ryzyko-nagroda, nie darmowy guzik.
const RISK_DECAY_PER_SEC = 1.0; // ile ryzyka schodzi na sekundę (ze 100 do 0 ~ 100 s — nieco wolniej niż wcześniej)
const RISK_KONTROLA_THRESHOLD = 40; // poniżej tego smarowanie bezpieczne
const ZAL_MAX_ACTIVE = 6; // limit jednocześnie AKTYWNYCH bonusów z Załatwiania (blokada zakupu ponad)
// Zaopatrzenie (Faza 4A → przerobione): RZADKA, mocna promocja „rzut towaru". Trwa SUPPLY_DEAL_MS,
// a NASTĘPNA przychodzi dopiero SUPPLY_GAP_MS po zakończeniu poprzedniej (odliczanie od KOŃCA, nie od
// początku). Każda promocja losuje jeden z trzech rabatów (równe szanse, NIGDY dwa takie same pod rząd).
const SUPPLY_DEAL_MS = 12000; // promocja trwa 12 s
const SUPPLY_GAP_MS = 120000; // następna promocja 2 min PO zakończeniu poprzedniej
const SUPPLY_DEAL_PCTS = [55, 75, 90] as const; // możliwe rabaty (%) — równe szanse, bez powtórki z rzędu

/** Losuje rabat promocji: równe szanse na każdy z trzech, ale NIGDY taki sam jak poprzedni (no-repeat).
 *  Wykluczenie poprzedniego daje też równy rozkład brzegowy (symetria 3 stanów bez pętli własnej). */
function pickDealPct(last: number): number {
  const opts = SUPPLY_DEAL_PCTS.filter((p) => p !== last);
  return opts[Math.floor(Math.random() * opts.length)]!;
}

function nameForms(name: string): PluralFormsPL {
  return { one: name, few: name, many: name, fractional: name };
}
function formsFor(def: ResourceDef): PluralFormsPL {
  return def.plural ?? nameForms(def.name);
}
function clamp01(d: Decimal): number {
  return Math.max(0, Math.min(1, d.toNumber()));
}

export interface CatchUpResult {
  seconds: number;
  gains: { id: string; name: string; amount: string }[];
}

export class Engine {
  readonly registry: ContentRegistry;
  state: GameState;
  readonly clickResource: string;
  private mods: Modifiers = emptyModifiers();

  // Ile sztuk generatora kupuje jedno kliknięcie (UI: x1/x10/x100/Max). Runtime, nie serializowany.
  buyAmount: 1 | 10 | 100 | 'max' = 1;

  // Stan zdarzen (runtime, nie serializowany): aktywne okno + kolejka lancucha + czas ostatniego.
  private eventActive: EventDef | null = null;
  private eventQueue: string[] = [];
  private lastEventMs = 0;
  // Pauza zdarzen (np. na czas minigry — nie wybudzac gracza z immersji). Timer „zamraza sie":
  // po wznowieniu przesuwamy lastEventMs o czas pauzy, by zdarzenie nie wystrzelilo natychmiast.
  private eventsPaused = false;
  private eventsPausedAt = 0;
  // Akumulator do dlawienia sprawdzania osiagniec (nie co tick — wystarczy ~4 Hz).
  private achAccum = 0;
  // Losowa faza kursu gieldy (runtime).
  private gieldaPhase = Math.random() * 1000;
  // Harmonogram promocji zaopatrzenia (runtime, nieserializowany — efemeryczny „rzut towaru"):
  // `dealUntil` = ms końca trwającej promocji (0 = brak), `nextDealAt` = ms startu następnej
  // (liczony od KOŃCA poprzedniej), `dealPct` = bieżący rabat %, `lastDealPct` = poprzedni (no-repeat).
  private dealUntil = 0;
  private nextDealAt = -1;
  private dealPct: number = SUPPLY_DEAL_PCTS[0];
  private lastDealPct = 0;
  // Stopień zaufania per paczka DLC (Faza 5C→5D) — ustalany przy wczytaniu zapieczętowanej paczki.
  // Steruje pieczęcią wizualną (oficjalna vs społecznościowa). Pusty = brak wczytanych paczek DLC.
  trustByPack: Map<string, TrustTier> = new Map();
  // Bufor SWIEZO zdobytych osiagniec — do powiadomien toast (uwaga #3). Oprozniany przy migawce.
  private justEarned: AchievementView[] = [];
  // Liczniki serii (runtime — same serie trzymamy w state.stats.counters, tu tylko czas ostatniego).
  private lastClickMs = 0;
  private lastTasmaMs = 0;
  // Aktywne tymczasowe bonusy (runtime, wygasają): z „okazji" (uwaga #21) oraz z łapówek (Faza 4A).
  // Zakresy: 'prod' (cała produkcja), 'click' (klikanie), 'cost' (koszty, mul<1 = taniej),
  // 'dewizy' (produkcja dewiz).
  // `src` rozróżnia POCHODZENIE bonusu: 'bribe' (z Załatwiania — liczony do limitu i kasowany przy
  // ryzyku 100%) vs 'okazja' (złote ciastko — nietykalny przez kontrolę SB).
  private activeBuffs: { id: number; kind: 'prod' | 'click' | 'cost' | 'dewizy'; mult: number; until: number; label: string; src: 'bribe' | 'okazja' }[] = [];
  // Licznik nadający KAŻDEMU bonusowi unikalne id — UI kluczuje po nim listę bonusów. Bez tego dwa bonusy
  // o tej samej nazwie (np. dwa razy „Kolacja z dygnitarzem") dawały duplikat klucza i ZAMRAŻAŁY render.
  private buffSeq = 0;
  // Cache celów „Co dalej?" — najbliższe osiągnięcie skanuje 300+ pozycji, a cele nie muszą się
  // odświeżać 10x/s (paski i tak interpolują się po stronie UI). Throttle = tania migawka late game.
  private goalsCache: Goals | null = null;
  private goalsCacheAt = 0;
  // Ostatnio policzone tempo produkcji/sek (Faza 5A) — zasila przestrzeń `tempo.<zasob>` w formułach
  // warunków/odblokowań. Aktualizowane w tick() i snapshot(); NIE liczymy go w pętli kosztów (drogo,
  // i kosztów-tempo nikt nie używa), więc konteksty kosztu/produkcji go nie dostają.
  private lastRates: Record<string, Decimal> = {};
  // Statyczne pola ulepszenia (opis/grupa zawsze stałe; koszt stały, gdy formuła to czysta liczba) —
  // liczone RAZ, by migawka nie budowała setek stringów/ewaluacji co klatkę (wydajność przy setkach
  // ulepszeń, docs/ULEPSZENIA.md U1/U6). Koszt dynamiczny (formuła z odwołaniami) liczymy za każdym razem.
  private upMetaCache = new Map<
    string,
    { effectText: string; group: string; staticCost?: { price: Decimal; costStr: string; costUnit: string } }
  >();

  /** Kontekst do ODCZYTÓW stanu (odblokowania, wyzwalacze, warunki, koszty stałe, migawka). Wstrzykuje
   *  uczciwe `tempo` z ostatniego pomiaru. Pętle produkcji budują własny kontekst bez `tempo`. */
  private queryCtx(): EvalContext {
    return makeContext(this.state, { tempo: this.lastRates });
  }

  /** Tożsamość wizualna treści DLC (Faza 5D): akcent + pieczęć (oficjalna/społecznościowa) z manifestu
   *  paczki-źródła. Treść RDZENIA (corePackId) wygląda natywnie — bez akcentu i pieczęci („bez szwu”). */
  private dlcVisual(contentId: string, corePackId?: string): { accent?: string; dlcSeal?: 'official' | 'community' } {
    const vi = resolveVisualIdentity(this.registry, contentId, this.trustByPack);
    if (!vi || vi.packId === corePackId) return {};
    return { accent: vi.accentColor, dlcSeal: vi.official ? 'official' : 'community' };
  }

  constructor(registry: ContentRegistry, save?: SaveData) {
    this.registry = registry;
    this.clickResource = [...registry.resources.keys()][0] ?? 'cykle';
    this.state = save ? deserializeState(save, registry) : createInitialState(registry);
    // Pierwsze losowe zdarzenie ~40 s po starcie sesji (onboarding: gracz szybko poznaje system).
    this.lastEventMs = Date.now() - (EVENT_ROLL_SEC - 40) * 1000;
    this.recomputeModifiers();
  }

  recomputeModifiers(): void {
    this.mods = computeModifiers(this.registry, this.state);
  }

  // --- pomocnicze odczyty ----------------------------------------------------

  private ownedOf(id: string): Decimal {
    return this.state.generators[id]?.owned ?? ZERO;
  }

  /** Produkcja na sztuke generatora po modyfikatorach. */
  private perUnit(genId: string, ctx: EvalContext): Decimal {
    const g = this.registry.generators.get(genId);
    if (!g) return ZERO;
    const base = evalNumber(g.production, ctx);
    return base.mul(genProdMul(this.mods, genId, g.outputResource)).add(genProdAdd(this.mods, genId));
  }

  currentRates(): Record<string, Decimal> {
    const rates: Record<string, Decimal> = {};
    for (const [id, g] of this.registry.generators) {
      const owned = this.ownedOf(id);
      if (owned.lte(ZERO)) continue;
      const ctx = makeContext(this.state, { currentGeneratorOwned: owned });
      rates[g.outputResource] = (rates[g.outputResource] ?? ZERO).add(this.perUnit(id, ctx).mul(owned));
    }
    // Tymczasowe bonusy produkcji z „okazji"/łapówek — globalny (prod) + osobno dewizy.
    const pb = this.buffMul('prod');
    if (pb !== 1) for (const k of Object.keys(rates)) rates[k] = rates[k]!.mul(pb);
    const db = this.buffMul('dewizy');
    if (db !== 1 && rates['dewizy']) rates['dewizy'] = rates['dewizy'].mul(db);
    return rates;
  }

  /** Iloczyn aktywnych (niewygasłych) bonusów danego zakresu. */
  private buffMul(kind: 'prod' | 'click' | 'cost' | 'dewizy'): number {
    const now = Date.now();
    let m = 1;
    for (const b of this.activeBuffs) if (b.kind === kind && b.until > now) m *= b.mult;
    return m;
  }

  private costAtOwned(id: string, owned: Decimal): Decimal {
    const g = this.registry.generators.get(id);
    if (!g) return ZERO;
    const base = evalNumber(g.cost, makeContext(this.state, { currentGeneratorOwned: owned }));
    // Łapówki mogą czasowo obniżyć koszty (scope 'cost', mul<1 = taniej) — Faza 4A.
    return base.mul(genCostMul(this.mods, id)).mul(this.buffMul('cost'));
  }

  cost(id: string): Decimal {
    return this.costAtOwned(id, this.ownedOf(id));
  }

  /** Łączny koszt zakupu `count` sztuk od bieżącego stanu (suma geometryczna; mnożnik z dwóch
   *  kolejnych cen — zgodny z dowolną geometryczną krzywą `base × mul^posiadane`). */
  costForCount(id: string, count: number): Decimal {
    if (count <= 1) return this.cost(id);
    const owned = this.ownedOf(id);
    const c0 = this.costAtOwned(id, owned);
    if (c0.lte(ZERO)) return ZERO;
    const mul = this.costAtOwned(id, owned.add(ONE)).div(c0);
    if (mul.lte(new Decimal('1.0000001'))) return c0.mul(count).ceil();
    return c0.mul(mul.pow(count).sub(ONE)).div(mul.sub(ONE)).ceil(); // c0 × (mul^n − 1)/(mul − 1)
  }

  /** Maks. liczba sztuk, na które stać teraz (zamknięta forma odwrotna sumy geometrycznej). */
  maxBuyCount(id: string): number {
    const g = this.registry.generators.get(id);
    if (!g) return 0;
    const c0 = this.cost(id);
    if (c0.lte(ZERO)) return 0;
    const have = this.state.resources[g.costResource] ?? ZERO;
    if (have.lt(c0)) return 0;
    const mul = this.costAtOwned(id, this.ownedOf(id).add(ONE)).div(c0);
    if (mul.lte(new Decimal('1.0000001'))) return Math.max(1, Math.floor(have.div(c0).toNumber()));
    // n = floor( log_mul(1 + have·(mul−1)/c0) ). Decimal.ln() zwraca number (mieści się w double).
    const inner = ONE.add(have.mul(mul.sub(ONE)).div(c0));
    const n = Math.floor(inner.ln() / mul.ln());
    return Math.max(1, n);
  }

  /** Ile sztuk kupi jedno kliknięcie przy aktualnym wyborze x1/x10/x100/Max. */
  resolveBuyCount(id: string): number {
    return this.buyAmount === 'max' ? this.maxBuyCount(id) : this.buyAmount;
  }

  clickPower(): Decimal {
    return this.state.clickPower
      .add(this.mods.clickFlatAdd)
      .mul(this.mods.prodGlobalMul)
      .mul(this.mods.clickMul) // premia dyplomatyczna 'click'
      .mul(this.buffMul('click')); // np. „czyn społeczny" ×777 (uwaga #21)
  }

  isUnlocked(id: string): boolean {
    const g = this.registry.generators.get(id);
    if (!g) return false;
    if (!g.unlock) return true;
    return evalBool(g.unlock, this.queryCtx());
  }

  /** Ulepszenie dostepne do kupna: spelniony unlock i jeszcze niekupione (dla `once`). */
  isUpgradeAvailable(id: string): boolean {
    const u = this.registry.upgrades.get(id);
    if (!u) return false;
    if ((u.once ?? true) && this.state.upgrades[id]) return false;
    if (!u.unlock) return true;
    return evalBool(u.unlock, this.queryCtx());
  }

  // --- akcje -----------------------------------------------------------------

  tick(dtSec: number): void {
    if (dtSec <= 0) return;
    if (this.state.interRun) return; // limbo między pięciolatkami — stara gra skończona, nowa jeszcze nie ruszyła
    const rates = this.currentRates();
    this.lastRates = rates; // zasil `tempo.<zasob>` w formułach warunków/odblokowań (Faza 5A)
    const dt = new Decimal(dtSec);
    for (const [resId, rate] of Object.entries(rates)) {
      const add = rate.mul(dt);
      this.state.resources[resId] = (this.state.resources[resId] ?? ZERO).add(add);
      this.state.stats.producedTotal[resId] = (this.state.stats.producedTotal[resId] ?? ZERO).add(add);
      this.state.stats.runProduced[resId] = (this.state.stats.runProduced[resId] ?? ZERO).add(add);
    }
    this.state.stats.playTimeSec += dtSec;
    this.state.stats.lastSeen = Date.now();
    // Ryzyko kontroli z łapówek opada w czasie (Faza 4A) — okazjonalne smarowanie jest bezpieczne.
    const risk = this.state.flags['ryzyko'] ?? 0;
    if (risk > 0) this.state.flags['ryzyko'] = Math.max(0, risk - RISK_DECAY_PER_SEC * dtSec);
    this.updateDoctrineDebt(dtSec); // „bomba zadłużenia" doktryny (Faza 4B) — boom-bust gierkowski
    this.updateLexicon();
    // kamienie milowe i osiagniecia sprawdzamy ~4 Hz (i raz po duzym ticku offline), nie 20 Hz —
    // wydajnosc late game (setki kamieni milowych po U5, docs/ULEPSZENIA.md).
    this.achAccum += dtSec;
    if (this.achAccum >= 0.25) {
      this.achAccum = 0;
      this.checkMilestones();
      this.checkAchievements();
    }
  }

  /** Doliczenie po powrocie (closed-form O(1)); zwraca podsumowanie zarobku do pokazania graczowi. */
  catchUp(elapsedSec: number): CatchUpResult {
    // W limbo (między pięciolatkami) czas NIE liczy się jako offline — nowa gra jeszcze nie ruszyła.
    if (this.state.interRun) return { seconds: 0, gains: [] };
    const e = Math.max(0, Math.min(elapsedSec, MAX_CATCHUP_SEC));
    // Zarobek liczymy z TEMPA × czas, a NIE z różnicy „stan przed/po": gdy danego zasobu masz o rzędy
    // wielkości więcej niż przybyło, różnica gubi się w precyzji liczby (1e40 + 1e25 ≈ 1e40) i raport
    // błędnie POMIJAŁ tę walutę. Tempo × czas to dokładnie tyle, ile dolicza tick() (model stałego tempa).
    const rates = e > 0 ? this.currentRates() : {};
    if (e > 0) this.tick(e);
    const eDec = new Decimal(e);
    const gains: CatchUpResult['gains'] = [];
    for (const [id, def] of this.registry.resources) {
      const gain = (rates[id] ?? ZERO).mul(eDec);
      if (gain.gt(ZERO)) {
        gains.push({
          id,
          name: pluralizePL(gain.toNumber(), formsFor(def)),
          amount: formatNumber(gain),
        });
      }
    }
    return { seconds: e, gains };
  }

  click(): void {
    const r = this.clickResource;
    const power = this.clickPower();
    this.state.resources[r] = (this.state.resources[r] ?? ZERO).add(power);
    this.state.stats.producedTotal[r] = (this.state.stats.producedTotal[r] ?? ZERO).add(power);
    this.state.stats.runProduced[r] = (this.state.stats.runProduced[r] ?? ZERO).add(power);
    this.state.stats.totalClicks += 1;
    // Seria klikania „pod rząd" (uwaga #22) — przerwa > CLICK_STREAK_GAP_MS zeruje.
    const now = Date.now();
    const c = this.state.stats.counters;
    c['seria_klikniec'] = now - this.lastClickMs > CLICK_STREAK_GAP_MS ? 1 : (c['seria_klikniec'] ?? 0) + 1;
    this.lastClickMs = now;
    if ((c['seria_klikniec'] ?? 0) > (c['seria_klikniec_max'] ?? 0)) c['seria_klikniec_max'] = c['seria_klikniec']!;
  }

  buy(id: string, count = 1): number {
    const g = this.registry.generators.get(id);
    if (!g) return 0;
    let bought = 0;
    for (let k = 0; k < count; k++) {
      const price = this.cost(id);
      const have = this.state.resources[g.costResource] ?? ZERO;
      if (have.lt(price)) break;
      this.state.resources[g.costResource] = have.sub(price);
      this.state.generators[id] = { owned: this.ownedOf(id).add(ONE) };
      bought += 1;
    }
    return bought;
  }

  buyUpgrade(id: string): boolean {
    const u = this.registry.upgrades.get(id);
    if (!u || !this.isUpgradeAvailable(id)) return false;
    const price = evalNumber(u.cost, this.queryCtx());
    const have = this.state.resources[u.costResource] ?? ZERO;
    if (have.lt(price)) return false;
    this.state.resources[u.costResource] = have.sub(price);
    this.state.upgrades[id] = true;
    applyImmediateEffects(this.state, u.effects);
    this.recomputeModifiers();
    return true;
  }

  // --- kadra -----------------------------------------------------------------

  isCharacterAvailable(id: string): boolean {
    const c = this.registry.characters.get(id);
    if (!c || this.state.characters[id]) return false;
    if (!c.unlock) return true;
    return evalBool(c.unlock, this.queryCtx());
  }

  private characterCost(id: string): Decimal {
    const c = this.registry.characters.get(id);
    if (!c || c.cost === undefined) return ZERO;
    return typeof c.cost === 'number'
      ? new Decimal(c.cost)
      : evalNumber(c.cost, this.queryCtx());
  }

  recruitCharacter(id: string): boolean {
    const c = this.registry.characters.get(id);
    if (!c || !this.isCharacterAvailable(id)) return false;
    const res = c.costResource ?? this.clickResource;
    const price = this.characterCost(id);
    const have = this.state.resources[res] ?? ZERO;
    if (have.lt(price)) return false;
    this.state.resources[res] = have.sub(price);
    this.state.characters[id] = true;
    this.recomputeModifiers();
    return true;
  }

  // --- gielda / czarny rynek (kantor) ----------------------------------------

  gieldaUnlocked(): boolean {
    // Kantor odblokowuje się dopiero, gdy KUPISZ ZX Spectrum (pierwsze prawdziwe dewizy „spod lady")
    // albo jawnie flagą. Wcześniej warunkiem było all-time `producedTotal.dewizy > 0`, ale to PRZEŻYWA
    // Denominację (metryka all-time), więc po pierwszej pięciolatce Kantor wyskakiwał od razu na starcie
    // każdej następnej — nawet bez sprzętu. Teraz zależy od BIEŻĄCEGO posiadania Spectruma (życzenie:
    // minigra ma się pojawiać dopiero po odblokowaniu/zakupie).
    return this.ownedOf('spectrum').gt(ZERO) || !!this.state.flags['mechanika.gielda'];
  }

  /** Kurs (ile cykli za 1 dewize) — peg do produkcji all-time + plynne wahanie (dwie sinusoidy). */
  /** Bazowy kurs (ile cykli za 1 dewizę) = NATURALNY stosunek BIEŻĄCEGO tempa produkcji cykli do dewiz.
   *  Dewiza warta jest tyle, ile realnie kosztuje w cyklach — a nie absurdalne ilości skalujące się z
   *  CAŁĄ historią produkcji (stary błąd: 1 dewiza = chore ilości cykli, kurs nie do użycia). */
  private gieldaBase(): Decimal {
    // Stała, niewielka baza — kantor to drobny handel walutą, nie przelicznik całej produkcji. Dewiza
    // kosztuje kilka–kilkanaście cykli niezależnie od skali gospodarki (uniknięcie absurdu „bld cykli").
    return new Decimal(GIELDA_BASE_RATE);
  }

  private gieldaRateAt(ms: number, base: Decimal): Decimal {
    // Wolne, nakładające się fale: kurs ROZPĘDZA się ku wychyleniom i łagodnie zawraca (sinus ma zerową
    // prędkość w szczycie, maksymalną w połowie) — bez nagłych skoków do skrajności. Okresy ~57 s i ~132 s.
    const p = this.gieldaPhase;
    const osc = 1 + 0.3 * Math.sin(ms / 9000 + p) + 0.14 * Math.sin(ms / 21000 + p * 1.3);
    return base.mul(Math.max(0.35, osc));
  }

  /** Wymiana: dir 'buy' (cykle->dewizy) lub 'sell' (dewizy->cykle), `frac` (0..1) zasobu zrodlowego. */
  exchange(dir: 'buy' | 'sell', frac: number): void {
    if (!this.gieldaUnlocked()) return;
    const f = Math.max(0, Math.min(1, frac));
    if (f <= 0) return;
    const rate = this.gieldaRateAt(Date.now(), this.gieldaBase());
    if (rate.lte(ZERO)) return;
    if (dir === 'buy') {
      const cykle = this.state.resources['cykle'] ?? ZERO;
      const spend = cykle.mul(f);
      if (spend.lte(ZERO)) return;
      this.state.resources['cykle'] = cykle.sub(spend);
      this.state.resources['dewizy'] = (this.state.resources['dewizy'] ?? ZERO).add(spend.div(rate));
    } else {
      const dewizy = this.state.resources['dewizy'] ?? ZERO;
      const amt = dewizy.mul(f);
      if (amt.lte(ZERO)) return;
      this.state.resources['dewizy'] = dewizy.sub(amt);
      this.state.resources['cykle'] = (this.state.resources['cykle'] ?? ZERO).add(amt.mul(rate).mul(1 - GIELDA_SPREAD));
    }
    this.state.stats.counters['gielda_transakcje'] = (this.state.stats.counters['gielda_transakcje'] ?? 0) + 1;
  }

  /** Nagroda z minigry (jakosc 0..1; `mult` skaluje wg trudnosci) — ~minuta produkcji * jakosc * mult. */
  minigameReward(quality: number, mult = 1): void {
    const q = Math.max(0, Math.min(1, quality));
    const m = Math.max(0, mult);
    const rates = this.currentRates();
    const perSec = rates[this.clickResource] ?? ZERO;
    const reward = Decimal.max(new Decimal(50), perSec.mul(60)).mul(q).mul(m);
    this.state.resources[this.clickResource] = (this.state.resources[this.clickResource] ?? ZERO).add(reward);
    // Liczniki gier w Tasme (uwaga #22): łącznie + seria „za jednym zamachem".
    const now = Date.now();
    const c = this.state.stats.counters;
    c['tasma_lacznie'] = (c['tasma_lacznie'] ?? 0) + 1;
    c['tasma_seria'] = now - this.lastTasmaMs > TASMA_GAP_MS ? 1 : (c['tasma_seria'] ?? 0) + 1;
    this.lastTasmaMs = now;
  }

  // --- okazje / złote ciastka (uwaga #21) ------------------------------------

  /** Czy „okazje" (złote ciastka) mają się pojawiać — dopiero gdy gra trochę ruszyła. */
  okazjeUnlocked(): boolean {
    return (this.state.stats.producedTotal['cykle'] ?? ZERO).gt(100);
  }

  /** Kliknięcie w „okazję" — losowy efekt w klimacie PRL. Zwraca opis do powiadomienia. */
  clickOkazja(): { kind: string; title: string; detail: string } {
    const c = this.state.stats.counters;
    c['zlote_klikniecia'] = (c['zlote_klikniecia'] ?? 0) + 1;
    const now = Date.now();
    const roll = Math.random();
    if (roll < 0.35) {
      this.activeBuffs.push({ id: ++this.buffSeq, kind: 'prod', mult: 7, until: now + 60000, label: 'Rzut towaru ×7', src: 'okazja' });
      return { kind: 'rzut', title: 'Rzut towaru!', detail: 'Cała produkcja ×7 przez minutę' };
    }
    if (roll < 0.65) {
      this.activeBuffs.push({ id: ++this.buffSeq, kind: 'click', mult: 777, until: now + 13000, label: 'Czyn społeczny ×777', src: 'okazja' });
      return { kind: 'czyn', title: 'Czyn społeczny!', detail: 'Klikanie ×777 przez 13 s' };
    }
    if (roll < 0.9) {
      const perSec = this.currentRates()['cykle'] ?? ZERO;
      const have = this.state.resources['cykle'] ?? ZERO;
      const reward = Decimal.max(perSec.mul(180), have.mul(0.12)).add(50);
      this.state.resources['cykle'] = have.add(reward);
      this.state.stats.producedTotal['cykle'] = (this.state.stats.producedTotal['cykle'] ?? ZERO).add(reward);
      this.state.stats.runProduced['cykle'] = (this.state.stats.runProduced['cykle'] ?? ZERO).add(reward);
      return { kind: 'spod_lady', title: 'Spod lady!', detail: '+' + formatNumber(reward) + ' cykli od ręki' };
    }
    this.activeBuffs.push({ id: ++this.buffSeq, kind: 'prod', mult: 0.5, until: now + 30000, label: 'Kontrola ×0,5', src: 'okazja' });
    return { kind: 'kontrola', title: 'Kontrola skarbowa…', detail: 'Produkcja ×0,5 przez 30 s' };
  }

  // --- załatwianie / łapówki (Faza 4A) ---------------------------------------

  /** Czy mechanika „załatwiania" jest odblokowana — gdy masz już realny sprzęt (deficyt części gryzie). */
  zalatwianieUnlocked(): boolean {
    return this.ownedOf('mera400').gt(ZERO) || !!this.state.flags['mechanika.zalatwianie'];
  }

  /** Bieżące ryzyko kontroli (0..100). */
  ryzyko(): number {
    return this.state.flags['ryzyko'] ?? 0;
  }

  private bribeAvailable(id: string): boolean {
    const b = this.registry.bribes.get(id);
    if (!b || !this.zalatwianieUnlocked()) return false;
    if (!b.unlock) return true;
    return evalBool(b.unlock, this.queryCtx());
  }

  private bribeCost(id: string): Decimal {
    const b = this.registry.bribes.get(id);
    if (!b) return ZERO;
    return evalNumber(b.cost, this.queryCtx());
  }

  /** Ile bonusów z Załatwiania jest AKTYWNYCH (niewygasłych) teraz — do limitu i do UI. */
  activeBribeCount(now = Date.now()): number {
    let n = 0;
    for (const b of this.activeBuffs) if (b.src === 'bribe' && b.until > now) n++;
    return n;
  }

  /** Kasuje WSZYSTKIE trwające bonusy z Załatwiania (kara za ryzyko 100%). Zwraca, ile przepadło. */
  private wipeBribeBuffs(): number {
    const before = this.activeBuffs.length;
    this.activeBuffs = this.activeBuffs.filter((b) => b.src !== 'bribe');
    return before - this.activeBuffs.length;
  }

  /** Daj łapówkę: płać przysługą, dostań czasowy bonus, dolicz ryzyko; przy wysokim — kontrola SB. */
  bribe(id: string): { ok: boolean; kontrola: boolean; title?: string; detail?: string } {
    const b = this.registry.bribes.get(id);
    if (!b || !this.bribeAvailable(id)) return { ok: false, kontrola: false };
    // Limit jednoczesnych załatwień (prośba właściciela) — ponad ZAL_MAX_ACTIVE nie kupujemy (UI też blokuje).
    if (this.activeBribeCount() >= ZAL_MAX_ACTIVE) {
      return { ok: false, kontrola: false, title: 'Limit załatwień', detail: `Naraz działa najwyżej ${ZAL_MAX_ACTIVE} — poczekaj, aż któreś wygaśnie.` };
    }
    const res = b.costResource ?? 'dewizy';
    const cost = this.bribeCost(id);
    const have = this.state.resources[res] ?? ZERO;
    if (have.lt(cost)) return { ok: false, kontrola: false };

    this.state.resources[res] = have.sub(cost);
    const now = Date.now();
    this.activeBuffs.push({ id: ++this.buffSeq, kind: b.scope, mult: b.mul, until: now + b.durationSec * 1000, label: b.name, src: 'bribe' });
    this.state.flags['ryzyko'] = Math.min(100, this.ryzyko() + b.risk);
    this.state.stats.counters['lapowki'] = (this.state.stats.counters['lapowki'] ?? 0) + 1;

    const risk = this.ryzyko();
    // TWARDA kara: ryzyko dobiło do 100% → nalot SB kasuje WSZYSTKIE trwające bonusy z Załatwiania
    // (także ten świeżo kupiony). Ryzyko wraca do zera. „Za grube smarowanie" = wszystko przepada.
    if (risk >= 100) {
      const wiped = this.wipeBribeBuffs();
      this.state.flags['ryzyko'] = 0;
      this.recomputeModifiers();
      if (this.registry.events.has('rdzen.ev_kontrola_lapowka')) this.eventQueue.push('rdzen.ev_kontrola_lapowka');
      return { ok: true, kontrola: true, title: 'Nalot SB!', detail: `Ryzyko 100% — przepadły wszystkie załatwione sprawy (${wiped}).` };
    }
    this.recomputeModifiers();

    // Ryzyko-nagroda: powyżej progu rośnie szansa, że SB zwęszy. Kara aplikowana przez zdarzenie SB.
    if (risk > RISK_KONTROLA_THRESHOLD && Math.random() < (risk - RISK_KONTROLA_THRESHOLD) / 120) {
      this.state.flags['ryzyko'] = 20; // po kontroli ryzyko spada
      if (this.registry.events.has('rdzen.ev_kontrola_lapowka')) {
        this.eventQueue.push('rdzen.ev_kontrola_lapowka'); // wpina łańcuch SB (8.4)
      }
      return { ok: true, kontrola: true, title: 'SB węszy…', detail: 'Smarowanie ściągnęło kontrolę.' };
    }
    return { ok: true, kontrola: false, title: b.name, detail: 'Załatwione na ' + b.durationSec + ' s' };
  }

  private bribeEffectText(scope: string, mul: number, durationSec: number): string {
    const dur = ` na ${durationSec} s`;
    if (scope === 'cost') return `Koszty −${Math.round((1 - mul) * 100)}%${dur}`;
    if (scope === 'click') return `Klikanie ×${formatNumber(mul)}${dur}`;
    if (scope === 'dewizy') return `Dewizy +${Math.round((mul - 1) * 100)}%${dur}`;
    return `Produkcja +${Math.round((mul - 1) * 100)}%${dur}`;
  }

  /** Promocja zaopatrzenia (Faza 4A → przerobiona): rzadka, mocna. Harmonogram STANOWY — następna
   *  promocja jest planowana w chwili ZAKOŃCZENIA poprzedniej (odliczanie od końca, nie od początku).
   *  Każda losuje rabat 55/75/90% (równe szanse, nigdy dwa takie same z rzędu). */
  supplyDeal(now = Date.now()): { active: boolean; mult: number; pct: number; phase: number; secondsLeft: number; fill: number } {
    if (this.nextDealAt < 0) this.nextDealAt = now + SUPPLY_GAP_MS; // pierwsza promocja po pełnej przerwie
    // Start promocji, gdy nadszedł czas i żadna nie trwa.
    if (this.dealUntil === 0 && now >= this.nextDealAt) {
      this.dealPct = pickDealPct(this.lastDealPct);
      this.lastDealPct = this.dealPct;
      this.dealUntil = now + SUPPLY_DEAL_MS;
    }
    // Koniec promocji → zaplanuj następną DOPIERO TERAZ (od końca tej).
    if (this.dealUntil !== 0 && now >= this.dealUntil) {
      this.dealUntil = 0;
      this.nextDealAt = now + SUPPLY_GAP_MS;
    }
    const active = this.dealUntil !== 0;
    // CIĄGŁY wypełniacz paska 0..1 (sub-sekundowo, UI interpoluje na 60 fps). W promocji = ile OKNA
    // zostało; poza nią = ile PRZERWY do następnej zostało (oba „pełny→pusty").
    const remMs = active ? this.dealUntil - now : this.nextDealAt - now;
    const spanMs = active ? SUPPLY_DEAL_MS : SUPPLY_GAP_MS;
    const fill = Math.max(0, Math.min(1, remMs / spanMs));
    return {
      active,
      mult: active ? 1 - this.dealPct / 100 : 1,
      pct: this.dealPct,
      phase: 1 - fill, // ułamek już upłynięty (na wypadek przyszłego użycia)
      secondsLeft: Math.max(0, remMs / 1000),
      fill,
    };
  }

  /** Cena jednego zaopatrzenia w towar `id` (w dewizach) — z uwzględnieniem promocji cyklicznej. */
  private supplyPrice(id: string): Decimal {
    const def = this.registry.resources.get(id);
    if (!def?.supply) return ZERO;
    const base = evalNumber(def.supply.price, this.queryCtx());
    return base.mul(this.supplyDeal().mult).ceil();
  }

  /** Zaopatrz się w towar reglamentowany (Faza 4A): płać dewizami, dostań `batch` sztuk towaru,
   *  którym potem smarujesz taniej niż kopertą. Wymaga odblokowanego załatwiania. */
  buySupply(id: string): boolean {
    if (!this.zalatwianieUnlocked()) return false;
    const def = this.registry.resources.get(id);
    if (!def?.supply) return false;
    const price = this.supplyPrice(id);
    const have = this.state.resources['dewizy'] ?? ZERO;
    if (have.lt(price)) return false;
    this.state.resources['dewizy'] = have.sub(price);
    this.state.resources[id] = (this.state.resources[id] ?? ZERO).add(def.supply.batch ?? 1);
    return true;
  }

  // --- Zjazd PZPR + doktryny (Faza 4B) ---------------------------------------

  /** Zjazd dostepny po pierwszej Denominacji (zamknela sie przynajmniej jedna pieciolatka). */
  zjazdUnlocked(): boolean {
    return this.state.stats.denominations >= 1;
  }

  private doctrineAvailable(id: string): boolean {
    const d = this.registry.doctrines.get(id);
    if (!d) return false;
    if (!d.unlock) return true;
    return evalBool(d.unlock, this.queryCtx());
  }

  /** Ustaw doktryne na biezaca pieciolatke (id='' = „bez doktryny", pomiń). Zamyka etap Zjazdu w limbo
   *  → plansza „nowa pięciolatka". Zeruje licznik „bomby" i ewentualny poprzedni kryzys. */
  chooseDoctrine(id: string): boolean {
    if (id !== '' && !this.doctrineAvailable(id)) return false;
    if (id !== '') {
      this.state.doctrine = id;
      this.state.flags['doktryna_t'] = 0;
      this.state.flags['kryzys_fired'] = 0;
      this.state.flags['kryzys'] = 0;
      this.state.stats.counters['zjazdy'] = (this.state.stats.counters['zjazdy'] ?? 0) + 1;
      this.recomputeModifiers();
    }
    // Zatwierdzenie (lub pominięcie) doktryny domyka Zjazd → plansza „nowa pięciolatka".
    if (this.state.interRun === 'zjazd') this.state.interRun = 'splash';
    return true;
  }

  /** „Bomba zadluzenia": doktryna z `debt` po `afterSec` s rozgrywki wpina kryzys (jednorazowo). */
  private updateDoctrineDebt(dtSec: number): void {
    const id = this.state.doctrine;
    if (!id) return;
    const d = this.registry.doctrines.get(id);
    if (!d?.debt || this.state.flags['kryzys_fired']) return;
    const t = (this.state.flags['doktryna_t'] ?? 0) + dtSec;
    this.state.flags['doktryna_t'] = t;
    if (t >= d.debt.afterSec) {
      this.state.flags['kryzys_fired'] = 1;
      if (this.registry.events.has(d.debt.crisisEvent)) this.eventQueue.push(d.debt.crisisEvent);
    }
  }

  // --- Dyplomacja bloków (Faza 4C) -------------------------------------------

  /** Mechanika odblokowana, gdy gra robi się „międzynarodowa" (Odra 1305 / flaga z drzewa-zdarzeń). */
  dyplomacjaUnlocked(): boolean {
    return this.ownedOf('odra1305').gt(ZERO) || !!this.state.flags['mechanika.dyplomacja'];
  }

  /** Aktualny poziom relacji z krajem `id` (0..max). Relacja = flaga `relacja.<id>` (jak w zdarzeniach). */
  relation(id: string): number {
    return Math.max(0, this.state.flags['relacja.' + id] ?? 0);
  }

  private diplomacyMax(id: string): number {
    return this.registry.diplomacy.get(id)?.max ?? 1000;
  }
  /** Bonus do kroku zacieśniania relacji z węzłów drzewa (efekt `diplomacyStep`, sumowany per poziom). */
  private diplomacyStepBonus(): number {
    let bonus = 0;
    for (const [id, def] of this.registry.treeNodes) {
      const lvl = this.state.treeNodes[id] ?? 0;
      if (lvl <= 0) continue;
      for (const e of def.effects ?? []) {
        if (e.type === 'diplomacyStep') bonus += effNum(e.value, this.queryCtx()).toNumber() * lvl;
      }
    }
    return bonus;
  }
  /** Ile relacji daje jedno kliknięcie: bazowo +5, podbijane ulepszeniem z dziedzictwa (docelowo +15). */
  private diplomacyStep(id: string): number {
    return (this.registry.diplomacy.get(id)?.step ?? 5) + this.diplomacyStepBonus();
  }
  private diplomacyAvailable(id: string): boolean {
    const d = this.registry.diplomacy.get(id);
    if (!d || !this.dyplomacjaUnlocked()) return false;
    if (!d.unlock) return true;
    return evalBool(d.unlock, this.queryCtx());
  }

  /** Koszt zacieśnienia relacji — rośnie z POZIOMEM relacji (1,25× co 100 punktów), NIE z liczbą
   *  kroków, by zmiana wielkości kroku (np. +5 vs +15 z drzewa) nie wysadzała ceny. Koszt bazowy
   *  skaluje się z PRODUKCJĄ dewiz (`tempo.dewizy`), nie z portfelem — dzięki temu zacieśnianie jest
   *  zawsze coraz DROŻSZE i nigdy nie tanieje po wydaniu dewiz (wcześniej `zasob.dewizy` malał po zakupie). */
  private diplomacyCost(id: string): Decimal {
    const d = this.registry.diplomacy.get(id);
    if (!d) return ZERO;
    const base = evalNumber(d.cost, this.queryCtx());
    return base.mul(Math.pow(1.25, this.relation(id) / 100)).ceil();
  }

  /** Zacieśnij relację: zapłać dewizami, podnieś relację o krok (do sufitu). */
  improveRelation(id: string): boolean {
    if (!this.diplomacyAvailable(id)) return false;
    const max = this.diplomacyMax(id);
    if (this.relation(id) >= max) return false;
    const cost = this.diplomacyCost(id);
    const have = this.state.resources['dewizy'] ?? ZERO;
    if (have.lt(cost)) return false;
    this.state.resources['dewizy'] = have.sub(cost);
    this.state.flags['relacja.' + id] = Math.min(max, this.relation(id) + this.diplomacyStep(id));
    this.state.stats.counters['dyplomacja'] = (this.state.stats.counters['dyplomacja'] ?? 0) + 1;
    this.recomputeModifiers();
    return true;
  }

  // Opis PREMII kraju. Nawet przy relacji zerowej pokazujemy, JAKA to będzie korzyść (kierunek premii),
  // zachowując precyzyjną uwagę „(relacja zerowa)" — zamiast bezużytecznego „Brak korzyści".
  private diplomacyEffectText(scope: string, factor: number): string {
    const zero = factor <= 0;
    const note = ' (relacja zerowa)';
    // Procent z JEDNYM miejscem po przecinku (przecinek PL) — bez tego pojedyncze zacieśnienie <1%
    // wyglądało, jakby nic nie dawało (skok tylko o pełny %). Teraz widać każdy krok, np. „Dewizy +7,3%".
    const pct1 = (x: number): string => (x * 100).toFixed(1).replace('.', ',');
    switch (scope) {
      case 'cost': return zero ? `Koszty ↓${note}` : `Koszty −${pct1(factor)}%`;
      case 'prod': return zero ? `Produkcja ↑${note}` : `Produkcja +${pct1(factor)}%`;
      case 'dewizy': return zero ? `Dewizy ↑${note}` : `Dewizy +${pct1(factor)}%`;
      case 'cykle': return zero ? `Cykle ↑${note}` : `Cykle +${pct1(factor)}%`;
      case 'click': return zero ? `Klikanie ↑${note}` : `Klikanie +${pct1(factor)}%`;
      case 'all':
        return zero ? `Koszty ↓ i produkcja ↑${note}` : `Koszty −${pct1(factor / 2)}% i produkcja +${pct1(factor / 2)}%`;
      default: return zero ? `Korzyść${note}` : `Bonus +${pct1(factor)}%`;
    }
  }

  // --- prestiz (Denominacja) -------------------------------------------------

  /** Ile odznaczen da Denominacja teraz: floor(sqrt(wytworzone_w_rozgrywce / SKALA)). */
  prestigeGain(): Decimal {
    const produced = this.state.stats.runProduced[this.clickResource] ?? ZERO;
    const ratio = produced.div(PRESTIGE_SCALE);
    if (ratio.lte(ZERO)) return ZERO;
    return ratio.sqrt().floor();
  }

  canDenominate(): boolean {
    return this.prestigeGain().gt(ZERO);
  }

  /** Postep do kolejnego odznaczenia (0..1) — „cien” panelu, zanim Denominacja sie oplaci. */
  private prestigeProgress(): number {
    const producedNum = (this.state.stats.runProduced[this.clickResource] ?? ZERO).toNumber();
    if (!Number.isFinite(producedNum)) return 1;
    const scale = PRESTIGE_SCALE.toNumber();
    const g = Math.floor(Math.sqrt(producedNum / scale));
    const base = g * g * scale;
    const next = (g + 1) * (g + 1) * scale;
    return next <= base ? 1 : Math.max(0, Math.min(1, (producedNum - base) / (next - base)));
  }

  /** Denominacja: kasuje biezaca rozgrywke, ZACHOWUJE odznaczenia, drzewo i statystyki all-time. */
  denominate(): { gain: Decimal; gained: string; unit: string } | null {
    const gain = this.prestigeGain();
    if (gain.lte(ZERO)) return null;

    const keepOdz = (this.state.resources['odznaczenia'] ?? ZERO).add(gain);
    const keepTree = this.state.treeNodes;
    const keepLexicon = this.state.lexiconUnlocked; // kolekcja Leksykonu jest trwala
    const keepAch = this.state.achievements; // osiagniecia tez trwale (all-time)
    const keepDenoms = this.state.stats.denominations + 1;
    const keepProducedTotal = this.state.stats.producedTotal;
    const keepCreatedAt = this.state.stats.createdAt;
    const keepPlayTime = this.state.stats.playTimeSec;
    const keepCounters = this.state.stats.counters; // liczniki unikalnych osiagniec sa all-time (uwaga #22)

    this.state = createInitialState(this.registry);
    this.state.resources['odznaczenia'] = keepOdz;
    this.state.treeNodes = keepTree;
    this.state.lexiconUnlocked = keepLexicon;
    this.state.achievements = keepAch;
    this.state.stats.denominations = keepDenoms;
    this.state.stats.producedTotal = keepProducedTotal;
    this.state.stats.createdAt = keepCreatedAt;
    this.state.stats.playTimeSec = keepPlayTime;
    this.state.stats.counters = keepCounters;
    this.eventActive = null;
    this.eventQueue = [];
    this.activeBuffs = []; // bonusy z okazji nie przenosza sie na nowa rozgrywke
    this.goalsCacheAt = 0; // cele liczymy od nowa (rozgrywka się zresetowała)

    applyStartWith(this.state, this.registry); // wezly „startowe” z drzewa
    // Wejście w LIMBO: stara rozgrywka skończona, nowa STOI (nie tyka), dopóki gracz nie przejdzie
    // ceremonia → drzewo → (Zjazd) → plansza. Trwałe w save → można wrócić do tego etapu po zamknięciu.
    this.state.interRun = 'ceremony';
    this.state.interRunGain = gain;
    this.recomputeModifiers();
    const odzDef = this.registry.resources.get('odznaczenia');
    const forms = odzDef ? formsFor(odzDef) : nameForms('odznaczenia');
    return { gain, gained: formatNumber(gain), unit: pluralizePL(gain.toNumber(), forms) };
  }

  /** Przejście fazy limbo między pięciolatkami. `phase='play'` (lub '') = FORMALNY start nowej
   *  rozgrywki: kasujemy limbo i USTAWIAMY lastSeen na TERAZ (czas limbo nie liczy się jako offline). */
  setInterRun(phase: string): void {
    if (phase === 'play' || phase === '') {
      this.state.interRun = '';
      this.state.interRunGain = ZERO;
      this.state.stats.lastSeen = Date.now();
      return;
    }
    this.state.interRun = phase;
  }

  // --- drzewo dziedzictwa ----------------------------------------------------

  /** Maks. poziom węzła (ile razy można go ulepszyć). Domyślnie 1. */
  private treeNodeMaxLevel(id: string): number {
    return this.registry.treeNodes.get(id)?.levels ?? 1;
  }
  /** Aktualnie posiadany poziom węzła (0 = brak). */
  treeNodeLevel(id: string): number {
    return this.state.treeNodes[id] ?? 0;
  }

  private treeRequiresMet(id: string): boolean {
    const n = this.registry.treeNodes.get(id);
    if (!n) return false;
    // Wymaga POPRZEDNIKA na CO NAJMNIEJ 1 poziomie (nie maks.) — drogie węzły późnego etapu nie
    // blokują wtedy całej gałęzi; gracz może iść dalej, a dobijać poziomy później (życzenie z gry).
    return (n.requires ?? []).every((r) => this.treeNodeLevel(r) >= 1);
  }

  /** Koszt KOLEJNEGO poziomu — rośnie wykładniczo z już posiadanym poziomem (celowo droższe). */
  private treeNodeCost(id: string): Decimal {
    const n = this.registry.treeNodes.get(id);
    if (!n) return ZERO;
    const base = evalNumber(n.cost, this.queryCtx());
    return base.mul(Math.pow(2, this.treeNodeLevel(id))).ceil();
  }

  private isTreeNodeVisible(id: string): boolean {
    const n = this.registry.treeNodes.get(id);
    if (!n) return false;
    if (this.treeNodeLevel(id) > 0) return true;
    if (n.fogged) return this.treeRequiresMet(id); // zamglony: widoczny dopiero w poblizu
    return true;
  }

  private treeNodeStatus(id: string): TreeNodeStatus {
    if (this.treeNodeLevel(id) >= this.treeNodeMaxLevel(id)) return 'owned';
    if (!this.treeRequiresMet(id)) return 'locked';
    const have = this.state.resources['odznaczenia'] ?? ZERO;
    return have.gte(this.treeNodeCost(id)) ? 'available' : 'unaffordable';
  }

  buyTreeNode(id: string): boolean {
    const n = this.registry.treeNodes.get(id);
    if (!n || !this.treeRequiresMet(id)) return false;
    if (this.treeNodeLevel(id) >= this.treeNodeMaxLevel(id)) return false; // już maksymalny poziom
    const cost = this.treeNodeCost(id);
    const have = this.state.resources['odznaczenia'] ?? ZERO;
    if (have.lt(cost)) return false;
    this.state.resources['odznaczenia'] = have.sub(cost);
    this.state.treeNodes[id] = this.treeNodeLevel(id) + 1;
    this.goalsCacheAt = 0;
    applyImmediateEffects(this.state, n.effects); // flagi (np. mnożniki osiągnięć) — idempotentne
    this.recomputeModifiers();
    return true;
  }

  /** Wyzwala kamienie milowe, ktorych warunek wlasnie zaszedl (trwale). */
  checkMilestones(): void {
    let changed = false;
    for (const [id, m] of this.registry.milestones) {
      if (this.state.milestones[id]) continue;
      if (evalBool(m.trigger, this.queryCtx())) {
        this.state.milestones[id] = true;
        applyImmediateEffects(this.state, m.effects);
        changed = true;
      }
    }
    if (changed) this.recomputeModifiers();
  }

  // --- zdarzenia (Paradox-style) ---------------------------------------------

  /** Krok zdarzen, wolany przez Worker w czasie rzeczywistym (NIE w doliczaniu offline). */
  /** Pauzuje/wznawia LICZNIK zdarzen (produkcja gra dalej). Uzywane np. na czas minigry. */
  setEventsPaused(paused: boolean): void {
    if (paused === this.eventsPaused) return;
    const now = Date.now();
    if (paused) {
      this.eventsPaused = true;
      this.eventsPausedAt = now;
    } else {
      this.eventsPaused = false;
      this.lastEventMs += now - this.eventsPausedAt; // przesun timer o czas pauzy
    }
  }

  updateEvents(nowMs: number): void {
    if (this.state.interRun) return; // limbo między pięciolatkami — żadne zdarzenia
    if (this.eventsPaused) return; // minigra/immersja — zadne nowe okno nie wyskakuje
    if (this.eventActive) return;
    const ctx = this.queryCtx();

    // 1. lancuch — kolejne ogniwo natychmiast
    while (this.eventQueue.length > 0) {
      const id = this.eventQueue.shift();
      if (id && this.registry.events.has(id)) {
        this.activateEvent(id, nowMs);
        return;
      }
    }

    // 2. story-beaty: once, bez wagi, Z WYZWALACZEM (bez wyzwalacza => zdarzenie tylko-lancuchowe)
    for (const [id, ev] of this.registry.events) {
      if (!ev.once || (ev.weight ?? 0) > 0) continue;
      if (!ev.trigger) continue;
      if (this.state.eventsFired[id]) continue;
      if (!evalBool(ev.trigger, ctx)) continue;
      this.activateEvent(id, nowMs);
      return;
    }

    // 3. zdarzenia losowe — na timerze, wazone
    if (nowMs - this.lastEventMs < EVENT_ROLL_SEC * 1000) return;
    const pool: { id: string; w: number }[] = [];
    for (const [id, ev] of this.registry.events) {
      const w = ev.weight ?? 0;
      if (w <= 0) continue;
      if (ev.once && this.state.eventsFired[id]) continue;
      if (ev.trigger && !evalBool(ev.trigger, ctx)) continue;
      pool.push({ id, w });
    }
    if (pool.length === 0) {
      this.lastEventMs = nowMs;
      return;
    }
    let total = 0;
    for (const p of pool) total += p.w;
    let r = Math.random() * total;
    for (const p of pool) {
      r -= p.w;
      if (r <= 0) {
        this.activateEvent(p.id, nowMs);
        return;
      }
    }
  }

  private activateEvent(id: string, nowMs: number): void {
    const ev = this.registry.events.get(id);
    if (!ev) return;
    this.eventActive = ev;
    if (ev.once) this.state.eventsFired[id] = true;
    this.lastEventMs = nowMs;
  }

  /** Rozstrzyga aktywne zdarzenie wyborem opcji (lub 0 dla zdarzen bez wyboru). */
  chooseEventOption(index: number): void {
    const ev = this.eventActive;
    if (!ev) return;
    const effects =
      ev.options && ev.options.length > 0 ? (ev.options[index]?.effects ?? []) : (ev.effects ?? []);
    const immediate = effects.filter((e) => {
      if (e.type === 'triggerEvent' && typeof e.event === 'string') {
        this.eventQueue.push(e.event);
        return false;
      }
      return true;
    });
    applyImmediateEffects(this.state, immediate);
    this.eventActive = null;
    this.lastEventMs = Date.now();
    this.recomputeModifiers();
  }

  // --- Leksykon --------------------------------------------------------------

  private lexiconMet(unlockedBy: string): boolean {
    const t = parseTarget(unlockedBy);
    switch (t.kind) {
      case 'generator':
        return t.id ? this.ownedOf(t.id).gt(ZERO) : false;
      case 'upgrade':
        return t.id ? !!this.state.upgrades[t.id] : false;
      case 'event':
        return t.id ? !!this.state.eventsFired[t.id] : false;
      case 'milestone':
        return t.id ? !!this.state.milestones[t.id] : false;
      case 'treeNode':
        return t.id ? !!this.state.treeNodes[t.id] : false;
      default:
        return false;
    }
  }

  updateLexicon(): void {
    for (const [id, entry] of this.registry.lexicon) {
      if (this.state.lexiconUnlocked[id]) continue;
      if (this.lexiconMet(entry.unlockedBy)) this.state.lexiconUnlocked[id] = true;
    }
  }

  // --- osiagniecia -----------------------------------------------------------

  checkAchievements(): void {
    const ctx = this.queryCtx();
    let earnedAny = false;
    for (const [id, a] of this.registry.achievements) {
      if (this.state.achievements[id]) continue;
      if (a.condition && evalBool(a.condition, ctx)) {
        this.state.achievements[id] = true;
        earnedAny = true;
        // Po zdobyciu odslaniamy nazwe nawet dla sekretu — to wlasnie nagroda/satysfakcja.
        if (this.justEarned.length < 8) {
          this.justEarned.push({
            id,
            name: a.name,
            description: a.description ?? '',
            category: a.category ?? 'Inne',
            earned: true,
            secret: !!a.secret,
          });
        }
      }
    }
    // przeliczamy modyfikatory tylko jesli mnozniki z osiagniec sa aktywne (wezel drzewa)
    if (earnedAny && this.state.flags['osiagniecia_mnoznik']) this.recomputeModifiers();
  }

  /** Zwraca i czysci bufor swiezo zdobytych osiagniec (do powiadomien). Kazda migawka idzie do UI,
   *  wiec opróznienie tutaj nie gubi powiadomien. */
  private drainJustEarned(): AchievementView[] {
    if (this.justEarned.length === 0) return [];
    const out = this.justEarned;
    this.justEarned = [];
    return out;
  }

  /** Pelna lista osiagniec do okna (na zadanie — NIE w kazdej migawce, bo jest ich 300+). */
  achievementsList(): AchievementView[] {
    const out: AchievementView[] = [];
    for (const [id, a] of this.registry.achievements) {
      const earned = !!this.state.achievements[id];
      const hidden = !earned && !!a.secret;
      out.push({
        id,
        name: hidden ? '???' : a.name,
        description: hidden ? 'Tajne osiągnięcie — odkryj sam.' : (a.description ?? ''),
        category: a.category ?? 'Inne',
        earned,
        secret: !!a.secret,
      });
    }
    return out;
  }

  // --- migawka ---------------------------------------------------------------

  snapshot(): Snapshot {
    const rates = this.currentRates();
    this.lastRates = rates; // świeże `tempo.<zasob>` także dla kontekstów migawki (Faza 5A)
    const baseCtx = this.queryCtx();

    const resources: ResourceView[] = [];
    for (const [id, def] of this.registry.resources) {
      const amt = this.state.resources[id] ?? ZERO;
      // Waluty prestizowe i „uspione" (uwaga #19) ukryte, poki nie zdobyte.
      if ((def.prestige || def.hidden) && amt.lte(ZERO)) continue;
      const rt = rates[id] ?? ZERO;
      resources.push({
        id,
        name: def.name,
        amount: formatNumber(amt, { notation: def.format ?? 'mixed' }),
        rate: formatNumber(rt),
        amountRaw: amt.toNumber(),
        rateRaw: rt.toNumber(),
        plural: formsFor(def),
        prestige: !!def.prestige, // waluty prestizowe nie maja tempa „na sekunde"
        local: !!def.supply, // towary-waluty (wodka/kawa/papierosy) — lokalne, poza globalna stopka
      });
    }

    const generators: GeneratorView[] = [];
    // Paczka rdzenia (właściciel zasobu klikalnego) — jej treść wygląda NATYWNIE (bez akcentu/pieczęci).
    const corePackId = this.registry.packOf.get(this.clickResource);
    for (const id of this.registry.generatorOrder) {
      const g = this.registry.generators.get(id);
      if (!g) continue;
      const owned = this.ownedOf(id);
      const ctx = makeContext(this.state, { currentGeneratorOwned: owned });
      const perUnit = this.perUnit(id, ctx);
      const have = this.state.resources[g.costResource] ?? ZERO;
      // Koszt dla wybranej liczby sztuk (x1/x10/x100/Max) — cena dostosowuje się do wyboru.
      const count = this.buyAmount === 'max' ? this.maxBuyCount(id) : this.buyAmount;
      const price = this.costForCount(id, Math.max(1, count));
      const affordable = have.gte(price) && count >= 1;
      const costResDef = this.registry.resources.get(g.costResource);
      const costForms = costResDef ? formsFor(costResDef) : nameForms(g.costResource);
      const outResDef = this.registry.resources.get(g.outputResource);
      const outForms = outResDef ? formsFor(outResDef) : nameForms(g.outputResource);
      generators.push({
        id,
        name: g.name,
        flavor: g.flavor,
        owned: formatNumber(owned),
        ownedNum: owned.toNumber(),
        cost: formatNumber(price),
        buyCount: count,
        costResource: g.costResource,
        costResourceName: costResDef?.name ?? g.costResource,
        costUnit: pluralizePL(price.toNumber(), costForms),
        production: formatNumber(perUnit),
        rate: formatNumber(perUnit.mul(owned)),
        outputResource: g.outputResource,
        outputUnit: outForms.many,
        unlocked: this.isUnlocked(id),
        affordable,
        ...this.dlcVisual(id, corePackId),
      });
    }

    const upGroupNames = {
      gen: (gid: string) => this.registry.generators.get(gid)?.name,
      res: (rid: string) => this.registry.resources.get(rid)?.name,
    };
    const upgrades: UpgradeView[] = [];
    let upOwned = 0;
    for (const [id, u] of this.registry.upgrades) {
      // Dostępność liczona na JEDNYM `baseCtx` (nie this.isUpgradeAvailable, które budowało kontekst
      // od nowa dla każdego z setek ulepszeń — patrz docs/ULEPSZENIA.md U1, bramka wydajności).
      const purchased = (u.once ?? true) && this.state.upgrades[id];
      if (this.state.upgrades[id]) upOwned += 1; // wykupione (licznik do nagłówka)
      if (purchased) continue;
      if (u.unlock && !evalBool(u.unlock, baseCtx)) continue;
      // opis/grupa (i koszt, gdy stały) liczone raz i trzymane w cache
      let meta = this.upMetaCache.get(id);
      if (!meta) {
        meta = { effectText: describeEffects(u.effects, this.registry, baseCtx), group: upgradeGroup(u.effects, upGroupNames) };
        if (/^[\d.eE]+$/.test(u.cost.trim())) {
          const price = evalNumber(u.cost, baseCtx);
          const crd = this.registry.resources.get(u.costResource);
          const cf = crd ? formsFor(crd) : nameForms(u.costResource);
          meta.staticCost = { price, costStr: formatNumber(price), costUnit: pluralizePL(price.toNumber(), cf) };
        }
        this.upMetaCache.set(id, meta);
      }
      let price: Decimal, costStr: string, costUnit: string;
      if (meta.staticCost) {
        ({ price, costStr, costUnit } = meta.staticCost);
      } else {
        price = evalNumber(u.cost, baseCtx);
        const crd = this.registry.resources.get(u.costResource);
        const cf = crd ? formsFor(crd) : nameForms(u.costResource);
        costStr = formatNumber(price);
        costUnit = pluralizePL(price.toNumber(), cf);
      }
      const have = this.state.resources[u.costResource] ?? ZERO;
      upgrades.push({
        id,
        name: u.name,
        flavor: u.flavor,
        cost: costStr,
        costResource: u.costResource,
        costUnit,
        effectText: meta.effectText,
        affordable: have.gte(price),
        group: meta.group,
      });
    }
    const upgradeStats = { owned: upOwned, total: this.registry.upgrades.size, available: upgrades.length };

    const odzDef = this.registry.resources.get('odznaczenia');
    const odzForms = odzDef ? formsFor(odzDef) : nameForms('odznaczenia');
    const odz = this.state.resources['odznaczenia'] ?? ZERO;
    const gain = this.prestigeGain();
    const producedRun = this.state.stats.runProduced[this.clickResource] ?? ZERO;
    const prestige: PrestigeView = {
      odznaczenia: formatNumber(odz),
      odznaczeniaRaw: odz.toNumber(),
      // STABILNA odmiana — te wartości się zmieniają, więc końcówka nie może migać (reguła wszędzie).
      odznaczeniaUnit: pluralizePLStable(odz.toNumber(), odzForms),
      gain: formatNumber(gain),
      gainRaw: gain.toNumber(),
      gainUnit: pluralizePLStable(gain.toNumber(), odzForms),
      canDenominate: gain.gt(ZERO),
      denominations: this.state.stats.denominations,
      bonusPct: Math.round(odz.mul(ODZNACZENIE_BONUS).toNumber() * 100), // +X% do produkcji cykli (uwaga #15)
      progress: this.prestigeProgress(),
      visible:
        gain.gt(ZERO) ||
        this.state.stats.denominations > 0 ||
        odz.gt(ZERO) ||
        producedRun.gte(PRESTIGE_SCALE.mul(0.05)),
    };

    const tree: TreeNodeView[] = [];
    for (const [id, n] of this.registry.treeNodes) {
      if (!this.isTreeNodeVisible(id)) continue;
      const cost = this.treeNodeCost(id);
      const requiresUnmet = (n.requires ?? [])
        .filter((r) => this.treeNodeLevel(r) < this.treeNodeMaxLevel(r))
        .map((r) => this.registry.treeNodes.get(r)?.name ?? r);
      tree.push({
        id,
        name: n.name,
        description: n.description,
        kind: n.kind,
        cost: formatNumber(cost),
        costRaw: cost.toNumber(),
        costUnit: pluralizePL(cost.toNumber(), odzForms),
        effectText: describeEffects(n.effects, this.registry, baseCtx),
        status: this.treeNodeStatus(id),
        branch: n.branch,
        level: this.treeNodeLevel(id),
        maxLevel: this.treeNodeMaxLevel(id),
        requiresUnmet,
      });
    }

    const activeEvent: ActiveEventView | null = this.eventActive
      ? {
          id: this.eventActive.id,
          title: this.eventActive.title,
          body: this.eventActive.body,
          options: (this.eventActive.options ?? []).map((o) => o.label),
        }
      : null;

    const lexEntries: LexiconView['entries'] = [];
    let lexUnlocked = 0;
    for (const [id, entry] of this.registry.lexicon) {
      const unlocked = !!this.state.lexiconUnlocked[id];
      if (unlocked) lexUnlocked += 1;
      lexEntries.push({
        id,
        name: entry.name,
        text: entry.text,
        unlocked,
        iconKey: entry.icon ? 'named:' + entry.icon : entry.unlockedBy,
      });
    }
    const lexicon: LexiconView = {
      entries: lexEntries,
      unlocked: lexUnlocked,
      total: lexEntries.length,
    };

    const characters: CharacterView[] = [];
    for (const [id, c] of this.registry.characters) {
      const recruited = !!this.state.characters[id];
      if (!recruited && !this.isCharacterAvailable(id)) continue;
      const res = c.costResource ?? this.clickResource;
      const cost = this.characterCost(id);
      const resDef = this.registry.resources.get(res);
      const forms = resDef ? formsFor(resDef) : nameForms(res);
      const have = this.state.resources[res] ?? ZERO;
      characters.push({
        id,
        name: c.name,
        archetype: c.archetype,
        flavor: c.flavor,
        effectText: describeEffects(c.passive, this.registry, baseCtx),
        cost: formatNumber(cost),
        costUnit: pluralizePL(cost.toNumber(), forms),
        costResource: res,
        recruited,
        affordable: have.gte(cost),
      });
    }

    const nowMs = Date.now();
    const gBase = this.gieldaBase(); // policz bazę RAZ (z bieżącego tempa) — reszta to czas × oscylacja
    const rateD = this.gieldaRateAt(nowMs, gBase);
    const ratePrev = this.gieldaRateAt(nowMs - 700, gBase);
    // Historia kursu do wykresu D3 (uwaga #11) — kurs jest deterministyczny w czasie, więc liczymy
    // ostatnie ~2 min wprost (48 punktów co 2,5 s), bez przechowywania stanu.
    const HIST_N = 48;
    const HIST_STEP = 2500;
    const history: number[] = [];
    for (let i = HIST_N - 1; i >= 0; i--) history.push(this.gieldaRateAt(nowMs - i * HIST_STEP, gBase).toNumber());
    const gielda: GieldaView = {
      unlocked: this.gieldaUnlocked(),
      rate: formatNumber(rateD),
      rateRaw: rateD.toNumber(),
      trend: rateD.gt(ratePrev.mul(1.001)) ? 'up' : rateD.lt(ratePrev.mul(0.999)) ? 'down' : 'flat',
      history,
    };

    // Załatwianie/łapówki (Faza 4A) — cele smarowania dostępne na liście + ryzyko kontroli.
    const zalUnlocked = this.zalatwianieUnlocked();
    const bribes: BribeView[] = [];
    if (zalUnlocked) {
      for (const [id, b] of this.registry.bribes) {
        if (!this.bribeAvailable(id)) continue;
        const res = b.costResource ?? 'dewizy';
        const cost = this.bribeCost(id);
        const resDef = this.registry.resources.get(res);
        const forms = resDef ? formsFor(resDef) : nameForms(res);
        const have = this.state.resources[res] ?? ZERO;
        bribes.push({
          id,
          name: b.name,
          target: b.target,
          flavor: b.flavor,
          cost: formatNumber(cost),
          costUnit: pluralizePL(cost.toNumber(), forms),
          costResource: res,
          effectText: this.bribeEffectText(b.scope, b.mul, b.durationSec),
          risk: b.risk,
          durationSec: b.durationSec,
          affordable: have.gte(cost),
        });
      }
    }
    // Zaopatrzenie w towar reglamentowany — zasoby z polem `supply`, kupowane za dewizy.
    const supplies: SupplyView[] = [];
    if (zalUnlocked) {
      const dewDef = this.registry.resources.get('dewizy');
      const dewForms = dewDef ? formsFor(dewDef) : nameForms('dewizy');
      const dewHave = this.state.resources['dewizy'] ?? ZERO;
      for (const [rid, rdef] of this.registry.resources) {
        if (!rdef.supply) continue;
        const price = this.supplyPrice(rid);
        supplies.push({
          id: rid,
          name: rdef.name,
          have: formatNumber(this.state.resources[rid] ?? ZERO),
          batch: rdef.supply.batch ?? 1,
          price: formatNumber(price),
          priceUnit: pluralizePL(price.toNumber(), dewForms),
          affordable: dewHave.gte(price),
        });
      }
    }
    const deal = this.supplyDeal();
    const zalatwianie: ZalatwianieView = {
      unlocked: zalUnlocked,
      ryzyko: Math.round(this.ryzyko()),
      activeBribes: this.activeBribeCount(),
      maxBribes: ZAL_MAX_ACTIVE,
      bribes,
      supplies,
      supplyDeal: {
        active: deal.active,
        pct: deal.pct,
        secondsLeft: Math.ceil(deal.secondsLeft),
        phase: deal.phase,
        fill: deal.fill,
      },
    };

    // Zjazd PZPR + doktryny (Faza 4B) — wybór linii na całą pięciolatkę.
    const zjazdUnlocked = this.zjazdUnlocked();
    const doctrines: DoctrineView[] = [];
    for (const [id, d] of this.registry.doctrines) {
      doctrines.push({
        id,
        name: d.name,
        flavor: d.flavor,
        lore: d.lore,
        effectText: describeEffects(d.effects, this.registry, baseCtx),
        axis: d.axis,
        hasDebt: !!d.debt,
        available: this.doctrineAvailable(id),
      });
    }
    const activeDok = this.state.doctrine ? this.registry.doctrines.get(this.state.doctrine) : undefined;
    const zjazd: ZjazdView = {
      unlocked: zjazdUnlocked,
      activeId: this.state.doctrine,
      activeName: activeDok?.name ?? '',
      kryzys: !!this.state.flags['kryzys'],
      doctrines,
    };

    // Dyplomacja bloków (Faza 4C) — relacje przesuwają ceny wkładów / produkcję / dewizy.
    const dyplUnlocked = this.dyplomacjaUnlocked();
    const relations: RelationView[] = [];
    if (dyplUnlocked) {
      const dewDef2 = this.registry.resources.get('dewizy');
      const dewForms2 = dewDef2 ? formsFor(dewDef2) : nameForms('dewizy');
      const dewHave2 = this.state.resources['dewizy'] ?? ZERO;
      for (const [id, d] of this.registry.diplomacy) {
        if (!this.diplomacyAvailable(id)) continue;
        const rel = this.relation(id);
        const max = this.diplomacyMax(id);
        const cost = this.diplomacyCost(id);
        const atMax = rel >= max;
        relations.push({
          id,
          name: d.name,
          bloc: d.bloc,
          flavor: d.flavor,
          benefit: d.benefit,
          relation: Math.round(rel),
          max,
          effectText: this.diplomacyEffectText(d.scope, rel * d.perPoint),
          cost: formatNumber(cost),
          costUnit: pluralizePL(cost.toNumber(), dewForms2),
          affordable: !atMax && dewHave2.gte(cost),
          atMax,
        });
      }
    }
    const dyplomacja: DyplomacjaView = { unlocked: dyplUnlocked, relations };

    return {
      resources,
      clickResource: this.clickResource,
      clickResourceName: this.registry.resources.get(this.clickResource)?.name ?? this.clickResource,
      clickPower: formatNumber(this.clickPower()),
      generators,
      upgrades,
      upgradeStats,
      goals: this.goalsThrottled(baseCtx),
      prestige,
      tree,
      activeEvent,
      lexicon,
      achievements: {
        earned: Object.keys(this.state.achievements).length,
        total: this.registry.achievements.size,
        justEarned: this.drainJustEarned(),
      },
      characters,
      gielda,
      zalatwianie,
      zjazd,
      dyplomacja,
      interRun: {
        phase: this.state.interRun,
        gain: formatNumber(this.state.interRunGain),
        gainUnit: pluralizePL(this.state.interRunGain.toNumber(), formsFor(this.registry.resources.get('odznaczenia')!)),
      },
      tasmaUnlocked: !!this.state.flags['mechanika.minigra_tasma'],
      okazjeUnlocked: this.okazjeUnlocked(),
      buffs: (() => {
        const nb = Date.now();
        this.activeBuffs = this.activeBuffs.filter((b) => b.until > nb); // sprzątanie wygasłych
        return this.activeBuffs.map((b) => ({
          id: b.id,
          label: b.label,
          kind: b.kind,
          secondsLeft: Math.max(0, Math.ceil((b.until - nb) / 1000)),
        }));
      })(),
      stats: {
        totalClicks: this.state.stats.totalClicks,
        playTimeSec: Math.floor(this.state.stats.playTimeSec),
      },
      packs: this.registry.packs.map((p) => ({ id: p.id, name: p.name })),
    };
  }

  private goalForBuilding(id: string, horizon: string): GoalView | undefined {
    const g = this.registry.generators.get(id);
    if (!g) return undefined;
    const price = this.cost(id);
    const have = this.state.resources[g.costResource] ?? ZERO;
    const def = this.registry.resources.get(g.costResource);
    const forms = def ? formsFor(def) : nameForms(g.costResource);
    return {
      horizon,
      label: g.name,
      detail: `${formatNumber(price)} ${pluralizePL(price.toNumber(), forms)}`,
      progress: clamp01(price.lte(ZERO) ? ONE : have.div(price)),
      currentRaw: have.toNumber(),
      needRaw: price.toNumber(),
      resourceId: g.costResource,
      iconKey: 'gen:' + id,
    };
  }

  /** Najblizsza maszyna: do kupienia (jesli odblokowana), inaczej do odblokowania. */
  private goalMachine(ctx: EvalContext): GoalView | undefined {
    for (const id of this.registry.generatorOrder) {
      if (!this.isUnlocked(id)) continue;
      const g = this.registry.generators.get(id);
      if (!g) continue;
      if ((this.state.resources[g.costResource] ?? ZERO).lt(this.cost(id))) {
        return this.goalForBuilding(id, 'Teraz');
      }
    }
    const lockedId = this.registry.generatorOrder.find((id) => !this.isUnlocked(id));
    const g = lockedId ? this.registry.generators.get(lockedId) : undefined;
    if (!g) return undefined;
    const tp = thresholdProgress(g.unlock, ctx);
    return {
      horizon: 'Teraz',
      label: g.name,
      detail: tp ? `${formatNumber(tp.have)} / ${formatNumber(tp.need)}` : 'wkrótce',
      progress: tp?.progress ?? -1,
      iconKey: 'gen:' + lockedId,
    };
  }

  private goalUpgrade(ctx: EvalContext): GoalView | undefined {
    let first: GoalView | undefined;
    let unaffordable: GoalView | undefined;
    for (const [id, u] of this.registry.upgrades) {
      if (!this.isUpgradeAvailable(id)) continue;
      const price = evalNumber(u.cost, ctx);
      const def = this.registry.resources.get(u.costResource);
      const forms = def ? formsFor(def) : nameForms(u.costResource);
      const have = this.state.resources[u.costResource] ?? ZERO;
      const gv: GoalView = {
        horizon: 'Ulepszenie',
        label: u.name,
        detail: `${formatNumber(price)} ${pluralizePL(price.toNumber(), forms)}`,
        progress: clamp01(price.lte(ZERO) ? ONE : have.div(price)),
        currentRaw: have.toNumber(),
        needRaw: price.toNumber(),
        resourceId: u.costResource,
        iconKey: 'upgrade',
      };
      if (!first) first = gv;
      if (have.lt(price)) {
        unaffordable = gv;
        break;
      }
    }
    return unaffordable ?? first;
  }

  private goalKadra(): GoalView | undefined {
    for (const [id, c] of this.registry.characters) {
      if (this.state.characters[id] || !this.isCharacterAvailable(id)) continue;
      const res = c.costResource ?? this.clickResource;
      const price = this.characterCost(id);
      const have = this.state.resources[res] ?? ZERO;
      const def = this.registry.resources.get(res);
      const forms = def ? formsFor(def) : nameForms(res);
      return {
        horizon: 'Kadra',
        label: c.name,
        detail: `${formatNumber(price)} ${pluralizePL(price.toNumber(), forms)}`,
        progress: clamp01(price.lte(ZERO) ? ONE : have.div(price)),
        currentRaw: have.toNumber(),
        needRaw: price.toNumber(),
        resourceId: res,
        iconKey: 'kadra',
      };
    }
    return undefined;
  }

  /** Najblizsze (najbardziej zaawansowane) niezdobyte osiagniecie progowe — „nieskonczony" cel. */
  private goalAchievement(ctx: EvalContext): GoalView | undefined {
    let best: { name: string; secret: boolean; tp: ThresholdInfo } | null = null;
    for (const [id, a] of this.registry.achievements) {
      if (this.state.achievements[id]) continue;
      const tp = thresholdProgress(a.condition, ctx);
      if (!tp || tp.progress <= 0 || tp.progress >= 1) continue;
      if (!best || tp.progress > best.tp.progress) best = { name: a.name, secret: !!a.secret, tp };
    }
    if (!best) return undefined;
    return {
      horizon: 'Osiągnięcie',
      label: best.secret ? '???' : best.name,
      detail: `${formatNumber(best.tp.have)} / ${formatNumber(best.tp.need)}`,
      progress: best.tp.progress,
      mystery: best.secret,
      iconKey: 'achievement',
    };
  }

  private goalMilestone(ctx: EvalContext): GoalView | undefined {
    for (const [id, m] of this.registry.milestones) {
      if (this.state.milestones[id]) continue;
      const tp = thresholdProgress(m.trigger, ctx);
      const far = tp ? tp.progress < 0.12 : true;
      return {
        horizon: 'Cel',
        label: far ? '???' : m.name,
        detail: tp ? `${formatNumber(tp.have)} / ${formatNumber(tp.need)}` : '???',
        progress: tp?.progress ?? -1,
        mystery: far,
        iconKey: far ? undefined : 'milestone',
      };
    }
    return undefined;
  }

  private goalPrestige(): GoalView | undefined {
    const gain = this.prestigeGain();
    if (gain.lte(ZERO) && this.state.stats.denominations === 0) return undefined;
    const ready = gain.gt(ZERO);
    return {
      horizon: 'Pięciolatka',
      label: ready ? 'Denominacja się opłaca' : 'Następne odznaczenie',
      detail: ready ? `+${formatNumber(gain)} odznaczeń` : 'w drodze',
      progress: ready ? 1 : this.prestigeProgress(),
      iconKey: 'prestige',
    };
  }

  /** Cele z throttlingiem ~300 ms — drogi skan najbliższego osiągnięcia nie biegnie co migawkę. */
  private goalsThrottled(ctx: EvalContext): Goals {
    const now = Date.now();
    if (this.goalsCache && now - this.goalsCacheAt < 300) return this.goalsCache;
    this.goalsCache = this.computeGoals(ctx);
    this.goalsCacheAt = now;
    return this.goalsCache;
  }

  /** „Co dalej?" (uwaga #16) — wiele żywych horyzontów naraz, by nigdy nie było pusto.
   *  Najbliższe osiągnięcie (z 300+) sprawia, że zawsze jest konkretny kolejny cel. */
  private computeGoals(ctx: EvalContext): Goals {
    const goals: Goals = [];
    const push = (g: GoalView | undefined): void => {
      if (g) goals.push(g);
    };
    push(this.goalMachine(ctx));
    push(this.goalUpgrade(ctx));
    push(this.goalKadra());
    push(this.goalAchievement(ctx));
    push(this.goalMilestone(ctx));
    push(this.goalPrestige());
    return goals;
  }

  // --- zapis -----------------------------------------------------------------

  serialize(): SaveData {
    this.state.stats.lastSeen = Date.now();
    return serializeState(this.state);
  }

  restore(save: SaveData): void {
    this.state = deserializeState(save, this.registry);
    this.goalsCacheAt = 0;
    this.recomputeModifiers();
  }

  reset(): void {
    this.state = createInitialState(this.registry);
    this.goalsCacheAt = 0;
    this.recomputeModifiers();
  }
}
