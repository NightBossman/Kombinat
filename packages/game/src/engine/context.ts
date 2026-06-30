// context.ts — Buduje kontekst ewaluacji formul (resolver odwolan) na podstawie stanu gry.
// Mapuje przestrzenie nazw z DLC rozdz. 6.3 na rzeczywisty stan. Kontrakt ma byc UCZCIWY: kazda
// przestrzen nazw z `FORMULA_NAMESPACES` zwraca realna wartosc, gdy odpowiednia mechanika juz istnieje
// (Faza 5A). `tempo` wymaga policzonego tempa produkcji — silnik wstrzykuje je przez `opts.tempo`
// (gdy brak, tempo=0, neutralnie). `doktryna`/`relacja` czyta wprost ze stanu.
import { ZERO, type EvalContext, type RefValue } from '@kombinat/shared';
import type { GameState } from './state';

export interface ContextOpts {
  /** Wartosc dla bezargumentowego `posiadane` (ile masz AKTUALNIE liczonego generatora). */
  currentGeneratorOwned?: RefValue;
  /** Biezaca produkcja/sek na zasob (dla `tempo.<zasob>`). Silnik podaje ostatnio policzone tempo;
   *  brak => `tempo.*` = 0. NIE wstrzykiwac w kontekstach liczenia produkcji (uniknac rekurencji). */
  tempo?: Record<string, RefValue>;
}

export function makeContext(state: GameState, opts: ContextOpts = {}): EvalContext {
  return {
    resolve(path: string): RefValue {
      if (path === 'posiadane') return opts.currentGeneratorOwned ?? ZERO;

      const dot = path.indexOf('.');
      const head = dot === -1 ? path : path.slice(0, dot);
      const tail = dot === -1 ? '' : path.slice(dot + 1);

      switch (head) {
        case 'posiadane':
          return state.generators[tail]?.owned ?? ZERO;
        case 'zasob':
          return state.resources[tail] ?? ZERO;
        case 'flaga':
          return state.flags[tail] ?? 0;
        case 'prestiz':
          if (tail === 'odznaczenia') return state.resources['odznaczenia'] ?? ZERO;
          if (tail === 'liczba') return state.stats.denominations;
          return 0;
        case 'osiagniecia':
          // tylko zdobyte sa w mapie (true) => liczba kluczy = liczba zdobytych
          return Object.keys(state.achievements).length;
        case 'licznik':
          // Liczniki unikalnych osiagniec (uwaga #22): seria_klikniec, tasma_seria, tasma_lacznie,
          // gielda_transakcje, zlote_klikniecia, seria_klikniec_max...
          return state.stats.counters[tail] ?? 0;
        case 'kadra':
          // liczba zwerbowanych postaci (do osiagniec typu „cala kadra")
          return Object.keys(state.characters).length;
        case 'maszyny':
          if (tail === 'rodzaje') {
            // ile RÓŻNYCH typów maszyn posiadasz (>=1 szt.)
            let n = 0;
            for (const g of Object.values(state.generators)) if (g.owned.gt(ZERO)) n += 1;
            return n;
          }
          return 0;
        case 'czas':
          if (tail === 'sesja') return state.stats.playTimeSec;
          if (tail === 'poraDnia') return new Date().getHours();
          return 0;
        case 'tempo':
          // Biezaca produkcja/sek danego zasobu (np. `tempo.cykle`). Wstrzykiwane przez silnik;
          // gdy nieobliczone (np. przed pierwszym tickiem) => 0.
          return opts.tempo?.[tail] ?? ZERO;
        case 'relacja':
          // Dyplomacja (Faza 4C): relacja z krajem = flaga `relacja.<id>` (0..max). Te same flagi
          // przesuwaja zdarzenia dyplomatyczne — jedno zrodlo prawdy.
          return state.flags['relacja.' + tail] ?? 0;
        case 'doktryna':
          // Zjazd PZPR (Faza 4B): `doktryna.aktywna` = 1, gdy obowiazuje JAKAS doktryna; `doktryna.<id>`
          // = 1, gdy obowiazuje wlasnie ta (inaczej 0). Pozwala DLC reagowac na wybrana linie partii.
          if (tail === 'aktywna') return state.doctrine ? 1 : 0;
          return state.doctrine === tail ? 1 : 0;
        default:
          return undefined;
      }
    },
  };
}
