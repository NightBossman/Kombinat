// parser.ts — Parser wspinajacy sie po priorytetach (precedence climbing) -> AST.
// Priorytet (wieksza liczba wiaze mocniej):
//   or(1) < and(2) < porownania(3) < +/-(4) < * / %(5) < ^(6, prawostronny)
// Prefiksy: `not` (operand >= porownania), unarne -/+ (operand >= potega).
import type { BinaryOp, Node } from './ast';
import { FormulaError } from './ast';
import type { Token } from './lexer';

interface BinInfo {
  prec: number;
  right?: boolean;
}

const BINPREC: Record<string, BinInfo> = {
  or: { prec: 1 },
  and: { prec: 2 },
  '==': { prec: 3 },
  '!=': { prec: 3 },
  '<': { prec: 3 },
  '<=': { prec: 3 },
  '>': { prec: 3 },
  '>=': { prec: 3 },
  '+': { prec: 4 },
  '-': { prec: 4 },
  '*': { prec: 5 },
  '/': { prec: 5 },
  '%': { prec: 5 },
  '^': { prec: 6, right: true },
};

const NOT_OPERAND_PREC = 3; // `not` obejmuje porownania w dol
const UNARY_OPERAND_PREC = 6; // unarne -/+ wiaze mocniej niz * ale luzniej niz ^

class Parser {
  private pos = 0;
  constructor(
    private readonly tokens: Token[],
    private readonly src: string,
  ) {}

  private peek(): Token {
    return this.tokens[this.pos] ?? { type: 'eof', value: '', pos: this.src.length };
  }
  private next(): Token {
    const t = this.peek();
    this.pos++;
    return t;
  }
  private err(msg: string, at?: number): never {
    throw new FormulaError(msg, at ?? this.peek().pos, this.src);
  }

  /** Zwraca operator binarny dla biezacego tokenu albo null. */
  private binaryOp(): BinaryOp | null {
    const t = this.peek();
    if (t.type === 'op' && t.value in BINPREC) return t.value as BinaryOp;
    if (t.type === 'ident' && (t.value === 'and' || t.value === 'or')) return t.value;
    return null;
  }

  /** Parsuje cale wyrazenie i upewnia sie, ze nic nie zostalo. */
  parseProgram(): Node {
    const node = this.parseExpr(0);
    const rest = this.peek();
    if (rest.type !== 'eof') {
      this.err(`Nadmiarowy token '${rest.value}' po koncu wyrazenia.`, rest.pos);
    }
    return node;
  }

  parseExpr(minPrec: number): Node {
    let left = this.parsePrefix();
    for (;;) {
      const op = this.binaryOp();
      if (op === null) break;
      const info = BINPREC[op];
      if (!info || info.prec < minPrec) break;
      this.next(); // skonsumuj operator
      const nextMin = info.right ? info.prec : info.prec + 1;
      const right = this.parseExpr(nextMin);
      left = { kind: 'binary', op, left, right };
    }
    return left;
  }

  private parsePrefix(): Node {
    const t = this.peek();
    if (t.type === 'op' && (t.value === '-' || t.value === '+')) {
      this.next();
      const arg = this.parseExpr(UNARY_OPERAND_PREC);
      return { kind: 'unary', op: t.value === '-' ? 'neg' : 'pos', arg };
    }
    if (t.type === 'ident' && t.value === 'not') {
      this.next();
      const arg = this.parseExpr(NOT_OPERAND_PREC);
      return { kind: 'unary', op: 'not', arg };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): Node {
    const t = this.next();
    switch (t.type) {
      case 'num':
        return { kind: 'num', value: Number(t.value) };
      case 'lparen': {
        const e = this.parseExpr(0);
        const close = this.next();
        if (close.type !== 'rparen') this.err('Brak zamykajacego nawiasu ")".', close.pos);
        return e;
      }
      case 'ident': {
        if (t.value === 'true') return { kind: 'bool', value: true };
        if (t.value === 'false') return { kind: 'bool', value: false };
        if (this.peek().type === 'lparen') {
          // wywolanie funkcji
          this.next(); // (
          const args: Node[] = [];
          if (this.peek().type !== 'rparen') {
            args.push(this.parseExpr(0));
            while (this.peek().type === 'comma') {
              this.next();
              args.push(this.parseExpr(0));
            }
          }
          const close = this.next();
          if (close.type !== 'rparen') {
            this.err(`Brak ")" w wywolaniu funkcji '${t.value}'.`, close.pos);
          }
          return { kind: 'call', name: t.value, args };
        }
        return { kind: 'ref', path: t.value };
      }
      default:
        return this.err(
          t.type === 'eof' ? 'Nieoczekiwany koniec formuly.' : `Nieoczekiwany token '${t.value}'.`,
          t.pos,
        );
    }
  }
}

export function parse(tokens: Token[], src: string): Node {
  return new Parser(tokens, src).parseProgram();
}
