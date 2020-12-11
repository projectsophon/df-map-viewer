<script>
  export let position = { top: "5px", right: "5px" };
</script>

<style>
  .modal {
    position: absolute;

    padding: 10px;
    color: var(--df-color);
    background: var(--df-background);

    border-radius: 3px;
    border: 1px solid var(--df-background);
  }
</style>

<div
  class="modal"
  style="top: {position.top}; bottom: {position.bottom}; left: {position.left}; right: {position.right}">
  <slot />
</div>
