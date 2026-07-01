<script lang="ts">
  // Dyplomacja bloków (Faza 4C, PLAN 9.3) — relacja z krajem przesuwa ceny wkładów / produkcję / dewizy.
  // Inwestujesz dewizy w relację; im wyższa, tym większy stały bonus. Wschód (RWPG) vs Zachód (za CoCom).
  import Globe from '@lucide/svelte/icons/globe';
  import { dyplomacjaOpen, snapshot, improveRelation } from '../engine/bridge';
  import type { RelationView } from '../engine/snapshot';

  const d = $derived($snapshot?.dyplomacja ?? null);
  // Kraje w kategorii ZAWSZE alfabetycznie (reguła dyplomacji).
  const ofBloc = (b: string): RelationView[] =>
    (d?.relations ?? []).filter((r) => r.bloc === b).sort((a, c) => a.name.localeCompare(c.name, 'pl'));
  const BLOCS = [
    { id: 'wschod', label: 'Blok wschodni — RWPG', desc: 'Bratnie kraje zza żelaznej kurtyny.' },
    { id: 'zachod', label: 'Zachód i sojusznicy — za murem CoCom', desc: 'Twarda waluta i technologia spoza embarga — oraz dalecy sojusznicy.' },
  ];
</script>

{#if $dyplomacjaOpen && d}
  <div class="modal-overlay" role="dialog" aria-modal="true" aria-label="Dyplomacja">
    <div class="dyp-modal">
      <div class="dyp-head">
        <h2 class="win-head"><span class="win-head-icon"><Globe size={18} strokeWidth={1.8} /></span>Dyplomacja</h2>
        <button class="tree-close" aria-label="Zamknij" onclick={() => dyplomacjaOpen.set(false)}>✕</button>
      </div>
      <p class="tree-hint">Zacieśniaj relacje za dewizy — każda przesuwa ceny wkładów, produkcję albo dopływ dewiz. Im wyższa relacja, tym większy stały bonus na całą rozgrywkę.</p>

      {#each BLOCS as bl (bl.id)}
        {@const list = ofBloc(bl.id)}
        {#if list.length > 0}
          <div class="dyp-bloc" class:zachod={bl.id === 'zachod'}>
            <div class="dyp-bloc-title">{bl.label}</div>
            <p class="dyp-bloc-desc">{bl.desc}</p>
            <div class="dyp-list">
              {#each list as r (r.id)}
                <div class="dyp-country" class:maxed={r.atMax}>
                  <div class="dyp-country-head">
                    <span class="dyp-country-name">{r.name}{#if r.atMax}<span class="dyp-max-badge" title="Sojusz zacieśniony na maksa">★</span>{/if}</span>
                    <span class="dyp-country-rel">{r.relation}/{r.max} · {r.relPct}%</span>
                  </div>
                  <div class="dyp-bar"><div class="dyp-bar-fill" style="width:{(r.relation / r.max) * 100}%"></div></div>
                  <span class="dyp-benefit">{r.benefit}</span>
                  <span class="dyp-effect">{r.effectText}</span>
                  <button
                    class="dyp-btn"
                    disabled={!r.affordable || r.atMax}
                    onclick={() => improveRelation(r.id)}
                    title={r.flavor ?? ''}
                  >
                    {#if r.atMax}Sojusz zacieśniony{:else}Zacieśnij — {r.cost} {r.costUnit}{/if}
                  </button>
                </div>
              {/each}
            </div>
          </div>
        {/if}
      {/each}
    </div>
  </div>
{/if}

<style>
  .dyp-modal {
    width: 100%;
    max-width: 760px;
    max-height: 88vh;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    background: var(--panel);
    border: 1px solid var(--border);
    border-top: 3px solid #5a8fb0;
    border-radius: 6px;
    padding: 14px 16px;
    box-shadow: 0 8px 28px var(--shadow);
  }
  .dyp-head {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .dyp-head h2 {
    margin: 0;
    font-size: 18px;
    color: var(--accent-strong);
    flex: 1;
  }
  .dyp-bloc {
    margin-top: 12px;
    padding: 10px 12px;
    background: var(--panel-2);
    border: 1px solid var(--border);
    border-left: 3px solid #c0564a;
    border-radius: 6px;
  }
  .dyp-bloc.zachod {
    border-left-color: #5a8fb0;
  }
  .dyp-bloc-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--accent-strong);
  }
  .dyp-bloc-desc {
    margin: 2px 0 8px;
    font-size: 12px;
    color: var(--dim);
  }
  .dyp-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 8px;
  }
  .dyp-country {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 9px 11px;
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 4px;
    font-family: var(--mono);
  }
  /* Kraj z relacją na maksie — złota obwódka + poświata, żeby rzucał się w oczy jako „wymaksowany". */
  .dyp-country.maxed {
    border-color: #e7cf86;
    box-shadow: 0 0 0 1px #e7cf86, 0 0 12px rgba(231, 207, 134, 0.35);
  }
  .dyp-max-badge {
    margin-left: 6px;
    color: #e7cf86;
    font-size: 13px;
  }
  .dyp-country-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
  }
  .dyp-country-name {
    font-weight: 700;
    color: var(--accent-strong);
    font-size: 14px;
  }
  .dyp-country-rel {
    flex: none;
    font-size: 12px;
    font-weight: 700;
    color: var(--accent);
    font-variant-numeric: tabular-nums;
  }
  .dyp-bar {
    height: 7px;
    background: var(--panel-2);
    border: 1px solid var(--border);
    border-radius: 999px;
    overflow: hidden;
  }
  .dyp-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent), var(--accent-strong));
    transition: width 0.2s ease;
  }
  .dyp-benefit {
    font-size: 12px;
    color: var(--text);
  }
  .dyp-effect {
    font-size: 12px;
    color: var(--accent);
    min-height: 15px;
  }
  .dyp-btn {
    margin-top: 4px;
    padding: 7px 9px;
    background: var(--accent);
    color: #fff;
    border: 1px solid var(--accent-strong);
    border-radius: 4px;
    font-weight: 700;
    font-size: 12px;
    cursor: pointer;
    font-variant-numeric: tabular-nums;
  }
  .dyp-btn:hover:not(:disabled) {
    filter: brightness(1.1);
  }
  .dyp-btn:disabled {
    opacity: 0.45;
    cursor: not-allowed;
    background: var(--panel-2);
    color: var(--dim);
  }
</style>
