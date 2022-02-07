<script lang="ts">
  let navMenuHidden = true;
</script>

<nav>
  <h1 class="title">Bugs 'n Drugs</h1>
  <button
    class="nav-menu-toggle"
    on:click={() => (navMenuHidden = !navMenuHidden)}
  >
    <ion-icon name="ellipsis-vertical" />
  </button>
  <ul class="nav-link-list" class:nav-link-list--hidden={navMenuHidden}>
    <li class="nav-link">About</li>
    <li class="nav-link">Disclaimer</li>
  </ul>
</nav>

<style>
  nav {
    position: sticky;
    top: 0;
    z-index: 1000;
    padding: 0 var(--space-md);
    height: 60px;
    width: 100%;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    box-shadow: var(--bs);
    background-color: var(--main-primary-color);
  }

  .title {
    font-size: var(--font-lg);
    color: var(--main-on-primary-color);
    font-weight: bold;
  }

  .nav-menu-toggle {
    font-size: var(--font-lg);
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
</style>
