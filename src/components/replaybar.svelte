<script>
  import Modal from "./modal.svelte";
  import { speedMultiplier } from "./stores.js";

  const increaseSpeed = () => {
    speedMultiplier.update((speed) => Math.min(speed + 2, 100));
  };

  const decreaseSpeed = () => {
    speedMultiplier.update((speed) => Math.max(speed - 2, 1));
  };

  let position = { left: "5px", bottom: "5px" };
</script>

<style>
  .title {
    margin-right: 0.25em;
  }

  .speed {
    margin: 0 0.5em;
  }

  button {
    background: var(--df-background);
    color: var(--df-color);
    border: 1px solid var(--df-color);
  }
</style>

<Modal {position}>
  <span class="title">Speed:</span>
  <span>
    <button on:click={decreaseSpeed}>&LeftArrow;</button>
    <span class="speed">{$speedMultiplier}x</span>
    <button on:click={increaseSpeed}>&RightArrow;</button>
  </span>
</Modal>
