# STUDIO.md — Plan budowy „Studia DLC" (dla gry „Kombinat")

> **Adresat dokumentu:** Claude Code (agent wykonawczy).
> **Co to jest:** plan budowy **osobnej strony internetowej** — „Studia DLC" — która jest
> *implementacją kontraktu* opisanego w `DLC.md`. Studio waliduje paczki DLC, konwertuje je z formatu
> roboczego do kanonicznego, stempluje integralnością i (dla właściciela) podpisuje jako „oficjalne".
> Hostowane razem z grą na **Firebase Hosting**, ale **technicznie odrębne** od gry.
>
> **Dokumenty towarzyszące:** `PLAN.md` (budowa samej gry — Studio powstaje w jej Fazie 5);
> `DLC.md` (kontrakt dla twórców paczek — Studio egzekwuje dokładnie ten kontrakt). **Ten plan
> musi pozostać w spójności z `DLC.md`** — gdy jeden się zmienia, drugi też.

---

## 0. Jak czytać ten dokument

Studio jest mniejsze i węższe niż gra, ale ma jeden fragment o najwyższej wadze — **bezpieczeństwo
podpisu** (rozdz. 7). To nie jest miejsce na skróty: cała wartość pieczęci „oficjalne" zależy od
jednej żelaznej reguły (klucz prywatny NIGDY nie trafia do publicznego wdrożenia). Resztę buduj
prosto; ten jeden punkt buduj rygorystycznie.

Zasada nadrzędna: **jedno źródło prawdy schematu**. Studio waliduje paczki względem **dokładnie tego
samego** wersjonowanego schematu, rejestru stabilnych ID i słownika efektów, których używa gra
(rozdz. 8). Inaczej Studio i gra się rozjadą i walidacja zacznie kłamać.

---

## 1. Cel i zakres

Studio ma cztery role. Trzy pierwsze są w pełni **klienckie** (działają w przeglądarce użytkownika,
bez backendu); czwarta jest **wyłącznie dla właściciela** i odseparowana od publicznego wdrożenia.

1. **Hub dokumentacji** — miejsce, gdzie twórca (człowiek lub model) uczy się robić DLC: porady,
   dobre praktyki, wyrenderowany przewodnik, przykładowa paczka, pliki `DLC.md` i pusty szkielet do
   pobrania.
2. **Walidator** — sprawdza wgraną paczkę względem schematu i raportuje błędy **czytelnie** (linia +
   sugerowana poprawka).
3. **Konwerter + stempel integralności + pakowanie** — przepisuje format roboczy (JSONC) do
   **kanonicznego, ścisłego JSON** zoptymalizowanego dla silnika, dodaje sumę kontrolną i pakuje do
   dystrybuowalnej paczki (poprawne → nienaruszone).
4. **Podpis oficjalności (tylko właściciel)** — nadaje paczce kryptograficzny podpis kluczem
   prywatnym właściciela, dzięki któremu gra pokazuje pieczęć „oficjalne". **Odseparowane od
   publicznej strony** (rozdz. 7).

Czego Studio **NIE** jest: nie jest grą, nie symuluje ekonomii, nie wymaga konta do walidacji/
konwersji. Twórca może zrobić, zwalidować, skonwertować i spakować paczkę **bez logowania i bez
wysyłania jej gdziekolwiek** — wszystko dzieje się u niego w przeglądarce.

---

## 2. Architektura i decyzje techniczne

- **Osobna strona statyczna** hostowana na **Firebase Hosting**, pod własną ścieżką/subdomeną,
  oddzielnie od gry. To dwa różne tryby pracy (gra tyka ekonomię w czasie; Studio bierze plik na
  wejściu i zwraca wynik), więc rozdzielenie jest naturalne i upraszcza oba.
- **Wszystkie operacje twórcy są 100% klienckie** — walidacja, konwersja, suma kontrolna, pakowanie.
  Brak backendu jest tu zaletą: zero kosztu serwera, zero opóźnień, i **paczka nigdy nie opuszcza
  przeglądarki** (prywatność i zaufanie twórcy). Interakcja: przeciągnij plik → wynik → pobierz.
- **Stos jak w grze** tam, gdzie to sensowne (ten sam framework — Svelte — i te same tokeny
  designu), ale **osobny build i deploy**. Współdziel kod tylko tam, gdzie to naturalne (parser
  formuł, definicja schematu — patrz rozdz. 8); nie sklejaj Studia z grą na siłę.
