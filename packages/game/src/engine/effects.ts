// effects.ts — Silnik EFEKTOW: zbiera modyfikatory z kupionych ulepszen, kamieni milowych i wezlow
// drzewa, i wystawia je dla obliczen produkcji/kosztu (slownik efektow z DLC rozdz. 7). Wartosci
// (value/amount/delta) moga byc formula (tekst) albo liczba — `effNum` to ujednolica.
import { D, ONE, ZERO, evalBool, evalNumber, type ContentRegistry, type EffectDef, type EvalContext } from '@kombinat/shared';
import { Decimal } from '@kombinat/shared';
import { makeContext } from './context';
import type { GameState } from './state';

// Bonus do produkcji cykli za KAŻDE posiadane odznaczenie (uwaga #15). 0,2% = sensowna skala:
// 10 odznaczeń → +2%, 100 → +20%, 500 → +100%. Rośnie z prestiżem, ale nie wybucha.
export const ODZNACZENIE_BONUS = 0.002;

export interface Modifiers {
  prodGlobalMul: Decimal;
  prodGenMul: Map<string, Decimal>;
  prodResMul: Map<string, Decimal>;
  prodGenAdd: Map<string, Decimal>;
  costGlobalMul: Decimal;
  costGenMul: Map<string, Decimal>;
  /** Plaski dodatek do mocy klikania. */
  clickFlatAdd: Decimal;
}

export function emptyModifiers(): Modifiers {
  return {
    prodGlobalMul: ONE,
    prodGenMul: new Map(),
    prodResMul: new Map(),
    prodGenAdd: new Map(),
    costGlobalMul: ONE,
    costGenMul: new Map(),
    clickFlatAdd: ZERO,
  };
}

/** Ujednolica wartosc efektu (formula-tekst | liczba | brak) do Decimal. */
export function effNum(v: EffectDef['value'], ctx: EvalContext, def: Decimal = ZERO): Decimal {
  if (typeof v === 'number') return D(v);
  if (typeof v === 'string') return evalNumber(v, ctx);
  return def;
}

function mulInto(map: Map<string, Decimal>, key: string, v: Decimal): void {
  map.set(key, (map.get(key) ?? ONE).mul(v));
}
function addInto(map: Map<string, Decimal>, key: string, v: Decimal): void {
  map.set(key, (map.get(key) ?? ZERO).add(v));
}

export interface TargetRef {
  kind: string;
  id?: string;
}
export function parseTarget(target?: string): TargetRef {
  if (!target || target === 'global') return { kind: 'global' };
  const i = target.indexOf(':');
  if (i === -1) return { kind: target };
  return { kind: target.slice(0, i), id: target.slice(i + 1) };
}

function applyEffect(mods: Modifiers, effect: EffectDef, ctx: EvalContext): void {
  // Efekt warunkowy (Faza 5B) — opcjonalna `condition` (formuła logiczna). Gdy fałszywa, efekt nie
  // wchodzi. Pozwala DLC „pomnożyć produkcję X, JEŚLI Y" (DLC 8.2) — także w synergiach między paczkami.
  if (typeof effect.condition === 'string' && !evalBool(effect.condition, ctx)) return;
  const t = parseTarget(effect.target);
  const val = effNum(effect.value, ctx, ONE);
  switch (effect.type) {
    case 'multiplyProduction':
      if (t.kind === 'global') mods.prodGlobalMul = mods.prodGlobalMul.mul(val);
      else if (t.kind === 'generator' && t.id) mulInto(mods.prodGenMul, t.id, val);
      else if (t.kind === 'resource' && t.id) mulInto(mods.prodResMul, t.id, val);
      break;
    case 'multiplyCost':
      if (t.kind === 'global') mods.costGlobalMul = mods.costGlobalMul.mul(val);
      else if (t.kind === 'generator' && t.id) mulInto(mods.costGenMul, t.id, val);
      break;
    case 'divideCost':
      if (val.eq(ZERO)) break;
      if (t.kind === 'global') mods.costGlobalMul = mods.costGlobalMul.div(val);
      else if (t.kind === 'generator' && t.id) mulInto(mods.costGenMul, t.id, ONE.div(val));
      break;
    case 'addFlat':
      if (t.kind === 'global') mods.clickFlatAdd = mods.clickFlatAdd.add(val);
      else if (t.kind === 'generator' && t.id) addInto(mods.prodGenAdd, t.id, val);
      break;
    // grantResource / setFlag / modifyRelation / unlock — jednorazowe/sterujace (applyImmediateEffects)
  }
}

