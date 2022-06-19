<script lang="ts">
  import Footnote from '@/infrastructure/view/templates/footnotes/Footnote.svelte';
  export let footnotes: string[];
</script>

{#if footnotes.length > 0}
  <ul class="footnotes">
    <h2 class="header">Footnotes:</h2>
    {#each footnotes as footnote}
      <li>
        <Footnote {footnote} />
      </li>
    {/each}
  </ul>
{/if}

<style>
  .footnotes {
    padding: var(--space-xs) 0;
    display: flex;
    flex-direction: column;
  }

  .header {
    margin-bottom: var(--space-xs);
  }

  .footnotes li {
    display: flex;
    align-items: center;
    margin-bottom: var(--space-xs);
  }
  .footnotes li:last-child {
    margin-bottom: 0;
  }

  .footnotes li::before {
    content: '\25B8';
    margin-right: var(--space-xs);
  }

  @media screen and (min-width: 768px) {
    .header {
      font-size: var(--font-md);
    }
  }
</style>
