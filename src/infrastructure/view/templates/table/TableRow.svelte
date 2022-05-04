<script lang="ts">
  import type WebRowHeader from '@/infrastructure/view/presenters/WebTablePresenter/WebRowHeader';
  import type WebTableElement from '@/infrastructure/view/presenters/WebTablePresenter/WebTableElement';

  import Cell from './Cell.svelte';
  import RowHeader from './RowHeader.svelte';

  export let rowOfCells: WebTableElement[];
  export let rowHeader: WebRowHeader;
  export let highlightCells: (j: number) => void;
  export let unhighlightCells: (j: number) => void;
  export let highlight: () => void;
  export let unhighlight: () => void;
</script>

<tr class:warn={rowHeader.hasWarning()}>
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

<style>
  .warn {
    background-color: var(--warn-color);
  }
</style>
