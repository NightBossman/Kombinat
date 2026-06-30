<script lang="ts">
  import Compass from '@lucide/svelte/icons/compass';
  import { smoothFiniteOf, smoothValueOf } from '../engine/smooth.svelte';
  import { goalIcon } from './icons';
  import type { GoalView, Snapshot } from '../engine/snapshot';

  interface Props {
    snap: Snapshot;
  }
  let { snap }: Props = $props();

  const rows = $derived(snap.goals);
  const hasAny = $derived(rows.length > 0);

  // Pasek liczony z PLYNNEJ wartosci, gdy cel dotyczy zasobu klikalnego (60 fps, bez skoków).
  // Inne cele — postep z migawki. Zwraca % albo -1 (brak paska).
  function widthOf(goal: GoalView): number {
    if (goal.resourceId && goal.needRaw && goal.needRaw > 0 && smoothFiniteOf(goal.resourceId)) {
      return Math.max(0, Math.min(1, smoothValueOf(goal.resourceId) / goal.needRaw)) * 100;
    }
    return goal.progress >= 0 ? goal.progress * 100 : -1;
  }
</script>

{#if hasAny}
  <section class="goals">
    <div class="section-head"><span class="section-icon"><Compass size={15} strokeWidth={1.8} /></span>Co dalej?</div>
    {#each rows as g (g.horizon)}
      {@const w = widthOf(g)}
      {@const GoalIcon = g.mystery ? null : goalIcon(g.iconKey)}
      <div class="goal">
        <div class="goal-line">
          <span class="goal-horizon">{g.horizon}</span>
          {#if GoalIcon}<span class="goal-icon"><GoalIcon size={14} strokeWidth={1.8} /></span>{/if}
          <span class="goal-label" class:mystery={g.mystery}>{g.label}</span>
          <span class="goal-detail">{g.detail}</span>
        </div>
        {#if w >= 0}
          <div class="goal-bar">
            <div class="goal-bar-fill" style="width:{w}%"></div>
          </div>
        {/if}
      </div>
    {/each}
  </section>
{/if}
