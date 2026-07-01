// schema.ts — Wersjonowany schemat tresci. JEDNO ZRODLO PRAWDY (PLAN rozdz. 3.1, DLC rozdz. 5).
// Rdzen gry konsumuje tresc w DOKLADNIE tym samym formacie co DLC. Te typy opisuja caly format
// z DLC.md — nawet jesli Faza 0 implementuje tylko `resources` + `generators`. Dzieki temu paczki
// DLC walidowane sa wzgledem pelnego, stabilnego schematu od poczatku.

/** Numer wersji schematu. Zmiana lamiaca => podbij i dodaj sciezke migracji (PLAN 3.1). */
export const SCHEMA_VERSION = 1 as const;

/** Wyrazenie mini-jezyka formul (patrz katalog `formula/`). Surowy tekst, parsowany przez silnik. */
export type Formula = string;

export type ResourceFormat = 'named' | 'scientific';

/** Polskie formy rzeczownika do odmiany po liczbie (np. cykl / cykle / cykli / cykla). */
export interface PluralFormsPL {
  /** 1 (mianownik l. poj.): "1 cykl" */
  one: string;
  /** 2-4 oprocz 12-14 (mianownik l. mn.): "2 cykle", "22 cykle" */
  few: string;
  /** 0, 5-21 i konca 0/1/5-9, 11-14 (dopelniacz l. mn.): "5 cykli", "100 cykli" */
  many: string;
  /** liczby z czescia dziesietna (dopelniacz l. poj.): "22,81 cykla". Brak => uzyj `many`. */
  fractional?: string;
}

export interface ResourceDef {
  id: string;
  name: string;
  description?: string;
  format?: ResourceFormat;
  /** Odmiana nazwy po liczbie (polski). Brak => nazwa uzywana bez odmiany. */
  plural?: PluralFormsPL;
  /** Czy waluta prestizowa (resetowana inaczej przy Denominacji). */
  prestige?: boolean;
  /** Waluta „uśpiona" — zakodowana na przyszłe mechaniki, ale ukryta w UI dopóki jej nie zdobędziesz. */
  hidden?: boolean;
  /** Towar reglamentowany (PLAN 9.1) — „waluta zastępcza" do smarowania (wódka/kawa/papierosy).
   *  Da się go „zaopatrzyć" na czarnym rynku za dewizy: `price` = formula kosztu dewiz za jeden
   *  zakup, `batch` = ile sztuk daje jeden zakup (domyślnie 1). Obecność pola = towar do kupienia. */
  supply?: { price: Formula; batch?: number };
}

export interface GeneratorDef {
  id: string;
  name: string;
  flavor?: string;
  /** Czym sie placi. */
  costResource: string;
  /** Formula kosztu kolejnej sztuki; `posiadane` = ile juz masz tego generatora. */
  cost: Formula;
  /** Co produkuje. */
  outputResource: string;
  /** Produkcja na sztuke na sekunde (formula). */
  production: Formula;
  /** Warunek pojawienia sie (formula logiczna). Brak => zawsze widoczny. */
  unlock?: Formula;
  /** "inherit" = akcent paczki, albo wlasny kolor. */
  accent?: string;
}

/** Prymityw efektu (DLC rozdz. 7). Pola zalezne od `type`; walidacja wg slownika `effects.ts`. */
export interface EffectDef {
  type: string;
  /** "global" | "resource:<id>" | "generator:<id>" | "upgrade:<id>" | ... */
  target?: string;
  /** Formula (tekst) lub liczba — mnozniki, ilosci, wartosci flag itp. */
  value?: Formula | number;
  amount?: Formula | number;
  delta?: Formula | number;
  flag?: string;
  country?: string;
  event?: string;
  mechanic?: string;
  [extra: string]: unknown;
}

export interface UpgradeDef {
  id: string;
  name: string;
  flavor?: string;
  costResource: string;
  cost: Formula;
  unlock?: Formula;
  /** Jednorazowe (wiekszosc ulepszen). */
  once?: boolean;
  effects: EffectDef[];
}

export interface MilestoneDef {
  id: string;
  name: string;
  trigger: Formula;
  effects: EffectDef[];
}

export interface AchievementDef {
  id: string;
  name: string;
  description?: string;
  condition: Formula;
  secret?: boolean;
  /** Kategoria do grupowania w oknie osiagniec (np. "Maszyny", "Cykle", "Prestiz"). */
  category?: string;
  /** Mnoznik do przyrostu, aktywny gdy gracz odblokuje to wezlem drzewa (PLAN 8.3). */
  multiplier?: Formula;
}

export interface EventOptionDef {
  label: string;
  effects?: EffectDef[];
}

export interface EventDef {
  id: string;
  title: string;
  body: string;
  /** Wyzwalacz: warunek/losowosc/czas (formula logiczna). */
  trigger?: Formula;
  /** Wzgledna czestosc, gdy wyzwalacz spelniony (zdarzenia losowe). Brak/0 => zdarzenie nielosowe. */
  weight?: number;
  /** Czy wystapi najwyzej raz na rozgrywke (story-beaty). Bez wagi + once => odpala sie gdy warunek prawda. */
  once?: boolean;
  options?: EventOptionDef[];
  /** Konsekwencja bez wyboru (gdy brak `options`). */
  effects?: EffectDef[];
}

