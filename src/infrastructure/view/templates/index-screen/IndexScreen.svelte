<script lang="ts">
  import { getContext, onMount } from 'svelte';
  import { link } from 'svelte-spa-router';
  import type AntibiogramGroupController from '@/infrastructure/view/controllers/AntibiogramGroupController';
  import type { WebAntibiogramGroup } from '@/infrastructure/view/presenters/WebAntibiogramGroupPresenter';
  import Card from './Card.svelte';
  import { GramStain } from '@/domain/Organism/Quality';

  const controller = getContext<AntibiogramGroupController>(
    'antibiogramGroupController'
  );
  let vm: WebAntibiogramGroup[] | null = null;
  let testVm = [
    {
      state: 'Binghamton, NY',
      institution: 'Lourdes',
      interval: 'June 2019-June 2020',
      details: 'inpatient',
      gramStain: 'positive',
      id: 1,
    },
    {
      state: 'Binghamton, NY',
      institution: 'Lourdes',
      interval: 'June 2019-June 2020',
      details: 'inpatient',
      gramStain: 'negative',
      id: 2,
    },
    {
      state: 'Binghamton, NY',
      institution: 'Lourdes',
      interval: 'June 2019-June 2020',
      details: 'outpatient',
      gramStain: 'positive',
      id: 3,
    },
    {
      state: 'Binghamton, NY',
      institution: 'Lourdes',
      interval: 'June 2019-June 2020',
      details: 'outpatient',
      gramStain: 'negative',
      id: 4,
    },
    {
      state: 'Binghamton, NY',
      institution: 'UHS',
      interval: 'January 2020-January 2021',
      details: 'non-urine',
      gramStain: 'negative',
      id: 5,
    },
    {
      state: 'Binghamton, NY',
      institution: 'UHS',
      interval: 'January 2020-January 2021',
      details: 'non-urine',
      gramStain: 'positive',
      id: 6,
    },
    {
      state: 'Binghamton, NY',
      institution: 'UHS',
      interval: 'January 2020-January 2021',
      details: 'urine',
      gramStain: 'unspecified',
      id: 7,
    },
  ];
  onMount(async () => {
    vm = await controller.index();

    console.log(vm);
    console.log(testVm);
  });
</script>

<main>
  {#if testVm === null}
    <p>Sorry no results yet...</p>
  {:else}
    <ul class="list">
      {#each testVm as { state, institution, interval, details, gramStain, id }}
        <li>
          <a class="card-nav" href={'/antibiogram/' + id} use:link>
            <Card
              title={institution + ', ' + state}
              subtitle={details + ', ' + gramStain}
              dates={interval.toString()}
            />
          </a>
        </li>
      {/each}
    </ul>
  {/if}
</main>

<style>
  main {
    margin: var(--space-md);
  }
  .list {
    display: grid;
    gap: var(--space-md);
  }
  .card-nav {
    all: unset;
  }
  .card-nav:hover {
    cursor: pointer;
  }
</style>
