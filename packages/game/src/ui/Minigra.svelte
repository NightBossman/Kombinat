<script lang="ts">
  import { onDestroy } from 'svelte';
  import { minigraOpen, minigameReward } from '../engine/bridge';
  import { playSfx } from '../engine/audio';
  import { settings, setSetting, type TasmaLevel } from '../engine/settings.svelte';

  // Scena 3D (Three.js/Threlte, uwaga #20) ładowana LENIWIE — Three.js trafia do osobnego chunku,
  // pobieranego dopiero przy pierwszym otwarciu minigry, więc nie obciąża startu gry.
  const cassette = $derived(settings().cassette3d ? import('./Cassette3D.svelte') : null);

  // Minigra „Wczytywanie z taśmy": marker przelatuje tam i z powrotem, gracz zatrzymuje go
  // jak najbliżej strefy SYNC. Im celniej, tym lepsza jakość wczytania → większa nagroda.
  // Poziom trudności (uwaga #5): wyższy = szybszy marker + węższa strefa, ale większa nagroda.
  type Phase = 'idle' | 'running' | 'cooldown';

  const LEVELS: Record<
    TasmaLevel,
    { label: string; speedMin: number; speedRange: number; band: number; mult: number }
  > = {
    niski: { label: 'Niski', speedMin: 0.5, speedRange: 0.3, band: 16, mult: 0.5 },
    sredni: { label: 'Średni', speedMin: 0.8, speedRange: 0.6, band: 12, mult: 1 },
    wysoki: { label: 'Wysoki', speedMin: 1.4, speedRange: 0.7, band: 9, mult: 2 },
    bardzo: { label: 'Bardzo wysoki', speedMin: 2.0, speedRange: 1.0, band: 7, mult: 4 },
  };
  const order: TasmaLevel[] = ['niski', 'sredni', 'wysoki', 'bardzo'];

  const level = $derived(settings().tasmaLevel); // zapamiętywany w ustawieniach
  const lvl = $derived(LEVELS[level]);
  const band = $derived(lvl.band);

  let phase = $state<Phase>('idle');
  let marker = $state(50); // 0..100
  let target = $state(50); // środek strefy SYNC
  let lastQuality = $state(0);
  let cooldownLeft = $state(0);

  const COOLDOWN_SEC = 3;
  let dir = 1;
  let speed = 0.9; // jednostek na klatkę (~16 ms)
  let raf = 0;
  let cdTimer: ReturnType<typeof setInterval> | null = null;
  let cdEnd = 0; // znacznik czasu (ms) końca przewijania — cooldown liczymy OD NIEGO, nie zliczając

  // Sprzątanie timerów — jedno źródło prawdy, by nic nie wyciekło (zabezpiecza przed zapętleniem
  // odliczania, które gracz zaobserwował raz). cancelRaf + clearCd wołamy przed każdym nowym startem.
  function clearCd(): void {
    if (cdTimer) {
      clearInterval(cdTimer);
      cdTimer = null;
    }
  }
  function cancelRaf(): void {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }

  function tick(): void {
    marker += dir * speed;
    if (marker >= 100) {
      marker = 100;
      dir = -1;
    } else if (marker <= 0) {
      marker = 0;
      dir = 1;
    }
    raf = phase === 'running' ? requestAnimationFrame(tick) : 0;
  }

  function start(): void {
    if (phase === 'running' || phase === 'cooldown') return;
    cancelRaf(); // defensywnie — żadnej zaległej pętli animacji
    clearCd();
    target = 18 + Math.random() * 64; // strefa w bezpiecznym zakresie
    marker = 0;
    dir = 1;
    speed = lvl.speedMin + Math.random() * lvl.speedRange;
    phase = 'running';
    playSfx('click');
    raf = requestAnimationFrame(tick);
  }

  function stop(): void {
    if (phase !== 'running') return;
    cancelRaf();
    const dist = Math.abs(marker - target);
    const quality = Math.max(0, 1 - dist / (band * 2.2));
    lastQuality = quality;
    if (quality > 0) {
      minigameReward(quality, lvl.mult);
      playSfx(quality > 0.66 ? 'achievement' : 'buy');
    } else {
      playSfx('event');
    }
    // Krótki cooldown (by nie dało się spamować idealnie). Liczony OD znacznika czasu końca, więc nawet
    // gdyby timer kiedyś zdublował się lub zwolnił, odliczanie jest SAMONAPRAWIALNE i zawsze dobiega 0.
    clearCd();
    cdEnd = Date.now() + COOLDOWN_SEC * 1000;
    cooldownLeft = COOLDOWN_SEC;
    phase = 'cooldown';
    cdTimer = setInterval(() => {
      const left = Math.ceil((cdEnd - Date.now()) / 1000);
      if (left <= 0) {
        clearCd();
        cooldownLeft = 0;
        phase = 'idle';
      } else {
        cooldownLeft = left;
      }
    }, 200);
  }

  function qualityLabel(q: number): string {
    if (q >= 0.85) return 'Wczytano czysto!';
    if (q >= 0.5) return 'Wczytano z trzaskami.';
    if (q > 0) return 'Ledwo, ledwo…';
    return 'Chybienie! Taśma się zacięła — spróbuj znów.';
  }

  function close(): void {
    cancelRaf();
    clearCd();
    phase = 'idle';
    minigraOpen.set(false);
  }

  // Klawiatura (uwaga gracza): spacja = Wczytaj/Stop, strzałki ←/→ = zmiana poziomu trudności.
  function onKey(e: KeyboardEvent): void {
    if (!$minigraOpen) return;
    if (e.code === 'Space') {
      e.preventDefault();
      if (phase === 'running') stop();
      else if (phase === 'idle') start();
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      if (phase === 'running') return; // poziomu nie zmieniamy w trakcie wczytywania
      e.preventDefault();
      const i = order.indexOf(level);
      const ni = e.key === 'ArrowRight' ? Math.min(order.length - 1, i + 1) : Math.max(0, i - 1);
      setSetting('tasmaLevel', order[ni]!);
    }
  }

  onDestroy(() => {
    cancelRaf();
    clearCd();
  });
