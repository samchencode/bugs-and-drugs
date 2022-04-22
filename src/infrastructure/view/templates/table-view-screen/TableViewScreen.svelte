<script lang="ts">
  import { querystring } from 'svelte-spa-router';
  import Antibiogram from '@/infrastructure/view/templates/antibiogram/Antibiogram.svelte';
  export const params: {} = {};

  $: param = new URLSearchParams($querystring).get('ids');
  $: ids = param?.split(',');
</script>

<main>
  {#if !ids || ids.length === 0}
    <p>No antibiogram selected...</p>
  {:else}
    {#each ids as id}
      <Antibiogram {id} />
    {/each}
  {/if}
</main>

<style>
  main {
    margin: var(--space-md);
  }

  @media screen and (min-width: 768px) {
    main {
      display: grid;
      grid-template-columns: 1fr calc(768px - 2 * var(--space-md)) 1fr;
    }
    main :global(*) {
      grid-column: 2 / span 1;
    }
  }

  @media screen and (min-width: 1024px) {
    main {
      grid-template-columns: 1fr calc(1024px - 2 * var(--space-md)) 1fr;
    }
  }

  @media screen and (min-width: 1280px) {
    main {
      grid-template-columns: 1fr calc(1280px - 2 * var(--space-md)) 1fr;
    }
  }
</style>
