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

{#if $blockInformation}
  <Modal {position}>
    {#if $blockInformation.number}
      <div>
        Block number:
        <a
          href="https://blockscout.com/poa/xdai/blocks/{$blockInformation.number}"
          target="_blank">{$blockInformation.number}</a>
      </div>
    {/if}
    {#if $blockInformation.date}
      <div>At: {$blockInformation.date.toLocaleString()}</div>
    {/if}
  </Modal>
{/if}
