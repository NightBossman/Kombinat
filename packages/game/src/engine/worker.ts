// worker.ts — Powloka Web Workera: trzyma autorytatywny stan, tyka stalym krokiem, zdlawia migawki.
// To realizuje "odsprzezenie symulacji od renderu" (PLAN 16): ciezkie liczenie poza watkiem UI.
import { Engine } from './engine';
import { loadContent } from './loader';
import type { SerializedIssue, TickerLine, WorkerIn, WorkerOut } from './protocol';
import type { SaveData } from './state';
import { basePack } from '../content/base';
import { decodeSave, encodeSave } from '../save/k7';

// postMessage Workera ma inna sygnature niz Window.postMessage — omijamy typ DOM cienkim shimem.
const post = (msg: WorkerOut, transfer?: Transferable[]): void =>
  (self as unknown as { postMessage(m: unknown, t?: Transferable[]): void }).postMessage(msg, transfer);

const STEP_MS = 50; // staly krok symulacji (20 Hz)
const SNAP_MS = 100; // migawki do UI ~10 Hz
const MAX_FRAME_MS = 10000; // zabezpieczenie przed skokiem zegara (sen systemu)

let engine: Engine | null = null;
let running = true;
let loopStarted = false;

let last = 0;
let acc = 0;
let sinceSnap = 0;

function startLoop(): void {
  if (loopStarted) return;
  loopStarted = true;
  last = performance.now();
  setInterval(() => {
    const now = performance.now();
    let frame = now - last;
    last = now;
    if (frame < 0) frame = 0;
    if (frame > MAX_FRAME_MS) frame = MAX_FRAME_MS;
    if (!engine || !running) return;

    acc += frame;
    while (acc >= STEP_MS) {
      engine.tick(STEP_MS / 1000);
      acc -= STEP_MS;
    }
    engine.updateEvents(Date.now()); // zdarzenia w czasie rzeczywistym (nie w doliczaniu offline)
    sinceSnap += frame;
    if (sinceSnap >= SNAP_MS) {
      sinceSnap = 0;
      post({ type: 'snapshot', snapshot: engine.snapshot() });
    }
  }, STEP_MS);
}

function toIssues(src: { level: 'error' | 'warning'; message: string; path?: string }[]): SerializedIssue[] {
  return src.map((i) => ({ level: i.level, message: i.message, path: i.path }));
}

async function decodeOrNull(buf: ArrayBuffer): Promise<SaveData | undefined> {
  try {
    return await decodeSave<SaveData>(new Uint8Array(buf));
  } catch {
    return undefined; // uszkodzony autozapis — startujemy od nowa
  }
}

/** Dolicza postep offline i (gdy warto) zglasza podsumowanie do UI. */
function applyOfflineCatchUp(save: SaveData): void {
  if (!engine) return;
  const lastSeen = save.stats?.lastSeen ?? Date.now();
  const result = engine.catchUp((Date.now() - lastSeen) / 1000);
  if (result.seconds >= 60 && result.gains.length > 0) {
    // Pauzujemy zdarzenia OD RAZU — zanim UI zdąży pokazać raport, by żaden event nie wystrzelił
    // pod oknem powrotu (uwaga #9). UI wznowi je, gdy gracz zamknie raport (combined store).
    engine.setEventsPaused(true);
    post({ type: 'offline', seconds: result.seconds, gains: result.gains });
  }
}

