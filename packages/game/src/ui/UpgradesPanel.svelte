<script lang="ts">
  import Sparkles from '@lucide/svelte/icons/sparkles';
  import { buyUpgrade } from '../engine/bridge';
  import type { Snapshot, UpgradeView } from '../engine/snapshot';

  interface Props {
    snap: Snapshot;
  }
  let { snap }: Props = $props();

  let filter = $state('');
  // Zwinięte grupy (lokalny stan UI). Domyślnie wszystkie rozwinięte.
  let collapsed = $state<Record<string, boolean>>({});

  // Specjalne grupy idą przodem, reszta (maszyny) alfabetycznie po nich.
  const GROUP_ORDER = ['Globalne', 'Klikanie', 'Koszty', 'Dewizy', 'Specjalne'];
  function groupRank(g: string): number {
    const i = GROUP_ORDER.indexOf(g);
    return i >= 0 ? i : GROUP_ORDER.length;
  }

  const groups = $derived.by(() => {
    const q = filter.trim().toLowerCase();
    const list = q ? snap.upgrades.filter((u) => u.name.toLowerCase().includes(q)) : snap.upgrades;
    const map = new Map<string, UpgradeView[]>();
    for (const u of list) {
      const g = u.group ?? 'Różne';
      let arr = map.get(g);
      if (!arr) {
        arr = [];
        map.set(g, arr);
      }
      arr.push(u);
    }
    const out = [...map.entries()].map(([name, items]) => ({
      name,
      // dostępne (stać Cię) przodem, potem reszta
      items: items.slice().sort((a, b) => Number(b.affordable) - Number(a.affordable)),
      affordableCount: items.filter((u) => u.affordable).length,
    }));
    out.sort((a, b) => groupRank(a.name) - groupRank(b.name) || a.name.localeCompare(b.name, 'pl'));
    return out;
  });

  function toggle(g: string): void {
    collapsed[g] = !collapsed[g];
  }
  function buyAffordable(items: UpgradeView[]): void {
    // Worker przelicza sekwencyjnie i odrzuci te, na które już nie starczy — bezpieczne.
    for (const u of items) if (u.affordable) buyUpgrade(u.id);
  }
</script>

<section class="upgrades">
  <div class="section-head">
    <span class="section-icon"><Sparkles size={15} strokeWidth={1.8} /></span>Ulepszenia
    <span class="up-count" title="Wykupione / wszystkie ulepszenia">{snap.upgradeStats.owned} / {snap.upgradeStats.total}</span>
  </div>

  {#if snap.upgrades.length > 0}
    {#if snap.upgrades.length >= 8}
      <input class="up-filter" type="text" placeholder="Szukaj ulepszenia…" bind:value={filter} />
    {/if}

    {#each groups as grp (grp.name)}
      <div class="up-group">
        <div class="up-group-head">
          <button class="up-group-toggle" onclick={() => toggle(grp.name)}>
            <span class="up-caret">{collapsed[grp.name] ? '▸' : '▾'}</span>
            {grp.name}
            <span class="up-group-n">({grp.items.length})</span>
          </button>
          {#if grp.affordableCount > 1}
            <button class="up-buyall" onclick={() => buyAffordable(grp.items)} title="Kup wszystkie dostępne w tej grupie">
              Kup dostępne ({grp.affordableCount})
            </button>
          {/if}
        </div>

        {#if !collapsed[grp.name]}
          <div class="upgrade-grid">
            {#each grp.items as u (u.id)}
              <button
                class="upgrade"
                class:affordable={u.affordable}
                disabled={!u.affordable}
                onclick={() => buyUpgrade(u.id)}
                title={u.flavor ?? ''}
              >
                <span class="upgrade-name">{u.name}</span>
                <span class="upgrade-effect">{u.effectText}</span>
                <span class="upgrade-cost">{u.cost} {u.costUnit}</span>
              </button>
            {/each}
          </div>
        {/if}
      </div>
    {/each}

    {#if groups.length === 0}
      <p class="upgrades-empty">Nic nie pasuje do „{filter}".</p>
    {/if}
  {:else}
    <p class="upgrades-empty">Na razie wszystko wykupione. Rozbuduj park maszyn — nowe ulepszenia odblokują się same.</p>
  {/if}
</section>
