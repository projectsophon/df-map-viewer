<script>
  import Modal from "./modal.svelte";
  import { firstReplayBlock, lastReplayBlock } from "../constants";
  import { seekTo } from "./stores";

  let position = { bottom: "5px", right: "5px" };

  const step = 1000;

  let blockNumber = firstReplayBlock;

  let onChange = () => {
    seekTo.update((prev) => {
      if (prev.blockNumber !== blockNumber) {
        return { init: false, seeking: true, blockNumber };
      } else {
        return prev;
      }
    });
  };
</script>

<style>
  .seekbar {
    width: 70vw;
    display: flex;
  }

  .seek {
    flex: 1;
    margin-right: 10px;
  }
</style>

<Modal {position}>
  <div class="seekbar">
    <input
      class="seek"
      type="range"
      disabled={$seekTo.init || $seekTo.seeking}
      bind:value={blockNumber}
      on:change={onChange}
      min={firstReplayBlock}
      max={lastReplayBlock}
      {step} />
    <span>{blockNumber}</span>
  </div>
</Modal>
