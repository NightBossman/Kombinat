// upgrades.ts — DODATKOWE ulepszenia (uwaga: kategoria ma nie świecić pustkami, zwłaszcza late game).
// Dane dosypywane do bazowej puli. Większość bramkowana późnymi maszynami / dużymi zasobami, by
// w późnej grze wciąż było co kupować. Efekty: mnożniki produkcji, obniżki kosztów, moc klikania.
import type { UpgradeDef } from '@kombinat/shared';

const mulGen = (id: string, target: string, value: string): UpgradeDef['effects'] => [
  { type: 'multiplyProduction', target: 'generator:' + target, value },
];
const mulGlobal = (value: string): UpgradeDef['effects'] => [{ type: 'multiplyProduction', target: 'global', value }];
const mulRes = (res: string, value: string): UpgradeDef['effects'] => [
  { type: 'multiplyProduction', target: 'resource:' + res, value },
];

export const lateUpgrades: UpgradeDef[] = [
  // — per-maszyna: mnożniki dla średnich i późnych generatorów —
  { id: 'rdzen.u_osrodek1', name: 'Druga zmiana', flavor: 'Ośrodek pracuje też w nocy. Operatorzy mniej.', costResource: 'cykle', cost: '5e7', unlock: 'posiadane.osrodek >= 10', once: true, effects: mulGen('x', 'osrodek', '2') },
  { id: 'rdzen.u_osrodek2', name: 'Trzecia zmiana', flavor: 'Ośrodek nie śpi nigdy. Kawa rozpuszczalna na etacie.', costResource: 'cykle', cost: '2.5e8', unlock: 'posiadane.osrodek >= 25', once: true, effects: mulGen('x', 'osrodek', '3') },
  { id: 'rdzen.u_spectrum1', name: 'Przeróbka joysticka', flavor: 'Kopiowanie kaset idzie sprawniej, gdy sprzęt podrasowany.', costResource: 'cykle', cost: '6e8', unlock: 'posiadane.spectrum >= 5', once: true, effects: mulGen('x', 'spectrum', '2') },
  { id: 'rdzen.u_spectrum2', name: 'Giełda na stadionie', flavor: 'Cała hala handluje kasetami. Dewizy płyną szerokim strumieniem.', costResource: 'dewizy', cost: '400', unlock: 'posiadane.spectrum >= 25', once: true, effects: mulGen('x', 'spectrum', '3') },
  { id: 'rdzen.u_meritum1', name: 'Pracownia szkolna', flavor: 'Klasa pełna Meritów. Dzieciaki uczą się szybciej niż sprzęt liczy.', costResource: 'dewizy', cost: '220', unlock: 'posiadane.meritum >= 5', once: true, effects: mulGen('x', 'meritum', '2') },
  { id: 'rdzen.u_meritum2', name: 'Olimpiada informatyczna', flavor: 'Najlepsi uczniowie wyciskają z Meritum siódme poty.', costResource: 'dewizy', cost: '2200', unlock: 'posiadane.meritum >= 25', once: true, effects: mulGen('x', 'meritum', '3') },
  { id: 'rdzen.u_mazovia1', name: 'Karta grafiki', flavor: 'Klon PC dostał kartę Herkules. Teraz nawet wykresy rysuje.', costResource: 'dewizy', cost: '3000', unlock: 'posiadane.mazovia >= 5', once: true, effects: mulGen('x', 'mazovia', '2') },
  { id: 'rdzen.u_mazovia2', name: 'Dysk twardy 20 MB', flavor: 'Dwadzieścia megabajtów! Nikt nie zapełni tego za życia.', costResource: 'dewizy', cost: '30000', unlock: 'posiadane.mazovia >= 25', once: true, effects: mulGen('x', 'mazovia', '3') },
  { id: 'rdzen.u_spolka1', name: 'Pierwszy pracownik', flavor: 'Spółka zatrudnia kogoś z zewnątrz. Bez przydziału, z umowy.', costResource: 'dewizy', cost: '50000', unlock: 'posiadane.spolka >= 5', once: true, effects: mulGen('x', 'spolka', '2') },
  { id: 'rdzen.u_spolka2', name: 'Biuro w centrum', flavor: 'Szyld, sekretarka, telefon z wybieraniem tonowym. Pełen profesjonalizm.', costResource: 'dewizy', cost: '500000', unlock: 'posiadane.spolka >= 25', once: true, effects: mulGen('x', 'spolka', '3') },
  { id: 'rdzen.u_spolka3', name: 'Przekształcenie w spółkę akcyjną', flavor: 'Spółka rośnie szybciej, niż ktokolwiek planował. Także Ty.', costResource: 'dewizy', cost: '5e6', unlock: 'posiadane.spolka >= 50', once: true, effects: mulGen('x', 'spolka', '5') },

  // — globalne skoki, bramkowane wejściem w kolejną epokę —
  { id: 'rdzen.u_komputeryzacja', name: 'Komputeryzacja kraju', flavor: 'Hasło z gazet staje się faktem. Wszystko liczy szybciej.', costResource: 'cykle', cost: '1.5e7', unlock: 'posiadane.osrodek >= 1', once: true, effects: mulGlobal('1.5') },
  { id: 'rdzen.u_pecet', name: 'Era peceta', flavor: 'IBM-zgodne wkracza wszędzie. Embargo czy nie.', costResource: 'dewizy', cost: '6000', unlock: 'posiadane.mazovia >= 1', once: true, effects: mulGlobal('1.5') },
  { id: 'rdzen.u_transformacja', name: 'Transformacja', flavor: '1989. Reguły gry zmieniają się z dnia na dzień. Na Twoją korzyść.', costResource: 'dewizy', cost: '20000', unlock: 'posiadane.spolka >= 1', once: true, effects: mulGlobal('2') },
  { id: 'rdzen.u_wolny_rynek', name: 'Wolny rynek', flavor: 'Koniec reglamentacji. Liczy się tylko to, ile wyprodukujesz.', costResource: 'dewizy', cost: '1e6', unlock: 'posiadane.spolka >= 25', once: true, effects: mulGlobal('3') },
  { id: 'rdzen.u_internet', name: 'Pierwsze łącze', flavor: 'Modem piszczy, świat się otwiera. Nic już nie będzie takie samo.', costResource: 'dewizy', cost: '5e6', unlock: 'posiadane.spolka >= 50', once: true, effects: mulGlobal('5') },

  // — globalne, bramkowane samym BOGACTWEM (działa nawet po Denominacji bez późnych maszyn) —
  { id: 'rdzen.u_optymalizacja', name: 'Optymalizacja kodu', flavor: 'Mniej rozkazów, ten sam wynik. Asembler to poezja.', costResource: 'cykle', cost: '2e6', unlock: 'zasob.cykle >= 1000000', once: true, effects: mulGlobal('1.25') },
  { id: 'rdzen.u_algorytm', name: 'Lepszy algorytm', flavor: 'Ktoś przeczytał Knutha do końca. Robi różnicę.', costResource: 'cykle', cost: '2e9', unlock: 'zasob.cykle >= 1000000000', once: true, effects: mulGlobal('1.5') },
  { id: 'rdzen.u_superkomputer', name: 'Klaster obliczeniowy', flavor: 'Łączysz maszyny w jeden organizm. Suma większa niż części.', costResource: 'cykle', cost: '2e12', unlock: 'zasob.cykle >= 1000000000000', once: true, effects: mulGlobal('2') },

  // — dewizy: rozbudowa strony walutowej —
  { id: 'rdzen.u_kantor_siec', name: 'Sieć kantorów', flavor: 'Kantor na każdym rogu. Kurs zawsze „dziś wyjątkowy".', costResource: 'dewizy', cost: '2000', unlock: 'posiadane.spectrum >= 10', once: true, effects: mulRes('dewizy', '2') },
  { id: 'rdzen.u_eksport_soft', name: 'Eksport oprogramowania', flavor: 'Polski kod jedzie na Zachód. Wraca w dolarach.', costResource: 'dewizy', cost: '12000', unlock: 'posiadane.meritum >= 10', once: true, effects: mulRes('dewizy', '2') },

  // — obniżki kosztów —
  { id: 'rdzen.u_normalizacja', name: 'Normalizacja części', flavor: 'Wreszcie wszystko pasuje do wszystkiego. Magazyn oddycha.', costResource: 'cykle', cost: '5e6', unlock: 'posiadane.odra1305 >= 10', once: true, effects: [{ type: 'divideCost', target: 'global', value: '1.5' }] },
  { id: 'rdzen.u_just_in_time', name: 'Dostawy na czas', flavor: 'Części przyjeżdżają, gdy trzeba, a nie gdy łaska. Nowość!', costResource: 'dewizy', cost: '20000', unlock: 'posiadane.mazovia >= 10', once: true, effects: [{ type: 'divideCost', target: 'global', value: '1.5' }] },
  { id: 'rdzen.u_logistyka', name: 'Własna logistyka', flavor: 'Spółka ma swoje ciężarówki. Koniec proszenia się o transport.', costResource: 'dewizy', cost: '200000', unlock: 'posiadane.spolka >= 10', once: true, effects: [{ type: 'divideCost', target: 'global', value: '2' }] },

  // — moc klikania (dla aktywnych) —
  { id: 'rdzen.u_makro', name: 'Makro na klawiszu', flavor: 'Jeden klawisz, sto operacji. Lenistwo matką wynalazków.', costResource: 'cykle', cost: '3e6', unlock: 'posiadane.k202 >= 1', once: true, effects: [{ type: 'addFlat', target: 'global', value: '500' }] },
  { id: 'rdzen.u_autoklik', name: 'Procedura wsadowa', flavor: 'Wsad rusza sam. Operator pije herbatę i patrzy w sufit.', costResource: 'cykle', cost: '5e7', unlock: 'posiadane.osrodek >= 5', once: true, effects: [{ type: 'addFlat', target: 'global', value: '5000' }] },
  { id: 'rdzen.u_skrypt', name: 'Skrypt w basicu', flavor: '10 PRINT „PLAN". 20 GOTO 10. Działa.', costResource: 'dewizy', cost: '10000', unlock: 'posiadane.mazovia >= 1', once: true, effects: [{ type: 'addFlat', target: 'global', value: '100000' }] },
  { id: 'rdzen.u_terminal', name: 'Sieć terminali', flavor: 'Każde biurko z terminalem. Kliknięcia z całego piętra liczą się Tobie.', costResource: 'dewizy', cost: '150000', unlock: 'posiadane.spolka >= 10', once: true, effects: [{ type: 'addFlat', target: 'global', value: '5000000' }] },
];
