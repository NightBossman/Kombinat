// settings.svelte.ts — Ustawienia urzadzenia (preferencje, NIE czesc save'a `.k7`). Trwale w
// localStorage. PLAN 15: zywy UI, animacje, CRT, dzwiek (master/muzyka/SFX + mute), powiadomienia.
const KEY = 'kombinat.settings.v1';

/** Dostepne style (Ustawienia → Styl). Domyslny to klimatyczna zielen PRL. */
export type ThemeId = 'prl' | 'bursztyn' | 'nowoczesny' | 'jasny';
/** Poziom trudnosci minigry „Tasma" (uwaga #5). 'sredni' = dotychczasowy. */
export type TasmaLevel = 'niski' | 'sredni' | 'wysoki' | 'bardzo';

export interface Settings {
  theme: ThemeId; // wybrany styl (podmienia zmienne CSS; 'prl' = domyslny z :root)
  tasmaLevel: TasmaLevel; // ostatnio uzyty poziom minigry „Tasma" (zapamietywany)
  liveUI: boolean; // mikrodrgania/oddychanie/poswiaty (PLAN 11)
  animations: boolean; // przejscia, popy, ceremonie (globalny wylacznik)
  crt: boolean; // nakladka CRT (PLAN 10.2) — nigdy nie dotyka czytelnosci danych
  crtIntensity: number; // 0..1
  master: number; // 0..1
  music: number; // 0..1 (0 = wyciszona)
  sfx: number; // 0..1
  mute: boolean; // globalne wyciszenie
  autosaveNotify: boolean; // toast przy autozapisie
  okazje: boolean; // czy pojawiają się „okazje" (złote ciastka, uwaga #21)
  cassette3d: boolean; // grafika 3D (Three.js/Threlte) w minigrze „Taśma" (uwaga #20)
  noChoiceEventModals: boolean; // czy pokazywać okno eventu, gdy nie ma realnego wyboru (≤1 opcja)
}

const DEFAULTS: Settings = {
  theme: 'prl',
  tasmaLevel: 'sredni',
  liveUI: true,
  animations: true,
  crt: false,
  crtIntensity: 0.5,
  master: 0.6,
  music: 0,
  sfx: 0.5,
  mute: false,
  autosaveNotify: true,
  okazje: true,
  cassette3d: true,
  noChoiceEventModals: true,
};

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) } : { ...DEFAULTS };
  } catch {
    return { ...DEFAULTS };
  }
}

const state = $state<Settings>(load());

/** Reaktywny dostep do ustawien (czytanie pol sledzi zmiany). */
export function settings(): Settings {
  return state;
}

export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
  state[key] = value;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* tryb prywatny / brak miejsca — ignoruj */
  }
}
