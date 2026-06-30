// genTree.ts — GENERATOR głębokich węzłów Dziedzictwa (inicjatywa „rozbudowa ulepszeń", faza U3;
// plan: docs/ULEPSZENIA.md). Każdy z 3 konarów (aparat/rd/rynek) dostaje długi „nieskończony" ogon
// węzłów ZAMGLONYCH (fogged) — odsłaniają się po kolei, gdy wykupisz poprzedni (łańcuch `requires`).
// Liczba POZIOMÓW rośnie w głąb (realizacja życzenia „coraz więcej poziomów"). To wciąż DANE
// (TreeNodeDef[]) — walidowane i scalane tym samym loaderem co reszta; ID `rdzen.gt_*` (bez kolizji z
// ręcznymi `rdzen.t_*`). Koszt w odznaczeniach rośnie ×1,7 na węzeł i ×2 na poziom (silnik) — grind.
import type { TreeNodeDef, EffectDef } from '@kombinat/shared';

function numStr(n: number): string {
  if (n < 1e6 && Number.isInteger(n)) return String(n);
  const exp = Math.floor(Math.log10(n));
  return `${Number((n / 10 ** exp).toFixed(3))}e${exp}`;
}

const COUNT = 14; // długość ogona każdego konaru

interface TailCfg {
  branch: string;
  from: string; // węzeł-zwornik, od którego startuje ogon
  tag: string;
  desc: string;
  names: string[];
  effect: (t: number) => EffectDef[];
}

const TAILS: TailCfg[] = [
  {
    branch: 'aparat',
    from: 'rdzen.t_order', // ogon aparatu zaczyna się PO wielkim finale „Order"
    tag: 'aparat',
    desc: 'Im głębiej w aparacie, tym sprawniej kręci się cała machina państwa.',
    names: ['Sekretariat', 'Komitet wojewódzki', 'Komitet centralny', 'Biuro Polityczne', 'Sekretarz generalny', 'Aparat doskonały', 'Państwo w państwie', 'Niewidzialna ręka aparatu', 'Wieczny aktyw', 'Czerwona arystokracja', 'Beton partyjny', 'Układ zamknięty', 'Trwałość systemu', 'Wieczny aparat'],
    effect: (t) => [{ type: 'multiplyProduction', target: 'global', value: t % 5 === 4 ? '1.3' : '1.15' }],
  },
  {
    branch: 'rd',
    from: 'rdzen.t_dolina',
    tag: 'rd',
    desc: 'Rodzima myśl techniczna pcha się w przyszłość — poziom po poziomie.',
    names: ['Instytut II stopnia', 'Politechnika', 'Polska Akademia Nauk', 'Program kosmiczny', 'Superkomputer', 'Sztuczny rozum', 'Krzemowa dolina nad Wisłą', 'Patent stulecia', 'Przełom technologiczny', 'Myśl nieujarzmiona', 'Technologia jutra', 'Osobliwość', 'Wieczny postęp', 'Nauka bez granic'],
    effect: (t) =>
      t % 2 === 0
        ? [{ type: 'multiplyProduction', target: 'global', value: '1.12' }, { type: 'multiplyProduction', target: 'generator:odra1305', value: '1.25' }]
        : [{ type: 'multiplyProduction', target: 'global', value: '1.12' }],
  },
  {
    branch: 'rynek',
    from: 'rdzen.t_offshore',
    tag: 'rynek',
    desc: 'Druga gospodarka ma kolejne dna. Kapitał pracuje sam na siebie.',
    names: ['Spółdzielnia', 'Joint venture', 'Koncern', 'Imperium handlowe', 'Bank prywatny', 'Parkiet giełdowy', 'Fundusz inwestycyjny', 'Kapitał obrotowy', 'Wielki kapitał', 'Magnat', 'Oligarcha', 'Niewidzialna ręka rynku', 'Wieczny zysk', 'Fortuna bez dna'],
    effect: (t) =>
      t % 2 === 0
        ? [{ type: 'multiplyProduction', target: 'resource:dewizy', value: '1.35' }, { type: 'multiplyProduction', target: 'global', value: '1.08' }]
        : [{ type: 'multiplyProduction', target: 'resource:dewizy', value: '1.35' }],
  },
];

function buildTail(cfg: TailCfg): TreeNodeDef[] {
  const out: TreeNodeDef[] = [];
  for (let t = 0; t < COUNT; t++) {
    const prev = t === 0 ? cfg.from : `rdzen.gt_${cfg.tag}_${t - 1}`;
    out.push({
      id: `rdzen.gt_${cfg.tag}_${t}`,
      name: cfg.names[t]!,
      description: cfg.desc,
      cost: numStr(Math.round(120 * 1.7 ** t)),
      requires: [prev],
      branch: cfg.branch,
      fogged: true, // odsłania się dopiero gdy poprzednik ma ≥1 poziom (czysty, „nieskończony" ogon)
      levels: Math.min(3 + Math.floor(t / 2), 12), // poziomy rosną w głąb
      kind: t % 5 === 4 ? 'keystone' : 'multiplier',
      effects: cfg.effect(t),
    });
  }
  return out;
}

/** Głębokie ogony wszystkich konarów (deterministyczne). Kolejność: aparat → rd → rynek. */
export function buildGeneratedTree(): TreeNodeDef[] {
  return TAILS.flatMap(buildTail);
}
