<script lang="ts">
  import { onMount } from 'svelte';
  import { modal } from '@/infrastructure/view/templates/modal/ModalStore';
  import { fade } from 'svelte/transition';

  // IDEA: the disclaimer, and maybe about-us should be moved to domain later
  // IDEA: use a localStorage repository to manage seen state of disclaimer
  onMount(() => {
    if (!window.localStorage) return modal.showDisclaimer();
    const key = 'seenDisclaimer';
    const oldVisitor = window.localStorage.getItem(key);
    if (oldVisitor) return;
    modal.showDisclaimer();
    window.localStorage.setItem(key, 'yes');
  });
</script>

{#if !$modal.hidden}
  <div
    class="dim-background"
    transition:fade
    on:click={() => !$modal.hidden && modal.hideModal()}
  />
  <div transition:fade class="modal">
    <div class="modal-header">
      <h1 class="modal-header-text">{$modal.header}</h1>
    </div>
    <p class="modal-text">
      {$modal.body}
    </p>
    <button class="close-modal" on:click={() => modal.hideModal()}>
      {$modal.dismiss}
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

  .modal {
    --max-modal-height: calc(100vh - 2 * 48px);
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
    max-height: calc(
      var(--max-modal-height) - 24px - 52px - 2 * var(--space-sm) -
        var(--font-lg)
    );
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

  @media screen and (min-width: 768px) {
    .modal {
      --max-modal-height: min(560px, calc(100vh - 2 * 48px));
    }
  }
</style>
