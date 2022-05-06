<script lang="ts">
  import './index.css';
  import routes from './routes';
  import Router from 'svelte-spa-router';
  import Navigation from './navigation/Navigation.svelte';
  import Modal from '@/infrastructure/view/templates/Modal/Modal.svelte';
  import { modal } from '@/infrastructure/view/templates/Modal/ModalStore';
  import { fade } from 'svelte/transition';
  let firstClick = true;
  $: if ($modal.hidden) {
    firstClick = true;
  }
</script>

<div
  transition:fade
  class:opacify={!$modal.hidden}
  on:click={() => {
    if (!$modal.hidden) {
      if (!firstClick) modal.closeModal();
      else {
        firstClick = false;
      }
    }
  }}
>
  <Navigation />
  <Router {routes} />
</div>
<Modal />

<style>
  .opacify {
    opacity: 30%;
  }
</style>
