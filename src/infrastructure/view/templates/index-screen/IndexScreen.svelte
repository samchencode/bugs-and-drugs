<script lang="ts">
  import { getContext, onMount } from 'svelte';
  import type AntibiogramGroupController from '@/infrastructure/view/controllers/AntibiogramGroupController';
  import type { WebAntibiogramGroup } from '@/infrastructure/view/presenters/WebAntibiogramGroupPresenter';
  import Card from './Card.svelte';

  const controller = getContext<AntibiogramGroupController>(
    'antibiogramGroupController'
  );
  let vm: WebAntibiogramGroup[] | null = null;

  onMount(async () => {
    vm = await controller.index();
  });
</script>

<main>
  {#if vm === null}
    <p>Sorry no results yet...</p>
  {:else}
    <ul class="list">
      {#each vm as { state, institution, interval }}
        <li>
          <Card
            title={institution + ', ' + state}
            subtitle={interval.toString()}
          />
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
</style>
