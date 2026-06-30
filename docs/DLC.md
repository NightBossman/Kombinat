# DLC.md — Jak stworzyć DLC do gry „Kombinat"

> **Dla kogo jest ten dokument:** dla DOWOLNEGO twórcy paczki — człowieka albo modelu
> językowego. Jest **samowystarczalny**: jeśli przeczytasz tylko ten plik, masz wszystko, czego
> potrzeba, by zrobić poprawne, działające DLC.
>
> **Jedna obietnica, która rządzi wszystkim poniżej:** *nigdy nie dotykasz kodu gry.* DLC to
> **dane**, nie kod. Piszesz paczkę w prostym formacie tekstowym, gra ją wczytuje, waliduje i wtapia
> w rozgrywkę. Tyle.
>
> **Dokumenty towarzyszące** (nie musisz ich czytać, by zrobić DLC): `PLAN.md` opisuje budowę samej
> gry; `STUDIO.md` opisuje stronę „Studio DLC", przez którą walidujesz, konwertujesz i (jeśli jesteś
> właścicielem) podpisujesz paczki.

---

## 0. Spis treści

1. Model myślowy — jak w ogóle działa DLC
2. Co robi *dobre* DLC (przeczytaj, zanim zaczniesz)
3. Anatomia paczki — pliki, format roboczy, manifest
4. Identyfikatory i nazewnictwo (+ tabela stabilnych ID rdzenia)
5. Schemat treści — każdy typ pole po polu
6. Mini-język formuł (koszty, produkcja, warunki)
7. Prymitywy efektów — słownik tego, co DLC może *zrobić*
8. Wpinanie w rdzeń — modyfikacje, łatki, synergie
9. Tożsamość wizualna paczki
10. Ton i treść — czułe krzywe zwierciadło (ważne!)
11. Walidacja, pakowanie, zaufanie (poprawne → nienaruszone → oficjalne)
12. **Kompletny przykład — pełna mała paczka od początku do końca**
13. Pusty szkielet do skopiowania
14. Lista kontrolna twórcy

---

## 1. Model myślowy

Gra „Kombinat" jest zbudowana jako **silnik konsumujący definicje treści**. Co kluczowe: silnik nie
odróżnia treści bazowej od DLC. Odra 1305, K-202, system łapówek — z punktu widzenia silnika to
wszystko jest treść wczytana z danych. **Twoje DLC to po prostu kolejna paczka w dokładnie tym samym
formacie co treść bazowa.** Niczym się nie różni poza tym, że dochodzi później.

Z tego płyną trzy praktyczne fakty:

- **Nie potrzebujesz znać kodu gry.** Potrzebujesz znać *format danych* — a on jest w tym
  dokumencie w całości.
- **Możesz odwoływać się do treści rdzenia** (np. pomnożyć produkcję istniejącego budynku Odra 1305)
  przez jego **stabilny identyfikator** (rozdz. 4).
- **Możesz wprowadzać własną, zupełnie nową treść** — budynki, ulepszenia, zdarzenia, osiągnięcia,
  węzły drzewa, notki historyczne, teksty na pasek.

Paczka, gdy przejdzie walidację, **działa na czystym silniku** — nie wymaga żadnych poprawek w grze.
(Istnieje opcjonalny mechanizm „łatek" dla rzeczy, których schemat jeszcze nie wyraża — rozdz. 8.4 —
ale to dodatek, nigdy warunek konieczny.)

---

## 2. Co robi *dobre* DLC

Zrobienie *poprawnego* DLC to spełnienie schematu. Zrobienie *dobrego* DLC to coś więcej. Cztery
zasady, które odróżniają paczkę, w którą chce się grać, od paczki, która tylko „dokłada budynki":

### 2.1. Mnóż rdzeń, nie doklejaj obok

Najważniejsza zasada. Wartość całości to NIE `rdzeń + twoja_paczka`. To
`rdzeń × współczynnik + twoja_paczka × współczynnik + …` — DLC ma **mnożyć** zaangażowanie z
rdzeniem i z innymi paczkami. W praktyce: preferuj efekty, które **wzmacniają istniejące budynki i
zasoby** (np. ulepszenie podbijające produkcję rdzennej Odry), zamiast tworzyć osobną wysepkę żyjącą
obok reszty. Minigra/system żyjący zupełnie obok rdzenia jest dopuszczalny tylko z mocnym
uzasadnieniem tematycznym.

### 2.2. Otwieraj bank

Najlepsze DLC daje moment „Łoo, nie wiedziałem, że tu tego tyle!". Zrób tak, by Twoja paczka
zawierała coś o **ukrytej głębi** — system, którego skali gracz nie zna, dopóki go nie odblokuje, a
który **rzuca cień** zanim się otworzy (zablokowany kafelek, wyszarzona sylwetka osiągnięcia). Węzeł
drzewa Denominacji odblokowujący całą nową mechanikę to wzorcowy „bank".

### 2.3. Pogłębiaj istniejące mechaniki

Pakiet narodowy (ZSRR, NRD, Japonia…) ma być **nowym konarem na istniejącym drzewie**, nie nową
skórką. „NRD" pogłębia bank przemytu i dyplomacji (Robotron, embargo CoCom), a nie dorzuca
niepowiązaną zabawkę.

### 2.4. Łagodna degradacja zależności

Jeśli Twoja paczka współgra z inną (np. wspólne mechaniki RWPG dla „ZSRR" + „NRD"), zrób to przez
**synergię** (rozdz. 8.3), a nie twardą zależność. Paczka **musi działać samodzielnie**, gdy tamtej
nie ma; synergia to opcjonalny bonus, gdy obie są obecne.

---

## 3. Anatomia paczki

### 3.1. Pliki

