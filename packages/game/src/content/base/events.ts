// events.ts — DEPESZE (zdarzenia) jako DANE (uwaga #14). Cel na 1.0: trzycyfrowa liczba unikalnych,
// niepowtarzających się zdarzeń z własnymi nagrodami i karami. Grupy zdarzeń bez wyboru (auto/1-OK):
//   • NAGRODA  — szczęście, coś dostajesz
//   • KARA     — pech, coś tracisz
//   • COŚ ZA COŚ — jednocześnie zysk i strata
//   • NIC      — sam klimat, bez skutków
// Plus zdarzenia z WYBOREM (2–3 opcje) — mięsiste decyzje — oraz story-beaty (once, z wyzwalaczem).
import type { EventDef } from '@kombinat/shared';

// — skróty budujące (mniej powtórzeń, flavor zostaje unikalny per zdarzenie) —
const rew = (id: string, title: string, body: string, weight: number, res: string, amount: string): EventDef => ({
  id,
  title,
  body,
  weight,
  effects: [{ type: 'grantResource', target: 'resource:' + res, amount }],
});
const pen = (id: string, title: string, body: string, weight: number, res: string, frac: string): EventDef => ({
  id,
  title,
  body,
  weight,
  effects: [{ type: 'grantResource', target: 'resource:' + res, amount: `-1 * zasob.${res} * ${frac}` }],
});
const nic = (id: string, title: string, body: string, weight: number): EventDef => ({ id, title, body, weight, effects: [] });
const trade = (id: string, title: string, body: string, weight: number, gRes: string, gAmt: string, lRes: string, lFrac: string): EventDef => ({
  id,
  title,
  body,
  weight,
  effects: [
    { type: 'grantResource', target: 'resource:' + gRes, amount: gAmt },
    { type: 'grantResource', target: 'resource:' + lRes, amount: `-1 * zasob.${lRes} * ${lFrac}` },
  ],
});

