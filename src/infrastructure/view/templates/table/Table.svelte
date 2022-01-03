<script lang="ts">
  import { getContext } from 'svelte';
  import type TableController from '@/infrastructure/view/controllers/TableController';

  const tableController: TableController = getContext('tableController');
  let table: Awaited<ReturnType<TableController['showTable']>> | undefined;

  tableController.showTable(0).then((t) => (table = t));
</script>

<div class="container">
  {#if !table}
    <div>Sorry no data yet.</div>
  {:else}
    <table>
      <tr>
        <th />
        <!-- empty cell -->
        {#each table?.getColumnLabels() ?? [] as columnHeader}
          <th scope="col">{columnHeader}</th>
        {/each}
      </tr>
      {#each table?.getData() ?? [] as row, i}
        <tr>
          <th scope="row">{table?.getRowLabels()[i]}</th>
          {#each row ?? [] as cell}
            <td>
              {cell}
            </td>
          {/each}
        </tr>
      {/each}
    </table>
  {/if}
</div>

<style>
  .container {
    width: 360px;
    border: 1px solid red;
  }

  @media screen and (min-width: 800px) {
  }

  @media screen and (min-width: 1200px) {
  }
</style>