export type TreeNodeKind =
  | 'multiplier'
  | 'unlockMechanic'
  | 'unlockMinigame'
  | 'unlockUpgradeSet'
  | 'enableAchievementMultipliers'
  | 'start'
  | 'gate'
  | 'keystone';

export interface TreeNodeDef {
  id: string;
  name: string;
  description?: string;
  /** Koszt w odznaczeniach (formula). */
  cost: Formula;
  /** Poprzednie wezly wymagane do odblokowania. */
  requires?: string[];
  /** Zamglony (ukryty, poki nie dojdziesz w poblize) — "bank". */
  fogged?: boolean;
  kind: TreeNodeKind;
  /** Konar/rodzina drzewa (kolumna w UI): np. 'aparat' | 'rd' | 'rynek'. Brak => węzeł-zwornik. */
  branch?: string;
  /** Ile poziomów ma węzeł (każdy poziom stosuje efekty ponownie; domyślnie 1). Wymagania kolejnego
   *  węzła w konarze spełnia dopiero MAKSYMALNY poziom poprzednika. */
  levels?: number;
  effects: EffectDef[];
}

export interface LexiconDef {
  id: string;
  name: string;
  /** "generator:<id>" | "upgrade:<id>" | "event:<id>" | "character:<id>" ... */
  unlockedBy: string;
  text: string;
  /** Nazwana ikona (np. 'coffee', 'car') — gdy podana, nadpisuje ikonę wywiedzioną z `unlockedBy`.
   *  Zapobiega powtórkom ikon, gdy kilka haseł odblokowuje ten sam generator/kamień milowy. */
  icon?: string;
}

export type TickerStream = 'advice' | 'propaganda' | 'easter' | 'notice';

export interface TickerDef {
  id: string;
  stream: TickerStream;
  text: string;
  condition?: Formula;
}

export interface CharacterDef {
  id: string;
  name: string;
  archetype: string;
  flavor?: string;
  passive?: EffectDef[];
  /** Koszt werbunku (opcjonalny). */
  cost?: Formula | number;
  costResource?: string;
  /** Warunek pojawienia sie na liscie werbunku. */
  unlock?: Formula;
  /** ID pierwszego zdarzenia jego linii (opcjonalne). */
  eventLine?: string;
}

export interface SynergyDef {
  /** Bonus aktywny tylko gdy obecna jest tez wskazana paczka (lagodna degradacja, DLC 8.3). */
  requiresPack: string;
  note?: string;
  effects: EffectDef[];
}

/** Łatka („pre-patch", DLC 8.4) — ZMIANA STRUKTURY istniejącej treści rdzenia, gdy schemat czegoś jeszcze
 *  nie wyraża. Stosowana w `buildRegistry` PO scaleniu, w deterministycznej kolejności paczek. Łatka NIGDY
 *  nie jest konieczna do działania paczki (preferuj efekty, DLC 8.2). */
export interface PatchDef {
  /** Cel w formacie `<rodzaj>:<id>`, np. `generator:spectrum`, `upgrade:rdzen.u1`, `resource:cykle`. */
  target: string;
  /** Nadpisz pola celu (shallow). `id` jest NIETYKALNE. Wartości mogą być formułami (np. nowy `cost`). */
  set?: Record<string, unknown>;
  /** Doklej warunek (AND) do pola warunkowego celu: `unlock` (generator/upgrade), `trigger`
   *  (milestone/event) albo `condition` (achievement). Np. zaostrzenie odblokowania rdzennej maszyny. */
  addCondition?: Formula;
}

/** Tozsamosc wizualna paczki (DLC rozdz. 9, PLAN 3.5). */
export interface VisualIdentity {
  accentColor?: string;
  icon?: string | null;
  font?: string | null;
  texture?: string | null;
}

/** Łapówka/przysługa (PLAN 9.1, Faza 4A) — „załatwianie" jako dźwignia na rdzennej ekonomii.
 *  Płacisz zasobem-przysługą (domyślnie dewizy = koperta) za CZASOWY efekt; każda dokłada RYZYKO
 *  kontroli (zbyt grube smarowanie ściąga SB). Uproszczony efekt (scope+mul), nie pełny EffectDef. */
export interface BribeDef {
  id: string;
  name: string;
  /** Cel smarowania: 'magazynier' | 'celnik' | 'urzednik' | 'dygnitarz'. */
  target: string;
  flavor?: string;
  /** Koszt łapówki (formula). */
  cost: Formula;
  /** Zasób kosztu — domyślnie 'dewizy' (koperta). */
  costResource?: string;
  /** Ile „ryzyka kontroli" dolicza (0..100). */
  risk: number;
  /** Czas trwania efektu w sekundach. */
  durationSec: number;
  /** Zakres czasowego efektu: 'prod' (cała produkcja), 'cost' (koszty, mul<1 = taniej),
   *  'dewizy' (produkcja dewiz), 'click' (moc klikania). */
  scope: 'prod' | 'cost' | 'dewizy' | 'click';
  /** Mnożnik efektu. */
  mul: number;
  /** Warunek pojawienia się na liście (formula). */
  unlock?: Formula;
}

