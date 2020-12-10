<script>
  import Modal from "./modal.svelte";
  import { speedMultiplier } from "./stores.js";

  const doubleSpeed = () => {
    speedMultiplier.update((speed) => Math.min(Math.floor(speed * 2), 50));
  };

  const halveSpeed = () => {
    speedMultiplier.update((speed) => Math.max(Math.floor(speed / 2), 1));
  };

  let position = { left: "5px", bottom: "5px" };
</script>

<style>
  .title {
    margin-right: 10px;
  }

  .speed {
    margin: 0 0.5em;
  }

  button {
    background: #080808;
    color: #fff;
    border: 1px solid #fff;
  }
</style>

<Modal {position}>
  <span class="title">Replay speed:</span>
  <span>
    <button on:click={halveSpeed}>&LeftArrow;</button>
    <span class="speed">{$speedMultiplier}x</span>
    <button on:click={doubleSpeed}>&RightArrow;</button>
  </span>
</Modal>
