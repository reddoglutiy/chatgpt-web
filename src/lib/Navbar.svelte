<script lang="ts">
  import { params } from 'svelte-spa-router'
  import { pinMainMenu } from './Storage.svelte'
  import logo from '../assets/logo.svg'
  import ChatOptionMenu from './ChatOptionMenu.svelte'
  import Fa from 'svelte-fa/src/fa.svelte'
  import { chatsStorage, checkStateChange, getChatSortOption, setChatSortOption } from './Storage.svelte'
  import { faAngleRight, faBars, faRightLong, faXmark } from '@fortawesome/free-solid-svg-icons/index'
  import { hasActiveModels } from './Models.svelte'

  let hasModels = hasActiveModels()
$: activeChatId = $params && $params.chatId ? parseInt($params.chatId) : undefined
</script>
<nav class="navbar is-fixed-top with-safe-area" aria-label="main navigation">
  <div class="navbar-brand">
    <div class="navbar-item" style="margin-left: 0.55rem;">
      {#if $pinMainMenu}
        <span class="icon" on:click|stopPropagation={() => $pinMainMenu = false}>
          <Fa icon={faXmark} />
        </span>
      {:else}
        <span class="icon" on:click|stopPropagation={() => $pinMainMenu = true}>
          <Fa icon={faBars} />
        </span>
      {/if}
    </div>    
    <div class="chat-option-menu navbar-item">
      <a class="navbar-item" href={'#/'}>
        <p class="ml-2 is-size-6 has-text-weight-bold">QuarAI</p>
      </a>
    </div>
    <div class="chat-option-menu navbar-item is-pulled-right">
      <ChatOptionMenu bind:chatId={activeChatId} />
    </div>
  </div>
</nav>