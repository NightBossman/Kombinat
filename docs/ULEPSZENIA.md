# ULEPSZENIA.md — Plan rozbudowy ulepszeń („by się nigdy nie kończyły")

> **Adresat:** Claude Code (agent wykonawczy) + właściciel.
> **Co to jest:** plan wielofazowej rozbudowy WSZYSTKICH ulepszeń w grze „Kombinat" do liczby
> **czterocyfrowej (≥ 1000)**, tak by gracz czuł, że ulepszenia się nie kończą, a późniejsze miały
> coraz więcej poziomów. Realizacja DUŻEGO odłożonego życzenia (patrz `STATUS.md` → „Większe życzenia").
> **Źródło prawdy** dla tej inicjatywy; bieżący status w `STATUS.md`. Spójny z `PLAN.md` (rdzeń = dane).

---

## 1. Cel i zasady

**Cel liczbowy:** łączna liczba ULEPSZEŃ (trwałych, kupowanych/zdobywanych bonusów) ma być
**czterocyfrowa — minimum 1000 odrębnych wpisów**. Wpisy wielopoziomowe (`levels: N`) liczymy jako
1 wpis, ale dają N zakupów — realny „licznik ulepszeń" w grze (suma poziomów) będzie jeszcze większy.

**Co obejmujemy (wszystkie systemy „ulepszeń"):**
- główne ulepszenia (`upgrades`),
- drzewo Dziedzictwa (`treeNodes`),
- ulepszenia zależne od minigier/mechanik (Taśma, Kantor, Załatwianie/łapówki),
- kadra (`characters`), doktryny (`doctrines`), dyplomacja (`diplomacy`), kamienie milowe (`milestones`).

**Cztery żelazne zasady (żeby to NIE było wypełniaczem):**
1. **To wciąż DANE.** Generujemy funkcjami (jak `buildAchievements()`), które produkują walidowane
   definicje. ZERO specjalnego kodu silnika per ulepszenie — rdzeń pozostaje konsumentem formatu DLC.
2. **Rodziny, nie ręczny tysiąc i nie bezduszne „+1% #4837".** Każda rodzina ma: pulę nazw + szablony
   klimatyczne PRL, krzywą kosztu, krzywą efektu, bramkowanie progresją i **rosnącą liczbę poziomów**
   w głębi. Wpis ma mieć sens i klimat, nawet jeśli powstał proceduralnie.
3. **Late game nigdy nie świeci pustką.** Bramkowanie (unlock) rozłożone tak, by na każdym etapie było
   „co dalej kupić"; najgłębsze rodziny mają najwięcej poziomów (życzenie: „coraz więcej poziomów").
4. **Balans i wydajność pod kontrolą.** Liczby rosną na `Decimal` (break_infinity), więc problemem nie
   jest wielkość, lecz TEMPO (każde ulepszenie odczuwalne, żadne nie trywializuje gry) oraz koszt
   obliczeń/rozmiar save'a/płynność UI przy tysiącach wpisów.

**Konwencja ID (bez kolizji z ręcznymi):** generowane → `rdzen.gu_<rodzina>_<tier>` (ulepszenia),
`rdzen.gt_<...>` (węzły drzewa), `rdzen.gm_<...>` (kamienie milowe). Ręczne zostają `rdzen.u_*` itд.

---

## 2. Stan wyjściowy (2026-06-29)

| System | Plik | Liczba teraz | Forma |
|---|---|---|---|
| Główne ulepszenia | `content/base/upgrades.ts` + `index.ts` | ~35 | ręczne, `once` |
| Dziedzictwo (drzewo) | `index.ts` `treeNodes` | ~22 węzły (część `levels` 2–7) | ręczne |
| Kamienie milowe | `index.ts` `milestones` | ~8 | ręczne, auto-trigger |
| Kadra | `index.ts` `characters` | 5 | ręczne, per-run |
| Łapówki (minigra) | `index.ts` `bribes` | 8 | ręczne, czasowe |
| Doktryny | `index.ts` `doctrines` | 5 | ręczne, per-run |
| Dyplomacja | `index.ts` `diplomacy` | 7 | ręczne, relacja |
| (Osiągnięcia) | `achievements.ts` | ~304 | **generator — wzorzec do naśladowania** |

Wzorzec `buildAchievements()` dowodzi, że masowa generacja DANYCH działa end-to-end (walidacja, scalanie,
mnożniki). Tę samą drogę bierzemy dla ulepszeń.

---

## 3. Fazy (z bramką testową po każdej — właściciel testuje, dopiero dalej)

### U1 — Fundament: generator + skalowalny UI + krzywe
Najpierw narzędzia, potem masa (inaczej setki wpisów zaleją UI i balans).
- **Generator** `content/base/genUpgrades.ts`: helpery rodzin (per-generator drabina mnożników; globalne
  skoki epokowe; drabiny obniżki kosztów / mocy klikania / mnożnika dewiz). Krzywe: koszt = `baza × r^tier`,
  efekt dobrany do tieru, `levels` rosnące z głębią. Deterministyczne ID, pule nazw + szablony PRL.
- **UI „Ulepszenia"** przebudowane pod setki pozycji: grupowanie (wg generatora/epoki/typu), **zwijanie
  wykupionych grup**, „kup następny / kup max" dla wielopoziomowych, sort wg dostępności (stać/nie stać),
  licznik „X / Y wykupionych", filtr/szukajka. Sprawdzić wydajność (computeModifiers, snapshot, walidacja
  przy starcie, rozmiar save).
