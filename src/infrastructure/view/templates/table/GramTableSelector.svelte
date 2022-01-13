<script lang="ts">
  import Table from './Table.svelte';
</script>

<div class="tool-bar">
  <ion-icon class="center-vertically" name="chevron-back-outline" />
  <button class="gram-selector center-vertically">
    <span>Gram</span> <ion-icon class="center-vertically" name="add-outline" />
  </button>
  <ion-icon class="center-vertically" name="chevron-forward-outline" />
</div>

<style>
  .tool-bar {
    position: relative;
    font-size: 20px;
    background-color: var(--main-bg-color);
    padding-left: 20px;
    height: 8vh;
    max-height: 60px;
    min-height: 45px;
    width: 100%;
    display: flex;
    justify-content: space-around;
  }
  .center-vertically {
    position: relative;
    top: 50%;
    transform: translateY(-50%);
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
