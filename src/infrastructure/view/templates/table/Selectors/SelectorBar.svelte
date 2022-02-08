<script lang="ts">
  import CollapseGroups from './CollapseGroups.svelte';
  import ExpandGroups from './ExpandGroups.svelte';
  import GramSelector from '@/infrastructure/view/templates/table/Selectors/GramSelector.svelte';
</script>

<div class="tool-bar-container">
  <div class="bar-positioner tool-bar">
    <ion-icon class="vertically-center clickable" name="chevron-back-outline" />
    <GramSelector />
    <ExpandGroups />
    <CollapseGroups />
    <ion-icon
      class="vertically-center clickable"
      name="chevron-forward-outline"
    />
  </div>
</div>

<style>
  .tool-bar-container {
    width: 100%;
    background-color: var(--main-bg-color);
    position: relative;
    height: 8vh;
    max-height: 60px;
    min-height: 45px;
  }
  .tool-bar {
    position: relative;
    font-size: 20px;
    display: flex;
    justify-content: space-around;
  }
</style>