- **Web Crypto API** do haszowania (SHA-256), ewentualnego HMAC i **weryfikacji** podpisu.
- **„Najprostsza możliwa" ≠ „prosta".** Architektura ma być minimalna (statyka + logika kliencka),
  ale wykonanie dopracowane — to wizytówka ekosystemu i narzędzie, z którym ludzie spędzą czas
  czytając instrukcje i komunikaty błędów.

---

## 3. Format paczki na wyjściu (koperta dystrybucyjna)

`DLC.md` opisuje format **roboczy** (co pisze twórca). Tu definiujemy format **spakowany** (co
produkuje Studio i co czyta gra). Koperta:

```jsonc
{
  "format": "kombinat-dlc",
  "schemaVersion": 1,
  "packId": "nrd",
  "version": "1.0.0",
  "content": { /* kanoniczny, ścisły JSON paczki — bez komentarzy, deterministycznie znormalizowany */ },
  "integrity": {
    "algo": "SHA-256",
    "hash": "…"            // hash policzony nad kanonicznymi bajtami pola "content"
  },
  "signature": {            // OBECNE TYLKO dla paczek oficjalnych (podpisanych)
    "algo": "ECDSA-P256",   // albo Ed25519 — patrz rozdz. 7
    "publicKeyId": "kombinat-official-v1",
    "value": "…"            // podpis nad kanonicznymi bajtami (content + integrity)
  }
}
```

**Jak gra to czyta** (do zaimplementowania po stronie gry, ale spec żyje tu, bo dotyczy koperty):
1. Liczy hash nad `content`, porównuje z `integrity.hash` → wykrycie uszkodzenia / casualowej
   przeróbki.
2. Jeśli jest `signature` → weryfikuje ją **wbudowanym kluczem publicznym** pasującym do
   `publicKeyId` → pieczęć **oficjalne**.
3. Jeśli brak `signature`, ale schemat i integralność OK → ładuje jako **społecznościowe**.
4. Sprawdza `schemaVersion`; przy rozbieżności stosuje migrację lub odmawia z czytelnym komunikatem.

---

## 4. Moduły funkcjonalne

### 4.1. Hub dokumentacji

Strona główna Studia. Sekcje (treść merytoryczna w klimacie, ale czytelna — rozdz. 6):

- **Wprowadzenie** — „DLC to dane, nie kod; nigdy nie dotykasz kodu gry" (echo `DLC.md` §1).
- **Jak zacząć** — najkrótsza ścieżka: pobierz szkielet → napisz → przeciągnij tutaj → popraw błędy
  → pobierz paczkę.
- **Dobre praktyki** — cztery zasady dobrego DLC (`DLC.md` §2): mnóż rdzeń, otwieraj bank, pogłębiaj
  mechaniki, łagodna degradacja zależności.
- **Przewodnik (renderowany)** — czytelnie wyrenderowana treść `DLC.md` (schemat, język formuł,
  słownik efektów). Najprościej: renderuj `DLC.md` jako źródło, by przewodnik i kontrakt **nigdy się
  nie rozjechały**.
- **Przykładowa paczka** — kompletny przykład „NRD" z `DLC.md` §12, z podświetleniem składni i mapą
  „który fragment realizuje którą zasadę".
- **Pliki do pobrania** — `DLC.md` (pełny kontrakt) oraz **pusty szkielet** (`DLC.md` §13) jednym
  kliknięciem.
- **Tabela stabilnych ID rdzenia** — żywa wersja `DLC.md` §4.2, generowana z rejestru (rozdz. 8), by
  była zawsze aktualna; w tym ID spoza tabeli z `DLC.md` (mechaniki, doktryny, kraje dyplomacji,
  flagi).
- **Słownik efektów** — żywa wersja `DLC.md` §7, też z rejestru.

### 4.2. Walidator

Serce użyteczności Studia. Twórca przeciąga plik roboczy (JSONC), Studio go parsuje i waliduje
względem schematu (rozdz. 8). Sprawdza co najmniej (mirror `DLC.md` §11.1):

- poprawność JSONC (z komunikatem o miejscu błędu składni),
- obecność i poprawność `manifest` (w tym `id` ASCII/małe litery, semver, `schemaVersion`),
- czy każdy `target` / `requires` / `unlockedBy` / `requiresPack` wskazuje na istniejące ID
  (rdzenia z rejestru albo własne, zadeklarowane w paczce),
- **prefiksowanie** własnych ID przez `manifest.id` (ostrzeżenie przy złamaniu konwencji 4.1
  `DLC.md`),
