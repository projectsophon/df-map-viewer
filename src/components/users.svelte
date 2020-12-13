<script>
  import Modal from "./modal.svelte";
  import { selectedPlanet, users } from "./stores.js";

  const getPlayerShortHash = (address) => {
    return address.substring(0, 6);
  };

  const selectHome = (home) => {
    if (home) {
      selectedPlanet.set(home);
    }
  };
</script>

<style>
  .users-container {
    overflow: auto;
    min-width: 250px;
    max-height: 250px;
  }

  .user-list {
    margin-block-start: 0.5em;
    padding-inline-start: 20px;
    margin-block-end: 0;
  }

  .user {
    cursor: pointer;
  }
</style>

<Modal>
  <div class="users-container">
    <div>Users:</div>
    {#if $users.length !== 0}
      <ul class="user-list">
        {#each $users as user}
          <li
            class="user"
            style="color: {user.color}"
            on:click={() => selectHome(user.homePlanet)}>
            {getPlayerShortHash(user.address)}
            {#if user.twitter}- {user.twitter}{/if}
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</Modal>
