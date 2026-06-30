<script lang="ts">
  // Podsumowanie nieobecności (offline). Gra OFICJALNIE jeszcze nie wróciła — dopóki to okno jest
  // otwarte, NIC się nie pojawia (eventy/okazje/toasty są wstrzymane gdzie indziej). „Wracam do pracy"
  // zamyka okno = dopiero wtedy gra wraca i ewentualne czekające rzeczy mogą się pokazać.
  import Sunrise from '@lucide/svelte/icons/sunrise';
  import { offlineReport } from '../engine/bridge';
  import { resourceIcon } from './icons';

  function close(): void {
    offlineReport.set(null);
  }
</script>

{#if $offlineReport}
  <div class="modal-overlay" role="dialog" aria-modal="true" aria-label="Podsumowanie nieobecności">
    <div class="offl-modal">
      <div class="offl-glow"></div>
      <div class="offl-head">
        <span class="offl-icon"><Sunrise size={30} strokeWidth={1.6} /></span>
        <div class="offl-head-text">
          <h2>Witaj z powrotem, towarzyszu!</h2>
          <span class="offl-sub">Kombinat nie próżnował pod Twoją nieobecność.</span>
        </div>
      </div>

      <div class="offl-dur">
        <span class="offl-dur-label">Czas nieobecności</span>
        <span class="offl-dur-val">{$offlineReport.durationText}</span>
      </div>

      {#if $offlineReport.gains.length > 0}
        <div class="offl-gains-title">Wypracowano przez ten czas:</div>
        <div class="offl-gains">
          {#each $offlineReport.gains as g (g.id)}
            {@const Icon = resourceIcon(g.id)}
            <div class="offl-gain">
              <span class="offl-gain-icon"><Icon size={18} strokeWidth={1.8} /></span>
              <span class="offl-gain-amt">+{g.amount}</span>
              <span class="offl-gain-name">{g.name}</span>
            </div>
          {/each}
        </div>
      {:else}
        <p class="offl-none">Tym razem maszyny stały — nic nie przybyło. Czas to nadrobić.</p>
      {/if}

      <p class="offl-note">Dopóki czytasz to podsumowanie, gra czeka — żadne zdarzenia ani okazje Ci nie przeszkodzą. Wrócą, gdy zamkniesz okno.</p>

      <div class="offl-actions">
        <button class="offl-btn" onclick={close}>Wracam do pracy ▶</button>
      </div>
    </div>
  </div>
{/if}

<style>
  .offl-modal {
    position: relative;
    width: 100%;
    max-width: 520px;
    max-height: 88vh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    background: var(--panel);
    border: 1px solid var(--accent);
    border-radius: 8px;
    padding: 18px 20px;
    box-shadow: 0 10px 34px var(--shadow);
  }
  .offl-glow {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: radial-gradient(120% 80% at 50% 0%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 60%);
    border-radius: 8px;
  }
  .offl-head {
    display: flex;
    align-items: center;
    gap: 14px;
    position: relative;
  }
  .offl-icon {
    flex: none;
    color: #e7cf86;
    filter: drop-shadow(0 0 10px rgba(231, 207, 134, 0.5));
  }
  .offl-head-text h2 {
    margin: 0;
    font-size: 20px;
    color: var(--accent-strong);
  }
  .offl-sub {
    font-size: 13px;
    color: var(--dim);
  }
  .offl-dur {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
    margin: 14px 0 6px;
    padding: 10px 14px;
    background: var(--panel-2);
    border: 1px solid var(--border);
    border-radius: 6px;
    position: relative;
  }
  .offl-dur-label {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--dim);
  }
  .offl-dur-val {
    font-size: 18px;
    font-weight: 800;
    color: var(--text);
    font-variant-numeric: tabular-nums;
  }
  .offl-gains-title {
    margin: 10px 0 6px;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--accent-strong);
    position: relative;
  }
  .offl-gains {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    position: relative;
  }
  .offl-gain {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1 1 160px;
    white-space: nowrap; /* zarobiona wartość ZAWSZE w jednej linii (chip rośnie/zawija do własnego wiersza) */
    padding: 9px 11px;
    background: var(--panel-2);
    border: 1px solid var(--border);
    border-left: 3px solid var(--accent-strong);
    border-radius: 5px;
    font-family: var(--mono);
  }
  .offl-gain-icon {
    color: var(--accent);
    line-height: 0;
  }
  .offl-gain-amt {
    font-weight: 800;
    color: var(--accent-strong);
  }
  .offl-gain-name {
    font-size: 12px;
    color: var(--dim);
  }
  .offl-none {
    margin: 10px 0;
    color: var(--dim);
    position: relative;
  }
  .offl-note {
    margin: 14px 0 0;
    font-size: 12px;
    color: var(--dim);
    position: relative;
  }
  .offl-actions {
    display: flex;
    justify-content: center;
    margin-top: 14px;
    position: relative;
  }
  .offl-btn {
    padding: 10px 18px;
    background: var(--accent);
    color: #fff;
    border: 1px solid var(--accent-strong);
    border-radius: 6px;
    font-weight: 800;
    font-size: 15px;
    cursor: pointer;
  }
  .offl-btn:hover {
    filter: brightness(1.08);
  }
</style>
