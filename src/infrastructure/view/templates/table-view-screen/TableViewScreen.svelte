<script lang="ts">
  import type AntibiogramController from '@/infrastructure/view/controllers/AntibiogramController';
  import Antibiogram from '@/infrastructure/view/templates/antibiogram/Antibiogram.svelte';
  import { getContext } from 'svelte';
  import { querystring } from 'svelte-spa-router';
  export const params: {} = {};

  const controller = getContext<AntibiogramController>('antibiogramController');

  $: param = new URLSearchParams($querystring).get('ids');
  $: ids = param?.split(',');
</script>

<main>
  {#if !ids || ids.length === 0}
    <p>No antibiogram selected...</p>
  {:else}
    {#await controller.showMany(ids)}
      <p>Loading antibiograms</p>
    {:then vms}
      {#each vms as vm}
        <Antibiogram {vm} />
      {/each}
    {/await}
  {/if}
</main>
