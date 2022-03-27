<script lang="ts">
  import Cell from './Cell.svelte';
  import RowHeader from './RowHeader.svelte';
  export let rowOfCells: any;
  export let rowHeader: any;
  export let highlightCells: (j: number) => void;
  export let unhighlightCells: (j: number) => void;
  export let highlight: () => void;
  export let unhighlight: () => void;
</script>

<tr>
  <RowHeader
    {rowHeader}
    on:focus={() => highlight()}
    on:mouseover={() => highlight()}
    on:blur={() => unhighlight()}
    on:mouseout={() => unhighlight()}
  />
  {#each rowOfCells as cell, j (cell.id)}
    <Cell
      {cell}
      on:focus={() => highlightCells(j)}
      on:mouseover={() => highlightCells(j)}
      on:blur={() => unhighlightCells(j)}
      on:mouseout={() => unhighlightCells(j)}
    />
  {/each}
</tr>
