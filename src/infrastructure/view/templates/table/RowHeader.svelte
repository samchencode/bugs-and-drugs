<script lang="ts">
  export let rowHeader: any;
  import { NoIntersectingGroupRanges } from '@/domain/Table/Validator';
  import ToolTip from '@/infrastructure/view/templates/table/Tooltip.svelte';
  import { state } from './tableStore';
</script>

<th
  class="row-header has-tooltip"
  class:active={rowHeader.getActive()}
  class:highlighted={rowHeader.getHighlighted()}
  width="200px"
  on:focus
  on:mouseover
  on:blur
  on:mouseout
>
  <div
    class="organism-name"
    class:indented={rowHeader.inGroup() === true &&
      rowHeader.isFirstOfGroup() === false}
  >
    {rowHeader.getValue()}
  </div>

  {#if rowHeader.inGroup() === true}
    {#if rowHeader.isFirstOfGroup() === true}
      <div class="groupIcon">
        {#if rowHeader.isCollapsed() === true}
          <ion-icon
            name="chevron-forward-outline"
            class="clickable horizontally-center"
            on:click={() => state.expandGroup(rowHeader.getGroup())}
          />
        {:else if rowHeader.isCollapsed() === false}
          <ion-icon
            name="chevron-down-outline"
            class="clickable horizontally-center"
            on:click={() => {
              state.collapseGroup(rowHeader.getGroup());
              console.log('collapsed');
            }}
          />
        {/if}
      </div>
    {/if}
  {/if}
  <ToolTip tooltip={rowHeader.getTooltip()} />
</th>

<style>
  .row-header {
    position: sticky;
    left: 0;
    text-align: left;
    padding-left: var(--table-padding);
    padding-right: calc(var(--table-padding) / 2);
    border-right: 1px solid black;
    max-height: 52px;
    width: min-content;
    max-width: 400px;
    z-index: 1;
    background-color: var(--main-bg-color);
  }

  .organism-name {
    font-weight: bold;
    display: inline-block;
    position: relative;
  }

  .highlighted {
    background-color: var(--main-on-emphasis-color);
  }
  .active {
    background-color: var(--main-on-active-color);
    z-index: 2;
  }
  .indented {
    position: relative;
    text-indent: 50px;
  }
  .groupIcon {
    position: relative;
    display: inline-block;
    width: 50px;
  }
</style>
