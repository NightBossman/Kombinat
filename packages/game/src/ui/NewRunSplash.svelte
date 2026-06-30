<script lang="ts">
  import { newRunSplash } from '../engine/bridge';
</script>

{#if $newRunSplash}
  <div class="newrun-splash">
    <div class="newrun-text">▌ NOWA PIĘCIOLATKA</div>
    <div class="newrun-sub">Plan zatwierdzony. Do roboty, towarzyszu.</div>
  </div>
{/if}
