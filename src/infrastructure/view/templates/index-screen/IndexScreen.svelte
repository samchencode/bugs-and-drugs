<script lang="ts">
  import { getContext } from 'svelte';
  import { link } from 'svelte-spa-router';
  import type AntibiogramGroupController from '@/infrastructure/view/controllers/AntibiogramGroupController';
  import type { WebAntibiogramGroup } from '@/infrastructure/view/presenters/WebAntibiogramGroupPresenter';
  import Card from '@/infrastructure/view/templates/index-screen/Card.svelte';
  import List from '@/infrastructure/view/templates/index-screen/List.svelte';
  import ListItem from '@/infrastructure/view/templates/index-screen/ListItem.svelte';

  const groupController = getContext<AntibiogramGroupController>(
    'antibiogramGroupController'
  );

  let vm: WebAntibiogramGroup[] = [];
  groupController.index().then((res) => res !== null && (vm = res));
</script>

<main>
  {#if vm.length === 0}
    <p>No results yet...</p>
  {:else}
    <ul class="institution-list">
      {#each vm as { place, intervals }}
        <li class="institution-card">
          <Card
            title={place.split(' \u2212 ').shift() ?? ''}
            subtitle={place.split(' \u2212 ').pop() ?? ''}
          >
            <List>
              {#each intervals as { interval, groups }}
                {#each groups as { title, antibiograms }}
                  <a
                    href={'/antibiogram?ids=' +
                      antibiograms.map((a) => a.id).join(',')}
                    class="link"
                    use:link
                  >
                    <ListItem {title} subtitle={interval} />
                  </a>
                {/each}
              {/each}
            </List>
          </Card>
        </li>
      {/each}
    </ul>
  {/if}
</main>

<style>
  .link {
    color: inherit;
    text-decoration: inherit;
  }

  .link:hover,
  .link:focus {
    background-color: var(--main-surface-emphasis-color);
  }

  @media screen and (min-width: 768px) {
    .institution-list {
      --gap: var(--space-md);
      --columns: 2;
      display: grid;
      grid-template-columns: repeat(
        auto-fill,
        calc((730px - (var(--columns) - 1) * var(--gap)) / var(--columns))
      );
      gap: var(--gap);
    }
  }

  @media screen and (min-width: 1024px) {
    .institution-list {
      --gap: var(--space-md);
      --columns: 3;
      display: grid;
      grid-template-columns: repeat(
        auto-fill,
        calc((990px - (var(--columns) - 1) * var(--gap)) / var(--columns))
      );
      gap: var(--gap);
    }
  }

  @media screen and (min-width: 1280px) {
    .institution-list {
      --gap: var(--space-md);
      --columns: 3;
      display: grid;
      grid-template-columns: repeat(
        auto-fill,
        calc((1240px - (var(--columns) - 1) * var(--gap)) / var(--columns))
      );
      gap: var(--gap);
    }
  }
</style>
