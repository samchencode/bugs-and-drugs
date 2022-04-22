<script lang="ts">
  import type { WebAntibiogram } from '@/infrastructure/view/presenters/WebAntibiogramPresenter';
  import type { WebTable } from '@/infrastructure/view/presenters/WebTablePresenter';
  import Table from '@/infrastructure/view/templates/table/Table.svelte';
  import NoTable from '@/infrastructure/view/templates/table/NoTable.svelte';

  export let vm: WebAntibiogram | null;
</script>

<section>
  {#if !vm}
    <NoTable />
  {:else}
    <header class="header">
      <h1 class="header-title">{vm.gram}</h1>
    </header>
    <Table table={vm.table} />
  {/if}
</section>

<style>
  section {
    box-shadow: var(--bs);
    padding: var(--space-sm);
    margin-bottom: var(--space-lg);
  }

  .header {
    display: flex;
    justify-content: center;
  }

  .header-title {
    font-size: var(--font-lg);
    text-align: center;
  }
</style>
