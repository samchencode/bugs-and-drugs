<script lang="ts">
  import Footnote from '@/infrastructure/view/templates/footnotes/Footnote.svelte';
  export let footnotes: string[];
</script>

<ul>
  {#each footnotes as footnote}
    <li>
      <Footnote {footnote} />
    </li>
  {/each}
</ul>
