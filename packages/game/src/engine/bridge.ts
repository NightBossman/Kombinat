// bridge.ts — Strona UI: tworzy Worker, wystawia stany jako Svelte store i wysyla polecenia.
// Trzyma tez autozapis (co 3 min + przy chowaniu karty/zamknieciu) — PLAN 4.1 / 5.3 (dlawienie).
import { writable, derived } from 'svelte/store';
import type { OfflineGain, SerializedIssue, TickerLine, WorkerIn, WorkerOut } from './protocol';
import type { AchievementView, Snapshot } from './snapshot';
import { clearAutosave, loadAutosave, saveAutosave } from '../save/storage';
import { pushCapped } from './log';
import { playSfx } from './audio';
import { settings } from './settings.svelte';

export const snapshot = writable<Snapshot | null>(null);
export const ready = writable<{ issues: SerializedIssue[]; ticker: TickerLine[] } | null>(null);
export const toast = writable<string | null>(null);
/** Dane ceremonii Denominacji (null = brak). UI pokazuje nakladke. */
export const ceremony = writable<{ gained: string; unit: string } | null>(null);
/** Czy okno „Dziedzictwo” (drzewo) jest otwarte. */
export const treeOpen = writable<boolean>(false);
/** Czy drzewo otwarto w trybie „po Denominacji” (nowa pieciolatka) — zmienia stopke okna. */
export const treeStartFlow = writable<boolean>(false);
/** Raport offline (null = brak) — pokazywany jako okno na srodku, nie znikajacy toast. */
export const offlineReport = writable<{ durationText: string; gains: OfflineGain[] } | null>(null);
/** Krotka plansza przejscia „nowa pieciolatka” po wyjsciu z drzewa po Denominacji. */
export const newRunSplash = writable<boolean>(false);

/** Czy okno „Zjazd PZPR” (wybór doktryny na nową pięciolatkę) jest otwarte (Faza 4B). */
export const zjazdOpen = writable<boolean>(false);

/** Plansza „nowa pięciolatka” + ewentualny splash (wspólne dla ścieżki ze Zjazdem i bez). */
function runSplash(): void {
  newRunSplash.set(true);
  setTimeout(() => newRunSplash.set(false), 1800);
}

/** Zamyka drzewo po Denominacji. Jeśli Zjazd odblokowany — najpierw wybór doktryny, potem start. */
export function startNewRun(): void {
  treeOpen.set(false);
  treeStartFlow.set(false);
  let unlocked = false;
  snapshot.subscribe((s) => (unlocked = !!s?.zjazd?.unlocked))();
  if (unlocked) zjazdOpen.set(true);
  else runSplash();
}

/** Wybór doktryny na Zjeździe i start pięciolatki (Faza 4B). `id=''` = pominięcie (bez doktryny). */
export function chooseDoctrine(id: string): void {
  if (id) {
    playSfx('upgrade');
    send({ type: 'chooseDoctrine', id });
  }
  zjazdOpen.set(false);
  runSplash();
}

/** Otwiera drzewo w trybie podgladu (w trakcie gry, bez „nowej pieciolatki”). */
export function openTree(): void {
  treeStartFlow.set(false);
  treeOpen.set(true);
}

/** Zamyka drzewo bez ceremonii (gdy otwarto je tylko do podejrzenia w trakcie gry). */
export function closeTree(): void {
  treeOpen.set(false);
  treeStartFlow.set(false);
}

// --- Dziennik: chronologiczne archiwum zdarzeń z TWARDYM limitem i rotacją pamięci (PLAN 14/16) ---
export interface DziennikEntry {
  id: number;
  t: number;
  kind: string;
  text: string;
}
export const dziennik = writable<DziennikEntry[]>([]);
export const dziennikOpen = writable<boolean>(false);
const DZIENNIK_MAX = 200; // twardy limit — starsze wpisy wypadają (inaczej rośnie w nieskończoność)
let dziennikId = 0;
let lastLoggedEventId: string | null = null;
function logDziennik(kind: string, text: string): void {
  dziennik.update((arr) => pushCapped(arr, { id: dziennikId++, t: Date.now(), kind, text }, DZIENNIK_MAX));
}

const AUTOSAVE_MS = 180000; // 3 minuty (PLAN 4.1)

