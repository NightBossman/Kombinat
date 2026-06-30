<script lang="ts">
  // Dziennik — chronologiczne archiwum „tego, co przeleciało" (PLAN 14). Najnowsze u góry.
  // Twardy limit i rotacja pamięci są po stronie bridge (logDziennik / DZIENNIK_MAX).
  import { dziennik, dziennikOpen } from '../engine/bridge';
  import Megaphone from '@lucide/svelte/icons/megaphone';
  import Trophy from '@lucide/svelte/icons/trophy';
  import Gift from '@lucide/svelte/icons/gift';
  import Medal from '@lucide/svelte/icons/medal';
  import Clock from '@lucide/svelte/icons/clock';
  import Download from '@lucide/svelte/icons/download';
  import Coins from '@lucide/svelte/icons/coins';
  import Lock from '@lucide/svelte/icons/lock';

  const entries = $derived([...$dziennik].reverse());

  function iconFor(kind: string): typeof Megaphone {
    if (kind === 'achievement') return Trophy;
    if (kind === 'okazja') return Gift;
    if (kind === 'denom') return Medal;
    if (kind === 'offline') return Clock;
    if (kind === 'export') return Download;
    if (kind === 'bribe') return Coins;
    if (kind === 'kontrola') return Lock;
    return Megaphone;
  }
  const COLORS: Record<string, string> = {
    event: '#5a8fb0',
    achievement: '#c9a23a',
    okazja: '#e7c564',
    denom: '#c89be0',
    offline: '#6ad0c0',
    export: '#7fae8a',
    bribe: '#c9a23a',
    kontrola: '#c0564a',
  };
  function hhmmss(t: number): string {
    const d = new Date(t);
    const p = (n: number) => String(n).padStart(2, '0');
    return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  }
</script>

{#if $dziennikOpen}
  <div class="modal-overlay" role="dialog" aria-modal="true" aria-label="Dziennik">
    <div class="dz-modal">
      <div class="dz-head">
        <h2>Dziennik</h2>
        <span class="dz-count">{entries.length}</span>
        <button class="tree-close" aria-label="Zamknij" onclick={() => dziennikOpen.set(false)}>✕</button>
      </div>
      <p class="tree-hint">Kronika tego, co przeleciało: depesze, osiągnięcia, okazje, denominacje. Najnowsze u góry; starsze wpisy z czasem wypadają.</p>
      <div class="dz-list">
        {#if entries.length === 0}
          <p class="dz-empty">Jeszcze nic się nie wydarzyło. Plan dopiero rusza.</p>
        {:else}
          {#each entries as e (e.id)}
            {@const Icon = iconFor(e.kind)}
            <div class="dz-row" style="--dz:{COLORS[e.kind] ?? 'var(--accent)'}">
              <span class="dz-icon"><Icon size={16} strokeWidth={1.8} /></span>
              <span class="dz-text">{e.text}</span>
              <span class="dz-time">{hhmmss(e.t)}</span>
            </div>
          {/each}
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .dz-modal {
    width: 100%;
    max-width: 600px;
    max-height: 84vh;
    display: flex;
    flex-direction: column;
    background: var(--panel);
    border: 1px solid var(--border);
    border-top: 3px solid var(--accent);
    border-radius: 6px;
    padding: 14px 16px;
    box-shadow: 0 8px 28px var(--shadow);
  }
  .dz-head {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .dz-head h2 {
    margin: 0;
    font-size: 18px;
    color: var(--accent-strong);
  }
  .dz-count {
    margin-left: auto;
    color: var(--dim);
    font-variant-numeric: tabular-nums;
  }
  .dz-list {
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 3px;
    margin-top: 8px;
  }
  .dz-empty {
    color: var(--dim);
    font-style: italic;
    padding: 16px 4px;
  }
  .dz-row {
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 6px 8px;
    background: var(--panel-2);
    border-left: 3px solid var(--dz);
    border-radius: 4px;
  }
  .dz-icon {
    display: inline-flex;
    line-height: 0;
    color: var(--dz);
    flex: none;
  }
  .dz-text {
    flex: 1 1 auto;
    min-width: 0;
    font-size: 13px;
    color: var(--text);
  }
  .dz-time {
    flex: none;
    font-size: 11px;
    color: var(--dim);
    font-variant-numeric: tabular-nums;
  }
</style>
