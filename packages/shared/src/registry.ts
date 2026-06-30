// registry.ts — Rejestr STABILNYCH ID rdzenia (DLC rozdz. 4.2) oraz przestrzeni nazw formul
// (DLC rozdz. 6.3). To kontrakt dla tworcow DLC: na te ID wolno celowac efektami, te przestrzenie
// nazw wolno czytac w formulach. Studio (Faza 5) generuje z tego zywe tabele dokumentacji.
//
// UWAGA: rejestr to KONTRAKT (co MOZE istniec), nie spis zaladowanej tresci (co istnieje teraz).
// Tresc dosypuja paczki; rejestr dokumentuje stabilne punkty zaczepienia na wszystkie fazy.

/** Zasoby rdzenia (PLAN 6.1). */
export const CORE_RESOURCE_IDS = ['cykle', 'dewizy', 'odznaczenia'] as const;
export type CoreResourceId = (typeof CORE_RESOURCE_IDS)[number];

/** Drabina generatorow = historyczny kregoslup (PLAN 6.2, DLC 4.2). Kolejnosc znaczaca. */
export const CORE_GENERATOR_IDS = [
  'liczydlo',
  'arytmometr',
  'tabulator',
  'mera400',
  'k202',
  'odra1305',
  'osrodek',
  'spectrum',
  'meritum',
  'mazovia',
  'spolka',
] as const;
export type CoreGeneratorId = (typeof CORE_GENERATOR_IDS)[number];

/** Kraje dyplomacji (PLAN 9.3, Faza 4C — mechanika juz dziala). Stabilne ID, na ktore DLC moze
 *  celowac (np. synergie, warunki `relacja.<id>`). Kolejnosc bez znaczenia; UI sortuje alfabetycznie. */
export const CORE_COUNTRY_IDS = [
  'zsrr',
  'nrd',
  'wegry',
  'czechoslowacja',
  'japonia',
  'usa',
  'rfn',
] as const;
export type CoreCountryId = (typeof CORE_COUNTRY_IDS)[number];

/** Doktryny Zjazdu PZPR (PLAN 9.2, Faza 4B). Stabilne ID do warunku `doktryna.<id>` i synergii DLC. */
export const CORE_DOCTRINE_IDS = [
  'rdzen.dok_przemysl',
  'rdzen.dok_konsumpcja',
  'rdzen.dok_kredyty',
  'rdzen.dok_propaganda',
  'rdzen.dok_liberalizacja',
] as const;
export type CoreDoctrineId = (typeof CORE_DOCTRINE_IDS)[number];

/** Mechaniki rdzenia wlaczane np. wezlami drzewa (PLAN 7.3, efekt `enableMechanic`). */
export const CORE_MECHANIC_IDS = [
  'gielda',
  'lapowki',
  'dyplomacja',
  'zjazd',
  'automatyzacja',
] as const;
export type CoreMechanicId = (typeof CORE_MECHANIC_IDS)[number];

/** Przestrzenie nazw dozwolone w formulach (DLC 6.3). Parser/refs waliduja wzgledem tej listy. */
export const FORMULA_NAMESPACES = [
  'posiadane', // ile masz danego generatora
  'zasob', // aktualna ilosc zasobu
  'tempo', // biezaca produkcja zasobu/sek
  'prestiz', // prestiz.liczba, prestiz.odznaczenia
  'osiagniecia', // osiagniecia.zdobyte
  'relacja', // relacja.<kraj>
  'doktryna', // doktryna.<id>
  'flaga', // flaga.<id>
  'czas', // czas.sesja, czas.poraDnia
  'licznik', // licznik.<klucz> — liczniki unikalnych osiagniec (seria_klikniec, tasma_lacznie...)
  'kadra', // liczba zwerbowanych postaci
  'maszyny', // maszyny.rodzaje — ile roznych typow maszyn posiadasz
] as const;
export type FormulaNamespace = (typeof FORMULA_NAMESPACES)[number];

/** Bezargumentowe (skalarne) sciezki — pelne, niepodzielne odwolania do stanu. */
export const SCALAR_REFS = [
  'prestiz.liczba',
  'prestiz.odznaczenia',
  'osiagniecia.zdobyte',
  'czas.sesja',
  'czas.poraDnia',
  'doktryna.aktywna', // 1, gdy obowiazuje JAKAS doktryna (inaczej 0)
  'maszyny.rodzaje', // ile ROZNYCH typow maszyn posiadasz (>=1 szt.)
] as const;

const NS_SET: ReadonlySet<string> = new Set(FORMULA_NAMESPACES);
const SCALAR_SET: ReadonlySet<string> = new Set(SCALAR_REFS);

/** Czy dana sciezka odwolania (np. "zasob.dewizy", "posiadane") ma poprawna przestrzen nazw. */
export function isKnownNamespace(path: string): boolean {
  if (SCALAR_SET.has(path)) return true;
  const head = path.split('.', 1)[0] ?? path;
  return NS_SET.has(head);
}

/** Nazwy funkcji dozwolone w formulach (DLC 6.2). */
export const FORMULA_FUNCTIONS = [
  'min',
  'max',
  'floor',
  'ceil',
  'round',
  'abs',
  'sqrt',
  'log',
  'log10',
  'pow',
] as const;
export type FormulaFunction = (typeof FORMULA_FUNCTIONS)[number];

const FN_SET: ReadonlySet<string> = new Set(FORMULA_FUNCTIONS);
export function isKnownFunction(name: string): boolean {
  return FN_SET.has(name);
}
