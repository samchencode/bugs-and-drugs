<script lang="ts">
  import type AntibiogramController from '@/infrastructure/view/controllers/AntibiogramController';
  import Antibiogram from '@/infrastructure/view/templates/antibiogram/Antibiogram.svelte';
  import { getContext } from 'svelte';
  import { querystring } from 'svelte-spa-router';
  export const params: {} = {};

  function getAntibiograms(ids: string[]) {
    const c = getContext<AntibiogramController>('antibiogramController');
    return ids.map((id) => c.show(id));
  }

  $: param = new URLSearchParams($querystring).get('ids');
  $: ids = param?.split(',');
  $: abgs = ids && Promise.all(getAntibiograms(ids));
</script>

<main>
  {#if !ids || (ids.length === 0 && abgs)}
    <p>No antibiogram selected...</p>
  {:else}
    {#await abgs}
      <p>Loading antibiograms</p>
    {:then vms}
      {#if vms}
        {#each vms as vm}
          <Antibiogram {vm} />
        {/each}
      {/if}
    {/await}
  {/if}
</main>

<style>
</style>
