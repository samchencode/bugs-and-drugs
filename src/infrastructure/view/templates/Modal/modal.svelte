<script lang="ts">
  import { modal } from '@/infrastructure/view/templates/Modal/ModalStore';
  import { fade } from 'svelte/transition';
</script>

{#if !$modal.hidden}
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
      on:click={() => {
        modal.closeModal();
      }}
    >
      CLOSE
    </h2>
  </div>
{/if}

<style>
  .modal-container {
    display: grid;
    grid-template-columns: 100px 100px 100px;
    grid-template-rows: 52px auto 52x;
    position: fixed;
    top: 10%;
    left: 50%;
    z-index: 1;
    background-color: white;
    border: 1px solid black;
    transform: translateX(-50%);
    box-shadow: var(--bs);
  }
  .modal-header {
    grid-row: 1;
    grid-column: 1 / 4;
    text-align: left;
    padding: 10px;
    width: 100%;
  }
  .modal-header-text {
    font: sans-serif;
    font-weight: bold;
    font-size: var(--font-lg);
  }
  .close-modal {
    grid-column: 3;
    grid-row: 3;
    text-align: right;
    padding: 10px;
    font-size: var(--font-lg);
  }
  .modal-text {
    padding: 10px;
    grid-row: 2;
    grid-column: 1 / 4;
    font-size: var(--font-lg);
    font: sans-serif;
  }
</style>