async function handle(msg: WorkerIn): Promise<void> {
  switch (msg.type) {
    case 'init': {
      const save = msg.saveBytes ? await decodeOrNull(msg.saveBytes) : undefined;
      const res = loadContent([basePack]);
      engine = new Engine(res.registry, save);
      if (save) applyOfflineCatchUp(save);
      const ticker: TickerLine[] = res.registry.ticker.map((t) => ({ stream: t.stream, text: t.text }));
      post({ type: 'ready', issues: toIssues(res.issues), ticker });
      post({ type: 'snapshot', snapshot: engine.snapshot() });
      acc = 0;
      sinceSnap = 0;
      startLoop();
      break;
    }
    case 'click':
      engine?.click();
      break;
    case 'buy':
      // count podany => użyj go; inaczej rozwiąż z wybranej opcji x1/x10/x100/Max.
      if (engine) engine.buy(msg.id, msg.count ?? engine.resolveBuyCount(msg.id));
      break;
    case 'setBuyAmount':
      if (engine) {
        engine.buyAmount = msg.amount;
        post({ type: 'snapshot', snapshot: engine.snapshot() });
      }
      break;
    case 'buyUpgrade':
      engine?.buyUpgrade(msg.id);
      break;
    case 'buyTreeNode':
      engine?.buyTreeNode(msg.id);
      break;
    case 'chooseEvent':
      if (engine) {
        engine.chooseEventOption(msg.index);
        post({ type: 'snapshot', snapshot: engine.snapshot() });
      }
      break;
    case 'requestAchievements':
      if (engine) post({ type: 'achievements', entries: engine.achievementsList() });
      break;
    case 'recruitCharacter':
      engine?.recruitCharacter(msg.id);
      break;
    case 'exchange':
      if (engine) {
        engine.exchange(msg.dir, msg.frac);
        post({ type: 'snapshot', snapshot: engine.snapshot() });
      }
      break;
    case 'minigameReward':
      if (engine) {
        engine.minigameReward(msg.quality, msg.mult ?? 1);
        post({ type: 'snapshot', snapshot: engine.snapshot() });
      }
      break;
    case 'setEventsPaused':
      engine?.setEventsPaused(msg.paused);
      break;
    case 'clickOkazja':
      if (engine) {
        const res = engine.clickOkazja();
        post({ type: 'okazja', kind: res.kind, title: res.title, detail: res.detail });
        post({ type: 'snapshot', snapshot: engine.snapshot() });
      }
      break;
    case 'bribe':
      if (engine) {
        const res = engine.bribe(msg.id);
        post({ type: 'bribeResult', ok: res.ok, kontrola: res.kontrola, title: res.title, detail: res.detail });
        post({ type: 'snapshot', snapshot: engine.snapshot() });
      }
      break;
    case 'buySupply':
      if (engine) {
        engine.buySupply(msg.id);
        post({ type: 'snapshot', snapshot: engine.snapshot() });
      }
      break;
    case 'chooseDoctrine':
      if (engine) {
        engine.chooseDoctrine(msg.id);
        post({ type: 'snapshot', snapshot: engine.snapshot() });
      }
      break;
    case 'improveRelation':
      if (engine) {
        engine.improveRelation(msg.id);
        post({ type: 'snapshot', snapshot: engine.snapshot() });
      }
      break;
    case 'denominate': {
      if (!engine) break;
      const res = engine.denominate();
      if (res) {
        post({ type: 'denominated', gained: res.gained, unit: res.unit });
        post({ type: 'snapshot', snapshot: engine.snapshot() });
      }
      break;
    }
    case 'requestSave': {
      if (!engine) break;
      const bytes = await encodeSave(engine.serialize());
      post({ type: 'save', bytes: bytes.buffer }, [bytes.buffer]);
      break;
    }
    case 'restore': {
      if (!engine) break;
      try {
        const save = await decodeSave<SaveData>(new Uint8Array(msg.saveBytes));
        engine.restore(save);
        applyOfflineCatchUp(save);
        post({ type: 'restored', ok: true });
        post({ type: 'snapshot', snapshot: engine.snapshot() });
      } catch (e) {
        post({ type: 'restored', ok: false, error: e instanceof Error ? e.message : String(e) });
      }
      break;
    }
    case 'reset':
      engine?.reset();
      if (engine) post({ type: 'snapshot', snapshot: engine.snapshot() });
      break;
    case 'setRunning':
      running = msg.running;
      last = performance.now();
      break;
  }
}

self.onmessage = (ev: MessageEvent) => {
  void handle(ev.data as WorkerIn);
};
