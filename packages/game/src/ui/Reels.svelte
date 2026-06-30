<script lang="ts">
  // Scena 3D (Threlte/Three.js, uwaga #20) — dwie obracające się szpule kasety magnetofonowej.
  // Komponent musi być dzieckiem <Canvas> (kontekst Threlte). Kręci się szybciej przy wczytywaniu.
  import { T, useTask } from '@threlte/core';

  let { spinning = false }: { spinning?: boolean } = $props();

  let rot = $state(0);
  useTask((delta) => {
    rot += (spinning ? 7 : 1.4) * delta;
  });

  const reels = [-0.95, 0.95];
  const spokes = [0, 1, 2];
</script>

<T.PerspectiveCamera makeDefault position={[0, 0, 5.2]} fov={42} />
<T.AmbientLight intensity={0.75} />
<T.DirectionalLight position={[3, 4, 5]} intensity={1.1} />

<!-- obudowa kasety -->
<T.Mesh position={[0, 0, -0.4]}>
  <T.BoxGeometry args={[3.4, 2.1, 0.3]} />
  <T.MeshStandardMaterial color="#1a1305" roughness={0.85} />
</T.Mesh>

<!-- dwie szpule: tarcza + szprychy w grupie, która się obraca -->
{#each reels as cx (cx)}
  <T.Group position={[cx, 0, 0]} rotation.z={rot}>
    <T.Mesh rotation.x={Math.PI / 2}>
      <T.CylinderGeometry args={[0.6, 0.6, 0.32, 30]} />
      <T.MeshStandardMaterial color="#e0a93a" metalness={0.35} roughness={0.5} />
    </T.Mesh>
    {#each spokes as s (s)}
      <T.Mesh rotation.z={(s * Math.PI) / 1.5}>
        <T.BoxGeometry args={[1.05, 0.14, 0.36]} />
        <T.MeshStandardMaterial color="#231a08" roughness={0.7} />
      </T.Mesh>
    {/each}
  </T.Group>
{/each}
