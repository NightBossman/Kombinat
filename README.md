<p align="center">
  <img src="docs/logo.svg" alt="Kombinat" width="580">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/wersja-0.4.3-5fa86a" alt="wersja 0.4.3">
  <img src="https://img.shields.io/badge/status-w%20budowie%20(pre--1.0)-d9b25a" alt="status: w budowie">
  <img src="https://img.shields.io/badge/Svelte-5-FF3E00?logo=svelte&logoColor=white" alt="Svelte 5">
  <img src="https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/PWA-offline-11180f" alt="PWA">
</p>

<p align="center">
  <b>Kombinat</b> to gra <i>idle / incremental</i> osadzona w realiach <b>późnego PRL</b> (lata ~1970–1990).<br>
  Budujesz drabinę polskiej informatyki — od liczydła po „spółkę z o.o." — w klimacie kolejek, talonów,
  cinkciarzy i propagandy sukcesu.
</p>

---

## <img src="https://api.iconify.design/lucide/sparkles.svg?color=%23d9b25a" width="22" align="top"> Co w środku

| | |
|---|---|
| <img src="https://api.iconify.design/lucide/calculator.svg?color=%235fa86a" width="18" align="top"> **Ekonomia i produkcja** | Dwa zasoby (cykle i dewizy), 11 maszyn polskiej informatyki, klikanie i automatyzacja. |
| <img src="https://api.iconify.design/lucide/sparkles.svg?color=%235fa86a" width="18" align="top"> **Ponad 1000 ulepszeń** | Ulepszenia główne, drzewo Dziedzictwa i kamienie milowe — „żeby się nie kończyły". |
| <img src="https://api.iconify.design/lucide/git-branch.svg?color=%235fa86a" width="18" align="top"> **Drzewo Dziedzictwa** | Trwałe po Denominacji (prestiż); głębokie, odsłaniające się węzły z rosnącą liczbą poziomów. |
| <img src="https://api.iconify.design/lucide/arrow-right-left.svg?color=%235fa86a" width="18" align="top"> **Minigry i mechaniki** | Kantor (giełda), „Taśma" (wczytywanie z magnetofonu), Załatwianie (łapówki). |
| <img src="https://api.iconify.design/lucide/landmark.svg?color=%235fa86a" width="18" align="top"> **Zjazd PZPR i doktryny** | Wybór „linii" na pięciolatkę — z prawdziwymi kompromisami (m.in. gierkowski boom‑bust). |
| <img src="https://api.iconify.design/lucide/globe.svg?color=%235fa86a" width="18" align="top"> **Dyplomacja bloków** | Relacje z krajami RWPG i Zachodu przesuwają koszty, produkcję i dopływ dewiz. |
| <img src="https://api.iconify.design/lucide/users.svg?color=%235fa86a" width="18" align="top"> **Kadra** · <img src="https://api.iconify.design/lucide/trophy.svg?color=%235fa86a" width="18" align="top"> **Osiągnięcia** · <img src="https://api.iconify.design/lucide/megaphone.svg?color=%235fa86a" width="18" align="top"> **Zdarzenia** | Werbunek postaci, setki osiągnięć i modalne mini‑historyjki w klimacie epoki. |
| <img src="https://api.iconify.design/lucide/stamp.svg?color=%235fa86a" width="18" align="top"> **Studio DLC** | Osobna strona do tworzenia, walidacji, pakowania i pieczętowania paczek DLC. |
| <img src="https://api.iconify.design/lucide/sunrise.svg?color=%235fa86a" width="18" align="top"> **Postęp offline** · <img src="https://api.iconify.design/lucide/download.svg?color=%235fa86a" width="18" align="top"> **Zapis `.k7`** | Gra liczy się także pod nieobecność; zapis lokalny, szyfrowany, z eksportem/importem. |

## <img src="https://api.iconify.design/lucide/boxes.svg?color=%23d9b25a" width="22" align="top"> Struktura repo (Gra i Studio razem)

To **jedno repozytorium (monorepo)** — i tak ma zostać. Gra i Studio dzielą ten sam, wersjonowany moduł
schematu (`@kombinat/shared`), więc trzymanie ich osobno rozjechałoby ich walidację. Hostowane są jako
**dwie osobne statyczne strony**, ale źródło żyje tu razem.

```
packages/
├─ shared/   @kombinat/shared — JEDNO ŹRÓDŁO PRAWDY: schemat treści, rejestr ID,
│            słownik efektów, bezpieczny parser formuł (bez DOM). Używają go GRA i STUDIO.
├─ game/     @kombinat/game   — sama gra (Svelte 5, PWA). Port dev 5173.
└─ studio/   @kombinat/studio — Studio DLC (osobna strona). Port dev 5174.
docs/        PLAN.md, DLC.md, STUDIO.md, ULEPSZENIA.md, STATUS.md
```

## <img src="https://api.iconify.design/lucide/gauge.svg?color=%23d9b25a" width="22" align="top"> Uruchomienie

```bash
npm install            # instalacja (workspaces)

npm run dev            # GRA          → http://localhost:5173
npm run dev:studio     # Studio DLC   → http://localhost:5174

npm test               # testy (shared + gra + studio)
npm run typecheck      # kontrola typów
npm run build          # produkcyjny build gry
npm run build:studio   # produkcyjny build Studia
```

## <img src="https://api.iconify.design/lucide/compass.svg?color=%23d9b25a" width="22" align="top"> Dokumentacja

Plany i kontrakty żyją w `docs/` (są nadrzędne wobec kodu):

- **[PLAN.md](docs/PLAN.md)** — plan budowy gry (fazy).
- **[DLC.md](docs/DLC.md)** — kontrakt dla twórców paczek DLC.
- **[STUDIO.md](docs/STUDIO.md)** — plan i zasady Studia DLC.
- **[ULEPSZENIA.md](docs/ULEPSZENIA.md)** — plan rozbudowy ulepszeń.
- **[STATUS.md](docs/STATUS.md)** — żywy stan prac.

## <img src="https://api.iconify.design/lucide/clock.svg?color=%23d9b25a" width="22" align="top"> Wersja i historia zmian

Aktualna wersja: **0.4.3** (pre‑1.0). Pełna lista zmian: **[CHANGELOG.md](CHANGELOG.md)**.
W grze wersję i historię zmian widać w oknie **Statystyki**.

## <img src="https://api.iconify.design/lucide/triangle-alert.svg?color=%23d9b25a" width="22" align="top"> Status

🚧 **To nie jest jeszcze pełna wersja gry.** Projekt jest w aktywnej budowie — liczby (koszty, mnożniki)
są startowe i strojone na bieżąco, a kolejne mechaniki dochodzą fazami.

---

<p align="center"><sub>© 2026 NightBossman · projekt w budowie · ikony: <a href="https://lucide.dev">Lucide</a></sub></p>
