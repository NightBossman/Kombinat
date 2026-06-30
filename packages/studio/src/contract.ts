// contract.ts — ŻYWE dane kontraktu wyciągnięte z `@kombinat/shared` (STUDIO §8): Hub renderuje z tego
// tabele stabilnych ID, słownik efektów i przestrzenie nazw, więc dokumentacja NIGDY nie rozjedzie się
// z walidatorem. Wersja schematu pokazywana w nagłówku.
import {
  CORE_RESOURCE_IDS,
  CORE_GENERATOR_IDS,
  CORE_COUNTRY_IDS,
  CORE_DOCTRINE_IDS,
  CORE_MECHANIC_IDS,
  FORMULA_NAMESPACES,
  SCALAR_REFS,
  FORMULA_FUNCTIONS,
  EFFECTS,
} from '@kombinat/shared';

// Wersja schematu, pod którą Studio waliduje (zgodna z `manifest.schemaVersion` paczek rdzenia).
export const SCHEMA_VERSION = 1;

export const coreIdTables: { label: string; ids: readonly string[] }[] = [
  { label: 'Zasoby', ids: CORE_RESOURCE_IDS },
  { label: 'Generatory (maszyny)', ids: CORE_GENERATOR_IDS },
  { label: 'Kraje dyplomacji', ids: CORE_COUNTRY_IDS },
  { label: 'Doktryny', ids: CORE_DOCTRINE_IDS },
  { label: 'Mechaniki', ids: CORE_MECHANIC_IDS },
];

export const namespaces: readonly string[] = FORMULA_NAMESPACES;
export const scalarRefs: readonly string[] = SCALAR_REFS;
export const formulaFunctions: readonly string[] = FORMULA_FUNCTIONS;

export const effectList = Object.values(EFFECTS).map((e) => ({
  type: e.type,
  summary: e.summary,
  fields: e.fields,
  targetKinds: e.targetKinds ?? [],
}));

// Pusty szkielet do skopiowania (DLC §13) — najkrótsza droga, by zacząć własną paczkę.
export const SKELETON = `{
  // Manifest — kim jest paczka. \`id\` małe litery/ASCII; własne ID prefiksuj tym id (np. "mojadlc.cos").
  "manifest": {
    "id": "mojadlc",
    "name": "Moja paczka",
    "version": "1.0.0",
    "author": "ja",
    "description": "Krótki opis.",
    "schemaVersion": ${SCHEMA_VERSION},
    "tags": ["dlc"],
    "visualIdentity": { "accentColor": "#b0563a" }
  },

  // Dodaj tylko te sekcje, których używasz. Przykład: nowy generator wpięty w rdzeń.
  "generators": [
    {
      "id": "mojadlc.maszyna",
      "name": "Moja maszyna",
      "flavor": "Opis klimatyczny.",
      "costResource": "cykle",
      "cost": "1000 * 1.15 ^ posiadane",
      "outputResource": "cykle",
      "production": "50",
      "unlock": "posiadane.odra1305 >= 1"
    }
  ],

  // Wzmocnij rdzeń efektem celującym w ORYGINALNE ID (zasada „mnóż rdzeń").
  "upgrades": [
    {
      "id": "mojadlc.ulepszenie",
      "name": "Moje ulepszenie",
      "costResource": "dewizy",
      "cost": "500",
      "unlock": "posiadane.mojadlc.maszyna >= 5",
      "effects": [
        { "type": "multiplyProduction", "target": "generator:mojadlc.maszyna", "value": "2" }
      ]
    }
  ]
}
`;
