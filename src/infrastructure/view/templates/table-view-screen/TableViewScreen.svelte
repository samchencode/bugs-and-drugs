<script lang="ts">
  import TopBar from '../common/TopBar.svelte';
  import SelectorBar from '../table/Selectors/SelectorBar.svelte';
  import Table from '../table/Table.svelte';
</script>

<TopBar />
<!-- <SelectorBar /> -->
<div class="table-window">
  <Table />
</div>

<style>
  .table-window {
    padding: 20px;
    display: flex;
    justify-content: center;
    width: 100%;
  }
</style>
