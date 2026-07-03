# STATUS.md — żywy stan prac nad „Kombinat"

> **Po co ten plik:** kiedy dzielę większą rzecz (np. fazę) na podpunkty, tu zapisuję **jak wygląda
> podział, DLACZEGO go zrobiłem i jaki jest AKTUALNY status każdego punktu** — i aktualizuję go na
> bieżąco. `PLAN.md` to plan docelowy (źródło prawdy); ten plik to bieżący „gdzie jesteśmy".
>
> Legenda statusu: ✅ zrobione · 🔄 w toku · ⏳ zaplanowane (nieruszane) · 💤 odłożone świadomie.
>
> Ostatnia aktualizacja: **2026-07-04**.

---

## Fazy (wg `PLAN.md` rozdz. 18)

Praca idzie **fazami, z bramką testową po każdej** — właściciel testuje ręcznie i daje zielone światło,
zanim ruszam dalej.

### ✅ Faza 0 — szkielet i pętla rdzenia
Pętla klikania/produkcji, format save `.k7`, fundamenty data-driven. Zamknięta.

### ✅ Faza 1 — głębia ekonomii
Silnik efektów, drugi zasób (dewizy), drabina generatorów, ulepszenia, kamienie milowe, postęp offline,
panel „Co dalej?". Zamknięta.

### ✅ Faza 2 — prestiż i dziedzictwo
Denominacja, drzewo dziedzictwa, ceremonia. Zamknięta.

### ✅ Faza 3 — banki i juice
**Dlaczego podział:** rozdz. 8 to kilka niezależnych „banków" — łatwiej robić i testować osobno.
- ✅ **3A** — zdarzenia (silnik w stylu Paradoxu) + Leksykon PRL.
- ✅ **3B** — osiągnięcia masowo (300+) jako „bank".
- ✅ **3C** — żywy UI + juice + dźwięk + Ustawienia.
- ✅ **3D** — giełda/kantor + kadra + minigra „Taśma".

### 🔄 Faza 4 — wielkie systemy historyczne (PLAN rozdz. 9)
*(Wszystkie trzy podfazy ZROBIONE — 4A zamknięta, 4B i 4C jako MVP czekają na test właściciela.
Bramka Fazy 4 wg PLAN: stress test z nowymi systemami, brak rozjazdu balansu, ocena tonalna.)*
**Dlaczego podział na 4A/4B/4C:** sam `PLAN.md` dzieli rozdz. 9 na 9.1/9.2/9.3, a każdy to OSOBNA wielka
mechanika z własną bramką testową. Zasada nadrzędna: to nie równoległe minigry, tylko trzy dźwignie na
tej samej rdzennej ekonomii (wszystko multiplikatywnie w `rdzeń × …`).

