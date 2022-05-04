<script lang="ts">
  export let cell: any;
  import ToolTip from '@/infrastructure/view/templates/table/Tooltip.svelte';
</script>

<td
  class="sensitivity-data has-tooltip"
  class:active={cell.getActive()}
  class:highlighted={cell.getHighlighted()}
  on:focus
  on:mouseover
  on:blur
  on:mouseout
>
  {cell.getValue()}
  <ToolTip tooltip={cell.getTooltip()} />
</td>

<style>
  .sensitivity-data {
    text-align: center;
    position: relative;
    border-bottom: 1px solid #cccccc;
    border-left: 1px solid #cccccc;
    padding: var(--table-padding);
    min-width: 52px;
  }

  .sensitivity-data:first-of-type {
    border-left: 0;
  }

  .highlighted {
    background-color: var(--main-on-emphasis-color);
  }
  .active {
    background-color: var(--main-on-active-color);
  }
</style>
