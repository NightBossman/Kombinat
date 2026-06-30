<script lang="ts">
  import dlcMd from '../../../docs/DLC.md?raw';
  import Stamp from '@lucide/svelte/icons/stamp';
  import CircleCheck from '@lucide/svelte/icons/circle-check';
  import CircleX from '@lucide/svelte/icons/circle-x';
  import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
  import Download from '@lucide/svelte/icons/download';
  import {
    validateWorkingPack,
    convertToCanonical,
    sealEnvelope,
    verifyEnvelope,
    parsePackFromText,
    analyzeConflicts,
    type ValidateResult,
    type VerifyResult,
    type LoadedPack,
    type ConflictReport,
  } from './studio';
  import {
    SCHEMA_VERSION,
    coreIdTables,
    namespaces,
    scalarRefs,
    formulaFunctions,
    effectList,
    SKELETON,
  } from './contract';

  // 4 style graficzne — SPÓJNE Z GRĄ (te same id i nazwy). Wybór zapamiętany w przeglądarce.
  type ThemeId = 'prl' | 'bursztyn' | 'nowoczesny' | 'jasny';
  const THEMES: { id: ThemeId; label: string }[] = [
    { id: 'prl', label: 'Klimatyczny PRL (zielony)' },
    { id: 'bursztyn', label: 'Bursztynowy terminal' },
    { id: 'nowoczesny', label: 'Nowoczesny (czystszy)' },
    { id: 'jasny', label: 'Jasny / dzienny' },
  ];
  const THEME_KEY = 'kombinat-studio-theme';
  function loadTheme(): ThemeId {
    const v = typeof localStorage !== 'undefined' ? localStorage.getItem(THEME_KEY) : null;
    return THEMES.some((t) => t.id === v) ? (v as ThemeId) : 'prl';
  }
  let theme = $state<ThemeId>(loadTheme());
  $effect(() => {
    // Motyw na <html> (:root), NIE na <body> — by zmienne objęły też tło <html> (inaczej pod krótką
    // treścią prześwitywałby domyślny ciemny <html>, np. czarny pas na stylu jasnym).
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* prywatny tryb / brak storage — trudno, styl po prostu nie zostanie zapamiętany */
    }
  });

  let tab = $state<'walidator' | 'sprawdz' | 'konflikty' | 'przewodnik'>('walidator');
  let source = $state('');
  let result = $state<ValidateResult | null>(null);
  let canonical = $state<string | null>(null);
  let envelope = $state<string | null>(null);
  let sealing = $state(false);
  let dragOver = $state(false);
  // zakładka „Sprawdź" — podgląd weryfikacji gotowej koperty
  let verifySrc = $state('');
  let verify = $state<VerifyResult | null>(null);
  let verifyDrag = $state(false);
  // zakładka „Konflikty" — tryb wielu paczek
  let loaded = $state<LoadedPack[]>([]);
  let conflictDrag = $state(false);
  const conflicts = $derived<ConflictReport | null>(
    loaded.filter((l) => l.ok).length >= 2 ? analyzeConflicts(loaded.filter((l) => l.ok).map((l) => l.pack!)) : null,
  );

  const packId = $derived(
    (result?.pack?.manifest?.id as string | undefined) ?? 'paczka',
  );
  const errors = $derived(result?.issues.filter((i) => i.level === 'error') ?? []);
  const warnings = $derived(result?.issues.filter((i) => i.level === 'warning') ?? []);

  function runValidate(): void {
    result = source.trim() ? validateWorkingPack(source) : null;
    canonical = null;
    envelope = null;
  }
  function runConvert(): void {
    if (result?.pack) canonical = convertToCanonical(result.pack);
  }
  async function runSeal(): Promise<void> {
    if (!result?.pack) return;
    sealing = true;
    try {
      envelope = JSON.stringify(await sealEnvelope(result.pack), null, 2);
    } finally {
      sealing = false;
    }
  }
  async function runVerify(): Promise<void> {
    verify = verifySrc.trim() ? await verifyEnvelope(verifySrc) : null;
  }
  async function onDropVerify(e: DragEvent): Promise<void> {
    e.preventDefault();
    verifyDrag = false;
    const f = e.dataTransfer?.files?.[0];
    if (f) {
      verifySrc = await f.text();
      await runVerify();
    }
  }
  async function onDropConflicts(e: DragEvent): Promise<void> {
    e.preventDefault();
    conflictDrag = false;
    const files = [...(e.dataTransfer?.files ?? [])];
    const added: LoadedPack[] = [];
    for (const f of files) added.push(parsePackFromText(await f.text(), f.name));
    loaded = [...loaded, ...added];
  }
  function clearConflicts(): void {
    loaded = [];
  }
  async function onDrop(e: DragEvent): Promise<void> {
    e.preventDefault();
    dragOver = false;
    const f = e.dataTransfer?.files?.[0];
    if (f) {
      source = await f.text();
      runValidate();
    }
  }
  function download(name: string, text: string, type = 'application/json'): void {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function loadSkeleton(): void {
    source = SKELETON;
    result = null;
    canonical = null;
    tab = 'walidator';
  }
</script>

<div class="shell">
  <header class="hdr">
    <span class="hdr-icon"><Stamp size={26} strokeWidth={1.7} /></span>
    <div class="hdr-text">
      <h1>Studio DLC</h1>
      <p>Główny Urząd Standaryzacji DLC — walidacja, konwersja i pieczęć paczek do gry „Kombinat".</p>
    </div>
    <label class="theme-pick" title="Styl graficzny (jak w grze)">
      <span>Styl</span>
      <select bind:value={theme} aria-label="Styl graficzny">
        {#each THEMES as t (t.id)}<option value={t.id}>{t.label}</option>{/each}
      </select>
    </label>
    <span class="hdr-schema">schemat v{SCHEMA_VERSION}</span>
  </header>

  <nav class="tabs">
    <button class:active={tab === 'walidator'} onclick={() => (tab = 'walidator')}>Walidator</button>
    <button class:active={tab === 'sprawdz'} onclick={() => (tab = 'sprawdz')}>Sprawdź paczkę</button>
    <button class:active={tab === 'konflikty'} onclick={() => (tab = 'konflikty')}>Konflikty</button>
    <button class:active={tab === 'przewodnik'} onclick={() => (tab = 'przewodnik')}>Przewodnik</button>
  </nav>

  {#if tab === 'walidator'}
    <section class="panel">
      <p class="lead">
        Wklej albo upuść tu swoją paczkę roboczą (JSONC). Wszystko liczy się u Ciebie w przeglądarce —
        paczka nigdzie nie wychodzi. Błędy pokażemy z numerem linii i podpowiedzią.
      </p>

      <div
        class="drop"
        class:over={dragOver}
        role="textbox"
        tabindex="0"
        aria-label="Upuść plik paczki"
        ondragover={(e) => {
          e.preventDefault();
          dragOver = true;
        }}
        ondragleave={() => (dragOver = false)}
        ondrop={onDrop}
      >
        <textarea
          bind:value={source}
          spellcheck="false"
          placeholder={'Wklej tutaj zawartość pliku .jsonc albo przeciągnij plik…'}
        ></textarea>
      </div>

      <div class="actions">
        <button class="primary" onclick={runValidate} disabled={!source.trim()}>Sprawdź paczkę</button>
        <button onclick={loadSkeleton}>Wczytaj pusty szkielet</button>
        {#if result?.ok}
          <button class="primary" onclick={runConvert}>Konwertuj → kanoniczny JSON</button>
        {/if}
      </div>

      {#if result}
        {#if result.ok}
          <div class="verdict ok">
            <CircleCheck size={18} strokeWidth={2} /> Paczka POPRAWNA — przechodzi walidację schematu.
            {#if warnings.length > 0}<span class="dim"> ({warnings.length} ostrzeżeń poniżej)</span>{/if}
          </div>
        {:else}
          <div class="verdict bad">
            <CircleX size={18} strokeWidth={2} /> {errors.length}
            {errors.length === 1 ? 'błąd' : 'błędów'} do poprawienia.
          </div>
        {/if}

        {#if errors.length > 0}
          <ul class="issues">
            {#each errors as e (e.path ?? '' + e.message)}
              <li class="err">
                {#if e.line != null}<span class="ln">linia {e.line}</span>{/if}
                <span class="msg">{e.message}</span>
                {#if e.path}<span class="pth">{e.path}</span>{/if}
              </li>
            {/each}
          </ul>
        {/if}
        {#if warnings.length > 0}
          <ul class="issues">
            {#each warnings as w (w.path ?? '' + w.message)}
              <li class="warn">
                <TriangleAlert size={13} strokeWidth={2} />
                {#if w.line != null}<span class="ln">linia {w.line}</span>{/if}
                <span class="msg">{w.message}</span>
                {#if w.path}<span class="pth">{w.path}</span>{/if}
              </li>
            {/each}
          </ul>
        {/if}
      {/if}

      {#if canonical}
        <div class="canon">
          <div class="canon-head">
            <span>Kanoniczny JSON (pole <code>content</code> koperty) — deterministyczny, posortowany.</span>
            <button onclick={() => download(`${packId}.content.json`, canonical ?? '')}>
              <Download size={14} strokeWidth={2} /> Pobierz
            </button>
          </div>
          <pre class="code">{canonical}</pre>
          <div class="actions">
            <button class="primary" onclick={runSeal} disabled={sealing}>
              {sealing ? 'Pakuję…' : 'Spakuj kopertę (suma kontrolna)'}
            </button>
          </div>
        </div>
      {/if}

      {#if envelope}
        <div class="canon">
          <div class="canon-head">
            <span>Koperta dystrybucyjna „kombinat-dlc" — z sumą kontrolną SHA-256 (stopień „nienaruszone").</span>
            <button onclick={() => download(`${packId}.kombinat-dlc.json`, envelope ?? '')}>
              <Download size={14} strokeWidth={2} /> Pobierz paczkę
            </button>
          </div>
          <pre class="code">{envelope}</pre>
          <p class="dim small">
            To gotowy, dystrybuowalny plik — w grze załaduje się jako <b>społecznościowa</b>. Pieczęć
            „oficjalna" (podpis) nadaje wyłącznie właściciel, lokalnym narzędziem z kluczem prywatnym
            trzymanym offline (klucz nigdy nie trafia do tej strony).
          </p>
        </div>
      {/if}
    </section>
  {:else if tab === 'sprawdz'}
    <section class="panel">
      <p class="lead">
        Wklej albo upuść <b>gotową kopertę</b> (plik <code>.kombinat-dlc.json</code>). Przeliczę sumę
        kontrolną i — jeśli paczka jest podpisana — sprawdzę pieczęć. Weryfikacja jest publiczna.
      </p>
      <div
        class="drop"
        class:over={verifyDrag}
        role="textbox"
        tabindex="0"
        aria-label="Upuść kopertę"
        ondragover={(e) => {
          e.preventDefault();
          verifyDrag = true;
        }}
        ondragleave={() => (verifyDrag = false)}
        ondrop={onDropVerify}
      >
        <textarea bind:value={verifySrc} spellcheck="false" placeholder={'Wklej tu zawartość koperty .kombinat-dlc.json…'}></textarea>
      </div>
      <div class="actions">
        <button class="primary" onclick={runVerify} disabled={!verifySrc.trim()}>Sprawdź pieczęć</button>
      </div>

      {#if verify}
        {#if !verify.ok}
          <div class="verdict bad"><CircleX size={18} strokeWidth={2} /> {verify.error}</div>
        {:else if verify.trust}
          {@const t = verify.trust}
          <div class="verdict" class:ok={t.tier === 'official' || t.tier === 'intact'} class:bad={t.tier === 'invalid' || t.tier === 'valid'}>
            {#if t.tier === 'official'}<CircleCheck size={18} strokeWidth={2} /> Paczka OFICJALNA — podpis zweryfikowany.
            {:else if t.tier === 'intact'}<CircleCheck size={18} strokeWidth={2} /> Paczka NIENARUSZONA (społecznościowa) — suma kontrolna się zgadza.
            {:else if t.tier === 'valid'}<TriangleAlert size={18} strokeWidth={2} /> Paczka POPRAWNA, ale suma kontrolna NIE pasuje — była ruszana po spakowaniu.
            {:else}<CircleX size={18} strokeWidth={2} /> Paczka NIEPOPRAWNA — nie przechodzi walidacji schematu.{/if}
          </div>
          <ul class="issues">
            <li class="info"><span class="msg">Stopień: <b>{t.label}</b> · integralność: {t.intact ? 'OK' : 'NIE pasuje'} · podpis: {t.signed ? (t.officialVerified ? 'zweryfikowany' : 'obecny, niezweryfikowany') : 'brak'}</span></li>
            {#each t.issues as iss (iss.message)}
              <li class={iss.level === 'error' ? 'err' : 'warn'}><span class="msg">{iss.message}</span></li>
            {/each}
          </ul>
        {/if}
      {/if}
    </section>
  {:else if tab === 'konflikty'}
    <section class="panel">
      <p class="lead">
        Upuść tu <b>kilka paczek</b> naraz (robocze JSONC albo gotowe koperty). Pokażę, gdzie dwie celują w
        ten sam element rdzenia i w jakiej kolejności skumulują się ich efekty — zanim gracz wczyta je w grze.
      </p>
      <div
        class="drop drop-files"
        class:over={conflictDrag}
        role="button"
        tabindex="0"
        aria-label="Upuść paczki"
        ondragover={(e) => {
          e.preventDefault();
          conflictDrag = true;
        }}
        ondragleave={() => (conflictDrag = false)}
        ondrop={onDropConflicts}
      >
        Przeciągnij tutaj pliki paczek (możesz kilka naraz)
      </div>

      {#if loaded.length > 0}
        <div class="actions">
          <button onclick={clearConflicts}>Wyczyść listę</button>
        </div>
        <ul class="issues">
          {#each loaded as l, i (i)}
            <li class={l.ok ? 'info' : 'err'}>
              <span class="msg">{l.name}{l.ok ? ` — ${l.pack?.manifest?.id ?? '?'}` : ` — ${l.error}`}</span>
            </li>
          {/each}
        </ul>
      {/if}

      {#if conflicts}
        <div class="verdict ok">Kolejność scalania: {conflicts.order.join(' → ')}</div>
        {#if conflicts.findings.length === 0}
          <p class="dim">Brak konfliktów — żadne dwie paczki nie celują w ten sam element.</p>
        {:else}
          <ul class="issues">
            {#each conflicts.findings as f, i (i)}
              <li class={f.level === 'error' ? 'err' : 'info'}><span class="msg">{f.message}</span></li>
            {/each}
          </ul>
        {/if}
      {:else if loaded.filter((l) => l.ok).length === 1}
        <p class="dim">Wczytano 1 paczkę — dorzuć kolejną, by porównać.</p>
      {/if}
    </section>
  {:else}
    <section class="panel guide">
      <p class="lead">
        DLC to <b>dane, nie kod</b> — nigdy nie dotykasz kodu gry. Poniżej żywe tabele (generowane wprost
        z silnika, więc zawsze aktualne) oraz pełny przewodnik.
      </p>
      <div class="actions">
        <button class="primary" onclick={loadSkeleton}>Wczytaj pusty szkielet do walidatora</button>
        <button onclick={() => download('DLC.md', dlcMd, 'text/markdown')}>
          <Download size={14} strokeWidth={2} /> Pobierz DLC.md
        </button>
        <button onclick={() => download('szkielet.jsonc', SKELETON, 'application/json')}>
          <Download size={14} strokeWidth={2} /> Pobierz szkielet
        </button>
      </div>

      <h2>Stabilne ID rdzenia</h2>
      <p class="dim small">Na te ID możesz celować efektami. Własne ID prefiksuj swoim <code>manifest.id</code>.</p>
      <div class="tables">
        {#each coreIdTables as t (t.label)}
          <div class="idtab">
            <h3>{t.label}</h3>
            <div class="chips">{#each t.ids as id (id)}<code>{id}</code>{/each}</div>
          </div>
        {/each}
      </div>

      <h2>Przestrzenie nazw w formułach</h2>
      <div class="chips">{#each namespaces as nsp (nsp)}<code>{nsp}</code>{/each}</div>
      <p class="dim small">Pełne ścieżki skalarne:</p>
      <div class="chips">{#each scalarRefs as s (s)}<code>{s}</code>{/each}</div>

      <h2>Funkcje w formułach</h2>
      <div class="chips">{#each formulaFunctions as fn (fn)}<code>{fn}</code>{/each}</div>

      <h2>Słownik efektów</h2>
      <table class="eff">
        <thead><tr><th>type</th><th>działanie</th><th>pola</th></tr></thead>
        <tbody>
          {#each effectList as e (e.type)}
            <tr>
              <td><code>{e.type}</code></td>
              <td>{e.summary}</td>
              <td class="dim">{e.fields.join(', ')}</td>
            </tr>
          {/each}
        </tbody>
      </table>

      <h2>Pełny kontrakt (DLC.md)</h2>
      <pre class="guide-md">{dlcMd}</pre>
    </section>
  {/if}

  <footer class="site-foot">
    <p class="foot-main">
      <b>Studio DLC</b> · część projektu <b>Kombinat</b> — gra incremental w realiach PRL · schemat v{SCHEMA_VERSION}
    </p>
    <p class="foot-sub">
      Walidacja, konwersja i pakowanie odbywają się w 100% lokalnie — Twoja paczka nie opuszcza
      przeglądarki. Działa na tym samym module schematu co gra. © 2026
    </p>
  </footer>
</div>