- ✅ **4A — Załatwianie i łapówki (PLAN 9.1).** Zamknięta na polecenie właściciela („Domknij fazę 4A").
  Wewnętrzny podział (każdy = osobny kawałek mechaniki):
  - ✅ Łapówki + ryzyko kontroli — `bribes`/BribeDef, czasowe mnożniki (prod/cost/dewizy/click), pasek
    ryzyka 0–100, kontrola SB powyżej progu. 4 cele (magazynier/celnik/urzędnik/dygnitarz).
  - ✅ **Towary-waluty** — wódka/kawa/papierosy jako osobne zasoby; „Zaopatrzenie" (kup za dewizy);
    drobne łapówki płacą TOWAREM, koperty dewizami (PLAN: „smarowanie towarem, nie gotówką").
  - ✅ **Talon na samochód** — mały kamień milowy po wielu załatwieniach (trwały bonus).
  - 💤 *(opcjonalnie później)* więcej towarów z PLAN (pończochy, czekolada), bony PEKAO jako waluta.
- 🔄 **4B — Zjazd PZPR + doktryny (PLAN 9.2).** MVP gotowy, czeka na test właściciela. Co działa:
  - ✅ Nowy data-driven typ treści `doctrines`/DoctrineDef (schema + walidacja + rejestr, jak łapówki).
  - ✅ „Zjazd PZPR" przy starcie nowej pięciolatki (po Denominacji) — wybór JEDNEJ doktryny na całą
    rozgrywkę; trwałe modyfikatory przez computeModifiers; reset przy Denominacji; można pominąć.
  - ✅ 5 doktryn: Przemysł ciężki, Dobra konsumpcyjne, Kredyty zachodnie (boom-bust), Propaganda
    sukcesu, Liberalizacja — każda z realnym kompromisem.
  - ✅ Boom-bust gierkowski: „Kredyty zachodnie" dają wielki rozpęd, ale po ~150 s rozgrywki wpada
    „Bomba zadłużenia" (zdarzenie `ev_kryzys_zadluzenia`) → flaga `kryzys` tnie produkcję do końca
    pięciolatki. Timer w tick (`updateDoctrineDebt`).
  - ✅ UI: okno ZjazdPZPR.svelte + wskaźnik aktywnej doktryny/kryzysu w panelu Denominacji.
  - 💤 *(do pogłębienia później)* doktryny zmieniające CZĘSTOTLIWOŚĆ/temperaturę zdarzeń (zaostrzenie
    vs liberalizacja), „oczekiwania" propagandy jako rosnące ryzyko; powiązanie ze Zjazdem co N pięciolatek.
- ✅ **4C — Dyplomacja bloków (PLAN 9.3).** MVP gotowy, czeka na test właściciela. Co działa:
  - ✅ Nowy data-driven typ `diplomacy`/DiplomacyDef (schema + walidacja + rejestr, jak bribes/doctrines).
  - ✅ 5 krajów/bloków: ZSRR (tania energia → koszty ↓), Węgry („gulaszowy komunizm" → dewizy ↑), NRD
    (Robotron → produkcja ↑), Japonia (most MSX → produkcja ↑), USA/Zachód (za murem CoCom → dewizy ↑,
    drogie i gated mazovią). Relacja 0–100 = flaga `relacja.<id>` (te same, które ruszają zdarzenia).
  - ✅ `improveRelation(id)` — inwestujesz dewizy (koszt rośnie 1,25×/krok + % majątku), relacja +10/krok
    do sufitu 100; computeModifiers stosuje bonus skalujący się z relacją (scope cost/prod/dewizy).
  - ✅ Mechanika odblokowana przy Odra 1305; zdarzenia: delegacja handlowa, szczyt RWPG, sankcje 1981.
  - ✅ UI: okno Dyplomacja.svelte (kraje wg bloku, pasek relacji, korzyść, przycisk „Zacieśnij"); guzik
    w pasku; keep-bar (widoczna kasa). Snapshot DyplomacjaView.
  - Inwestujesz dewizy w relację (koszt rośnie z poziomem) → stały bonus skalujący się z relacją.
  - Zdarzenia dyplomatyczne (delegacja, szczyt, sankcje po stanie wojennym 1981) — modifyRelation.
  - UI: okno Dyplomacja (kraje wg bloku, pasek relacji, korzyść, przycisk „zacieśnij"); guzik w pasku;
    keep-bar (widoczna kasa). Snapshot DyplomacjaView.

**Bramka Fazy 4 (wg PLAN):** stress test z nowymi systemami, brak rozjazdu balansu, ocena tonalna.

### ✅ Faza 5 — ekosystem DLC (PLAN rozdz. 3 + opis Fazy 5; kontrakty: `DLC.md`, `STUDIO.md`)
**STATUS: wszystkie podfazy (5A–5D + bramka 5F) ZROBIONE — czeka na ręczny test właściciela. Po zielonym
świetle: zamknąć Fazę 5 i ruszyć Fazę 5.5 (Studio DLC).**
**Dlaczego podział:** Faza 5 to kilka niezależnych warstw (silnik formuł, hooki, zaufanie, wygląd,
narzędzie). Każda ma własną bramkę. **Decyzje właściciela (2026-06-23):** zaczynamy od 5A (mini-język
formuł); **Studio (5E) wychodzi POZA Fazę 5** jako osobna runda później — Faza 5 = sam silnik DLC +
podpisy + wygląd + bramka z przykładową paczką.
**Zasada nadrzędna:** paczka zawsze działa na czystym silniku; pre-patch tylko dosypuje wodotrysk,
nigdy nie jest fundamentalny. Wzorce z DLC awansujemy do rdzennego schematu.

- ✅ **5A — mini-język formuł (bezpieczny) — MVP ZROBIONE, czeka na test.** Wąski język wyrażeń nad
  stanem gry dla kosztów/skalowania/warunków. Brak dostępu do DOM/sieci/plików. *Bramka:* parser+ewaluator
  przechodzą testy ✅; istniejące koszty/warunki wyrażone w języku bez zmiany balansu ✅ (165 testów).
  **USTALENIE (2026-06-23):** RDZEŃ języka był już zbudowany jako fundament Fazy 0 (lexer/parser/
  evaluator bez `eval`/`Function`, funkcje min/max/floor/ceil/round/abs/sqrt/log/log10/pow, błędy z
  pozycją, cache, `collectRefs`, walidacja paczek w `pack.ts`, rejestr przestrzeni nazw w `registry.ts`).
  Treść bazowa JUŻ wyraża krzywe kosztów formułami (`'15 * 1.15 ^ posiadane'`). Dlatego 5A = **dojrzenie
  języka w UCZCIWY kontrakt dla zewnętrznego DLC**, nie pisanie od zera. Podział 5A:
  - ✅ **5A.1 — uczciwe przestrzenie nazw.** `tempo.<zasob>` zwraca bieżącą produkcję/s (silnik wstrzykuje
    ostatnio policzone tempo przez `ContextOpts.tempo` → `engine.lastRates`, aktualizowane w tick()/snapshot();
    pętle kosztów/produkcji go nie dostają — bez rekurencji). `doktryna.<id>` = 1/0 (czy ta linia obowiązuje),
    `doktryna.aktywna` = 1/0 (czy jakakolwiek) — wprost ze `state.doctrine`. Wszystkie `makeContext(this.state)`
    przepięte na `this.queryCtx()` (wstrzykuje tempo).
  - ✅ **5A.2 — uczciwy rejestr kontraktu.** `CORE_COUNTRY_IDS` uzupełnione o `czechoslowacja` i `rfn` (7 krajów);
    dodane `CORE_DOCTRINE_IDS` (5 linii) i `doktryna.aktywna`/`maszyny.rodzaje` w `SCALAR_REFS`.
  - ✅ **5A.3 — testy bramki.** `formula.test.ts` +7 (krótki spięcie and/or, dzielenie/modulo przez zero → 0,
    refy skalarne, pozycja błędu). Nowy `phase5a.test.ts` (+6): paczka bazowa i paczka-sonda walidują się
    bez błędów; sonda bramkowana `tempo.cykle`/`doktryna.<id>` odblokowuje się end-to-end.
  - ✅ **5A.4 — synchron `DLC.md`.** Tabela 6.3 poprawiona: `relacja` skala 0…1000 (było błędne −100…100),
    `doktryna.<id>`=0/1, dodane `doktryna.aktywna`/`licznik`/`kadra`/`maszyny.rodzaje`/`czas.poraDnia`; nota,
    że `tempo`/`relacja`/`doktryna` są żywe.
  *(Zmiany 5A są ADDYTYWNE — żadna istniejąca formuła nie używa `tempo`/`doktryna`, balans bez zmian; 165 testów.)*
- ✅ **5B — hooki wpinania + determinizm scalania — MVP ZROBIONE, czeka na test.** `modify*` po stałych
  id, `addSynergy` (łagodna degradacja), jawny priorytet paczek, czytelne wykrywanie konfliktów.
  **USTALENIE (2026-06-23):** kontrakt już opisany w `DLC.md §8`; `mergeOrder` (priorytet→id) i kolizja
  ID=błąd już działały (Faza 0). Sekcje `synergies`/`patches` były ZBIERANE, ale NIGDZIE NIESTOSOWANE — 5B je ożywił:
  - ✅ **5B.1 — synergie aktywne (łagodna degradacja).** `computeModifiers` stosuje efekty synergii TYLKO
    gdy `requiresPack` jest wśród wczytanych paczek (`registry.packs`); bez niej brak bonusu (paczka działa sama).
  - ✅ **5B.2 — łatki (pre-patch) stosowane.** `PatchDef{target,set?,addCondition?}` nakładany w
    `applyPatches()` (buildRegistry) PO scaleniu, w kolejności mergeOrder: `set` nadpisuje pola celu,
    `addCondition` dokleja `(stary) and (nowy)` do unlock/trigger/condition. `id` nietykalne (warning).
  - ✅ **5B.3 — efekty warunkowe (`modify-if`).** `applyEffect` honoruje opcjonalne `effect.condition`
    (evalBool) — „pomnóż X, jeśli Y" z DLC 8.2 wykonalne (działa też w synergiach). Walidacja parsuje condition.
  - ✅ **5B.4 — czytelne konflikty.** dwie łatki w to samo pole → WARNING „kumulacja, ostatnia wygrywa";
    łatka w nieistniejący cel → ERROR; brak `requiresPack` synergii = normalne (cicho, łagodna degradacja).
  - ✅ **5B.5 — testy + DLC.md.** `pack.test.ts` +7 (set/addCondition/missing-target/kumulacja/id/synergia/condition),
    `phase5b.test.ts` +2 (synergia on/off, efekt warunkowy). `DLC.md §7/§8` dosynchronizowane. 175 testów.
- ✅ **5C — zaufanie i podpisy (3 stopnie) — MVP ZROBIONE, czeka na test.** poprawne → nienaruszone →
  **oficjalne** (podpis asymetryczny: klucz prywatny właściciela / publiczny w grze; Web Crypto).
  Nowy `packages/shared/src/trust.ts` (zgodny z `STUDIO.md §3/§7`, `DLC.md §11`): koperta „kombinat-dlc"
  {content, integrity: SHA-256, signature?: ECDSA-P256}; `sealPack` (integralność zawsze, podpis tylko
  z kluczem prywatnym = operacja właściciela), `verifyIntegrity`, `verifySignature`, `assessTrust`
  (schemat→integralność→podpis → tier invalid/valid/intact/official + etykieta społecznościowa/oficjalna).
  Wbudowany klucz publiczny = placeholder `OFFICIAL_PUBLIC_KEY_JWK=null` (uzupełni właściciel w 5.5 — bez
  niego nic nie jest „oficjalne", uczciwie). `shared/tsconfig` dostał lib `WebWorker` (typy Web Crypto bez DOM).
  *Testy:* `trust.test.ts` +7 — intact bez podpisu; oficjalna po podpisie+weryfikacji; PODRÓBKA (obcy klucz)
  nie przechodzi; ruszona treść psuje integralność i podpis; brak wbudowanego klucza = nie oficjalna;
  zły schemat = invalid. 182 testy (125 game + 57 shared). *(Podpisywanie w Studiu = Faza 5.5; gra tylko WERYFIKUJE.)*
- ✅ **5D — tożsamość wizualna paczek — MVP ZROBIONE, czeka na test.** `visualIdentity` w manifeście;
  silnik auto-nakłada akcent/pieczęć na całą treść paczki; oficjalne ≠ społecznościowe; RDZEŃ bez szwu.
  Mechanizm: `buildRegistry` zapisuje `packOf` (id treści→id paczki, pierwszy definiujący wygrywa) +
  `visualIdentities` (id paczki→VisualIdentity). Nowy `shared/visual.ts` `resolveVisualIdentity(reg, id,
  trustByPack?)` → {packId, accentColor, icon, official}. Silnik: `dlcVisual(id, corePackId)` w migawce
  (corePackId = właściciel zasobu klikalnego = rdzeń) → treść rdzenia bez akcentu/pieczęci, treść DLC z
  akcentem z manifestu + pieczęcią (official jeśli `trustByPack` mówi 'official', inaczej community).
  `GeneratorView.accent`/`dlcSeal`; `GeneratorCard` maluje `--pack-accent` (krawędź+lekka poświata) i
  pieczęć w rogu (BadgeCheck=oficjalna / Puzzle=społecznościowa). `engine.trustByPack` (pusty teraz —
  zewnętrznych paczek jeszcze nie wczytujemy; wypełni je wczytywanie zapieczętowanych paczek). Zasada
  „zero stylów per paczka": kolor z manifestu jako zmienna CSS, reguły generyczne.
  *Testy:* `visual.test.ts` +4 (pochodzenie, akcent, brak-identyzności=null, official/community),
  `phase5d.test.ts` +2 (DLC niesie akcent+pieczęć community; rdzeń bez szwu; official po trustByPack).
  189 testów (128 game + 61 shared). Zweryfikowane w podglądzie: rdzeń bez akcentu/pieczęci (bez szwu).
  UWAGA: zastany per-def `GeneratorDef.accent`/`accent:'inherit'` (z wcześniejszej iteracji) jest teraz
  NIEUŻYWANY — migawka bierze akcent z manifestu (zgodnie z PLAN 3.5); pole zostaje jako legacy/no-op.
- ✅ **5F — bramka Fazy 5 — ZALICZONA, czeka na test właściciela.** Przykładowa paczka „NRD — Robotron"
  napisana WYŁĄCZNIE jako dane wg `DLC.md` (`packages/game/test/fixtures/nrd.example.pack.json` — ZERO
  kodu gry). `phase5f.test.ts` (+12) dowodzi całego ekosystemu end-to-end: (a) paczka waliduje się i
  wtapia w rdzeń bez błędów; (b) łatki działają (re-flavor Spectrum przez `set`, zaostrzenie unlock
  Meritum przez `addCondition`); (c) efekt WARUNKOWY wzmacnia rdzenną Odrę dopiero po 8 Robotronach (5B);
  (d) synergia ZSRR aktywna TYLKO z pakietem zsrr (łagodna degradacja); (e) treść DLC dostaje akcent +
  pieczęć społecznościową, rdzeń bez szwu (5D); (f) walidacja łapie błędy ZE ŚCIEŻKĄ (zła formuła,
  nieznany efekt, łatka w nieistniejący cel, ID bez prefiksu); (g) pieczęć oficjalna weryfikuje się
  kluczem właściciela, a obcy klucz / ruszona treść — nie (5C). **Odpowiedź na cel Fazy 5: TAK — da się
  zrobić grywalną paczkę z samego `DLC.md`, bez dotykania kodu gry.** 201 testów (140 game + 61 shared).

### 🔄 Faza 5.5 — Studio DLC (osobna strona; rozdz. `STUDIO.md`)
*(Wszystkie podfazy 5.5A–5.5D ZROBIONE jako MVP — czekają na ręczny test właściciela. Po zielonym świetle:
zamknąć Fazę 5.5 i ruszyć Fazę 6.)*
Wydzielone z Fazy 5. Osobna statyczna strona (`packages/studio`, Svelte+Vite, ten sam `@kombinat/shared`)
do walidacji/konwersji/pakowania/podpisu paczek DLC. **KLUCZOWE:** logika już jest w shared (validatePack,
canonicalJson, sha256/sealPack/assessTrust, generateOfficialKeyPair, EFFECTS, CORE_*_IDS) — Studio to UI
nad tym (jedno źródło prawdy). ŻELAZNA REGUŁA (STUDIO §7.3): klucz prywatny NIGDY we wdrożonym bundlu.
Podział wg STUDIO §10:
- ✅ **5.5A — Hub + Walidator + Konwerter — MVP ZROBIONE (bramka spełniona), czeka na test właściciela.**
  Nowy workspace `packages/studio` (Svelte+Vite, port 5174, alias `@kombinat/shared` = to samo źródło co gra).
  `jsonc.ts` — własny parser JSONC ŚLEDZĄCY POZYCJE (komentarze, przecinki końcowe) → wartość + mapa
  ścieżka→offset (zgodna ze ścieżkami `validatePack`) → błędy z NUMEREM LINII bez zewn. biblioteki.
  `studio.ts` — `validateWorkingPack(text)`: parsuje JSONC → `validatePack` (shared) → mapuje błędy na linie
  + dokłada kontrolę odwołań efektów/łatek do generatorów/zasobów (rdzeń `CORE_*_IDS` + własne) z sugestią
  „czy chodziło o…?" (odległość edycyjna). `convertToCanonical` = `canonicalJson` (deterministyczny).
  `contract.ts` — ŻYWE tabele z shared (CORE ID, przestrzenie nazw, funkcje, słownik efektów) + szkielet.
  `App.svelte` — zakładki Walidator/Przewodnik: wklej/upuść JSONC → wszystkie błędy z liniami → konwersja +
  pobranie; Hub z tabelami, pobraniem `DLC.md`/szkieletu i renderowanym `DLC.md`. Styl spokojny (bez CRT/juice).
  *Bramka spełniona (testy):* NRD waliduje czysto; zła formuła/nieznany efekt/ID bez prefiksu/cel w nieistniejący
  generator (→ „mera450? czy chodziło o mera400") — wszystkie z liniami; konwersja deterministyczna + sortuje
  klucze. `studio.test.ts` (9). 214 testów (61 shared + 144 game + 9 studio). Typecheck/build czyste (statyk 131 KB).
  **+ 4 style graficzne spójne z grą** (życzenie właściciela): te same palety i id (`prl`/`bursztyn`/
  `nowoczesny`/`jasny`) skopiowane do `studio/app.css`; przełącznik w nagłówku, wybór zapamiętany w
  localStorage (`kombinat-studio-theme`); kod/JSON zawsze monospace (`--code`, nie zmieniany przez styl).
  Zweryfikowane na żywo: wszystkie 4 palety podmieniają zmienne (np. jasny `--bg #e9ead8`, bursztyn `#120d04`).
  Dodana konfiguracja podglądu `kombinat-studio` (port 5174) w `~/.claude/.claude/launch.json`.
  *Polerka na później (poza bramką):* ładniejszy render Markdown (teraz `DLC.md` jako tekst), szersza kontrola
  cross-ref (requires/unlockedBy/requiresPack). *(Uruchom: `npm run dev:studio`, port 5174.)*
  - ✅ **Poprawki stylu (2026-06-25):** (1) czarny pas na stylu „jasny" — motyw przeniesiony z `<body>` na
    `<html>`/`:root` (`document.documentElement.dataset.theme`, selektory `:root[data-theme=…]`) + `min-height:100vh`,
    więc tło `<html>` jest też jasne i nic nie prześwituje (zweryfikowane: html bg na jasnym = rgb(233,234,216)).
    (2) krzywy wybór stylu — nagłówek `align-items:flex-start` zamiast `center`; tytuł, selektor i „schemat"
    wyrównane do góry (top=20 px we wszystkich stylach, koniec zależności od wysokości opisu/czcionki).
- ✅ **5.5B — Integralność + Pakowanie — MVP ZROBIONE (bramka spełniona), czeka na test.** Po konwersji
  „Spakuj kopertę" → `sealEnvelope(pack)` = `sealPack` z shared (koperta „kombinat-dlc" + suma kontrolna
  SHA-256 nad `content`, BEZ podpisu — to robi właściciel w 5.5D) → pobranie `<id>.kombinat-dlc.json`.
  Nowa zakładka **„Sprawdź paczkę"**: wklej/upuść gotową kopertę → `verifyEnvelope` (assessTrust z shared) →
  stopień zaufania (poprawne/nienaruszone/oficjalne) + integralność + status podpisu. *Bramka (testy +3):*
  koperta ma hash; nietknięta = „nienaruszona"/społecznościowa; edycja `content` psuje hash → „valid"
  (była ruszana); śmieci → czytelny błąd. 12 testów studio (217 łącznie). *Polerka: pakowanie folderu z
  zasobami (ikony/dźwięki) do archiwum fflate — gdy dojdzie format paczki z plikami; teraz workflow = 1 JSONC.*
- ✅ **5.5C — Sprawdzanie konfliktów — MVP ZROBIONE (bramka spełniona), czeka na test.** Zakładka „Konflikty":
  upuść kilka paczek naraz (robocze JSONC lub gotowe koperty) → `parsePackFromText` (bierze `content` z koperty
  albo paczkę roboczą) → `analyzeConflicts`: `mergeOrder` (kolejność) + `buildRegistry` (kolizje ID = błąd,
  kumulacja łatek = info) + skan wspólnych celów efektów/łatek między paczkami (`forEachTarget`, wyodrębniony i
  współdzielony z cross-ref) → raport „Paczki X, Y celują w „generator:odra1305". Kumulacja w kolejności X → Y".
  *Bramka (testy +4):* 2 paczki w odra1305 → raport z kolejnością wg priorytetu (nrd → zsrr); różne cele → brak;
  kolizja ID → błąd; parsePackFromText przyjmuje roboczą i kopertę. 16 testów studio (221 łącznie).
  + **Słownik efektów: polskie znaki** (życzenie właściciela) — `summary` w `shared/effects.ts` przepisane z
  diakrytykami (było ASCII); + **wyśrodkowana, dyskretna stopka** w Studiu (nazwa/projekt/schemat + nota o
  100% lokalnym działaniu). Oba zweryfikowane na żywo.
- ✅ **5.5D — Podpis oficjalności (właściciel) — MVP ZROBIONE (bramka spełniona), czeka na test.**
  Narzędzie podpisu wg **Opcji A** (STUDIO §7.4): SAMODZIELNY skrypt `packages/studio/tools/sign-dlc.mjs`
  (Node, `node:crypto`), NIEimportowany przez stronę. Komendy: `keygen` (para ECDSA P-256; prywatny →
  `~/.kombinat-dlc-keys/…private.jwk` POZA repo, publiczny → do wklejenia), `sign <koperta> --key <priv>`
  (dokłada podpis), `verify` (publiczne sprawdzenie). Kanonikalizacja/bajty podpisu ZGODNE 1:1 z
  `shared/trust.ts` (test krzyżowy to pilnuje). **Wbudowany klucz publiczny WPISANY** w
  `shared/trust.ts` `OFFICIAL_PUBLIC_KEY_JWK` (para wygenerowana lokalnie; klucz PRYWATNY u właściciela,
  offline, poza repo i buildem). npm: `sign:dlc`, `audit:studio`.
  **ŻELAZNA REGUŁA §7.3 — audyt artefaktu (test, którego nie wolno pominąć):** `tools/audit-bundle.mjs`
  buduje bundle i skanuje WSZYSTKIE pliki — brak klucza prywatnego (pole „d” przy P-256), brak wycieku
  narzędzia, ORAZ kontrola pozytywna (klucz PUBLICZNY jest). `*.private.jwk`/`.kombinat-dlc-keys/` w
  `.gitignore`. *Bramka (testy +7):* paczka podpisana NARZĘDZIEM weryfikuje się jako OFICJALNA przez
  `shared.assessTrust` (kod gry); ruszona treść → traci oficjalność; podróbka (obcy klucz) → tylko
  nienaruszona; wbudowany klucz żywy i odrzuca obce podpisy; audyt bundla czysty. Dodatkowo (poza CI,
  realny klucz) potwierdzone: realny klucz prywatny → WBUDOWANY publiczny → „oficjalna”. 228 testów
  (144 game + 61 shared + **23 studio**). Typecheck + build (3 pakiety) czyste.
  + **Poprawka stylu (2026-06-29):** stopka „przekrzywiona" — `.site-foot p { margin:0 }` (klasa+element)
  bił specyficznością `.foot-sub` (sama klasa) i kasował mu `margin-left/right:auto` → blok 640 px lądował
  przy lewej. Fix: margines per-`<p>` (`.foot-main`/`.foot-sub` osobno, `margin:4px auto 0`). Zweryfikowane
  na żywo: środek foot-sub = środek foot-main = środek strony (640 px przy szer. 1280).
  + **Polerka Przewodnika (2026-06-29):** (1) „Pełne ścieżki skalarne" były zlepione (inline `<code>` bez
  tła) → teraz osobne CHIPY (`.chips`, jak przestrzenie nazw). (2) „Stabilne ID rdzenia": kontenery równej
  WIELKOŚCI (auto-fill zamiast auto-fit — ostatni rząd się nie rozciąga; `grid-auto-rows:1fr` — równa
  wysokość) + wartości i tytuły WYŚRODKOWANE (`.idtab` flex-column, `.idtab h3 text-align:center`,
  `.idtab .chips justify-content:center`). Zweryfikowane: 5 kafelków 294×188, oba rzędy równo. (3) Opis pod
  nagłówkiem: w „nowoczesnym" (sans-serif) mieścił się w 1 linii, w mono w 2 → przełączanie stylów zmieniało
  wysokość nagłówka i strona „podskakiwała". Fix: `.hdr p { min-height:3em }` (rezerwa 2 linii). Zweryfikowane:
  nagłówek = 90 px we WSZYSTKICH 4 stylach (koniec skoku).

### 🔄 Rozbudowa ulepszeń (inicjatywa U1–U6) — `docs/ULEPSZENIA.md`
**Decyzja właściciela (2026-06-29):** zamiast od razu Fazy 6 robimy DUŻE odłożone życzenie — doprowadzić
WSZYSTKIE ulepszenia (główne, dziedzictwo, minigry/mechaniki, kadra, doktryny, dyplomacja, kamienie milowe)
do liczby CZTEROCYFROWEJ (≥1000), „by się nie kończyły", z coraz większą liczbą poziomów w głębi.
**Podział na fazy (źródło prawdy: `docs/ULEPSZENIA.md`):**
- ✅ **U1 — Fundament — MVP ZROBIONE (bramka spełniona), czeka na test.** Generator
  `content/base/genUpgrades.ts` (jak `buildAchievements`): 5 rodzin z pulami nazw PRL + krzywymi +
  bramkowaniem progresją, ID `rdzen.gu_*`: per-maszyna drabiny (11×8=88, `posiadane.<gen> >= próg`,
  ×1.5/stopień), globalne skoki (10, wg `zasob.cykle`), obniżki kosztów (8), klikanie (8), dewizy (8) =
  **122 nowych**. Łącznie ulepszeń: 39 ręcznych → **161**. Migawka: `UpgradeView.group` (wywiedziona z
  efektu, BEZ zmian schematu → Studio/DLC zgodne) + `Snapshot.upgradeStats {owned,total,available}` +
  helper `upgradeGroup` (testowalny). UI `UpgradesPanel.svelte` przebudowane: licznik „wykupione N/M",
  szukajka (gdy ≥8 dostępnych), GRUPY zwijane, sort „stać Cię" przodem, „Kup dostępne (N)" per grupa.
  CSS `.up-*`. *Bramka (testy +7, `phaseU1.test.ts`):* generator deterministyczny; 122 wpisy z prefiksem
  `rdzen.gu_`; brak kolizji ID; cała treść waliduje się czysto; bramkowanie (gu_mul_osrodek_0 dopiero przy
  osrodek≥40); migawka niesie grupę+licznik; `upgradeGroup` klasyfikuje. 235 testów (151 game+61 shared+23
  studio), typecheck+build czyste. Zweryfikowane na żywo: licznik „0/161", grupy renderują, zwijanie działa
  (▾↔▸), konsola czysta. *Liczby STARTOWE — do strojenia.* Dalej U2 (pełna fala główna) — po zielonym świetle.
- ✅ **U2 — Główne ulepszenia: pełna fala — MVP ZROBIONE, czeka na test.** Generator rozszerzony do 6 rodzin:
  per-maszyna drabiny pogłębione (11×14=154), NOWA rodzina „filar gospodarki" (posiadanie maszyny → bonus
  GLOBALNY, 11×6=66), globalne (16), koszty (12), klikanie (12), dewizy (16) = **276 generowanych**. Łącznie
  ulepszeń rdzenia: **315** (39 ręcznych + 276). **Wydajność (bramka):** migawka budowała setki UpgradeView
  co klatkę i przekroczyła budżet (2,3 ms > 2 ms) — naprawione: dostępność liczona na JEDNYM `baseCtx`
  (zamiast `isUpgradeAvailable` budującego kontekst od nowa ×315) + cache statycznego opisu/grupy
  (`upMetaCache`). Po optymalizacji `tickbudget` zielony. *Testy (+3, `phaseU2.test.ts`):* generator 276 wpisów
  unikalnych; pula ≥300 waliduje się czysto; rodzina „filar" globalna i bramkowana posiadaniem. 238 testów
  (154 game+61 shared+23 studio), typecheck+build czyste. Zweryfikowane na żywo: licznik „0 / 315". Dalej U3.
- ✅ **U3 — Dziedzictwo: głębsze drzewo — MVP ZROBIONE, czeka na test.** Generator `content/base/genTree.ts`
  (`buildGeneratedTree()`): każdy z 3 konarów dostaje „nieskończony" ogon **14 węzłów ZAMGLONYCH** (fogged —
  odsłaniają się po kolei, gdy poprzednik ma ≥1 poziom; łańcuch `requires`), z **rosnącą liczbą poziomów**
  w głąb (3→9, życzenie „coraz więcej poziomów"). Aparat startuje PO finale „Order", R&D po „Dolinie",
  Rynek po „Koncie na Zachodzie". = 42 nowe węzły (ID `rdzen.gt_*`), drzewo: ~22 → **~64 węzły** (×poziomy =
  setki zakupów). Efekty: aparat global, R&D global+Odra, rynek dewizy+global. Koszt odznaczeń ×1,7/węzeł,
  ×2/poziom (silnik) — grind. UI bez zmian (drzewo już się przewija: `.tree-grid overflow-y:auto`, modal
  86vh; fogged trzyma porządek). *Testy (+4, `phaseU3.test.ts`):* generator deterministyczny 42 węzły; brak
  kolizji, drzewo ≥60 i waliduje się; poziomy rosną; ogon zamglony — `gt_aparat_0` niewidoczny bez „Order",
  widoczny po. 242 testy (158 game+61 shared+23 studio), typecheck+build czyste, konsola bez błędów. Dalej U4.
- ✅ **U4 — Ulepszenia od minigier — MVP ZROBIONE, czeka na test.** Generator `content/base/genMinigame.ts`
  (`buildMinigameUpgrades()`): 4 rodziny bramkowane LICZNIKAMI minigier (odblokowują się GRANIEM): Taśma
  (`licznik.tasma_lacznie`, 8, global ×1.12), Kantor (`licznik.gielda_transakcje`, 8, dewizy ×1.3),
  Załatwianie (`licznik.lapowki`, 8, koszt ÷1.12), Okazje (`licznik.zlote_klikniecia`, 6, klik) = **30 nowych**
  (ID `rdzen.gm_*`). Łącznie ulepszeń: **345**. Wpadają w istniejące grupy panelu (efekt → grupa). *Testy
  (+3, `phaseU4.test.ts`):* deterministyczny, 30 wpisów, brak kolizji, pula ≥340 waliduje się; „za Taśmę"
  odblokowuje się dopiero po `tasma_lacznie≥10`. 245 testów (161 game+61 shared+23 studio), typecheck+build
  czyste, konsola bez błędów, na żywo licznik „0/345". Dalej U5 (pozostałe + domknięcie ≥1000).
- ✅ **U5 — Pozostałe + domknięcie liczby — MVP ZROBIONE, czeka na test.** Generator
  `content/base/genMilestones.ts` (`buildGeneratedMilestones()`, jak `buildAchievements`): **386 masowych
  kamieni milowych** (ID `rdzen.ms_*`) — park maszyn (11×16), „filar" maszyny→global (11×6), bank cykli (24),
  skarbiec dewiz (16), „za granie" liczniki (7×12), prestiż (12+8). Auto-nadają trwały mały bonus po
  osiągnięciu progu. **Wydajność:** `checkMilestones` przeniesione na throttling ~4 Hz (jak osiągnięcia) —
  setki kamieni nie mogą biec 20 Hz. + **więcej kadry** (+4 archetypy: Spawacz/Księgowa/Magazynier/Dyrektor
  zjednoczenia), **+2 doktryny** z `lore` (Samowystarczalność, Eksport za wszelką cenę), **+1 kraj** (Bułgaria/
  Prawiec). **DOMKNIĘCIE: łączna liczba trwałych bonusów = 1170** (ulepszenia 345 + drzewo 64 + kamienie 395
  + osiągnięcia 342 + kadra 9 + doktryny 7 + dyplomacja 8) — **czterocyfrowa ✅**. *Testy (+5, `phaseU5.test.ts`):*
  generator 386 deterministyczny; brak kolizji + walidacja; kamień parku wyzwala się po progu (z throttlingiem);
  przybyło kadry/doktryn/krajów; suma ≥1000. Zaktualizowany `phase1` (kamień: tick 0.3 + tempo ≥×2, bo park
  też wpada). 252 testy (168 game+61 shared+23 studio), typecheck+build czyste, na żywo gra wstaje, konsola
  czysta. **Inicjatywa U1–U5 ZROBIONA — zostaje U6 (bramka całości: stress/balans/ton/test).**
- ✅ **U6 — Bramka całości — ZALICZONA, czeka na ręczny test właściciela.** Nowy `phaseU6.test.ts` (+7)
  dowodzi, że przy PEŁNEJ zawartości (wszystkie ulepszenia wykupione, całe drzewo na maks, wszystkie
  kamienie i osiągnięcia, cała kadra) gra jest: **wydajna** — `recomputeModifiers` **1,06 ms** (budżet 10),
  migawka **0,88 ms** (budżet 30), tick **0,08 ms** (budżet 15); **rozsądna w zapisie** — surowy JSON stanu
  **31,9 KB** (budżet 400, potem kompresja fflate); **stabilna** — żadne tempo nie jest NaN, **3× Denominacja**
  z pełną zawartością nie wywala i zachowuje trwałe drzewo, ulepszenia się resetują; **klimatyczna** —
  nazwy generowane bez „#"/undefined. **Potwierdzenie liczby: 1175** trwałych bonusów (≥1000 ✅). Żadnej
  optymalizacji nie trzeba było dokładać — wcześniejsze cache (koszt/opis ulepszeń) + throttling kamieni
  już dają ogromny zapas. 259 testów (175 game+61 shared+23 studio), typecheck+build czyste.
  **INICJATYWA U1–U6 ZAMKNIĘTA (MVP) — czeka na ręczny test właściciela; potem można ruszyć nowy plik
  mechanik/bajerów, a następnie Fazę 6.**
**Zasady:** to wciąż DANE (generatory jak `buildAchievements`); rodziny klimatyczne, nie wypełniacz; late
game zawsze ma co kupować; ID generowane `rdzen.gu_*`/`gt_*`/`gm_*` (bez kolizji z ręcznymi). NIE zaczynać
U1 bez zielonego światła.

### ⏳ Faza 6 — opakowania platformowe + synchronizacja
PWA/desktop + Firebase sync. **Odłożona** do czasu rozbudowy ulepszeń (decyzja 2026-06-29). Nieruszane.

---

## Rundy szlifu (poza fazami — na życzenie właściciela po testach)
Drobne poprawki zgłaszane z gry, nieprzypisane do jednej fazy:
- ✅ **2026-07-04 — batch poprawek (wersja 0.4.2) — czeka na test:**
  - **Zapis → Ustawienia:** guziki „Eksport .k7"/„Import .k7" przeniesione z dolnego paska do Ustawień
    (nowa sekcja „Zapis"); ResourceBar odchudzony (Zapisz/Ustawienia/Reset).
  - **Eventy pauzowane przy KAŻDEJ nakładce:** `eventsBusy` zastąpione subskrypcją `overlayOpen` w bridge —
    depesze czekają, aż gracz wróci na czysty pulpit (dotyczy wszystkich minigier: Taśma/Kantor/Załatwianie/
    Dyplomacja i przyszłych — wystarczy dodać ich „…Open" do `overlayOpen`). Ogólna reguła „nie rozpraszać".
  - **Dyplomacja:** `diplomacyEffectText` pokazuje bonus z JEDNYM miejscem po przecinku (np. „Dewizy +7,3%")
    zamiast pełnego %; USUNIĘTE `RelationView.relPct` i procent z paska postępu (błędne umiejscowienie z 0.4.1).
  - **Załatwianie:** `RISK_DECAY_PER_SEC` 1,5→1,0 (wolniej opada); przy ryzyku ≥100% `bribe()` robi nalot SB —
    `wipeBribeBuffs()` kasuje WSZYSTKIE trwające załatwienia i zeruje ryzyko; limit `ZAL_MAX_ACTIVE=6`
    aktywnych (blokada zakupu, `activeBribeCount()`). `activeBuffs` mają teraz `src:'bribe'|'okazja'`
    (ciastka nietykalne). ZalatwianieView: `activeBribes`/`maxBribes`; UI wyłącza guziki na limicie + odczyt.
    Skrócony opis Dygnitarza (1 linia).
  - **Denominacja:** „Tak, denominuj" = klasa `denom-btn` (wygląda jak „Denominacja"); zysk odznaczeń w
    oknie w `.denom-gain` (złoto, wytłuszczone); nowy store `denomConfirmOpen` w `overlayOpen` → podczas
    pytania nie ma złotych ciastek (i eventów).
  - **Koszt maszyn:** mnożnik jako „pastylka" PRZED kwotą (`.gen-mult` pill + `.gen-cost-val`, gap 7px) —
    koniec ze sklejonym „…cyklix100".
  - **Stałe nagłówki:** `GeneratorList`/`UpgradesPanel` mają teraz `.gen-scroll`/`.up-scroll` (obszar
    przewijany) — nagłówek (i filtr) siedzą poza nim; na desktopie kolumny `col-mid`/`col-right`
    `align-self:stretch`+`overflow:hidden`, moduł kapuje na 100%, scroll oddany liście. Ramka z zaoblonymi
    rogami zawsze widoczna; przewija się tylko lista. Zweryfikowane na żywo: nagłówek nieruchomy, 1. karta
    wjeżdża pod niego.
  - **Preload Taśmy:** nowa opcja `tasmaPreload` (dom. true, gdy 3D wł.) — `Minigra.svelte` rozgrzewa chunk
    `Cassette3D` w `requestIdleCallback` przy starcie, więc 1. otwarcie minigry jest płynne.
  - *Testy:* nowy `zalatwianie.test.ts` (+2: limit 6 + nalot 100%); `dyplomacja.test.ts` (bonus z 1 miejscem
    po przecinku zamiast relPct); `phase4a` (decay 1,0/s). **268 testów** (184 game + 61 shared + 23 studio),
    typecheck+build czyste. Zweryfikowane na żywo: Ustawienia (Zapis + preload), pastylka kosztu ×100,
    stały nagłówek przy scrollu, brak błędów w konsoli. Denominacja/Dyplomacja/Załatwianie (późna gra) —
    pokryte testami.
- ✅ **2026-07-01 — Dyplomacja + Kadra + zamykanie okien (wersja 0.4.1) — czeka na test:**
  - **Unikalne premie w bloku:** rozszerzone `DiplomacyDef.scope` (dodane `cykle`/`click`/`all`; walidator
    pack.ts nie sprawdzał enuma → Studio zgodne bez zmian). Silnik: nowa dźwignia `clickMul` (+clickPower),
    `computeModifiers` obsługuje 6 premii. Treść: w KAŻDYM bloku każdy kraj ma inną premię — Wschód: ZSRR
    cost / Czechosłowacja prod / NRD cykle / Węgry dewizy / Bułgaria click / **Kuba all** (nowy 6. kraj RWPG);
    Zachód: Japonia prod / RFN cost / USA dewizy. Opisy (flavor+benefit) powiązane z danym krajem.
  - **Czytelność:** `diplomacyEffectText` przy relacji zerowej pokazuje KIERUNEK premii (np. „Koszty ↓
    (relacja zerowa)") zamiast „Brak korzyści". Nowe `RelationView.relPct` (postęp % z 1 miejscem po
    przecinku, przecinek PL) — widać kroki <1%; pasek postępu ułamkowy (bez Math.round). Kraj na maksie:
    złota obwódka + ★ (`.dyp-country.maxed`).
  - **Kadra:** `kadraOpen` dołączone do `keep-bar` (App.svelte) → dolny pasek walut widoczny i bez
    przyciemnienia, jak w Kantorze/Załatwianiu/Dyplomacji.
  - **Zamykanie okien:** guziki sekcji w ResourceBar (Osiągnięcia/Leksykon/Kadra/Kantor/Załatwianie/
    Dyplomacja/Taśma/Statystyki/Ustawienia) przełączają (`update(v=>!v)`) — ponowne kliknięcie zamyka okno.
  - *Testy:* `dyplomacja.test.ts` (+7: unikalne premie/blok, Kuba, cykle/click/all działają, opis przy
    relacji zerowej, relPct „0,5"). 266 testów (182 game+61 shared+23 studio). Zweryfikowane na żywo: toggle
    Statystyk (otwórz→zamknij), wersja 0,4,1 w grze, konsola czysta. Dyplomacja/Kadra bramkowane postępem —
    pokryte testami.
- ✅ **2026-06-30 — okno powrotu (offline) — 6 poprawek — czeka na test:** (1) czas nieobecności pokazuje
  ZAWSZE minuty (fmtDuration: `if (m)` zamiast `if (m && !d)`). (2) **BUG: brakowało waluty** w raporcie,
  gdy miało się jej o rzędy wielkości więcej niż przybyło — `catchUp` liczył zarobek z różnicy „stan przed/po",
  która ginęła w precyzji `Decimal` (1e40+1e25≈1e40 → delta 0 → walutę pomijano). Fix: zarobek = TEMPO × czas
  (dokładnie tyle, ile dolicza tick). (3) usunięty kolorowy 3px pasek u góry okna (border-top). (4) guzik
  „Wracam do pracy" wyśrodkowany (`.offl-actions justify-content:center`). (5) zarobiona wartość ZAWSZE w
  jednej linii (`.offl-gains` flex-wrap + `.offl-gain white-space:nowrap`). (6) wykrzyknik w nagłówku
  („…towarzyszu!"). Test `offline.test.ts` (+2: waluta widoczna mimo gigantycznego zapasu; brak produkcji=0).
  + **wydajność migawki:** dod. cache kosztu STAŁEGO ulepszenia (`upMetaCache.staticCost`) — przy 345
  ulepszeniach migawka miała wąski zapas i flakowała pod obciążeniem; teraz z marginesem.
- ✅ **2026-06-29 — wersja → Statystyki + Changelog jako pod-zakładka — czeka na test:** numer wersji
  (`v0.3.0`) PRZENIESIONY z ekranu głównego do nagłówka okna **Statystyki**; Changelog wpięty tam jako
  **pod-zakładka** „Historia zmian" (obok „Statystyki"). Usunięte z ekranu głównego: `.version-row`/
  `.version-chip` (App.svelte + app.css), osobne okno `ChangelogWindow.svelte` (skasowane) i store
  `changelogOpen` (z bridge + z `overlayOpen`). Statystyki ma teraz `$state` przełącznik pod-zakładek.
  Zweryfikowane na żywo: wersja w nagłówku Statystyk, 2 pod-zakładki, brak wersji na ekranie głównym.
- ✅ **2026-06-25 — Dziedzictwo + Załatwianie (batch) — czeka na test:**
  - **BUG (freeze) naprawiony:** kupno tej samej łapówki drugi raz (np. „Kolacja z dygnitarzem") tworzyło
    dwa bonusy o tej samej nazwie → `{#each buffs as b (b.label)}` w GoldenCookie dawał DUPLIKAT KLUCZA →
    Svelte rzucał błąd i ZAMRAŻAŁ cały render zależny od migawki (pasek bonusów, pasek promocji, globalne
    odliczenia). Fix: każdy bonus ma unikalne `id` (`engine.buffSeq`), `{#each ... (b.id)}`.
  - **Dziedzictwo — osobna sekcja „zworników" USUNIĘTA**; węzły wpięte w konary: Attaché→Rynek,
    Druga gospodarka→Aparat, Order = wielki finał na końcu Aparatu (wymaga końca WSZYSTKICH 3 konarów).
  - **Więcej ulepszeń (drzewo „nie kończy się"):** +6 nowych głębszych węzłów (Aparatczyk, Centrala /
    Mikrokomputer, Demoscena, Dolina / Cinkciarz, Konto na Zachodzie) z rosnącą liczbą poziomów (5–7) i
    kosztem ×2/poziom. Konary mają teraz 9–10 węzłów (było 6+kapsuły).
  - **Eventy PAUZOWANE przy otwartym Dziedzictwie** (dodane `treeOpen` do `eventsBusy` w bridge).
  - **Każdy konar ma subtelny kolor:** Aparat=zieleń, R&D=błękit, Rynek=bursztyn (tytuł kolumny + leciutkie
    tło kafelka). Pasek statusu (lewa krawędź) zostaje niezależny.
  - **Dygnitarz — drugie ulepszenie + inny bonus:** dawał +produkcję (jak Urzędnik) → teraz daje KLIKANIE
    (`scope: click`, unikalne wśród 4 celów: cost/dewizy/prod/click). Dodano drugie ulepszenie płacone
    NOWYM towarem-luksusem **koniak** (Flaszka, supply jak wódka/kawa/papierosy). Teraz wszystkie 4 cele
    mają po 2 łapówki (towar + koperta) i osobny zakres efektu.
  - *Testy:* +2 (freeze: 2 bonusy o unikalnych id; Dygnitarz: 2 łapówki/koniak/scope click), zaktualizowany
    test struktury drzewa. 205 (144 game + 61 shared).
- ✅ **2026-06-25 — Kantor (6 poprawek) + naprawa kosztu dyplomacji — czeka na test:**
  - (1) ikona w nagłówku „Kantor pod Forum" (ArrowRightLeft, wzorzec `win-head`).
  - (2) **kurs naprawiony**: był stosunkiem produkcji cykle/dewizy → w late game absurdalne „bld cykli".
    Teraz STAŁA baza `GIELDA_BASE_RATE=12`, kurs ~6–17 (kilka–kilkanaście cykli za dewizę), niezależnie
    od skali. *(Uwaga balansowa: dewizy stają się dużo łatwiejsze do zdobycia przez kantor — świadomy
    wybór właściciela; do ewentualnego dostrojenia.)*
  - (3) okno wykresu wyższe o 10% (96→106 px). (4) większy odstęp wykres↔sekcje (margines 6→16 px).
  - (5) wahania kursu ŁAGODNE: wolne, nakładające się fale (okresy ~57 s i ~132 s) — kurs rozpędza się ku
    wychyleniom i miękko zawraca, bez nagłych skoków (`gieldaRateAt`).
  - (6) sekcje kupna/sprzedaży WYRAŹNIE rozróżnione kolorem: kupno=zieleń, sprzedaż=bursztyn (krawędź,
    nagłówek, ikona kierunku, kolor guzików) — rozpoznawalne kątem oka.
  - **Dyplomacja — koszt zacieśniania już NIE tanieje po zakupie.** Był to skutek uboczny (nie zamierzony):
    koszt skalował się z PORTFELEM (`zasob.dewizy`), a portfel malał po wydaniu → następny krok tańszy.
    Teraz skaluje się z PRODUKCJĄ dewiz (`tempo.dewizy`, stała mimo wydawania) — zacieśnianie jest zawsze
    coraz droższe (rośnie z poziomem relacji), nigdy tańsze. 7 formuł kosztu krajów zmienione.
  - *Testy:* +2 (kurs mały 3–30 mimo wielkiej produkcji; koszt dyplomacji monotoniczny). 203 (142 game+61 shared).
- ✅ **2026-06-24 — promocja Załatwiania (12 s) + wyrównany Pulpit — czeka na test:**
  - Promocja: okno **12 s** (było 10), rabaty **55/75/90%** równe szanse bez powtórki z rzędu, **co 2 min
    OD KOŃCA** poprzedniej. UWAGA: rework (nextDealAt/dealUntil, `pickDealPct`, `SUPPLY_DEAL_PCTS`) był JUŻ
    w źródle (zastany — nie z tej tury); ja ustawiłem `SUPPLY_DEAL_MS=12000`, naprawiłem zastany BŁĄD TYPÓW
    (`dealPct` inferowany jako literał `55` → `: number`) i zaktualizowałem test. To, co właściciel widział
    („co 10 s, −30%”) to był starszy build.
  - Pulpit: linia nagłówka wyrównana z resztą (wszystkie trzy bottom=89, zweryfikowane). Okazało się, że
    przy obecnym `min-height:24` nagłówków oryginalne `.col-special{padding:12px}` JUŻ daje równo (col-special
    ma strukturalny −2px vs moduły w sekcjach, który znosi nadmiarowy padding). Mój wcześniejszy eksperyment
    (−2px) psuł to → cofnięty.
- ✅ **2026-06-24 — wyrównane linie nagłówków + płynny pasek promocji — czeka na test:**
  - (1) linie pod nagłówkami sekcji na TYM SAMYM poziomie: selektor x1/x10/x100/Max pogrubiał nagłówek
    „Maszyn" (linia spadała niżej). Fix: `.section-head { min-height: 24px }` (jednolita wysokość wszędzie)
    + `.buy-amount-btn { line-height: 1 }` (guziki mieszczą się w linii tytułu). Zweryfikowane w podglądzie:
    Maszyny i Ulepszenia bottom=89, height=24 — równo. (Pulpit ma odwieczny offset 2px z paddingu `.col-special`
    — niezmieniony, relacja 1↔2 jak była.)
  - (2) pasek promocji w Załatwianiu PŁYNNY (był skokowy co 1 s): silnik liczy CIĄGŁY `supplyDeal.fill`
    (0..1, sub-sekundowo), UI interpoluje przez nowy `setSmoothBar`/`smoothBarOf` (`smooth.svelte.ts`, ta
    sama pętla rAF; duży skok=zmiana fazy snapuje bez animacji). REGUŁA na przyszłość: każdy odliczający
    pasek ma być płynny — [[smooth-counters-default]].
- ✅ **2026-06-23 — Taśma (3 poprawki) + stopka tylko globalne — czeka na test:**
  - (1) usunięty REDUNDANTNY komunikat „…wczytywanie…" w trakcie gry (tytuł okna już to mówi) → status
    w trakcie to teraz instrukcja „Naciśnij STOP w strefie SYNC!".
  - (2) niejasne „R Tape loading error" (easter egg ZX Spectrum) zamienione na czytelne „Chybienie!
    Taśma się zacięła — spróbuj znów.".
  - (3) HARDENING timerów (jednorazowy bug zapętlonego odliczania, nie do odtworzenia): `clearCd()`/
    `cancelRaf()` jako jedno źródło sprzątania; cooldown liczony od ZNACZNIKA CZASU końca (samonaprawialny,
    nie zliczanie) — nie da się go zapętlić; usunięty martwy stan `result`.
  - (4) **STOPKA pokazuje tylko waluty GLOBALNE** (reguła właściciela): towary lokalne wódka/kawa/papierosy
    (`ResourceDef.supply`) odfiltrowane (`ResourceView.local`); patrz pamięć [[kombinat-footer-global-currencies]].
- ✅ **2026-06-23 — Leksykon: zakładka „Doktryny" (lore) — czeka na test:** Leksykon ma teraz dwie zakładki
  („Hasła" + „Doktryny"). Zakładka Doktryny opisuje każdą doktrynę Zjazdu PZPR lore'owo (nowe pole
  `DoctrineDef.lore` = dłuższy opis historyczny; fallback na `flavor`), z osią (Gospodarka/Polityka),
  efektem mechanicznym i znacznikami „obowiązuje teraz"/„ryzyko zadłużenia". Zamglona, dopóki gracz nie
  odblokuje Zjazdu (1. Denominacja). **DATA-DRIVEN:** czyta `snapshot.zjazd.doctrines` z rejestru, więc
  KAŻDA nowa doktryna pojawi się automatycznie — REGUŁA: nowym doktrynom dawać `lore` (komentarz w
  `content/base/index.ts` + w `schema.ts`).
- ✅ **2026-06-22 — szlif drzewa Dziedzictwa:** wyrównanie kafelków (jedna siatka CSS), poziomy „Tablicy
  wyróżnień", czerwony pasek statusu dla niewykupionych/nie-na-maksie, podniesione koszty mid/late,
  profesjonalny tytuł karty + własny favicon SVG.
- ✅ **2026-06-22 — przywrócone łączniki w drzewie:** pionowe kreski łańcucha między węzłami konaru
  (`.tree-node.linked::before`) — omyłkowo usunięte przy przejściu na siatkę, teraz wróciły.
- ✅ **2026-06-22 — batch uwag z gry (6 punktów) — zrobione, czeka na test:**
  - (A) ✅ powiadomienie o bonusie („Rzut towaru!") bardziej wartościowe — symetryczny żółty pasek z
    prawej + złota poświata/puls.
  - (B) ✅ Zaopatrzenie: ceny w cyklu ~10 s z chwilowym OKNEM PROMOCJI (taniej) + info + pasek-wskaźnik.
  - (C) ✅ otwarcie Załatwiania i Kantoru NIE rozmywa/zaciemnia dolnego paska walut (jak przy Taśmie);
    usunięty zbędny podgląd cykli/dewiz w Kantorze.
  - (D) ✅ Leksykon rozszerzony o nowe hasła (załatwianie, cinkciarz, talon, kartki, Zjazd PZPR, Gierek).
  - (E) ✅ Dziedzictwo: następny węzeł wymaga ≥1 poziomu poprzedniego (nie maks.); liczba poziomów
    skaluje się z rzędem (1→2→3→4→5→6); koszty i efekty dostrojone.
  - (F) ✅ środkowa sekcja „Ulepszenia" zostaje widoczna (placeholder), zamiast znikać po wykupieniu.

- ✅ **2026-06-22 — uwagi do Fazy 4C (5 punktów) — zrobione, czeka na test:**
  - (1) ✅ pusta przestrzeń nad stopką — kolumny `.play` nie sięgały dołu (`align-self:start` na lewym
    panelu + `align-items:start`); teraz wypełniają wysokość (sekcje blisko stopki).
  - (2) ✅ dyplomacja: relacja 0–100 → **0–1000** (wolniejsze wbijanie); perPoint, krok i koszty dostrojone.
  - (3) ✅ dorobione kraje: **RFN** (Zachód) i **Czechosłowacja** (Blok wschodni).
  - (4) ✅ nagłówek „USA / Zachód" → **„USA"** (Zachód to nazwa kategorii).
  - (5) ✅ Japonia NIE w „Blok wschodni — RWPG" — osobna kategoria „Most technologiczny" (MSX).

- ✅ **2026-06-22 — uwagi #2 do 4C (runda poprawek) — czeka na test:**
  - (1) ✅ COFNIĘTE złe „rozciągnięcie" pierwszej sekcji (regres) — kolumny znów naturalnej wysokości.
    UWAGA: pustka pod krótką lewą kolumną jest naturalna (ma mniej treści niż wysoka kolumna maszyn);
    bez rozciągania (odrzucone) nie da się jej „dociągnąć do stopki" — to cecha układu wielokolumnowego.
  - (2) ✅ okno modalne nie wchodzi pod widoczny pasek walut (keep-bar): overlay rezerwuje wysokość stopki.
  - (3) ✅ Japonia przeniesiona do „Zachód" (kategoria „Most technologiczny" usunięta — może wróci); Zachód
    przemianowany na „Zachód i sojusznicy".
  - (4) ✅ kraje w kategoriach sortowane ALFABETYCZNIE (reguła na stałe w dyplomacji).
  - (5) ✅ ręczny krok relacji +20 → **+5**; koszt liczony od relacji/100 (nie od kroku); ulepszenie w
    dziedzictwie („Attaché handlowy", 5 poz. × +2) podnosi krok docelowo do **+15/klik** (efekt `diplomacyStep`).
  - (6) ✅ Leksykon — różne ikony (pole `LexiconDef.icon` + nazwane ikony) zamiast powtórek.
  - (7) ✅ nowe osiągnięcia zależne od Załatwiania, Doktryn i Dyplomacji (liczniki lapowki/zjazdy/dyplomacja).

- ✅ **2026-06-23 — batch usprawnień (9 punktów) — zrobione, czeka na test:**
  - (1) opcje kupna maszyn x1/x10/x100/Max (cena dostosowana do wyboru).
  - (2) ręczny zapis pod Ctrl+S.
  - (3) naprawiony kurs kantoru (był chory — 1 dewiza = absurd cykli); teraz wg stosunku tempa produkcji.
  - (4) główne liczniki (cykle/dewizy) znów z 2 miejscami po przecinku — bez trzęsienia (stałe dp).
  - (5) drzewo: „Attaché handlowy" wprostowany; symetryczny dół (3 zworniki) + nowy węzeł „Druga gospodarka".
  - (6) zakładka Statystyki (ikona/nagłówek/opis) — na razie PUSTA (właściciel dopisze treść później).
  - (7) Taśma: spacja = Wczytaj/Stop, strzałki ←/→ = zmiana poziomu.
  - (8) ładniejszy panel powrotu (offline) + reguła: na podsumowaniu ŻADNE powiadomienia/eventy/okazje —
    gra „wraca" dopiero po zamknięciu, wtedy czekające rzeczy się pojawiają.
  - (9) przycisk „Import" → „Import .k7".

## Większe życzenia odłożone (świadomie, na osobne rundy)
- ✅ **Czterocyfrowa liczba ulepszeń** (zwykłych i z dziedzictwa) — ZREALIZOWANE (U1–U5): łącznie **1170**
  trwałych bonusów, drzewo z rosnącymi poziomami. Zostaje już tylko U6 (bramka całości). `docs/ULEPSZENIA.md`.

---

## Stan techniczny
- Testy: **268 zielonych** (184 game + 61 shared + 23 studio). Typecheck i build czyste (3 pakiety). Wersja 0.4.2.
- Studio DLC: osobny workspace `packages/studio` (port 5174). `npm run dev:studio`, `npm run build:studio`.
- Podpis DLC (5.5D): `npm run sign:dlc -- keygen|sign|verify` (lub `node packages/studio/tools/sign-dlc.mjs`),
  audyt bundla `npm run audit:studio`. Klucz PUBLICZNY wbudowany w `shared/trust.ts`; PRYWATNY offline w
  `~/.kombinat-dlc-keys/` (poza repo). Rotacja: nowa para → podbij `OFFICIAL_PUBLIC_KEY_ID` (…-v2) + podmień klucz.
- Reguła dyplomacji: kraje w kategoriach ZAWSZE alfabetycznie (sort w `Dyplomacja.svelte`).
- Zakładka **Statystyki** celowo PUSTA (placeholder) — właściciel dopisze treść; szkielet gotowy.
- Komendy: `npm run dev` (:5173), `npm test`, `npm run typecheck` (z katalogu repo).
