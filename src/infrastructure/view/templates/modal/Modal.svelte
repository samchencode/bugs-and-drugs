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
    <button
      name="close-outline"
      class="close-modal"
      on:click={() => modal.hideModal()}
    >
      Close
    </button>
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
    opacity: 0.5;
    z-index: 1000;
  }

  .modal-container {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 1000;
    background-color: white;
    box-shadow: var(--bs);
    width: var(--modal-width);
    display: grid;
    grid-template: 24px auto auto 52px / 24px auto 16px 8px;
  }

  .modal-header {
    grid-row: 2 / span 1;
    grid-column: 2 / span 1;
    margin-bottom: var(--space-md);
  }

  .modal-header-text {
    font-weight: bold;
    font-size: var(--font-lg);
  }

  .modal-text {
    grid-row: 3 / span 1;
    grid-column: 2 / span 1;
    font-size: var(--font-md);
    max-height: 60vh;
    overflow: auto;
    margin-bottom: var(--space-md);
  }

  .close-modal {
    border: none;
    background: none;
    padding: var(--space-xs) var(--space-sm);
    margin: var(--space-xs) 0;
    font-size: var(--font-md);
    font-weight: bold;
    width: fit-content;
    justify-self: end;
    grid-column: -4 / span 2;
    grid-row: -2 / span 1;
  }
</style>
