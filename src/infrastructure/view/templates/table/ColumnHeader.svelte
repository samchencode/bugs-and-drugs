<script lang="ts">
  export let columnHeader: any;
  import ToolTip from '@/infrastructure/view/templates/table/Tooltip.svelte';
  export let toggleHighlight: () => void;
</script>

<th
  scope="col"
  class="column-header has-tooltip"
  class:active={columnHeader.getActive()}
  class:highlighted={columnHeader.getHighlighted()}
  on:focus={() => toggleHighlight()}
  on:mouseover={() => toggleHighlight()}
  on:blur={() => toggleHighlight()}
  on:mouseout={() => toggleHighlight()}
>
  <span class="antibiotic-name">{columnHeader.getValue()}</span>
  <ToolTip tooltip={columnHeader.getTooltip()} />
</th>

<style>
  .column-header {
    position: sticky;
    top: 0;
    max-height: var(--table-heading-size);
    z-index: 1;
    padding-top: var(--table-padding);
    border-bottom: 1px solid black;
    background-color: var(--main-bg-color);
    vertical-align: bottom;
  }

  .antibiotic-name {
    writing-mode: vertical-rl;
    text-align: left;
    transform: rotate(180deg);
  }

  .highlighted {
    background-color: var(--main-on-emphasis-color);
  }

  .active {
    background-color: var(--main-on-active-color);
    z-index: 2;
  }
</style>
