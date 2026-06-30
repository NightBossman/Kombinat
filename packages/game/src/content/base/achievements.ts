// achievements.ts — Generator OSIAGNIEC bazowych (PLAN 8.3, cel: liczba 3-cyfrowa). To wciaz DANE:
// funkcja produkuje tablice AchievementDef walidowana i scalana tym samym loaderem co reszta tresci
// (rdzen = konsument formatu DLC). Wiekszosc to progi (generowane), reszta — kuratorskie/sekretne.
import { formatNumber, type AchievementDef } from '@kombinat/shared';

interface B {
  id: string;
  name: string;
}
const BUILDINGS: B[] = [
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
const BUILDING_TIERS = [
  1, 5, 10, 25, 50, 75, 100, 150, 200, 250, 300, 400, 500, 750, 1000, 1500, 2000, 3000, 5000, 7500,
  10000, 25000,
];
const CYKLE_TIERS = [100, 1000, 1e4, 1e5, 1e6, 1e7, 1e8, 1e9, 1e10, 1e11, 1e12, 1e14, 1e16, 1e18];
const DEWIZY_TIERS = [1, 10, 100, 1000, 1e4, 1e5, 1e6, 1e7, 1e8];
const DENOM_TIERS = [1, 2, 3, 5, 8, 13, 21, 50, 100];
const ODZN_TIERS = [1, 5, 10, 25, 50, 100, 250, 500];
const OSIAG_TIERS = [10, 25, 50, 100, 150, 200, 250, 300];
const CZAS_TIERS = [300, 1800, 3600, 7200, 18000, 43200];

function bMult(t: number): string {
  return t >= 5000 ? '1.04' : t >= 500 ? '1.03' : t >= 50 ? '1.02' : '1.01';
}

export function buildAchievements(): AchievementDef[] {
  const out: AchievementDef[] = [];

  for (const b of BUILDINGS) {
    for (const t of BUILDING_TIERS) {
      out.push({
        id: `rdzen.a_${b.id}_${t}`,
        name: `${b.name} ×${formatNumber(t)}`,
        description: `Posiadaj sztuk: ${formatNumber(t)}.`,
        condition: `posiadane.${b.id} >= ${t}`,
        multiplier: bMult(t),
        category: 'Maszyny',
      });
    }
  }
  for (const t of CYKLE_TIERS) {
    out.push({
      id: `rdzen.a_cykle_${t}`,
      name: `Cykle: ${formatNumber(t)}`,
      description: 'Zgromadź tyle cykli naraz.',
      condition: `zasob.cykle >= ${t}`,
      multiplier: '1.02',
      category: 'Cykle',
    });
  }
  for (const t of DEWIZY_TIERS) {
    out.push({
      id: `rdzen.a_dewizy_${t}`,
      name: `Dewizy: ${formatNumber(t)}`,
      description: 'Zgromadź tyle dewiz naraz.',
      condition: `zasob.dewizy >= ${t}`,
      multiplier: '1.02',
      category: 'Dewizy',
    });
  }
  for (const t of DENOM_TIERS) {
    out.push({
      id: `rdzen.a_denom_${t}`,
      name: `Denominacje: ${t}`,
      description: 'Wykonaj tyle Denominacji.',
      condition: `prestiz.liczba >= ${t}`,
      multiplier: '1.03',
      category: 'Prestiż',
    });
  }
  for (const t of ODZN_TIERS) {
    out.push({
      id: `rdzen.a_odzn_${t}`,
      name: `Odznaczenia: ${t}`,
      description: 'Zgromadź tyle odznaczeń.',
      condition: `prestiz.odznaczenia >= ${t}`,
      multiplier: '1.02',
      category: 'Prestiż',
    });
  }
  for (const t of OSIAG_TIERS) {
    out.push({
      id: `rdzen.a_osiag_${t}`,
      name: `Kolekcjoner: ${t}`,
      description: 'Zdobądź tyle osiągnięć.',
      condition: `osiagniecia.zdobyte >= ${t}`,
      multiplier: '1.02',
      category: 'Meta',
    });
  }
  for (const t of CZAS_TIERS) {
    out.push({
      id: `rdzen.a_czas_${t}`,
      name: `Staż: ${Math.round(t / 60)} min`,
      description: 'Graj tyle w jednej sesji.',
      condition: `czas.sesja >= ${t}`,
      multiplier: '1.01',
      category: 'Czas',
    });
  }

  // Kuratorskie i sekretne — z puentą w tonie epoki.
  out.push(
    {
      id: 'rdzen.a_pierwszy_cykl',
      name: 'Pierwszy cykl',
      description: 'Wszystko ma swój początek. Nawet plan.',
      condition: 'zasob.cykle >= 1',
      multiplier: '1.01',
      category: 'Meta',
    },
    {
      id: 'rdzen.a_pelna_drabina',
      name: 'Cała drabina',
      description: 'Dojść aż do zalążka spółki — koniec epoki.',
      condition: 'posiadane.spolka >= 1',
      multiplier: '1.05',
      category: 'Maszyny',
    },
    {
      id: 'rdzen.a_nocna_zmiana',
      name: 'Nocna zmiana',
      description: 'Grano między północą a świtem. Plan nie śpi.',
      condition: 'czas.poraDnia >= 0 and czas.poraDnia <= 4',
      secret: true,
      multiplier: '1.03',
      category: 'Sekrety',
    },
    {
      id: 'rdzen.a_przerwa_sniadaniowa',
      name: 'Przerwa śniadaniowa',
      description: 'Grano w porze drugiego śniadania (9–10).',
      condition: 'czas.poraDnia >= 9 and czas.poraDnia <= 10',
      secret: true,
      multiplier: '1.02',
      category: 'Sekrety',
    },
    {
      id: 'rdzen.a_pierwsze_dewizy',
      name: 'Twarda waluta',
      description: 'Pierwsza dewiza w kasie.',
      condition: 'zasob.dewizy >= 1',
      multiplier: '1.02',
      category: 'Dewizy',
    },
    {
      id: 'rdzen.a_bank_pelny',
      name: 'Wykonanie planu w 143%',
      description: 'Miej naraz ponad bilion cykli. Reszta to błąd statystyczny.',
      condition: 'zasob.cykle >= 1000000000000',
      multiplier: '1.03',
      category: 'Cykle',
    },
    {
      id: 'rdzen.a_weteran',
      name: 'Weteran resetu',
      description: 'Pięć Denominacji za sobą.',
      condition: 'prestiz.liczba >= 5',
      multiplier: '1.03',
      category: 'Prestiż',
    },
    {
      id: 'rdzen.a_setka_osrodkow',
      name: 'Sto ośrodków',
      description: 'Instytucjonalna potęga: 100 ośrodków obliczeniowych.',
      condition: 'posiadane.osrodek >= 100',
      multiplier: '1.04',
      category: 'Maszyny',
    },
  );

  // UNIKALNE (uwaga #22) — osiągnięcia bez wzorca, każde za konkretne, niepowtarzalne wyczyny.
  // Korzystają z nowych liczników (seria klików, gry w Taśmę, transakcje, okazje, kadra, typy maszyn).
  const uniq: AchievementDef[] = [
    { id: 'rdzen.au_pontyfikat', name: 'Pontyfikat', description: 'Kliknij kalkulator 2137 razy pod rząd, bez przerwy.', condition: 'licznik.seria_klikniec_max >= 2137', secret: true, multiplier: '1.05', category: 'Unikalne' },
    { id: 'rdzen.au_palce', name: 'Wprawne palce', description: 'Seria 100 kliknięć bez przerwy.', condition: 'licznik.seria_klikniec_max >= 100', multiplier: '1.02', category: 'Unikalne' },
    { id: 'rdzen.au_stachanowiec', name: 'Stachanowiec klawiatury', description: 'Seria 1000 kliknięć bez przerwy. Norma wyrobiona z nawiązką.', condition: 'licznik.seria_klikniec_max >= 1000', multiplier: '1.03', category: 'Unikalne' },
    { id: 'rdzen.au_numerek', name: 'Numerek', description: 'Zagraj w Taśmę 69 razy za jednym zamachem.', condition: 'licznik.tasma_seria >= 69', secret: true, multiplier: '1.04', category: 'Unikalne' },
    { id: 'rdzen.au_bez_herbaty', name: 'Bez przerwy na herbatę', description: 'Taśma 30 razy z rzędu, bez odejścia od magnetofonu.', condition: 'licznik.tasma_seria >= 30', multiplier: '1.02', category: 'Unikalne' },
    { id: 'rdzen.au_didzej', name: 'Didżej z magnetofonem', description: 'Zagraj w Taśmę 100 razy łącznie.', condition: 'licznik.tasma_lacznie >= 100', multiplier: '1.02', category: 'Unikalne' },
    { id: 'rdzen.au_tasma_mistrz', name: 'Połknięty przez magnetofon', description: 'Zagraj w Taśmę 500 razy łącznie.', condition: 'licznik.tasma_lacznie >= 500', multiplier: '1.03', category: 'Unikalne' },
    { id: 'rdzen.au_tasma_legenda', name: 'Taśmowa legenda', description: '1000 gier w Taśmę. Głowica pamięta każdą.', condition: 'licznik.tasma_lacznie >= 1000', multiplier: '1.04', category: 'Unikalne' },
    { id: 'rdzen.au_pierwszy_interes', name: 'Pierwszy interes', description: 'Dziesięć transakcji na kantorze.', condition: 'licznik.gielda_transakcje >= 10', multiplier: '1.01', category: 'Unikalne' },
    { id: 'rdzen.au_cinkciarz', name: 'Cinkciarz spod Forum', description: 'Sto transakcji na kantorze. Kurs zawsze przyjacielski.', condition: 'licznik.gielda_transakcje >= 100', multiplier: '1.02', category: 'Unikalne' },
    { id: 'rdzen.au_rekin', name: 'Rekin z giełdy', description: 'Tysiąc transakcji. Wyczuwasz kurs nosem.', condition: 'licznik.gielda_transakcje >= 1000', multiplier: '1.04', category: 'Unikalne' },
    { id: 'rdzen.au_okazja', name: 'Rzucili towar!', description: 'Złap pierwszą okazję, póki jest.', condition: 'licznik.zlote_klikniecia >= 1', multiplier: '1.01', category: 'Unikalne' },
    { id: 'rdzen.au_lowca', name: 'Łowca okazji', description: 'Złap 10 okazji.', condition: 'licznik.zlote_klikniecia >= 10', multiplier: '1.02', category: 'Unikalne' },
    { id: 'rdzen.au_talony', name: 'Człowiek z talonami', description: 'Złap 25 okazji. Stoisz w kolejce, zanim ją ogłoszą.', condition: 'licznik.zlote_klikniecia >= 25', multiplier: '1.03', category: 'Unikalne' },
    { id: 'rdzen.au_spodlady', name: 'Spod-ladowy lord', description: 'Złap 100 okazji.', condition: 'licznik.zlote_klikniecia >= 100', multiplier: '1.04', category: 'Unikalne' },
    { id: 'rdzen.au_komplet', name: 'Komplet sprzętu', description: 'Miej przynajmniej po jednej z każdego rodzaju maszyny.', condition: 'maszyny.rodzaje >= 11', multiplier: '1.05', category: 'Unikalne' },
    { id: 'rdzen.au_polowa_parku', name: 'Połowa parku', description: 'Sześć różnych rodzajów maszyn naraz.', condition: 'maszyny.rodzaje >= 6', multiplier: '1.02', category: 'Unikalne' },
    { id: 'rdzen.au_obsada', name: 'Pełna obsada', description: 'Zwerbuj całą kadrę.', condition: 'kadra >= 5', multiplier: '1.04', category: 'Unikalne' },
    { id: 'rdzen.au_zespol', name: 'Zgrany zespół', description: 'Zwerbuj troje ludzi do kadry.', condition: 'kadra >= 3', multiplier: '1.02', category: 'Unikalne' },
    { id: 'rdzen.au_nadgodziny', name: 'Nadgodziny', description: 'Dwie godziny w jednej sesji. Plan nie zna zegara.', condition: 'czas.sesja >= 7200', multiplier: '1.02', category: 'Unikalne' },
    { id: 'rdzen.au_osiem_godzin', name: 'Czyn ośmiogodzinny', description: 'Osiem godzin w jednej sesji.', condition: 'czas.sesja >= 28800', secret: true, multiplier: '1.04', category: 'Unikalne' },
    { id: 'rdzen.au_trzynasta', name: 'Pechowa trzynasta', description: 'Grano o trzynastej. Nikt nie wierzy w pecha, a jednak.', condition: 'czas.poraDnia >= 13 and czas.poraDnia <= 13', secret: true, multiplier: '1.02', category: 'Unikalne' },
    { id: 'rdzen.au_recydywista', name: 'Denominacyjny recydywista', description: '25 Denominacji. Reset to też zawód.', condition: 'prestiz.liczba >= 25', multiplier: '1.03', category: 'Unikalne' },
    { id: 'rdzen.au_pol_setki', name: 'Pół setki pięciolatek', description: '50 Denominacji za sobą.', condition: 'prestiz.liczba >= 50', multiplier: '1.04', category: 'Unikalne' },
    { id: 'rdzen.au_elita', name: 'Elita', description: 'Uzbieraj 1337 dewiz. Liczba wtajemniczonych.', condition: 'zasob.dewizy >= 1337', secret: true, multiplier: '1.03', category: 'Unikalne' },
    { id: 'rdzen.au_dwadziescia_jeden', name: 'Dwadzieścia jeden orderów', description: 'Miej naraz 21 odznaczeń.', condition: 'prestiz.odznaczenia >= 21', multiplier: '1.02', category: 'Unikalne' },
    { id: 'rdzen.au_kantor_i_tasma', name: 'Multiinstrumentalista', description: '50 transakcji i 50 gier w Taśmę — wszechstronność ponad plan.', condition: 'licznik.gielda_transakcje >= 50 and licznik.tasma_lacznie >= 50', multiplier: '1.03', category: 'Unikalne' },
    { id: 'rdzen.au_okazje_seria', name: 'Wyczuwa towar', description: 'Złap 50 okazji.', condition: 'licznik.zlote_klikniecia >= 50', multiplier: '1.03', category: 'Unikalne' },
    { id: 'rdzen.au_palacz_tasm', name: 'Maratończyk taśmy', description: '69 gier w Taśmę łącznie. Ładne.', condition: 'licznik.tasma_lacznie >= 69', secret: true, multiplier: '1.02', category: 'Unikalne' },
    { id: 'rdzen.au_klikacz', name: 'Klik ponad wszystko', description: 'Seria 2137 kliknięć i ani jednej maszyny mniej.', condition: 'licznik.seria_klikniec_max >= 500', multiplier: '1.02', category: 'Unikalne' },
    // Załatwianie / łapówki (Faza 4A) — licznik.lapowki.
    { id: 'rdzen.au_pierwsza_lapowka', name: 'Pierwsze załatwienie', description: 'Daj pierwszą łapówkę. Tak się tu pracuje.', condition: 'licznik.lapowki >= 1', multiplier: '1.01', category: 'Unikalne' },
    { id: 'rdzen.au_zalatwiacz', name: 'Załatwiacz', description: '25 załatwionych spraw. Magazyn otwiera się na sam Twój widok.', condition: 'licznik.lapowki >= 25', multiplier: '1.03', category: 'Unikalne' },
    { id: 'rdzen.au_po_znajomosci', name: 'Wszystko po znajomości', description: '100 łapówek. Oficjalny obieg to dla Ciebie folklor.', condition: 'licznik.lapowki >= 100', multiplier: '1.05', category: 'Unikalne' },
    // Zjazd PZPR / doktryny (Faza 4B) — licznik.zjazdy.
    { id: 'rdzen.au_delegat', name: 'Delegat na Zjazd', description: 'Wybierz pierwszą doktrynę na pięciolatkę.', condition: 'licznik.zjazdy >= 1', multiplier: '1.02', category: 'Unikalne' },
    { id: 'rdzen.au_isekretarz', name: 'Towarzysz I Sekretarz', description: 'Dziesięć Zjazdów, dziesięć linii na epokę. Partia to Ty.', condition: 'licznik.zjazdy >= 10', multiplier: '1.04', category: 'Unikalne' },
    // Dyplomacja bloków (Faza 4C) — licznik.dyplomacja.
    { id: 'rdzen.au_pierwszy_kontrakt', name: 'Pierwszy kontrakt', description: 'Zacieśnij pierwszą relację z zagranicą.', condition: 'licznik.dyplomacja >= 1', multiplier: '1.01', category: 'Unikalne' },
    { id: 'rdzen.au_dyplomata', name: 'Dyplomata', description: '25 zacieśnień relacji. Znają Cię w każdej ambasadzie bloku.', condition: 'licznik.dyplomacja >= 25', multiplier: '1.03', category: 'Unikalne' },
    { id: 'rdzen.au_ambasador', name: 'Ambasador', description: '100 zacieśnień relacji. Twoje delegacje jeżdżą bez przerwy.', condition: 'licznik.dyplomacja >= 100', multiplier: '1.05', category: 'Unikalne' },
  ];
  out.push(...uniq);

  return out;
}
