<script lang="ts">
  import Table from './Table.svelte';
</script>

<details open class="gram-table-selector">
  <summary>Gram Positive/ Negative </summary>
  <div class="table-window">
    <Table />
  </div>
</details>

<style>
  .gram-table-selector summary {
    position: relative;
    font-size: 24px;
    background-color: lightgray;
    padding-left: 20px;
    height: 60px;
  }
  .table-window {
    display: block;
    height: 300px;
    width: 100%;
    overflow: scroll;
  }
</style>
