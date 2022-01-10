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
              <div class="verticle-header">
                <span>{columnHeader}</span>
              </div>
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each table?.getCells() ?? [] as row, i}
          <tr>
            <th scope="row" class="organism-name">{table?.getRowLabels()[i]}</th
            >
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
    overflow: hidden;
  }
  .antibiotic-name {
    position: relative;
    height: 100px;
  }
  .verticle-header {
    left: 40px;
    bottom: 10px;
    height: 40px;
    width: 100px;
    text-align: left;
    transform: rotate(-90deg);
    transform-origin: left bottom;
    display: inline-block;
    position: absolute;
  }
  .organism-name {
    text-align: left;
    font: bold;
    margin-right: 2px;
  }
  .antibiogram-table tbody tr {
    border-bottom: 2px solid #cccccc;
  }
  .sensitivity-data {
    text-align: center;
    padding-left: 2px;
    padding-right: 2px;
  }

  .antibiogram-table tbody tr :hover,
  .antibiogram-table thead th :hover {
    background-color: lightgrey;
  }

  .antibiogram-table td,
  .antibiogram-table th {
    position: relative;
  }

  body:not(.nohover) tbody tr:hover {
    background-color: #ffa;
  }
  td:hover::after,
  thead th:not(:empty):hover::after,
  td:focus::after,
  thead th:not(:empty):focus::after {
    background-color: #ffa;
    content: '';
    height: 10000px;
    left: 0;
    position: absolute;
    top: -5000px;
    width: 100%;
    z-index: -1;
  }

  @media screen and (min-width: 800px) {
  }

  @media screen and (min-width: 1200px) {
  }
</style>