// — NAGRODA — szczęśliwy traf —
const REWARDS: EventDef[] = [
  rew('rdzen.ev_r_premia', 'Premia z funduszu', 'Niewytłumaczalna nadwyżka w funduszu premiowym. Nikt nie pyta, skąd.', 3, 'cykle', '300 + zasob.cykle * 0.08'),
  rew('rdzen.ev_r_dostawa', 'Dostawa w komplecie', 'Cudem przyszła cała dostawa części. Działa wszystko, nawet to, co nie powinno.', 3, 'cykle', '400 + zasob.cykle * 0.07'),
  rew('rdzen.ev_r_racjonalizacja', 'Wniosek racjonalizatorski', 'Pan Heniek coś podłubał i maszyny chodzą żwawiej.', 3, 'cykle', '250 + zasob.cykle * 0.06'),
  rew('rdzen.ev_r_czyn', 'Czyn społeczny', 'Załoga została po godzinach „z własnej inicjatywy". Plan podskoczył.', 2, 'cykle', '500 + zasob.cykle * 0.1'),
  rew('rdzen.ev_r_talon', 'Talon z rozdzielnika', 'Trafił Ci się talon, o który nie prosiłeś. Bierz, póki dają.', 2, 'dewizy', '8 + zasob.dewizy * 0.12'),
  rew('rdzen.ev_r_pewex', 'Okazja w Pewexie', 'Pod Forum cinkciarz ma dziś dobry kurs.', 3, 'dewizy', '6 + zasob.dewizy * 0.15'),
  rew('rdzen.ev_r_nagroda_zjazd', 'Nagroda zjazdowa', 'Wyróżnienie na zjeździe aktywu. Do dyplomu dorzucili kopertę.', 2, 'cykle', '600 + zasob.cykle * 0.09'),
  rew('rdzen.ev_r_nadwyzka', 'Nadwyżka magazynowa', 'W magazynie „znalazło się" więcej, niż było w papierach.', 2, 'cykle', '350 + zasob.cykle * 0.07'),
  rew('rdzen.ev_r_paczka', 'Paczka z Zachodu', 'Wujek z RFN przysłał paczkę. W środku — dewizy i guma do żucia.', 1, 'dewizy', '12 + zasob.dewizy * 0.18'),
  rew('rdzen.ev_r_norma', 'Norma przekroczona', 'Plan wykonany przed czasem. Nagroda, zanim ktoś podniesie normę.', 3, 'cykle', '300 + zasob.cykle * 0.06'),
  rew('rdzen.ev_r_konkurs', 'Konkurs Bajtka', 'Twój listing wygrał konkurs w magazynie. Nagroda rzeczowa i sława.', 1, 'cykle', '800 + zasob.cykle * 0.08'),
  rew('rdzen.ev_r_kontrakt', 'Mały kontrakt', 'Sąsiedni zakład zlecił obliczenia. Płacą w dewizach, dyskretnie.', 2, 'dewizy', '10 + zasob.dewizy * 0.1'),
  rew('rdzen.ev_r_oszczednosc', 'Oszczędność prądu', 'Wyłączyli pół miasta, ale Twój ośrodek dostał przydział pierwszeństwa.', 2, 'cykle', '280 + zasob.cykle * 0.05'),
  rew('rdzen.ev_r_szczescie', 'Łut szczęścia', 'Wszystko po prostu zadziałało za pierwszym razem. Zapamiętaj ten dzień.', 2, 'cykle', '450 + zasob.cykle * 0.07'),
  rew('rdzen.ev_r_dewizy_premia', 'Premia dewizowa', 'Eksport się opłacił. Dorzucili premię w twardej walucie.', 1, 'dewizy', '15 + zasob.dewizy * 0.14'),
  rew('rdzen.ev_r_zwrot', 'Zwrot nadpłaty', 'Księgowość znalazła błąd na Twoją korzyść. Rzadkość godna kroniki.', 2, 'cykle', '320 + zasob.cykle * 0.06'),
  rew('rdzen.ev_r_kabel', 'Lewy kabel', 'Magazynier „znalazł" kabel, którego od miesięcy brakowało. Linia rusza pełną parą.', 2, 'cykle', '380 + zasob.cykle * 0.07'),
  rew('rdzen.ev_r_wycinek', 'Pochwała w prasie', 'Lokalna gazeta pochwaliła ośrodek. Morale i tempo w górę.', 2, 'cykle', '300 + zasob.cykle * 0.05'),
  rew('rdzen.ev_r_stypendium', 'Stypendium fundacyjne', 'Jakaś fundacja przelała grant „na rozwój informatyki". Nikt nie pyta.', 1, 'dewizy', '11 + zasob.dewizy * 0.12'),
  rew('rdzen.ev_r_zapas', 'Ukryty zapas', 'Pod podłogą serwerowni leżał zapas części „na czarną godzinę". Godzina nadeszła.', 2, 'cykle', '420 + zasob.cykle * 0.07'),
  rew('rdzen.ev_r_wygrana', 'Wygrana w totka', 'Ktoś z załogi trafił trójkę i postawił wszystkim. Energia wróciła.', 1, 'cykle', '500 + zasob.cykle * 0.06'),
  rew('rdzen.ev_r_kurs', 'Korzystny kurs', 'Cinkciarz dziś hojny — dewizy mnożą się jak króliki.', 2, 'dewizy', '9 + zasob.dewizy * 0.13'),
  rew('rdzen.ev_r_subbotnik', 'Subotnik', 'Sobota pracująca „na ochotnika". Plan tłusty jak rzadko.', 2, 'cykle', '460 + zasob.cykle * 0.08'),
  rew('rdzen.ev_r_wynalazek', 'Drobny wynalazek', 'Pan Kazimierz dorobił część z drutu i taśmy izolacyjnej. Działa lepiej niż oryginał.', 2, 'cykle', '340 + zasob.cykle * 0.06'),
  rew('rdzen.ev_r_paczka_un', 'Paczka z Czerwonego Krzyża', 'Przyszła paczka pomocowa z Zachodu. W środku — przydatne drobiazgi spoza systemu.', 1, 'dewizy', '13 + zasob.dewizy * 0.12'),
];

