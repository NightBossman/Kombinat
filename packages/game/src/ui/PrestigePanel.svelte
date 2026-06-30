<script lang="ts">
  import { formatNumber } from '@kombinat/shared';
  import RefreshCcw from '@lucide/svelte/icons/refresh-ccw';
  import { denominate, openTree } from '../engine/bridge';
  import type { Snapshot } from '../engine/snapshot';

  interface Props {
    snap: Snapshot;
  }
  let { snap }: Props = $props();
  const p = $derived(snap.prestige);
  const zjazd = $derived(snap.zjazd);

  let confirmDenom = $state(false);
  function doDenom(): void {
    confirmDenom = false;
    denominate();
  }
</script>

{#if p.visible}
  <section class="prestige">
    <div class="section-head"><span class="section-icon"><RefreshCcw size={15} strokeWidth={1.8} /></span>Denominacja</div>
    <div class="prestige-row">
      <div class="prestige-info">
        {#if p.odznaczeniaRaw > 0}
          <span class="odz">Masz <b>{p.odznaczenia}</b> {p.odznaczeniaUnit}</span>
          {#if p.bonusPct > 0}
            <span class="odz-bonus">Każde daje +0,2% cykli — razem <b>+{formatNumber(p.bonusPct)}%</b></span>
          {/if}
        {/if}
        <span class="prestige-gain">
          {#if p.canDenominate}
            Denominacja da <b>+{p.gain}</b> {p.gainUnit}
          {:else}
            Następne odznaczenie tuż-tuż…
          {/if}
        </span>
      </div>
      <div class="prestige-actions">
        <button class="denom-btn" disabled={!p.canDenominate} onclick={() => (confirmDenom = true)}>Denominacja</button>
        {#if p.odznaczeniaRaw > 0 || p.denominations > 0}
          <button class="tree-btn" onclick={openTree}>Dziedzictwo</button>
        {/if}
      </div>
    </div>
    {#if !p.canDenominate && p.progress >= 0}
      <div class="goal-bar"><div class="goal-bar-fill" style="width:{Math.round(p.progress * 100)}%"></div></div>
    {/if}
    {#if zjazd.activeName}
      <div class="doktryna" class:kryzys={zjazd.kryzys}>
        Doktryna: <b>{zjazd.activeName}</b>{#if zjazd.kryzys} — kryzys zadłużenia{/if}
      </div>
    {/if}
  </section>
{/if}

{#if confirmDenom}
  <div class="modal-overlay" role="dialog" aria-modal="true" aria-label="Potwierdzenie Denominacji">
    <div class="modal">
      <h2>Denominacja?</h2>
      <p>
        Rozpoczniesz nową pięciolatkę. Dostaniesz <b>+{p.gain} {p.gainUnit}</b>, ale bieżąca
        rozgrywka (maszyny, cykle, ulepszenia, kadra) wróci do zera. Drzewo dziedzictwa,
        osiągnięcia i Leksykon zostają. Na pewno?
      </p>
      <div class="modal-actions">
        <button onclick={doDenom}>Tak, denominuj</button>
        <button onclick={() => (confirmDenom = false)}>Anuluj</button>
      </div>
    </div>
  </div>
{/if}
