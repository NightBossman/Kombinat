<script lang="ts">
  import { formatNumber, pluralizePLStable } from '@kombinat/shared';
  import Calculator from '@lucide/svelte/icons/calculator';
  import { click } from '../engine/bridge';
  import { smoothFloorOf, smoothFiniteOf } from '../engine/smooth.svelte';
  import type { Snapshot } from '../engine/snapshot';

  interface Props {
    snap: Snapshot;
  }
  let { snap }: Props = $props();

  const main = $derived(snap.resources.find((r) => r.id === snap.clickResource) ?? snap.resources[0]);
  const fin = $derived(smoothFiniteOf(snap.clickResource));
  // Plynnie toczona, CALA wartosc (60 fps); fallback do migawki dla liczb poza float64.
  const display = $derived(fin ? formatNumber(smoothFloorOf(snap.clickResource)) : (main?.amount ?? '0'));
  // Odmiana STABILNA — przy szybkim liczeniu rzeczownik nie miga (1 cykl / 2 cykle / 5+ cykli).
  const unit = $derived(
    main?.plural && fin
      ? pluralizePLStable(smoothFloorOf(snap.clickResource), main.plural)
      : (main?.name ?? snap.clickResourceName),
  );

  let pops = $state<{ id: number; x: number; y: number }[]>([]);
  let nextId = 0;

  const MAX_POPS = 14; // limit jednoczesnych "+N", by szybkie klikanie nie zalalo DOM-u

  function doClick(e: MouseEvent): void {
    click();
    const id = nextId++;
    // Pozycja względem PRZYCISKU (nie klikniętego dziecka, np. ikony) — inaczej offsetX/Y liczyłby
    // się od ikony i „+N" skakałoby do lewej krawędzi (bug). clientX/Y − prostokąt przycisku.
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    pops = [...pops, { id, x: e.clientX - rect.left, y: e.clientY - rect.top }].slice(-MAX_POPS);
    setTimeout(() => {
      pops = pops.filter((p) => p.id !== id);
    }, 700);
  }
</script>

<section class="click-area">
  <div class="readout">
    <div class="amount">{display}</div>
    <div class="unit">{unit}</div>
    <div class="rate">{main?.rate ?? '0'} / s · <span class="per-click">+{snap.clickPower} / klik</span></div>
  </div>
  <button class="big-click" onclick={doClick} aria-label="Licz">
    <span class="click-icon"><Calculator size={46} strokeWidth={1.6} /></span>
    <span class="click-label">Licz</span>
    {#each pops as p (p.id)}
      <span class="pop" style="left:{p.x}px; top:{p.y}px">+{snap.clickPower}</span>
    {/each}
  </button>
</section>
