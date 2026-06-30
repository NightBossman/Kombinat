// genUpgrades.ts — GENERATOR ulepszeń (inicjatywa „rozbudowa ulepszeń"; plan: docs/ULEPSZENIA.md).
// Jak `buildAchievements()` — produkuje DANE (UpgradeDef[]) walidowane i scalane tym samym loaderem co
// reszta treści (rdzeń = konsument formatu DLC; ZERO specjalnego kodu silnika). Nie tysiąc ręcznych wpisów
// ani bezduszne „+1% #4837": RODZINY z pulami klimatycznych nazw PRL, krzywą kosztu i bramkowaniem
// progresją, tak by w każdej fazie gry było „co dalej kupić". ID generowane: `rdzen.gu_*` (bez kolizji z
// ręcznymi `rdzen.u_*`). Liczby STARTOWE (PLAN 20) — do strojenia na żywo.
//   U1 = pierwsza fala dowodowa. U2 = pełna fala główna: głębsze drabiny + rodzina „filar" (posiadanie
//   maszyny daje bonus GLOBALNY) + dłuższe drabiny globalne/koszty/klik/dewizy.
import type { UpgradeDef } from '@kombinat/shared';

/** Liczba → tekst przyjazny formule (bez „e+", który mógłby nie przejść lexera). */
function numStr(n: number): string {
  if (n < 1e6 && Number.isInteger(n)) return String(n);
  const exp = Math.floor(Math.log10(n));
  const mant = Number((n / 10 ** exp).toFixed(3));
  return `${mant}e${exp}`;
}

const mulGen = (gen: string, value: string): UpgradeDef['effects'] => [
  { type: 'multiplyProduction', target: 'generator:' + gen, value },
];
const mulGlobal = (value: string): UpgradeDef['effects'] => [{ type: 'multiplyProduction', target: 'global', value }];
const mulRes = (res: string, value: string): UpgradeDef['effects'] => [
  { type: 'multiplyProduction', target: 'resource:' + res, value },
];
const cutCost = (value: string): UpgradeDef['effects'] => [{ type: 'divideCost', target: 'global', value }];
const addClick = (value: string): UpgradeDef['effects'] => [{ type: 'addFlat', target: 'global', value }];

// === Maszyny rdzenia (drabina) + „naturalna" waluta ulepszeń i baza kosztu ==========================
interface GenRow { id: string; name: string; ures: string; ubase: number }
const GENS: GenRow[] = [
  { id: 'liczydlo', name: 'Liczydło', ures: 'cykle', ubase: 5e3 },
  { id: 'arytmometr', name: 'Arytmometr', ures: 'cykle', ubase: 3e4 },
  { id: 'tabulator', name: 'Tabulator', ures: 'cykle', ubase: 3e5 },
  { id: 'mera400', name: 'MERA-400', ures: 'cykle', ubase: 3e6 },
  { id: 'k202', name: 'K-202', ures: 'cykle', ubase: 3e7 },
  { id: 'odra1305', name: 'Odra 1305', ures: 'cykle', ubase: 3e8 },
  { id: 'osrodek', name: 'Ośrodek obliczeniowy', ures: 'cykle', ubase: 3e9 },
  { id: 'spectrum', name: 'ZX Spectrum', ures: 'dewizy', ubase: 300 },
  { id: 'meritum', name: 'Meritum', ures: 'dewizy', ubase: 500 },
  { id: 'mazovia', name: 'Mazovia', ures: 'dewizy', ubase: 3e3 },
  { id: 'spolka', name: 'Spółka', ures: 'dewizy', ubase: 3e4 },
];