// — KARA — pech epoki —
const PENALTIES: EventDef[] = [
  pen('rdzen.ev_k_prad', 'Planowe wyłączenie prądu', 'Prąd wyłączono planowo. I jeszcze raz, nieplanowo. Maszyny milczą.', 3, 'cykle', '0.04'),
  pen('rdzen.ev_k_awaria', 'Awaria głowicy', 'Głowica taśmy się zatarła. Część obliczeń do śmieci.', 3, 'cykle', '0.05'),
  pen('rdzen.ev_k_kontrola', 'Kontrola z resortu', 'Przyszli we trzech, zostali trzy dni. Połowa kart „do wyjaśnienia".', 2, 'cykle', '0.08'),
  pen('rdzen.ev_k_brak_czesci', 'Brak części zamiennych', 'Magazyn świeci pustką. Pół parku maszyn stoi i czeka.', 3, 'cykle', '0.06'),
  pen('rdzen.ev_k_remont', 'Remont kapitalny', 'Wczoraj oddali ośrodek, dziś go rozkopali. Oto dynamika.', 2, 'cykle', '0.05'),
  pen('rdzen.ev_k_lapowka', 'Łapówka dla magazyniera', 'Bez koperty części nie wydadzą. Dewizy znikają w kieszeni.', 2, 'dewizy', '0.15'),
  pen('rdzen.ev_k_dewaluacja', 'Cicha dewaluacja', 'Złotówka znów słabsza. Twoje dewizy „przeszacowano".', 1, 'dewizy', '0.1'),
  pen('rdzen.ev_k_powodz', 'Zalana piwnica', 'Pękła rura, woda w serwerowni. Karty perforowane pływają.', 2, 'cykle', '0.07'),
  pen('rdzen.ev_k_sabotaz', 'Podejrzenie sabotażu', 'Ktoś doniósł, że „celowo zwalniasz plan". Produkcja wstrzymana na wyjaśnienia.', 1, 'cykle', '0.1'),
  pen('rdzen.ev_k_mrozy', 'Mrozy stulecia', 'Minus trzydzieści. Maszyny nie chcą wstać razem z załogą.', 2, 'cykle', '0.06'),
  pen('rdzen.ev_k_papier', 'Brak papieru', 'Skończył się papier do drukarek. Wyniki są, ale nie ma ich jak wydać.', 3, 'cykle', '0.04'),
  pen('rdzen.ev_k_strajk', 'Przerwa „regeneracyjna"', 'Załoga urządziła sobie dłuższą przerwę. Oficjalnie nic się nie stało.', 2, 'cykle', '0.05'),
  pen('rdzen.ev_k_celnik', 'Celnik zatrzymał towar', 'Sprzęt utknął na granicy. „Do wyjaśnienia pochodzenia".', 1, 'dewizy', '0.12'),
  pen('rdzen.ev_k_kara_umowna', 'Kara umowna', 'Kontrakt eksportowy z opóźnieniem. Płacisz karę w dewizach.', 1, 'dewizy', '0.13'),
  pen('rdzen.ev_k_inwentaryzacja', 'Inwentaryzacja', 'Spis z natury. Coś się nie zgadza, więc na wszelki wypadek odpisują.', 2, 'cykle', '0.05'),
  pen('rdzen.ev_k_szczury', 'Szczury w kablach', 'Coś przegryzło wiązki. Pół nocy diagnostyki i tak na nic.', 2, 'cykle', '0.05'),
  pen('rdzen.ev_k_delegacja', 'Delegacja na koszt zakładu', 'Wysłali Cię na zjazd, którego nie chciałeś. Dewizy na hotel przepadły.', 1, 'dewizy', '0.1'),
  pen('rdzen.ev_k_pomylka', 'Pomyłka w rozdzielniku', 'Twój przydział trafił do innego zakładu. „Sprostują w przyszłym kwartale".', 2, 'cykle', '0.06'),
  pen('rdzen.ev_k_zwarcie', 'Zwarcie w rozdzielni', 'Trzask, swąd, ciemność. Elektryk na zwolnieniu, więc czekasz.', 2, 'cykle', '0.07'),
  pen('rdzen.ev_k_gololedz', 'Gołoledź', 'Połowa załogi nie dojechała. Maszyny czekają na operatorów.', 3, 'cykle', '0.04'),
  pen('rdzen.ev_k_podatek', 'Domiar', 'Urząd doszacował zobowiązania „w drodze wyjątku". Dewizy fru.', 1, 'dewizy', '0.14'),
  pen('rdzen.ev_k_tasma', 'Zerwana taśma', 'Magnetofon przeżuł taśmę z ważnym zadaniem. Liczone od nowa.', 2, 'cykle', '0.05'),
  pen('rdzen.ev_k_donos', 'Anonimowy donos', 'Ktoś napisał, że „marnujesz socjalistyczne mienie". Wstrzymanie do wyjaśnień.', 1, 'cykle', '0.09'),
  pen('rdzen.ev_k_wadliwy', 'Wadliwy podzespół', 'Nowa partia układów okazała się bublami. Część produkcji do kosza.', 2, 'cykle', '0.06'),
  pen('rdzen.ev_k_kolejka', 'Cały dzień w kolejce', 'Po jedną pieczątkę zszedł cały dzień roboczy. Plan stoi.', 3, 'cykle', '0.04'),
];

