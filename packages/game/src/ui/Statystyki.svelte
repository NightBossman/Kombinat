<script lang="ts">
  // Statystyki — zakładka na liczby/wykresy o rozgrywce + pod-zakładka „Historia zmian" (changelog).
  // Numer wersji gry mieszka TU (przeniesiony z ekranu głównego). Treść statystyk: właściciel dopisze.
  import ChartColumn from '@lucide/svelte/icons/chart-column';
  import { statystykiOpen } from '../engine/bridge';
  import { APP_VERSION } from '../version';
  import { CHANGELOG } from '../changelog';

  let tab = $state<'staty' | 'changelog'>('staty');
</script>

{#if $statystykiOpen}
  <div class="modal-overlay" role="dialog" aria-modal="true" aria-label="Statystyki">
    <div class="stat-modal">
      <div class="stat-head">
        <h2 class="win-head"><span class="win-head-icon"><ChartColumn size={18} strokeWidth={1.8} /></span>Statystyki</h2>
        <span class="stat-ver" title="Wersja gry">v{APP_VERSION}</span>
        <button class="tree-close" aria-label="Zamknij" onclick={() => statystykiOpen.set(false)}>✕</button>
      </div>

      <div class="stat-tabs">
        <button class:active={tab === 'staty'} onclick={() => (tab = 'staty')}>Statystyki</button>
        <button class:active={tab === 'changelog'} onclick={() => (tab = 'changelog')}>Historia zmian</button>
      </div>

      {#if tab === 'staty'}
        <p class="tree-hint">Tu zamieszka podsumowanie Twojej rozgrywki — liczby, rekordy i wykresy. Zbieramy pomysły, co dokładnie pokazać.</p>
        <div class="stat-empty">
          <span class="stat-empty-icon"><ChartColumn size={40} strokeWidth={1.4} /></span>
          <span class="stat-empty-title">Wkrótce</span>
          <span class="stat-empty-sub">Ta zakładka jest jeszcze pusta — treść dojdzie w kolejnej aktualizacji.</span>
        </div>
      {:else}
        <p class="tree-hint">Co dochodzi z każdą wersją gry. Aktualna wersja: <b>v{APP_VERSION}</b> · gra w budowie.</p>
        <div class="cl-body">
          {#each CHANGELOG as rel (rel.version)}
            <div class="cl-rel">
              <div class="cl-rel-head">
                <span class="cl-rel-ver">v{rel.version}</span>
                <span class="cl-rel-date">{rel.date}</span>
              </div>
              <ul class="cl-rel-items">
                {#each rel.items as it (it)}<li>{it}</li>{/each}
              </ul>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .stat-modal {
    width: 100%;
    max-width: 640px;
    max-height: 86vh;
    display: flex;
    flex-direction: column;
    background: var(--panel);
    border: 1px solid var(--border);
    border-top: 3px solid var(--accent);
    border-radius: 6px;
    padding: 14px 16px;
    box-shadow: 0 8px 28px var(--shadow);
  }
  .stat-head {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .stat-head h2 {
    margin: 0;
    font-size: 18px;
    color: var(--accent-strong);
    flex: 1;
  }
  .stat-ver {
    flex: none;
    font-size: 12px;
    font-weight: 700;
    color: var(--dim);
    font-variant-numeric: tabular-nums;
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 2px 9px;
  }
  /* pod-zakładki Statystyk (Statystyki | Historia zmian) */
  .stat-tabs {
    display: flex;
    gap: 6px;
    margin: 12px 0 4px;
    border-bottom: 1px solid var(--border);
  }
  .stat-tabs button {
    appearance: none;
    background: transparent;
    border: none;
    border-bottom: 2px solid transparent;
    color: var(--dim);
    font: inherit;
    font-weight: 700;
    font-size: 13px;
    padding: 6px 10px;
    margin-bottom: -1px;
    cursor: pointer;
  }
  .stat-tabs button.active {
    color: var(--accent-strong);
    border-bottom-color: var(--accent);
  }
  .stat-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    text-align: center;
    padding: 40px 16px 36px;
    margin-top: 8px;
    color: var(--dim);
  }
  .stat-empty-icon {
    color: var(--border);
  }
  .stat-empty-title {
    font-size: 18px;
    font-weight: 700;
    color: var(--accent-strong);
  }
  .stat-empty-sub {
    font-size: 13px;
    max-width: 360px;
  }
  .cl-body {
    overflow-y: auto;
    margin-top: 6px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .cl-rel {
    border-left: 3px solid var(--accent);
    padding: 2px 0 2px 12px;
  }
  .cl-rel-head {
    display: flex;
    align-items: baseline;
    gap: 10px;
  }
  .cl-rel-ver {
    font-weight: 800;
    color: var(--accent-strong);
    font-variant-numeric: tabular-nums;
  }
  .cl-rel-date {
    font-size: 12px;
    color: var(--dim);
  }
  .cl-rel-items {
    margin: 6px 0 0;
    padding-left: 18px;
    color: var(--text);
    font-size: 13px;
    line-height: 1.5;
  }
  .cl-rel-items li {
    margin: 2px 0;
  }
</style>
