// genMilestones.ts — GENERATOR kamieni milowych (inicjatywa „rozbudowa ulepszeń", faza U5; domknięcie
// liczby do ≥1000). Jak `buildAchievements()` — masowo produkuje DANE (MilestoneDef[]): drabiny progów,
// które AUTOMATYCZNIE nadają trwały, mały bonus po osiągnięciu (nagroda „za samo granie"). To wciąż dane,
// scalane tym samym loaderem; ID `rdzen.ms_*`. (Silnik sprawdza kamienie z throttlingiem — patrz engine.)
import { formatNumber, type MilestoneDef } from '@kombinat/shared';

interface GenRow { id: string; name: string }
const GENS: GenRow[] = [
  { id: 'liczydlo', name: 'Liczydło' },
  { id: 'arytmometr', name: 'Arytmometr' },
  { id: 'tabulator', name: 'Tabulator' },
  { id: 'mera400', name: 'MERA-400' },
  { id: 'k202', name: 'K-202' },
  { id: 'odra1305', name: 'Odra 1305' },
  { id: 'osrodek', name: 'Ośrodek' },
  { id: 'spectrum', name: 'ZX Spectrum' },
  { id: 'meritum', name: 'Meritum' },
  { id: 'mazovia', name: 'Mazovia' },
  { id: 'spolka', name: 'Spółka' },
];
const GEN_TIERS = [50, 100, 200, 350, 600, 1000, 1750, 3000, 5000, 8000, 13000, 21000, 34000, 55000, 89000, 144000];
const PILLAR_TIERS = [75, 200, 500, 1200, 3000, 7000];
const CYKLE_K = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26];
const DEWIZY_K = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
const PRESTIGE_TIERS = [1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233];
const ODZN_TIERS = [10, 50, 100, 250, 500, 1000, 2500, 5000];
const COUNTERS = [
  { c: 'tasma_lacznie', label: 'Taśmiarz' },
  { c: 'gielda_transakcje', label: 'Cinkciarz' },
  { c: 'lapowki', label: 'Załatwiacz' },
  { c: 'zlote_klikniecia', label: 'Łowca okazji' },
  { c: 'seria_klikniec_max', label: 'Seria klików' },
  { c: 'zjazdy', label: 'Delegat' },
  { c: 'dyplomacja', label: 'Dyplomata' },
];
const COUNTER_TIERS = [10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000];

/** Masowo generowane kamienie milowe (deterministyczne). */
export function buildGeneratedMilestones(): MilestoneDef[] {
  const out: MilestoneDef[] = [];

  // 1) park maszyn — posiadanie kolejnych progów danej maszyny
  for (const g of GENS) {
    for (const t of GEN_TIERS) {
      out.push({
        id: `rdzen.ms_park_${g.id}_${t}`,
        name: `Park: ${g.name} ×${formatNumber(t)}`,
        trigger: `posiadane.${g.id} >= ${t}`,
        effects: [{ type: 'multiplyProduction', target: 'generator:' + g.id, value: '1.04' }],
      });
    }
  }
  // 1b) „filar" — posiadanie maszyny w większych progach daje bonus GLOBALNY
  for (const g of GENS) {
    for (const t of PILLAR_TIERS) {
      out.push({
        id: `rdzen.ms_filar_${g.id}_${t}`,
        name: `Filar: ${g.name} ×${formatNumber(t)}`,
        trigger: `posiadane.${g.id} >= ${t}`,
        effects: [{ type: 'multiplyProduction', target: 'global', value: '1.03' }],
      });
    }
  }
  // 2) bank cykli
  for (const k of CYKLE_K) {
    out.push({
      id: `rdzen.ms_cykle_${k}`,
      name: `Bank cykli: ${formatNumber(10 ** k)}`,
      trigger: `zasob.cykle >= 1e${k}`,
      effects: [{ type: 'multiplyProduction', target: 'global', value: '1.03' }],
    });
  }
  // 3) skarbiec dewiz
  for (const k of DEWIZY_K) {
    out.push({
      id: `rdzen.ms_dewizy_${k}`,
      name: `Skarbiec: ${formatNumber(10 ** k)} dewiz`,
      trigger: `zasob.dewizy >= 1e${k}`,
      effects: [{ type: 'multiplyProduction', target: 'resource:dewizy', value: '1.05' }],
    });
  }
  // 4) „za granie" — liczniki minigier/mechanik
  for (const m of COUNTERS) {
    for (const t of COUNTER_TIERS) {
      out.push({
        id: `rdzen.ms_${m.c}_${t}`,
        name: `${m.label}: ${formatNumber(t)}`,
        trigger: `licznik.${m.c} >= ${t}`,
        effects: [{ type: 'multiplyProduction', target: 'global', value: '1.02' }],
      });
    }
  }
  // 5) prestiż
  for (const t of PRESTIGE_TIERS) {
    out.push({
      id: `rdzen.ms_denom_${t}`,
      name: `Pięciolatek: ${t}`,
      trigger: `prestiz.liczba >= ${t}`,
      effects: [{ type: 'multiplyProduction', target: 'global', value: '1.05' }],
    });
  }
  for (const t of ODZN_TIERS) {
    out.push({
      id: `rdzen.ms_odzn_${t}`,
      name: `Zasłużony: ${formatNumber(t)} odznaczeń`,
      trigger: `prestiz.odznaczenia >= ${t}`,
      effects: [{ type: 'multiplyProduction', target: 'global', value: '1.03' }],
    });
  }

  return out;
}
