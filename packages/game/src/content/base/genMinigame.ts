// genMinigame.ts — GENERATOR ulepszeń ZA GRANIE (inicjatywa „rozbudowa ulepszeń", faza U4;
// plan: docs/ULEPSZENIA.md). Trwałe ulepszenia odblokowywane GRANIEM w minigry/mechaniki — bramkowane
// licznikami, które gra już zlicza: Taśma (`licznik.tasma_lacznie`), Kantor (`licznik.gielda_transakcje`),
// Załatwianie (`licznik.lapowki`), Okazje (`licznik.zlote_klikniecia`). To wciąż DANE (UpgradeDef[]),
// walidowane i scalane tym samym loaderem; ID `rdzen.gm_*` (bez kolizji z `gu_`/`gt_`/ręcznymi).
import type { UpgradeDef, EffectDef } from '@kombinat/shared';

function numStr(n: number): string {
  if (n < 1e6 && Number.isInteger(n)) return String(n);
  const exp = Math.floor(Math.log10(n));
  return `${Number((n / 10 ** exp).toFixed(3))}e${exp}`;
}

interface FamCfg {
  tag: string;
  counter: string; // pełna ścieżka licznika, np. 'licznik.tasma_lacznie'
  thresholds: number[];
  costRes: string;
  costAt: (t: number) => number;
  flavor: string;
  names: string[];
  effect: (t: number) => EffectDef[];
}

const FAMS: FamCfg[] = [
  {
    tag: 'tasma',
    counter: 'licznik.tasma_lacznie',
    thresholds: [10, 25, 50, 100, 200, 350, 600, 1000],
    costRes: 'cykle',
    costAt: (t) => 1e5 * 4 ** t,
    flavor: 'Tyle wczytanych taśm robi z Ciebie wirtuoza głowicy. Cała produkcja idzie raźniej.',
    names: ['Wprawny magnetofon', 'Czuła głowica', 'Mistrz wczytywania', 'Bez błędu wczytywania', 'Złota taśma', 'Wirtuoz magnetofonu', 'Legenda kasety', 'Demoscena we krwi'],
    effect: () => [{ type: 'multiplyProduction', target: 'global', value: '1.12' }],
  },
  {
    tag: 'kantor',
    counter: 'licznik.gielda_transakcje',
    thresholds: [10, 25, 50, 100, 200, 350, 600, 1000],
    costRes: 'dewizy',
    costAt: (t) => 50 * 3 ** t,
    flavor: 'Tyle transakcji pod Forum — kurs czujesz nosem. Dewizy mnożą się szybciej.',
    names: ['Stały klient', 'Znajomy cinkciarz', 'Wyczucie kursu', 'Sieć kantorów', 'Hurtowy obrót', 'Rekin walutowy', 'Król Forum', 'Niewidzialna ręka kantoru'],
    effect: () => [{ type: 'multiplyProduction', target: 'resource:dewizy', value: '1.3' }],
  },
  {
    tag: 'zalat',
    counter: 'licznik.lapowki',
    thresholds: [5, 15, 30, 60, 120, 250, 500, 1000],
    costRes: 'dewizy',
    costAt: (t) => 80 * 3 ** t,
    flavor: 'Tyle załatwionych spraw to gęsta sieć dojść. Wszystko kosztuje mniej.',
    names: ['Znajomości', 'Dojścia', 'Plecy', 'Układ', 'Sieć przysług', 'Wszystko po znajomości', 'Mistrz załatwiania', 'Druga gospodarka'],
    effect: () => [{ type: 'divideCost', target: 'global', value: '1.12' }],
  },
  {
    tag: 'okazje',
    counter: 'licznik.zlote_klikniecia',
    thresholds: [3, 10, 25, 50, 100, 200],
    costRes: 'cykle',
    costAt: (t) => 5e5 * 5 ** t,
    flavor: 'Wyczuwasz, kiedy „rzucą towar". Ręka sama łapie okazję — i normę.',
    names: ['Czujne oko', 'Łowca okazji', 'Człowiek z talonami', 'Spod-ladowy zmysł', 'Król spod lady', 'Szósty zmysł'],
    effect: (t) => [{ type: 'addFlat', target: 'global', value: numStr(200 * 10 ** t) }],
  },
];

/** Wszystkie ulepszenia „za granie" (deterministyczne). */
export function buildMinigameUpgrades(): UpgradeDef[] {
  const out: UpgradeDef[] = [];
  for (const f of FAMS) {
    for (let t = 0; t < f.thresholds.length; t++) {
      out.push({
        id: `rdzen.gm_${f.tag}_${t}`,
        name: f.names[t]!,
        flavor: f.flavor,
        costResource: f.costRes,
        cost: numStr(Math.round(f.costAt(t))),
        unlock: `${f.counter} >= ${f.thresholds[t]}`,
        once: true,
        effects: f.effect(t),
      });
    }
  }
  return out;
}