/** Przelicza modyfikatory z aktualnego stanu (ulepszenia + kamienie milowe + wezly drzewa). */
export function computeModifiers(registry: ContentRegistry, state: GameState): Modifiers {
  const mods = emptyModifiers();
  const ctx = makeContext(state);

  for (const [id, def] of registry.upgrades) {
    if (state.upgrades[id]) for (const e of def.effects ?? []) applyEffect(mods, e, ctx);
  }
  for (const [id, def] of registry.milestones) {
    if (state.milestones[id]) for (const e of def.effects ?? []) applyEffect(mods, e, ctx);
  }
  // Wezly drzewa dziedzictwa — TRWALE (przezywaja Denominacje). Efekty stosowane RAZ NA POZIOM
  // (wielopoziomowe wezly mnoza/dodaja swoj efekt tyle razy, ile maja poziomow — uwaga #3).
  for (const [id, def] of registry.treeNodes) {
    const lvl = state.treeNodes[id] ?? 0;
    for (let k = 0; k < lvl; k++) for (const e of def.effects ?? []) applyEffect(mods, e, ctx);
  }
  // Zwerbowana kadra — pasywne bonusy (per-rozgrywka).
  for (const [id, def] of registry.characters) {
    if (state.characters[id]) for (const e of def.passive ?? []) applyEffect(mods, e, ctx);
  }
  // Każde posiadane odznaczenie lekko podbija produkcję cykli (uwaga #15).
  const odz = state.resources['odznaczenia'] ?? ZERO;
  if (odz.gt(ZERO)) mulInto(mods.prodResMul, 'cykle', ONE.add(odz.mul(ODZNACZENIE_BONUS)));
  // Mnozniki z osiagniec — aktywne dopiero po wezle drzewa (enableAchievementMultipliers); retroaktywnie.
  if (state.flags['osiagniecia_mnoznik']) {
    for (const [id, a] of registry.achievements) {
      if (state.achievements[id] && a.multiplier) {
        mods.prodGlobalMul = mods.prodGlobalMul.mul(effNum(a.multiplier, ctx, ONE));
      }
    }
  }
  // Synergie między paczkami (Faza 5B, DLC 8.3) — efekty aktywne TYLKO gdy obecna jest wymagana paczka.
  // Łagodna degradacja: bez tamtej paczki po prostu nie ma bonusu (paczka-dawca działa samodzielnie).
  if (registry.synergies.length > 0) {
    const loaded = new Set(registry.packs.map((p) => p.id));
    for (const syn of registry.synergies) {
      if (!loaded.has(syn.requiresPack)) continue;
      for (const e of syn.effects) applyEffect(mods, e, ctx);
    }
  }
  // Doktryna ze Zjazdu PZPR (Faza 4B) — TRWALE modyfikatory na cala biezaca pieciolatke (rozgrywke).
  if (state.doctrine) {
    const dok = registry.doctrines.get(state.doctrine);
    if (dok) for (const e of dok.effects) applyEffect(mods, e, ctx);
  }
  // Kryzys zadluzenia (bust po gierkowskim boomie kredytowym) — dol produkcji do konca pieciolatki.
  if (state.flags['kryzys']) mods.prodGlobalMul = mods.prodGlobalMul.mul(0.4);
  // Dyplomacja blokow (Faza 4C) — relacja z krajem przesuwa ceny/produkcje/dewizy; bonus rosnie z relacja.
  for (const [id, c] of registry.diplomacy) {
    const rel = Math.max(0, state.flags['relacja.' + id] ?? 0);
    if (rel <= 0) continue;
    const factor = rel * c.perPoint;
    if (c.scope === 'cost') mods.costGlobalMul = mods.costGlobalMul.mul(Math.max(0.1, 1 - factor)); // tansze wklady
    else if (c.scope === 'prod') mods.prodGlobalMul = mods.prodGlobalMul.mul(1 + factor);
    else if (c.scope === 'dewizy') mulInto(mods.prodResMul, 'dewizy', ONE.add(D(factor)));
  }
  return mods;
}

