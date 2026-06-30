<script lang="ts">
  import { ceremony, treeOpen, treeStartFlow } from '../engine/bridge';

  function proceed(): void {
    ceremony.set(null);
    treeStartFlow.set(true); // drzewo otwarte jako „nowa pięciolatka”
    treeOpen.set(true);
  }
</script>

{#if $ceremony}
  <div class="ceremony-overlay" role="dialog" aria-modal="true">
    <div class="ceremony-glow"></div>
    <div class="ceremony-box">
      <div class="ceremony-title">DENOMINACJA</div>
      <div class="ceremony-sub">Zera lecą w dół. Wartość zostaje.</div>
      <div class="ceremony-gain">+{$ceremony.gained} {$ceremony.unit}</div>
      <button class="ceremony-btn" onclick={proceed}>Otwórz Dziedzictwo</button>
    </div>
  </div>
{/if}