// === RODZINA 1 — drabiny per maszyna (mnożnik produkcji danego generatora), 14 stopni ===============
const GEN_THRESHOLDS = [40, 80, 120, 175, 250, 350, 500, 700, 1000, 1400, 2000, 3000, 4500, 7000];
const GEN_PREFIX = ['Przegląd', 'Modernizacja', 'Racjonalizacja', 'Forsowanie normy', 'Wymiana podzespołów', 'Nadgodziny', 'Czyn produkcyjny', 'Przodownik pracy', 'Ruch wynalazczy', 'Brygada remontowa', 'Kapitalny remont', 'Linia potokowa', 'Automatyzacja', 'Pełna moc'];
const GEN_FLAVOR = [
  'Komisja orzekła: da się lepiej.',
  'Ten sam sprzęt, większa norma — cud gospodarki planowej.',
  'Mniej marnotrawstwa, więcej wykonania.',
  'Plan napięty do granic. I jeszcze odrobinę dalej.',
  'Części „zorganizowane" prywatnie. Działa.',
  'Maszyna nie śpi. Operator zazdrości.',
  'Zobowiązanie podjęte na akademii — trzeba wyrobić.',
  'Sztandar przechodni i portret na korytarzu.',
  'Skrzynka racjonalizatorska pełna pomysłów.',
  'Ekipa zna każdy zawór na pamięć.',
  'Rozkręcone do ostatniej śrubki i z powrotem.',
  'Taśma sunie równo jak w kronice filmowej.',
  'Mniej rąk, więcej wyniku. Oto postęp.',
  'Wyciśnięte siódme poty — i ósme dla pewności.',
];
function perGeneratorLadders(): UpgradeDef[] {
  const out: UpgradeDef[] = [];
  for (const g of GENS) {
    for (let t = 0; t < GEN_THRESHOLDS.length; t++) {
      out.push({
        id: `rdzen.gu_mul_${g.id}_${t}`,
        name: `${GEN_PREFIX[t]}: ${g.name}`,
        flavor: GEN_FLAVOR[t],
        costResource: g.ures,
        cost: numStr(g.ubase * 5 ** t),
        unlock: `posiadane.${g.id} >= ${GEN_THRESHOLDS[t]}`,
        once: true,
        effects: mulGen(g.id, '1.5'),
      });
    }
  }
  return out;
}

// === RODZINA 2 — „filar gospodarki": posiadanie maszyny daje bonus GLOBALNY, 6 stopni ===============
const PILLAR_THR = [60, 150, 350, 700, 1500, 3000];
const PILLAR_PREFIX = ['Wizytówka planu', 'Filar gospodarki', 'Duma pięciolatki', 'Sztandarowy zakład', 'Perła przemysłu', 'Pomnik epoki'];
function pillarLadders(): UpgradeDef[] {
  const out: UpgradeDef[] = [];
  for (const g of GENS) {
    for (let t = 0; t < PILLAR_THR.length; t++) {
      out.push({
        id: `rdzen.gu_pillar_${g.id}_${t}`,
        name: `${PILLAR_PREFIX[t]}: ${g.name}`,
        flavor: 'Cała gospodarka zaczyna kręcić się wokół tej maszyny.',
        costResource: g.ures,
        cost: numStr(g.ubase * 4 * 8 ** t),
        unlock: `posiadane.${g.id} >= ${PILLAR_THR[t]}`,
        once: true,
        effects: mulGlobal('1.1'),
      });
    }
  }
  return out;
}

// === RODZINA 3 — globalne skoki epokowe (bramkowane bogactwem cykli), 16 stopni =====================
const GLOB_PREFIX = ['Usprawnienie', 'Reorganizacja', 'Mobilizacja', 'Wielki skok', 'Przyspieszenie', 'Intensyfikacja', 'Koncentracja sił', 'Ofensywa produkcyjna', 'Manewr gospodarczy', 'Pełna para', 'Zryw planowy', 'Wielka ofensywa', 'Skok cywilizacyjny', 'Mobilizacja zasobów', 'Forsowny marsz', 'Apogeum planu'];
function globalLadder(): UpgradeDef[] {
  const out: UpgradeDef[] = [];
  for (let t = 0; t < GLOB_PREFIX.length; t++) {
    const thr = 10 ** (4 + t); // 1e4 .. 1e19
    out.push({
      id: `rdzen.gu_glob_${t}`,
      name: GLOB_PREFIX[t]!,
      flavor: 'Hasło z gazet staje się normą produkcyjną. Wszystko rusza raźniej.',
      costResource: 'cykle',
      cost: numStr(thr * 0.5),
      unlock: `zasob.cykle >= ${numStr(thr)}`,
      once: true,
      effects: mulGlobal('1.2'),
    });
  }
  return out;
}