Paczka to **pojedynczy plik tekstowy** (format roboczy poniżej) albo **folder** z takim plikiem i
opcjonalnymi zasobami (ikony, pixel-art, próbki dźwięku). Do dystrybucji folder pakuje się do jednego
archiwum. Po przejściu przez Studio dostajesz **spakowaną, kanoniczną paczkę** z sumą kontrolną (i —
jeśli właściciel — z podpisem). Patrz rozdz. 11.

### 3.2. Format roboczy: JSONC

Paczkę piszesz w **JSONC** — czyli JSON, ale z dwoma udogodnieniami:
- **komentarze** (`// …` oraz `/* … */`),
- **przecinki na końcu list/obiektów** (trailing commas).

Zarówno gra, jak i Studio akceptują JSONC. Studio przy konwersji usuwa komentarze i przecinki,
produkując **kanoniczny, ścisły JSON** dla silnika. Czyli: piszesz wygodnie, silnik dostaje wersję
zoptymalizowaną. To jest właśnie sens konwertera.

> Jeśli jesteś modelem językowym: możesz spokojnie emitować zwykły, ścisły JSON — to też jest
> poprawny JSONC. Komentarze są dla wygody człowieka.

### 3.3. Konwencja nazw kluczy (przeczytaj raz, oszczędzi zamieszania)

- **Klucze strukturalne** (nazwy pól schematu: `manifest`, `generators`, `production`, `cost`…) są
  **po angielsku** i bez polskich znaków. To stałe tokeny formatu.
- **Przestrzenie nazw w formułach** (zmienne stanu gry: `posiadane`, `zasob`, `prestiz`,
  `relacja`…) są **po polsku** — to słownik świata gry.
- **Wartości treści** (nazwy budynków, opisy, flavor text, teksty na pasek) piszesz **po polsku** w
  klimacie epoki.

### 3.4. Manifest

Każda paczka zaczyna się od `manifest`. Pola:

```jsonc
{
  "manifest": {
    "id": "nrd",                       // unikalny ID paczki, ASCII, małe litery. To też prefiks
                                        // przestrzeni nazw Twojej treści (patrz rozdz. 4).
    "name": "NRD — Bratnia Republika",  // nazwa wyświetlana (po polsku, w klimacie)
    "version": "1.0.0",                // semver
    "author": "twoj_nick",
    "description": "Robotron, embargo i czujne oko bratniego wywiadu.",
    "schemaVersion": 1,                // wersja schematu silnika, pod którą piszesz
    "requires": [],                    // OPCJONALNE: ID paczek wymaganych twardo. Preferuj
                                        // synergie (8.3) zamiast twardych wymagań.
    "tags": ["narodowe", "blok-wschodni"],
    "visualIdentity": { /* rozdz. 9 */ }
  },

  // ...dalej sekcje treści: "resources", "generators", "upgrades", itd.
}
```

---

## 4. Identyfikatory i nazewnictwo

### 4.1. Reguły ID

- ID są **ASCII, małe litery**, bez spacji i polskich znaków (np. `robotron`, `u880`, `rwpg_kanal`).
- **Prefiksuj całą swoją treść ID paczki**, np. paczka `nrd` daje budynek `nrd.robotron`, ulepszenie
  `nrd.u880`. To zapobiega kolizjom, gdy gracz ma włączonych wiele DLC, i jest konieczne dla
  deterministycznego scalania (rozdz. 8.5).
- **Wyjątek:** gdy *odwołujesz się* do treści rdzenia (żeby ją wzmocnić/zmodyfikować), używasz jej
  **oryginalnego ID rdzenia** (bez prefiksu), bo ono już istnieje.

### 4.2. Stabilne ID rdzenia (do wpinania się)

Te identyfikatory są stabilne — możesz na nie celować efektami (rozdz. 7) i łatać je (rozdz. 8.4).

**Zasoby:**

