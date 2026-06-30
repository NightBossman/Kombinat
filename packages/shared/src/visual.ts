// visual.ts — Faza 5D: tożsamość wizualna paczek (PLAN 3.5, DLC §9). Treść DLC jest mechanicznie wpięta
// BEZ SZWU, ale wizualnie ROZPOZNAWALNA (subtelnie). Paczka deklaruje akcent w manifeście (`visualIdentity`),
// a silnik NAKŁADA go automatycznie na całą jej treść — zero ręcznego dłubania w stylach per paczka.
// Ranga zaufania (Faza 5C) niesie dodatkową sygnaturę: oficjalne ≠ społecznościowe.
import type { ContentRegistry } from './pack';
import type { TrustTier } from './trust';

export interface PackVisual {
  /** Paczka-źródło elementu. */
  packId: string;
  /** Kolor akcentu (z manifestu) — UI używa go jako zmiennej CSS (krawędź/poświata/pieczęć). */
  accentColor?: string;
  /** Ikona-pieczęć paczki (nazwa/identyfikator grafiki), jeśli zadeklarowana. */
  icon?: string | null;
  /** Czy paczka jest OFICJALNA (podpis zweryfikowany — Faza 5C). Inna pieczęć niż społecznościowa. */
  official: boolean;
}

/** Tożsamość wizualna dla danego elementu treści (po jego id). Zwraca null, gdy element pochodzi z paczki
 *  BEZ tożsamości wizualnej (np. rdzeń) — wtedy UI nie nakłada żadnego akcentu („bez szwu").
 *  `trustByPack` (opcjonalne) mapuje id paczki → stopień zaufania; brak/poniżej 'official' = społecznościowa. */
export function resolveVisualIdentity(
  reg: ContentRegistry,
  contentId: string,
  trustByPack?: Map<string, TrustTier>,
): PackVisual | null {
  const packId = reg.packOf.get(contentId);
  if (!packId) return null;
  const vi = reg.visualIdentities.get(packId);
  if (!vi) return null; // paczka bez sygnatury wizualnej (rdzeń) — treść wygląda natywnie
  return {
    packId,
    accentColor: vi.accentColor,
    icon: vi.icon,
    official: trustByPack?.get(packId) === 'official',
  };
}
