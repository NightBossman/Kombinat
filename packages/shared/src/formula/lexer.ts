// lexer.ts — Tokenizacja formuly. Produkuje plaska liste tokenow z pozycjami.
import { FormulaError } from './ast';

export type TokenType = 'num' | 'ident' | 'op' | 'lparen' | 'rparen' | 'comma' | 'eof';

export interface Token {
  type: TokenType;
  value: string;
  pos: number;
}

const TWO_CHAR_OPS = new Set(['<=', '>=', '==', '!=']);
const ONE_CHAR_OPS = new Set(['+', '-', '*', '/', '^', '%', '<', '>']);

function isDigit(c: string): boolean {
  return c >= '0' && c <= '9';
}
function isIdentStart(c: string): boolean {
  return (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || c === '_';
}
function isIdentPart(c: string): boolean {
  return isIdentStart(c) || isDigit(c);
}
function isSpace(c: string): boolean {
  return c === ' ' || c === '\t' || c === '\n' || c === '\r';
}

export function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  const len = src.length;
  let i = 0;

  while (i < len) {
    const c = src.charAt(i);

    if (isSpace(c)) {
      i++;
      continue;
    }

    if (c === '(') {
      tokens.push({ type: 'lparen', value: c, pos: i });
      i++;
      continue;
    }
    if (c === ')') {
      tokens.push({ type: 'rparen', value: c, pos: i });
      i++;
      continue;
    }
    if (c === ',') {
      tokens.push({ type: 'comma', value: c, pos: i });
      i++;
      continue;
    }

    // Liczba: 123 | 12.5 | 1e9 | 1.2e-3
    if (isDigit(c) || (c === '.' && isDigit(src.charAt(i + 1)))) {
      const start = i;
      while (isDigit(src.charAt(i))) i++;
      if (src.charAt(i) === '.') {
        i++;
        while (isDigit(src.charAt(i))) i++;
      }
      if (src.charAt(i) === 'e' || src.charAt(i) === 'E') {
        i++;
        if (src.charAt(i) === '+' || src.charAt(i) === '-') i++;
        if (!isDigit(src.charAt(i))) {
          throw new FormulaError('Niepoprawny wykladnik liczby.', start, src);
        }
        while (isDigit(src.charAt(i))) i++;
      }
      tokens.push({ type: 'num', value: src.slice(start, i), pos: start });
      continue;
    }

    // Identyfikator (z kropkowana sciezka): posiadane.odra1305, zasob.dewizy, flaga.nrd.stasi_zna
    if (isIdentStart(c)) {
      const start = i;
      i++;
      while (isIdentPart(src.charAt(i))) i++;
      // kolejne segmenty po kropce
      while (src.charAt(i) === '.' && isIdentStart(src.charAt(i + 1))) {
        i++; // kropka
        i++; // pierwszy znak segmentu
        while (isIdentPart(src.charAt(i))) i++;
      }
      tokens.push({ type: 'ident', value: src.slice(start, i), pos: start });
      continue;
    }

    // Operatory dwuznakowe przed jednoznakowymi
    const two = c + src.charAt(i + 1);
    if (TWO_CHAR_OPS.has(two)) {
      tokens.push({ type: 'op', value: two, pos: i });
      i += 2;
      continue;
    }
    if (c === '!' || c === '=') {
      // '!' i '=' istnieja tylko w '!=' / '==' (obsluzone wyzej) — samodzielnie sa bledne
      throw new FormulaError(`Nieoczekiwany znak '${c}'. Czy chodzilo o '${c}='?`, i, src);
    }
    if (ONE_CHAR_OPS.has(c)) {
      tokens.push({ type: 'op', value: c, pos: i });
      i++;
      continue;
    }

    throw new FormulaError(`Nieoczekiwany znak '${c}'.`, i, src);
  }

  tokens.push({ type: 'eof', value: '', pos: len });
  return tokens;
}
