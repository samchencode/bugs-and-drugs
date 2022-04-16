<script lang="ts">
  export let title: string;
  export let subtitle: string;

  let bodyHidden = false;

  const handleToggle = () => (bodyHidden = !bodyHidden);
</script>

<figure class="card" class:body-hidden={bodyHidden}>
  <div class="header">
    <ion-icon name="medical-outline" class="icon thumbnail" />
    <h1 class="title">{title}</h1>
    <p class="subtitle">{subtitle}</p>
    <button
      class="toggle"
      class:toggle-inactive={bodyHidden}
      on:click={handleToggle}
    >
      <ion-icon name="chevron-up-outline" class="icon" />
    </button>
  </div>
  <div class="body">
    <slot />
  </div>
</figure>

<style>
  .card {
    width: 100%;
    padding: var(--space-sm);
    margin: 0;
    margin-bottom: var(--space-md);
    box-shadow: var(--bs);
    display: flex;
    flex-direction: column;
    background-color: var(--main-surface-color);
  }

  .header {
    display: grid;
    grid-template-columns: 72px 1fr 40px;
    align-items: center;
    transition: margin-bottom 200ms ease 200ms;
  }

  .title {
    font-size: var(--font-lg);
    font-weight: bold;
    grid-row: 1 / 2;
    grid-column: 2 / 3;
  }

  .subtitle {
    font-size: var(--font-md);
    grid-row: 2 / 3;
    grid-column: 2 / 3;
    padding-bottom: var(--space-xs);
  }

  .icon {
    font-size: var(--icon-md);
  }

  .thumbnail {
    font-size: 40px;
    grid-column: 1 / 2;
    grid-row: 1 / span 2;
  }

  .toggle {
    grid-column: 3 / 4;
    grid-row: 1 / span 2;
    justify-self: flex-end;
    border-radius: 50%;
    display: grid;
    place-items: center;
    background: none;
    border: 0;
  }

  .toggle:hover,
  .toggle:focus {
    background: var(--main-surface-emphasis-color);
  }

  .toggle .icon {
    transition: transform 200ms ease-in;
  }

  .toggle-inactive .icon {
    transform: rotate(180deg);
  }

  .body {
    margin-top: var(--space-md);
    transform: scale(1, 1);
    height: initial;
    overflow: hidden;
    transition: opacity 200ms ease-in-out;
  }

  .body-hidden .body {
    opacity: 0;
    animation: 200ms ease 200ms 1 forwards shrink;
  }

  @keyframes shrink {
    from {
      margin-top: var(--space-md);
      max-height: 100vh;
    }

    to {
      margin-top: 0;
      max-height: 0;
    }
  }
</style>