/** Doktryna ze Zjazdu PZPR (PLAN 9.2, Faza 4B) — wybór preferowanej linii na CAŁĄ następną pięciolatkę
 *  (rozgrywkę). `effects` to TRWALE modyfikatory na tę rozgrywkę (jak ulepszenia: multiplyProduction/
 *  multiplyCost/addFlat...). Niektóre niosą „bombę" (boom-bust gierkowski): po `debt.afterSec` sekundach
 *  rozgrywki wpada kryzys — zdarzenie `debt.crisisEvent` z karą. Resetowane przy Denominacji. */
export interface DoctrineDef {
  id: string;
  name: string;
  flavor?: string;
  /** Dłuższy opis historyczny (lore) do zakładki „Doktryny” w Leksykonie. Gdy brak — Leksykon
   *  pokazuje `flavor`. REGUŁA: każda NOWA doktryna powinna dostać `lore` (albo chociaż `flavor`),
   *  bo zakładka w Leksykonie jest data-driven i sama wciągnie każdą doktrynę z rejestru. */
  lore?: string;
  /** Oś tematyczna (np. 'gospodarka' | 'polityka') — do grupowania w UI. Opcjonalne. */
  axis?: string;
  effects: EffectDef[];
  /** Opóźniona konsekwencja: po `afterSec` s rozgrywki wpada `crisisEvent` (kara). Opcjonalne. */
  debt?: { afterSec: number; crisisEvent: string };
  /** Warunek dostępności na liście Zjazdu (formula). */
  unlock?: Formula;
}

/** Dyplomacja bloków (PLAN 9.3, Faza 4C) — relacja z krajem/blokiem PRZESUWA ceny wkładów i produkcję.
 *  Relację podnosisz, inwestując dewizy (delegacje, kontrakty); im wyższa, tym większy STAŁY bonus
 *  (scope+perPoint). Relacja = flaga `relacja.<id>` — ta sama, którą ruszają zdarzenia dyplomatyczne. */
export interface DiplomacyDef {
  id: string;
  name: string;
  /** Blok: 'wschod' (RWPG) | 'zachod' (za murem CoCom). */
  bloc: string;
  flavor?: string;
  /** Krótki opis korzyści (dla UI). */
  benefit: string;
  /** Czego dotyczy bonus (PREMIA kraju — w obrębie jednego bloku każdy kraj ma INNĄ): 'cost' (tańsze
   *  wszystko), 'prod' (produkcja globalna), 'dewizy' (produkcja dewiz), 'cykle' (produkcja cykli),
   *  'click' (moc klikania), 'all' (po trochu: koszty ↓ i produkcja ↑). Premia może się powtarzać tylko
   *  między różnymi blokami. */
  scope: 'cost' | 'prod' | 'dewizy' | 'cykle' | 'click' | 'all';
  /** Siła bonusu na 1 punkt relacji (np. 0.003 → przy relacji 100 ≈ 30%). */
  perPoint: number;
  /** Koszt podniesienia relacji o krok (formula, dewizy) — w silniku rośnie z poziomem relacji. */
  cost: Formula;
  /** Ile punktów relacji daje jedna inwestycja (domyślnie 10). */
  step?: number;
  /** Sufit relacji (domyślnie 100). */
  max?: number;
  /** Warunek pojawienia się na liście (formula). */
  unlock?: Formula;
}

/** Sekcje tresci paczki. Wszystkie opcjonalne — dajesz tylko te, ktorych uzywasz. */
export interface PackContent {
  resources?: ResourceDef[];
  generators?: GeneratorDef[];
  upgrades?: UpgradeDef[];
  milestones?: MilestoneDef[];
  achievements?: AchievementDef[];
  events?: EventDef[];
  treeNodes?: TreeNodeDef[];
  synergies?: SynergyDef[];
  patches?: PatchDef[];
  lexicon?: LexiconDef[];
  ticker?: TickerDef[];
  characters?: CharacterDef[];
  bribes?: BribeDef[];
  doctrines?: DoctrineDef[];
  diplomacy?: DiplomacyDef[];
}

/** Klucze sekcji tresci — uzywane przy scalaniu i walidacji. */
export const CONTENT_SECTIONS = [
  'resources',
  'generators',
  'upgrades',
  'milestones',
  'achievements',
  'events',
  'treeNodes',
  'synergies',
  'patches',
  'lexicon',
  'ticker',
  'characters',
  'bribes',
  'doctrines',
  'diplomacy',
] as const;

export type ContentSection = (typeof CONTENT_SECTIONS)[number];
