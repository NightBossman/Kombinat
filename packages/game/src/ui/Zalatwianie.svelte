<script lang="ts">
  // Załatwianie / łapówki (Faza 4A) — cele smarowania + ryzyko kontroli. Płacisz przysługą za
  // czasowy bonus; im grubsza łapówka, tym większe ryzyko, że SB zwęszy.
  import Boxes from '@lucide/svelte/icons/boxes';
  import ShieldCheck from '@lucide/svelte/icons/shield-check';
  import Stamp from '@lucide/svelte/icons/stamp';
  import Crown from '@lucide/svelte/icons/crown';
  import Handshake from '@lucide/svelte/icons/handshake';
  import Package from '@lucide/svelte/icons/package';
  import { zalatwianieOpen, snapshot, bribe, buySupply } from '../engine/bridge';
  import { setSmoothBar, smoothBarOf } from '../engine/smooth.svelte';
  import type { BribeView } from '../engine/snapshot';

  const z = $derived($snapshot?.zalatwianie ?? null);
  const supplies = $derived(z?.supplies ?? []);
  const deal = $derived(z?.supplyDeal ?? null);
  // Pasek-wskaźnik PŁYNNY (reguła: paski odliczające płyną jak liczby): silnik podaje CIĄGŁY `fill`
  // (0..1, sub-sekundowo), a wspólna pętla rAF interpoluje go na 60 fps — bez skoków co sekundę.
  $effect(() => {
    if (deal) setSmoothBar('zal-deal', deal.fill);
  });
  const dealFill = $derived(smoothBarOf('zal-deal'));

  const TARGETS = [
    { id: 'magazynier', label: 'Magazynier', icon: Boxes, desc: 'Deficytowe części — czasowo taniej.' },
    { id: 'celnik', label: 'Celnik', icon: ShieldCheck, desc: 'Import mimo embarga — więcej dewiz.' },
    { id: 'urzednik', label: 'Urzędnik', icon: Stamp, desc: 'Papierologia poza kolejnością — więcej produkcji.' },
    { id: 'dygnitarz', label: 'Dygnitarz', icon: Crown, desc: 'Najwyższe dojścia — Twój czyn (klikanie) waży jak rozkaz z góry.' },
  ];
  const forTarget = (t: string): BribeView[] => (z?.bribes ?? []).filter((b) => b.target === t);

  const riskClass = $derived(!z ? '' : z.ryzyko >= 70 ? 'hot' : z.ryzyko >= 40 ? 'warm' : 'cool');

  // Czas do następnej promocji bywa długi (2 min) — pokaż „m:ss", a krótki (okno) jako „Xs".
  function fmtTime(s: number): string {
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
  }
</script>

