<script lang="ts">
  import type { WebAntibiogram } from '@/infrastructure/view/presenters/WebAntibiogramPresenter';
  import Table from '@/infrastructure/view/templates/table/Table.svelte';
  import NoTable from '@/infrastructure/view/templates/table/NoTable.svelte';
  import Footnotes from '@/infrastructure/view/templates/footnotes/Footnotes.svelte';
  import ResistanceRates from '@/infrastructure/view/templates/footnotes/ResistanceRates.svelte';

  export let vm: WebAntibiogram | null;
</script>

<section>
  {#if !vm}
    <NoTable />
  {:else}
    <header class="header">
      <h1 class="header-title">{vm.info}</h1>
      <ul>
        <li>{vm.publishedAt} {'\u2212'} {vm.expiresAt}</li>
      </ul>
    </header>
    <Table table={vm.table} />
    <Footnotes footnotes={vm.footnotes} />
    <!-- <ResistanceRates resistanceRates={vm.resistanceRates} /> -->
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
    flex-direction: column;
    align-items: flex-start;
    padding-bottom: var(--space-md);
  }

  .header-title {
    font-size: var(--font-lg);
  }
</style>
