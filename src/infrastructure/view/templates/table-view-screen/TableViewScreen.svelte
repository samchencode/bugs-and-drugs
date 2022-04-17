<script lang="ts">
  import { querystring } from 'svelte-spa-router';
  import Antibiogram from '@/infrastructure/view/templates/antibiogram/Antibiogram.svelte';
  export const params: {} = {};

  $: param = new URLSearchParams($querystring).get('ids');
  $: ids = param?.split(',');
</script>

{#if !ids || ids.length === 0}
  <p>No antibiogram selected...</p>
{:else}
  {#each ids as id}
    <Antibiogram {id} />
  {/each}
{/if}
