<script lang="ts">
  import type WebResistanceRate from '@/infrastructure/view/presenters/WebResistanceRate';
  export let resistanceRate: WebResistanceRate;
</script>

<p class="resistance-rate">
  {resistanceRate.toString()}
</p>

<style>
  .resistance-rate {
    font-size: var(--font-sm);
    padding: var(--space-xxs);
    border-radius: 500px;
    background-color: var(--main-surface-emphasis-color);
  }
</style>
