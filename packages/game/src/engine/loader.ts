// loader.ts — Data-driven ladowanie tresci (PLAN 3). Nawet tresc bazowa przechodzi tym samym
// szlakiem co DLC: walidacja wzgledem schematu -> deterministyczne scalanie w rejestr.
import { buildRegistry, validatePack, type ContentRegistry, type Pack, type ValidationIssue } from '@kombinat/shared';

export interface LoadResult {
  registry: ContentRegistry;
  issues: ValidationIssue[];
  ok: boolean;
}

/** Przyjmuje surowe paczki (obiekty), waliduje i scala. To wspolny seam dla rdzenia i DLC. */
export function loadContent(rawPacks: unknown[]): LoadResult {
  const issues: ValidationIssue[] = [];
  const packs: Pack[] = [];
  for (const raw of rawPacks) {
    const res = validatePack(raw);
    issues.push(...res.issues);
    if (res.pack) packs.push(res.pack);
  }
  const built = buildRegistry(packs);
  issues.push(...built.issues);
  const ok = !issues.some((i) => i.level === 'error');
  return { registry: built.registry, issues, ok };
}
