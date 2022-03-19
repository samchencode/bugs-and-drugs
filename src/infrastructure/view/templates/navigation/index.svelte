<script lang="ts">
  import Router from 'svelte-spa-router';
  import Navigation from './Navigation.svelte';
  import BackNavigation from './BackNavigation.svelte';

  const routes = {
    '/': Navigation,
    '*': BackNavigation,
  };
</script>

<Router {routes} />
