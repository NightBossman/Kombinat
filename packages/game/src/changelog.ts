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
    version: APP_VERSION, // 0.4.3
    date: '2026-07-04',
    items: [
      'Po Denominacji gra STOI, dopóki nie przejdziesz przez ceremonię, dziedzictwo i wybór doktryny — nowa pięciolatka rusza dopiero po planszy „Nowa pięciolatka".',
      'Ten „przystanek" między pięciolatkami przeżywa zamknięcie gry: po powrocie wracasz do tego samego etapu, a nie do rozpoczętej rozgrywki.',
      'Wybór doktryny jest teraz dwuetapowy (klikasz, potem zatwierdzasz), z guzikiem powrotu do dziedzictwa. Czytelniejsze i wyśrodkowane guziki „dalej".',
      'Drzewo dziedzictwa: konary są równej długości (finały R&D i Rynku dorobione), a liczba poziomów = numer rzędu (koniec z pomieszanymi poziomami i kosztami od 7. rzędu). Nagłówki konarów nie zjeżdżają przy przewijaniu.',
      'Kantor pojawia się dopiero po kupieniu ZX Spectruma (wcześniej wyskakiwał od startu każdej kolejnej pięciolatki).',
      'Drobne: usunięty migający pasek/„błysk" przy szybkim kupowaniu maszyn; znacznik mnożnika (×10/×100) nie zmienia już wysokości kart.',
    ],
  },
  {
    version: '0.4.2',
    date: '2026-07-04',
    items: [
      'Eksport i import zapisu (.k7) przeniesione do Ustawień — nowa sekcja „Zapis".',
      'Podczas każdej minigry (i innych okien) nie wyskakują już powiadomienia o wydarzeniach — koniec z rozpraszaniem.',
      'Dyplomacja: bonus z relacji pokazywany z jednym miejscem po przecinku (np. „Dewizy +7,3%"); usunięto zbędny procent z paska postępu.',
      'Załatwianie: ryzyko kontroli opada nieco wolniej, a przy 100% nalot SB kasuje wszystkie trwające załatwienia; naraz działa najwyżej 6 bonusów. Krótszy opis Dygnitarza.',
      'Denominacja: guzik „Tak, denominuj" wygląda jak „Denominacja", a zysk odznaczeń jest wyraźnie wyróżniony; podczas pytania nie wyskakują złote ciastka.',
      'Maszyny: koszt przy mnożniku (×10/×100/Max) czytelnie oddzielony od kwoty.',
      'Nagłówki „Maszyny" i „Ulepszenia" zostają na miejscu przy przewijaniu (znika tylko pierwsza pozycja), a zaokrąglona ramka jest zawsze widoczna.',
      'Nowa opcja: wczytywanie grafiki minigry „Taśma" z góry — płynniejsze pierwsze otwarcie.',
    ],
  },
  {
    version: '0.4.1',
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
