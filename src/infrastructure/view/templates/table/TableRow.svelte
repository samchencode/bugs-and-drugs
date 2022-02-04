<script lang="ts">
  import Cell from './Cell.svelte';
  import RowHeader from './RowHeader.svelte';
  export let rowOfCells: any;
  export let rowHeader: any;
  export let toggleHighlightCells: (j: number) => void;
  export let toggleHighlight: () => void;
</script>

<tr>
  <RowHeader
    {rowHeader}
    on:focus={() => toggleHighlight()}
    on:mouseover={() => toggleHighlight()}
    on:blur={() => toggleHighlight()}
    on:mouseout={() => toggleHighlight()}
  />
  {#each rowOfCells as cell, j (cell.id)}
    <Cell
      {cell}
      on:focus={() => toggleHighlightCells(j)}
      on:mouseover={() => toggleHighlightCells(j)}
      on:blur={() => toggleHighlightCells(j)}
      on:mouseout={() => toggleHighlightCells(j)}
    />
  {/each}
</tr>