{#if $zalatwianieOpen && z}
  <div class="modal-overlay" role="dialog" aria-modal="true" aria-label="Załatwianie">
    <div class="zal-modal">
      <div class="zal-head">
        <h2 class="win-head"><span class="win-head-icon"><Handshake size={18} strokeWidth={1.8} /></span>Załatwianie</h2>
        <button class="tree-close" aria-label="Zamknij" onclick={() => zalatwianieOpen.set(false)}>✕</button>
      </div>
      <p class="tree-hint">Drobne sprawy smaruje się <b>towarem</b> (kawa, wódka, Marlboro — tanio), poważniejsze <b>kopertą</b> z dewizami. Każda łapówka podnosi ryzyko — zbyt grube smarowanie ściąga kontrolę SB.</p>

      <div class="zal-risk {riskClass}">
        <span class="zal-risk-label">Ryzyko kontroli</span>
        <div class="zal-risk-bar"><div class="zal-risk-fill" style="width:{z.ryzyko}%"></div></div>
        <span class="zal-risk-val">{z.ryzyko}%</span>
      </div>

      {#if supplies.length > 0}
        <div class="zal-supply">
          <div class="zal-supply-head">
            <span class="zal-target-icon"><Package size={16} strokeWidth={1.8} /></span>
            <span class="zal-target-name">Zaopatrzenie</span>
            <span class="zal-supply-desc">Towar reglamentowany — kup za dewizy, potem smaruj nim taniej niż kopertą. Co ~2&nbsp;min rynek „rzuca towar": ceny lecą mocno w dół (−55/−75/−90%) na 10&nbsp;s — łap, gdy tanio.</span>
          </div>
          {#if deal}
            <div class="zal-deal" class:on={deal.active}>
              <span class="zal-deal-label">
                {#if deal.active}🟢 PROMOCJA −{deal.pct}% — jeszcze {deal.secondsLeft}s{:else}Następny rzut towaru za {fmtTime(deal.secondsLeft)}{/if}
              </span>
              <div class="zal-deal-bar"><div class="zal-deal-fill" style="width:{(dealFill * 100).toFixed(2)}%"></div></div>
            </div>
          {/if}
          <div class="zal-supply-list">
            {#each supplies as s (s.id)}
              <button class="zal-supply-item" disabled={!s.affordable} onclick={() => buySupply(s.id)} title="Kup {s.batch}× {s.name} za {s.price} {s.priceUnit}">
                <span class="zal-supply-name">{s.name}</span>
                <span class="zal-supply-have">masz: {s.have}</span>
                <span class="zal-supply-buy">+{s.batch} za {s.price} {s.priceUnit}</span>
              </button>
            {/each}
          </div>
        </div>
      {/if}

      <div class="zal-targets">
        {#each TARGETS as t (t.id)}
          {@const list = forTarget(t.id)}
          {#if list.length > 0}
            <div class="zal-target">
              <div class="zal-target-head">
                <span class="zal-target-icon"><t.icon size={16} strokeWidth={1.8} /></span>
                <span class="zal-target-name">{t.label}</span>
              </div>
              <p class="zal-target-desc">{t.desc}</p>
              {#each list as b (b.id)}
                <button class="zal-bribe" disabled={!b.affordable} onclick={() => bribe(b.id)} title={b.flavor ?? ''}>
                  <span class="zal-bribe-name">{b.name}</span>
                  <span class="zal-bribe-eff">{b.effectText}</span>
                  <span class="zal-bribe-foot">
                    <span class="zal-bribe-cost">{b.cost} {b.costUnit}</span>
                    <span class="zal-bribe-risk">ryzyko +{b.risk}</span>
                  </span>
                </button>
              {/each}
            </div>
          {/if}
        {/each}
      </div>
    </div>
  </div>
{/if}

<style>
  .zal-modal {
    width: 100%;
    max-width: 720px;
    max-height: 86vh;
    display: flex;
    flex-direction: column;
    background: var(--panel);
    border: 1px solid var(--border);
    border-top: 3px solid #c9a23a;
    border-radius: 6px;
    padding: 14px 16px;
    box-shadow: 0 8px 28px var(--shadow);
  }
  .zal-head {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .zal-head h2 {
    margin: 0;
    font-size: 18px;
    color: var(--accent-strong);
    flex: 1;
  }
  .zal-risk {
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 10px 0 6px;
    --risk: var(--accent);
  }
  .zal-risk.warm {
    --risk: #e0a93a;
  }
  .zal-risk.hot {
    --risk: var(--danger);
  }
  .zal-risk-label {
    font-size: 12px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--dim);
    flex: none;
  }
  .zal-risk-bar {
    flex: 1;
    height: 8px;
    background: var(--panel-2);
    border: 1px solid var(--border);
    border-radius: 999px;
    overflow: hidden;
  }
  .zal-risk-fill {
    height: 100%;
    background: var(--risk);
    transition: width 0.2s linear;
  }
  .zal-risk-val {
    flex: none;
    font-weight: 700;
    color: var(--risk);
    font-variant-numeric: tabular-nums;
    min-width: 38px;
    text-align: right;
  }
  .zal-supply {
    background: var(--panel-2);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 10px 12px;
    margin: 8px 0 4px;
  }
  .zal-supply-head {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }
  .zal-supply-desc {
    flex-basis: 100%;
    margin: 2px 0 0;
    font-size: 12px;
    color: var(--dim);
  }
  .zal-deal {
    margin-top: 8px;
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .zal-deal-label {
    flex: none;
    font-size: 12px;
    font-weight: 700;
    color: var(--dim);
    font-variant-numeric: tabular-nums;
    min-width: 150px;
  }
  .zal-deal.on .zal-deal-label {
    color: #e7cf86;
  }
  .zal-deal-bar {
    flex: 1;
    height: 7px;
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 999px;
    overflow: hidden;
  }
  .zal-deal-fill {
    height: 100%;
    background: var(--dim);
  }
  .zal-deal.on .zal-deal-fill {
    background: linear-gradient(90deg, #e0a93a, #e7cf86);
    box-shadow: 0 0 10px rgba(231, 197, 100, 0.7);
  }
  .zal-supply-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 8px;
    margin-top: 8px;
  }
  .zal-supply-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
    text-align: left;
    padding: 7px 9px;
    background: var(--panel);
    border: 1px solid var(--border);
    border-left: 3px solid #8a6db0;
    border-radius: 4px;
    cursor: pointer;
    font-family: var(--mono);
    color: var(--text);
  }
  .zal-supply-item:hover:not(:disabled) {
    filter: brightness(1.08);
  }
  .zal-supply-item:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .zal-supply-name {
    font-weight: 700;
    color: var(--accent-strong);
    font-size: 13px;
    text-transform: capitalize;
  }
  .zal-supply-have {
    font-size: 11px;
    color: var(--dim);
  }
  .zal-supply-buy {
    font-size: 12px;
    color: #e7cf86;
  }
  .zal-targets {
    overflow-y: auto;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 10px;
    margin-top: 6px;
  }
  .zal-target {
    background: var(--panel-2);
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: 10px 12px;
  }
  .zal-target-head {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .zal-target-icon {
    display: inline-flex;
    line-height: 0;
    color: #c9a23a;
  }
  .zal-target-name {
    font-weight: 700;
    color: var(--accent-strong);
  }
  .zal-target-desc {
    margin: 2px 0 8px;
    font-size: 12px;
    color: var(--dim);
  }
  .zal-bribe {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 2px;
    text-align: left;
    margin-top: 6px;
    padding: 7px 9px;
    background: var(--panel);
    border: 1px solid var(--border);
    border-left: 3px solid #c9a23a;
    border-radius: 4px;
    cursor: pointer;
    font-family: var(--mono);
    color: var(--text);
  }
  .zal-bribe:hover:not(:disabled) {
    filter: brightness(1.08);
  }
  .zal-bribe:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .zal-bribe-name {
    font-weight: 700;
    color: var(--accent-strong);
    font-size: 13px;
  }
  .zal-bribe-eff {
    font-size: 12px;
    color: var(--accent);
  }
  .zal-bribe-foot {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    margin-top: 2px;
  }
  .zal-bribe-cost {
    color: #e7cf86;
  }
  .zal-bribe-risk {
    color: var(--danger);
  }
</style>
