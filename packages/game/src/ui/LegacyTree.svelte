<script lang="ts">
  import GitBranch from '@lucide/svelte/icons/git-branch';
  import { buyTreeNode, closeTree, snapshot, startNewRun, treeOpen, treeStartFlow } from '../engine/bridge';
  import type { TreeNodeView } from '../engine/snapshot';

  const BRANCHES = [
    { id: 'aparat', label: 'Aparat' },
    { id: 'rd', label: 'Rodzime R&D' },
    { id: 'rynek', label: 'Rynek' },
  ];
  const nodesOf = (br: string): TreeNodeView[] => ($snapshot?.tree ?? []).filter((n) => n.branch === br);
</script>

{#if $treeOpen && $snapshot}
  <div class="modal-overlay" role="dialog" aria-modal="true" aria-label="Drzewo dziedzictwa">
    <div class="tree-modal">
      <div class="tree-head">
        <h2><span class="tree-head-icon"><GitBranch size={18} strokeWidth={1.8} /></span>Dziedzictwo</h2>
        <span class="tree-balance">
          {$snapshot.prestige.odznaczenia} {$snapshot.prestige.odznaczeniaUnit}
        </span>
        {#if !$treeStartFlow}
          <button class="tree-close" aria-label="Zamknij" onclick={closeTree}>✕</button>
        {/if}
      </div>

      <p class="tree-hint">
        {#if $treeStartFlow}
          Rozdaj odznaczenia na trwałe ulepszenia, a potem ruszaj z nową pięciolatką.
        {:else}
          Trwałe — przeżywają Denominację. To tylko podgląd: ulepszenia wykupujesz między
          rozgrywkami, zaraz po Denominacji.
        {/if}
      </p>

      {#snippet nodeBtn(n: TreeNodeView, col = 0, row = 0)}
        <button
          class="tree-node {n.status} kind-{n.kind}{row > 2 ? ' linked' : ''}{n.branch ? ` branch-${n.branch}` : ''}"
          style={col ? `grid-column:${col};grid-row:${row}` : ''}
          disabled={n.status !== 'available' || !$treeStartFlow}
          onclick={() => buyTreeNode(n.id)}
          title={n.description ?? ''}
        >
          <span class="tree-node-head">
            <span class="tree-node-name">{n.name}</span>
            {#if n.maxLevel > 1}<span class="tree-node-lvl">{n.level}/{n.maxLevel}</span>{/if}
          </span>
          <span class="tree-node-effect">{n.effectText}</span>
          {#if n.status === 'owned'}
            <span class="tree-node-foot owned">✓ {n.maxLevel > 1 ? 'maks. poziom' : 'wykupione'}</span>
          {:else if n.status === 'locked'}
            <span class="tree-node-foot locked">wymaga: {n.requiresUnmet.join(', ')}</span>
          {:else}
            <span class="tree-node-foot cost">{n.cost} {n.costUnit}{n.maxLevel > 1 ? ` · poziom ${n.level + 1}` : ''}</span>
          {/if}
        </button>
      {/snippet}

      <div class="tree-grid">
        {#each BRANCHES as br, ci (br.id)}
          <div class="tree-col-title branch-{br.id}" style="grid-column:{ci + 1};grid-row:1">{br.label}</div>
        {/each}
        {#each BRANCHES as br, ci (br.id)}
          {#each nodesOf(br.id) as n, ri (n.id)}
            {@render nodeBtn(n, ci + 1, ri + 2)}
          {/each}
        {/each}
      </div>

      {#if $treeStartFlow}
        <div class="tree-foot">
          <button class="newrun-btn" onclick={startNewRun}>Rozpocznij nową pięciolatkę ▶</button>
        </div>
      {/if}
    </div>
  </div>
{/if}
