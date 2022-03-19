<script lang="ts">
  import './index.css';
  import routes from './routes';
  import Router from 'svelte-spa-router';
  import Navigation from './navigation/index.svelte';
</script>

<Navigation />
<Router {routes} />
