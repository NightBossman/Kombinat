// present.ts — Pomocniki PREZENTACJI: opis efektow ulepszen po polsku oraz postep prostych celow
// ("Co dalej?"). Czysta warstwa do migawki — nie zmienia stanu.
import {
  D,
  Decimal,
  ZERO,
  formatNumber,
  parseFormula,
  pluralizePL,
  type ContentRegistry,
  type EffectDef,
  type EvalContext,
  type Node,
  type PluralFormsPL,
} from '@kombinat/shared';
import { effNum, parseTarget } from './effects';

function nameForms(name: string): PluralFormsPL {
  return { one: name, few: name, many: name, fractional: name };
}
function resForms(registry: ContentRegistry, id: string): PluralFormsPL {
  const def = registry.resources.get(id);
  return def?.plural ?? nameForms(def?.name ?? id);
}
function genName(registry: ContentRegistry, id: string): string {
  return registry.generators.get(id)?.name ?? id;
}

// Mnoznik -> przyrost procentowy: x2 => +100%, x1,25 => +25%, x1,5 => +50%.
function plusPct(value: Decimal): string {
  return `+${Math.round((value.toNumber() - 1) * 100)}%`;
}
// Dzielnik kosztu -> obnizka procentowa: /1,5 => -33%.
function cheaperPct(value: Decimal): string {
  const v = value.toNumber();
  if (v <= 0) return '';
  return `${Math.round((1 - 1 / v) * 100)}%`;
}

function describeOne(e: EffectDef, registry: ContentRegistry, ctx: EvalContext): string {
  const t = parseTarget(e.target);
  const val = effNum(e.value, ctx, ZERO);
  switch (e.type) {
    case 'multiplyProduction':
      if (t.kind === 'global') return `Cała produkcja ${plusPct(val)}`;
      if (t.kind === 'generator' && t.id) return `Produkcja ${genName(registry, t.id)} ${plusPct(val)}`;
      if (t.kind === 'resource' && t.id) return `Produkcja ${resForms(registry, t.id).many} ${plusPct(val)}`;
      return '';
    case 'multiplyCost':
      if (t.kind === 'global') return `Koszty ${plusPct(val)}`;
      if (t.kind === 'generator' && t.id) return `Koszt ${genName(registry, t.id)} ${plusPct(val)}`;
      return '';
    case 'divideCost':
      if (t.kind === 'global') return `Wszystko tańsze o ${cheaperPct(val)}`;
      if (t.kind === 'generator' && t.id) return `Koszt ${genName(registry, t.id)} −${cheaperPct(val)}`;
      return '';
    case 'addFlat':
      if (t.kind === 'global') return `Klikanie +${formatNumber(val)}`;
      if (t.kind === 'generator' && t.id) return `Produkcja ${genName(registry, t.id)} +${formatNumber(val)}/szt.`;
      return '';
    case 'grantResource': {
      const amt = effNum(e.amount, ctx, ZERO);
      const noun = t.id ? pluralizePL(amt.toNumber(), resForms(registry, t.id)) : '';
      return `+${formatNumber(amt)} ${noun}`.trim();
    }
    case 'startWith': {
      const cnt = e.value !== undefined ? effNum(e.value, ctx) : effNum(e.amount, ctx);
      if (t.kind === 'generator' && t.id) return `Start: ${formatNumber(cnt)}× ${genName(registry, t.id)}`;
      if (t.kind === 'resource' && t.id) {
        return `Start: ${formatNumber(cnt)} ${pluralizePL(cnt.toNumber(), resForms(registry, t.id))}`;
      }
      return 'Start z bonusem';
    }
    case 'enableMechanic':
      return 'Odblokowuje nową mechanikę';
    case 'diplomacyStep':
      return `Szybsze zacieśnianie relacji (+${formatNumber(effNum(e.value, ctx, ZERO))}/klik)`;
    case 'enableAchievementMultipliers':
      return 'Każde zdobyte osiągnięcie zaczyna mnożyć produkcję';
    case 'modifyRelation':
      return '';
    case 'setFlag':
      return '';
    default:
      return ''; // nigdy nie pokazujemy graczowi surowej nazwy typu efektu
  }
}

export function describeEffects(
  effects: EffectDef[] | undefined,
  registry: ContentRegistry,
  ctx: EvalContext,
): string {
  return (effects ?? [])
    .map((e) => describeOne(e, registry, ctx))
    .filter((s) => s.length > 0)
    .join(', ');
}

export interface ThresholdInfo {
  progress: number; // 0..1
  have: Decimal;
  need: Decimal;
}

// Cache sparsowanych formul — `thresholdProgress` wolane jest dla wielu osiagniec na migawke
// (uwaga #16: najblizsze osiagniecie). Parsowanie raz na formule, nie raz na klatke.
const parseCache = new Map<string, Node | null>();

/** Probuje odczytac postep prostego warunku "ref >= N" / "ref > N" (typowe unlock/trigger). */
export function thresholdProgress(src: string | undefined, ctx: EvalContext): ThresholdInfo | null {
  if (!src) return null;
  let node = parseCache.get(src);
  if (node === undefined) {
    try {
      node = parseFormula(src);
    } catch {
      node = null;
    }
    parseCache.set(src, node);
  }
  if (node === null) return null;
  if (node.kind !== 'binary' || (node.op !== '>=' && node.op !== '>')) return null;
  if (node.left.kind !== 'ref' || node.right.kind !== 'num') return null;
  const raw = ctx.resolve(node.left.path);
  const have = raw === undefined ? ZERO : typeof raw === 'number' ? D(raw) : typeof raw === 'boolean' ? (raw ? D(1) : ZERO) : raw;
  const need = D(node.right.value);
  if (need.lte(ZERO)) return null;
  const progress = Math.max(0, Math.min(1, have.div(need).toNumber()));
  return { progress, have, need };
}