- parsowalność wszystkich formuł (`cost`, `production`, `unlock`, `trigger`, `condition`, `value`…)
  przez **ten sam parser, którego używa gra** (rozdz. 8),
- czy formuły odwołują się tylko do **znanych przestrzeni nazw** (`posiadane`, `zasob`, …) i znanych
  ID,
- czy efekty używają **znanych `type`** i znanych mechanik (efekt spoza słownika → odrzucenie z
  czytelnym komunikatem),
- brak cykli w drzewie (`treeNodes.requires`) i brak odwołań w próżnię,
- brak kolizji ID wewnątrz paczki.

**Styl komunikatów (wymóg).** Każdy błąd: **numer linii + zwięzły opis + sugerowana poprawka**, np.:

> `Linia 41: ulepszenie 'nrd.u880' celuje w generator 'mera450', którego nie ma. Czy chodziło o
> 'mera400'?`
> `Linia 12: ID 'robotron' bez prefiksu paczki — zalecane 'nrd.robotron', by uniknąć kolizji.`

Walidator pokazuje **wszystkie** błędy naraz (nie tylko pierwszy), pogrupowane, z linkiem do
odpowiedniej sekcji przewodnika. To jest gwarancja z `DLC.md`: twórca dostaje konkretną wskazówkę,
nie ciche wysypanie gry.

### 4.3. Konwerter (JSONC → kanoniczny JSON)

Po przejściu walidacji twórca może skonwertować paczkę. Normalizacja (deterministyczna — te same
wejście zawsze daje ten sam wynik, co jest konieczne dla stabilnego hasha):

- usunięcie komentarzy i przecinków końcowych,
- deterministyczne **sortowanie kluczy** i porządek elementów,
- kanonikalizacja formatu liczb i białych znaków (minifikacja),
- (opcjonalna optymalizacja) **wstępne sparsowanie formuł** do postaci AST/zwięzłej, by silnik
  ładował szybciej — tylko jeśli nie komplikuje to koperty; silnik musi i tak umieć parsować formuły
  surowe.

Wynik to pole `content` koperty (rozdz. 3). To jest „przepisanie pliku roboczego na plik
zoptymalizowany dla silnika", o które chodziło.

### 4.4. Stempel integralności

Po konwersji Studio liczy **SHA-256 nad kanonicznymi bajtami `content`** i wpisuje do `integrity`.
To daje stopień **nienaruszone**: wykrywa uszkodzenie pliku i casualową przeróbkę (po edycji bajty
się zmienią i hash przestanie pasować do tego, co gra przelicza).

**Uczciwie:** sam hash w kopercie jest **anti-casual**, nie anti-determined — ktoś zdeterminowany
może przeliczyć hash po edycji. Realne, twarde zabezpieczenie autentyczności daje dopiero **podpis**
(rozdz. 7), bo jego podrobienie wymaga klucza prywatnego. Hash łapie przypadki i casual; podpis łapie
podróbki. Nie udawaj, że hash robi więcej, niż robi.

### 4.5. Pakowanie

Złożenie koperty (rozdz. 3) z `content` + `integrity` (+ `signature`, jeśli podpisane) i — jeśli
paczka jest folderem z zasobami (ikony, pixel-art, dźwięki) — spakowanie całości do jednego archiwum
do pobrania. To finalny, dystrybuowalny artefakt.

### 4.6. Sprawdzanie konfliktów (tryb wielu paczek — przydatne, nie krytyczne)

Opcjonalny tryb: twórca/właściciel wgrywa **kilka** paczek naraz, Studio wykrywa, gdzie dwie celują w
ten sam element rdzenia, i raportuje **kolejność scalania oraz kumulację** (echo `DLC.md` §8.5), np.:

> `Paczki 'nrd' i 'zsrr' modyfikują produkcję 'odra1305'. Efekty skumulują się w kolejności
> nrd→zsrr.`

To uprzedza niespodzianki, zanim gracz załaduje obie paczki w grze.

### 4.7. Podgląd weryfikacji

Tryb „sprawdź paczkę": twórca/gracz wgrywa **gotową** kopertę, Studio przelicza hash i (jeśli jest
podpis) **weryfikuje go kluczem publicznym**, pokazując stopień zaufania (poprawne / nienaruszone /
oficjalne). Weryfikacja jest publiczna — każdy może sprawdzić; tylko właściciel może wytworzyć podpis.

---

## 5. Ścieżki użytkownika (UX)

