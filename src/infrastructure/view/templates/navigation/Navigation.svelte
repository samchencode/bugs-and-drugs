<script lang="ts">
  import { getContext } from 'svelte';
  import { link, location, querystring } from 'svelte-spa-router';
  import type AntibiogramController from '@/infrastructure/view/controllers/AntibiogramController';
  import type { WebAntibiogram } from '@/infrastructure/view/presenters/WebAntibiogramPresenter';
  import { modal } from '@/infrastructure/view/templates/Modal/ModalStore';
  import dialogues from '@/infrastructure/view/templates/Modal/Dialogues';

  let vm: WebAntibiogram | null = null;

  const controller = getContext<AntibiogramController>('antibiogramController');
  $: onHomePage = $location === '/';
  $: onTablePage = $location === '/antibiogram';
  $: abgIds = onTablePage
    ? new URLSearchParams($querystring).get('ids')?.split(',') ?? null
    : null;
  $: abgIds !== null && controller.show(abgIds[0]).then((abg) => (vm = abg));

  let navMenuHidden = true;
  let dialogue = new dialogues();
</script>

<nav>
  {#if !onHomePage}
    <a class="back" href="/" use:link>
      <ion-icon name="arrow-back-outline" />
    </a>
  {/if}
  <h1 class="title">
    {#if onHomePage}
      Available Antibiograms
    {:else if !onTablePage}
      Not Found
    {:else if vm === null}
      Retrieving...
    {:else}
      {vm.institution} {vm.info}
    {/if}
  </h1>
  <button
    class="nav-menu-toggle"
    on:click={() => (navMenuHidden = !navMenuHidden)}
  >
    <ion-icon name="ellipsis-vertical" />
  </button>
  <ul class="nav-link-list" class:nav-link-list--hidden={navMenuHidden}>
    <li
      class="nav-link"
      on:click={() => {
        modal.setModal(false, 'About', dialogue.getAboutDialogue(), false);
        navMenuHidden = !navMenuHidden;
      }}
    >
      About
    </li>
    <li
      class="nav-link"
      on:click={() => {
        modal.setModal(
          false,
          'Disclaimer',
          dialogue.getDisclaimerDialogue(),
          false
        );
        navMenuHidden = !navMenuHidden;
      }}
    >
      Disclaimer
    </li>
  </ul>
</nav>

<style>
  nav {
    position: sticky;
    top: 0;
    left: 0;
    z-index: 1000;
    padding: 0 var(--space-md);
    height: 60px;
    width: 100%;
    display: flex;
    flex-direction: row;
    align-items: center;
    box-shadow: var(--bs);
    background-color: var(--main-primary-color);
  }

  .title {
    font-size: var(--font-lg);
    color: var(--main-on-primary-color);
    font: sans-serif;
    font-weight: bold;
    flex: 1;
    margin: 0;
    padding: 0;
    transform: translateY(-2px);
  }

  .back {
    all: unset;
    font-size: var(--icon-md);
    color: white;
    margin-right: 32px;
  }

  .nav-menu-toggle {
    font-size: var(--icon-md);
    background: none;
    height: 100%;
    border: none;
    color: var(--main-on-primary-color);
    display: flex;
    align-items: center;
    margin: 0;
  }

  .nav-link-list {
    display: flex;
    flex-direction: column;
    background: var(--main-surface-color);
    position: absolute;
    right: var(--space-md);
    top: 100%;
    box-shadow: var(--bs);
  }

  .nav-link-list--hidden {
    display: none;
  }
  .nav-link {
    font-size: var(--font-lg);
    padding: var(--space-sm);
  }

  .nav-link:hover,
  .nav-link:focus {
    background: var(--main-surface-emphasis-color);
  }

  @media screen and (max-width: 250px) {
    .title {
      word-break: break-all;
    }
  }
</style>