let worker: Worker | null = null;
let started = false;
let saveResolvers: ((bytes: Uint8Array<ArrayBuffer>) => void)[] = [];


function showToast(msg: string): void {
  toast.set(msg);
  setTimeout(() => toast.update((t) => (t === msg ? null : t)), 4500);
}

function fmtDuration(sec: number): string {
  const s = Math.floor(sec);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const parts: string[] = [];
  if (d) parts.push(`${d} d`);
  if (h) parts.push(`${h} godz.`);
  if (m) parts.push(`${m} min`); // minuty pokazujemy ZAWSZE, gdy są (także obok dni/godzin)
  if (!parts.length) parts.push(`${s} s`);
  return parts.join(' ');
}

function send(msg: WorkerIn, transfer: Transferable[] = []): void {
  worker?.postMessage(msg, transfer);
}

function onMessage(msg: WorkerOut): void {
  switch (msg.type) {
    case 'ready': {
      ready.set({ issues: msg.issues, ticker: msg.ticker });
      const firstError = msg.issues.find((i) => i.level === 'error');
      if (firstError) showToast('Błąd treści: ' + firstError.message);
      break;
    }
    case 'snapshot': {
      // Dziennik (uwaga: domknięcie Fazy 3) — loguj „to, co przeleciało": nowe zdarzenia i osiągnięcia.
      const ev = msg.snapshot.activeEvent;
      if (ev) {
        if (ev.id !== lastLoggedEventId) {
          lastLoggedEventId = ev.id;
          logDziennik('event', ev.title);
        }
      } else {
        lastLoggedEventId = null;
      }
      for (const a of msg.snapshot.achievements.justEarned) logDziennik('achievement', 'Osiągnięcie: ' + a.name);
      snapshot.set(msg.snapshot);
      break;
    }
    case 'save': {
      const bytes = new Uint8Array(msg.bytes);
      saveAutosave(bytes);
      const resolvers = saveResolvers;
      saveResolvers = [];
      for (const r of resolvers) r(bytes);
      break;
    }
    case 'restored':
      showToast(msg.ok ? 'Wczytano save' : 'Nie wczytano: ' + (msg.error ?? 'błąd'));
      break;
    case 'offline':
      // Okno na srodku ekranu (nie toast) — gracz sam zamyka.
      offlineReport.set({ durationText: fmtDuration(msg.seconds), gains: msg.gains });
      logDziennik('offline', 'Powrót po przerwie (' + fmtDuration(msg.seconds) + ')');
      break;
    case 'denominated':
      ceremony.set({ gained: msg.gained, unit: msg.unit });
      logDziennik('denom', 'Denominacja: +' + msg.gained + ' ' + msg.unit);
      break;
    case 'achievements':
      achievementsList.set(msg.entries);
      break;
    case 'okazja': {
      playSfx(msg.kind === 'kontrola' ? 'event' : 'achievement');
      okazjaFlash.set({ kind: msg.kind, title: msg.title, detail: msg.detail });
      setTimeout(() => okazjaFlash.update((v) => (v && v.title === msg.title ? null : v)), 4000);
      logDziennik('okazja', msg.title + ' — ' + msg.detail);
      break;
    }
    case 'bribeResult': {
      if (!msg.ok) break;
      playSfx(msg.kontrola ? 'event' : 'buy');
      const title = msg.title ?? 'Załatwione';
      okazjaFlash.set({ kind: msg.kontrola ? 'kontrola' : 'bribe', title, detail: msg.detail ?? '' });
      setTimeout(() => okazjaFlash.update((v) => (v && v.title === title ? null : v)), 4000);
      logDziennik(msg.kontrola ? 'kontrola' : 'bribe', title + (msg.detail ? ' — ' + msg.detail : ''));
      break;
    }
    case 'error':
      showToast('Błąd silnika: ' + msg.message);
      break;
  }
}

export function initEngine(): void {
  if (started) return;
  started = true;

  worker = new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
  worker.onmessage = (ev) => onMessage(ev.data as WorkerOut);

  const auto = loadAutosave();
  send({ type: 'init', saveBytes: auto ? (auto.buffer as ArrayBuffer) : null });

  setInterval(() => void autosaveTick(), AUTOSAVE_MS);

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') void saveNow();
    });
    window.addEventListener('beforeunload', () => send({ type: 'requestSave' }));
  }
}

