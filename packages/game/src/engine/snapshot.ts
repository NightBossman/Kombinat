// snapshot.ts — Migawka stanu do RENDEROWANIA. Wszystko juz sformatowane (stringi) — Decimale
// NIE przekraczaja granicy Workera (structured clone nie zachowalby klasy). UI dostaje gotowca.
import type { PluralFormsPL, EffectDef } from '@kombinat/shared';

/** Etykieta GRUPY ulepszenia do panelu (U1) — wywiedziona z pierwszego efektu, BEZ zmian schematu
 *  (dzięki czemu Studio/DLC pozostają zgodne). `names` dostarcza nazw maszyn/zasobów z rejestru. */
export function upgradeGroup(
  effects: EffectDef[],
  names: { gen: (id: string) => string | undefined; res: (id: string) => string | undefined },
): string {
  const e = effects[0];
  if (!e) return 'Różne';
  if (e.type === 'divideCost' || e.type === 'multiplyCost') return 'Koszty';
  if (e.type === 'addFlat') return 'Klikanie';
  if (e.type === 'multiplyProduction') {
    const t = e.target ?? '';
    if (t === 'global') return 'Globalne';
    if (t.startsWith('generator:')) return names.gen(t.slice('generator:'.length)) ?? 'Maszyny';
    if (t.startsWith('resource:')) {
      const r = t.slice('resource:'.length);
      return r === 'dewizy' ? 'Dewizy' : (names.res(r) ?? r);
    }
  }
  if (e.type === 'enableMechanic' || e.type === 'enableAchievementMultipliers') return 'Specjalne';
  return 'Różne';
}

export interface ResourceView {
  id: string;
  name: string;
  amount: string;
  rate: string;
  /** Surowa wartosc i tempo (number) — do plynnego, interpolowanego WYSWIETLANIA na 60 fps.
   *  Moga byc Infinity dla liczb poza float64 (late game) — wtedy UI pokazuje `amount`/`rate`. */
  amountRaw: number;
  rateRaw: number;
  /** Formy odmiany nazwy — UI odmienia po BIEZACEJ (plynnej) wartosci. */
  plural?: PluralFormsPL;
  /** Waluta prestizowa (odznaczenia) — nie ma sensownego tempa „/s", UI nie pokazuje go. */
  prestige?: boolean;
  /** Zasob LOKALNY/uzytkowy (np. towary-waluty wodka/kawa/papierosy z zaopatrzenia) — NIE jest
   *  globalna waluta, wiec NIE pokazujemy go w dolnej stopce (regula wlasciciela 2026-06-23).
   *  Stopka = wylacznie waluty globalne (cykle/dewizy/odznaczenia + przyszle uspione globalne). */
  local?: boolean;
}

export interface GeneratorView {
  id: string;
  name: string;
  flavor?: string;
  owned: string;
  ownedNum: number;
  /** Koszt dla AKTUALNIE wybranej liczby sztuk (x1/x10/x100/Max). */
  cost: string;
  /** Ile sztuk kupi jedno kliknięcie przy bieżącym wyborze (do pokazania „×N"). */
  buyCount: number;
  costResource: string;
  costResourceName: string;
  /** Nazwa zasobu kosztu juz odmieniona wg wartosci kosztu (np. "100 cykli", "39,9 cykla"). */
  costUnit: string;
  production: string;
  rate: string;
  /** Zasob produkowany + jego nazwa (odmieniona) — by rozroznic „+8 cykli/s” od „+0,08 dewiz/s”. */
  outputResource: string;
  outputUnit: string;
  unlocked: boolean;
  affordable: boolean;
  /** Akcent kolorystyczny paczki DLC (Faza 5D) — UI maluje nim krawędź/pieczęć. Brak = treść rdzenia (bez szwu). */
  accent?: string;
  /** Pieczęć paczki DLC: 'official' (podpis zweryfikowany) lub 'community'. Brak = rdzeń (bez pieczęci). */
  dlcSeal?: 'official' | 'community';
}

export interface UpgradeView {
  id: string;
  name: string;
  flavor?: string;
  cost: string;
  costResource: string;
  costUnit: string;
  effectText: string;
  affordable: boolean;
  accent?: string;
  /** Grupa do panelu (U1): „Globalne" / „Koszty" / „Klikanie" / „Dewizy" / nazwa maszyny / … */
  group: string;
}

/** Pojedynczy cel w panelu „Co dalej?". `progress` w [0,1], albo -1 gdy nieznany. */
export interface GoalView {
  /** Etykieta horyzontu/rodzaju celu (np. „Teraz", „Kadra", „Osiągnięcie"). */
  horizon: string;
  label: string;
  detail: string;
  progress: number;
  mystery?: boolean;
  /** Do PLYNNEGO paska: gdy `resourceId` to zasob klikalny, UI liczy postep z gladkiej wartosci. */
  currentRaw?: number;
  needRaw?: number;
  resourceId?: string;
  /** Klucz ikony wyzwania (uwaga #17): 'gen:<id>' | 'upgrade' | 'milestone'. UI mapuje na ikonę. */
  iconKey?: string;
}

