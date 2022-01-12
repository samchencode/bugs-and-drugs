<script lang="ts">
  import Table from './table/Table.svelte';
  import GramTableSelector from './table/GramTableSelector.svelte';
  import Topbar from './common/TopBar.svelte';
  import './index.css';
  import AntibiogramCard from './common/AntibiogramCard.svelte';
</script>

<main>
  <Topbar />
  <GramTableSelector />
  <!-- <AntibiogramCard /> -->
  <div class="table-window">
    <Table />
  </div>
</main>

<style>
  .table-window {
    display: block;
    height: 80vh;
    width: 100%;
    overflow: scroll;
  }
</style>
