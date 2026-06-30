// ast.ts — Wezly drzewa skladniowego mini-jezyka formul i typ bledu.
// Mini-jezyk jest WASKI i BEZPIECZNY (DLC rozdz. 6): liczy liczbe albo wartosc logiczna z odczytu
// stanu gry. Zero dostepu do DOM/sieci/plikow, zero petli i przypisan — wiec tresc DLC nie moze
// uruchomic obcego kodu.

export type UnaryOp = 'neg' | 'pos' | 'not';

export type BinaryOp =
  | '+'
  | '-'
  | '*'
  | '/'
  | '%'
  | '^'
  | '<'
  | '<='
  | '>'
  | '>='
  | '=='
  | '!='
  | 'and'
  | 'or';

export type Node =
  | { kind: 'num'; value: number }
  | { kind: 'bool'; value: boolean }
  | { kind: 'ref'; path: string }
  | { kind: 'unary'; op: UnaryOp; arg: Node }
  | { kind: 'binary'; op: BinaryOp; left: Node; right: Node }
  | { kind: 'call'; name: string; args: Node[] };

/** Blad parsowania/tokenizacji formuly. `pos` = przesuniecie znakowe w `source` (dla Studia). */
export class FormulaError extends Error {
  readonly pos: number;
  readonly source: string;
  constructor(message: string, pos: number, source: string) {
    super(message);
    this.name = 'FormulaError';
    this.pos = pos;
    this.source = source;
  }
}
