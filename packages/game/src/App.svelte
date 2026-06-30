<script lang="ts">
  import { onMount } from 'svelte';
  import { initEngine, snapshot, toast, minigraOpen, zalatwianieOpen, gieldaOpen, dyplomacjaOpen, manualSave, offlineReport } from './engine/bridge';
  import { startSmooth } from './engine/smooth.svelte';
  import { settings } from './engine/settings.svelte';
  import { ensureAudio, applyVolumes } from './engine/audio';
  import Gauge from '@lucide/svelte/icons/gauge';
  import TopBar from './ui/TopBar.svelte';
  import ClickArea from './ui/ClickArea.svelte';
  import GoalsPanel from './ui/GoalsPanel.svelte';
  import PrestigePanel from './ui/PrestigePanel.svelte';
  import UpgradesPanel from './ui/UpgradesPanel.svelte';
  import GeneratorList from './ui/GeneratorList.svelte';
  import ResourceBar from './ui/ResourceBar.svelte';
  import LegacyTree from './ui/LegacyTree.svelte';
  import Leksykon from './ui/Leksykon.svelte';
  import AchievementsWindow from './ui/AchievementsWindow.svelte';
  import Kadra from './ui/Kadra.svelte';
  import Gielda from './ui/Gielda.svelte';
  import Minigra from './ui/Minigra.svelte';
  import Zalatwianie from './ui/Zalatwianie.svelte';
  import ZjazdPZPR from './ui/ZjazdPZPR.svelte';
  import Dyplomacja from './ui/Dyplomacja.svelte';
  import Statystyki from './ui/Statystyki.svelte';
  import AchievementToast from './ui/AchievementToast.svelte';
  import GoldenCookie from './ui/GoldenCookie.svelte';
  import DziennikWindow from './ui/DziennikWindow.svelte';
  import Settings from './ui/Settings.svelte';
  import Ceremony from './ui/Ceremony.svelte';
  import OfflineModal from './ui/OfflineModal.svelte';
  import NewRunSplash from './ui/NewRunSplash.svelte';
  import EventModal from './ui/EventModal.svelte';

  let booting = $state(true);

  // Ctrl+S (lub Cmd+S) = ręczny zapis, zamiast okna „zapisz stronę" przeglądarki.
  function onKeydown(e: KeyboardEvent): void {
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      manualSave();
    }
  }

  onMount(() => {
    initEngine();
    startSmooth();
    // dzwiek startuje dopiero po gescie (polityka autoplay); resume na kazdy gest
    const onGesture = (): void => ensureAudio();
    window.addEventListener('pointerdown', onGesture);

    if (!settings().animations) booting = false;
    else setTimeout(() => (booting = false), 1700);

    return () => window.removeEventListener('pointerdown', onGesture);
  });

  // Klasy/atrybuty na <body> sterujace stylem / zywym UI / animacjami / CRT (wszystko przelaczalne).
  $effect(() => {
    const cfg = settings();
    const body = document.body;
    body.dataset.theme = cfg.theme; // wybrany styl (podmienia zmienne CSS)
    body.classList.toggle('anim-on', cfg.animations);
    body.classList.toggle('live-ui', cfg.liveUI && cfg.animations);
    body.classList.toggle('crt-on', cfg.crt);
    body.style.setProperty('--crt', String(cfg.crtIntensity));
  });

  // Dolny pasek walut zostaje OSTRY (bez blur/dim) podczas okien, w których robi się zakupy —
  // minigra (uwaga #4), a także Załatwianie i Kantor: gracz musi widzieć, ile ma kasy.
  $effect(() => {
    document.body.classList.toggle('keep-bar', $minigraOpen || $zalatwianieOpen || $gieldaOpen || $dyplomacjaOpen);
  });

  // Aktualizuj głośność, gdy ustawienia się zmienią.
  $effect(() => {
    const cfg = settings();
    void cfg.master;
    void cfg.music;
    void cfg.sfx;
    void cfg.mute;
    applyVolumes();
  });
</script>

<svelte:window onkeydown={onKeydown} />

<div class="shell">
  <TopBar />
  <main class="play">
    {#if $snapshot}
      <div class="col col-left col-special">
        <div class="section-head"><span class="section-icon"><Gauge size={15} strokeWidth={1.8} /></span>Pulpit</div>
        <ClickArea snap={$snapshot} />
        <GoalsPanel snap={$snapshot} />
        <PrestigePanel snap={$snapshot} />
      </div>
      <div class="col col-mid">
        <UpgradesPanel snap={$snapshot} />
      </div>
      <div class="col col-right">
        <GeneratorList snap={$snapshot} />
      </div>
    {:else}
      <p class="boot">Wczytywanie kombinatu…</p>
    {/if}
  </main>
  <ResourceBar />
</div>

{#if $toast && !$offlineReport}
  <div class="toast" role="status">{$toast}</div>
{/if}

<AchievementToast />
<DziennikWindow />
<GoldenCookie />

<LegacyTree />
<Leksykon />
<AchievementsWindow />
<Kadra />
<Gielda />
<Minigra />
<Zalatwianie />
<ZjazdPZPR />
<Dyplomacja />
<Statystyki />
<Settings />
<Ceremony />
<OfflineModal />
<NewRunSplash />
<EventModal />

{#if booting}
  <div class="boot-splash">
    <div class="boot-line">KOMBINAT — JEDNOSTKA OBLICZENIOWA</div>
    <div class="boot-line dim">ŁADOWANIE SYSTEMU…</div>
    <div class="boot-line ok">[ OK ]</div>
  </div>
{/if}

<div class="crt-overlay" aria-hidden="true"></div>
