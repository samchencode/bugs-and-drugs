<script lang="ts">
  export let title: string;
  export let subtitle: string;
</script>

<div class="card">
  <div class="card-left">
    <h2 class="title">{title}</h2>
    <p class="subtitle">{subtitle}</p>
  </div>
  <button class="fav-button button--unset clickable">
    <ion-icon name="star-outline" class="icon" />
    <ion-icon name="star" class="icon" />
  </button>
</div>

<style>
  .card {
    width: 100%;
    padding: var(--space-sm);
    border: var(--border);
    box-shadow: var(--bs);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .card-left * {
    display: block;
  }

  .title {
    font-size: var(--font-md);
  }

  .subtitle {
    font-size: var(--font-sm);
  }

  .fav-button {
    font-size: var(--font-xl);
    display: flex;
    align-items: center;
    color: var(--main-on-surface-color);
  }

  .fav-button .icon:first-child,
  .fav-button:hover .icon:last-child {
    display: inline-block;
  }

  .fav-button:hover .icon:first-child,
  .fav-button .icon:last-child {
    display: none;
  }
</style>
