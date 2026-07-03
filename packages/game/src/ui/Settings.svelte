<script lang="ts">
  import { settingsOpen, exportSave, importSave } from '../engine/bridge';
  import { settings, setSetting, type Settings } from '../engine/settings.svelte';
  import { applyVolumes } from '../engine/audio';

  const s = $derived(settings());

  // Import zapisu .k7 — ukryty <input type=file>, wyzwalany guzikiem (jak wcześniej w dolnym pasku).
  let fileInput = $state<HTMLInputElement | null>(null);
  function onImportClick(): void {
    fileInput?.click();
  }
  async function onFile(e: Event): Promise<void> {
    const input = e.currentTarget as HTMLInputElement;
    const f = input.files?.[0];
    if (f) await importSave(f);
    input.value = '';
  }

  function toggle(key: keyof Settings, e: Event): void {
    setSetting(key, (e.currentTarget as HTMLInputElement).checked);
  }
  function slide(key: keyof Settings, e: Event, sound = false): void {
    setSetting(key, Number((e.currentTarget as HTMLInputElement).value));
    if (sound) applyVolumes();
  }

  const themes: { id: Settings['theme']; label: string }[] = [
    { id: 'prl', label: 'Klimatyczny PRL (zielony terminal)' },
    { id: 'bursztyn', label: 'Bursztynowy terminal' },
    { id: 'nowoczesny', label: 'Nowoczesny (czystszy)' },
    { id: 'jasny', label: 'Jasny / dzienny' },
  ];
</script>

{#if $settingsOpen}
  <div class="modal-overlay" role="dialog" aria-modal="true" aria-label="Ustawienia">
    <div class="set-modal">
      <div class="set-head">
        <h2>Ustawienia</h2>
        <button class="tree-close" aria-label="Zamknij" onclick={() => settingsOpen.set(false)}>✕</button>
      </div>

      <div class="set-section">Obraz</div>
      <label class="set-row slider">Styl gry
        <select value={s.theme} onchange={(e) => setSetting('theme', (e.currentTarget as HTMLSelectElement).value as Settings['theme'])}>
          {#each themes as t (t.id)}
            <option value={t.id}>{t.label}</option>
          {/each}
        </select>
      </label>
      <label class="set-row"><input type="checkbox" checked={s.liveUI} onchange={(e) => toggle('liveUI', e)} /> Żywy interfejs (drgania, oddychanie, poświaty)</label>
      <label class="set-row"><input type="checkbox" checked={s.animations} onchange={(e) => toggle('animations', e)} /> Animacje i przejścia</label>
      <label class="set-row"><input type="checkbox" checked={s.crt} onchange={(e) => toggle('crt', e)} /> Filtr CRT (nakładka, nie dotyka czytelności)</label>
      {#if s.crt}
        <label class="set-row slider">Intensywność CRT
          <input type="range" min="0" max="1" step="0.05" value={s.crtIntensity} oninput={(e) => slide('crtIntensity', e)} />
        </label>
      {/if}

      <div class="set-section">Dźwięk</div>
      <label class="set-row"><input type="checkbox" checked={s.mute} onchange={(e) => { toggle('mute', e); applyVolumes(); }} /> Wycisz wszystko</label>
      <label class="set-row slider">Głośność główna
        <input type="range" min="0" max="1" step="0.05" value={s.master} oninput={(e) => slide('master', e, true)} />
      </label>
      <label class="set-row slider">Muzyka (ambient)
        <input type="range" min="0" max="1" step="0.05" value={s.music} oninput={(e) => slide('music', e, true)} />
      </label>
      <label class="set-row slider">Efekty (SFX)
        <input type="range" min="0" max="1" step="0.05" value={s.sfx} oninput={(e) => slide('sfx', e, true)} />
      </label>

      <div class="set-section">Inne</div>
      <label class="set-row"><input type="checkbox" checked={s.autosaveNotify} onchange={(e) => toggle('autosaveNotify', e)} /> Powiadomienie o autozapisie</label>
      <label class="set-row"><input type="checkbox" checked={s.okazje} onchange={(e) => toggle('okazje', e)} /> „Okazje" — losowe bonusy do kliknięcia (złote ciastka)</label>
      <label class="set-row"><input type="checkbox" checked={s.cassette3d} onchange={(e) => toggle('cassette3d', e)} /> Grafika 3D w minigrze „Taśma" (Three.js)</label>
      {#if s.cassette3d}
        <label class="set-row"><input type="checkbox" checked={s.tasmaPreload} onchange={(e) => toggle('tasmaPreload', e)} /> Wczytuj grafikę „Taśmy" z góry (płynniejsze pierwsze otwarcie)</label>
      {/if}
      <label class="set-row"><input type="checkbox" checked={s.noChoiceEventModals} onchange={(e) => toggle('noChoiceEventModals', e)} /> Pokazuj okna depesz bez wyboru (samo „przyjąłem")</label>

      <div class="set-section">Zapis</div>
      <p class="set-note">Zapis rozgrywki jako plik <b>.k7</b> — do kopii zapasowej albo przeniesienia na inne urządzenie.</p>
      <div class="set-save">
        <button class="set-save-btn" onclick={exportSave}>Eksport .k7</button>
        <button class="set-save-btn" onclick={onImportClick}>Import .k7</button>
        <input bind:this={fileInput} type="file" accept=".k7" onchange={onFile} hidden />
      </div>
    </div>
  </div>
{/if}

<style>
  .set-note {
    margin: 6px 2px 8px;
    font-size: 12px;
    color: var(--dim);
  }
  .set-save {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    padding: 0 2px 4px;
  }
  .set-save-btn {
    font-family: var(--mono);
    font-size: 13px;
    color: var(--text);
    background: var(--panel-2);
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 8px 14px;
    cursor: pointer;
  }
  .set-save-btn:hover {
    border-color: var(--accent);
  }
</style>
