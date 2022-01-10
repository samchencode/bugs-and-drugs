<script lang="ts">
  import { getContext } from 'svelte';
  import type TableController from '@/infrastructure/view/controllers/TableController';

  const tableController: TableController = getContext('tableController');
  let table: Awaited<ReturnType<TableController['showTable']>> | undefined;

  tableController.showTable(1).then((t) => (table = t));
</script>

<div class="container">
  {#if !table}
    <div>Sorry no data yet.</div>
  {:else}
    <table class="antibiogram-table">
      <thead>
        <tr>
          <!-- empty cell -->
          <th />
          {#each table?.getColumnLabels() ?? [] as columnHeader}
            <th scope="col" class="antibiotic-name">
              {columnHeader}
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each table?.getCells() ?? [] as row, i}
          <tr>
            <th scope="row" class="organism-name">
              {table?.getRowLabels()[i]}
            </th>
            {#each row ?? [] as cell}
              <td class="sensitivity-data">
                {cell}
              </td>
            {/each}
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<style>
  .antibiogram-table {
    border-collapse: collapse;
    margin: 25px;
    font-size: 0.9em;
  }
  .antibiotic-name {
    position: sticky;
    top: 0;
    writing-mode: vertical-rl;
    max-height: 100px;
    text-align: left;
    transform: rotate(180deg);
    z-index: 0;
  }
  .organism-name {
    position: sticky;
    left: 0;
    text-align: left;
    font: bold;
    padding: 16px;
  }

  .antibiogram-table td {
    position: relative;
  }

  .antibiogram-table tbody tr {
    border-bottom: 2px solid #cccccc;
    height: 52px;
  }
  .sensitivity-data {
    text-align: center;
    padding: 16px;
  }

  .organism-name:hover,
  .antibiotic-name:hover,
  .antibiogram-table tbody td:hover,
  .antibiogram-table tbody tr th:focus,
  .antibiotic-name:focus,
  .antibiogram-table tbody td:focus {
    background-color: lightgrey;
  }

  body tbody tr:hover,
  body tbody tr:focus {
    background-color: #ffa;
  }
  td:hover::after,
  .antibiotic-name:hover::after,
  td:focus::after,
  .antibiotic-name:focus::after {
    background-color: #ffa;
    content: '';
    height: 10000px;
    left: 0;
    position: absolute;
    top: -5000px;
    width: 100%;
    z-index: -1;
    opacity: 50%;
  }

  @media screen and (min-width: 800px) {
  }

  @media screen and (min-width: 1200px) {
  }
</style>
