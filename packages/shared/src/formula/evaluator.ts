// evaluator.ts — Ewaluacja AST wzgledem stanu gry. Czysty spacer po drzewie (bez eval/Function).
// Wynikiem jest Decimal (wartosc liczbowa) albo boolean (wartosc logiczna).
import type { BinaryOp, Node } from './ast';
import { FormulaError } from './ast';
import { D, decimalMod, Decimal, ONE, ZERO } from '../num';

/** Wartosc zwracana przez resolver stanu. `undefined` => traktowane jak 0/nieustawione. */
export type RefValue = Decimal | number | boolean | undefined;
export type RefResolver = (path: string) => RefValue;

export interface EvalContext {
  resolve: RefResolver;
}

function toDec(v: Decimal | boolean): Decimal {
  if (typeof v === 'boolean') return v ? ONE : ZERO;
  return v;
}
function toBool(v: Decimal | boolean): boolean {
  if (typeof v === 'boolean') return v;
  return !v.eq(ZERO);
}
function resolveValue(v: RefValue): Decimal | boolean {
  if (v === undefined) return ZERO;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return D(v);
  return v;
}

function callFunction(name: string, args: Decimal[], node: Node): Decimal {
  const a0 = args[0];
  switch (name) {
    case 'min':
      if (args.length === 0) throw fnArityErr(name, node);
      return args.reduce((acc, x) => Decimal.min(acc, x));
    case 'max':
      if (args.length === 0) throw fnArityErr(name, node);
      return args.reduce((acc, x) => Decimal.max(acc, x));
    case 'floor':
      return need(a0, name, node).floor();
    case 'ceil':
      return need(a0, name, node).ceil();
    case 'round':
      return need(a0, name, node).round();
    case 'abs':
      return need(a0, name, node).abs();
    case 'sqrt':
      return need(a0, name, node).sqrt();
    case 'log':
      // break_infinity: ln()/log10() zwracaja number (log wielkiej liczby miesci sie w float64).
      return D(need(a0, name, node).ln());
    case 'log10':
      return D(need(a0, name, node).log10());
    case 'pow': {
      const base = need(a0, name, node);
      const exp = args[1];
      if (exp === undefined) throw fnArityErr(name, node);
      return base.pow(exp);
    }
    default:
      throw new FormulaError(`Nieznana funkcja '${name}'.`, 0, name);
  }
}

function need(x: Decimal | undefined, fn: string, node: Node): Decimal {
  if (x === undefined) throw fnArityErr(fn, node);
  return x;
}
function fnArityErr(fn: string, _node: Node): FormulaError {
  return new FormulaError(`Funkcja '${fn}' dostala zla liczbe argumentow.`, 0, fn);
}

export function evaluate(node: Node, ctx: EvalContext): Decimal | boolean {
  switch (node.kind) {
    case 'num':
      return D(node.value);
    case 'bool':
      return node.value;
    case 'ref':
      return resolveValue(ctx.resolve(node.path));
    case 'unary': {
      if (node.op === 'not') return !toBool(evaluate(node.arg, ctx));
      const v = toDec(evaluate(node.arg, ctx));
      return node.op === 'neg' ? v.neg() : v;
    }
    case 'binary':
      return evalBinary(node.op, node.left, node.right, ctx);
    case 'call': {
      const args = node.args.map((a) => toDec(evaluate(a, ctx)));
      return callFunction(node.name, args, node);
    }
  }
}

function evalBinary(
  op: BinaryOp,
  leftNode: Node,
  rightNode: Node,
  ctx: EvalContext,
): Decimal | boolean {
  // Logika z krotkim spiekiem — prawy operand liczony tylko gdy trzeba.
  if (op === 'and') {
    return toBool(evaluate(leftNode, ctx)) ? toBool(evaluate(rightNode, ctx)) : false;
  }
  if (op === 'or') {
    return toBool(evaluate(leftNode, ctx)) ? true : toBool(evaluate(rightNode, ctx));
  }

  const lv = evaluate(leftNode, ctx);
  const rv = evaluate(rightNode, ctx);

  switch (op) {
    case '==':
      if (typeof lv === 'boolean' || typeof rv === 'boolean') return toBool(lv) === toBool(rv);
      return lv.eq(rv);
    case '!=':
      if (typeof lv === 'boolean' || typeof rv === 'boolean') return toBool(lv) !== toBool(rv);
      return !lv.eq(rv);
  }

  const a = toDec(lv);
  const b = toDec(rv);
  switch (op) {
    case '+':
      return a.add(b);
    case '-':
      return a.sub(b);
    case '*':
      return a.mul(b);
    case '/':
      return b.eq(ZERO) ? ZERO : a.div(b);
    case '%':
      return b.eq(ZERO) ? ZERO : decimalMod(a, b);
    case '^':
      return a.pow(b);
    case '<':
      return a.lt(b);
    case '<=':
      return a.lte(b);
    case '>':
      return a.gt(b);
    case '>=':
      return a.gte(b);
    default:
      // 'and' | 'or' | '==' | '!=' obsluzono wczesniej — tu nieosiagalne.
      throw new FormulaError(`Nieobslugiwany operator '${op}'.`, 0, op);
  }
}

export { toBool, toDec };
