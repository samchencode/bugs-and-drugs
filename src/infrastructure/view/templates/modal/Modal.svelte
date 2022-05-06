<script lang="ts">
  import { modal } from '@/infrastructure/view/templates/modal/ModalStore';
  import { fade } from 'svelte/transition';
</script>

{#if !$modal.hidden}
  <div
    class="dim-background"
    transition:fade
    on:click={() => !$modal.hidden && modal.hideModal()}
  />
  <div in:fade class="modal-container">
    <div class="modal-header">
      <h1 class="modal-header-text">{$modal.title}</h1>
    </div>

    <p class="modal-text">
      {$modal.text}
    </p>
    <h2
      name="close-outline"
      class="close-modal clickable"
      on:click={() => modal.hideModal()}
    >
      CLOSE
    </h2>
  </div>
{/if}

<style>
  .dim-background {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: black;
    opacity: 50%;
    z-index: 500;
  }
  .modal-container {
    display: grid;
    grid-template-columns: var(--modal-width);
    grid-template-rows: 40px auto 52px;
    position: fixed;
    top: 10%;
    left: 50%;
    z-index: 1000;
    background-color: white;
    border: 1px solid black;
    transform: translateX(-50%);
    box-shadow: var(--bs);
  }
  .modal-header {
    grid-row: 1;
    text-align: left;
    padding-left: 24px;
  }
  .modal-header-text {
    font: sans-serif;
    font-weight: bold;
    font-size: var(--font-lg);
  }
  .close-modal {
    grid-row: 3;
    text-align: right;
    padding: 10px;
    font-size: var(--font-lg);
  }
  .modal-text {
    padding-left: 24px;
    padding-right: 24px;
    grid-row: 2;
    font-size: var(--font-lg);
    font: sans-serif;
    max-height: 60vh;
    overflow: scroll;
  }
</style>
