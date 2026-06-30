<script lang="ts">
  import Trophy from '@lucide/svelte/icons/trophy';
  import { achievementsList, achievementsOpen, requestAchievements, snapshot } from '../engine/bridge';
  import { achievementIcon, achievementColor } from './icons';
  import type { AchievementView } from '../engine/snapshot';

  // Laduj liste przy otwarciu; odswiez, gdy przybedzie zdobytych (a okno otwarte).
  let lastEarned = $state(-1);
  $effect(() => {
    if ($achievementsOpen) {
      const earned = $snapshot?.achievements.earned ?? 0;
      if (earned !== lastEarned) {
        lastEarned = earned;
        requestAchievements();
      }
    }
  });

  const groups = $derived.by(() => {
    const map = new Map<string, AchievementView[]>();
    for (const a of $achievementsList ?? []) {
      const arr = map.get(a.category) ?? [];
      arr.push(a);
      map.set(a.category, arr);
    }
    return [...map.entries()];
  });
</script>

{#if $achievementsOpen}
  <div class="modal-overlay" role="dialog" aria-modal="true" aria-label="Osiągnięcia">
    <div class="ach-modal">
      <div class="ach-head">
        <h2 class="win-head"><span class="win-head-icon"><Trophy size={18} strokeWidth={1.8} /></span>Osiągnięcia</h2>
        <span class="ach-count">
          {$snapshot?.achievements.earned ?? 0} / {$snapshot?.achievements.total ?? 0}
        </span>
        <button class="tree-close" aria-label="Zamknij" onclick={() => achievementsOpen.set(false)}>✕</button>
      </div>
      <div class="ach-scroll">
        {#if $achievementsList === null}
          <p class="tree-hint">Wczytywanie…</p>
        {:else}
          {#each groups as [cat, items] (cat)}
            <div class="ach-cat">{cat} — {items.filter((i) => i.earned).length}/{items.length}</div>
            <div class="ach-grid">
              {#each items as a (a.id)}
                {@const hidden = a.secret && !a.earned}
                {@const Icon = achievementIcon(a.category, hidden)}
                <div class="ach-badge {a.earned ? 'earned' : 'locked'}" title={a.description}>
                  <span class="ach-name-row">
                    <span
                      class="ach-badge-icon"
                      style={a.earned ? `color:${achievementColor(a.category)}` : ''}
                    >
                      <Icon size={16} strokeWidth={1.8} />
                    </span>
                    <span class="ach-name">{a.name}</span>
                  </span>
                  <span class="ach-desc">{a.description}</span>
                </div>
              {/each}
            </div>
          {/each}
        {/if}
      </div>
    </div>
  </div>
{/if}
