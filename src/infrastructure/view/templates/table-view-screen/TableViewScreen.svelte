<script lang="ts">
  import TopBar from '../common/TopBar.svelte';
  import SelectorBar from '../table/Selectors/SelectorBar.svelte';
  import Table from '../table/Table.svelte';
  export let params: { id?: number } = {};
  $: console.log('rendered!' + params.id);
</script>

<Table id={params.id ?? 0} />
