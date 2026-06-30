<script lang="ts">
  // Powiadomienie o zdobyciu osiągnięcia (uwaga #3) — w widocznym miejscu (góra-środek),
  // z tematyczną ikoną, kolorem wg kategorii, błyskiem „shine" i własnym dźwiękiem.
  import { snapshot, offlineReport } from '../engine/bridge';
  import { playSfx } from '../engine/audio';
  import { settings } from '../engine/settings.svelte';
  import { achievementIcon, achievementColor } from './icons';
  import type { AchievementView } from '../engine/snapshot';

  type Toast = AchievementView & { key: number; color: string };
  let toasts = $state<Toast[]>([]);
  let nextKey = 0;
  // Każde osiągnięcie pokazujemy NAJWYŻEJ RAZ — twardy bezpiecznik przeciw duplikatom (uwaga #13).
  const shownIds = new Set<string>();

  const HOLD_MS = 7500; // jak długo wisi — +50% (osiągnięcie to potwierdzenie wysiłku, nie ma znikać ot tak)

  function enqueue(a: AchievementView): void {
    if (shownIds.has(a.id)) return; // już pokazane — nie duplikuj
    shownIds.add(a.id);
    const key = nextKey++;
    const color = achievementColor(a.category);
    toasts = [...toasts, { ...a, key, color }].slice(-4); // max 4 na ekranie
    playSfx('achievement');
    setTimeout(() => {
      toasts = toasts.filter((t) => t.key !== key);
    }, HOLD_MS);
  }

  // Na „podsumowaniu nieobecności" gra OFICJALNIE jeszcze nie wróciła — toasty osiągnięć NIE wyskakują;
  // odkładamy je i pokazujemy dopiero po zamknięciu podsumowania (powrót do gry).
  let pending: AchievementView[] = [];
  $effect(() => {
    const je = $snapshot?.achievements.justEarned ?? [];
    if ($offlineReport) {
      for (const a of je) if (!shownIds.has(a.id)) pending.push(a);
      return;
    }
    if (pending.length > 0) {
      const p = pending;
      pending = [];
      for (const a of p) enqueue(a);
    }
    for (const a of je) enqueue(a);
  });
</script>

<div class="ach-toasts" aria-live="polite">
  {#each toasts as t (t.key)}
    {@const Icon = achievementIcon(t.category, false)}
    <div
      class="ach-toast"
      class:plain={!settings().animations}
      style="--ac:{t.color}"
    >
      <span class="ach-toast-icon">
        <Icon size={26} strokeWidth={1.8} />
      </span>
      <span class="ach-toast-text">
        <span class="ach-toast-kicker">Osiągnięcie zdobyte</span>
        <span class="ach-toast-name">{t.name}</span>
        <span class="ach-toast-cat">{t.category}</span>
      </span>
      {#if settings().animations}
        <span class="ach-toast-shine" aria-hidden="true"></span>
      {/if}
    </div>
  {/each}
</div>

<style>
  .ach-toasts {
    position: fixed;
    top: 54px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 70;
    display: flex;
    flex-direction: column;
    gap: 8px;
    pointer-events: none;
    width: min(420px, 92vw);
  }
  .ach-toast {
    position: relative;
    overflow: hidden;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    background: var(--panel);
    border: 1px solid var(--border);
    border-left: 4px solid var(--ac);
    border-radius: 8px;
    box-shadow:
      0 6px 20px var(--shadow),
      0 0 16px -4px var(--ac);
    animation: achIn 0.45s cubic-bezier(0.2, 0.9, 0.25, 1.2);
  }
  .ach-toast.plain {
    animation: none;
  }
  .ach-toast-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    flex-shrink: 0;
    border-radius: 8px;
    color: var(--ac);
    background: color-mix(in srgb, var(--ac) 18%, transparent);
  }
  .ach-toast-text {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .ach-toast-kicker {
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--ac);
    font-weight: 700;
  }
  .ach-toast-name {
    font-size: 15px;
    font-weight: 700;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .ach-toast-cat {
    font-size: 11px;
    color: var(--dim);
  }
  .ach-toast-shine {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      105deg,
      transparent 30%,
      color-mix(in srgb, var(--ac) 45%, transparent) 50%,
      transparent 70%
    );
    transform: translateX(-120%);
    animation: achShine 0.9s ease-out 0.2s 1;
  }
  @keyframes achIn {
    from {
      transform: translateY(-16px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
  @keyframes achShine {
    to {
      transform: translateX(120%);
    }
  }
</style>
