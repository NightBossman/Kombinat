import { defineConfig } from 'vitest/config';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'node:url';

// JEDNO ŹRÓDŁO PRAWDY (STUDIO §8): Studio waliduje tym SAMYM modułem co gra — alias wskazuje wprost na
// źródło `@kombinat/shared` (schemat, rejestr ID, słownik efektów, parser formuł, kanonikalizacja, podpis).
const sharedSrc = fileURLToPath(new URL('../shared/src/index.ts', import.meta.url));

export default defineConfig({
  plugins: [svelte()],
  resolve: {
    alias: {
      '@kombinat/shared': sharedSrc,
    },
  },
  server: {
    port: 5174, // inny niż gra (5173) — Studio to osobna strona
    strictPort: true,
    // pozwól czytać `docs/DLC.md` (renderowany przewodnik — by nigdy nie rozjechał się z kontraktem)
    fs: { allow: ['..', '../..'] },
  },
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
});
