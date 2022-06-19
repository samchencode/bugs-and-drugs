<script lang="ts">
  import type WebResistanceRate from '@/infrastructure/view/presenters/WebResistanceRate';
  import ResistanceRate from '@/infrastructure/view/templates/footnotes/resistanceRate.svelte';
  export let resistanceRates: WebResistanceRate[];
</script>

<ul class="resistance-rates">
  {#each resistanceRates as resistanceRate}
    <li class="resistance-rates__item">
      <ResistanceRate {resistanceRate} />
    </li>
  {/each}
</ul>

<style>
  .resistance-rates {
    display: flex;
    flex-wrap: wrap;
  }

  .resistance-rates__item {
    margin: 0 var(--space-xs) var(--space-xs) 0;
  }
</style>
