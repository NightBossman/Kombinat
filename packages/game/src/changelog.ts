// changelog.ts — Historia zmian pokazywana W GRZE (Statystyki → „Historia zmian"). Trzymać zgodne z
// korzeniowym CHANGELOG.md i numerem `APP_VERSION`. Najnowsza wersja na górze.
import { APP_VERSION } from './version';

export interface ChangelogEntry {
  version: string;
  date: string; // 'YYYY-MM-DD' albo '—'
  items: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: APP_VERSION, // 0.4.1
    date: '2026-07-01',
    items: [
      'Dyplomacja: każdy kraj w bloku ma teraz INNĄ premię (koszty, produkcja, cykle, dewizy, klikanie, „po trochu").',
      'Nowy kraj RWPG: Kuba. Opisy krajów powiązane z danym państwem.',
      'Widać, jaką korzyść da relacja jeszcze przed jej zacieśnieniem; postęp pokazywany z przecinkiem.',
      'Kraj z relacją na maksie ma teraz wyróżniającą obwódkę.',
      'Otwarte okno (Kadra, Statystyki, Leksykon, minigry…) zamkniesz ponownym kliknięciem jego guzika.',
      'W oknie Kadra widać dolny pasek walut (bez przyciemnienia), jak w innych oknach.',
    ],
  },
  {
    version: '0.4.0',
    date: '2026-06-30',
    items: [
      'Wielka rozbudowa ulepszeń — łącznie ponad 1000 trwałych bonusów (ulepszenia, drzewo, kamienie milowe).',
      'Nowe ulepszenia „za granie" w Taśmę, Kantor i Załatwianie.',
      'Głębsze drzewo Dziedzictwa z odsłaniającymi się węzłami i rosnącą liczbą poziomów.',
      'Studio DLC — osobna strona do tworzenia, walidacji i pieczętowania paczek DLC.',
      'Numer wersji i historia zmian przeniesione do okna Statystyki.',
      'Okno powrotu (offline): zawsze minuty, naprawiony zarobek przy dużym zapasie, drobne poprawki wyglądu.',
    ],
  },
  {
    version: '0.3.0',
    date: '—',
    items: [
      'Rdzeń gry, ekonomia (cykle i dewizy), drabina maszyn polskiej informatyki.',
      'Prestiż (Denominacja) i drzewo Dziedzictwa.',
      'Zdarzenia, osiągnięcia, giełda/kantor, kadra, minigra „Taśma".',
      'Wielkie systemy: Załatwianie, Zjazd PZPR z doktrynami, dyplomacja bloków.',
    ],
  },
];
