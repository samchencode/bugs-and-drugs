<script lang="ts">
  import { beforeUpdate, afterUpdate } from 'svelte';
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
</script>

<div class="table-container">
  <table class="antibiogram-table" rules="none">
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
  .table-container {
    position: relative;
    overflow-x: auto;
    overflow-y: hidden;
    overflow-y: clip;
    border: 1px solid black;
  }

  .antibiogram-table {
    position: relative;
    font-size: var(--table-font-size);
    margin: auto;
  }

  .antibiogram-table tbody tr {
    max-height: 52px;
  }
</style>
