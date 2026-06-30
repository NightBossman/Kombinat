// log.ts — drobny pomocnik logów z TWARDYM limitem (rotacja pamięci, PLAN 14/16). Czysty i testowalny.

/** Dopisuje wpis i utrzymuje twardy limit: gdy przekroczony, najstarsze wypadają. */
export function pushCapped<T>(arr: readonly T[], entry: T, max: number): T[] {
  const next = [...arr, entry];
  return next.length > max ? next.slice(next.length - max) : next;
}
