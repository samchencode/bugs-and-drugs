<script lang="ts">
  export let rowHeader: any;
  import ToolTip from '@/infrastructure/view/templates/table/Tooltip.svelte';
</script>

<th
  class="organism-name has-tooltip"
  class:active={rowHeader.getActive()}
  class:highlighted={rowHeader.getHighlighted()}
  width="200px"
  on:focus
  on:mouseover
  on:blur
  on:mouseout
>
  {rowHeader.getValue()} (10 isolates)
  <ToolTip tooltip={rowHeader.getTooltip()} />
</th>

<style>
  .organism-name {
    background-color: var(--main-bg-color);
    position: sticky;
    left: 0;
    text-align: left;
    font: bold;
    padding-left: var(--table-padding);
    padding-right: calc(var(--table-padding) / 2);
    border-right: 1px solid black;
    max-height: 52px;
    max-width: 200px;
    z-index: 2;
    background-color: var(--main-bg-color);
  }
  .highlighted {
    background-color: var(--main-on-emphasis-color);
  }
  .active {
    background-color: var(--main-on-active-color);
  }
</style>