// === RODZINA 4 — obniżki kosztów (drugi obieg, gospodarność), 12 stopni =============================
const COST_NAME = ['Oszczędność', 'Normalizacja części', 'Racjonalizacja kosztów', 'Gospodarność', 'Drugi obieg', 'Recykling surowców', 'Dyscyplina materiałowa', 'Bilans zamknięty', 'Cięcie strat', 'Kontrola jakości', 'Standaryzacja dostaw', 'Zero marnotrawstwa'];
function costLadder(): UpgradeDef[] {
  const out: UpgradeDef[] = [];
  for (let t = 0; t < COST_NAME.length; t++) {
    const thr = 10 ** (4 + t * 1.2);
    out.push({
      id: `rdzen.gu_cost_${t}`,
      name: COST_NAME[t]!,
      flavor: 'Mniej znika „po drodze". Magazyn nareszcie się spina.',
      costResource: 'cykle',
      cost: numStr(thr * 0.4),
      unlock: `zasob.cykle >= ${numStr(thr)}`,
      once: true,
      effects: cutCost('1.15'),
    });
  }
  return out;
}

// === RODZINA 5 — moc klikania (dla aktywnych), 12 stopni ============================================
const CLICK_NAME = ['Wprawa', 'Rutyniarz', 'Szybkie palce', 'Mistrz klawisza', 'Wirtuoz', 'Stachanowiec klawiatury', 'Rekordzista hali', 'Legenda zakładu', 'Mistrz normy', 'Ręka opatrzności', 'Człowiek-maszyna', 'Bohater pracy'];
const CLICK_FLAT = [50, 500, 5e3, 5e4, 5e5, 5e6, 5e7, 5e8, 5e9, 5e10, 5e11, 5e12];
function clickLadder(): UpgradeDef[] {
  const out: UpgradeDef[] = [];
  for (let t = 0; t < CLICK_NAME.length; t++) {
    const thr = 10 ** (3 + t * 1.3);
    out.push({
      id: `rdzen.gu_click_${t}`,
      name: CLICK_NAME[t]!,
      flavor: 'Jeden klawisz, sto operacji. Norma wyrobiona palcem.',
      costResource: 'cykle',
      cost: numStr(thr),
      unlock: `zasob.cykle >= ${numStr(thr * 0.5)}`,
      once: true,
      effects: addClick(numStr(CLICK_FLAT[t]!)),
    });
  }
  return out;
}

// === RODZINA 6 — mnożniki dewiz (strona walutowa), 16 stopni ========================================
const DEW_NAME = ['Kantor', 'Czarny rynek', 'Eksport', 'Kontrakt dewizowy', 'Bony Pewexu', 'Konto walutowe', 'Kanał offshore', 'Twarda waluta', 'Spółka polonijna', 'Firma krzak', 'Tranzyt', 'Reeksport', 'Konto w Wiedniu', 'Cichy wspólnik', 'Wymienialność', 'Złoto dewizowe'];
const DEW_THR = [10, 50, 200, 1e3, 5e3, 2e4, 1e5, 5e5, 2e6, 1e7, 5e7, 2e8, 1e9, 5e9, 2e10, 1e11];
function dewizyLadder(): UpgradeDef[] {
  const out: UpgradeDef[] = [];
  for (let t = 0; t < DEW_NAME.length; t++) {
    out.push({
      id: `rdzen.gu_dew_${t}`,
      name: DEW_NAME[t]!,
      flavor: 'Zielone lubią się mnożyć, gdy nikt nie patrzy.',
      costResource: 'dewizy',
      cost: numStr(DEW_THR[t]! * 0.5),
      unlock: `zasob.dewizy >= ${numStr(DEW_THR[t]!)}`,
      once: true,
      effects: mulRes('dewizy', '1.4'),
    });
  }
  return out;
}

/** Cała wygenerowana pula ulepszeń (deterministyczna). U1 fundament + U2 pełna fala główna. */
export function buildGeneratedUpgrades(): UpgradeDef[] {
  return [
    ...perGeneratorLadders(), // 11 × 14 = 154
    ...pillarLadders(), // 11 × 6 = 66
    ...globalLadder(), // 16
    ...costLadder(), // 12
    ...clickLadder(), // 12
    ...dewizyLadder(), // 16
  ];
}
