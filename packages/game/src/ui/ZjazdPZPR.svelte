<script lang="ts">
  // Zjazd PZPR (Faza 4B, PLAN 9.2) — na starcie nowej pięciolatki wybierasz doktrynę na całą rozgrywkę.
  // Każda to trwały kompromis; „Kredyty zachodnie" niosą gierkowski boom-bust (opóźniony kryzys).
  import Landmark from '@lucide/svelte/icons/landmark';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import { zjazdOpen, snapshot, chooseDoctrine } from '../engine/bridge';

  const doctrines = $derived($snapshot?.zjazd?.doctrines ?? []);
</script>

{#if $zjazdOpen}
  <div class="modal-overlay" role="dialog" aria-modal="true" aria-label="Zjazd PZPR">
    <div class="zjazd-modal">
      <div class="zjazd-head">
        <h2 class="win-head"><span class="win-head-icon"><Landmark size={18} strokeWidth={1.8} /></span>Zjazd PZPR</h2>
      </div>
      <p class="tree-hint">
        Towarzysze, czas wytyczyć linię na nową pięciolatkę. Wybrana <b>doktryna</b> obowiązuje przez
        całą rozgrywkę — aż do następnej Denominacji.
      </p>

      <div class="zjazd-list">
        {#each doctrines as d (d.id)}
          <button class="zjazd-card" disabled={!d.available} onclick={() => chooseDoctrine(d.id)} title={d.flavor ?? ''}>
            <span class="zjazd-card-head">
              <span class="zjazd-card-name">{d.name}</span>
              {#if d.hasDebt}
                <span class="zjazd-debt"><TriangleAlert size={13} strokeWidth={2} /> bomba</span>
              {/if}
            </span>
            <span class="zjazd-card-eff">{d.effectText}</span>
            {#if d.flavor}<span class="zjazd-card-flavor">{d.flavor}</span>{/if}
          </button>
        {/each}
      </div>

      <div class="zjazd-foot">
        <button class="zjazd-skip" onclick={() => chooseDoctrine('')}>Bez doktryny — ruszaj ▶</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .zjazd-modal {
    width: 100%;
    max-width: 760px;
    max-height: 88vh;
    display: flex;
    flex-direction: column;
    background: var(--panel);
    border: 1px solid var(--border);
    border-top: 3px solid #c2502f;
    border-radius: 6px;
    padding: 14px 16px;
    box-shadow: 0 8px 28px var(--shadow);
  }
  .zjazd-head h2 {
    margin: 0;
    font-size: 18px;
    color: var(--accent-strong);
  }
  .zjazd-list {
    overflow-y: auto;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 10px;
    margin-top: 8px;
  }
  .zjazd-card {
    display: flex;
    flex-direction: column;
    gap: 4px;
    text-align: left;
    padding: 10px 12px;
    background: var(--panel-2);
    color: var(--text);
    border: 1px solid var(--border);
    border-left: 3px solid #c9a23a;
    border-radius: 4px;
    cursor: pointer;
    font-family: var(--mono);
    transition: transform 0.05s ease, filter 0.1s ease;
  }
  .zjazd-card:hover:not(:disabled) {
    filter: brightness(1.1);
  }
  .zjazd-card:active:not(:disabled) {
    transform: scale(0.99);
  }
  .zjazd-card:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .zjazd-card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
  }
  .zjazd-card-name {
    font-weight: 700;
    color: var(--accent-strong);
    font-size: 14px;
  }
  .zjazd-debt {
    display: inline-flex;
    align-items: center;
    gap: 3px;
    flex: none;
    font-size: 11px;
    font-weight: 700;
    color: var(--bg);
    background: var(--danger);
    border-radius: 999px;
    padding: 1px 7px;
  }
  .zjazd-card-eff {
    font-size: 12.5px;
    color: var(--accent);
  }
  .zjazd-card-flavor {
    font-size: 11.5px;
    color: var(--dim);
    margin-top: 2px;
  }
  .zjazd-foot {
    display: flex;
    justify-content: flex-end;
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1px solid var(--border);
  }
  .zjazd-skip {
    padding: 8px 14px;
    background: var(--panel-2);
    border: 1px solid var(--border);
    border-radius: 4px;
    color: var(--text);
    font-family: var(--mono);
    cursor: pointer;
  }
  .zjazd-skip:hover {
    filter: brightness(1.1);
  }
</style>
