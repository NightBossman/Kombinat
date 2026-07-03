<script lang="ts">
  import BadgeCheck from '@lucide/svelte/icons/badge-check';
  import Puzzle from '@lucide/svelte/icons/puzzle';
  import { buy } from '../engine/bridge';
  import { settings } from '../engine/settings.svelte';
  import { genIcon } from './icons';
  import type { GeneratorView } from '../engine/snapshot';

  interface Props {
    gen: GeneratorView;
  }
  let { gen }: Props = $props();

  const Icon = $derived(genIcon(gen.id));

  // Poświata przy zakupie (juice). RESTARTUJEMY animację na każdy zakup (off→on przez rAF),
  // dzięki czemu szybkie klikanie daje krótki, czysty błysk za każdym razem (uwaga #6).
  let pulsing = $state(false);
  let prev = 0;
  let inited = false;
  let raf = 0;
  $effect(() => {
    const n = gen.ownedNum;
    if (!inited) {
      inited = true;
      prev = n;
      return;
    }
    if (n > prev && settings().animations) {
      pulsing = false;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => (pulsing = true));
    }
    prev = n;
  });
</script>

<button
  class="gen-card"
  class:affordable={gen.affordable}
  class:pulse-buy={pulsing}
  class:dlc={!!gen.accent}
  disabled={!gen.affordable}
  onclick={() => buy(gen.id)}
  style={gen.accent ? `--pack-accent:${gen.accent}` : undefined}
>
  {#if gen.dlcSeal}
    <span
      class="gen-stamp"
      class:official={gen.dlcSeal === 'official'}
      title={gen.dlcSeal === 'official' ? 'Paczka oficjalna (podpis zweryfikowany)' : 'Paczka społecznościowa'}
    >
      {#if gen.dlcSeal === 'official'}<BadgeCheck size={14} strokeWidth={2} />{:else}<Puzzle size={14} strokeWidth={2} />{/if}
    </span>
  {/if}
  <div class="gen-head">
    <span class="gen-title">
      <span class="gen-icon"><Icon size={18} strokeWidth={1.7} /></span>
      <span class="gen-name">{gen.name}</span>
    </span>
    <span class="gen-owned">{gen.owned}</span>
  </div>
  {#if gen.flavor}
    <p class="gen-flavor">{gen.flavor}</p>
  {/if}
  <div class="gen-foot">
    <span class="gen-cost">
      {#if gen.buyCount > 1}<span class="gen-mult">×{gen.buyCount}</span>{/if}<span class="gen-cost-val">{gen.cost} {gen.costUnit}</span>
    </span>
    <span class="gen-rate">+{gen.rate} {gen.outputUnit}/s</span>
  </div>
</button>
