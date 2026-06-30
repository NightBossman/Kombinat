// storage.ts — Zywy autozapis (PLAN 4.1). Trzymamy ten sam zaszyfrowany blob co `.k7`, zakodowany
// base64 w localStorage. localStorage jest synchroniczny — niezawodny przy zamykaniu/minimalizacji.
// (Faza 6 moze przeniesc do IndexedDB dla wiekszych save'ow.)
const KEY = 'kombinat.autosave.v1';

function bytesToB64(bytes: Uint8Array): string {
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

function b64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function saveAutosave(bytes: Uint8Array): void {
  try {
    localStorage.setItem(KEY, bytesToB64(bytes));
  } catch {
    /* brak miejsca / tryb prywatny — autozapis best-effort */
  }
}

export function loadAutosave(): Uint8Array | null {
  try {
    const s = localStorage.getItem(KEY);
    return s ? b64ToBytes(s) : null;
  } catch {
    return null;
  }
}

export function clearAutosave(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignoruj */
  }
}
