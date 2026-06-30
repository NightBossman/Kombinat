// effects.ts — Slownik PRYMITYWOW EFEKTOW (DLC rozdz. 7). Autorytatywna lista tego, co tresc moze
// "zrobic". Studio (Faza 5) odrzuca efekt spoza tego slownika z czytelnym komunikatem; silnik
// implementuje podzbior i rozszerza go fazami. To rejestr kontraktu, nie implementacja.

export type EffectTargetKind =
  | 'global'
  | 'resource'
  | 'generator'
  | 'upgrade'
  | 'event'
  | 'treeNode'
  | 'mechanic';

export interface EffectSpec {
  type: string;
  /** Pola wymagane poza `type` (do walidacji w Studiu). */
  fields: string[];
  /** Dozwolone rodzaje `target` (jesli efekt celuje w cos). */
  targetKinds?: EffectTargetKind[];
  summary: string;
  /** Czy silnik Fazy 0 juz to implementuje (reszta dochodzi w kolejnych fazach). */
  implementedInPhase0?: boolean;
}

export const EFFECTS: Record<string, EffectSpec> = {
  multiplyProduction: {
    type: 'multiplyProduction',
    fields: ['target', 'value'],
    targetKinds: ['global', 'resource', 'generator'],
    summary: 'Mnoży produkcję (globalnie / zasób / generator).',
    implementedInPhase0: true,
  },
  multiplyCost: {
    type: 'multiplyCost',
    fields: ['target', 'value'],
    targetKinds: ['global', 'resource', 'generator'],
    summary: 'Mnoży koszt (drożej).',
    implementedInPhase0: true,
  },
  divideCost: {
    type: 'divideCost',
    fields: ['target', 'value'],
    targetKinds: ['global', 'resource', 'generator'],
    summary: 'Dzieli koszt (taniej).',
    implementedInPhase0: true,
  },
  addFlat: {
    type: 'addFlat',
    fields: ['target', 'value'],
    targetKinds: ['global', 'resource', 'generator'],
    summary: 'Dodaje stałą wartość do produkcji celu.',
    implementedInPhase0: true,
  },
  grantResource: {
    type: 'grantResource',
    fields: ['target', 'amount'],
    targetKinds: ['resource'],
    summary: 'Jednorazowo dodaje zasób.',
    implementedInPhase0: true,
  },
  unlock: {
    type: 'unlock',
    fields: ['target'],
    targetKinds: ['generator', 'upgrade', 'event', 'treeNode'],
    summary: 'Odsłania / uaktywnia wskazaną treść.',
  },
  setFlag: {
    type: 'setFlag',
    fields: ['flag', 'value'],
    summary: 'Ustawia flagę logiczną.',
    implementedInPhase0: true,
  },
  modifyRelation: {
    type: 'modifyRelation',
    fields: ['country', 'delta'],
    summary: 'Zmienia relację dyplomatyczną.',
  },
  triggerEvent: {
    type: 'triggerEvent',
    fields: ['event'],
    summary: 'Odpala zdarzenie (do łańcuchów).',
  },
  enableMechanic: {
    type: 'enableMechanic',
    fields: ['mechanic'],
    summary: 'Włącza mechanikę gry (zwykle węzeł drzewa „otwierający bank").',
  },
  enableAchievementMultipliers: {
    type: 'enableAchievementMultipliers',
    fields: [],
    summary: 'Aktywuje mnożniki z osiągnięć (specjalny węzeł drzewa).',
  },
  startWith: {
    type: 'startWith',
    fields: ['target'],
    targetKinds: ['generator', 'upgrade', 'resource'],
    summary: 'Przy starcie nowej rozgrywki gracz ma już daną treść / zasób.',
  },
  diplomacyStep: {
    type: 'diplomacyStep',
    fields: ['value'],
    summary: 'Zwiększa krok zacieśniania relacji w dyplomacji (na poziom węzła drzewa).',
  },
};

export function isKnownEffect(type: string): boolean {
  return Object.prototype.hasOwnProperty.call(EFFECTS, type);
}
