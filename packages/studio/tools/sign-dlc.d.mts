// Typy dla `sign-dlc.mjs` (samodzielne narzędzie podpisu; rdzeń współdzielony przez test bramki 5.5D).
import type { Pack, SealedPack } from '@kombinat/shared';

export function canonicalJson(value: unknown): string;
export function genKeyJwks(): Promise<{ publicJwk: JsonWebKey; privateJwk: JsonWebKey }>;
export function sealAndSign(content: Pack, privateJwk: JsonWebKey, publicKeyId?: string): Promise<SealedPack>;
export function verifyEnvelope(
  env: SealedPack,
  publicJwk?: JsonWebKey,
): Promise<{ intact: boolean; signed: boolean; officialVerified: boolean }>;
