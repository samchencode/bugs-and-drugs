<script lang="ts">
  import Card from './Card.svelte';

  let places = [
    'UHS 2021-2022',
    'Lourdes 2019-2020',
    'Wilson 2019-2020',
    'BGH 2019-2020',
    'UHS 2021-2022',
    'Lourdes 2019-2020',
    'Wilson 2019-2020',
    'BGH 2019-2020',
  ];
</script>

<main>
  <ul class="list">
    {#each places as place}
      <li>
        <Card title={place} subtitle="subtext" />
      </li>
    {/each}
  </ul>
</main>

<style>
  main {
    margin: var(--space-md);
  }
  .list {
    display: grid;
    gap: var(--space-md);
  }
</style>