// — COŚ ZA COŚ — pełne kompromisu —
const TRADES: EventDef[] = [
  trade('rdzen.ev_t_handel', 'Wymiana barterowa', 'Oddajesz część cykli za garść dewiz. Tak się kręci interes.', 2, 'dewizy', '10 + zasob.dewizy * 0.1', 'cykle', '0.05'),
  trade('rdzen.ev_t_szkolenie', 'Szkolenie kadry', 'Wysyłasz ludzi na kurs. Teraz stoją, potem nadrobią.', 2, 'cykle', '400 + zasob.cykle * 0.06', 'cykle', '0.03'),
  trade('rdzen.ev_t_modernizacja', 'Modernizacja w biegu', 'Przezbrajasz linię na żywca. Chwila przestoju, potem skok.', 2, 'cykle', '600 + zasob.cykle * 0.08', 'cykle', '0.04'),
  trade('rdzen.ev_t_import', 'Import za dewizy', 'Kupujesz lepszy sprzęt z importu. Dewizy bolą, ale warto.', 1, 'cykle', '900 + zasob.cykle * 0.1', 'dewizy', '0.2'),
  trade('rdzen.ev_t_kombinacja', 'Drobna kombinacja', 'Załatwiasz coś „na lewo". Ryzyko jest, zysk też.', 2, 'cykle', '500 + zasob.cykle * 0.07', 'cykle', '0.03'),
  trade('rdzen.ev_t_eksport', 'Eksport pod presją', 'Wysyłasz produkcję na Zachód. Dostajesz dewizy, tracisz zapas cykli.', 1, 'dewizy', '14 + zasob.dewizy * 0.12', 'cykle', '0.06'),
  trade('rdzen.ev_t_dorobka', 'Dorabianie po godzinach', 'Maszyny robią „fuchę" dla sąsiada. Zysk w dewizach, zużycie w cyklach.', 2, 'dewizy', '9 + zasob.dewizy * 0.1', 'cykle', '0.04'),
  trade('rdzen.ev_t_remanent', 'Wyprzedaż remanentu', 'Pozbywasz się starych części. Trochę grosza, trochę chaosu.', 2, 'dewizy', '7 + zasob.dewizy * 0.08', 'cykle', '0.02'),
  trade('rdzen.ev_t_przeszczep', 'Przeszczep podzespołów', 'Rozbierasz starą maszynę, by ożywić nową. Bilans dodatni, ból realny.', 2, 'cykle', '550 + zasob.cykle * 0.07', 'cykle', '0.035'),
  trade('rdzen.ev_t_kontrakt_pilny', 'Pilny kontrakt', 'Bierzesz zlecenie na już. Płacą dewizami, ale park maszyn haruje na granicy.', 1, 'dewizy', '16 + zasob.dewizy * 0.13', 'cykle', '0.05'),
  trade('rdzen.ev_t_lapowka', 'Przysługa za przysługę', 'Dajesz komuś cykle „na boku", dostajesz dostęp do dewiz.', 2, 'dewizy', '8 + zasob.dewizy * 0.09', 'cykle', '0.04'),
  trade('rdzen.ev_t_eksperyment', 'Ryzykowny eksperyment', 'Podkręcasz maszyny ponad normę. Skok wydajności, ale coś się przy tym spali.', 1, 'cykle', '800 + zasob.cykle * 0.09', 'cykle', '0.05'),
  trade('rdzen.ev_t_gielda', 'Spekulacja na giełdzie', 'Obstawiasz kurs. Wychodzisz na plus w dewizach, ale zamrażasz cykle.', 1, 'dewizy', '12 + zasob.dewizy * 0.11', 'cykle', '0.04'),
  trade('rdzen.ev_t_kadra_kurs', 'Kurs przekwalifikowania', 'Posyłasz brygadę na kurs. Tydzień luki, potem wyższa norma.', 2, 'cykle', '480 + zasob.cykle * 0.06', 'cykle', '0.03'),
  trade('rdzen.ev_t_naprawa', 'Generalny przegląd', 'Zatrzymujesz linię na przegląd. Mniej teraz, więcej później.', 2, 'cykle', '520 + zasob.cykle * 0.07', 'cykle', '0.04'),
];

