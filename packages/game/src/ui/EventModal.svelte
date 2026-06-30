<script lang="ts">
  import { chooseEvent, snapshot } from '../engine/bridge';
  import { settings } from '../engine/settings.svelte';
  import { eventIcon } from './icons';

  const ev = $derived($snapshot?.activeEvent ?? null);
  const Icon = $derived(ev ? eventIcon(ev.id) : null);
  // „Bez wyboru" = co najwyżej jedna opcja (samo przyjęcie). Gdy gracz wyłączył ich pokazywanie,
  // rozstrzygamy je automatycznie (efekt i tak się stosuje + trafiają do Dziennika), bez okna.
  const noChoice = $derived(ev ? ev.options.length <= 1 : false);
  const show = $derived(!!ev && (!noChoice || settings().noChoiceEventModals));

  let lastAuto = '';
  $effect(() => {
    if (!ev) {
      lastAuto = '';
      return;
    }
    if (noChoice && !settings().noChoiceEventModals && lastAuto !== ev.id) {
      lastAuto = ev.id;
      chooseEvent(0);
    }
  });
</script>

{#if show && ev}
  <div class="modal-overlay" role="dialog" aria-modal="true" aria-label="Zdarzenie">
    <div class="event-modal">
      <div class="event-badge">DEPESZA</div>
      <h2 class="event-title">
        {#if Icon}<span class="event-icon"><Icon size={22} strokeWidth={1.8} /></span>{/if}
        {ev.title}
      </h2>
      <p class="event-body">{ev.body}</p>
      <div class="event-options">
        {#if ev.options.length > 0}
          {#each ev.options as label, i (i)}
            <button class="event-opt" onclick={() => chooseEvent(i)}>{label}</button>
          {/each}
        {:else}
          <button class="event-opt" onclick={() => chooseEvent(0)}>Przyjąłem do wiadomości</button>
        {/if}
      </div>
    </div>
  </div>
{/if}
