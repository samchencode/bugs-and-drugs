<script lang="ts">
  import TopBar from '../common/TopBar.svelte';
  import GramTableSelector from '../table/GramTableSelector.svelte';
  import Table from '../table/Table.svelte';
</script>

<TopBar />
<GramTableSelector />
<div class="table-window">
  <Table />
</div>

<style>
  .table-window {
    display: block;
    width: 100%;
    overflow: scroll;
    flex: 1;
  }
</style>
