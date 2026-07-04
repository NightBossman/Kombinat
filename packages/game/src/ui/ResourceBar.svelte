<script lang="ts">
  import { formatNumber, pluralizePLStable } from '@kombinat/shared';
  import {
    snapshot,
    manualSave,
    resetGame,
    lexiconOpen,
    achievementsOpen,
    settingsOpen,
    kadraOpen,
    gieldaOpen,
    minigraOpen,
    zalatwianieOpen,
    dyplomacjaOpen,
    statystykiOpen,
  } from '../engine/bridge';
  import { smoothFloorOf, smoothFiniteOf, smoothValueOf } from '../engine/smooth.svelte';
  import { resourceIcon } from './icons';

  // Główne waluty pokazujemy z 2 miejscami po przecinku (płynna wartość + STAŁE 2 dp = brak trzęsienia).
  const DECIMAL_RES = new Set(['cykle', 'dewizy']);

  let confirmReset = $state(false);

  function doReset(): void {
    confirmReset = false;
    resetGame();
  }
</script>

<footer class="status-bar">
  <div class="resources">
    {#if $snapshot}
      {#each $snapshot.resources.filter((r) => !r.local) as r (r.id)}
        {@const fin = smoothFiniteOf(r.id)}
        {@const dec = DECIMAL_RES.has(r.id)}
        {@const num = fin ? smoothFloorOf(r.id) : Math.floor(r.amountRaw)}
        {@const shown = fin
          ? formatNumber(dec ? smoothValueOf(r.id) : smoothFloorOf(r.id), dec ? { decimals: 2 } : {})
          : Number.isFinite(r.amountRaw)
            ? formatNumber(dec ? r.amountRaw : Math.floor(r.amountRaw), dec ? { decimals: 2 } : {})
            : r.amount}
        {@const noun = r.plural && Number.isFinite(num) ? pluralizePLStable(num, r.plural) : r.name}
        {@const Icon = resourceIcon(r.id)}
        <span class="res">
          <span class="res-icon"><Icon size={15} strokeWidth={1.8} /></span>
          <b>{shown}</b> {noun}
          {#if !r.prestige}<i>(+{r.rate}/s)</i>{/if}
        </span>
      {/each}
    {/if}
  </div>
  <div class="actions">
    {#if $snapshot}
      <button onclick={() => achievementsOpen.update((v) => !v)}>
        Osiągnięcia {$snapshot.achievements.earned}/{$snapshot.achievements.total}
      </button>
      <button onclick={() => lexiconOpen.update((v) => !v)}>
        Leksykon {$snapshot.lexicon.unlocked}/{$snapshot.lexicon.total}
      </button>
      {#if $snapshot.characters.length > 0}
        <button onclick={() => kadraOpen.update((v) => !v)}>Kadra</button>
      {/if}
      {#if $snapshot.gielda.unlocked}
        <button onclick={() => gieldaOpen.update((v) => !v)}>Kantor</button>
      {/if}
      {#if $snapshot.zalatwianie.unlocked}
        <button onclick={() => zalatwianieOpen.update((v) => !v)}>Załatwianie</button>
      {/if}
      {#if $snapshot.dyplomacja.unlocked}
        <button onclick={() => dyplomacjaOpen.update((v) => !v)}>Dyplomacja</button>
      {/if}
      {#if $snapshot.tasmaUnlocked}
        <button onclick={() => minigraOpen.update((v) => !v)}>Taśma</button>
      {/if}
    {/if}
    {#if $snapshot}
      <button onclick={() => statystykiOpen.update((v) => !v)}>Statystyki</button>
    {/if}
    <button onclick={manualSave}>Zapisz</button>
    <button onclick={() => settingsOpen.update((v) => !v)}>Ustawienia</button>
    <button class="danger" onclick={() => (confirmReset = true)}>Reset</button>
  </div>
</footer>

{#if confirmReset}
  <div class="modal-overlay" role="dialog" aria-modal="true" aria-label="Potwierdzenie resetu">
    <div class="modal">
      <h2>Twardy reset</h2>
      <p>Utracisz cały postęp tej rozgrywki. Drzewo dziedzictwa (gdy powstanie) zostaje. Na pewno?</p>
      <div class="modal-actions">
        <button class="danger" onclick={doReset}>Tak, resetuj</button>
        <button onclick={() => (confirmReset = false)}>Anuluj</button>
      </div>
    </div>
  </div>
{/if}
