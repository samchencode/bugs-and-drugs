<script lang="ts">
  import { querystring } from 'svelte-spa-router';
  import Table from '../table/Table.svelte';

  export const params: {} = {};

  $: param = new URLSearchParams($querystring).get('ids');
  $: ids = param?.split(',');
</script>

{#if !ids || ids.length === 0}
  <p>No antibiogram selected...</p>
{:else}
  {#each ids as id}
    <Table {id} />
  {/each}
{/if}
