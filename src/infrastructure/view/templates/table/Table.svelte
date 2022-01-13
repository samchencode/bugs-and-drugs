<script lang="ts">
  import { getContext } from 'svelte';
  import type TableController from '@/infrastructure/view/controllers/TableController';
  import { createPublicKey } from 'crypto';

  const tableController: TableController = getContext('tableController');
  let table: Awaited<ReturnType<TableController['showTable']>> | undefined;
  tableController.showTable(1).then((t) => (table = t));

  function highlightCells(event, row, column) {
    let highlightColor = getComputedStyle(
      document.documentElement
    ).getPropertyValue('--main-on-surface-emphasis-color');
    if (row != undefined) {
      let rowClassName = 'row' + row.toString();
      highlightAllOfClass(rowClassName, highlightColor);
    }
    if (column != undefined) {
      let columnClassName = 'column' + column.toString();
      highlightAllOfClass(columnClassName, highlightColor);
    }
  }
  function unhighlightCells(event, row, column) {
    console.log(row, column);

    let backgroundColor = getComputedStyle(
      document.documentElement
    ).getPropertyValue('--main-bg-color');
    if (row != undefined) {
      let rowClassName = 'row' + row.toString();
      highlightAllOfClass(rowClassName, backgroundColor);
    }
    if (column != undefined) {
      let columnClassName = 'column' + column.toString();
      highlightAllOfClass(columnClassName, backgroundColor);
    }
  }
  function highlightAllOfClass(className, color) {
    var elementsInRow = document.getElementsByClassName(className);
    for (var i = 0; i < elementsInRow.length; i++) {
      elementsInRow[i].style.backgroundColor = color;
    }
  }
</script>

<div id="container">
  {#if !table}
    <div>Sorry no data yet.</div>
  {:else}
    <table class="antibiogram-table">
      <thead>
        <tr>
          <!-- empty cell -->
          <th class="topLeftBlock" />
          {#each table?.getColumnLabels() ?? [] as columnHeader, j}
            <th
              scope="col"
              class="antibiotic-name column{j}"
              id="ColumnHeader{j}"
              on:focus={(event) => highlightCells(event, undefined, j)}
              on:mouseover={(event) => highlightCells(event, undefined, j)}
              on:blur={(event) => unhighlightCells(event, undefined, j)}
              on:mouseout={(event) => unhighlightCells(event, undefined, j)}
            >
              <span>{columnHeader}</span>
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each table?.getCells() ?? [] as row, i}
          <tr>
            <th
              scope="row"
              class="organism-name row{i}"
              id="RowHeader{i}"
              on:focus={(event) => highlightCells(event, i, undefined)}
              on:mouseover={(event) => highlightCells(event, i, undefined)}
              on:blur={(event) => unhighlightCells(event, i, undefined)}
              on:mouseout={(event) => unhighlightCells(event, i, undefined)}
              >{table?.getRowLabels()[i]}</th
            >
            {#each row ?? [] as cell, j}
              <td
                class="sensitivity-data has-tooltip row{i} column{j}"
                id="{i}+{j}"
                on:focus={(event) => highlightCells(event, i, j)}
                on:mouseover={(event) => highlightCells(event, i, j)}
                on:blur={(event) => unhighlightCells(event, i, j)}
                on:mouseout={(event) => unhighlightCells(event, i, j)}
                >{cell}
                <span class="tooltip-text">tooltip text</span>
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
    font-size: var(--table-font-size);
  }
  .antibiotic-name {
    position: sticky;
    top: 0;
    writing-mode: vertical-rl;
    max-height: var(--table-heading-size);
    text-align: left;
    transform: rotate(180deg);
    z-index: 0;
    background-color: white;
    z-index: 2;
    padding-top: var(--table-padding);
    border-top: 1px solid black;
  }
  .organism-name {
    position: sticky;
    left: 0;
    text-align: left;
    font: bold;
    padding-left: var(--table-padding);
    padding-right: calc(var(--table-padding) / 2);
    background-color: white;
    border-right: 1px solid black;
    max-height: 52px;
    z-index: 2;
  }

  .antibiogram-table td {
    position: relative;
    border-bottom: 1px solid #cccccc;
    border-left: 1px solid #cccccc;
    padding: var(--table-padding);
  }

  .antibiogram-table tbody tr {
    max-height: 52px;
  }
  .sensitivity-data {
    text-align: center;
    padding: var(--table-padding);
  }
  .topLeftBlock {
    position: sticky;
    left: 0;
    top: 0;
    z-index: 3;
    height: 100%;
    width: 100%;
    background-color: white;
    border-bottom: 1px solid black;
    border-right: 1px solid black;
  }
  .antibiogram-table td,
  .antibiogram-table {
    position: relative;
  }
  .has-tooltip {
    position: relative;
  }

  .has-tooltip .tooltip-text {
    left: 100%;
    top: 100%;
    visibility: hidden;
    background-color: black;
    color: #fff;
    text-align: center;
    padding: 5px 0;
    border-radius: 6px;
    position: absolute;
    z-index: 1;
  }

  .has-tooltip:hover .tooltip-text {
    visibility: visible;
  }
</style>
