<script lang="ts">
  export let tooltip: string;
</script>

{#if tooltip.length !== 0}
  <span class="tooltip-text">
    {#each tooltip.split('\n') as text}
      {text}
      <br />
    {/each}
  </span>
{/if}

<style>
  .tooltip-text {
    position: absolute;
    width: max(90%, 100px);
    left: 50%;
    transform: translateX(-50%);
    top: calc(100% + 0.25em);
    font-size: 0.9em;
  }
</style>
