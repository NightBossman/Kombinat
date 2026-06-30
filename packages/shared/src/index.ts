// index.ts — Publiczne API wspoldzielonego modulu (JEDNO ZRODLO PRAWDY).
// Konsumowane przez gre (packages/game), a docelowo (Faza 5) takze przez Studio DLC.

export * from './num';
export * from './schema';
export * from './registry';
export * from './effects';
export * from './pack';
export * from './trust';
export * from './visual';
export {
  parseFormula,
  evalFormula,
  evalNumber,
  evalBool,
  tryParse,
  collectRefs,
  FormulaError,
} from './formula';
export type { Node, UnaryOp, BinaryOp, EvalContext, RefResolver, RefValue, RefInfo } from './formula';
