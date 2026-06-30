// num.ts — Jedyny punkt styku z biblioteka wielkich liczb (break_infinity.js).
// PLAN rozdz. 2 i 16: break_infinity OBOWIAZKOWO od Fazy 0; retrofit jest koszmarem.
// Cala reszta kodu liczy na liczbach przez ten modul — gdyby kiedys wymienic biblioteke,
// zmiana jest tutaj, a nie w 50 plikach.
import Decimal from 'break_infinity.js';
import type { PluralFormsPL } from './schema';

export { Decimal };
export type DecimalSource = Decimal | number | string;

export const D = (x: DecimalSource): Decimal => new Decimal(x);
export const ZERO: Decimal = new Decimal(0);
export const ONE: Decimal = new Decimal(1);

// Tematyczne, polskie skroty duzych liczb (notacja "named"). Indeks = tier (potega 1000).
const NAMED_TIERS = [
  '', ' tys.', ' mln', ' mld', ' bln', ' bld', ' trl', ' trd', ' kwa', ' kwd', ' kwi', ' kwid',
] as const;

// Separator tysiecy: nielamliwa spacja U+00A0 (czytelna, nie rozrywa liczby na koncu wiersza).
// Definiowana przez kod znaku, by nie zalezec od niewidocznych wariantow spacji w zrodle.
export const THOUSAND_SEP = String.fromCharCode(0x00a0);
// Separator dziesietny: polski przecinek.
const DECIMAL_SEP = ',';

export type Notation = 'named' | 'scientific' | 'mixed';

export interface FormatOptions {
  notation?: Notation;
  /** Wymuś STAŁĄ liczbę miejsc po przecinku (mantysy/małej liczby). Stała szerokość = brak migotania;
   *  miejsce dziesiętne nie „znika i wraca" przy odświeżeniach. Używane przez główne liczniki walut. */
  decimals?: number;
}

function trimZeros(s: string): string {
  return s.includes('.') ? s.replace(/\.?0+$/, '') : s;
}

function groupThousands(n: number): string {
  return Math.round(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, THOUSAND_SEP);
}

// Grupuje część całkowitą tysiącami, ZACHOWUJĄC `dec` miejsc po przecinku (dla wymuszonych dziesiętnych).
function groupWithDecimals(n: number, dec: number): string {
  const fixed = n.toFixed(dec);
  const dot = fixed.indexOf('.');
  const intPart = dot < 0 ? fixed : fixed.slice(0, dot);
  const frac = dot < 0 ? '' : fixed.slice(dot);
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, THOUSAND_SEP) + frac;
}

/** Formatuje liczbe do wyswietlenia. Domyslnie "mixed": pelna do ~1e6, dalej nazwana/naukowa.
 *  Polski zapis: separator dziesietny = przecinek, tysiace rozdzielone nielamliwa spacja. */
export function formatNumber(value: DecimalSource, opts: FormatOptions = {}): string {
  // Wewnetrznie liczymy z kropka dziesietna, na koniec zamieniamy na polski przecinek.
  return formatNumberRaw(value, opts).replace('.', DECIMAL_SEP);
}

function formatNumberRaw(value: DecimalSource, opts: FormatOptions = {}): string {
  const notation: Notation = opts.notation ?? 'mixed';
  const dec = opts.decimals; // wymuszona liczba miejsc po przecinku (np. 2 dla głównych liczników)
  const d = value instanceof Decimal ? value : new Decimal(value);
  if (d.eq(ZERO)) return dec != null ? (0).toFixed(dec) : '0';

  const neg = d.sign() < 0;
  const sign = neg ? '-' : '';
  const a = d.abs();

  if (a.lt(1e-3)) return sign + a.toExponential(2);
  if (a.lt(1)) return sign + (dec != null ? a.toNumber().toFixed(dec) : trimZeros(a.toNumber().toFixed(3)));
  if (a.lt(1000)) {
    const n = a.toNumber();
    if (dec != null) return sign + n.toFixed(dec);
    return sign + (Number.isInteger(n) ? String(n) : trimZeros(n.toFixed(2)));
  }
  if (notation !== 'scientific' && a.lt(1e6)) {
    const n = a.toNumber();
    return sign + (dec != null ? groupWithDecimals(n, dec) : groupThousands(n));
  }

  // Duze liczby: korzystamy z znormalizowanej postaci mantysa * 10^exponent.
  const exp = a.exponent;
  const mant = a.mantissa;
  if (notation !== 'scientific') {
    const tier = Math.floor(exp / 3);
    if (tier >= 1 && tier < NAMED_TIERS.length) {
      const shown = mant * Math.pow(10, exp - tier * 3); // [1, 1000)
      const name = NAMED_TIERS[tier] ?? '';
      // Wymuszone `dec` (np. główne liczniki) => stała szerokość, brak migotania. W przeciwnym razie
      // STALA liczba cyfr znaczacych (3) — bez obcinania zer (10,59 -> 10,60 -> 10,61, nie 10,6).
      const dp = dec != null ? dec : shown < 10 ? 2 : shown < 100 ? 1 : 0;
      return sign + shown.toFixed(dp) + name;
    }
  }
  return sign + mant.toFixed(dec != null ? dec : 2) + 'e' + exp;
}

/**
 * Wybiera poprawna polska forme rzeczownika po liczbie (odmiana przez przypadki/liczby).
 * UWAGA: wartosc powinna byc TA, ktora widzi gracz (np. zaokraglona do calkowitej dla licznika),
 * bo od niej zalezy forma. Przyklady: 1 cykl, 2 cykle, 5 cykli, 22 cykle, 100 cykli, 22,81 cykla.
 */
export function pluralizePL(value: number, forms: PluralFormsPL): string {
  const v = Math.abs(value);
  if (!Number.isFinite(v) || v >= 1e6) return forms.many; // duze/nazwane -> dopelniacz l. mn.
  if (!Number.isInteger(v)) return forms.fractional ?? forms.many; // liczba z czescia dziesietna
  if (v === 1) return forms.one;
  const d10 = v % 10;
  const d100 = v % 100;
  if (d10 >= 2 && d10 <= 4 && !(d100 >= 12 && d100 <= 14)) return forms.few;
  return forms.many;
}

/**
 * Wariant dla SZYBKO zmieniajacych sie licznikow: od 5 w gore zawsze dopelniacz l. mn. (forms.many),
 * dzieki czemu rzeczownik nie "miga" miedzy formami przy przelatujacych liczbach. Dla 0-4 dokladnie
 * (0/5+ → many, 1 → one, 2-4 → few). Koszty/statyczne wartosci nadal uzywaja `pluralizePL`.
 */
export function pluralizePLStable(value: number, forms: PluralFormsPL): string {
  if (!Number.isFinite(value) || Math.abs(value) >= 5) return forms.many;
  return pluralizePL(value, forms);
}

/** Modulo dla Decimal (break_infinity nie daje go wprost). */
export function decimalMod(a: Decimal, b: Decimal): Decimal {
  if (b.eq(ZERO)) return new Decimal(NaN);
  return a.sub(a.div(b).floor().mul(b));
}