- **Pierwsza fala dowodowa:** główne ulepszenia ~35 → ~150–200 (rurociąg + UI + balans w praktyce).
- **Bramka:** UI płynne przy ~200 pozycjach; balans bez rozjazdu na pełnej rozgrywce; testy (generator
  deterministyczny, brak kolizji ID, walidacja czysta, liczba wpisów rośnie zgodnie z oczekiwaniem).

### U2 — Główne ulepszenia: pełna fala (do kilkuset)
- Per generator (11 maszyn) długie drabiny odblokowywane przy 50/100/200/400/… sztuk, z rosnącą liczbą
  poziomów; globalne skoki epokowe; drabiny obniżek kosztów, mocy klikania i mnożnika dewiz — wszystko
  bramkowane, by late game miał ciągłą podaż.
- **Bramka:** spory przyrost (~+400–600 wpisów); balans przez pełną rozgrywkę + kilka Denominacji; testy.

### U3 — Dziedzictwo: głębsze i szersze drzewo
- Konary aparat/rd/rynek przedłużone (kolejne węzły z rosnącymi `levels`), nowe pod-konary/zworniki,
  „coraz więcej poziomów" w głębi. UI drzewa: przewijanie i wydajność przy wielu węzłach, czytelne łańcuchy.
- Balans odznaczeń (długo ma być na co je wydawać). **Bramka:** test struktury + balans prestiżu.

### U4 — Ulepszenia od minigier / mechanik
- Trwałe ulepszenia odblokowywane GRANIEM: drabiny „mistrzostwa Taśmy" (`licznik.tasma_lacznie`),
  „obrotu na Kantorze" (`licznik.gielda_transakcje`), „sieci załatwiania" (`licznik.lapowki`). Rozbudowa
  łapówek (więcej celów/tierów/towarów). Ewentualne bonusy skalujące same minigry.
- **Bramka:** minigry dają trwały sens progresji; testy liczniki → odblokowania.

### U5 — Pozostałe systemy + domknięcie liczby
- Więcej kadry (drabiny werbunku), więcej doktryn (każda z `lore`), głębsza dyplomacja, **masowo
  generowane kamienie milowe** (drabiny progów). Dobicie łącznej liczby do **≥ 1000**.
- **Bramka:** liczba ≥ 1000 potwierdzona testem; każdy system spójny i klimatyczny.

### U6 — Bramka całości: balans, wydajność, klimat
- Stress test (tysiące wpisów: tick/snapshot/perf, rozmiar save, płynność UI), pełny przegląd balansu
  (rozgrywka + wiele Denominacji), przegląd tonu (żadnego bezdusznego wypełniacza), potwierdzenie liczby.
- **Bramka:** ręczny test właściciela; zielone światło zamyka inicjatywę.

---

## 4. Ryzyka i pod-uwagi
- **Wydajność:** `computeModifiers` iteruje po wszystkich aktywnych ulepszeniach co przeliczenie — przy
  tysiącach trzeba zmierzyć i ewentualnie cache'ować/agregować. Snapshot i save nie mogą spuchnąć
  (serializować tylko stan „co wykupione", nie definicje). Walidacja przy starcie też rośnie — zmierzyć.
- **UI:** lista setek pozycji wymaga grupowania/zwijania/wirtualizacji, inaczej zabije render i czytelność.
- **Balans:** mnożniki są multiplikatywne — krzywe muszą paść z progresją; unikać „ściany" i trywializacji.
  Stroić na żywo (PLAN 20). Osiągnięcia (×) już dają tło mnożników — uwzględnić, by nie podwoić efektu.
- **Klimat:** pule nazw/szablonów mają trzymać satyrę PRL; lepiej mniej rodzin a bogatszych niż tysiąc
  klonów. Liczba to skutek uboczny dobrych rodzin, nie cel sam w sobie.
