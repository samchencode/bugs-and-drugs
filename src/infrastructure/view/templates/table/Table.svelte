<script lang="ts">
  import { getContext } from 'svelte';
  import type TableController from '@/infrastructure/view/controllers/TableController';
  import { createPublicKey } from 'crypto';

  const tableController: TableController = getContext('tableController');
  let table: Awaited<ReturnType<TableController['showTable']>> | undefined;

  tableController.showTable(1).then((t) => {
    table = t;
    let elementsArray = document.getElementsByTagName('TD');
    console.log(elementsArray);
    console.log(table);

    ['onmouseover', ' onmouseout', 'focus'].forEach((evt) =>
      elementsArray.forEach.addEventListener(evt, function (e) {
        console.log(evt);
        console.log(e.target.id);
        let row = e.target.id.charAt(0);
        let column = e.target.id.charAt(2);
        console.log(row + column);
        var all = document.getElementsByClassName(row);
        for (var i = 0; i < all.length; i++) {
          if (evt == 'onmouseout') {
            all[i].style.backgroundcolor = 'none';
          } else {
            all[i].style.backgroundcolor = 'lightgrey';
          }
        }
        var all = document.getElementsByClassName(column);
        for (var i = 0; i < all.length; i++) {
          if (evt == 'onmouseout') {
            all[i].style.backgroundcolor = 'none';
          } else {
            all[i].style.backgroundcolor = 'lightgrey';
          }
        }
      })
    );
  });
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
          {#each table?.getColumnLabels() ?? [] as columnHeader, i}
            <th scope="col" class="antibiotic-name {i}">
              <span>{columnHeader}</span>
            </th>
          {/each}
        </tr>
      </thead>
      <tbody>
        {#each table?.getCells() ?? [] as row, i}
          <tr>
            <th scope="row" class="organism-name {i}"
              >{table?.getRowLabels()[i]}</th
            >
            {#each row ?? [] as cell, j}
              <td class="sensitivity-data tooltip {i} {j}" id="{i}+{j}">
                {cell}
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

  /* .organism-name:hover,
  .antibiotic-name:hover,
  .antibiogram-table tbody td:hover,
  .antibiogram-table tbody tr th:focus,
  .antibiotic-name:focus,
  .antibiogram-table tbody td:focus {
    background-color: var(--main-on-surface-emphasis-color);
  }

  body:not(.nohover) tbody tr:hover {
    background-color: var(--main-on-surface-emphasis-color);
  }
  td:hover::after,
  thead th:not(:empty):hover::after,
  td:focus::after,
  thead th:not(:empty):focus::after {
    background-color: var(--main-on-surface-emphasis-color);
    content: '';
    height: 10000px;
    left: 0;
    position: absolute;
    top: -5000px;
    width: 100%;
    z-index: -1;
  } */
  .antibiogram-table td,
  .antibiogram-table {
    position: relative;
  }

  .tooltip {
    position: relative;
  }

  .tooltip .tooltip-text {
    visibility: hidden;
    background-color: black;
    color: #fff;
    text-align: center;
    padding: 5px 0;
    border-radius: 6px;
    position: absolute;
    z-index: 1;
  }

  .tooltip:hover .tooltip-text {
    visibility: visible;
  }
</style>
