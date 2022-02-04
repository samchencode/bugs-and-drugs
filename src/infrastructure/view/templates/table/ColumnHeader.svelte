<script lang="ts">
  export let columnHeader: any;
  import ToolTip from '@/infrastructure/view/templates/table/Tooltip.svelte';
  export let toggleHighlight: () => void;
</script>

<th
  scope="col"
  class="antibiotic-name has-tooltip"
  class:active={columnHeader.getActive()}
  class:highlighted={columnHeader.getHighlighted()}
  on:focus={() => toggleHighlight()}
  on:mouseover={() => toggleHighlight()}
  on:blur={() => toggleHighlight()}
  on:mouseout={() => toggleHighlight()}
>
  <span>{columnHeader.getValue()}</span>
  <ToolTip tooltip={columnHeader.getTooltip()} />
</th>

<style>
  .antibiotic-name {
    position: sticky;
    top: 0;
    writing-mode: vertical-rl;
    max-height: var(--table-heading-size);
    text-align: left;
    transform: rotate(180deg);
    z-index: 0;
    z-index: 2;
    padding-top: var(--table-padding);
    border-top: 1px solid black;
    background-color: var(--main-bg-color);
  }
  .highlighted {
    background-color: var(--main-on-emphasis-color);
  }
  .active {
    background-color: var(--main-on-active-color);
  }
</style>
