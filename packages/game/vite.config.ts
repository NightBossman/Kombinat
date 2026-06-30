import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'node:url';

// Alias do wspoldzielonego modulu wskazuje wprost na zrodlo TS — Vite kompiluje go razem z gra,
// dzieki czemu zmiany w `shared` lapie hot-reload (single source of truth bez kroku budowania).
const sharedSrc = fileURLToPath(new URL('../shared/src/index.ts', import.meta.url));

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      '@kombinat/shared': sharedSrc,
    },
  },
  worker: {
    format: 'es',
  },
  server: {
    port: 5173,
    strictPort: true,
    fs: {
      // pozwol Vite czytac pliki z monorepo (packages/shared)
      allow: ['..', '../..'],
    },
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
});
