<script>
  import Modal from "./modal.svelte";
  import { speedMultiplier, playing } from "./stores.js";

  const increaseSpeed = () => {
    speedMultiplier.update((speed) => Math.min(speed + 1, 100));
  };

  const decreaseSpeed = () => {
    speedMultiplier.update((speed) => Math.max(speed - 1, 1));
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

  button,
  .playing {
    background: var(--df-background);
    color: var(--df-color);
    border: 1px solid var(--df-color);
  }

  .playing {
    display: block;
    text-align: center;
    margin-top: 0.5em;
    padding: 0.25em;
  }

  .playing > input {
    display: none;
  }
</style>

<Modal {position}>
  <span class="title">Speed:</span>
  <span>
    <button on:click={decreaseSpeed}>&LeftArrow;</button>
    <span class="speed">{$speedMultiplier}x</span>
    <button on:click={increaseSpeed}>&RightArrow;</button>
  </span>
  <label class="playing">
    {$playing ? 'Pause' : 'Play'}
    <input type="checkbox" bind:checked={$playing} />
  </label>
</Modal>
