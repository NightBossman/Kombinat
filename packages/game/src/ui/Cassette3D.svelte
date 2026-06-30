<script lang="ts">
  // Opakowanie sceny 3D (Threlte) — tworzy kontekst <Canvas> (WebGL). Ładowane LENIWIE z Minigry,
  // żeby Three.js nie obciążał głównego bundla (uwaga #20).
  import { Canvas } from '@threlte/core';
  import Reels from './Reels.svelte';

  let { spinning = false }: { spinning?: boolean } = $props();
</script>

<div class="cassette3d">
  <Canvas>
    <Reels {spinning} />
  </Canvas>
</div>

<style>
  .cassette3d {
    width: 100%;
    height: 130px;
    border: 1px solid var(--border);
    border-radius: 6px;
    overflow: hidden;
    background: radial-gradient(circle at 50% 40%, #241a0a, #0d0a04);
  }
</style>