/** Cykliczny autozapis z dyskretnym powiadomieniem (przelaczalnym w przyszlosci). */
async function autosaveTick(): Promise<void> {
  await saveNow();
  if (settings().autosaveNotify) showToast('Zapisano automatycznie');
}

/** Prosi worker o save, zapisuje autozapis i zwraca bajty (do eksportu). */
export function saveNow(): Promise<Uint8Array<ArrayBuffer>> {
  return new Promise((resolve) => {
    saveResolvers.push(resolve);
    send({ type: 'requestSave' });
  });
}

/** Reczny zapis "koncze teraz" z potwierdzeniem dla gracza (PLAN 4.1). */
export async function manualSave(): Promise<void> {
  await saveNow();
  showToast('Zapisano kombinat');
}

export function click(): void {
  playSfx('click');
  send({ type: 'click' });
}

/** Wybrana liczba sztuk na zakup: 1 | 10 | 100 | 'max' (UI „Maszyny i sprzęt"). */
export type BuyAmount = 1 | 10 | 100 | 'max';
export const buyAmount = writable<BuyAmount>(1);

export function setBuyAmount(a: BuyAmount): void {
  buyAmount.set(a);
  send({ type: 'setBuyAmount', amount: a });
}

/** Kup generator — liczbę sztuk rozwiązuje silnik wg wybranej opcji (x1/x10/x100/Max). */
export function buy(id: string): void {
  playSfx('buy');
  send({ type: 'buy', id });
}

export function buyUpgrade(id: string): void {
  playSfx('upgrade');
  send({ type: 'buyUpgrade', id });
}

export function buyTreeNode(id: string): void {
  playSfx('tree');
  send({ type: 'buyTreeNode', id });
}

export function chooseEvent(index: number): void {
  playSfx('event');
  send({ type: 'chooseEvent', index });
}

/** Werbunek postaci do kadry (pasywny bonus per-rozgrywka). */
export function recruitCharacter(id: string): void {
  playSfx('upgrade');
  send({ type: 'recruitCharacter', id });
}

/** Wymiana na kantorze: dir 'buy' (cykle->dewizy) / 'sell' (dewizy->cykle); frac w (0..1]. */
export function exchange(dir: 'buy' | 'sell', frac: number): void {
  playSfx('buy');
  send({ type: 'exchange', dir, frac });
}

/** Nagroda z minigry „taśma” (jakosc 0..1; mult skaluje wg trudnosci). */
export function minigameReward(quality: number, mult = 1): void {
  playSfx('event');
  send({ type: 'minigameReward', quality, mult });
}

/** Czy okno Kadry jest otwarte. */
export const kadraOpen = writable<boolean>(false);
/** Czy okno Kantoru/gieldy jest otwarte. */
export const gieldaOpen = writable<boolean>(false);
/** Czy minigra „taśma” jest otwarta. */
export const minigraOpen = writable<boolean>(false);

/** Komunikat „okazji" (złote ciastko, uwaga #21) — pokazywany przez chwilę po kliknięciu. */
export const okazjaFlash = writable<{ kind: string; title: string; detail: string } | null>(null);

/** Kliknięcie w „okazję" (złote ciastko) — losowy bonus w klimacie PRL. */
export function clickOkazja(): void {
  send({ type: 'clickOkazja' });
}

/** Czy okno „Załatwianie" (łapówki) jest otwarte. */
export const zalatwianieOpen = writable<boolean>(false);

/** Daj łapówkę celowi `id` (Faza 4A). */
export function bribe(id: string): void {
  send({ type: 'bribe', id });
}

/** Zaopatrz się w towar reglamentowany `id` za dewizy (Faza 4A) — potem smarujesz nim taniej. */
export function buySupply(id: string): void {
  playSfx('buy');
  send({ type: 'buySupply', id });
}

/** Czy okno „Dyplomacja" jest otwarte (Faza 4C). */
export const dyplomacjaOpen = writable<boolean>(false);

/** Czy okno „Statystyki" jest otwarte (na razie placeholder — treść dojdzie później). */
export const statystykiOpen = writable<boolean>(false);