/** Lista żywych celów „Co dalej?" (uwaga #16) — wiele horyzontów, by nigdy nie było pusto. */
export type Goals = GoalView[];

export interface PrestigeView {
  /** Aktualne odznaczenia (waluta dziedzictwa). */
  odznaczenia: string;
  odznaczeniaRaw: number;
  odznaczeniaUnit: string;
  /** Ile odznaczen da Denominacja TERAZ. */
  gain: string;
  gainRaw: number;
  gainUnit: string;
  canDenominate: boolean;
  denominations: number;
  /** Bonus do produkcji cykli z posiadanych odznaczeń, w procentach (uwaga #15). */
  bonusPct: number;
  /** Postep do najblizszego kolejnego odznaczenia (0..1) — „cien” zanim sie odblokuje. */
  progress: number;
  /** Czy panel prestizu w ogole pokazac (rzuca cien dopiero, gdy gracz sie zbliza). */
  visible: boolean;
}

export type TreeNodeStatus = 'owned' | 'available' | 'unaffordable' | 'locked';

export interface TreeNodeView {
  id: string;
  name: string;
  description?: string;
  kind: string;
  cost: string;
  costRaw: number;
  costUnit: string;
  effectText: string;
  status: TreeNodeStatus;
  /** Konar/rodzina (kolumna w UI). Brak => węzeł-zwornik (capstone). */
  branch?: string;
  /** Posiadany poziom i maksymalny (uwaga #3 — wielopoziomowe węzły). cost = koszt KOLEJNEGO poziomu. */
  level: number;
  maxLevel: number;
  /** Nazwy jeszcze niespelnionych wymagan (do „wymaga: …”). */
  requiresUnmet: string[];
}

export interface ActiveEventView {
  id: string;
  title: string;
  body: string;
  /** Etykiety opcji; pusta lista => zdarzenie-komunikat z jednym „OK”. */
  options: string[];
}

export interface LexiconEntryView {
  id: string;
  name: string;
  text: string;
  unlocked: boolean;
  /** Klucz ikony (z `unlockedBy`): 'generator:X' | 'event:X' | … — UI mapuje na przypisaną ikonę. */
  iconKey?: string;
}

export interface LexiconView {
  entries: LexiconEntryView[];
  unlocked: number;
  total: number;
}

/** Pelny wpis osiagniecia — wysylany NA ZADANIE (jest ich 300+, nie w kazdej migawce). */
export interface AchievementView {
  id: string;
  name: string;
  description: string;
  category: string;
  earned: boolean;
  secret: boolean;
}

export interface CharacterView {
  id: string;
  name: string;
  archetype: string;
  flavor?: string;
  effectText: string;
  cost: string;
  costUnit: string;
  costResource: string;
  recruited: boolean;
  affordable: boolean;
}

export interface BribeView {
  id: string;
  name: string;
  target: string;
  flavor?: string;
  cost: string;
  costUnit: string;
  costResource: string;
  /** Opis efektu (np. „Produkcja ×2 na 90 s"). */
  effectText: string;
  risk: number;
  durationSec: number;
  affordable: boolean;
}

/** Towar reglamentowany do zaopatrzenia za dewizy (Faza 4A) — „waluta zastępcza" do smarowania. */
export interface SupplyView {
  /** Id zasobu-towaru (np. 'kawa'). */
  id: string;
  /** Nazwa towaru (np. „kawa"). */
  name: string;
  /** Ile masz teraz (sformatowane). */
  have: string;
  /** Ile sztuk daje jeden zakup. */
  batch: number;
  /** Koszt jednego zakupu w dewizach (sformatowany) + jednostka. */
  price: string;
  priceUnit: string;
  affordable: boolean;
}

/** Cykliczna promocja zaopatrzenia (Faza 4A) — krótkie okno taniej co ~10 s. */
export interface SupplyDealView {
  /** Czy trwa okno promocji (taniej). */
  active: boolean;
  /** Wielkość zniżki w procentach (np. 30). */
  pct: number;
  /** Sekundy do końca okna (gdy active) lub do następnej promocji (gdy nie). */
  secondsLeft: number;
  /** Pozycja w cyklu 0..1 (do paska-wskaźnika). */
  phase: number;
  /** CIĄGŁY wypełniacz paska 0..1 (sub-sekundowo) — UI interpoluje go na 60 fps, bez skoków. */
  fill: number;
}

