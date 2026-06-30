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
    version: APP_VERSION, // 0.4.0
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
