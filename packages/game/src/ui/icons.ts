// icons.ts — Mapowanie treści na ikony Lucide (uwagi #5/#3). Ikona to namiastka grafiki:
// pozwala skojarzyć maszynę / osiągnięcie / event jednym rzutem oka, bez czytania nazwy.
import Grip from '@lucide/svelte/icons/grip';
import Cog from '@lucide/svelte/icons/cog';
import Rows3 from '@lucide/svelte/icons/rows-3';
import Cpu from '@lucide/svelte/icons/cpu';
import CircuitBoard from '@lucide/svelte/icons/circuit-board';
import Server from '@lucide/svelte/icons/server';
import Building2 from '@lucide/svelte/icons/building-2';
import Gamepad2 from '@lucide/svelte/icons/gamepad-2';
import Monitor from '@lucide/svelte/icons/monitor';
import Keyboard from '@lucide/svelte/icons/keyboard';
import Network from '@lucide/svelte/icons/network';
import Factory from '@lucide/svelte/icons/factory';
import Banknote from '@lucide/svelte/icons/banknote';
import Crown from '@lucide/svelte/icons/crown';
import Star from '@lucide/svelte/icons/star';
import Clock from '@lucide/svelte/icons/clock';
import Lock from '@lucide/svelte/icons/lock';
import Trophy from '@lucide/svelte/icons/trophy';
import Zap from '@lucide/svelte/icons/zap';
import Newspaper from '@lucide/svelte/icons/newspaper';
import Users from '@lucide/svelte/icons/users';
import Wrench from '@lucide/svelte/icons/wrench';
import Coins from '@lucide/svelte/icons/coins';
import Megaphone from '@lucide/svelte/icons/megaphone';
import Medal from '@lucide/svelte/icons/medal';
import Ticket from '@lucide/svelte/icons/ticket';
import DollarSign from '@lucide/svelte/icons/dollar-sign';
import Sparkles from '@lucide/svelte/icons/sparkles';
import Flag from '@lucide/svelte/icons/flag';
import Handshake from '@lucide/svelte/icons/handshake';
import Car from '@lucide/svelte/icons/car';
import Landmark from '@lucide/svelte/icons/landmark';
import TrendingUp from '@lucide/svelte/icons/trending-up';
import Globe from '@lucide/svelte/icons/globe';

// Wszystkie ikony Lucide mają ten sam typ komponentu — bierzemy go z jednej z nich.
export type IconComponent = typeof Cpu;

// Maszyny — drabina polskiej informatyki, od liczydła po sieci/spółki.
const GENERATORS: Record<string, IconComponent> = {
  liczydlo: Grip,
  arytmometr: Cog,
  tabulator: Rows3,
  mera400: Cpu,
  k202: CircuitBoard,
  odra1305: Server,
  osrodek: Building2,
  spectrum: Gamepad2,
  meritum: Monitor,
  mazovia: Keyboard,
  spolka: Network,
};

export function genIcon(id: string): IconComponent {
  return GENERATORS[id] ?? Cpu;
}

// OFICJALNE ikony walut (uwaga #18) — używane wszędzie, gdzie pokazujemy daną walutę.
// Zawiera też trzy przyszłe waluty (uwaga #19): bony PEKAO, złotówki, dolary.
const RESOURCES: Record<string, IconComponent> = {
  cykle: Cpu,
  dewizy: Banknote,
  odznaczenia: Medal,
  bony: Ticket,
  zlotowki: Coins,
  dolary: DollarSign,
};

export function resourceIcon(id: string): IconComponent {
  return RESOURCES[id] ?? Coins;
}

// Osiągnięcia — wg kategorii. Sekret (jeszcze niezdobyty) zawsze pod kłódką.
const ACH_CATEGORY: Record<string, IconComponent> = {
  Maszyny: Factory,
  Cykle: Cpu,
  Dewizy: Banknote,
  Prestiż: Crown,
  Meta: Star,
  Czas: Clock,
  Sekrety: Lock,
  Unikalne: Sparkles,
};

export function achievementIcon(category: string, hidden = false): IconComponent {
  if (hidden) return Lock;
  return ACH_CATEGORY[category] ?? Trophy;
}

// Kolor akcentu osiągnięcia wg kategorii — różne barwy, by powiadomienia nie wyglądały co do
// joty tak samo (uwaga #3: „unikalne, nie powtarzające się efekty"). Dekoracja, nie dane.
const ACH_COLOR: Record<string, string> = {
  Maszyny: '#6fa8dc',
  Cykle: '#8fe39a',
  Dewizy: '#e0c34a',
  Prestiż: '#c89be0',
  Meta: '#e08f6a',
  Czas: '#6ad0c0',
  Sekrety: '#d96a8f',
  Unikalne: '#e8c14a',
};

export function achievementColor(category: string): string {
  return ACH_COLOR[category] ?? '#8fe39a';
}

// Wyzwania w „Co dalej?" (uwaga #17): 'gen:<id>' → ikona maszyny, 'upgrade' → ulepszenie,
// 'milestone' → kamień milowy. Brak klucza/nieznany → null (UI nie pokazuje ikony).
export function goalIcon(key: string | undefined): IconComponent | null {
  if (!key) return null;
  if (key.startsWith('gen:')) return genIcon(key.slice(4));
  if (key === 'upgrade') return Sparkles;
  if (key === 'milestone') return Flag;
  if (key === 'achievement') return Trophy;
  if (key === 'kadra') return Users;
  if (key === 'prestige') return Medal;
  return null;
}

// Wpisy Leksykonu — ikona wg tego, co odblokowuje wpis (`unlockedBy`): maszyna / event / itp.
// Nazwane ikony Leksykonu — gdy hasło ma jawny `icon`, by uniknąć powtórek (kilka haseł z tego
// samego generatora/kamienia milowego dostawałoby inaczej tę samą ikonę).
const NAMED_ICONS: Record<string, IconComponent> = {
  handshake: Handshake,
  ticket: Ticket,
  banknote: Banknote,
  dollar: DollarSign,
  coins: Coins,
  car: Car,
  landmark: Landmark,
  'trending-up': TrendingUp,
  globe: Globe,
  flag: Flag,
};

export function lexiconIcon(iconKey: string | undefined): IconComponent | null {
  if (!iconKey) return null;
  const i = iconKey.indexOf(':');
  if (i === -1) return null;
  const kind = iconKey.slice(0, i);
  const id = iconKey.slice(i + 1);
  if (kind === 'named') return NAMED_ICONS[id] ?? null;
  if (kind === 'generator') return genIcon(id);
  if (kind === 'event') return eventIcon(id);
  if (kind === 'upgrade') return Sparkles;
  if (kind === 'milestone') return Flag;
  return null;
}

// Doktryny ze Zjazdu PZPR — ikona wg osi tematycznej: gospodarka = fabryka, polityka = megafon
// (linia partii). Nieznana/brak osi → godło Zjazdu (Landmark).
export function doctrineIcon(axis: string | undefined): IconComponent {
  if (axis === 'gospodarka') return Factory;
  if (axis === 'polityka') return Megaphone;
  return Landmark;
}

// Eventy — po słowie kluczu z id (depesza ma „twarz").
export function eventIcon(id: string): IconComponent {
  if (id.includes('sb_')) return Lock;
  if (id.includes('pewex')) return Coins;
  if (id.includes('prad') || id.includes('awaria')) return Zap;
  if (id.includes('bajtek')) return Newspaper;
  if (id.includes('inzynier')) return Users;
  if (id.includes('wadliwa')) return Wrench;
  if (id.includes('premia')) return Banknote;
  return Megaphone;
}
