<script lang="ts">
  import Users from '@lucide/svelte/icons/users';
  import { kadraOpen, snapshot, recruitCharacter } from '../engine/bridge';

  const chars = $derived($snapshot?.characters ?? []);
</script>

{#if $kadraOpen && $snapshot}
  <div class="modal-overlay" role="dialog" aria-modal="true" aria-label="Kadra kombinatu">
    <div class="kadra-modal">
      <div class="kadra-head">
        <h2 class="win-head"><span class="win-head-icon"><Users size={18} strokeWidth={1.8} /></span>Kadra</h2>
        <span class="kadra-count">{chars.filter((c) => c.recruited).length} w zespole</span>
        <button class="tree-close" aria-label="Zamknij" onclick={() => kadraOpen.set(false)}>✕</button>
      </div>
      <p class="tree-hint">Ludzie epoki. Werbunek kosztuje raz, a bonus działa do końca tej pięciolatki (znika po Denominacji).</p>

      {#if chars.length === 0}
        <p class="kadra-empty">Na razie nikt nie chce do Ciebie dołączyć. Rozbuduj kombinat — kadra pojawi się sama.</p>
      {:else}
        <div class="kadra-list">
          {#each chars as c (c.id)}
            <div class="kadra-card" class:recruited={c.recruited}>
              <div class="kadra-top">
                <div>
                  <div class="kadra-name">{c.name}</div>
                  <div class="kadra-arch">{c.archetype}</div>
                </div>
                {#if c.recruited}
                  <span class="kadra-badge">w zespole</span>
                {/if}
              </div>
              {#if c.flavor}<p class="kadra-flavor">{c.flavor}</p>{/if}
              <div class="kadra-effect">{c.effectText}</div>
              {#if !c.recruited}
                <button
                  class="kadra-buy"
                  disabled={!c.affordable}
                  onclick={() => recruitCharacter(c.id)}
                >
                  Zwerbuj — {c.cost} {c.costUnit}
                </button>
              {/if}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .kadra-modal {
    width: 100%;
    max-width: 680px;
    max-height: 86vh;
    display: flex;
    flex-direction: column;
    background: var(--panel);
    border: 1px solid var(--border);
    border-top: 3px solid #c98a3a;
    border-radius: 6px;
    padding: 14px 16px;
    box-shadow: 0 8px 28px var(--shadow);
  }
  .kadra-head {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .kadra-head h2 {
    margin: 0;
    font-size: 18px;
    color: var(--accent-strong);
  }
  .kadra-count {
    margin-left: auto;
    color: #c98a3a;
    font-weight: 700;
  }
  .kadra-empty {
    color: var(--dim);
    font-style: italic;
    padding: 18px 4px;
  }
  .kadra-list {
    overflow-y: auto;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 10px;
  }
  .kadra-card {
    padding: 10px 12px;
    background: var(--panel-2);
    border: 1px solid var(--border);
    border-left: 3px solid #c98a3a;
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .kadra-card.recruited {
    border-left-color: var(--accent-strong);
    opacity: 0.85;
  }
  .kadra-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 8px;
  }
  .kadra-name {
    font-weight: 700;
    color: var(--accent-strong);
  }
  .kadra-arch {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--dim);
  }
  .kadra-badge {
    font-size: 11px;
    font-weight: 700;
    color: var(--accent-strong);
    border: 1px solid var(--accent-strong);
    border-radius: 999px;
    padding: 1px 8px;
    white-space: nowrap;
  }
  .kadra-flavor {
    margin: 0;
    font-size: 12px;
    font-style: italic;
    line-height: 1.45;
    color: var(--dim);
  }
  .kadra-effect {
    font-size: 13px;
    font-weight: 600;
    color: #c98a3a;
  }
  .kadra-buy {
    margin-top: 2px;
    padding: 7px 10px;
    border: 1px solid var(--accent-strong);
    background: var(--accent);
    color: #fff;
    border-radius: 4px;
    font-weight: 700;
    cursor: pointer;
  }
  .kadra-buy:hover:not(:disabled) {
    filter: brightness(1.08);
  }
  .kadra-buy:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    background: var(--panel);
    color: var(--dim);
    border-color: var(--border);
  }
</style>
