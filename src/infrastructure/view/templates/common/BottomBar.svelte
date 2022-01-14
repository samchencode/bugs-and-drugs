<div class="bottom-bar">
  <div class="bar-positioner">
    <ion-icon
      name="star-outline"
      class="goto-favorites-list vertically-center clickable"
    />
    <ion-icon
      name="information-circle-outline"
      class="goto-information-tab vertically-center clickable"
    />
  </div>
</div>

<style>
  .bottom-bar {
    height: 60px;
    /* height: 8vh;
    max-height: 60px;
    min-height: 40px; */
    background-color: var(--main-primary-color);
    position: absolute;
    bottom: 0;
    width: 100%;
    color: var(--main-bg-color);
  }
  .goto-favorites-list {
    font-size: 35px;
    left: 0;
    position: absolute;
    size: large;
  }
  .goto-information-tab {
    font-size: 40px;
    right: 0;
    position: absolute;
    size: medium;
  }
</style>
