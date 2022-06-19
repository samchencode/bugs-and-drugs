<script>
  export let footnote;
</script>

<p class="footnote">{footnote}</p>

<style>
  .footnote {
    font-size: var(--font-sm);
  }

  @media screen and (min-width: 768px) {
    .footnote {
      font-size: var(--font-md);
    }
  }
</style>
