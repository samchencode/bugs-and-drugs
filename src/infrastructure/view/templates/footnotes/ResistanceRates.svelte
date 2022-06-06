<script lang="ts">
  import type WebResistanceRate from '@/infrastructure/view/presenters/WebResistanceRate';
  import ResistanceRate from '@/infrastructure/view/templates/footnotes/resistanceRate.svelte';
  export let resistanceRates: WebResistanceRate[];
</script>

<ul>
  {#each resistanceRates as resistanceRate}
    <li>
      <ResistanceRate {resistanceRate} />
    </li>
  {/each}
</ul>