/** Efekty natychmiastowe (kupno/wyzwolenie/decyzja w zdarzeniu): zasob, flaga, relacja, mechanika. */
export function applyImmediateEffects(state: GameState, effects: EffectDef[] | undefined): void {
  if (!effects) return;
  const ctx = makeContext(state);
  for (const e of effects) {
    if (e.type === 'grantResource') {
      const t = parseTarget(e.target);
      if (t.kind === 'resource' && t.id) {
        const next = (state.resources[t.id] ?? ZERO).add(effNum(e.amount, ctx));
        state.resources[t.id] = next.lt(ZERO) ? ZERO : next; // zasob nie schodzi ponizej zera
      }
    } else if (e.type === 'setFlag' && typeof e.flag === 'string') {
      state.flags[e.flag] = e.value === undefined ? 1 : effNum(e.value, ctx, ONE).toNumber();
    } else if (e.type === 'modifyRelation' && typeof e.country === 'string') {
      const key = 'relacja.' + e.country;
      state.flags[key] = (state.flags[key] ?? 0) + effNum(e.delta, ctx).toNumber();
    } else if (e.type === 'enableAchievementMultipliers') {
      state.flags['osiagniecia_mnoznik'] = 1;
    } else if (e.type === 'enableMechanic' && typeof e.mechanic === 'string') {
      // Mechaniki (gielda/lapowki/dyplomacja...) dochodza w kolejnych podfazach; tu zapis flagi.
      state.flags['mechanika.' + e.mechanic] = 1;
    }
  }
}

/** Stosuje efekty `startWith` z kupionych wezlow drzewa — przy STARCIE rozgrywki (po Denominacji). */
export function applyStartWith(state: GameState, registry: ContentRegistry): void {
  const ctx = makeContext(state);
  for (const [id, def] of registry.treeNodes) {
    const lvl = state.treeNodes[id] ?? 0;
    if (lvl <= 0) continue;
    for (const e of def.effects ?? []) {
      if (e.type !== 'startWith') continue;
      const t = parseTarget(e.target);
      const base = e.value !== undefined ? effNum(e.value, ctx) : effNum(e.amount, ctx);
      const amt = base.mul(lvl); // wiecej poziomow = wiekszy bonus startowy (uwaga #3)
      if (t.kind === 'generator' && t.id && state.generators[t.id]) {
        if (amt.gt(state.generators[t.id]!.owned)) state.generators[t.id] = { owned: amt };
      } else if (t.kind === 'resource' && t.id) {
        if (amt.gt(state.resources[t.id] ?? ZERO)) state.resources[t.id] = amt;
      }
    }
  }
}

// --- akcesory uzywane przez silnik ---
export function genProdMul(mods: Modifiers, genId: string, outputResource: string): Decimal {
  return mods.prodGlobalMul
    .mul(mods.prodGenMul.get(genId) ?? ONE)
    .mul(mods.prodResMul.get(outputResource) ?? ONE);
}
export function genProdAdd(mods: Modifiers, genId: string): Decimal {
  return mods.prodGenAdd.get(genId) ?? ZERO;
}
export function genCostMul(mods: Modifiers, genId: string): Decimal {
  return mods.costGlobalMul.mul(mods.costGenMul.get(genId) ?? ONE);
}
