<script lang="ts">
  import Table from './table/Table.svelte';
  import GramTableSelector from './table/GramTableSelector.svelte';
  import Topbar from './common/TopBar.svelte';
  import './index.css';
  import AntibiogramCard from './common/AntibiogramCard.svelte';
  import BottomBar from './common/BottomBar.svelte';
  import AppTitle from './common/AppTitle.svelte';
</script>

<main>
  <!-- <Topbar /> -->
  <!-- <GramTableSelector /> -->
  <AppTitle />
  <AntibiogramCard />
  <!-- <div class="table-window">
    <Table />
  </div> -->
  <BottomBar />
</main>

<style>
  .table-window {
    display: block;
    height: 80vh;
    width: 100%;
    overflow: scroll;
  }
  main {
    position: relative;
    height: 100%;
    width: 100%;
  }
</style>
