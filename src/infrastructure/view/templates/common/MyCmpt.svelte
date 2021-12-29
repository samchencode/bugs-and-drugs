<script lang="ts">
  export let msg: string;
</script>

<div>
  <p>Lorem, ipsum dolor sit amet consectetur adipisicing elit. Iusto, rerum!</p>
  <p>Tempora vel adipisci velit ipsa reprehenderit a debitis mollitia animi.</p>
  <p>Corporis labore sed officia nesciunt quasi impedit, saepe tempore odio.</p>
  <p>{msg ?? ''}</p>
</div>

<style>
  div {
    animation: shake 5s infinite linear;
    width: 400px;
    margin-left: auto;
    margin-right: auto;
  }

  @keyframes shake {
    0% {
      transform: rotate(0deg);
    }
    25% {
      transform: rotate(30deg);
    }
    75% {
      transform: rotate(-30deg);
    }
    100% {
      transform: rotate(0deg);
    }
  }
</style>
