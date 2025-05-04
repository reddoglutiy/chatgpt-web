<script lang="ts">
  import { params } from 'svelte-spa-router'
  import { pinMainMenu } from './Storage.svelte'
  import logo from '../assets/logo.svg'
  import ChatOptionMenu from './ChatOptionMenu.svelte'
  import Fa from 'svelte-fa/src/fa.svelte'
  import { chatsStorage, checkStateChange, getChatSortOption, setChatSortOption, globalStorage } from './Storage.svelte'
  import { faAngleRight, faBars, faRightLong, faXmark } from '@fortawesome/free-solid-svg-icons/index'
  import { hasActiveModels } from './Models.svelte'
  import { location } from 'svelte-spa-router';
  import { onMount } from 'svelte';

  let hasModels = hasActiveModels()
$: activeChatId = $params && $params.chatId ? parseInt($params.chatId) : undefined

let currentTime: string = '';

function updateCurrentTime() {
  const now = new Date();
  currentTime = now.toLocaleTimeString('en-GB', { hour12: false });
}

onMount(() => {
  updateCurrentTime();
  const interval = setInterval(updateCurrentTime, 1000);
  return () => clearInterval(interval);
});

</script>
<nav class="navbar is-fixed-top with-safe-area" aria-label="main navigation">
  <div class="navbar-brand">
    <div class="navbar-item" style="margin-left: 0.55rem;">
      {#if $pinMainMenu}
        <span class="icon">
          <Fa icon={faXmark} />
        </span>
      {:else}
        <span class="icon" on:click|stopPropagation={() => $pinMainMenu = true}>
          <Fa icon={faBars} />
        </span>
      {/if}
    </div>
    <div class="chat-option-menu navbar-item" class:is-hidden={$globalStorage.hideTitleInNavbar}>
      <a class="navbar-item" href={'#/'}>
        <div class="title-container ml-2" style="text-align: center; width: 100%;">
          <div>
            <p class="is-size-6 has-text-weight-bold">
              {#if $location == '/chat/new'}
                New Chat
              {:else if $location === '/tweaks'}
                Tweaks
              {:else}
                QuarAI
              {/if}
            </p>
            {#if $globalStorage.showClockInNavbar}
              <p class="current-time">{currentTime}</p>
            {/if}
          </div>
        </div>            
      </a>      
    </div>
    <div class="chat-option-menu navbar-item is-pulled-right">
      <ChatOptionMenu bind:chatId={activeChatId} />
    </div>
  </div>
</nav>