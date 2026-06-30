<script lang="ts">
  import { lexiconOpen, snapshot } from '../engine/bridge';
  import { lexiconIcon, doctrineIcon } from './icons';

  const lex = $derived($snapshot?.lexicon ?? null);
  const zjazd = $derived($snapshot?.zjazd ?? null);
  // Doktryny odsłaniają się w Leksykonie dopiero, gdy gracz odblokuje Zjazd PZPR (pierwsza Denominacja) —
  // wtedy poznaje wszystkie linie naraz i może o nich poczytać. Wcześniej zakładka jest zamglona.
  const doctrines = $derived(zjazd?.doctrines ?? []);

  let tab = $state<'hasla' | 'doktryny'>('hasla');

  const AXIS_LABEL: Record<string, string> = { gospodarka: 'Gospodarka', polityka: 'Polityka' };
</script>

{#if $lexiconOpen && lex}
  <div class="modal-overlay" role="dialog" aria-modal="true" aria-label="Leksykon PRL">
    <div class="lex-modal">
      <div class="lex-head">
        <h2>Leksykon PRL</h2>
        {#if tab === 'hasla'}
          <span class="lex-count">{lex.unlocked} / {lex.total} odkryte</span>
        {:else}
          <span class="lex-count">{doctrines.length} doktryn</span>
        {/if}
        <button class="tree-close" aria-label="Zamknij" onclick={() => lexiconOpen.set(false)}>✕</button>
      </div>

      <div class="lex-tabs" role="tablist">
        <button
          class="lex-tab"
          class:active={tab === 'hasla'}
          role="tab"
          aria-selected={tab === 'hasla'}
          onclick={() => (tab = 'hasla')}>Hasła</button>
        <button
          class="lex-tab"
          class:active={tab === 'doktryny'}
          role="tab"
          aria-selected={tab === 'doktryny'}
          onclick={() => (tab = 'doktryny')}>Doktryny</button>
      </div>

      {#if tab === 'hasla'}
        <p class="tree-hint">Prawdziwe notki o epoce, odsłaniane wraz z odblokowywaniem treści.</p>
        <div class="lex-list">
          {#each lex.entries as e (e.id)}
            {#if e.unlocked}
              {@const Icon = lexiconIcon(e.iconKey)}
              <div class="lex-entry">
                <div class="lex-name">
                  {#if Icon}<span class="lex-icon"><Icon size={16} strokeWidth={1.8} /></span>{/if}
                  {e.name}
                </div>
                <p class="lex-text">{e.text}</p>
              </div>
            {:else}
              <div class="lex-entry locked">
                <div class="lex-name">???</div>
                <p class="lex-text">Wpis jeszcze nieodkryty — graj dalej.</p>
              </div>
            {/if}
          {/each}
        </div>
      {:else}
        <p class="tree-hint">
          Linie polityczno-gospodarcze, które wybierasz na Zjeździe PZPR — każda na całą pięciolatkę.
        </p>
        <div class="lex-list">
          {#if !zjazd?.unlocked}
            <div class="lex-entry locked">
              <div class="lex-name">??? — doktryny zakryte</div>
              <p class="lex-text">
                Doktryny poznasz po pierwszej Denominacji, gdy zwołasz Zjazd PZPR. Wtedy odsłonią się
                tutaj wszystkie linie wraz z opisem.
              </p>
            </div>
          {:else}
            {#each doctrines as d (d.id)}
              {@const Icon = doctrineIcon(d.axis)}
              {@const active = zjazd && zjazd.activeId === d.id}
              <div class="lex-entry doctrine" class:active>
                <div class="lex-name">
                  <span class="lex-icon"><Icon size={16} strokeWidth={1.8} /></span>
                  {d.name}
                  {#if d.axis}<span class="dok-axis">{AXIS_LABEL[d.axis] ?? d.axis}</span>{/if}
                  {#if active}<span class="dok-badge active">obowiązuje teraz</span>{/if}
                  {#if d.hasDebt}<span class="dok-badge debt">ryzyko zadłużenia</span>{/if}
                </div>
                <p class="lex-text">{d.lore ?? d.flavor ?? ''}</p>
                <p class="dok-effect">{d.effectText}</p>
              </div>
            {/each}
          {/if}
        </div>
      {/if}
    </div>
  </div>
{/if}
