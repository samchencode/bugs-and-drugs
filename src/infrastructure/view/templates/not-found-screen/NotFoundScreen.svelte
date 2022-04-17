<script lang="ts">
  import { location, link } from 'svelte-spa-router';
</script>

<main class="container">
  <h1 class="title">
    Sorry we couldn't find {$location}
  </h1>
  <br />
  <p><a href="/" use:link>Click here to go to homepage</a></p>
</main>

<style>
  .container {
    margin: var(--space-md);
  }
  .title {
    font-size: var(--font-lg);
  }
</style>
