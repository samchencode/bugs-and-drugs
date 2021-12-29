<script lang="ts">
  import { getContext } from 'svelte';
  import MyCmpt from './common/MyCmpt.svelte';

  const tableController: any = getContext('tableController');
  tableController.showTable().then((table: any) => {
    console.log(table);
  });

  let name: string = 'bugs and drugs';
  let msg: string;
  $: label = 'you typed: ' + msg;
</script>

<main>
  <h1>Hello {name}!</h1>
  <form action="">
    <input type="text" name="msg" bind:value={msg} />
    <label for="msg">{label}</label>
  </form>
  <MyCmpt {msg} />
</main>

<style>
  main {
    text-align: center;
    padding: 1em;
    max-width: 240px;
    margin: 0 auto;
  }

  h1 {
    color: #ff3e00;
    text-transform: uppercase;
    font-size: 4em;
    font-weight: 100;
  }

  @media (min-width: 640px) {
    main {
      max-width: none;
    }
  }
</style>