**Twórca (człowiek lub model), w pełni klienckie, bez logowania:**
1. Wchodzi → uczy się z Huba → pobiera szkielet.
2. Pisze paczkę (JSONC) u siebie.
3. Przeciąga plik → widzi **wszystkie** błędy walidacji z liniami i poprawkami.
4. Poprawia, ponawia, aż czysto.
5. Konwertuje → stempel integralności → pakuje → **pobiera dystrybuowalną paczkę** (stopień
   „nienaruszone", oznaczona jako społecznościowa w grze).

**Właściciel (dodatkowo):**
6. Bierze gotową kopertę i **podpisuje ją lokalnie** swoim kluczem prywatnym (rozdz. 7) → paczka
   „oficjalna" z pieczęcią w grze.

---

## 6. Stylistyka i wygląd

Reguła: **klimat gry w części, ale czytelność nadrzędna.** Studio to narzędzie pracy — ludzie czytają
tu długie instrukcje i komunikaty błędów.

- **Zachowaj tożsamość** — paleta i tokeny designu gry, tematyczne nazwy sekcji w duchu epoki
  („Instrukcja obsługi", „Główny Urząd Standaryzacji DLC", „Stempel kontroli jakości"), klimatyczna
  rama wokół treści.
- **Odpuść ciężki juice i filtry** — w grze mamy CRT, mikrodrgania, ceremonie; tutaj **nie**. To jest
  miejsce, gdzie miganie i krzywizna ekranu szkodzą. Spokojny układ, wysoki kontrast, wzorowo czytelna
  czcionka.
- **Komunikaty błędów muszą być krystaliczne** — to najważniejszy tekst na całej stronie. Kontrast,
  wyraźne wskazanie linii, jednoznaczna sugestia poprawki.
- **Lucide** do ikon UI, jak w grze (rozdz. 10.3 `PLAN.md`).

Czyli: klimatyczna oprawa, ale merytoryka (przewodnik, błędy, podgląd) jest czysta, kontrastowa i
nieruchoma.

---

## 7. Bezpieczeństwo podpisu (rozdział nośny — buduj rygorystycznie)

To jest jedyny fragment Studia, w którym nie ma marginesu na skróty. Cała wartość pieczęci „oficjalne"
opiera się na jednej regule.

### 7.1. Trzy stopnie zaufania (od strony implementacji)

- **Poprawne** — przeszło walidację schematu. Produkowalne przez **publiczne, klienckie** Studio w
  dowolnej przeglądarce. Pełnoprawne DLC, oznaczane w grze jako społecznościowe.
- **Nienaruszone** — `integrity.hash` się zgadza. Klienckie. **Anti-casual** (rozdz. 4.4).
- **Oficjalne** — obecny i poprawny `signature`, zweryfikowany **wbudowanym kluczem publicznym**.
  Produkowalne **wyłącznie** przez właściciela. To stopień kryptograficznie twardy.

### 7.2. Para kluczy

- Właściciel **raz** generuje parę kluczy asymetrycznych przez Web Crypto API. Rekomendacja:
  **Ed25519** (zwięzłe, szybkie) lub **ECDSA P-256** (szeroko wspierane) — wybierz jedno i trzymaj
  się go; oznacz `algo` w kopercie.
- **Klucz publiczny** jest **wbudowany w grę** (do weryfikacji) i może być w Studiu (do podglądu
  weryfikacji). Identyfikowany przez `publicKeyId` (np. `kombinat-official-v1`) — to umożliwia
  rotację (7.5).
- **Klucz prywatny** zostaje **u właściciela, offline**. Nigdy nie jest wbudowany, logowany ani
  przesyłany.

### 7.3. ŻELAZNA REGUŁA

> **Wdrożony, publiczny build Studia NIGDY nie zawiera klucza prywatnego.**

Gdyby publiczny build (który każdy może załadować) miał klucz prywatny, każdy mógłby podpisywać
„oficjalne" paczki — co kasuje cały sens pieczęci. Dlatego **podpisywanie jest operacją wyłącznie
właściciela, na kluczu wczytanym w chwili podpisu, i odseparowaną od publicznej strony.** Klucz nie
może wyciec do wdrożenia w żaden sposób (nie w bundle, nie w zmiennych build-time, nie w repo).

### 7.4. Jak właściciel podpisuje (wybór — oba zachowują regułę 7.3)

- **Opcja A (rekomendowana): lokalne narzędzie CLI.** Mały, samodzielny skrypt (Node, `crypto`/Web
  Crypto), który bierze gotową kopertę + klucz prywatny z lokalnego pliku i emituje kopertę z polem
  `signature`. **Maksymalna izolacja** — klucz nigdy nie zbliża się do niczego webowego, zostaje pod
  fizyczną kontrolą właściciela, offline. Najprostsze i najbezpieczniejsze dla projektu tej skali.
- **Opcja B: lokalny tryb Studia.** Ten sam kod Studia uruchamiany **lokalnie** przez właściciela
  (`dev`/dedykowany build), który wczytuje klucz prywatny z lokalnego pliku w chwili podpisu. Moduł
  podpisu **nie jest częścią publicznego wdrożenia** (wykluczony z deployowanego bundla albo
  bezczynny bez klucza, który nigdy nie jest dołączany).
- **Opcja C (jeśli kiedyś trzeba „produkcyjnie"): Cloud Function** trzymająca klucz w sekretach
  serwera, wywoływana po uwierzytelnieniu właściciela. Trzyma klucz z dala od wszystkich klientów, ale
  dokłada backend i klucz w konfiguracji chmury. Dla kilku osób przerost — **rekomenduję Opcję A**,
  bo klucz zostaje offline u właściciela.

### 7.5. Weryfikacja i rotacja

- **Weryfikacja jest publiczna i tania:** każdy (gra, podgląd w Studiu) sprawdza podpis kluczem
  publicznym pasującym do `publicKeyId`. Wytworzyć podpis może tylko posiadacz klucza prywatnego — i
  to jest twarde.
- **Rotacja:** gdyby klucz prywatny został skompromitowany, właściciel generuje nową parę, podbija
  `publicKeyId` (np. `…-v2`) i dołącza nowy klucz publiczny w aktualizacji gry. Gra może akceptować
  listę znanych kluczy publicznych (stare + nowe) zależnie od polityki; rozważ wersjonowanie i to, co
  ma się stać z paczkami podpisanymi starym kluczem.

### 7.6. Uczciwa granica (spójna z całym projektem)

Warstwa integralności (hash) jest **anti-casual**. Warstwa podpisu jest **kryptograficznie twarda** i
trzyma się **dokładnie dlatego, że klucz prywatny nigdy nie trafia do wdrożenia**. Społecznościowe
paczki są pełnoprawne i grywalne — po prostu nie noszą pieczęci. Nie buduj iluzji, że hash chroni
przed zdeterminowanym przeciwnikiem; prawdziwą autentyczność daje podpis.

---

## 8. Synchronizacja schematu (jedno źródło prawdy — wymóg)

Studio jest tyle warte, ile aktualny jest jego schemat. Wymóg twardy:

- **Schemat, rejestr stabilnych ID rdzenia i słownik efektów** to **jeden, wersjonowany artefakt**,
  publikowany przez grę i **konsumowany zarówno przez grę, jak i Studio**. Nie duplikuj definicji w
  dwóch miejscach — to gwarancja, że walidacja Studia odpowiada rzeczywistości gry.
- **Parser formuł** to **wspólny moduł** używany przez grę i Studio. Inaczej Studio mogłoby uznać za
  poprawną formułę, której gra nie sparsuje (albo odwrotnie).
- **Wersja schematu:** Studio pokazuje, pod którą wersję schematu waliduje, i ostrzega, gdy
  `manifest.schemaVersion` paczki różni się od bieżącej (z informacją, co to znaczy dla zgodności).
- Żywe sekcje Huba (tabela ID 4.1, słownik efektów) **generuj z tego artefaktu**, nie pisz ręcznie —
  inaczej dokumentacja zdezaktualizuje się względem walidatora.

---

## 9. Testy (po każdej pod-fazie, jak w `PLAN.md`)

- **Walidator**: łapie wszystkie zadeklarowane klasy błędów; komunikaty wskazują właściwą linię i
  sensowną poprawkę; pokazuje wiele błędów naraz; nie daje fałszywych alarmów na poprawnych paczkach
  (przetestuj na przykładzie „NRD" z `DLC.md` §12 — musi przejść czysto).
- **Konwerter**: wynik jest **deterministyczny** (to samo wejście → identyczny bajt-w-bajt wynik) i
  semantycznie równoważny wejściu (round-trip: paczka po konwersji opisuje to samo, co przed).
- **Integralność**: po dowolnej edycji `content` hash przestaje pasować (wykrycie manipulacji);
  nietknięta paczka weryfikuje się.
- **Podpis**: poprawny podpis weryfikuje się kluczem publicznym; **podróbka i paczka po edycji NIE
  weryfikują się**; podpisany `publicKeyId` pasuje do klucza w grze.
- **Bezpieczeństwo (krytyczne)**: **potwierdź, że wdrożony bundle Studia nie zawiera klucza
  prywatnego** w żadnej formie (audyt artefaktu build). To jest test, którego nie wolno pominąć.
- **Konflikty**: tryb wielu paczek poprawnie wykrywa wspólne cele i raportuje kolejność scalania.
- **Spójność end-to-end**: paczka zbudowana przez Studio **ładuje się w grze** na właściwym stopniu
  zaufania (społecznościowa vs oficjalna).
- **Mobilna przeglądarka**: Hub i walidator działają na telefonie (twórca może chcieć choć poczytać
  i sprawdzić paczkę z komórki).

---

## 10. Pod-fazy budowy Studia (w obrębie Fazy 5 z `PLAN.md`)

Buduj fazami, z bramką po każdej (agent testuje, właściciel testuje, dopiero dalej).

### Studio A — Hub + Walidator + Konwerter
**Zakres:** statyczna strona na Firebase Hosting; wspólny schemat/rejestr/parser z grą (rozdz. 8);
Hub dokumentacji (renderowany `DLC.md`, przykład, pobieranie szkieletu i `DLC.md`); walidator z
czytelnymi błędami; konwerter JSONC→kanoniczny JSON.
**Bramka:** przykład „NRD" przechodzi walidację czysto; typowe błędy są łapane z liniami i
poprawkami; konwersja deterministyczna.

### Studio B — Integralność + Pakowanie
**Zakres:** SHA-256 nad `content`, złożenie koperty (rozdz. 3), pakowanie folderu z zasobami do
archiwum, podgląd weryfikacji dla paczek „nienaruszonych".
**Bramka:** edycja paczki psuje hash; nietknięta przechodzi; pobrana paczka ładuje się w grze jako
społecznościowa.

### Studio C — Sprawdzanie konfliktów
**Zakres:** tryb wielu paczek; wykrywanie wspólnych celów; raport kolejności scalania.
**Bramka:** dwie paczki celujące w `odra1305` dają poprawny raport kumulacji.

### Studio D — Podpis oficjalności (właściciel)
**Zakres:** para kluczy (7.2); narzędzie podpisu wg **Opcji A** (lokalne CLI) lub B; weryfikacja
podpisu w podglądzie i (po stronie gry) pieczęć oficjalności; **audyt, że klucz prywatny nie jest we
wdrożeniu** (7.3).
**Bramka:** właściciel podpisuje lokalnie; gra weryfikuje pieczęć; podróbka się nie weryfikuje;
**bundle publiczny bez klucza prywatnego** (potwierdzone).

---

## 11. Lista kontrolna agenta (Studio)

- [ ] Studio jest **osobną** stroną statyczną na Firebase Hosting, nie sklejone z grą.
- [ ] Walidacja/konwersja/integralność/pakowanie są **100% klienckie**; paczka nie opuszcza
      przeglądarki; brak wymogu logowania dla twórcy.
- [ ] Schemat, rejestr ID, słownik efektów i parser formuł to **jedno źródło prawdy współdzielone z
      grą** (rozdz. 8); żywe sekcje Huba generowane z artefaktu.
- [ ] Przewodnik renderuje `DLC.md`, by **nigdy się nie rozjechał** z kontraktem.
- [ ] Komunikaty błędów: **linia + opis + sugerowana poprawka**, wszystkie naraz, krystalicznie
      czytelne.
- [ ] Konwersja **deterministyczna**; round-trip zachowuje znaczenie.
- [ ] Koperta wyjściowa zgodna z rozdz. 3; gra czyta ją wg opisanej procedury.
- [ ] **Klucz prywatny NIGDY we wdrożonym bundlu** — żelazna reguła 7.3, potwierdzona testem
      bezpieczeństwa (rozdz. 9).
- [ ] Podpisywanie odseparowane od publicznej strony (Opcja A/B), weryfikacja publiczna kluczem
      publicznym.
- [ ] Stylistyka: klimatyczna rama, ale **czytelność nadrzędna** — bez ciężkiego juice'u i CRT.
- [ ] Spójność end-to-end: paczka ze Studia ładuje się w grze na właściwym stopniu zaufania.
- [ ] **Spójność z `DLC.md`** utrzymana — zmiana jednego pociąga drugie.
