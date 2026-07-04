<script lang="ts">
  import { ceremony, proceedFromCeremony } from '../engine/bridge';
</script>

{#if $ceremony}
  <div class="ceremony-overlay" role="dialog" aria-modal="true">
    <div class="ceremony-glow"></div>
    <div class="ceremony-box">
      <div class="ceremony-title">DENOMINACJA</div>
      <div class="ceremony-sub">Zera lecą w dół. Wartość zostaje.</div>
      <div class="ceremony-gain">+{$ceremony.gained} {$ceremony.unit}</div>
      <div class="ceremony-note">Stara pięciolatka zamknięta. Nowa jeszcze nie ruszyła — najpierw rozdaj dziedzictwo.</div>
      <button class="ceremony-btn" onclick={proceedFromCeremony}>Otwórz Dziedzictwo ▶</button>
    </div>
  </div>
{/if}
