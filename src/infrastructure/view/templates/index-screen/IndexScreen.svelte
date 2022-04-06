<script lang="ts">
  import { getContext, onMount } from 'svelte';
  import { link } from 'svelte-spa-router';
  import type AntibiogramGroupController from '@/infrastructure/view/controllers/AntibiogramGroupController';
  import type { WebAntibiogramGroup } from '@/infrastructure/view/presenters/WebAntibiogramGroupPresenter';
  import Card from './Card.svelte';
  import { GramStain } from '@/domain/Organism/Quality';
  import { antibiogram } from './AntibiogramNavigationStore';
  import type IndexAntibiogramTitleAction from '@/application/IndexAntibiogramTitleAction';
  import type AntibiogramTitleController from '@/infrastructure/view/controllers/AntibiogramTitleController';

  const controller = getContext<AntibiogramTitleController>(
    'antibiogramTitleController'
  );

  let testVm: any = null;
  controller.index().then((res) => (testVm = res));
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
              subtitle={details + ', gram ' + gramStain}
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
