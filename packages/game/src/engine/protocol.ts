// protocol.ts — Kontrakt komunikacji UI <-> Worker. Tylko dane JSON-owalne (zero Decimali/klas).
import type { AchievementView, Snapshot } from './snapshot';

export interface SerializedIssue {
  level: 'error' | 'warning';
  message: string;
  path?: string;
}

export interface TickerLine {
  stream: string;
  text: string;
}

export interface OfflineGain {
  id: string;
  name: string;
  amount: string;
}

export type WorkerIn =
  | { type: 'init'; saveBytes: ArrayBuffer | null }
  | { type: 'click' }
  | { type: 'buy'; id: string; count?: number }
  | { type: 'setBuyAmount'; amount: 1 | 10 | 100 | 'max' }
  | { type: 'buyUpgrade'; id: string }
  | { type: 'buyTreeNode'; id: string }
  | { type: 'chooseEvent'; index: number }
  | { type: 'requestAchievements' }
  | { type: 'recruitCharacter'; id: string }
  | { type: 'exchange'; dir: 'buy' | 'sell'; frac: number }
  | { type: 'minigameReward'; quality: number; mult?: number }
  | { type: 'setEventsPaused'; paused: boolean }
  | { type: 'clickOkazja' }
  | { type: 'bribe'; id: string }
  | { type: 'buySupply'; id: string }
  | { type: 'chooseDoctrine'; id: string }
  | { type: 'improveRelation'; id: string }
  | { type: 'denominate' }
  | { type: 'requestSave' }
  | { type: 'restore'; saveBytes: ArrayBuffer }
  | { type: 'reset' }
  | { type: 'setRunning'; running: boolean };

export type WorkerOut =
  | { type: 'ready'; issues: SerializedIssue[]; ticker: TickerLine[] }
  | { type: 'snapshot'; snapshot: Snapshot }
  | { type: 'save'; bytes: ArrayBuffer }
  | { type: 'restored'; ok: boolean; error?: string }
  | { type: 'offline'; seconds: number; gains: OfflineGain[] }
  | { type: 'denominated'; gained: string; unit: string }
  | { type: 'achievements'; entries: AchievementView[] }
  | { type: 'okazja'; kind: string; title: string; detail: string }
  | { type: 'bribeResult'; ok: boolean; kontrola: boolean; title?: string; detail?: string }
  | { type: 'error'; message: string };
