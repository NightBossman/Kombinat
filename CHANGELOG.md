# Historia zmian

Wszystkie istotne zmiany w projekcie **Kombinat**. Format luźno wg [Keep a Changelog](https://keepachangelog.com/pl/),
wersjonowanie [SemVer](https://semver.org/lang/pl/). Gra jest **w budowie (pre‑1.0)**.

> Numer wersji żyje w trzech miejscach i musi być spójny: `packages/game/src/version.ts` (`APP_VERSION`),
> ten plik oraz `package.json`. W grze wersję widać w oknie **Statystyki** (nagłówek + „Historia zmian").

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
