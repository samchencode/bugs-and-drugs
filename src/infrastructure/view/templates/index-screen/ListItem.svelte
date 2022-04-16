<script lang="ts">
  export let title: string;
  export let subtitle: string;
</script>

<li class="item">
  <ion-icon name="file-tray-full-outline" class="icon" />
  <div class="label">
    <h2 class="title">{title}</h2>
    <p class="subtitle">{subtitle}</p>
  </div>
</li>

<!-- <button class="fav-button button--unset clickable">
  <ion-icon name="star-outline" class="icon" />
  <ion-icon name="star" class="icon" />
</button> -->
<style>
  .item {
    display: flex;
    align-items: center;
    padding: calc(var(--space-sm) / 2) 0;
  }

  .label {
    display: flex;
    flex-direction: column;
  }

  .title {
    font-size: var(--font-md);
  }

  .subtitle {
    font-size: var(--font-sm);
  }

  .icon {
    font-size: var(--icon-md);
    margin-right: var(--space-sm);
  }
</style>
