# PLAN.md — Plan budowy gry „Kombinat" (incremental, tematyka: późny PRL)

> **Nazwa robocza:** *Kombinat* — flagowana jako TYMCZASOWA i do zmiany przez właściciela.
> Słowo niesie podwójne znaczenie idealne dla projektu: *kombinat* (wielki zakład
> przemysłowy epoki) oraz *kombinować* (załatwiać, organizować spod lady) — co bezpośrednio
> opisuje rdzeń mechaniki (produkcja + czarny rynek + łapówki).
>
> **Data:** 14 czerwca 2026
> **Adresat dokumentu:** Claude Code (agent wykonawczy).
> **Dokumenty towarzyszące:** `DLC.md` (kontrakt dla twórców paczek — pisany dla DOWOLNEGO
> agenta lub człowieka, ma być samowystarczalny) oraz `STUDIO.md` (plan budowy strony „Studio
> DLC" — pisany dla Claude Code). Ten plik jest nadrzędny i opisuje samą grę.

---

## 0. Jak czytać ten dokument

Ten plan ma dwie warstwy i obie są wiążące:

- **DUCH** (rozdziały 1–17) — filozofia, decyzje architektoniczne, opis systemów. Agent ma to
  *zinternalizować*, bo na tej podstawie podejmuje setki drobnych decyzji projektowych, których
  nie da się tu wszystkich wyliczyć. W szczególności rozdział 1 nadaje Ci **jawne uprawnienie do
  samodzielnego dosypywania tematycznej treści** — korzystaj z niego.
- **LITERA** (rozdział 18 — plan fazowy) — konkretna kolejność robót z bramkami. **Buduj fazami.
  Po każdej fazie uruchamiasz testy (w tym testy wydajności), a właściciel testuje ręcznie na
  localhoście. Dopiero przy zielonym świetle przechodzisz do następnej fazy.** Nie wybiegaj
  naprzód, nie buduj wszystkiego naraz.

Zasada nadrzędna przy każdej wątpliwości: **gra jest data-driven**. Rdzeń to silnik konsumujący
definicje treści. Treść bazowa ładuje się tym samym mechanizmem co DLC. Jeśli kiedykolwiek masz
napisać treść „na sztywno" w kodzie silnika — zatrzymaj się, to prawie zawsze znak, że robisz to
źle.

---

## 1. Wizja i naczelne zasady

### 1.1. Czym jest gra

Incremental/idle w duchu *Cookie Clicker*, osadzony w realiach późnego PRL i jego
komputerowo-technologicznej otoczki (lata ~1970–1990). Gracz buduje i rozwija ośrodek
obliczeniowy / kombinat informatyczny, walcząc z niedoborem, kolejką, biurokracją i embargiem.
Fabuła jest **świadomie na drugim planie** — niesiona przez opisy, stylistykę, teksty klimatyczne
i uzasadnienia zdarzeń, nigdy przez ekspozycję wprost.

### 1.2. Ton

**Czułe krzywe zwierciadło prawdziwych wydarzeń.** Ani przygnębiające, ani śmiertelnie poważne,
ani kompletna autoparodia. Satyra celuje w *absurdy systemu* (plan, propaganda sukcesu, deficyt,
załatwianie), z prawdziwą fakturą epoki — nigdy w autentyczną ludzką krzywdę. Wzorzec rejestru:
dowcipy Radia Erewań, plansze Dziennika Telewizyjnego, „wykonanie planu w 143%".

### 1.3. Zasady kardynalne (każda ma konsekwencje w kodzie)

1. **Otwieranie banku.** Gra musi zawierać systemy o *ukrytej głębi*, których istnienie gracz
   przeczuwa, ale których skali nie zna, dopóki ich nie odblokuje. Moment odblokowania ma dać
   reakcję „Łoo, nie wiedziałem, że tu tego tyle!". Każdy taki bank **rzuca cień** zanim się
   otworzy (zablokowany kafelek, wyszarzona zakładka, sylwetka osiągnięcia, wzmianka na pasku),
   a treść w środku **przerasta oczekiwania**. To jest serce żywotności gry.

2. **DLC i treść są multiplikatywne, nie addytywne.** Całość to NIE `(rdzeń + segment)`, gdzie
   segment jest doklejony obok. Całość to `(rdzeń × 1,4 + segment × 1,5 + segment₂ × 1,3 …)` —
   każdy moduł *mnoży* wartość rdzenia i pozostałych modułów. DLC wpina się w istniejącą
   ekonomię przez extension pointy (rozdz. 3), nie tworzy „drugiej gry obok". Minigra żyjąca
   obok rdzenia jest dopuszczalna tylko z mocnym uzasadnieniem.

3. **Zawsze nazwany cel.** Zbieranie waluty nie może być celem samym w sobie — wtedy gracz
   pyta „po co to wszystko". Gra **stale nazywa następne 2–3 konkretne cele** w trzech
   horyzontach (krótki / średni / długi) — patrz rozdz. 6.4. Część celów jest nazwana, ale
   *tajemnicza* („??? — wymaga 50 ulepszeń sprzętu") — to operacjonalizuje otwieranie banku.

4. **Czekanie równoległe i wybrane, nigdy wymuszone.** Długie oczekiwanie (godziny, dni) jest
   dopuszczalne **tylko gdy jest równoległe do innej aktywności i aspiracyjne** (trofeum tykające
   w tle), i **tylko w późnej fazie**, gdy gra już wciągnęła. Gracz NIGDY nie może trafić na
   ścianę, gdzie jedyną opcją jest gapienie się w pasek. To wymóg architektury, nie kosmetyka:
   musi istnieć wiele równoległych wektorów progresji naraz.

5. **Ilość i gęstość są prostopadłe, nie przeciwstawne.** Cel to *dużo* treści, z której *każdy*
   element coś robi (odblokowuje, mnoży, komentuje, zaskakuje). Wróg to wypełniacz, nie skala.
   Poprzeczka brzmi: każdy budynek, każde z 300+ osiągnięć, każdy podsystem musi *zarobić* na
   swoje miejsce.

6. **Data-driven rdzeń.** Patrz rozdz. 0 i 3.

### 1.4. Jawne uprawnienie agenta

**Masz uprawnienie i zachętę do samodzielnego dodawania treści**, która tematycznie pasuje —
budynków, ulepszeń, zdarzeń, osiągnięć, notek do Leksykonu, wpisów na pasku — pod warunkiem, że
(a) mieści się w tonie z 1.2, (b) jest zgodna ze schematem treści z rozdz. 3, (c) przechodzi te
same testy co reszta. To są dane historyczne; korzystaj ze swojej wiedzy o epoce. Nie czekaj na
zatwierdzenie każdej nazwy budynku. Tam, gdzie to robisz, dosypujesz treść **dokładnie tym samym
mechanizmem**, którym zewnętrzny twórca zrobi DLC — czyli jako dane zgodne ze schematem.

---

## 2. Stos technologiczny i twarde decyzje architektoniczne

Te decyzje są rozstrzygnięte. Nie zmieniaj ich bez wyraźnej zgody właściciela.

- **Jeden kod webowy = jedyne źródło prawdy.** Gra jest pisana RAZ jako aplikacja webowa. Windows
  i Android to cienkie powłoki na tym samym kodzie. Powód: logika serializacji i kryptografii
  save'a musi być *identyczna* na wszystkich platformach (ten sam plik `.k7` ma krążyć między
  nimi) — a będzie, bo to ten sam JavaScript.
- **Framework UI: Svelte** (ewentualnie Solid, jeśli napotkasz konkretny argument). Powód:
  incremental to reaktywny widok na wielki tykający obiekt stanu; Svelte kompiluje się do lekkiego
  JS i dobrze chodzi na słabych telefonach. React jest dopuszczalny tylko jeśli Svelte okaże się
  realną przeszkodą — uzasadnij wtedy na piśmie.
- **Przeglądarka: PWA** (Progressive Web App) — działa offline, instalowalna z ekranu głównego na
  telefonie, zachowuje się jak natywna. **Mobilna wersja przeglądarkowa jest priorytetem** —
  testuj responsywność od początku.
- **Windows: Tauri** (NIE Electron). Systemowy webview + backend w Ruście; binarka waży megabajty,
  nie setki megabajtów.
- **Android: Capacitor** — opakowuje kod webowy, daje dostęp do natywnych API (pliki, powiadomienia,
  tło).
- **Build/dev: Vite** z hot-reload. **Dev-server na localhoście jest podstawowym narzędziem
  iteracji** — UI, mechanik, *tonu* i bugów. Krzywą i ton stroimy na żywo, bo to materia
  subiektywna.
- **Wielkie liczby: `break_infinity.js`** — OBOWIĄZKOWO od Fazy 0. W late game liczby przekraczają
  zakres `float64` i zwykłe liczby się psują. Retrofit jest koszmarem; wprowadź od fundamentów.
- **Firebase** (uwaga: *Firestore* to baza, *Firebase Hosting* to serwowanie stron — to dwa różne
  produkty tej samej platformy):
  - **Firebase Authentication** — logowanie anonimowe na start, z możliwością późniejszego
    *dowiązania* konta Google/e-mail (przeniesienie postępu na inne urządzenie).
  - **Cloud Firestore** — przechowuje zaszyfrowany blob save'a per użytkownik. Firestore widzi
    tylko nieprzejrzysty ciąg.
  - **Firebase Hosting** — serwuje grę (PWA) oraz osobno stronę Studia DLC.
  - **Security Rules** — każdy czyta/zapisuje wyłącznie własny save.

---

## 3. Architektura data-driven (rdzeń = konsument treści)

To jest fundament całego projektu. Silnik nie wie, że Odra 1305 czy K-202 to „treść bazowa" — dla
niego wszystko to treść wczytana z danych. DLC niczym się nie różni od bazy poza tym, że dochodzi
później.

### 3.1. Schemat treści

Silnik definiuje schemat, którego instancją jest cała treść (bazowa i DLC). Typy bytów:

- **Zasoby** (`resource`) — id, nazwa, opis, formatowanie, czy prestiżowy.
- **Generatory/budynki** (`generator`) — id, nazwa, flavor text, koszt (formuła), produkcja
  (formuła), zasób kosztowy, zasób produkowany, warunek odblokowania, akcent wizualny.
- **Ulepszenia** (`upgrade`) — id, nazwa, flavor, koszt, warunek odblokowania, lista *efektów*
  (prymitywy z 3.3), czy jednorazowe.
- **Zdarzenia** (`event`) — id, wyzwalacz (warunek/losowość/czas), treść (mini-historyjka),
  opcje decyzji z konsekwencjami, możliwość bycia ogniwem *łańcucha* (rozdz. 8.4).
- **Kamienie milowe** (`milestone`) — progi z trwałymi efektami.
- **Osiągnięcia** (`achievement`) — id, nazwa, opis, warunek, czy sekretne, mnożnik (aktywowany
  węzłem drzewa — rozdz. 7).
- **Węzły drzewa Denominacji** (`treeNode`) — id, typ (rozdz. 7.3), koszt w odznaczeniach,
  wymagania (poprzednie węzły), efekt, czy zamglony.
- **Wpisy Leksykonu** (`lexiconEntry`) — notka historyczna powiązana z budynkiem/postacią/zdarzeniem.
- **Wpisy paska** (`tickerLine`) — tekst + strumień (porada/propaganda/easter egg/powiadomienie)
  + ewentualny warunek kontekstowy.
- **Postacie kadry** (`character`) — id, archetyp, bonusy pasywne, własna linia zdarzeń.
- **Motyw/tożsamość wizualna** (`visualIdentity`) — patrz 3.5.

Schemat ma być **wersjonowany** (numer wersji schematu w nagłówku treści) i mieć **ścieżki
migracji**, bo będzie ewoluował.

### 3.2. Treść jako paczki

Cała treść (bazowa i DLC) to **paczki** zgodne ze schematem. Paczka ma manifest (id, nazwa, wersja,
autor, wymagana wersja schematu, tożsamość wizualna) + zawartość. Silnik:
1. wczytuje paczkę,
2. **waliduje** ją względem schematu (i raportuje błędy zrozumiale — to musi trafić też do `DLC.md`
   jako gwarancja dla twórców),
3. **scala** jej treść z grą w sposób deterministyczny (3.4).

### 3.3. Mini-język formuł (bezpieczny)

Koszty, skalowanie produkcji i warunki odblokowania wyraża **wąski, bezpieczny język wyrażeń** nad
stanem gry — NIE dowolny kod. Obsługuje:

- arytmetykę (`+ - * / ^ %`),
- porównania (`< <= > >= == !=`),
- logikę (`and or not`),
- odwołania do stanu po id (`posiadane.odra1305`, `zasob.dewizy`, `prestiz.liczba`,
  `osiagniecia.zdobyte` itd.),
- funkcje pomocnicze (np. `min`, `max`, `floor`, `log`).

Przykłady:
- koszt: `bazowy_koszt * 1.15 ^ posiadane`
- produkcja z synergią: `bazowa * (1 + 0.02 * posiadane.bajtek)`
- warunek: `posiadane.odra1305 >= 5 and zasob.dewizy >= 1000`

Język nie może wykonać niczego groźnego (brak dostępu do DOM, sieci, plików). To on daje DLC
ogromną ekspresję bez ryzyka uruchamiania cudzego kodu.

### 3.4. Extension pointy, scalanie, determinizm

DLC pogłębia rdzeń przez **hooki** odwołujące się do treści rdzenia **po stabilnych id**:

- `addResource / addGenerator / addUpgrade / addEvent / addAchievement / addTreeNode /
  addLexiconEntry / addTickerLine / addCharacter` — dodają nową treść.
- `modifyGenerator(id, …)` — np. „pomnóż produkcję `odra1305` o X, jeśli warunek Y".
- `modifyUpgrade / modifyCost / addCondition` — modyfikują istniejącą treść.
- `addSynergy(ifPackagePresent, …)` — bonus aktywny **tylko gdy obecna jest też inna paczka**;
  paczka MUSI działać samodzielnie, gdy tamtej nie ma (**łagodna degradacja**).

**Determinizm scalania jest wymogiem:**
- Każda paczka ma jawny priorytet/kolejność scalania.
- Gdy dwie paczki dotykają tej samej treści rdzenia, efekty kumulują się w zdefiniowanej kolejności.
- Konwerter w Studiu (patrz `STUDIO.md`) waliduje konflikty z wyprzedzeniem („paczka A i B
  modyfikują ten sam budynek — kumulacja A→B").

### 3.5. Tożsamość wizualna paczki (wyróżnianie treści DLC)

Treść DLC ma być **mechanicznie wpięta bez szwu**, ale **wizualnie rozpoznawalna** (subtelnie, nie
drastycznie). Rozdzielamy integrację mechaniczną od sygnatury wizualnej. Paczka **deklaruje swój
akcent w manifeście** (`visualIdentity`), a silnik nakłada go automatycznie na całą jej treść —
zero ręcznego dłubania w stylach per paczka (to łamałoby zasadę „DLC bez dotykania kodu"). Środki:

- **Kolorystyczny akcent** — cienka krawędź kafelka, podbarwiona poświata, znacznik w rogu.
- **Subtelna różnica typografii / tła kafelka** — inna faktura, dyskretny wzór, lekko inny krój
  nagłówka.
- **Mała ikona-pieczęć paczki** (godło/herb/emblemat) w rogu elementu.
- **Ranga zaufania** (rozdz. 5.4) niesie dodatkową sygnaturę: **oficjalne** (podpisane) paczki mają
  inny akcent/pieczęć niż **społecznościowe** (tylko zwalidowane).

---

## 4. Format save'a `.k7`

> Rozszerzenie `.k7` (nazwa kasety w bloku wschodnim) — krótkie, wyróżniające się, tematyczne
> (save jako „wirtualna kaseta z wgranym stanem"). Wewnętrznie trzymaj ASCII bez polskich znaków.

### 4.1. Dwa byty (utrzymuj rozdzielenie)

- **Żywy autozapis** — stan w localStorage/IndexedDB (web) lub folderze aplikacji (Tauri/Capacitor).
  Gracz go nie dotyka. **Autozapis co 3 minuty** + zapis przy istotnych zdarzeniach i przy
  zminimalizowaniu/zamknięciu.
- **Przenośny plik `.k7`** — zaszyfrowany blob do eksportu/importu między platformami. Plus
  **manualny zapis „kończę teraz"** (odpowiedź na „już mi się znudziło, kończę natychmiast, nie za
  3 minuty").

### 4.2. Pipeline serializacji

1. Stan → JSON.
2. **Kompresja** (pako/gzip lub LZ-String) — czyni plik nieczytelnym w notatniku i zmniejsza.
3. **Szyfrowanie AES-GCM przez Web Crypto API** — daje poufność **i uwierzytelnienie**: każda
   zmiana choćby jednego bajtu psuje tag, więc gra wie, że plik majstrowano. Web Crypto działa
   identycznie w przeglądarce, webview Tauri i webview Capacitora.
4. **Nagłówek**: magiczne bajty (sygnatura „to nasz save") + **numer wersji formatu** — do
   rozpoznawania własnych plików, migracji starych save'ów i odrzucania śmieci.
5. **HMAC / suma kontrolna** całości — dodatkowa warstwa wykrywania uszkodzeń i manipulacji.

### 4.3. Granica (świadomy kompromis — nie „naprawiaj")

Szyfrowanie po stronie klienta przeciw samemu graczowi jest z definicji ograniczone: skoro gra
odczytuje save, klucz jest na urządzeniu i zdeterminowany człowiek go wydłuba. **Realny i
wystarczający cel: anti-casual, nie anti-determined** — plik jest nieczytelny i odporny na zwykłą
edycję, próby majstrowania są wykrywane i odrzucane. Pełna szczelność wymagałaby gry autorytatywnej
na serwerze; to inny, dużo większy projekt i przerost formy dla idle. Nie implementuj tego.

### 4.4. Eksport/import per platforma

- **Web**: eksport = pobranie pliku; import = okno wyboru pliku. Użyj File System Access API tam,
  gdzie dostępne; blob + `<input type=file>` tam, gdzie nie (np. mobilne przeglądarki).
- **Tauri / Capacitor**: pełny dostęp do dysku — zapis/odczyt pliku bezpośrednio.

### 4.5. Migracja save'a

Nagłówek z wersją + ścieżki migracji starych zapisów do nowych wersji gry. Save'y z DLC dochodzącymi
i odchodzącymi (rozdz. 15 — toggle DLC) muszą się dać sensownie wczytać.

---

## 5. Synchronizacja (Firebase)

### 5.1. Tożsamość

Anon auth na start (gracz po prostu gra, dostaje cichy identyfikator). Później dowiązanie konta dla
przeniesienia postępu.

### 5.2. Przechowywanie

Firestore trzyma **zaszyfrowany blob** (ten sam co `.k7`) per użytkownik. Security Rules: dostęp
tylko do własnego dokumentu.

### 5.3. Dławienie (kluczowe dla kwot — zaprojektuj od początku)

Zapis całego bloba co tyknięcie wypaliłby darmowy limit Firestore w mgnieniu oka. Synchronizacja
**zdławiona (debounced)**: zapis przy istotnych zdarzeniach, przy zminimalizowaniu/zamknięciu i co
kilka minut — NIE ciągły. Doklejenie tego później jest bolesne.

### 5.4. Rozwiązywanie konfliktów (prawdziwie trudna część)

Postęp offline na wielu urządzeniach → save w chmurze bywa starszy/nowszy niż lokalny. „Ostatni
zapis wygrywa" potrafi skasować godziny progresu. Polityka:
- W save'ie trzymaj **monotoniczny licznik wersji** + **sumaryczny postęp** (np. łączny wytworzony
  zasób).
- Przy rozbieżności **pokaż graczowi okno wyboru** („stan chmurowy z X vs lokalny z Y — który
  wczytać?") zamiast cicho nadpisywać. Świadomy wybór jest mniej frustrujący niż utracony,
  nieodwracalny progres.

### 5.5. Granica

Save jest szyfrowany kluczem klienta → **serwer go nie waliduje**. Firebase daje synchronizację, nie
anti-cheat. Dla gry singlowej dla kilku osób — akceptowalne. Nie buduj walidacji serwerowej.

---

## 6. Ekonomia i pętla rozgrywki

### 6.1. Trójwarstwowe zasoby (trzy prędkości progresji)

Trzy zasoby = trzy prędkości, co rozwiązuje problem krzywej u źródła i jest tematycznie bezbłędne
(podwójna ekonomia gry odwzorowuje podwójną ekonomię epoki: miękka złotówka vs twarde dewizy):

1. **Cykle / dane** (przerobione karty perforowane, listy płac, tablice dla GUS) — zasób obfity,
   generowany klikaniem i biernie. To „ciasteczka". Szybka pętla łapiąca gracza w pierwszych
   minutach.
2. **Dewizy / bony** (bony Pewexu, twarda waluta) — zasób rzadki, bramkujący premiowy sprzęt i duże
   skoki. Zdobywany wolno, przez specjalne zdarzenia (dostawa z Pewexu, kontrakt eksportowy,
   giełda). Tworzy odczucie „musiałem na to zapracować/poczekać" — właściwe dla środka i końca gry.
3. **Odznaczenia / medale** — waluta wyłącznie prestiżowa, z ukończonych Denominacji (rozdz. 7),
   wydawana w drzewie dziedzictwa. Daje trwałe efekty.

### 6.2. Drabina generatorów = historia polskiej informatyki

Każdy szczebel to realny kawałek epoki z uszczypliwym flavor textem. **Pinuj tę drabinę jako
historyczny kręgosłup** (kolejność, liczby i flavor są tunable, ale ciąg historyczny zachowaj).
Proponowane id i szczeble:

| id | szczebel | nuta narracyjna |
|---|---|---|
| `liczydlo` | liczydło / urzędnik | start, ręczna mozolność |
| `arytmometr` | arytmometr | mechaniczna kalkulacja |
| `tabulator` | tabulator na karty perforowane | era kart dziurkowanych |
| `mera400` | MERA-400 (minikomputer) | pierwszy „prawdziwy" sprzęt |
| `k202` | **K-202** | **specjalny, fabularnie naładowany unlock** — minikomputer Karpińskiego z pocz. lat 70., konstrukcyjnie bijący Zachód, dobity przez biurokratyczno-polityczne rozgrywki. Tragiczne „co by było, gdyby". Daj mu osobną winietę. |
| `odra1305` | Odra 1305 (Elwro, Wrocław) | mainframe-robotnik, zgodny z ICL (efekt standaryzacji bloku) |
| `osrodek` | ośrodek obliczeniowy | cała instytucja jako generator |
| `spectrum` | ZX Spectrum + giełda | import i kopiowanie gier na kasetach jako biznes |
| `meritum` | Meritum / Elwro 800 Junior | rodzime komputery domowe; Junior robiony dla szkół jako klon Spectruma |
| `mazovia` | Mazovia / klony PC | przyszłość pełznąca do drzwi |
| `spolka` | zalążek spółki / sieci | finał — nadchodzi 1989 |

Kilkanaście szczebli → gracz zawsze ma „następny kafelek przed nosem" (wygładza krzywą), a
progresja epok jest zaszyta w samą strukturę zakupów, bez ani jednej linijki ekspozycji.

### 6.3. Ulepszenia (przykłady tematyczne — rozbuduj)

`talon_na_czesci`, `przydzial`, `numer_bajtka` (kultowy magazyn od 1985 — wiedza = mnożnik),
`przekupienie_magazyniera` (satyryczne „usprawnienie wydajności"), `modyfikacja_sprzetu` (hack).
Ulepszenie podwajające budynek daje satysfakcjonujący skok i „resetuje kierat".

### 6.4. Panel „Co dalej?" (zawsze nazwany cel)

Stały, widoczny przez całą grę panel z trzema horyzontami naraz:
- **krótki** — następny unlock („jeszcze 40 i kupujesz Odrę"),
- **średni** — aktywny łańcuch zdarzeń albo zadanie bieżącej pięciolatki / doktryny ze Zjazdu,
- **długi** — nazwany kamień milowy albo daleki cel/osiągnięcie, często *tajemniczy* („??? —
  wymaga 50 ulepszeń sprzętu").

Dzięki temu nawet w fazie czekania liczba na pasku zawsze pracuje na rzecz czegoś nazwanego.

### 6.5. Pokrętła krzywej (wszystko parametryzowalne w danych)

Strojenie krzywej = pokręcanie liczbami, NIE przepisywanie kodu. Pokrętła: mnożnik kosztu na zakup
(start ~1,15 — wyżej = stromsza ściana), liczba odrębnych generatorów (więcej = gładziej), kadencja
ulepszeń, synergie (budynki wzmacniające się nawzajem = głębia kombinatoryczna), mnożniki prestiżu
(pozwalają przebić dawne ściany), balans aktywne↔bierne (klikanie liczy się wcześnie dla feelu
„klikacza", ale nie może być wymagane godzinami — bierna produkcja przejmuje pałeczkę, aktywna gra
daje bursty i bonusy ze zdarzeń).

### 6.6. Postęp offline (postać zamknięta — wymóg wydajności)

Powrót po dniach (a przy późnej fazie z wielodniowymi celami to norma) NIE może symulować każdego
pominiętego ticku w pętli — zawiesi grę na minuty. Dorobek liczony **wzorem zamkniętym (closed-form),
O(1)** tam, gdzie się da. To bezpośrednio czyni długie oczekiwania strawnymi: gracz nie czeka, tylko
*wraca* do nazbieranego, natychmiast.

### 6.7. Trzy fazy tempa (filozofia krzywej)

- **Wczesna (pierwsza sesja, ~30–60 min) — haczyk.** Gęste tempo: unlock co kilka sekund do kilku
  minut, liczby widocznie rosną, klikanie realnie coś daje. Pierwsze 5 minut sprzedaje całą resztę.
- **Środek — drugi wektor.** Tempo rozciąga się do minut/godzin na znaczący zakup, ale ZAWSZE jest
  co robić (ulepszenia, mikro-cele, zdarzenia, optymalizacja). Wchodzi pętla prestiżu i zaczyna
  liczyć się offline.
- **Późna — trofea.** Dopiero teraz cele wielogodzinne i wielodniowe — jako *jeden tor wśród wielu*,
  nigdy twarda brama na całą aktywność.

---

## 7. Prestiż: Denominacja + drzewo dziedzictwa

### 7.1. Denominacja (pętla resetu)

Nazwa nieprzypadkowa: denominacja złotego z 1995 ścięła cztery zera (10 000 starych zł = 1 nowy),
liczby skurczyły się radykalnie, wartość zachowana — to **dosłownie prestiż**. Daje gotową
**ceremonię**: w momencie Denominacji gracz *widzi*, jak zera są ścinane z liczników, stary nominał
przelicza się na nowy (rozdz. 12 — to najmocniejszy juice'owy moment w grze).

Reset kasuje produkcję bieżącej rozgrywki, ale **drzewo dziedzictwa jest trwałe** i daje walutę:
**odznaczenia/ordery** (Order Sztandaru Pracy jako żeton meta — dokładnie tak satyryczny, jak
trzeba).

### 7.2. Drzewo dziedzictwa (nazwa robocza: „Teczka Kadrowa" / „Dziedzictwo")

Forma: **rozgałęzione drzewo w duchu Path of Exile, w mikro-skali.** Waluta wydawana w
**dedykowanym oknie między Denominacją a nowym startem** — to zamienia reset z „przyspieszenia" w
**decyzję strategiczną o tym, jak będzie wyglądać następna rozgrywka**. Drzewo JEST bankiem w czystej
postaci: gałąź, której istnienia nie podejrzewałeś, odsłania cały podsystem.

### 7.3. Typy węzłów (mają być PRAWDZIWIE unikalne, nie tylko mnożniki)

- **mnożnikowe** (małe, „taniej", „+do produkcji") — klej między dużymi,
- **odblokowanie mechaniki** (giełda, łapówki, dyplomacja, automatyzacja) — wielkie, przełomowe,
- **odblokowanie minigry**,
- **odblokowanie zestawu ulepszeń** (cała nowa gałąź treści w następnej rozgrywce),
- **aktywator osiągnięć** — po nim zdobyte osiągnięcia zaczynają dawać mnożniki do przyrostu;
  *retroaktywnie* nagradza całe wcześniejsze kolekcjonowanie i wiąże dwa systemy w jeden,
- **startowe** — zaczynaj nową rozgrywkę z czymś już odblokowanym (skraca rozbieg w late game),
- **bramkujące** — kosztowne wrota otwierające dalszą część drzewa (poczucie głębi),
- **keystone** (duch PoE) — potężne, zmieniające reguły, często z **kosztem** (np. „produkcja ×3,
  ale kontrole 2× częstsze").

### 7.4. Geografia i zamglenie

Gałęzie mają **tematyczne kierunki** (konar przemytu / rodzimego R&D / partyjno-biurokratyczny /
rynkowo-giełdowy). Inwestując w kierunek, gracz *deklaruje styl* następnej rozgrywki. Część drzewa
jest **zamglona** (ukryta, póki nie dojdziesz w pobliże) — zwiedzanie drzewa to bank wewnątrz banku.

### 7.5. Trwałość

Odblokowania z drzewa są **permanentne** (przetrwają Denominację — są nagrodą za reset), w
odróżnieniu od ulepszeń pojedynczej rozgrywki, które reset kasuje. Granica: rozgrywka jest ulotna,
drzewo jest dziedzictwem.

### 7.6. Opcjonalna druga warstwa prestiżu (do dostrojenia, nie w MVP)

Możliwy głębszy, rzadszy reset: **Transformacja** (zmiana ustroju '89 — nie nowy plan pięcioletni,
lecz nowy *system*) lub ostrzejszy wariant **Reforma Balcerowicza** („terapia szokowa" — najtwardszy
reset, otwierający nowy porządek z największymi mnożnikami). Nie przesądzaj dwuwarstwowości w MVP;
nazwy są gotowe na później.

### 7.7. Żywy wygląd drzewa

Drzewo jest **witryną domyślnego języka interaktywności** (rozdz. 11): mikrodrgania węzłów w
spoczynku, repulsja/parallax przy zbliżeniu kursora, poświaty wykupienia. Wszystko GPU-only,
podlega globalnemu przełącznikowi „żywy UI on/off".

---

## 8. Banki (otwieranie banku) — systemy o ukrytej głębi

Część banków to baza (Faza 3), część to pierwsze DLC, część to późniejsze aktualizacje. **Silnik
musi wiedzieć, że banki istnieją, i umieć je odsłaniać** (rzucanie cienia) — żeby dodanie kolejnego
było danymi, nie przepisywaniem.

### 8.1. Giełda / czarny rynek → GPW (priorytet nr 1)

- **Wczesna wersja**: kantor czarnorynkowy, cinkciarze (Grzybowska, pod Hotelem Forum), bony Pewexu,
  **kurs dolara tykający w czasie** z cyklami i zdarzeniami (dewaluacja, obława MO, „rzucili" coś do
  Pewexu → kurs skacze). Czekasz na dobry kurs, kupujesz tanio, sprzedajesz drogo, z czasem może
  *zbijasz* rynek dużym ruchem.
- **Późna gra otwiera prawdziwą GPW.** Ciekawostka jako pointa: warszawska GPW ruszyła w 1991 w
  gmachu byłego KC PZPR — postawili kapitalistyczną giełdę w siedzibie komitetu centralnego partii.
  Tego nie trzeba podkręcać.
- Moment otwarcia banku: odblokowujesz „kantor", a pod spodem rozwija się pełny interfejs handlowy z
  żywymi notowaniami.

### 8.2. Minigry na maszynach

Cała kategoria, którą gracz odkrywa, gdy pierwszy raz dostanie działający komputer:
- **debugowanie karty perforowanej** (łamigłówka logiczna),
- **wczytywanie z kasety** (rytmiczna minigra na piszczeniu taśmy ZX Spectrum),
- **lutowanie / składanie z deficytowych części** (tetrisowate dopasowywanie podzespołów),
- **mikro-gra tekstowa** na ekranie wirtualnego komputera (easter egg, hołd dla wczesnego polskiego
  gamedevu), oraz scena pisania **demka** (wschodnia demoscena była realna).

### 8.3. Osiągnięcia jako bank (300+)

Sama zakładka jest bankiem, jeśli zrobiona jak w *Cookie Clicker* — z **wyszarzonymi sylwetkami**
zablokowanych osiągnięć, zdradzającymi istnienie systemów jeszcze niespotkanych. Kategorie odsłaniają
się stopniowo: progi produkcji, wyzwania („osiągnij X *nie kupując* Y"), zdarzeniowe,
sekretne/easter-eggowe, prestiżowe, DLC-owe, meta („zagrane o 3:00" → *Nocna zmiana*). **Każde daje
mały trwały mnożnik** (aktywowany węzłem drzewa — rozdz. 7.3), więc kolekcjonowanie jest mechaniczne,
nie tylko kosmetyczne. Cel: liczba 3-cyfrowa.

### 8.4. Silnik zdarzeń w stylu Paradoxu

Modalne mini-historyjki na środku ekranu — pojedyncza decyzja albo **łańcuch** rozłożony w czasie.
Przykłady w klimacie: wizyta SB („towarzysz z Mostowskich ma kilka pytań") — współpracuj/zbywaj/przekup,
z konsekwencjami dla reputacji; wadliwa dostawa — zgłoś (uczciwie, tracisz produkcję) albo zatuszuj
(ryzyko późniejszej kontroli); inżynier chce zostać na Zachodzie podczas konferencji; *Bajtek* chce
reportaż o Twoim sprzęcie. **Najmocniejsze są łańcuchy** (powracający oficer SB eskaluje albo daje
się oswoić przez kilka spotkań) — robią narracyjną głębię odsłanianą po kawałku. Gracz nigdy nie wie,
czy dane zdarzenie to jednorazówka, czy początek czegoś.

### 8.5. Kadra / roster

Werbunek nazwanych archetypów: cyniczny inżynier-geniusz (duch Karpińskiego, nie dosłownie on),
cinkciarz, partyjny załatwiacz, aparatczyk, gówniarz z demosceny. Każdy daje pasywne bonusy *i*
odblokowuje własne linie zdarzeń. Ekran rekrutacji, o którego istnieniu nie wiesz, póki go nie
otworzysz.

### 8.6. Drzewo badań z ukrytymi gałęziami

Ponad liniową drabiną budynków — rozgałęzione drzewo, gdzie całe konary (przemyt, rodzime R&D,
software/gry, sieci ku przyszłości) są niewidzialne, póki nie spełnisz warunków.

### 8.7. Leksykon PRL (mocny dorzut, niski koszt / duży zwrot)

Każdy odblokowany budynek, postać i zdarzenie odsłania **prawdziwą notkę historyczną** w grze. K-202
odblokowane → notka o Karpińskim i o tym, jak biurokracja dobiła konstrukcję bijącą Zachód. Robi trzy
rzeczy naraz: jest **kolejnym bankiem** (kompletowanie Leksykonu to cel), nośnikiem ciekawostek
wprost w mechanice, i nagradza graczy-historyków osobną warstwą satysfakcji.

---

## 9. Wielkie systemy historyczne (multiplikatywne, wpięte w rdzeń)

**Nie są to równoległe minigry.** To trzy dźwignie na tej samej ekonomii produkcji — realizacja
wzoru `core × …`. Łapówka odblokowuje deficytowe wkłady *do rdzennej produkcji* szybciej; Zjazd
ustawia makro-mnożniki *na rdzenną ekonomię*; dyplomacja ustala ceny *rdzennych wkładów*.

### 9.1. Załatwianie i łapówki (centralna mechanika społeczna epoki)

Gospodarka oficjalna była fikcją; realnie wszystko działało przez **załatwianie** („po znajomości",
„spod lady", „po blacie"). Łapówka rzadko była gotówką — najczęściej *towarem* (pieniądz miękki,
towar reglamentowany). Waluty zastępcze: butelka wódki (lepiej zachodnia whisky — „Johnny"), kawa,
zachodnie papierosy (Marlboro), nylonowe pończochy, czekolada, **koperta** z gotówką/dewizami dla
poważniejszych spraw. Cele smarowania (każdy = gotowa mechanika):
- **magazynier** — kontroluje dostęp do deficytowych części; przekupiony wypuszcza to, czego
  oficjalnie „nie ma",
- **celnik** — przepuszcza import (kluczowy przy obchodzeniu embarga),
- **urzędnik** — przyspiesza papierologię,
- **dygnitarz partyjny** — otwiera drzwi, których nie otworzą pieniądze.

Mechanika: wydajesz zasób-przysługę (kawa/wódka/dewizy) na efekt — odblokowanie deficytowego wkładu,
przeskoczenie kolejki/oczekiwania, **obniżenie ryzyka kontroli**. Nad tym warstwa ryzyka: zbyt grube/
jawne smarowanie ściąga śledztwo → wpina się łańcuch SB (8.4). To czyni z łapówki decyzję
ryzyko-nagroda, nie darmowy guzik. Plus **talon** (reglamentowany przydział na rzeczy wielkie —
legendarny „talon na samochód"); zdobycie talonu to mały kamień milowy.

### 9.2. Zjazd PZPR jako wydarzenie ustawodawcze

Cykliczne, wielkie wydarzenie, w którym **ustalasz preferowaną doktrynę na następną epokę** (spina
się z pętlą pięciolatek). Doktryny z prawdziwymi konsekwencjami:
- **przemysł ciężki vs dobra konsumpcyjne** — przesuwa, który zasób płynie szerzej,
- **otwarcie na kredyty zachodnie** — dekada Gierka: boom napędzany pożyczkami, krótkoterminowy
  rozkwit konsumpcji, ale **bomba zegarowa zadłużenia** wybuchająca kryzysem końca lat 70. / 1980.
  Wybór z opóźnioną ceną: boom teraz, kryzys później (albo dywersyfikuj, by go złagodzić),
- **„propaganda sukcesu"** (realny termin epoki Gierka) — podbija widoczność produkcji i bonusy, ale
  podnosi oczekiwania i ryzyko, gdy rzeczywistość nie nadąża,
- **zaostrzenie vs liberalizacja** — przesuwa częstotliwość zdarzeń i temperaturę czarnego rynku.

Pięknem jest **regrywalność**: gracz odtwarza historię (gierkowski boom-bust) albo od niej odchodzi
(„co by było, gdyby"). Doktryna ze Zjazdu nadaje sens całej następnej fazie (cel średnioterminowy).

### 9.3. Dyplomacja bloków

- **Wschód — RWPG (Comecon)**: handel w **rublu transferowym**, specjalizacja (Polska: węgiel,
  statki), blokowa standaryzacja komputerów. Dobra relacja z członkiem bloku = dostęp do jego
  technologii/towarów.
- **Zachód — embargo CoCom** (Coordinating Committee for Multilateral Export Controls): zachodni
  zakaz eksportu technologii do bloku — centralna przeszkoda w zdobyciu zachodnich komputerów i
  układów scalonych; paliwo dla banku przemytu.

Relacje (każda przesuwa **ceny wkładów**):
- **ZSRR** — wielki brat; **radziecka ropa po cenach poniżej światowych** (przed szokami naftowymi
  lat 70. realne, potężne subsydium). Dobra relacja = tania energia, ale polityczny nacisk.
- **Węgry** — **„gulaszowy komunizm"**, najbardziej zliberalizowana gospodarka bloku; dobra relacja
  = tańsza konsumpcja.
- **NRD** — Robotron i jego elektronika (U880 = enerdowski klon Z80); dobra relacja = precyzyjne
  podzespoły. Zdarzenia w klimacie Stasi.
- **Japonia** — most, nie egzotyka: standard **MSX** był japoński, a maszyny Yamaha MSX trafiły
  masowo do *radzieckich szkół* (klasy КУВТ „Yamaha"). „Japonia" historycznie *łączy się* ze
  wschodnim blokiem.
- **USA / Zachód** — zakazany owoc za murem CoCom; twarda waluta, technologia o pokolenie wyprzedzająca
  to, co legalnie dostępne.

Mechanika: ekran dyplomacji; stan relacji **przesuwa ceny wkładów i dostęp do technologii** (dobra
relacja z ZSRR = tania ropa; z Węgrami = tańsza konsumpcja; obejście CoCom = zachodnie układy po
czarnorynkowej cenie z premią za ryzyko). Plus zdarzenia dyplomatyczne (delegacja handlowa, ucieczka
na Zachód, szczyt, sankcje po stanie wojennym 1981).

---

## 10. Interfejs i tożsamość wizualna

### 10.1. Rama ekranu (rozstrzygnięta)

- **Górny pasek (przyklejony)** — komunikaty: cztery przeplatane strumienie (porady / fałszywa
  propaganda / easter eggi / powiadomienia systemowe). Estetyka **teletekstu / planszy Dziennika
  Telewizyjnego / taśmy dalekopisu** — jednolinijkowy, przewijający się w poziomie. Zawsze widoczny,
  niezależnie od scrolla.
- **Środek (scrollowalny)** — właściwa gra (budynki, ulepszenia).
- **Dolny pasek (przyklejony)** — twarde dane i sterowanie: liczniki zasobów, szybkie przyciski,
  wskaźniki aktywnych zdarzeń.

Próbki tonu paska (dla kalibracji — rozbuduj):
> „Towarzysze, wykonanie planu w 143%! Pozostałe 57% to oczywiście błąd statystyczny."
> „W Pewexie rzucili Atari. Kolejka od wczoraj. Stoi też towarzysz dyrektor, ale incognito."
> „Porada dnia: kartę perforowaną można odwrócić. Drugiej strony i tak nikt nie sprawdza."
> „Radio Erewań pyta: czy komputer zastąpi człowieka? Odpowiadamy: tylko w kolejce."

### 10.2. Retro + czytelność (czytelność nadrzędna)

Estetyka CRT (linie skanujące, krzywizna, poświata fosforu, aberracja chromatyczna, miganie) potrafi
zabić czytelność. Rozwiązanie: **CRT jako przełączalny filtr-nakładka, który NIGDY nie dotyka
czytelności samych danych.** Efekt żyje w warstwie ambientu (tło, ramki, poświata); tekst liczb i
etykiet zostaje ostry i wysokokontrastowy zawsze. Plus suwak intensywności i pełny wyłącznik
(słabsze urządzenia). Klimat dostają chętni; czytelność jest nienegocjowalna dla wszystkich.

### 10.3. Ikony

**Lucide** (ponad 1000 ikon) do UI i rzeczy generycznych. Na **bardzo epokowe obiekty** (karta
perforowana, kaseta, konkretne maszyny) ikon nie będzie — zmiksuj Lucide z własnym **SVG/pixel-artem**
dla treści tematycznej.

### 10.4. Formatowanie liczb (wybór gracza)

Notacja naukowa (`1.5e9`) vs nazwana (miliard, bilion…) autentycznie dzieli ludzi → do ustawień.
Możliwa nazwana notacja **tematyczna**.

### 10.5. Wyróżnianie treści DLC

Patrz 3.5 — akcent deklarowany w manifeście paczki, nakładany automatycznie; oficjalne vs
społecznościowe niosą różne sygnatury.

---

## 11. Żywy interfejs / domyślny język interaktywności

To **ogólny język UI**, nie tylko drzewo. Domyślnie włączony.

- **mikrodrgania (idle jitter)** — elementy lekko „żyją" w spoczynku,
- **repulsja / parallax** — węzły/kafelki lekko uciekają w przeciwną stronę przy zbliżeniu kursora,
- **poświaty wykupienia** — tło rozbłyska/pulsuje przy zakupie,
- **„oddychanie"** elementów (subtelna pulsacja skali/jasności).

Drzewo Denominacji jest **witryną** tego języka (rozdz. 7.7).

**Dwa twarde rygory:**
1. **Wyłącznie transformacje GPU** (`transform`, `opacity` — zero właściwości wymuszających reflow).
   To nie jest sugestia: w late game przy setkach elementów + animacjach telefon się udławi, jeśli
   ruszysz layout.
2. **Globalny przełącznik „żywy UI on/off"** w ustawieniach (słabsze urządzenia). Domyślnie on.

---

## 12. Juice i ceremonie

W tym gatunku juice to nie ozdoba — to połowa przyjemności. Warstwy:

- **Feedback liczbowy** — każde kliknięcie wyrzuca odlatujące „+N"; liczniki **toczą się** w górę
  (tweening/easing), nie skaczą; zakup daje pulsację kafelka.
- **Przyciąganie uwagi** — zdarzenia-odpowiedniki „złotego ciasteczka" wjeżdżają z błyskiem i
  pulsują; headline na górnym pasku robi „breaking news" flash; **bank, który zaraz się odblokuje,
  migocze na obrzeżu pola widzenia** (operacjonalizacja „rzucania cienia").
- **Ceremonie** — **Denominacja ze ścinaniem zer na ekranie**, błyskiem, fanfarą (najmocniejszy
  moment, zasługuje na oprawę); sekwencja **bootowania** komputera przy starcie; animacja
  **wczytywania z kasety**; tekst pojawiający się **znak po znaku jak na terminalu**; przejścia w
  stylu plansz propagandowych.

**Wszystko GPU-only** (jak rozdz. 11). Animacja i wydajność to jedna decyzja, nie dwie.

---

## 13. Dźwięk

- **Web Audio API.** Opcjonalny w całości; cisza domyślna lub nie = ustawienie.
- **Dwie oddzielne magistrale** — osobno **muzyka**, osobno **SFX** — każda z własnym suwakiem i
  mute, plus **master**. (Ludzie często chcą efektów bez muzyki lub odwrotnie.)
- **Muzyka — rekomendacja: proceduralna generatywna** wprost w Web Audio (oscylatory, zero pliku =
  zero kwestii licencyjnych). Klimat: ambient w stylu **1-bitowego beepera ZX Spectrum** / chiptune'owe
  pady; wariant generatywny (niepowtarzający się dryf) nie nudzi się jak zapętlony plik. Opcjonalnie
  uzupełnienie gotowymi utworami **CC0 / public domain** (uwaga na rozróżnienie: CC0 = bez atrybucji;
  CC-BY = darmowe, ale wymaga wzmianki — to NIE „bez licencji"). Źródła wolnej muzyki: Free Music
  Archive (filtr CC0), OpenGameArt (CC0), Pixabay Music.
- **SFX** — syntezowane (najlepiej w duchu 1-bit beepera) lub próbkowane.

---

## 14. Statystyki, logi, Dziennik

Porządna zakładka w **trzech zakresach**:
1. **Legacy / all-time** (przez całą historię gry),
2. **bieżąca sesja**,
3. **bieżąca rozgrywka przed-prestiżowa**.

Metryki: sumy i tempa per zasób, czas gry, liczba Denominacji, widziane zdarzenia, zdobyte
osiągnięcia, **największy pojedynczy przyrost**. Plus **chronologiczne archiwum paska (Dziennik)** —
przewijalne w tył, by zobaczyć to, co przeleciało. **Dziennik i logi mają twardy limit i rotację
pamięci** (rozdz. 16 — inaczej rosną w nieskończoność).

---

## 15. Ustawienia (pełna lista)

- Notacja liczb (naukowa / nazwana / tematyczna),
- Animacje on/off,
- **Żywy UI on/off** (rozdz. 11),
- **CRT: suwak intensywności + pełny off** (rozdz. 10.2),
- Głośność: master / muzyka / SFX + mute każdej,
- Eksport / import save'a `.k7`,
- **Twardy reset** z mocnym potwierdzeniem,
- **Toggle każdego DLC** (on/off, nawet gdy paczka jest w pamięci) — **z wyraźnym ostrzeżeniem, że
  wyłączenie w trakcie grozi utratą postępu związanego z tym DLC.** Kto chce — proszę bardzo,
- Opcje czytelności,
- Powiadomienia (rozdz. 16).

---

## 16. Wydajność (rozdział krytyczny — late game tu umiera)

Wydajność jest kluczowa przy dużej liczbie akcji w późnej grze. Wymogi (wiele z nich nie da się
dokleić później — wbuduj od początku):

- **`break_infinity.js` od Fazy 0** (rozdz. 2). Denominacja dodatkowo łagodzi problem, regularnie
  ścinając liczby — ale biblioteka i tak konieczna.
- **Odsprzężenie symulacji od renderu**: stały krok symulacji (fixed timestep), render na
  `requestAnimationFrame`, **ciężkie liczenie zepchnięte do Web Workera**, by wątek UI był płynny.
- **Budżet ticku**: pojedynczy tick symulacji musi się mieścić w twardym limicie ms.
- **Postęp offline w postaci zamkniętej** (rozdz. 6.6) — powrót po dniach rozwiązuje się
  błyskawicznie.
- **Animacje wyłącznie GPU** (rozdz. 11–12).
- **Wirtualizacja długich list** — jeśli na ekranie są setki kafelków, renderuj tylko widoczne.
- **Rotacja pamięci** — Dziennik i logi z limitem (rozdz. 14).
- **Czas zapisu i szyfrowania** dużych save'ów — mierzony i utrzymany w ryzach.
- **Powiadomienia natywne** — push (Capacitor na Androidzie, web notifications w przeglądarce):
  „coś dojrzało / wystrzeliło zdarzenie". Bezpośrednio obsługuje „nigdy nie wiadomo, gdzie się będzie
  grać" i wielodniową cierpliwość — systemowy mechanizm „powodów, żeby wrócić".

---

## 17. Testy (przekrojowo, z naciskiem na wydajność)

**Po KAŻDEJ fazie** uruchamiasz testy i raportujesz, ZANIM właściciel zacznie testować ręcznie.
Bloki:

- **Jednostkowe / logiczne**: parser i ewaluacja formuł, ekonomia (koszty, produkcja, offline
  closed-form), **round-trip save'a** (serializacja → szyfrowanie → deszyfrowanie → identyczny stan),
  migracje save'a, scalanie i kolejność DLC, łagodna degradacja synergii.
- **Wydajnościowe (WYRÓŻNIONE)**:
  - **stress test late game** — maksimum budynków/ulepszeń/aktywnych zdarzeń naraz; pomiar czasu
    klatki,
  - **budżet ticku** — pojedynczy tick w limicie ms,
  - **wydajność na mobilce osobno** (słabszy sprzęt to inna liga),
  - **doganianie offline** — powrót po (symulowanych) dniach rozwiązuje się natychmiast,
  - **czas zapisu/szyfrowania** dużych save'ów,
  - **rotacja pamięci** — Dziennik/logi nie rosną w nieskończoność.
- **Tonalne**: czy żart na pasku / w zdarzeniu nie zgrzyta w praktyce (teoria ≠ praktyka). Oznacz
  wrażliwe zdarzenia (np. realia 1986 / panika z płynem Lugola) jako wymagające ręcznej oceny tonu.
- **Międzyplatformowe**: ten sam plik `.k7` wczytuje się na webie, Tauri i Capacitorze (Faza 6).
- **Bugowe / regresyjne** ogólne.

---

## 18. PLAN FAZOWY z bramkami (serce dokumentu — kolejność robót)

**Buduj dokładnie w tej kolejności.** Każda faza: cel → zakres → **bramka** (testy automatyczne, w
tym wydajnościowe gdzie wskazano) → **właściciel testuje ręcznie na localhoście** → dopiero przy
zielonym świetle następna faza. Nie wybiegaj naprzód.

### Faza 0 — szkielet i pętla rdzenia + fundamenty nie do odklejenia
**Zakres:** jeden zasób, klikanie, kilka budynków, tick, autozapis, brzydkie ale działające UI.
Fundamenty: `break_infinity.js`, odsprzężenie symulacji od renderu (fixed timestep + rAF + Web
Worker), format save'a `.k7` (pełny pipeline z rozdz. 4), data-driven loader treści (rozdz. 3) — od
początku ładuj nawet treść bazową jako paczkę.
**Cel:** czy klikanie i kupowanie sprawia satysfakcję?
**Bramka:** pętla przyjemna w pierwszych minutach; round-trip save'a działa; tick w budżecie.

### Faza 1 — głębia ekonomii
**Zakres:** trójwarstwowe zasoby (6.1), pełna drabina generatorów (6.2), ulepszenia (6.3), krzywa
kosztów (6.5), postęp offline closed-form (6.6), panel „Co dalej?" (6.4).
**Cel:** czy progresja przez pierwszą rozgrywkę wciąga i nie ma martwych ścian? (Tu stroimy krzywą
na żywo.)
**Bramka:** rozgrywka do pierwszego prestiżu trzyma; offline rozwiązuje się natychmiast.

### Faza 2 — prestiż i dziedzictwo
**Zakres:** Denominacja z ceremonią (7.1, 12), waluta odznaczeń, drzewo dziedzictwa (7.2–7.5) z
unikalnymi typami węzłów, okno wydawania między resetem a startem, offline współgrający z resetem.
**Cel:** czy chce się robić drugi i trzeci prestiż?
**Bramka:** pętla meta motywuje do powrotu; trwałość węzłów działa.

### Faza 3 — banki i juice
**Zakres:** giełda/czarny rynek → GPW (8.1), osiągnięcia 300+ (8.3), silnik zdarzeń Paradox-style z
łańcuchami (8.4), Leksykon (8.7), kadra (8.5), pełny juice i ceremonie (12), górny pasek z czterema
strumieniami (10.1), żywy UI (11), dźwięk (13). Minigry (8.2) — przynajmniej jedna jako dowód
koncepcji.
**Cel:** czy gra zaskakuje głębią i czy „żyje"? Efekt „Łoo, nie wiedziałem, że to tu jest".
**Bramka:** **stress test late game** (lawina elementów + zdarzeń + animacji w budżecie klatki, też
na mobilce); rotacja pamięci Dziennika; tonalna ocena paska/zdarzeń.

### Faza 4 — wielkie systemy historyczne
**Zakres:** łapówki/załatwianie (9.1), Zjazd PZPR jako wydarzenie ustawodawcze z doktrynami (9.2),
dyplomacja bloków (9.3). Wszystkie **wpięte multiplikatywnie w rdzeń**.
**Cel:** czy makro-warstwa pogłębia, a nie rozprasza? Czy wzór `core × …` czuć w praktyce?
**Bramka:** stress test z dodatkowymi systemami; brak rozjazdu balansu; tonalna ocena nowych
zdarzeń.

### Faza 5 — ekosystem DLC
**Zakres:** pełna architektura data-driven dla **zewnętrznych** paczek (3), **podpisy asymetryczne**
(klucz prywatny właściciela / publiczny w grze) + trójstopniowy model zaufania (5.4 → poprawne /
nienaruszone / oficjalne), tożsamość wizualna paczek (3.5), Studio DLC jako osobna strona (patrz
`STUDIO.md`), `DLC.md` jako kontrakt dla twórców. Realizacja wymogu „pre-patche dopuszczalne, ale
nigdy fundamentalne" — paczka zawsze działa na czystym silniku; opcjonalny patch tylko dosypuje
wodotrysk. Powtarzające się wzorce z DLC awansuj do rdzennego schematu.
**Cel:** czy da się zrobić paczkę z samego `DLC.md`, bez dotykania kodu gry?
**Bramka:** testowa paczka (człowiek/model) powstaje i ładuje się czysto; walidacja łapie błędy
zrozumiale; konflikty scalania wykrywane; oficjalna pieczęć weryfikuje się kluczem publicznym, a
podróbki — nie.

### Faza 6 — opakowania platformowe + synchronizacja
**Zakres:** dopiero gdy gra webowa dojrzała — PWA dopieszczona, **Tauri** (Windows), **Capacitor**
(Android), synchronizacja Firebase z **dławieniem** i **rozwiązywaniem konfliktów** (5.3–5.4),
**powiadomienia natywne** (16).
**Cel:** czy save `.k7` krąży czysto między trzema platformami?
**Bramka:** **ten sam plik wczytuje się wszędzie** (test międzyplatformowy); sync nie wypala kwot;
konflikt pokazuje okno wyboru; powiadomienia działają.

---

## 19. Granice i świadome kompromisy (nie „naprawiaj" ich)

- **Szyfrowanie/podpisy po stronie klienta: anti-casual, nie anti-determined** (4.3, 5.4). Nie buduj
  gry autorytatywnej na serwerze.
- **Brak anti-cheat serwerowego** — Firebase daje synchronizację, nie walidację (5.5). Akceptowalne
  dla gry dla kilku osób.
- **Skala graczy: kilka osób** (właściciel + znajomi). Architektura ma jednak skalować, gdyby
  projekt urósł — ale nie nadinżynieruj pod hipotetyczne tłumy.

---

## 20. Parametry do dostrojenia NA ŻYWO (nie ustalaj z góry — stroimy w testach)

Te rzeczy są subiektywne i ustala się je dopiero w działaniu, na localhoście, iteracyjnie:
- dokładny mnożnik kosztu (~1,15 jako punkt startu) i tempa wszystkich faz,
- progi przejść między fazami tempa (6.7),
- ostateczna nazwa drzewa dziedzictwa i samej gry (robocza: *Kombinat*),
- czy wprowadzać drugą warstwę prestiżu (7.6),
- kalibracja tonu wrażliwych zdarzeń (17),
- balans aktywne↔bierne i moment przejęcia przez biernie/automatyzację.

---

## 21. Skrót zobowiązań agenta (checklist mentalny)

- [ ] Buduj fazami; po każdej testuj (w tym wydajność) i czekaj na zielone światło właściciela.
- [ ] Trzymaj rdzeń data-driven; nigdy nie wpisuj treści na sztywno w silnik.
- [ ] Pamiętaj o swoim uprawnieniu (1.4) do dosypywania tematycznej treści w ramach tonu i schematu.
- [ ] Każdy bank rzuca cień przed otwarciem i przerasta oczekiwania.
- [ ] DLC i treść są multiplikatywne; wpinaj w rdzeń, nie obok.
- [ ] Zawsze nazwany cel; czekanie równoległe i wybrane, nigdy wymuszona ściana.
- [ ] Animacje wyłącznie GPU; żywy UI i CRT przełączalne; czytelność danych nienegocjowalna.
- [ ] `break_infinity.js`, sim/render split, offline closed-form, rotacja pamięci — od fundamentów.
- [ ] Save `.k7`: kompresja → AES-GCM → nagłówek+wersja → HMAC; dwa byty (autozapis vs plik).
- [ ] Szanuj granice z rozdz. 19 — to świadome kompromisy, nie bugi.
- [ ] `DLC.md` (uniwersalny, samowystarczalny) i `STUDIO.md` (dla Claude Code) to dokumenty
      towarzyszące — utrzymuj spójność z nimi.
