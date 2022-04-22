<script lang="ts">
  import { getContext } from 'svelte';
  import type AntibiogramController from '@/infrastructure/view/controllers/AntibiogramController';
  import type { WebAntibiogram } from '@/infrastructure/view/presenters/WebAntibiogramPresenter';
  import type { WebTable } from '@/infrastructure/view/presenters/WebTablePresenter';
  import Table from '@/infrastructure/view/templates/table/Table.svelte';
  import NoTable from '@/infrastructure/view/templates/table/NoTable.svelte';
  import { compute_rest_props } from 'svelte/internal';

  export let id: string;

  let vm: WebAntibiogram | null;
  let table: WebTable;

  const controller = getContext<AntibiogramController>('antibiogramController');
  controller.show(id).then((abg) => (vm = abg));

  $: vm && ({ table } = vm);
</script>

<section>
  {#if !vm}
    <NoTable />
  {:else}
    <header class="header">
      <h1 class="header-title">{vm.gram}</h1>
    </header>
    <Table {table} />
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
