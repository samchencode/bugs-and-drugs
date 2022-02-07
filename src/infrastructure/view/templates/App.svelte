<script lang="ts">
  import './index.css';
  import Navigation from './navigation/Navigation.svelte';
  import TableViewScreen from './table-view-screen/TableViewScreen.svelte';
  import IndexScreen from './index-screen/IndexScreen.svelte';
</script>

<main>
  <Navigation />
  <!-- <TableViewScreen /> -->
  <IndexScreen />
</main>

<style>
  main {
    position: relative;
    height: 100%;
    width: 100%;
    display: flex;
    flex-direction: column;
  }
</style>
