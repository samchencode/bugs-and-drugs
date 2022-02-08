<script lang="ts">
  import TopBar from '../common/TopBar.svelte';
  import SelectorBar from '../table/Selectors/SelectorBar.svelte';
  import Table from '../table/Table.svelte';
</script>

<TopBar />
<SelectorBar />
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
