<script lang="ts">
  import './index.css';
  import routes from './routes';
  import Router from 'svelte-spa-router';
  import Navigation from './navigation/Navigation.svelte';
  import Modal from '@/infrastructure/view/templates/modal/Modal.svelte';
</script>

<Navigation />
<Router {routes} />
<Modal />
