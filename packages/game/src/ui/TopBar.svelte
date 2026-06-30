<script lang="ts">
  import { ready, dziennikOpen } from '../engine/bridge';
  import type { TickerLine } from '../engine/protocol';

  // Przeplata wpisy tak, by sasiednie nie mialy tego samego strumienia (koloru) — zachlannie
  // wybieramy najliczniejszy strumien rozny od poprzedniego.
  function interleave(items: TickerLine[]): TickerLine[] {
    const buckets = new Map<string, TickerLine[]>();
    for (const it of items) {
      const arr = buckets.get(it.stream) ?? [];
      arr.push(it);
      buckets.set(it.stream, arr);
    }
    const out: TickerLine[] = [];
    let last = '';
    while (out.length < items.length) {
      let best = '';
      let bestLen = 0;
      for (const [s, arr] of buckets) {
        if (s === last) continue;
        if (arr.length > bestLen) {
          best = s;
          bestLen = arr.length;
        }
      }
      if (best === '') {
        for (const [s, arr] of buckets) {
          if (arr.length > 0) {
            best = s;
            break;
          }
        }
      }
      const arr = buckets.get(best);
      if (arr && arr.length) {
        out.push(arr.shift() as TickerLine);
        last = best;
      } else {
        break;
      }
    }
    return out;
  }

  const lines = $derived(interleave($ready?.ticker ?? []));
  // Czas pelnego przewiniecia ~ dlugosc tekstu (stala predkosc czytania), o ~15% wolniej; min 35 s.
  const dur = $derived(Math.max(35, lines.reduce((n, l) => n + l.text.length + 3, 0) * 0.185));
</script>

<header class="ticker">
  <button class="badge" title="Otwórz Dziennik" onclick={() => dziennikOpen.set(true)}>DZIENNIK</button>
  <div class="ticker-window">
    {#if lines.length > 0}
      <div class="ticker-stream" style="animation-duration:{dur}s">
        {#each [...lines, ...lines] as l, i (i)}
          <span class="seg {l.stream}">{l.text}</span>
          <span class="sep">◆</span>
        {/each}
      </div>
    {:else}
      <span class="seg">Kombinat — wykonanie planu trwa nieprzerwanie.</span>
    {/if}
  </div>
</header>