// — NIC — czysty klimat —
const NOTHING: EventDef[] = [
  nic('rdzen.ev_n_kolejka', 'Kolejka po nic', 'Ustawiła się kolejka. Nikt nie wie po co, ale na wszelki wypadek stoją wszyscy.', 2),
  nic('rdzen.ev_n_radio', 'Komunikat z radiowęzła', 'Z głośnika płynie marsz i zapewnienie, że nigdy nie było tak dobrze.', 2),
  nic('rdzen.ev_n_plotka', 'Plotka zakładowa', 'Podobno dyrektor dostał talon na malucha. Podobno.', 2),
  nic('rdzen.ev_n_gazetka', 'Gazetka ścienna', 'Nowy numer gazetki. Same sukcesy, zero dat.', 2),
  nic('rdzen.ev_n_apel', 'Apel poranny', 'Zebranie o ważności wykonania planu. Plan przez ten czas stał.', 1),
  nic('rdzen.ev_n_delegacja', 'Delegacja zwiedza', 'Wycieczka z bratniego kraju ogląda Twój ośrodek i kiwa głowami.', 2),
  nic('rdzen.ev_n_erewan', 'Radio Erewań', 'Pytają: czy komputer zastąpi człowieka? Odpowiadają: tylko w kolejce.', 2),
  nic('rdzen.ev_n_tablica', 'Nowa tablica wyróżnień', 'Powieszono świeżą tablicę. Nazwiska te same co poprzednio.', 1),
  nic('rdzen.ev_n_pochmurnie', 'Pochmurny poniedziałek', 'Nic szczególnego. Po prostu poniedziałek w PRL.', 2),
  nic('rdzen.ev_n_dowcip', 'Dowcip przy kawie', 'Ktoś opowiedział dowcip polityczny. Wszyscy się rozejrzeli, potem zaśmiali.', 2),
  nic('rdzen.ev_n_kronika', 'Kronika filmowa', 'Przed seansem pokazali kronikę o rekordowych zbiorach. Buraków.', 1),
  nic('rdzen.ev_n_zebranie', 'Zebranie podstawowej', 'Długie zebranie o niczym. Uchwała: zebrać się ponownie.', 1),
  nic('rdzen.ev_n_portret', 'Wymiana portretu', 'Zmieniono portret na ścianie. Gwóźdź ten sam.', 1),
  nic('rdzen.ev_n_pierwszy_maja', 'Przygotowania do pochodu', 'Cały zakład maluje transparenty. Produkcja transparentów rekordowa.', 1),
  nic('rdzen.ev_n_telewizor', 'Awaria telewizora w świetlicy', 'Telewizor w świetlicy znów łapie tylko jeden program. Ten sam co zawsze.', 2),
  nic('rdzen.ev_n_kawa', 'Skończyła się kawa', 'W bufecie skończyła się kawa zbożowa. Dramat na miarę epoki.', 2),
  nic('rdzen.ev_n_kronika2', 'Reportaż o sukcesach', 'Ekipa filmowa nakręciła reportaż. Maszyny ustawiono „do kadru".', 1),
  nic('rdzen.ev_n_szatnia', 'Remont szatni', 'Szatnię zamknięto „do odwołania". Wszyscy wieszają płaszcze na maszynach.', 2),
  nic('rdzen.ev_n_obwieszczenie', 'Nowe obwieszczenie', 'Na tablicy wisi obwieszczenie. Treść: będzie kolejne obwieszczenie.', 2),
  nic('rdzen.ev_n_wycieczka', 'Wycieczka zakładowa', 'Organizują wycieczkę nad jezioro. Zapisy u tej pani, co jej nigdy nie ma.', 1),
];

