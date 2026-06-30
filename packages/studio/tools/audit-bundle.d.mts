// Typy dla `audit-bundle.mjs` (audyt bezpieczeństwa bundla — bramka ŻELAZNEJ REGUŁY §7.3).
export interface AuditReport {
  fileCount: number;
  /** Pliki bundla, w których wykryto PRYWATNY klucz EC (powinno być puste). */
  privateKeyHits: string[];
  /** Pliki świadczące o wycieku narzędzia podpisu / pliku klucza (powinno być puste). */
  toolLeaks: string[];
  /** Czy w bundlu jest wbudowany klucz PUBLICZNY (kontrola pozytywna — ma być true). */
  hasPublicKey: boolean;
}
export function scanDir(dir: string): AuditReport;
export function buildAndAudit(): Promise<AuditReport>;
