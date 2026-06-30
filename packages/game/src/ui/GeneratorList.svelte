<script lang="ts">
  import Factory from '@lucide/svelte/icons/factory';
  import type { Snapshot } from '../engine/snapshot';
  import GeneratorCard from './GeneratorCard.svelte';
  import { buyAmount, setBuyAmount, type BuyAmount } from '../engine/bridge';

  interface Props {
    snap: Snapshot;
  }
  let { snap }: Props = $props();

  const unlocked = $derived(snap.generators.filter((g) => g.unlocked));
  // Pierwszy zablokowany generator pokazujemy jako "cien" — sygnal, ze cos czeka (PLAN 1.3.1, 8).
  const nextLocked = $derived(snap.generators.find((g) => !g.unlocked));

  const AMOUNTS: { v: BuyAmount; label: string }[] = [
    { v: 1, label: '×1' },
    { v: 10, label: '×10' },
    { v: 100, label: '×100' },
    { v: 'max', label: 'Max' },
  ];
</script>

<section class="generators">
  <div class="section-head gen-head-row">
    <span class="section-head-main"><span class="section-icon"><Factory size={15} strokeWidth={1.8} /></span>Maszyny i sprzęt</span>
    <span class="buy-amount" role="group" aria-label="Ile kupować">
      {#each AMOUNTS as a (a.v)}
        <button class="buy-amount-btn" class:active={$buyAmount === a.v} onclick={() => setBuyAmount(a.v)}>{a.label}</button>
      {/each}
    </span>
  </div>
  {#each unlocked as g (g.id)}
    <GeneratorCard gen={g} />
  {/each}
  {#if nextLocked}
    <div class="gen-card locked" aria-hidden="true">
      <div class="gen-head"><span class="gen-name">???</span></div>
      <p class="gen-flavor">Coś czeka na odblokowanie…</p>
    </div>
  {/if}
</section>
