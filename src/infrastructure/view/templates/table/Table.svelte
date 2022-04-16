<script lang="ts">
  import { getContext } from 'svelte';
  import type TableController from '@/infrastructure/view/controllers/TableController';
  import TableRow from './TableRow.svelte';
  import ColumnHeader from './ColumnHeader.svelte';
  import NoTable from './NoTable.svelte';
  import EmptyCorner from './EmptyCorner.svelte';
  import { state } from './tableStore';

  export let id: string;

  (getContext('tableController') as TableController)
    .showTable(id)
    .then((table) => {
      state.loadTable(table);
      tableSize();
    });
  //smallTable tracks the size of the of the table relative to the viewport to determine formatting.
  let smallTable = true;
  const tableSize = () => {
    const table = document.getElementById('table');
    if (table && window.visualViewport.width < table.offsetWidth) {
      smallTable = false;
    } else smallTable = true;
  };
  window.addEventListener('resize', tableSize);
  tableSize();
</script>

<div class="table-window" class:small-table={smallTable} id="table-container">
  {#if !$state.grid}
    <NoTable />
  {:else}
    <table class="antibiogram-table" id="table">
      <thead>
        <tr>
          <EmptyCorner />
          {#each $state.columnHeaders as columnHeader, j (columnHeader.id)}
            <ColumnHeader
              {columnHeader}
              highlight={() => state.highlightColumn(j)}
              unhighlight={() => state.unhighlightColumn(j)}
            />
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each $state.rowHeaders as rowHeader, i (rowHeader.id)}
          <TableRow
            {rowHeader}
            rowOfCells={$state.grid[i]}
            highlightCells={(j) => state.highlightCell(i, j)}
            unhighlightCells={(j) => state.unhighlightCell(i, j)}
            highlight={() => state.highlightRow(i)}
            unhighlight={() => state.unhighlightRow(i)}
          />
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<style>
  .table-window {
    position: relative;
    /* top: 60px; */
    overflow-x: auto;
    overflow-y: hidden;
    overflow-y: clip;
  }

  .small-table {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .antibiogram-table {
    position: relative;
    font-size: var(--table-font-size);
    /* box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2); */
    border: 1px solid black;
  }

  .antibiogram-table tbody tr {
    max-height: 52px;
  }
</style>