/** Czy otwarte jest okno potwierdzenia Denominacji (lokalne dla panelu, ale globalnie „zajmuje" gracza —
 *  blokuje złote ciastko i pauzuje eventy, by nic nie wyskakiwało nad pytaniem o nową pięciolatkę). */
export const denomConfirmOpen = writable<boolean>(false);

/** Zacieśnij relację z krajem/blokiem `id` za dewizy (Faza 4C). */
export function improveRelation(id: string): void {
  playSfx('buy');
  send({ type: 'improveRelation', id });
}

/** Czy okno Leksykonu jest otwarte. */
export const lexiconOpen = writable<boolean>(false);

/** Czy okno Ustawien jest otwarte. */
export const settingsOpen = writable<boolean>(false);

/** Czy okno Osiagniec jest otwarte + pelna lista (ladowana na zadanie). */
export const achievementsOpen = writable<boolean>(false);
export const achievementsList = writable<AchievementView[] | null>(null);

export function requestAchievements(): void {
  send({ type: 'requestAchievements' });
}

export function denominate(): void {
  playSfx('denom');
  send({ type: 'denominate' });
}

/** Znacznik czasu do unikalnej nazwy pliku: kombinat-RRRRMMDD-GGMMSS.k7 */
function fileStamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

export async function exportSave(): Promise<void> {
  const bytes = await saveNow();
  const blob = new Blob([bytes], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  const name = `kombinat-${fileStamp()}.k7`;
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.style.display = 'none';
  // Kotwica MUSI byc w DOM, a URL wolno zwolnic dopiero PO rozpoczeciu pobierania —
  // natychmiastowy revokeObjectURL obcinal plik w niektorych przegladarkach (psul import).
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    a.remove();
  }, 10000);
  showToast('Wyeksportowano ' + name);
  logDziennik('export', 'Wyeksportowano zapis: ' + name);
}

export async function importSave(file: File): Promise<void> {
  const buf = await file.arrayBuffer();
  saveAutosave(new Uint8Array(buf));
  send({ type: 'restore', saveBytes: buf }, [buf]);
}

export function resetGame(): void {
  send({ type: 'reset' });
  clearAutosave();
  showToast('Wykonano reset');
}

/** Czy otwarta jest JAKAŚ blokująca nakładka/okno — wtedy „okazje" się nie pojawiają (uwaga:
 *  złote ciastko nie ma wyskakiwać podczas eventu, minigry, ceremonii ani innego okna, bo nie da
 *  się na nie zareagować wymiernie, gdy jest się czymś zajętym). Event sprawdzamy osobno (migawka). */
export const overlayOpen = derived(
  [
    treeOpen,
    lexiconOpen,
    settingsOpen,
    achievementsOpen,
    kadraOpen,
    gieldaOpen,
    minigraOpen,
    dziennikOpen,
    zalatwianieOpen,
    zjazdOpen,
    dyplomacjaOpen,
    statystykiOpen,
    denomConfirmOpen,
    offlineReport,
    ceremony,
    newRunSplash,
  ],
  ([tree, lex, set, ach, kad, gie, mini, dz, zal, zja, dyp, sta, den, off, cer, nrs]) =>
    tree || lex || set || ach || kad || gie || mini || dz || zal || zja || dyp || sta || den || off !== null || cer !== null || nrs,
);

// Licznik zdarzeń PAUZUJEMY, gdy otwarta jest JAKAKOLWIEK nakładka/okno (minigra, Kantor, Załatwianie,
// Dyplomacja, drzewo, raport offline, ceremonia, potwierdzenie Denominacji, okna-czytanki…). Ogólna reguła:
// nikt nie lubi, gdy event wyskakuje i rozprasza go w trakcie minigry — więc depesze czekają, aż gracz
// wróci na czysty pulpit. Timer zdarzeń „zamraża się" na czas pauzy (silnik przesuwa lastEventMs), więc
// nic nie wystrzeliwuje natychmiast po zamknięciu. Obejmuje też przyszłe minigry — wystarczy dodać ich
// „…Open" do `overlayOpen` powyżej (uwagi #4 / #9 / #12 + prośba właściciela 2026-07-04).
overlayOpen.subscribe((open) => send({ type: 'setEventsPaused', paused: open }));
