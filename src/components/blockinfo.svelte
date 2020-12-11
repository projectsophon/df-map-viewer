<script>
  import Modal from "./modal.svelte";

  import { blockInformation } from "./stores.js";

  const position = { top: "5px", left: "5px" };
</script>

<style>
  a {
    color: var(--df-color);
  }
</style>

<Modal {position}>
  <div>
    Block number:
    <a
      href="https://blockscout.com/poa/xdai/blocks/{$blockInformation.number}"
      target="_blank">{$blockInformation.number}</a>
  </div>
  <div>At: {$blockInformation.date.toLocaleString()}</div>
</Modal>