</script>

<svelte:window onkeydown={onKey} />

{#if $minigraOpen}
  <div class="modal-overlay" role="dialog" aria-modal="true" aria-label="Minigra: wczytywanie z taśmy">
    <div class="mg-modal">
      <div class="mg-head">
        <h2>Wczytywanie z taśmy</h2>
        <button class="tree-close" aria-label="Zamknij" onclick={close}>✕</button>
      </div>
      <p class="tree-hint">Zatrzymaj głowicę jak najbliżej strefy SYNC. Celne wczytanie = garść cykli na rozruch. Magnetofon nie wybacza. <span class="mg-keys">Klawisze: <b>spacja</b> = Wczytaj/Stop, <b>←/→</b> = poziom.</span></p>

      {#if cassette}
        {#await cassette then M}
          <M.default spinning={phase === 'running'} />
        {/await}
      {/if}

      <div class="mg-levels" role="group" aria-label="Poziom trudności">
        {#each order as lv (lv)}
          <button
            class="mg-level"
            class:active={level === lv}
            disabled={phase === 'running'}
            onclick={() => setSetting('tasmaLevel', lv)}
            title={`Nagroda ×${LEVELS[lv].mult}`}
          >
            {LEVELS[lv].label}
            <span class="mg-level-mult">×{LEVELS[lv].mult}</span>
          </button>
        {/each}
      </div>

      <div class="mg-bar">
        <div class="mg-band" style="left: {target - band}%; width: {band * 2}%;"></div>
        <div class="mg-target" style="left: {target}%;"></div>
        <div class="mg-marker" style="left: {marker}%;" class:run={phase === 'running'}></div>
      </div>

      <div class="mg-status">
        {#if phase === 'cooldown'}
          <span class="mg-msg" class:good={lastQuality >= 0.5} class:bad={lastQuality === 0}>
            {qualityLabel(lastQuality)}
          </span>
        {:else if phase === 'running'}
          <span class="mg-msg">Naciśnij STOP w strefie SYNC!</span>
        {:else}
          <span class="mg-msg dim">Gotowy do wczytania.</span>
        {/if}
      </div>

      <div class="mg-actions">
        {#if phase === 'running'}
          <button class="mg-go stop" onclick={stop}>STOP</button>
        {:else if phase === 'cooldown'}
          <button class="mg-go" disabled>Przewijanie… {cooldownLeft}s</button>
        {:else}
          <button class="mg-go" onclick={start}>Wczytaj taśmę</button>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  .mg-modal {
    width: 100%;
    max-width: 520px;
    display: flex;
    flex-direction: column;
    background: var(--panel);
    border: 1px solid var(--border);
    border-top: 3px solid #4a86c0;
    border-radius: 6px;
    padding: 14px 16px;
    box-shadow: 0 8px 28px var(--shadow);
  }
  .mg-head {
    display: flex;
    align-items: center;
    gap: 12px;
  }
  .mg-head h2 {
    margin: 0;
    font-size: 18px;
    color: var(--accent-strong);
    flex: 1;
  }
  .mg-keys {
    display: inline-block;
    margin-left: 4px;
    color: var(--dim);
    font-size: 12px;
  }
  .mg-keys b {
    color: var(--text);
  }
  .mg-levels {
    display: flex;
    gap: 6px;
    margin-top: 10px;
  }
  .mg-level {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1px;
    padding: 6px 4px;
    font-family: var(--mono);
    font-size: 12px;
    color: var(--dim);
    background: var(--panel-2);
    border: 1px solid var(--border);
    border-radius: 4px;
    cursor: pointer;
  }
  .mg-level:hover:not(:disabled) {
    border-color: #4a86c0;
  }
  .mg-level.active {
    color: var(--text);
    border-color: #4a86c0;
    background: color-mix(in srgb, #4a86c0 18%, transparent);
  }
  .mg-level:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  .mg-level-mult {
    font-size: 10px;
    color: #4a86c0;
    font-weight: 700;
  }
  .mg-bar {
    position: relative;
    height: 46px;
    margin: 16px 0 10px;
    background: repeating-linear-gradient(
      90deg,
      var(--panel-2),
      var(--panel-2) 6px,
      var(--panel) 6px,
      var(--panel) 12px
    );
    border: 1px solid var(--border);
    border-radius: 4px;
    overflow: hidden;
  }
  .mg-band {
    position: absolute;
    top: 0;
    bottom: 0;
    background: rgba(74, 134, 192, 0.22);
    border-left: 1px dashed #4a86c0;
    border-right: 1px dashed #4a86c0;
  }
  .mg-target {
    position: absolute;
    top: 0;
    bottom: 0;
    width: 2px;
    background: #4a86c0;
    transform: translateX(-1px);
  }
  .mg-marker {
    position: absolute;
    top: -2px;
    bottom: -2px;
    width: 4px;
    background: #e8c14a;
    box-shadow: 0 0 6px #e8c14a;
    transform: translateX(-2px);
  }
  .mg-status {
    min-height: 22px;
    text-align: center;
  }
  .mg-msg {
    font-size: 14px;
    font-weight: 600;
    color: var(--text);
  }
  .mg-msg.dim {
    color: var(--dim);
    font-weight: 400;
  }
  .mg-msg.good {
    color: #5fa86a;
  }
  .mg-msg.bad {
    color: #c0564a;
  }
  .mg-actions {
    margin-top: 12px;
    display: flex;
    justify-content: center;
  }
  .mg-go {
    min-width: 200px;
    padding: 11px 18px;
    border: 1px solid var(--accent-strong);
    background: var(--accent);
    color: #fff;
    border-radius: 5px;
    font-weight: 800;
    font-size: 15px;
    letter-spacing: 0.04em;
    cursor: pointer;
  }
  .mg-go.stop {
    background: #c0564a;
    border-color: #c0564a;
  }
  .mg-go:hover:not(:disabled) {
    filter: brightness(1.08);
  }
  .mg-go:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