// — WYBORY — decyzje z prawdziwego zdarzenia —
const CHOICES: EventDef[] = [
  {
    id: 'rdzen.ev_c_pewex',
    title: 'Rzucili coś w Pewexie',
    body: 'Pod Forum cinkciarz ma dziś dobry kurs, a w Pewexie leży to, czego nie ma nigdzie indziej.',
    weight: 3,
    options: [
      { label: 'Brać, póki jest', effects: [{ type: 'grantResource', target: 'resource:dewizy', amount: '5 + zasob.dewizy * 0.15' }] },
      { label: 'Nie pchać się w kolejkę', effects: [{ type: 'grantResource', target: 'resource:cykle', amount: '200 + zasob.cykle * 0.05' }] },
    ],
  },
  {
    id: 'rdzen.ev_c_dostawa',
    title: 'Wadliwa dostawa',
    body: 'Przyszły podzespoły. Połowa nie działa, druga połowa działa inaczej, niż powinna.',
    weight: 2,
    options: [
      { label: 'Zgłosić uczciwie (tracisz produkcję)', effects: [{ type: 'grantResource', target: 'resource:cykle', amount: '-1 * zasob.cykle * 0.05' }] },
      { label: 'Wkręcić i nie patrzeć', effects: [{ type: 'grantResource', target: 'resource:cykle', amount: '150 + zasob.cykle * 0.03' }] },
    ],
  },
  {
    id: 'rdzen.ev_c_aktyw',
    title: 'Propozycja z komitetu',
    body: 'Sekretarz proponuje „dobrowolny" datek na czyn partyjny. W zamian — przychylność.',
    weight: 2,
    options: [
      { label: 'Dać kopertę (−dewizy, +łaska)', effects: [{ type: 'grantResource', target: 'resource:dewizy', amount: '-1 * (5 + zasob.dewizy * 0.1)' }, { type: 'grantResource', target: 'resource:cykle', amount: '500 + zasob.cykle * 0.06' }] },
      { label: 'Grzecznie odmówić', effects: [] },
    ],
  },
  {
    id: 'rdzen.ev_c_cinkciarz',
    title: 'Cinkciarz proponuje interes',
    body: 'Cichy człowiek spod Forum ma „pewną okazję". Albo Cię ustawi, albo naciągnie.',
    weight: 2,
    options: [
      { label: 'Zaryzykować dewizy', effects: [{ type: 'grantResource', target: 'resource:dewizy', amount: '20 + zasob.dewizy * 0.2' }] },
      { label: 'Podziękować i odejść', effects: [{ type: 'grantResource', target: 'resource:cykle', amount: '100 + zasob.cykle * 0.02' }] },
      { label: 'Donieść, gdzie trzeba', effects: [{ type: 'grantResource', target: 'resource:cykle', amount: '-1 * zasob.cykle * 0.02' }, { type: 'setFlag', flag: 'sb_zna', value: 1 }] },
    ],
  },
  {
    id: 'rdzen.ev_c_inzynier',
    title: 'Inżynier chce odejść',
    body: 'Najlepszy konstruktor dostał ofertę ze spółdzielni. Zostaje, jeśli go przekonasz.',
    weight: 1,
    options: [
      { label: 'Obiecać premię (−dewizy)', effects: [{ type: 'grantResource', target: 'resource:dewizy', amount: '-1 * (4 + zasob.dewizy * 0.08)' }, { type: 'grantResource', target: 'resource:cykle', amount: '700 + zasob.cykle * 0.08' }] },
      { label: 'Trudno, niech idzie', effects: [{ type: 'grantResource', target: 'resource:cykle', amount: '-1 * zasob.cykle * 0.06' }] },
    ],
  },
  {
    id: 'rdzen.ev_c_kontrola',
    title: 'Niespodziewana kontrola',
    body: 'Komisja u progu. Można ją ugościć albo grać twardo.',
    weight: 2,
    options: [
      { label: 'Postawić stół (−dewizy)', effects: [{ type: 'grantResource', target: 'resource:dewizy', amount: '-1 * (3 + zasob.dewizy * 0.06)' }] },
      { label: 'Pokazać papiery (−czas/produkcja)', effects: [{ type: 'grantResource', target: 'resource:cykle', amount: '-1 * zasob.cykle * 0.04' }] },
    ],
  },
  {
    id: 'rdzen.ev_c_talon_auto',
    title: 'Talon na malucha',
    body: 'Przyznali talon na samochód. Odbiór za 11 lat — albo sprzedaj prawo do niego już dziś.',
    weight: 1,
    options: [
      { label: 'Czekać na auto (nic teraz)', effects: [] },
      { label: 'Sprzedać talon (+dewizy)', effects: [{ type: 'grantResource', target: 'resource:dewizy', amount: '18 + zasob.dewizy * 0.15' }] },
    ],
  },
  {
    id: 'rdzen.ev_c_demoscena',
    title: 'Gówniarze z demosceny',
    body: 'Banda nastolatków oferuje „optymalizację" Twojego kodu w zamian za dostęp do sprzętu.',
    weight: 2,
    options: [
      { label: 'Wpuścić ich na noc', effects: [{ type: 'grantResource', target: 'resource:cykle', amount: '400 + zasob.cykle * 0.07' }] },
      { label: 'Nie, regulamin', effects: [] },
    ],
  },
  {
    id: 'rdzen.ev_c_dyrektor',
    title: 'Telefon od dyrektora',
    body: 'Dyrektor chce „pożyczyć" moc obliczeniową na prywatny projekt. Trudno odmówić, ale można.',
    weight: 2,
    options: [
      { label: 'Pożyczyć (−produkcja, +łaska)', effects: [{ type: 'grantResource', target: 'resource:cykle', amount: '-1 * zasob.cykle * 0.04' }, { type: 'grantResource', target: 'resource:dewizy', amount: '6 + zasob.dewizy * 0.05' }] },
      { label: 'Akurat awaria, panie dyrektorze', effects: [] },
    ],
  },
  {
    id: 'rdzen.ev_c_zachod',
    title: 'Oferta z Zachodu',
    body: 'Firma zza żelaznej kurtyny chce kupić Twoje wyniki. Płacą w dolarach, ale to ślisko.',
    weight: 1,
    options: [
      { label: 'Sprzedać (+dużo dewiz)', effects: [{ type: 'grantResource', target: 'resource:dewizy', amount: '25 + zasob.dewizy * 0.2' }] },
      { label: 'Zgłosić ofertę przełożonym', effects: [{ type: 'grantResource', target: 'resource:cykle', amount: '300 + zasob.cykle * 0.04' }] },
      { label: 'Udać, że nie było', effects: [] },
    ],
  },
  {
    id: 'rdzen.ev_c_zwiazek',
    title: 'Delegat związkowy',
    body: 'Związek żąda przerw na „regenerację sił". Możesz przystać albo zagrać twardo.',
    weight: 2,
    options: [
      { label: 'Zgodzić się (−trochę produkcji)', effects: [{ type: 'grantResource', target: 'resource:cykle', amount: '-1 * zasob.cykle * 0.03' }] },
      { label: 'Postawić na swoim (ryzyko)', effects: [{ type: 'grantResource', target: 'resource:cykle', amount: '250 + zasob.cykle * 0.04' }] },
    ],
  },
  {
    id: 'rdzen.ev_c_student',
    title: 'Student na praktyce',
    body: 'Przysłali studenta na praktykę. Albo pomoże, albo coś przestawi nie tak.',
    weight: 2,
    options: [
      { label: 'Dać mu zadanie', effects: [{ type: 'grantResource', target: 'resource:cykle', amount: '200 + zasob.cykle * 0.03' }] },
      { label: 'Posłać po kawę', effects: [] },
    ],
  },
];

