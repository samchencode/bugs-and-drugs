<script lang="ts">
  import TableRow from './TableRow.svelte';
  import ColumnHeader from './ColumnHeader.svelte';
  import EmptyCorner from './EmptyCorner.svelte';
  import type { WebTable } from '@/infrastructure/view/presenters/WebTablePresenter';

  export let table: WebTable;

  let ourTable = table;

  const s =
    (fn: (...args: any[]) => unknown) =>
    (...args: any[]) => {
      const res = fn(...args);
      ourTable = ourTable;
      return res;
    };

  $: tableSize();

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
  <table class="antibiogram-table" id="table">
    <thead>
      <tr>
        <EmptyCorner />
        {#each ourTable.columnHeaders as columnHeader, j (columnHeader.id)}
          <ColumnHeader
            {columnHeader}
            highlight={s(() => ourTable.highlightColumn(j))}
            unhighlight={s(() => ourTable.unhighlightColumn(j))}
          />
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each ourTable.rowHeaders as rowHeader, i (rowHeader.id)}
        <TableRow
          {rowHeader}
          rowOfCells={ourTable.grid[i]}
          highlightCells={s((j) => ourTable.highlightCell(i, j))}
          unhighlightCells={s((j) => ourTable.unhighlightCell(i, j))}
          highlight={s(() => ourTable.highlightRow(i))}
          unhighlight={s(() => ourTable.unhighlightRow(i))}
        />
      {/each}
    </tbody>
  </table>
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
