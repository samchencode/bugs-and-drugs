<script lang="ts">
  import Table from './Table.svelte';
</script>

<div class="gram-positives">
  <div class="gram-positive-selector">
    <span class="centerVertically">Gram Positive</span>
  </div>
  <div class="gram-positive-table">
    <Table />
  </div>
  <div class="triangle" />
</div>

<style>
  .gram-positives {
    position: relative;
    left: 0px;
  }
  .gram-positive-selector {
    position: relative;
    font-size: 24px;
    background-color: lightgray;
    padding-left: 20px;
    height: 60px;
    width: 100%;
  }
  .centerVertically {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
  }
  .triangle {
    display: inline-block;
    width: 0;
    height: 0;
    border-top: 25px solid transparent;
    border-left: 50px solid #555;
    border-bottom: 25px solid transparent;
  }
</style>
