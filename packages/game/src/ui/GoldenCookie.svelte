<script lang="ts">
  // „Okazje" — odpowiednik złotych ciastek z Cookie Clickera w klimacie PRL (uwaga #21).
  // Co jakiś czas pojawia się klikalna paczka; złap ją szybko, by dostać losowy bonus:
  // rzut towaru (×7 produkcji), czyn społeczny (×777 klik), spod lady (cykle od ręki) lub
  // pechową kontrolę (×0,5). Pokazuje też pasek aktywnych bonusów i komunikat po złapaniu.
  import { onDestroy } from 'svelte';
  import Gift from '@lucide/svelte/icons/gift';
  import { snapshot, clickOkazja, okazjaFlash, overlayOpen, offlineReport } from '../engine/bridge';
  import { settings } from '../engine/settings.svelte';

  let cookie = $state<{ x: number; y: number } | null>(null);
  let spawnTimer: ReturnType<typeof setTimeout> | null = null;
  let despawnTimer: ReturnType<typeof setTimeout> | null = null;

  // „Zajęty": trwa event albo otwarte jakieś blokujące okno → okazje się nie pojawiają (uwaga),
  // a jeśli jakaś wisi, znika, by nie majaczyła nad oknem eventu i nie marnowała czasu na buff.
  const blocked = $derived(!!$snapshot?.activeEvent || $overlayOpen);
  const active = $derived(($snapshot?.okazjeUnlocked ?? false) && settings().okazje && !blocked);

  $effect(() => {
    if (blocked && cookie) {
      cookie = null;
      if (despawnTimer) clearTimeout(despawnTimer);
      despawnTimer = null;
    }
  });

  function scheduleSpawn(): void {
    if (spawnTimer) clearTimeout(spawnTimer);
    spawnTimer = setTimeout(spawn, 75000 + Math.random() * 105000); // co 75–180 s
  }
  function spawn(): void {
    spawnTimer = null;
    if (!active) {
      scheduleSpawn();
      return;
    }
    cookie = { x: 8 + Math.random() * 82, y: 16 + Math.random() * 64 }; // pozycja w % ekranu
    if (despawnTimer) clearTimeout(despawnTimer);
    despawnTimer = setTimeout(() => {
      cookie = null;
      scheduleSpawn();
    }, 13000); // znika po 13 s
  }
  function grab(): void {
    if (despawnTimer) clearTimeout(despawnTimer);
    despawnTimer = null;
    cookie = null;
    clickOkazja();
    scheduleSpawn();
  }

  // Uruchom planowanie, gdy okazje stają się aktywne.
  $effect(() => {
    if (active && !spawnTimer && !cookie) scheduleSpawn();
  });

  onDestroy(() => {
    if (spawnTimer) clearTimeout(spawnTimer);
    if (despawnTimer) clearTimeout(despawnTimer);
  });
</script>

{#if $snapshot?.buffs && $snapshot.buffs.length > 0 && !$offlineReport}
  <div class="buff-bar" aria-live="polite">
    {#each $snapshot.buffs as b (b.id)}
      <span class="buff" class:bad={b.label.startsWith('Kontrola')}>{b.label} · {b.secondsLeft}s</span>
    {/each}
  </div>
{/if}

{#if cookie}
  <button
    class="okazja"
    style="left:{cookie.x}vw; top:{cookie.y}vh"
    title="Okazja! Łap, póki jest"
    aria-label="Okazja — kliknij"
    onclick={grab}
  >
    <Gift size={30} strokeWidth={1.9} />
  </button>
{/if}

{#if $okazjaFlash && !$offlineReport}
  <div class="okazja-flash" class:bad={$okazjaFlash.kind === 'kontrola'}>
    <span class="okazja-flash-title">{$okazjaFlash.title}</span>
    <span class="okazja-flash-detail">{$okazjaFlash.detail}</span>
  </div>
{/if}

<style>
  .buff-bar {
    position: fixed;
    top: 54px;
    left: 12px;
    z-index: 65;
    display: flex;
    flex-direction: column;
    gap: 4px;
    pointer-events: none;
  }
  .buff {
    font-size: 12px;
    font-weight: 700;
    color: var(--bg);
    background: var(--accent-strong);
    border-radius: 999px;
    padding: 3px 10px;
    box-shadow: 0 2px 8px var(--shadow);
    font-variant-numeric: tabular-nums;
  }
  .buff.bad {
    background: var(--danger);
    color: #fff;
  }
  .okazja {
    position: fixed;
    z-index: 75;
    width: 54px;
    height: 54px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #2a1c04;
    background: radial-gradient(circle at 35% 30%, #ffe28a, #e0a93a 70%, #b9821f);
    border: 2px solid #fff3c4;
    border-radius: 50%;
    cursor: pointer;
    box-shadow:
      0 0 18px 4px rgba(231, 197, 100, 0.7),
      0 4px 12px var(--shadow);
    animation: okazjaPulse 1s ease-in-out infinite;
  }
  .okazja:hover {
    filter: brightness(1.08);
  }
  @keyframes okazjaPulse {
    0%,
    100% {
      transform: scale(1);
    }
    50% {
      transform: scale(1.12);
    }
  }
  .okazja-flash {
    position: fixed;
    top: 96px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 76;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 3px;
    padding: 12px 26px;
    /* delikatny złoty poblask tła — „coś wartościowego" */
    background: linear-gradient(180deg, color-mix(in srgb, #e7c564 12%, var(--panel)), var(--panel));
    border: 1px solid #e7c564;
    border-left: 4px solid #e7c564;
    border-right: 4px solid #e7c564; /* symetrycznie po obu stronach (uwaga gracza) */
    border-radius: 8px;
    box-shadow:
      0 6px 22px var(--shadow),
      0 0 26px 2px rgba(231, 197, 100, 0.5);
    pointer-events: none;
    animation:
      flashIn 0.4s ease,
      valuableGlow 1.5s ease-in-out infinite;
  }
  .okazja-flash.bad {
    background: var(--panel);
    border-color: var(--danger);
    border-left-color: var(--danger);
    border-right-color: var(--danger);
    box-shadow: 0 6px 22px var(--shadow);
    animation: flashIn 0.4s ease;
  }
  .okazja-flash-title {
    font-weight: 800;
    font-size: 17px;
    letter-spacing: 0.01em;
    color: #f0d684;
    text-shadow: 0 0 12px rgba(231, 197, 100, 0.5);
  }
  .okazja-flash.bad .okazja-flash-title {
    color: var(--danger);
    font-size: 16px;
    text-shadow: none;
  }
  .okazja-flash-detail {
    font-size: 13px;
    color: var(--text);
  }
  @keyframes valuableGlow {
    0%,
    100% {
      box-shadow:
        0 6px 22px var(--shadow),
        0 0 22px 2px rgba(231, 197, 100, 0.4);
    }
    50% {
      box-shadow:
        0 6px 22px var(--shadow),
        0 0 34px 5px rgba(231, 197, 100, 0.7);
    }
  }
  @keyframes flashIn {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
</style>
