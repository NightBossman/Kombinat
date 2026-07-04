<script lang="ts">
  // Zjazd PZPR (Faza 4B, PLAN 9.2) — na starcie nowej pięciolatki wybierasz doktrynę na całą rozgrywkę.
  // Każda to trwały kompromis; „Kredyty zachodnie" niosą gierkowski boom-bust (opóźniony kryzys).
  import Landmark from '@lucide/svelte/icons/landmark';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import { zjazdOpen, snapshot, chooseDoctrine, backToTree } from '../engine/bridge';

  const doctrines = $derived($snapshot?.zjazd?.doctrines ?? []);
  // Wybór doktryny jest DWUETAPOWY: najpierw klikasz kartę (tylko podświetlenie), potem zatwierdzasz.
  // Dzięki temu można się rozmyślić bez natychmiastowego startu (to nie jest jeszcze koniec limbo).
  let selected = $state<string | null>(null);
  const selectedDoc = $derived(doctrines.find((d) => d.id === selected && d.available) ?? null);
</script>

{#if $zjazdOpen}
  <div class="modal-overlay" role="dialog" aria-modal="true" aria-label="Zjazd PZPR">
    <div class="zjazd-modal">
      <div class="zjazd-head">
        <h2 class="win-head"><span class="win-head-icon"><Landmark size={18} strokeWidth={1.8} /></span>Zjazd PZPR</h2>
      </div>
      <p class="tree-hint">
        Towarzysze, czas wytyczyć linię na nową pięciolatkę. Kliknij <b>doktrynę</b>, by ją wybrać, a
        potem zatwierdź. Obowiązuje przez całą rozgrywkę — aż do następnej Denominacji. To wciąż nie start:
        możesz <b>wrócić</b> do dziedzictwa albo zmienić wybór.
      </p>

      <div class="zjazd-list">
        {#each doctrines as d (d.id)}
          <button
            class="zjazd-card"
            class:selected={selected === d.id}
            disabled={!d.available}
            onclick={() => (selected = d.id)}
            title={d.flavor ?? ''}
          >
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
        <button class="zjazd-back" onclick={backToTree}>◀ Wróć do ulepszeń</button>
        <button class="zjazd-confirm" onclick={() => chooseDoctrine(selectedDoc?.id ?? '')}>
          {#if selectedDoc}Zatwierdź: {selectedDoc.name} ▶{:else}Rusz bez doktryny ▶{/if}
        </button>
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
  .zjazd-card.selected {
    border-color: var(--accent-strong);
    border-left-color: var(--accent-strong);
    box-shadow: 0 0 0 1px var(--accent-strong), 0 0 12px rgba(95, 168, 106, 0.3);
    background: color-mix(in srgb, var(--accent) 12%, var(--panel-2));
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
    justify-content: center; /* oba guziki wyśrodkowane (życzenie właściciela) */
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 12px;
    padding-top: 10px;
    border-top: 1px solid var(--border);
  }
  .zjazd-back {
    padding: 9px 14px;
    background: var(--panel-2);
    border: 1px solid var(--border);
    border-radius: 4px;
    color: var(--text);
    font-family: var(--mono);
    font-weight: 700;
    cursor: pointer;
  }
  .zjazd-back:hover {
    border-color: var(--accent);
  }
  .zjazd-confirm {
    padding: 9px 16px;
    background: var(--accent);
    border: none;
    border-radius: 4px;
    color: var(--bg);
    font-family: var(--mono);
    font-weight: 700;
    cursor: pointer;
  }
  .zjazd-confirm:hover {
    background: var(--accent-strong);
  }
</style>
