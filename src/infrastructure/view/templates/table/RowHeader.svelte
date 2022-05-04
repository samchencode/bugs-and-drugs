<script lang="ts">
  import type WebRowHeader from '@/infrastructure/view/presenters/WebTablePresenter/WebRowHeader';
  import ToolTip from '@/infrastructure/view/templates/table/Tooltip.svelte';

  export let rowHeader: WebRowHeader;
</script>

<th
  class="row-header has-tooltip"
  class:active={rowHeader.getActive()}
  class:highlighted={rowHeader.getHighlighted()}
  class:warn={rowHeader.hasWarning()}
  width="200px"
  on:focus
  on:mouseover
  on:blur
  on:mouseout
>
  <div class="organism-name" class:bold={rowHeader.isBold()}>
    {rowHeader.getValue()}
  </div>
  <ToolTip tooltip={rowHeader.getTooltip()} />
</th>

<style>
  .row-header {
    position: sticky;
    left: 0;
    text-align: left;
    padding-left: var(--table-padding);
    padding-right: calc(var(--table-padding) / 2);
    min-height: 52px;
    width: min-content;
    max-width: 200px;
    z-index: 1;
    background-color: var(--main-bg-color);
  }

  .row-header::after {
    content: '';
    position: absolute;
    right: 0;
    top: 0;
    width: 0;
    height: 100%;
    border-right: 1px solid var(--main-on-surface-color);
  }

  .organism-name {
    font-size: var(--table-font-size);
    display: inline-block;
    position: relative;
  }

  .bold {
    font-weight: 900;
  }

  .warn {
    background-color: var(--warn-color);
  }

  .highlighted {
    background-color: var(--main-on-emphasis-color);
  }

  .active {
    background-color: var(--main-on-active-color);
    z-index: 2;
  }
</style>
