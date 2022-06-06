<script lang="ts">
  import type WebResistanceRate from '@/infrastructure/view/presenters/WebResistanceRate';
  export let resistanceRate: WebResistanceRate;
</script>

<h1>{resistanceRate.toString()}</h1>
