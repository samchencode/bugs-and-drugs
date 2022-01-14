<script lang="ts">
  import Table from './Table.svelte';
</script>

<div class="tool-bar-container">
  <div class="bar-positioner tool-bar">
    <ion-icon class="vertically-center clickable" name="chevron-back-outline" />
    <button class="gram-selector vertically-center">
      <span>Gram</span>
      <ion-icon class="vertically-center" name="add-outline" />
    </button>
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
  .gram-selector {
    font-size: 20px;
    text-align: center;
    background-color: var(--main-light-primary-color);
    height: 40px;
    padding-right: 10px;
    padding-left: 10px;
    border-radius: 25px;
    text-align: center;
    position: relative;
  }
</style>