// — STORY-BEATY — once, z wyzwalaczem (łańcuch SB + kamienie fabularne) —
const STORY: EventDef[] = [
  {
    id: 'rdzen.ev_sb_wizyta',
    title: 'Uprzejma wizyta',
    body: 'Towarzysz z Mostowskich „przejazdem" interesuje się Twoim ośrodkiem. Pyta o drobiazgi. Na razie.',
    trigger: 'posiadane.mera400 >= 1 and flaga.sb_zna == 0',
    once: true,
    options: [
      { label: 'Współpracować uprzejmie (postawić kawę)', effects: [{ type: 'setFlag', flag: 'sb_zna', value: 1 }, { type: 'grantResource', target: 'resource:cykle', amount: '-1 * zasob.cykle * 0.02' }] },
      { label: 'Zbywać ogólnikami', effects: [{ type: 'setFlag', flag: 'sb_zna', value: 1 }, { type: 'triggerEvent', event: 'rdzen.ev_sb_powrot' }] },
    ],
  },
  {
    id: 'rdzen.ev_sb_powrot',
    title: 'Towarzysz wraca',
    body: 'Ogólniki nie przekonały. Tym razem przyszedł z notesem i pytaniami o „nieewidencjonowany sprzęt".',
    once: true,
    options: [
      { label: 'Załatwić sprawę kopertą', effects: [{ type: 'grantResource', target: 'resource:dewizy', amount: '-1 * (3 + zasob.dewizy * 0.1)' }] },
      { label: 'Dalej grać niewiniątko', effects: [{ type: 'triggerEvent', event: 'rdzen.ev_sb_kontrola' }] },
    ],
  },
  {
    id: 'rdzen.ev_sb_kontrola',
    title: 'Kontrola',
    body: 'Przyszli we trzech, zostali na trzy dni. Połowa kart „do wyjaśnienia". Produkcja stoi.',
    once: true,
    effects: [{ type: 'grantResource', target: 'resource:cykle', amount: '-1 * zasob.cykle * 0.15' }],
  },
  {
    id: 'rdzen.ev_bajtek',
    title: 'Bajtek chce reportaż',
    body: 'Redakcja kultowego magazynu chce napisać o Twoim ośrodku. Rozgłos bywa walutą.',
    trigger: 'posiadane.spectrum >= 1',
    once: true,
    options: [
      { label: 'Zgodzić się na zdjęcia', effects: [{ type: 'grantResource', target: 'resource:cykle', amount: '1000 + zasob.cykle * 0.1' }] },
      { label: 'Lepiej nie zwracać uwagi', effects: [] },
    ],
  },
  {
    id: 'rdzen.ev_inzynier_zachod',
    title: 'Inżynier na konferencji',
    body: 'Wasz najlepszy inżynier pojechał na konferencję na Zachód i waha się, czy wracać.',
    trigger: 'posiadane.odra1305 >= 5',
    once: true,
    options: [
      { label: 'Obiecać mu własny zespół', effects: [{ type: 'grantResource', target: 'resource:cykle', amount: '2000 + zasob.cykle * 0.12' }] },
      { label: 'Trudno, niech zostaje', effects: [{ type: 'grantResource', target: 'resource:cykle', amount: '-1 * zasob.cykle * 0.08' }] },
    ],
  },
];

