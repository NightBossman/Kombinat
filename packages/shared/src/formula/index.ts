// index.ts — Publiczne API mini-jezyka formul. Parsowanie z cache + ewaluacja.
import { Decimal } from '../num';
import type { Node } from './ast';
import { tokenize } from './lexer';
import { parse } from './parser';
import { evaluate, toBool, toDec } from './evaluator';
import type { EvalContext } from './evaluator';

export type { Node, UnaryOp, BinaryOp } from './ast';
export { FormulaError } from './ast';
export type { EvalContext, RefResolver, RefValue } from './evaluator';
export { collectRefs } from './refs';
export type { RefInfo } from './refs';

// Cache skompilowanych formul — ten sam tekst parsujemy raz (formuly powtarzaja sie miedzy tickami).
const cache = new Map<string, Node>();

export function parseFormula(src: string): Node {
  const cached = cache.get(src);
  if (cached) return cached;
  const node = parse(tokenize(src), src);
  cache.set(src, node);
  return node;
}

function asNode(src: string | Node): Node {
  return typeof src === 'string' ? parseFormula(src) : src;
}

/** Ewaluacja ogolna: zwraca Decimal albo boolean (zaleznie od formuly). */
export function evalFormula(src: string | Node, ctx: EvalContext): Decimal | boolean {
  return evaluate(asNode(src), ctx);
}

/** Ewaluacja liczbowa: wynik zawsze jako Decimal (koszty, produkcja, value). */
export function evalNumber(src: string | Node, ctx: EvalContext): Decimal {
  return toDec(evaluate(asNode(src), ctx));
}

/** Ewaluacja logiczna: wynik zawsze jako boolean (unlock, trigger, condition). */
export function evalBool(src: string | Node, ctx: EvalContext): boolean {
  return toBool(evaluate(asNode(src), ctx));
}

/** Sprawdza poprawnosc skladniowa formuly; zwraca FormulaError albo null (dla walidacji). */
export function tryParse(src: string): { ok: true; node: Node } | { ok: false; error: unknown } {
  try {
    return { ok: true, node: parseFormula(src) };
  } catch (error) {
    return { ok: false, error };
  }
}