/** Załatwianie/łapówki (Faza 4A) — cele smarowania + ryzyko kontroli + zaopatrzenie w towar. */
export interface ZalatwianieView {
  unlocked: boolean;
  /** Ryzyko kontroli 0..100. */
  ryzyko: number;
  bribes: BribeView[];
  /** Towary do kupienia na czarnym rynku (smarujesz nimi taniej niż kopertą). */
  supplies: SupplyView[];
  /** Cykliczna promocja cen zaopatrzenia. */
  supplyDeal: SupplyDealView;
}

/** Doktryna do wyboru na Zjeździe PZPR (Faza 4B). */
export interface DoctrineView {
  id: string;
  name: string;
  flavor?: string;
  /** Dłuższy opis historyczny (lore) do Leksykonu; gdy brak, UI używa `flavor`. */
  lore?: string;
  /** Opis trwałych efektów na pięciolatkę (np. „Cała produkcja +120%, Dewizy −30%"). */
  effectText: string;
  axis?: string;
  /** Czy niesie „bombę" (opóźniony kryzys zadłużenia) — ostrzeżenie w UI. */
  hasDebt: boolean;
  available: boolean;
}

/** Zjazd PZPR + doktryny (Faza 4B) — wybór linii na całą pięciolatkę. */
export interface ZjazdView {
  /** Czy Zjazd jest dostępny (po pierwszej Denominacji). */
  unlocked: boolean;
  /** Id aktualnie obowiązującej doktryny ('' = brak). */
  activeId: string;
  activeName: string;
  /** Czy trwa kryzys zadłużenia (bust po boomie kredytowym). */
  kryzys: boolean;
  doctrines: DoctrineView[];
}

/** Relacja z krajem/blokiem (Faza 4C). */
export interface RelationView {
  id: string;
  name: string;
  bloc: string;
  flavor?: string;
  benefit: string;
  /** Aktualny poziom relacji 0..max. */
  relation: number;
  max: number;
  /** Postęp relacji w % z jednym miejscem po przecinku (np. „0,5") — by kroki <1% były widoczne. */
  relPct: string;
  /** Bieżący bonus z relacji opisany słownie (np. „Koszty −18%"). */
  effectText: string;
  /** Koszt zacieśnienia o krok (sformatowany) + jednostka (dewizy). */
  cost: string;
  costUnit: string;
  affordable: boolean;
  /** Czy relacja na maksie. */
  atMax: boolean;
}

/** Dyplomacja bloków (Faza 4C) — relacje przesuwają ceny wkładów i produkcję. */
export interface DyplomacjaView {
  unlocked: boolean;
  relations: RelationView[];
}

export interface GieldaView {
  unlocked: boolean;
  /** Kurs: ile cykli za 1 dewize (sformatowany) + surowy. */
  rate: string;
  rateRaw: number;
  trend: 'up' | 'down' | 'flat';
  /** Historia kursu (ostatnie ~2 min) do wykresu D3 (uwaga #11). Najstarszy -> najnowszy. */
  history: number[];
}

export interface Snapshot {
  resources: ResourceView[];
  clickResource: string;
  clickResourceName: string;
  clickPower: string;
  generators: GeneratorView[];
  upgrades: UpgradeView[];
  /** Licznik ulepszeń do nagłówka panelu: ile WYKUPIONO / ile jest wszystkich / ile DOSTĘPNYCH teraz. */
  upgradeStats: { owned: number; total: number; available: number };
  goals: Goals;
  prestige: PrestigeView;
  tree: TreeNodeView[];
  activeEvent: ActiveEventView | null;
  lexicon: LexiconView;
  /** Podsumowanie osiagniec (lekkie); pelna lista na zadanie. `justEarned` = swiezo zdobyte (toast). */
  achievements: { earned: number; total: number; justEarned: AchievementView[] };
  characters: CharacterView[];
  gielda: GieldaView;
  zalatwianie: ZalatwianieView;
  zjazd: ZjazdView;
  dyplomacja: DyplomacjaView;
  /** Czy minigra „Taśma" odblokowana (uwaga #6 — przez wykupienie ulepszenia). */
  tasmaUnlocked: boolean;
  /** Czy „okazje" (złote ciastka, uwaga #21) mają się pojawiać. */
  okazjeUnlocked: boolean;
  /** Aktywne tymczasowe bonusy z okazji — do paska statusu. `id` UNIKALNE (klucz listy w UI — bez niego
   *  dwa bonusy o tej samej nazwie dawały duplikat klucza i zamrażały render). */
  buffs: { id: number; label: string; kind: string; secondsLeft: number }[];
  stats: {
    totalClicks: number;
    playTimeSec: number;
  };
  packs: { id: string; name: string }[];
}