/** Buduje pełną listę zdarzeń bazowych (uwaga #14). */
// — KONTROLA — zdarzenia odpalane tylko z kolejki (np. po zbyt grubej łapówce, Faza 4A) —
const QUEUED: EventDef[] = [
  {
    id: 'rdzen.ev_kontrola_lapowka',
    title: 'Kontrola po cichu',
    body: 'Ktoś doniósł o „nieformalnych kontaktach". Kontrola przetrząsa papiery — część produkcji przepada na wyjaśnienia.',
    effects: [{ type: 'grantResource', target: 'resource:cykle', amount: '-1 * zasob.cykle * 0.12' }],
  },
  // „Bomba zadłużenia" doktryny kredytów zachodnich (Faza 4B) — wpinana z silnika po `debt.afterSec`.
  {
    id: 'rdzen.ev_kryzys_zadluzenia',
    title: 'Bomba zadłużenia',
    body: 'Zachodnie kredyty trzeba spłacać. Dekada boomu kończy się kryzysem — produkcja siada, a długi zostają. Do końca tej pięciolatki będzie pod górkę.',
    effects: [
      { type: 'setFlag', flag: 'kryzys', value: '1' },
      { type: 'grantResource', target: 'resource:dewizy', amount: '-1 * zasob.dewizy * 0.5' },
    ],
  },
];

// — DYPLOMACJA (Faza 4C) — zdarzenia przesuwające relacje z blokami (modifyRelation) —
const DIPLO: EventDef[] = [
  {
    id: 'rdzen.ev_delegacja',
    title: 'Delegacja handlowa',
    body: 'Przyjechała delegacja z bratniego kraju. Można podpisać kontrakt — z którym blokiem zacieśnić więzi?',
    trigger: 'posiadane.odra1305 >= 1',
    weight: 60,
    options: [
      { label: 'Z ZSRR (tania ropa)', effects: [{ type: 'modifyRelation', country: 'zsrr', delta: '12' }] },
      { label: 'Z NRD (podzespoły)', effects: [{ type: 'modifyRelation', country: 'nrd', delta: '12' }] },
      { label: 'Grzecznie odmówić', effects: [] },
    ],
  },
  {
    id: 'rdzen.ev_szczyt_rwpg',
    title: 'Szczyt RWPG',
    body: 'Wielki szczyt Rady Wzajemnej Pomocy Gospodarczej. Deklaracje współpracy ocieplają relacje w całym bloku wschodnim.',
    trigger: 'posiadane.odra1305 >= 1',
    weight: 35,
    effects: [
      { type: 'modifyRelation', country: 'zsrr', delta: '6' },
      { type: 'modifyRelation', country: 'wegry', delta: '6' },
      { type: 'modifyRelation', country: 'nrd', delta: '6' },
    ],
  },
  {
    id: 'rdzen.ev_sankcje_1981',
    title: 'Sankcje Zachodu',
    body: 'Po wprowadzeniu stanu wojennego (grudzień 1981) Zachód nakłada sankcje. Relacje z USA lecą na łeb, embargo się zaciska.',
    trigger: 'posiadane.mazovia >= 1',
    weight: 25,
    once: true,
    effects: [{ type: 'modifyRelation', country: 'usa', delta: '-25' }],
  },
];

export function buildEvents(): EventDef[] {
  return [...REWARDS, ...PENALTIES, ...TRADES, ...NOTHING, ...CHOICES, ...STORY, ...DIPLO, ...QUEUED];
}
