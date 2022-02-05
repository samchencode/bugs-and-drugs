<script lang="ts">
  import { getContext } from 'svelte';
  import type TableController from '@/infrastructure/view/controllers/TableController';
  import TableRow from './TableRow.svelte';
  import ColumnHeader from './ColumnHeader.svelte';
  import NoTable from './NoTable.svelte';
  import EmptyCorner from './EmptyCorner.svelte';
  import { state } from './tableStore';

  (getContext('tableController') as TableController)
    .showTable(2)
    .then((table) => state.loadTable(table));
</script>

{#if !$state.grid}
  <NoTable />
{:else}
  <table class="antibiogram-table">
    <thead>
      <tr>
        <EmptyCorner />
        {#each $state.columnHeaders as columnHeader, j (columnHeader.id)}
          <ColumnHeader
            {columnHeader}
            toggleHighlight={() => state.toggleHighlightColumn(j)}
          />
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each $state.rowHeaders as rowHeader, i (rowHeader.id)}
        <TableRow
          {rowHeader}
          rowOfCells={$state.grid[i]}
          toggleHighlightCells={(j) => state.toggleHighlightCell(i, j)}
          toggleHighlight={() => state.toggleHighlightRow(i)}
        />
      {/each}
    </tbody>
  </table>
{/if}

<style>
  .antibiogram-table {
    font-size: var(--table-font-size);
    width: auto;
    box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
  }

  .antibiogram-table tbody tr {
    max-height: 52px;
  }
</style>
