<script lang="ts"></script>

<th class="top-left-block" />

<style>
  .top-left-block {
    position: sticky;
    left: 0;
    z-index: 3;
    background-color: var(--main-bg-color);
    border-bottom: 1px solid black;
  }

  .top-left-block::after {
    content: '';
    position: absolute;
    right: 0;
    top: 0;
    width: 0;
    height: 100%;
    border-right: 1px solid var(--main-on-surface-color);
  }
</style>
