<script lang="ts">
  import { getContext } from 'svelte';
  import type AntibiogramController from '@/infrastructure/view/controllers/AntibiogramController';
  import TableRow from './TableRow.svelte';
  import ColumnHeader from './ColumnHeader.svelte';
  import NoTable from './NoTable.svelte';
  import EmptyCorner from './EmptyCorner.svelte';
  import type WebTable from '@/infrastructure/view/presenters/WebTablePresenter/WebTable';

  export let id: string;

  let vm: WebTable | null;

  const s =
    (fn: (...args: any[]) => unknown) =>
    (...args: any[]) => {
      const res = fn(...args);
      vm = vm;
      return res;
    };

  const controller = getContext<AntibiogramController>('antibiogramController');
  controller.show(id).then((table) => (vm = table));

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
  {#if !vm}
    <NoTable />
  {:else}
    <table class="antibiogram-table" id="table">
      <thead>
        <tr>
          <EmptyCorner />
          {#each vm.columnHeaders as columnHeader, j (columnHeader.id)}
            <ColumnHeader
              {columnHeader}
              highlight={s(() => vm?.highlightColumn(j))}
              unhighlight={s(() => vm?.unhighlightColumn(j))}
            />
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each vm.rowHeaders as rowHeader, i (rowHeader.id)}
          <TableRow
            {rowHeader}
            rowOfCells={vm.grid[i]}
            highlightCells={s((j) => vm?.highlightCell(i, j))}
            unhighlightCells={s((j) => vm?.unhighlightCell(i, j))}
            highlight={s(() => vm?.highlightRow(i))}
            unhighlight={s(() => vm?.unhighlightRow(i))}
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