| ID | zasób |
|---|---|
| `cykle` | cykle / dane (zasób obfity, „ciasteczka") |
| `dewizy` | dewizy / bony (zasób rzadki, twarda waluta) |
| `odznaczenia` | odznaczenia (waluta prestiżowa drzewa Denominacji) |

**Generatory (drabina rdzenia):**

| ID | budynek |
|---|---|
| `liczydlo` | liczydło / urzędnik |
| `arytmometr` | arytmometr |
| `tabulator` | tabulator na karty perforowane |
| `mera400` | MERA-400 |
| `k202` | K-202 |
| `odra1305` | Odra 1305 |
| `osrodek` | ośrodek obliczeniowy |
| `spectrum` | ZX Spectrum + giełda |
| `meritum` | Meritum / Elwro 800 Junior |
| `mazovia` | Mazovia / klony PC |
| `spolka` | zalążek spółki / sieci |

> Pełny, aktualny rejestr stabilnych ID (w tym mechanik, doktryn, krajów dyplomacji i flag) jest
> dostępny w Studiu DLC — sprawdzaj tam, jeśli celujesz w coś spoza powyższej listy.

---

## 5. Schemat treści

Paczka po manifeście zawiera sekcje, każda jest **listą obiektów** danego typu. Wszystkie sekcje są
opcjonalne — dajesz tylko te, których używasz. Poniżej każdy typ pole po polu, z mini-przykładem.

### 5.1. `resources` — zasoby

Własny zasób ma sens, gdy wprowadzasz nową oś ekonomii. Często nie potrzebujesz żadnego (używasz
`cykle`/`dewizy`).

```jsonc
{ "id": "nrd.marki", "name": "marki NRD", "description": "Twarda waluta zza Odry.",
  "format": "named",            // "named" | "scientific" (jak gracz widzi liczbę; gracz i tak może
                                 // nadpisać w ustawieniach)
  "prestige": false }            // czy to waluta prestiżowa (resetowana inaczej)
```

### 5.2. `generators` — budynki

Główny element produkcyjny.

```jsonc
{
  "id": "nrd.robotron",
  "name": "Mainframe Robotron",
  "flavor": "Enerdowska solidność. Działa, dopóki nie zabraknie części z importu.",
  "costResource": "dewizy",          // czym się płaci
  "cost": "120 * 1.16 ^ posiadane",  // formuła kosztu (rozdz. 6); 'posiadane' = ile już masz tego
  "outputResource": "cykle",         // co produkuje
  "production": "8",                 // produkcja na sztukę/sekundę (formuła)
  "unlock": "posiadane.odra1305 >= 10",  // warunek pojawienia się (formuła logiczna)
  "accent": "inherit"                // "inherit" = użyj akcentu paczki (rozdz. 9), albo własny kolor
}
```

### 5.3. `upgrades` — ulepszenia

Tu najczęściej realizujesz zasadę „mnóż rdzeń" (2.1) — celując efektem w istniejący budynek.

```jsonc
{
  "id": "nrd.u880",
  "name": "Procesor U880",
  "flavor": "Enerdowski klon Z80. Oficjalnie 'własna konstrukcja'.",
  "costResource": "dewizy",
  "cost": "5000",
  "unlock": "posiadane.nrd.robotron >= 5",
  "once": true,                       // jednorazowe (większość ulepszeń)
  "effects": [                        // lista prymitywów efektów (rozdz. 7)
    { "type": "multiplyProduction", "target": "generator:mera400", "value": "2" },
    { "type": "multiplyProduction", "target": "generator:odra1305", "value": "1.5" }
  ]
}
```

### 5.4. `milestones` — kamienie milowe

Progi z trwałym efektem, zwykle bez kosztu (odpalają się same po osiągnięciu warunku).

```jsonc
{ "id": "nrd.bratnia_dostawa", "name": "Bratnia dostawa",
  "trigger": "posiadane.nrd.robotron >= 25",
  "effects": [ { "type": "multiplyProduction", "target": "resource:cykle", "value": "1.1" } ] }
```

### 5.5. `achievements` — osiągnięcia

Mają być liczne i każde daje mały trwały mnożnik (aktywowany w grze węzłem drzewa). Mogą być
sekretne (sylwetka ukryta do zdobycia — to „cień banku").

```jsonc
{
  "id": "nrd.bruderland",
  "name": "Freundschaft!",
  "description": "Posiadaj 50 mainframe'ów Robotron.",
  "condition": "posiadane.nrd.robotron >= 50",
  "secret": false,
  "multiplier": "1.02"               // mnożnik do przyrostu (aktywny, gdy gracz odblokuje to w drzewie)
}
```

### 5.6. `events` — zdarzenia (w stylu Paradoxu)

Modalne mini-historyjki: pojedyncza decyzja albo **łańcuch** rozłożony w czasie. To serce klimatu i
„otwierania banku" (gracz nie wie, czy to jednorazówka, czy początek czegoś).

```jsonc
{
  "id": "nrd.stasi_wizyta",
  "title": "Uprzejma wizyta",
  "body": "Towarzysz z bratniej służby 'przejazdem' interesuje się Twoim ośrodkiem. Pyta o drobiazgi. Na razie.",
  "trigger": "posiadane.nrd.robotron >= 10 and flaga.nrd.stasi_zna == 0",
  "weight": 1,                       // względna częstość, gdy wyzwalacz spełniony (dla zdarzeń losowych)
  "options": [
    {
      "label": "Współpracować uprzejmie",
      "effects": [
        { "type": "setFlag", "flag": "nrd.stasi_zna", "value": 1 },
        { "type": "modifyRelation", "country": "nrd", "delta": 5 }
      ]
    },
    {
      "label": "Zbywać ogólnikami",
      "effects": [
        { "type": "setFlag", "flag": "nrd.stasi_zna", "value": 1 },
        { "type": "triggerEvent", "event": "nrd.stasi_powrot" }   // ogniwo łańcucha
      ]
    }
  ]
}
```

Łańcuch tworzysz, gdy jedna opcja `triggerEvent` na kolejne zdarzenie. Zdarzenie bez `options` to
sama konsekwencja (komunikat bez wyboru) — wtedy daj pole `effects` na poziomie zdarzenia.

### 5.7. `treeNodes` — węzły drzewa Denominacji

Kupowane za odznaczenia w oknie między Denominacją a nowym startem. **Tu robisz najmocniejsze banki**
— węzeł odblokowujący całą mechanikę. Odblokowania z drzewa są **trwałe** (przeżywają reset).

```jsonc
{
  "id": "nrd.rwpg_kanal",
  "name": "Kanał RWPG",
  "description": "Stałe łącze handlowe z bratnimi krajami. Tańszy import sprzętu.",
  "cost": "3",                       // koszt w odznaczeniach
  "requires": ["nrd.akta_wstepne"],  // poprzednie węzły, które trzeba mieć
  "fogged": true,                    // czy zamglony (ukryty, póki nie dojdziesz w pobliże) — bank!
  "kind": "unlockMechanic",          // typ węzła (patrz niżej)
  "effects": [
    { "type": "divideCost", "target": "generator:nrd.robotron", "value": "1.5" }
  ]
}
```

Wartości `kind` (zgodne z typologią gry): `multiplier`, `unlockMechanic`, `unlockMinigame`,
`unlockUpgradeSet`, `enableAchievementMultipliers`, `start` (zaczynaj nową rozgrywkę z czymś
odblokowanym), `gate` (kosztowne wrota do dalszej części drzewa), `keystone` (potężny, zmienia reguły,
często z kosztem — np. produkcja ×3, ale kontrole 2× częstsze).

### 5.8. `lexicon` — wpisy Leksykonu PRL

Prawdziwe notki historyczne odsłaniane przy odblokowaniu powiązanej treści. To osobny bank
(kompletowanie Leksykonu = cel) i nagroda dla graczy-historyków. **Pisz rzetelnie** — to nośnik
autentycznych ciekawostek.

```jsonc
{ "id": "nrd.lex_u880", "name": "Procesor U880",
  "unlockedBy": "upgrade:nrd.u880",
  "text": "U880 produkowany przez VEB Mikroelektronik 'Karl Marx' w Erfurcie był funkcjonalnym odpowiednikiem Zilog Z80, wytwarzanym bez licencji. Zasilał m.in. komputery KC 85 i robotronowskie maszyny biurowe." }
```

### 5.9. `ticker` — wpisy na górny pasek

Krótkie linijki w klimacie teletekstu/Dziennika. Cztery strumienie: `advice`, `propaganda`,
`easter`, `notice`. Mogą mieć warunek kontekstowy.

```jsonc
{ "id": "nrd.tick_01", "stream": "propaganda",
  "text": "Bratnia NRD melduje: nadwyżka eksportowa towarzyszy planowi z dokładnością do mikrona." },
{ "id": "nrd.tick_02", "stream": "easter",
  "text": "Plotka głosi, że pewien Robotron do dziś liczy listę płac z 1981 roku. I jeszcze nie skończył.",
  "condition": "posiadane.nrd.robotron >= 30" }
```

### 5.10. `characters` — kadra

Werbowane archetypy: pasywny bonus + własna linia zdarzeń.

```jsonc
{ "id": "nrd.inzynier_klaus", "name": "Inżynier Klaus",
  "archetype": "specjalista-z-importu",
  "flavor": "Punktualny do bólu. Wie, gdzie kupić części, o które tu nikt nie pyta.",
  "passive": [ { "type": "multiplyProduction", "target": "generator:nrd.robotron", "value": "1.25" } ],
  "eventLine": "nrd.klaus_intro" }   // ID pierwszego zdarzenia jego linii (opcjonalne)
```

---

## 6. Mini-język formuł

Pola `cost`, `production`, `unlock`, `trigger`, `condition`, `value` itd. przyjmują **wyrażenia** w
wąskim, bezpiecznym języku nad stanem gry. To **nie jest** pełny kod — nie może zrobić niczego poza
policzeniem liczby albo wartości logicznej z odczytu stanu (zero dostępu do sieci, plików, DOM, zero
pętli i przypisań).

### 6.1. Operatory

`+ - * / ^ %` (arytmetyka), `< <= > >= == !=` (porównania), `and or not` (logika), nawiasy `( )`.

### 6.2. Funkcje

`min, max, floor, ceil, round, abs, sqrt, log, log10, pow`.

### 6.3. Przestrzenie nazw (odczyt stanu)

| zapis | znaczenie |
|---|---|
| `posiadane` | ile masz *tego* generatora (w jego własnych polach `cost`/`production`) |
| `posiadane.<id>` | ile masz generatora o danym ID (np. `posiadane.odra1305`, `posiadane.nrd.robotron`) |
| `zasob.<id>` | aktualna ilość zasobu (np. `zasob.dewizy`) |
| `tempo.<id>` | bieżąca produkcja zasobu na sekundę (np. `tempo.cykle`) — działa w warunkach/odblokowaniach |
| `prestiz.liczba` | liczba wykonanych Denominacji |
| `prestiz.odznaczenia` | aktualne odznaczenia |
| `osiagniecia.zdobyte` | liczba zdobytych osiągnięć (równoważne `osiagniecia`) |
| `relacja.<kraj>` | wartość relacji dyplomatycznej (skala 0…1000; np. `relacja.nrd`, `relacja.czechoslowacja`) |
| `doktryna.<id>` | `1`, gdy obowiązuje doktryna o tym ID, inaczej `0` (np. `doktryna.rdzen.dok_przemysl`) |
| `doktryna.aktywna` | `1`, gdy obowiązuje JAKAKOLWIEK doktryna ze Zjazdu (inaczej `0`) |
| `flaga.<id>` | flaga logiczna ustawiana przez efekty/zdarzenia (0/1) |
| `licznik.<klucz>` | liczniki rozgrywki (np. `licznik.lapowki`, `licznik.zjazdy`, `licznik.tasma_lacznie`) |
| `kadra` | liczba zwerbowanych postaci |
| `maszyny.rodzaje` | ile RÓŻNYCH typów maszyn posiadasz (≥1 szt.) |
| `czas.sesja` | sekundy bieżącej sesji |
| `czas.poraDnia` | godzina (0–23) — np. do treści typu „graj o 3:00" |

> Przestrzenie `tempo`, `relacja` i `doktryna` są **żywe** (mechaniki produkcji, dyplomacji i Zjazdu
> PZPR już działają) — w formule odczytasz z nich realne wartości stanu gry, nie zera-zaślepki.

### 6.4. Przykłady

```text
// koszt rosnący wykładniczo
"120 * 1.16 ^ posiadane"

// produkcja z synergią od innego budynku
"8 * (1 + 0.05 * posiadane.osrodek)"

// odblokowanie po spełnieniu dwóch warunków
"posiadane.odra1305 >= 10 and zasob.dewizy >= 500"

// warunek zależny od relacji (skala 0…1000) i flagi
"relacja.nrd >= 200 and flaga.nrd.stasi_zna == 1"
```

---

## 7. Prymitywy efektów

Pola `effects`/`passive` to listy obiektów-efektów. `target` wskazuje, na co efekt działa:
`global` | `resource:<id>` | `generator:<id>`. Pola `value`/`amount`/`delta` przyjmują formuły.

Każdy efekt MODYFIKUJĄCY (mnożniki/koszty/dodatki) może mieć opcjonalne pole **`condition`** —
formułę logiczną „zastosuj ten efekt **tylko gdy**…". Tak realizujesz warunkowe wzmocnienie rdzenia
(„pomnóż produkcję `odra1305`, gdy masz ≥5 swoich budynków"):

```jsonc
{ "type": "multiplyProduction", "target": "generator:odra1305", "value": "1.5",
  "condition": "posiadane.mojadlc_robotron >= 5" }
```

| `type` | działanie |
|---|---|
| `multiplyProduction` | mnoży produkcję (target: global / resource / generator) |
| `multiplyCost` | mnoży koszt (drożej) |
| `divideCost` | dzieli koszt (taniej) |
| `addFlat` | dodaje stałą do produkcji targetu |
| `grantResource` | jednorazowo dodaje zasób (`resource:<id>`, `amount`) |
| `unlock` | odsłania/uaktywnia wskazaną treść (`generator:`/`upgrade:`/`event:`/`treeNode:` …) |
| `setFlag` | ustawia flagę (`flag`, `value`) |
| `modifyRelation` | zmienia relację dyplomatyczną (`country`, `delta`) |
| `triggerEvent` | odpala zdarzenie (`event`) — do łańcuchów |
| `enableMechanic` | włącza mechanikę gry (`mechanic:<id>`) — typowo w węźle drzewa „otwierającym bank" |
| `enableAchievementMultipliers` | aktywuje mnożniki z osiągnięć (specjalny węzeł drzewa) |
| `startWith` | przy starcie nowej rozgrywki gracz ma już daną treść/zasób (węzeł `start`) |

> Słownik efektów może się rozszerzać wraz z grą. **Aktualną, autorytatywną listę dostępnych
> efektów i mechanik trzyma Studio DLC** — jeśli celujesz w coś spoza tej tabeli, sprawdź tam. Studio
> odrzuci efekt, którego silnik nie zna, z czytelnym komunikatem.

---

## 8. Wpinanie w rdzeń

### 8.1. Nowa treść

Najprostszy przypadek: dodajesz obiekty do sekcji (`generators`, `upgrades`…) z **własnymi,
prefiksowanymi ID**. Nic poza tym.

### 8.2. Wzmacnianie rdzenia efektem (najczęstsze)

Celuj efektem w **oryginalne ID rdzenia**. To jest realizacja zasady „mnóż rdzeń":

```jsonc
{ "type": "multiplyProduction", "target": "generator:odra1305", "value": "1.5" }
```

Dorzuć pole `condition` (rozdz. 7), jeśli wzmocnienie ma być **warunkowe** — to zwykle lepsze niż
łatka (8.4), bo wpina się w rdzeń bez zmiany jego struktury.

### 8.3. Synergie (łagodna degradacja)

Bonus aktywny **tylko gdy obecna jest inna paczka**. Paczka działa bez tego; synergia to ekstra.

```jsonc
"synergies": [
  {
    "requiresPack": "zsrr",
    "note": "Wspólne mechanizmy RWPG, gdy obecny jest też pakiet ZSRR.",
    "effects": [
      { "type": "multiplyProduction", "target": "resource:cykle", "value": "1.15" }
    ]
  }
]
```

### 8.4. Łatki (opcjonalne — „pre-patch", nigdy konieczne)

Gdy chcesz zmienić *strukturę* istniejącej treści rdzenia (nie tylko ją mnożyć efektem), użyj sekcji
`patches`. **To jest dodatek dla rzeczy, których schemat jeszcze nie wyraża** — paczka ma działać i
bez tego. Jeśli łatka jest *konieczna* do działania paczki, robisz coś źle.

Cel łatki ma format `<rodzaj>:<id>` (`generator:`, `upgrade:`, `milestone:`, `achievement:`,
`event:`, `resource:`, `doctrine:`, `diplomacy:`, `character:`, `bribe:`, `lexicon:`, `treeNode:`).
Dwa narzędzia:

- **`set`** — nadpisuje pola celu (np. `flavor`, `cost`, `name`). Pole `id` jest **nietykalne**.
- **`addCondition`** — dokleja warunek (logiczne **AND**) do pola warunkowego celu: `unlock`
  (generator/ulepszenie), `trigger` (kamień milowy/zdarzenie) albo `condition` (osiągnięcie).

```jsonc
"patches": [
  { "target": "generator:spectrum", "set": { "flavor": "Nowy opis w kontekście tego DLC." } },
  { "target": "generator:mazovia", "addCondition": "posiadane.odra1305 >= 3" }
]
```

> Łatka w **nieistniejący cel** to błąd (walidacja Cię złapie). Gdy dwie paczki łatają to samo pole,
> wygrywa **ostatnia** wg kolejności scalania (8.5) — Studio ostrzega o takiej kumulacji.

### 8.5. Determinizm scalania

Gdy kilka paczek dotyka tej samej treści rdzenia, gra nakłada je w zdefiniowanej kolejności i
**kumuluje** efekty. Dlatego prefiksuj swoje ID (4.1) i preferuj mnożenie nad nadpisywaniem
struktury. Studio ostrzega z wyprzedzeniem, gdy dwie paczki celują w ten sam element („paczka A i B
modyfikują `odra1305` — kumulacja A→B").

---

## 9. Tożsamość wizualna paczki

Twoja treść ma być **mechanicznie wpięta bez szwu, ale wizualnie rozpoznawalna** (subtelnie). Akcent
**deklarujesz raz w manifeście**, a gra nakłada go automatycznie na całą Twoją treść — nie dłubiesz w
stylach per element.

```jsonc
"visualIdentity": {
  "accentColor": "#8a1f1f",          // kolor krawędzi/poświaty/znacznika kafelków
  "icon": "robotron.svg",            // ikona-pieczęć (plik w folderze paczki) lub nazwa ikony Lucide
  "font": null,                      // opcjonalny krój nagłówków (null = krój gry)
  "texture": null                    // opcjonalna dyskretna faktura tła kafelka
}
```

Gra dodatkowo oznaczy Twoją paczkę sygnaturą **rangi zaufania** (rozdz. 11): inny akcent dla
**oficjalnych** (podpisanych) niż **społecznościowych**. O to nie musisz dbać — robi to gra.

---

## 10. Ton i treść — czułe krzywe zwierciadło

To jest sekcja, którą paczka do *tej* gry musi potraktować poważnie. Gra ma jeden, konkretny rejestr,
i dobre DLC w niego trafia.

### 10.1. Rejestr

**Czułe krzywe zwierciadło prawdziwych wydarzeń.** Ani przygnębiające, ani śmiertelnie poważne, ani
kompletna autoparodia. Satyra celuje w **absurdy systemu** — plan, propagandę sukcesu, deficyt,
kolejkę, załatwianie spod lady — z **prawdziwą fakturą epoki**. Wzorce: dowcipy Radia Erewań, plansze
Dziennika Telewizyjnego, „wykonanie planu w 143%".

### 10.2. Co robić

- Żartuj z **mechanizmów systemu** (biurokracja, norma, plan, propaganda).
- Trzymaj się **realiów** — prawdziwe maszyny, instytucje, zjawiska. Autentyczność jest śmieszniejsza
  niż zmyślenie.
- Wkładaj **rzetelne ciekawostki** do Leksykonu (5.8) — to siła tej gry.

### 10.3. Czego nie robić

- **Nie żartuj z autentycznej ludzkiej krzywdy.** Krzywe zwierciadło celuje w absurd systemu, nigdy w
  cierpienie ludzi.
- **Nie schodź w przygnębienie** ani w mrok bez puenty.
- **Nie rób czystej parodii** oderwanej od realiów — gra nie jest „Nagą bronią".

### 10.4. Przykłady tonu (z gry — naśladuj)

> „Towarzysze, wykonanie planu w 143%! Pozostałe 57% to oczywiście błąd statystyczny."
> „W Pewexie rzucili Atari. Kolejka od wczoraj. Stoi też towarzysz dyrektor, ale incognito."
> „Porada dnia: kartę perforowaną można odwrócić. Drugiej strony i tak nikt nie sprawdza."

### 10.5. Wrażliwe tematy

Część realiów epoki ociera się o prawdziwą grozę (np. wydarzenia 1986 roku i panika z płynem Lugola;
stan wojenny). Da się je ująć w lekko-absurdalnym tonie, ale to **dokładnie te miejsca, gdzie żart
łatwo zgrzyta**. Jeśli ich dotykasz — rób to ostrożnie, oznacz w opisie paczki, że zdarzenie dotyka
wrażliwego tematu, i celuj w absurd *reakcji systemu*, nie w ludzką tragedię. Gdy nie masz pewności —
nie wchodź w to.

---

## 11. Walidacja, pakowanie, zaufanie

### 11.1. Walidacja

Zanim paczka trafi do gry, przepuść ją przez **Studio DLC**. Walidacja sprawdza m.in.:
- czy każdy `target`/`requires`/`unlockedBy` wskazuje na istniejące ID (rdzenia albo Twoje),
- czy wszystkie formuły się parsują,
- czy nie ma odwołań w próżnię ani cykli w drzewie,
- czy efekty używają znanych `type` i mechanik,
- czy nie ma kolizji ID i czy konflikty scalania są jawne.

Błędy są **czytelne i wskazują linię oraz poprawkę**, np.:
> `Linia 41: ulepszenie 'nrd.u880' celuje w generator 'mera450', którego nie ma. Czy chodziło o
> 'mera400'?`

To jest gwarancja dla Ciebie: dostajesz konkretną wskazówkę, a nie ciche wysypanie się gry.

### 11.2. Trzy stopnie zaufania

Gra rozpoznaje paczki na trzech poziomach. Zrozum, co każdy oznacza — i czego **nie** oznacza:

- **Poprawne** — paczka przeszła walidację schematu. **Taką paczkę może wyprodukować każdy.** Gra ją
  załaduje i oznaczy jako **społecznościową**. To pełnoprawne DLC — nie potrzebujesz niczego więcej,
  by tworzyć i dzielić się paczkami.
- **Nienaruszone** — suma kontrolna integralności się zgadza, czyli paczka nie była ruszana od
  konwersji w Studiu. Wykrywa przypadkowe uszkodzenie i casualową przeróbkę (ktoś otworzył plik i
  podkręcił liczby).
- **Oficjalne** — paczka jest **podpisana kluczem prywatnym właściciela gry**. Gra pokazuje wtedy
  pieczęć autentyczności. **Tego stopnia nie nadasz samodzielnie** — podpis może wytworzyć wyłącznie
  właściciel, bo tylko on ma klucz prywatny. To celowe: pieczęć „oficjalne" znaczy „naprawdę od
  zespołu gry".

### 11.3. Uczciwie o tym, co gwarantuje podpis

Warstwa integralności jest **anti-casual, nie anti-determined** — utrudnia podróbkę przeciętnemu
użytkownikowi, ale nie zatrzyma zdeterminowanego. Twarda jest dopiero **weryfikacja podpisu**: każdy
może *sprawdzić* kluczem publicznym, że paczka jest autentyczna, ale *wytworzyć* taki podpis może
tylko posiadacz klucza prywatnego. Społecznościowe paczki są **pełnoprawne** — po prostu nie noszą
pieczęci. Nie potrzebujesz pieczęci, żeby Twoje DLC było „prawdziwe" i grywalne.

---

## 12. Kompletny przykład — pełna mała paczka

Poniżej **działająca, minimalna paczka „NRD"** demonstrująca wszystko, co istotne: nowy budynek
wpięty w ekonomię, ulepszenie **mnożące rdzeń**, łańcuch zdarzeń, osiągnięcie, węzeł drzewa
**otwierający bank**, synergię z **łagodną degradacją**, rzetelny Leksykon, teksty na pasek i
tożsamość wizualną. Możesz jej użyć jako wzorca.

```jsonc
{
  "manifest": {
    "id": "nrd",
    "name": "NRD — Bratnia Republika",
    "version": "1.0.0",
    "author": "przyklad",
    "description": "Robotron, embargo i czujne oko bratniego wywiadu. Pogłębia import i dyplomację.",
    "schemaVersion": 1,
    "requires": [],
    "tags": ["narodowe", "blok-wschodni"],
    "visualIdentity": {
      "accentColor": "#8a1f1f",
      "icon": "robotron.svg",
      "font": null,
      "texture": null
    }
  },

  "generators": [
    {
      "id": "nrd.robotron",
      "name": "Mainframe Robotron",
      "flavor": "Enerdowska solidność. Działa, dopóki nie zabraknie części z importu.",
      "costResource": "dewizy",
      "cost": "120 * 1.16 ^ posiadane",
      "outputResource": "cykle",
      "production": "8 * (1 + 0.03 * posiadane.osrodek)",
      "unlock": "posiadane.odra1305 >= 10",
      "accent": "inherit"
    }
  ],

  "upgrades": [
    {
      // To jest serce zasady "mnóż rdzeń": ulepszenie z DLC podbija RDZENNE budynki.
      "id": "nrd.u880",
      "name": "Procesor U880",
      "flavor": "Enerdowski klon Z80. Oficjalnie 'własna konstrukcja socjalistycznej myśli'.",
      "costResource": "dewizy",
      "cost": "5000",
      "unlock": "posiadane.nrd.robotron >= 5",
      "once": true,
      "effects": [
        { "type": "multiplyProduction", "target": "generator:mera400", "value": "2" },
        { "type": "multiplyProduction", "target": "generator:odra1305", "value": "1.5" },
        { "type": "multiplyProduction", "target": "generator:nrd.robotron", "value": "1.5" }
      ]
    }
  ],

  "milestones": [
    {
      "id": "nrd.bratnia_dostawa",
      "name": "Bratnia dostawa",
      "trigger": "posiadane.nrd.robotron >= 25",
      "effects": [ { "type": "multiplyProduction", "target": "resource:cykle", "value": "1.1" } ]
    }
  ],

  "achievements": [
    {
      "id": "nrd.bruderland",
      "name": "Freundschaft!",
      "description": "Posiadaj 50 mainframe'ów Robotron.",
      "condition": "posiadane.nrd.robotron >= 50",
      "secret": false,
      "multiplier": "1.02"
    },
    {
      // sekretne — sylwetka ukryta do zdobycia (rzuca "cień banku")
      "id": "nrd.ostatni_liczy",
      "name": "I jeszcze nie skończył",
      "description": "???",
      "condition": "posiadane.nrd.robotron >= 100 and czas.sesja >= 3600",
      "secret": true,
      "multiplier": "1.05"
    }
  ],

  "events": [
    {
      "id": "nrd.stasi_wizyta",
      "title": "Uprzejma wizyta",
      "body": "Towarzysz z bratniej służby 'przejazdem' interesuje się Twoim ośrodkiem. Pyta o drobiazgi. Na razie.",
      "trigger": "posiadane.nrd.robotron >= 10 and flaga.nrd.stasi_zna == 0",
      "weight": 1,
      "options": [
        {
          "label": "Współpracować uprzejmie",
          "effects": [
            { "type": "setFlag", "flag": "nrd.stasi_zna", "value": 1 },
            { "type": "modifyRelation", "country": "nrd", "delta": 5 }
          ]
        },
        {
          "label": "Zbywać ogólnikami",
          "effects": [
            { "type": "setFlag", "flag": "nrd.stasi_zna", "value": 1 },
            { "type": "triggerEvent", "event": "nrd.stasi_powrot" }
          ]
        }
      ]
    },
    {
      // drugie ogniwo łańcucha — konsekwencja bez wyboru
      "id": "nrd.stasi_powrot",
      "title": "Towarzysz wraca",
      "body": "Ogólniki nie przekonały. Tym razem przyszedł z notesem. Kontrole będą częstsze — chyba że zadbasz o relacje.",
      "effects": [ { "type": "modifyRelation", "country": "nrd", "delta": -10 } ]
    }
  ],

  "treeNodes": [
    {
      "id": "nrd.akta_wstepne",
      "name": "Otwarcie akt: NRD",
      "description": "Nawiąż stałe kontakty zza Odry.",
      "cost": "1",
      "requires": [],
      "fogged": false,
      "kind": "gate",
      "effects": []
    },
    {
      // WĘZEŁ OTWIERAJĄCY BANK — odblokowuje mechanikę, zamglony do odkrycia
      "id": "nrd.rwpg_kanal",
      "name": "Kanał RWPG",
      "description": "Stałe łącze handlowe z bratnimi krajami. Tańszy import sprzętu i dostęp do bratniej elektroniki.",
      "cost": "3",
      "requires": ["nrd.akta_wstepne"],
      "fogged": true,
      "kind": "unlockMechanic",
      "effects": [
        { "type": "divideCost", "target": "generator:nrd.robotron", "value": "1.5" },
        { "type": "enableMechanic", "mechanic": "nrd.import_rwpg" }
      ]
    }
  ],

  "synergies": [
    {
      // łagodna degradacja: bonus TYLKO gdy obecny jest też pakiet ZSRR; paczka działa bez niego
      "requiresPack": "zsrr",
      "note": "Wspólne mechanizmy RWPG, gdy obecny jest też pakiet ZSRR.",
      "effects": [
        { "type": "multiplyProduction", "target": "resource:cykle", "value": "1.15" }
      ]
    }
  ],

  "lexicon": [
    {
      "id": "nrd.lex_u880",
      "name": "Procesor U880",
      "unlockedBy": "upgrade:nrd.u880",
      "text": "U880 produkowany przez kombinat VEB Mikroelektronik 'Karl Marx' w Erfurcie był funkcjonalnym odpowiednikiem Zilog Z80, wytwarzanym bez licencji. Zasilał m.in. komputery serii KC oraz robotronowskie maszyny biurowe i był jednym z filarów enerdowskiej mikroelektroniki."
    },
    {
      "id": "nrd.lex_robotron",
      "name": "Kombinat Robotron",
      "unlockedBy": "generator:nrd.robotron",
      "text": "VEB Kombinat Robotron z Drezna był największym producentem komputerów w NRD i jednym z czołowych w RWPG — od dużych maszyn po domowe i biurowe, w ramach blokowej specjalizacji i standaryzacji sprzętu."
    }
  ],

  "ticker": [
    {
      "id": "nrd.tick_01",
      "stream": "propaganda",
      "text": "Bratnia NRD melduje: nadwyżka eksportowa towarzyszy planowi z dokładnością do mikrona."
    },
    {
      "id": "nrd.tick_02",
      "stream": "easter",
      "text": "Plotka głosi, że pewien Robotron do dziś liczy listę płac z 1981 roku. I jeszcze nie skończył.",
      "condition": "posiadane.nrd.robotron >= 30"
    },
    {
      "id": "nrd.tick_03",
      "stream": "advice",
      "text": "Porada: dobre relacje zza Odry to tańsze części. Czujny towarzysz z notesem — niekoniecznie."
    }
  ],

  "characters": [
    {
      "id": "nrd.inzynier_klaus",
      "name": "Inżynier Klaus",
      "archetype": "specjalista-z-importu",
      "flavor": "Punktualny do bólu. Wie, gdzie kupić części, o które tu nikt głośno nie pyta.",
      "passive": [
        { "type": "multiplyProduction", "target": "generator:nrd.robotron", "value": "1.25" }
      ]
    }
  ]
}
```

**Co ten przykład demonstruje (mapa do zasad):**
- `nrd.u880` mnoży **rdzenne** `mera400` i `odra1305` → zasada 2.1 (mnóż rdzeń).
- `nrd.rwpg_kanal` jest **zamglonym** węzłem odblokowującym mechanikę → zasada 2.2 (otwieraj bank).
- Cała paczka pogłębia import/dyplomację, nie dokleja wysepki → zasada 2.3.
- `synergies` z `requiresPack: "zsrr"` działa tylko z ZSRR, ale paczka gra bez niego → zasada 2.4
  (łagodna degradacja).
- `lexicon` niesie **prawdziwe** ciekawostki; `ticker`/`events` trzymają **ton** → rozdz. 10.

---

## 13. Pusty szkielet do skopiowania

```jsonc
{
  "manifest": {
    "id": "twojid",
    "name": "Nazwa paczki",
    "version": "1.0.0",
    "author": "twoj_nick",
    "description": "",
    "schemaVersion": 1,
    "requires": [],
    "tags": [],
    "visualIdentity": { "accentColor": "#666666", "icon": null, "font": null, "texture": null }
  },

  "resources":    [],
  "generators":   [],
  "upgrades":     [],
  "milestones":   [],
  "achievements": [],
  "events":       [],
  "treeNodes":    [],
  "synergies":    [],
  "patches":      [],
  "lexicon":      [],
  "ticker":       [],
  "characters":   []
}
```

---

## 14. Lista kontrolna twórcy

Przed oddaniem paczki:

- [ ] Wszystkie moje ID są ASCII, małe litery, **prefiksowane ID paczki** (`twojid.cos`).
- [ ] Odwołania do rdzenia używają **oryginalnych ID rdzenia** (tabela 4.2).
- [ ] Co najmniej jeden efekt **mnoży rdzeń** (zasada 2.1) — paczka nie jest tylko wysepką obok.
- [ ] Jest jakiś **bank** — coś o ukrytej głębi, najlepiej węzeł drzewa odblokowujący mechanikę
      (zasada 2.2).
- [ ] Zależności od innych paczek to **synergie** (`requiresPack`), nie twarde `requires` (zasada
      2.4); paczka działa **samodzielnie**.
- [ ] Wszystkie formuły się parsują; każdy `target`/`requires`/`unlockedBy` wskazuje na istniejące ID.
- [ ] Brak `patches` koniecznych do działania (łatki są opcjonalnym dodatkiem, nie warunkiem — 8.4).
- [ ] **Ton trzyma rejestr** czułego krzywego zwierciadła (rozdz. 10); wrażliwe tematy oznaczone i
      ostrożne.
- [ ] **Leksykon jest rzetelny** — prawdziwe ciekawostki, nie zmyślenia.
- [ ] Paczka **przeszła walidację w Studiu DLC** bez błędów.
- [ ] (Opcjonalnie) Zadeklarowana **tożsamość wizualna** (kolor + ikona), by treść była rozpoznawalna.

To wszystko. Masz schemat, język formuł, słownik efektów, pełny działający przykład i szkielet —
wystarczy, by zrobić poprawne, a przy odrobinie dbałości *dobre* DLC, nie dotykając ani linijki kodu
gry.
