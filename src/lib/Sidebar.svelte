<script lang="ts">
  import 'animate.css';
  import { onDestroy } from 'svelte';
  import { params } from 'svelte-spa-router';
  import ChatMenuItem from './ChatMenuItem.svelte';
  import Fa from 'svelte-fa/src/fa.svelte';
  import {
    chatsStorage,
    pinMainMenu,
    checkStateChange,
    getChatSortOption,
    setChatSortOption
  } from './Storage.svelte';
  import { clickOutside } from 'svelte-use-click-outside';
  import { startNewChatWithWarning } from './Util.svelte';
  import { chatSortOptions } from './Settings.svelte';
  import { hasActiveModels } from './Models.svelte';
  import {
    faKey,
    faNotesMedical,
    faGears
  } from '@fortawesome/free-solid-svg-icons';

  $: sortedChats = $chatsStorage.sort(getChatSortOption().sortFn);
  $: activeChatId = $params?.chatId ? parseInt($params.chatId) : undefined;

  let sortOption = getChatSortOption();
  let hasModels = hasActiveModels();
  $: {
    sortOption = getChatSortOption();
    sortedChats = $chatsStorage.sort(sortOption.sortFn);
    hasModels = hasActiveModels();
  }

  let showSortMenu = false;

  let localVisible = false;
  let menuClass = '';
  
  const unsub = pinMainMenu.subscribe(value => {
    if (value) {
      localVisible = true;
      menuClass = 'animate__animated animate__slideInLeft';
    }
  });
  onDestroy(unsub);

  function closeMenu() {
    menuClass = 'animate__animated animate__fadeOutLeft';
  }

  function handleAnimationEnd(e: AnimationEvent) {
    if (e.animationName === 'fadeOutLeft') {
      pinMainMenu.set(false);
      localVisible = false;
    }
  }
</script>

{#if localVisible}
  <aside
    class="menu main-menu {menuClass}"
    class:pinned={$pinMainMenu}
    use:clickOutside={closeMenu}
    on:animationend={handleAnimationEnd}
  >
    <div class="menu-expanse">
      <ul class="menu-list menu-expansion-list">
        {#if sortedChats.length === 0}
          <li><a href="#" class="is-disabled">No chats yet...</a></li>
        {:else}
          {#key $checkStateChange}
            {#each sortedChats as chat, i}
              {#key chat.id}
                <ChatMenuItem
                  {activeChatId}
                  {chat}
                  prevChat={sortedChats[i-1]}
                  nextChat={sortedChats[i+1]}
                />
              {/key}
            {/each}
          {/key}
        {/if}
      </ul>

      <div class="level is-mobile bottom-buttons p-1" style="margin-left:5px">
        <div class="level-left">
          <div
            class="dropdown is-left is-up"
            class:is-active={showSortMenu}
            use:clickOutside={() => (showSortMenu = false)}
          >
            <div class="dropdown-trigger">
              <button
                class="button"
                aria-haspopup="true"
                aria-controls="dropdown-menu3"
                on:click|preventDefault|stopPropagation={() => (showSortMenu = !showSortMenu)}
              >
                <span class="icon"><Fa icon={sortOption.icon} /></span>
              </button>
            </div>
            <div class="dropdown-menu" id="dropdown-menu3" role="menu">
              <div class="dropdown-content">
                {#each Object.values(chatSortOptions) as opt}
                  <a
                    href="#"
                    class="dropdown-item"
                    class:is-active={sortOption === opt}
                    on:click|preventDefault={() => {
                      showSortMenu = false;
                      setChatSortOption(opt.value);
                    }}
                  >
                    <span class="menu-icon"><Fa icon={opt.icon} /></span>
                    {opt.text}
                  </a>
                {/each}
              </div>
            </div>
          </div>
        </div>

        <div class="level-right">
          {#if !hasModels}
            <div class="level-item">
              <a href="#/" class="panel-block is-disabled">
                <span class="greyscale mr-1"><Fa icon={faKey} /></span>API Setting
              </a>
            </div>
          {:else}
            <div class="level-item" style="margin-bottom:20px; gap:0.5rem">
              <button
                on:click={() => {
                  pinMainMenu.set(false);
                  location.hash = '#/tweaks';
                }}
                class="button"
              >
                <span class="greyscale"><Fa icon={faGears} /></span>
              </button>
              <button
                on:click={async () => {
                  pinMainMenu.set(false);
                  await startNewChatWithWarning(activeChatId);
                }}
                class="panel-block button"
                title="Start new chat with default profile"
                class:is-disabled={!hasModels}
              >
                <span class="greyscale"><Fa icon={faNotesMedical} /></span>
              </button>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </aside>
{/if}
