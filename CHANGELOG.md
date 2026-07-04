# Historia zmian

Wszystkie istotne zmiany w projekcie **Kombinat**. Format luźno wg [Keep a Changelog](https://keepachangelog.com/pl/),
wersjonowanie [SemVer](https://semver.org/lang/pl/). Gra jest **w budowie (pre‑1.0)**.

> Numer wersji żyje w trzech miejscach i musi być spójny: `packages/game/src/version.ts` (`APP_VERSION`),
> ten plik oraz `package.json`. W grze wersję widać w oknie **Statystyki** (nagłówek + „Historia zmian").

## [0.4.3] — 2026-07-04

### Dodane
- **„Limbo" między pięciolatkami:** po Denominacji stara rozgrywka jest **zakończona**, a nowa **STOI**
  (nic nie produkuje), dopóki gracz nie przejdzie: ceremonia → **Dziedzictwo** → (Zjazd PZPR) → plansza
  „Nowa pięciolatka". Etap jest **trwały w zapisie** — po zamknięciu i ponownym otwarciu gry wracamy do
  DOKŁADNIE tego samego kroku (a nie do już rozpoczętej gry bez możliwości zakupu ulepszeń/doktryny).
  Formalny start nowej rozgrywki = **zniknięcie planszy** „Nowa pięciolatka" (trwa teraz 2 s).
- **Symetryczne finały konarów:** R&D („Krzemowy szczyt") i Rynek („Wielka prywatyzacja") dostały własne
  zwieńczenia rzędu 10 — konary są równej długości jak Aparat z „Orderem".

### Zmienione / naprawione
- **Wybór doktryny — dwuetapowy:** klikasz kartę (podświetlenie), potem **zatwierdzasz**; dochodzi guzik
  **„◀ Wróć do ulepszeń"**. Guziki „dalej" mają czytelniejsze, szczere nazwy i są **wyśrodkowane**
  (koniec z mylącym „Rozpocznij nową pięciolatkę", które brzmiało jak start gry).
- **Drzewo Dziedzictwa — porządek poziomów i kosztów:** **numer rzędu = liczba poziomów** węzła
  (naprawione „pomieszane" poziomy, dziury i złe koszty od 7. rzędu); koszty wejścia w głąb rosną
  monotonicznie. **Nagłówki konarów** (Aparat/R&D/Rynek) **nie zjeżdżają** przy przewijaniu (przypięte).
- **Kantor** odblokowuje się dopiero po **kupieniu ZX Spectruma** (a nie przez all-time produkcję dewiz,
  która przeżywała Denominację i wyskakiwała od startu każdej kolejnej pięciolatki).
- **Regresje z 0.4.2:** usunięty migający **poziomy pasek/„błysk"** przy szybkim kupowaniu maszyn;
  znacznik mnożnika (×10/×100) **nie wydłuża już kart** (koniec z „podskakiwaniem" przy zmianie mnożnika).

## [0.4.2] — 2026-07-04

### Dodane
- **Zapis w Ustawieniach:** guziki **Eksport .k7** i **Import .k7** przeniesione z dolnego paska do
  Ustawień (nowa sekcja „Zapis").
- **Preload minigry „Taśma":** nowa opcja w Ustawieniach — grafika 3D wczytywana już przy starcie strony,
  więc pierwsze otwarcie minigry jest płynne (bez „laga", istotne na słabszym sprzęcie).

### Zmienione / naprawione
- **Eventy nie rozpraszają w minigrach:** przy otwartej dowolnej minigrze (a także innych oknach)
  powiadomienia o wydarzeniach są wstrzymane i czekają, aż gracz wróci na pulpit. Reguła obejmuje też
  przyszłe minigry.
- **Dyplomacja:** bonus z relacji pokazywany z **jednym miejscem po przecinku** (np. „Dewizy +7,3%"),
  więc widać drobne kroki; usunięto zbędny procent z paska postępu.
- **Załatwianie:** ryzyko kontroli opada nieco **wolniej**; po dobiciu do **100%** nalot SB kasuje
  **wszystkie** trwające załatwienia i zeruje ryzyko; naraz może działać **najwyżej 6** bonusów
  (blokada zakupu kolejnych). Krótszy opis Dygnitarza (mieści się w jednej linii).
- **Denominacja:** guzik „Tak, denominuj" wygląda tak samo jak „Denominacja"; zysk odznaczeń w oknie
  potwierdzenia jest wyraźnie **wyróżniony**; podczas pytania nie wyskakują już „okazje" (złote ciastka).
- **Maszyny:** koszt przy wybranym mnożniku (×10/×100/Max) jest **czytelnie oddzielony** od kwoty
  (koniec ze sklejonym „…cyklix100").
- **Stałe nagłówki:** nagłówki „Maszyny" i „Ulepszenia" zostają na miejscu przy przewijaniu (znika tylko
  pierwsza pozycja), a zaokrąglona ramka modułu jest zawsze widoczna (góra i dół nie są ucinane).

## [0.4.1] — 2026-07-01

### Dodane
- **Dyplomacja — nowe premie:** w obrębie jednego bloku każdy kraj ma teraz **inną** premię
  (koszty / produkcja / cykle / dewizy / klikanie / „po trochu"); premia może się powtarzać tylko między
  blokami. Nowy kraj RWPG: **Kuba**. Opisy krajów powiązane z konkretnym państwem.

### Zmienione / naprawione
- Dyplomacja: przed zacieśnieniem relacji widać już, **jaką korzyść** kraj daje (zamiast „Brak korzyści");
  postęp relacji pokazywany z **miejscem po przecinku** (widać kroki <1%); kraj z relacją na maksie ma
  wyróżniającą **obwódkę**.
- Otwarte okno (Kadra, Statystyki, Leksykon, minigry…) można **zamknąć ponownym kliknięciem** jego guzika.
- Okno **Kadra** pokazuje dolny pasek walut (bez przyciemnienia), spójnie z innymi oknami.

## [0.4.0] — 2026-06-30

### Dodane
- **Wielka rozbudowa ulepszeń** — łącznie ponad **1000** trwałych bonusów: ulepszenia główne, drzewo
  Dziedzictwa i masowo generowane kamienie milowe.
- Nowe ulepszenia **„za granie"** w minigry/mechaniki (Taśma, Kantor, Załatwianie, Okazje).
- **Głębsze drzewo Dziedzictwa** — odsłaniające się węzły i rosnąca liczba poziomów w głąb.
- Nowa kadra, doktryny (z opisem historycznym) i kraj dyplomacji.
- **Studio DLC** — osobna strona do tworzenia, walidacji, pakowania i pieczętowania paczek DLC
  (`packages/studio`).
- Numer wersji i **Historia zmian** w oknie **Statystyki**.

### Zmienione
- Sprawdzanie kamieni milowych przeniesione na throttling ~4 Hz (wydajność przy setkach wpisów).

### Naprawione
- **Okno powrotu (offline):** czas nieobecności pokazuje zawsze minuty; naprawiony zarobek waluty, gdy
  masz jej o rzędy wielkości więcej niż przybyło (utrata precyzji); wartości zawsze w jednej linii;
  drobne poprawki wyglądu (wyśrodkowany przycisk, usunięty pasek u góry, wykrzyknik w nagłówku).

## [0.3.0]

### Dodane
- Rdzeń gry i pętla rozgrywki; ekonomia dwóch zasobów (cykle i dewizy); drabina maszyn polskiej informatyki.
- Prestiż (Denominacja) oraz drzewo Dziedzictwa.
- Zdarzenia w stylu Paradoxu, osiągnięcia (300+), giełda/kantor, kadra, minigra „Taśma".
- Wielkie systemy historyczne: Załatwianie i łapówki, Zjazd PZPR z doktrynami, dyplomacja bloków.
- Ekosystem DLC: bezpieczny język formuł, hooki wpinania, model zaufania (podpisy), tożsamość wizualna paczek.

[0.4.1]: https://github.com/NightBossman/Kombinat
[0.4.0]: https://github.com/NightBossman/Kombinat
[0.3.0]: https://github.com/NightBossman/Kombinat
