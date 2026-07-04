<script lang="ts">
  import { newRunSplash, finishNewRun } from '../engine/bridge';

  // Plansza „nowa pięciolatka" to ETAP limbo ('splash'). Gdy się pokaże, po 2 s zgłaszamy KONIEC limbo —
  // silnik wznawia produkcję dokładnie w chwili jej zniknięcia (życzenie: to formalny start rozgrywki).
  // Etap jest trwały: gdy zamkniesz grę w jego trakcie, wróci i odliczy 2 s od nowa (nic się nie gubi).
  $effect(() => {
    if (!$newRunSplash) return;
    const t = setTimeout(finishNewRun, 2000);
    return () => clearTimeout(t);
  });
</script>

{#if $newRunSplash}
  <div class="newrun-splash">
    <div class="newrun-text">▌ NOWA PIĘCIOLATKA</div>
    <div class="newrun-sub">Plan zatwierdzony. Do roboty, towarzyszu.</div>
  </div>
{/if}
