<script>
  let AntibiogramHeaders = [
    'UHS 2021-2022',
    'Lourdes 2019-2020',
    'Wilson 2019-2020',
    'BGH 2019-2020',
  ];
</script>

<div class="antibiogram-card-container">
  {#each AntibiogramHeaders as AntibiogramHeader}
    <div class="antibiogram-card">
      <span>{AntibiogramHeader}</span>
    </div>
  {/each}
</div>

<style>
  .antibiogram-card-container {
    display: flex;
    flex-direction: column;
    position: relative;
    padding-top: 40px;
  }
  .antibiogram-card {
    width: 70%;
    max-width: 500px;
    min-width: 50px;
    height: 10%;
    max-height: 200px;
    min-height: 50px;
    margin-bottom: 40px;
    box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2);
    transition: 0.3s;
    border-radius: 5px;
    text-align: center;
    font-size: var(--card-font-size);
    position: relative;
    left: 50%;
    transform: translateX(-50%);
  }
  .antibiogram-card:hover {
    box-shadow: 0 8px 16px 0 rgba(0, 0, 0, 0.2);
  }
</style>
