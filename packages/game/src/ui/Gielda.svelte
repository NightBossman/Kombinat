<script lang="ts">
  import ArrowRightLeft from '@lucide/svelte/icons/arrow-right-left';
  import ArrowDownLeft from '@lucide/svelte/icons/arrow-down-left';
  import ArrowUpRight from '@lucide/svelte/icons/arrow-up-right';
  import { formatNumber } from '@kombinat/shared';
  import { scaleLinear } from 'd3-scale';
  import { line, area, curveMonotoneX } from 'd3-shape';
  import { gieldaOpen, snapshot, exchange } from '../engine/bridge';

  const g = $derived($snapshot?.gielda ?? null);

  // Wykres kursu (uwaga #11) — D3 (d3-scale + d3-shape) liczy ścieżki SVG; Svelte je rysuje.
  const CHART_W = 480;
  const CHART_H = 96;
  const chart = $derived.by(() => {
    const h = g?.history ?? [];
    if (h.length < 2) return null;
    const pad = 6;
    const x = scaleLinear().domain([0, h.length - 1]).range([pad, CHART_W - pad]);
    const lo = Math.min(...h);
    const hi = Math.max(...h);
    const y = scaleLinear().domain([lo === hi ? lo - 1 : lo, hi]).range([CHART_H - pad, pad]);
    const linePath = line<number>().x((_d, i) => x(i)).y((d) => y(d)).curve(curveMonotoneX)(h);
    const areaPath = area<number>().x((_d, i) => x(i)).y0(CHART_H - pad).y1((d) => y(d)).curve(curveMonotoneX)(h);
    return { linePath: linePath ?? '', areaPath: areaPath ?? '', lo, hi };
  });

  const trendGlyph = $derived(g?.trend === 'up' ? '▲' : g?.trend === 'down' ? '▼' : '◆');
  const trendLabel = $derived(g?.trend === 'up' ? 'rośnie' : g?.trend === 'down' ? 'spada' : 'stabilny');

  // Kurs tez plynnie: ease lokalnego licznika ku surowemu kursowi z migawki (rAF).
  const targetRate = $derived(g?.rateRaw ?? 0);
  let dispRate = $state(0);
  $effect(() => {
    if (!$gieldaOpen) return;
    if (dispRate <= 0 && targetRate > 0) dispRate = targetRate; // zasiew (i fallback gdy brak rAF)
    let raf = 0;
    const loop = (): void => {
      const t = targetRate;
      if (t > 0) {
        dispRate += (t - dispRate) * 0.2;
        if (Math.abs(t - dispRate) < Math.max(1, t * 0.001)) dispRate = t;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  });
  const rateText = $derived(formatNumber(Math.round(dispRate > 0 ? dispRate : targetRate)));

  const fracs: { label: string; v: number }[] = [
    { label: '10%', v: 0.1 },
    { label: '50%', v: 0.5 },
    { label: 'wszystko', v: 1 },
  ];
</script>

{#if $gieldaOpen && g}
  <div class="modal-overlay" role="dialog" aria-modal="true" aria-label="Kantor / giełda">
    <div class="gld-modal">
      <div class="gld-head">
        <h2 class="win-head"><span class="win-head-icon"><ArrowRightLeft size={18} strokeWidth={1.8} /></span>Kantor pod Forum</h2>
        <button class="tree-close" aria-label="Zamknij" onclick={() => gieldaOpen.set(false)}>✕</button>
      </div>
      <p class="tree-hint">Kurs faluje cały czas. Kupuj dewizy, gdy tanio, sprzedawaj, gdy drogo. Cinkciarz bierze prowizję, więc czysty obrót w te i z powrotem trochę kosztuje.</p>

      <div class="gld-rate" class:up={g.trend === 'up'} class:down={g.trend === 'down'}>
        <span class="gld-rate-glyph">{trendGlyph}</span>
        <span class="gld-rate-val">1 dewiza = {rateText} cykli</span>
        <span class="gld-rate-trend">kurs {trendLabel}</span>
      </div>

      {#if chart}
        <div class="gld-chart" class:up={g.trend === 'up'} class:down={g.trend === 'down'}>
          <svg viewBox="0 0 {CHART_W} {CHART_H}" preserveAspectRatio="none" aria-label="Wykres kursu">
            <path class="gld-chart-area" d={chart.areaPath} />
            <path class="gld-chart-line" d={chart.linePath} />
          </svg>
          <span class="gld-chart-hi">{formatNumber(Math.round(chart.hi))}</span>
          <span class="gld-chart-lo">{formatNumber(Math.round(chart.lo))}</span>
          <span class="gld-chart-cap">kurs z ostatnich 2 minut</span>
        </div>
      {/if}

      <div class="gld-cols">
        <div class="gld-side buy">
          <h3><span class="gld-side-ico"><ArrowDownLeft size={15} strokeWidth={2.2} /></span>Kup dewizy</h3>
          <p class="gld-note">płacisz cyklami</p>
          <div class="gld-btns">
            {#each fracs as f (f.v)}
              <button onclick={() => exchange('buy', f.v)}>{f.label}</button>
            {/each}
          </div>
        </div>
        <div class="gld-side sell">
          <h3><span class="gld-side-ico"><ArrowUpRight size={15} strokeWidth={2.2} /></span>Sprzedaj dewizy</h3>
          <p class="gld-note">dostajesz cykle (−5% prowizji)</p>
          <div class="gld-btns">
            {#each fracs as f (f.v)}
              <button class="sell" onclick={() => exchange('sell', f.v)}>{f.label}</button>
            {/each}
          </div>
        </div>
      </div>
    </div>
  </div>
{/if}

<style>
  .gld-modal {
    width: 100%;
    max-width: 560px;
    display: flex;
    flex-direction: column;
    background: var(--panel);
    border: 1px solid var(--border);
    border-top: 3px solid #5fa86a;
    border-radius: 6px;
    padding: 14px 16px;
    box-shadow: 0 8px 28px var(--shadow);
  }
  .gld-head {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .gld-head h2 {
    margin: 0;
    font-size: 18px;
    color: var(--accent-strong);
    flex: 1;
  }
  .gld-rate {
    margin: 12px 0 4px;
    padding: 12px 14px;
    background: var(--panel-2);
    border: 1px solid var(--border);
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 12px;
    transition: border-color 0.2s ease;
  }
  .gld-rate.up {
    border-color: #5fa86a;
  }
  .gld-rate.down {
    border-color: #c0564a;
  }
  .gld-rate-glyph {
    font-size: 20px;
    color: var(--dim);
  }
  .gld-rate.up .gld-rate-glyph {
    color: #5fa86a;
  }
  .gld-rate.down .gld-rate-glyph {
    color: #c0564a;
  }
  .gld-rate-val {
    font-size: 18px;
    font-weight: 800;
    color: var(--text);
    font-variant-numeric: tabular-nums;
  }
  .gld-rate-trend {
    margin-left: auto;
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--dim);
  }
  .gld-chart {
    position: relative;
    margin: 10px 0 16px; /* większy odstęp do sekcji kupna/sprzedaży */
    height: 106px; /* +10% wysokości okna z wykresem */
    background: var(--panel-2);
    border: 1px solid var(--border);
    border-radius: 6px;
    overflow: hidden;
    --chart-col: var(--accent-strong);
  }
  .gld-chart.up {
    --chart-col: #5fa86a;
  }
  .gld-chart.down {
    --chart-col: #c0564a;
  }
  .gld-chart svg {
    display: block;
    width: 100%;
    height: 100%;
  }
  .gld-chart-line {
    fill: none;
    stroke: var(--chart-col);
    stroke-width: 2;
    vector-effect: non-scaling-stroke;
  }
  .gld-chart-area {
    fill: color-mix(in srgb, var(--chart-col) 18%, transparent);
    stroke: none;
  }
  .gld-chart-hi,
  .gld-chart-lo,
  .gld-chart-cap {
    position: absolute;
    font-size: 10px;
    color: var(--dim);
    font-variant-numeric: tabular-nums;
    pointer-events: none;
  }
  .gld-chart-hi {
    top: 3px;
    left: 6px;
  }
  .gld-chart-lo {
    bottom: 3px;
    left: 6px;
  }
  .gld-chart-cap {
    top: 3px;
    right: 6px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .gld-cols {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }
  /* Sekcje kupna i sprzedaży WYRAŹNIE rozróżnione kolorem (kątem oka): kupno = zieleń, sprzedaż = bursztyn. */
  .gld-side {
    background: var(--panel-2);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 10px 12px;
  }
  .gld-side.buy {
    border-left: 4px solid #5fa86a;
    background: color-mix(in srgb, #5fa86a 7%, var(--panel-2));
  }
  .gld-side.sell {
    border-left: 4px solid #e0a93a;
    background: color-mix(in srgb, #e0a93a 7%, var(--panel-2));
  }
  .gld-side h3 {
    margin: 0 0 2px;
    font-size: 14px;
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .gld-side.buy h3 {
    color: #8fe39a;
  }
  .gld-side.sell h3 {
    color: #f0c869;
  }
  .gld-side-ico {
    display: inline-flex;
    line-height: 0;
  }
  .gld-side.buy .gld-side-ico {
    color: #5fa86a;
  }
  .gld-side.sell .gld-side-ico {
    color: #e0a93a;
  }
  .gld-note {
    margin: 0 0 8px;
    font-size: 11px;
    color: var(--dim);
  }
  .gld-btns {
    display: flex;
    gap: 6px;
  }
  .gld-btns button {
    flex: 1;
    padding: 7px 4px;
    border: 1px solid #5fa86a;
    background: #4a8f54;
    color: #fff;
    border-radius: 4px;
    font-weight: 700;
    font-size: 12px;
    cursor: pointer;
  }
  .gld-btns button.sell {
    background: #b9842a;
    border-color: #e0a93a;
    color: #fff;
  }
  .gld-btns button:hover {
    filter: brightness(1.12);
  }
</style>
