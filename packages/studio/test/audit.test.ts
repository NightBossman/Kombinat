import { describe, it, expect } from 'vitest';
import { buildAndAudit } from '../tools/audit-bundle.mjs';

// ŻELAZNA REGUŁA (STUDIO §7.3 + §9): „test, którego nie wolno pominąć”.
// Budujemy publiczny bundle Studia i potwierdzamy, że NIE ma w nim klucza prywatnego ani narzędzia podpisu.
describe('5.5D — audyt bundla: klucz prywatny NIGDY we wdrożeniu', () => {
  it('zbudowany dist nie zawiera klucza prywatnego ani narzędzia podpisu; ma klucz publiczny', async () => {
    const r = await buildAndAudit();
    expect(r.fileCount).toBeGreaterThan(0);
    expect(r.privateKeyHits, 'KLUCZ PRYWATNY w bundlu — złamana żelazna reguła!').toEqual([]);
    expect(r.toolLeaks, 'narzędzie podpisu / plik klucza wyciekły do bundla!').toEqual([]);
    expect(r.hasPublicKey, 'brak klucza publicznego — skan nie objął modułu shared').toBe(true);
  }, 120000);
});
