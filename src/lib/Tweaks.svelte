<script lang="ts">
  import { apiKeyStorage, globalStorage, lastChatId, getChat, started, setGlobalSettingValueByKey, checkStateChange } from './Storage.svelte'
  import Footer from './Footer.svelte'
  import { replace } from 'svelte-spa-router'
  import { afterUpdate, onMount } from 'svelte'
  import { getPetalsBase, getPetalsWebsocket } from './ApiUtil.svelte'
  import { set as setOpenAI } from './providers/openai/util.svelte'
  import { hasActiveModels } from './Models.svelte'
  import { get } from 'svelte/store'
  import { pinMainMenu, chatsStorage, getChatSortOption, setChatSortOption, showClockInNavbar } from './Storage.svelte'

  import { startNewChatWithWarning } from './Util.svelte'
  import { faEraser, faSquarePlus } from '@fortawesome/free-solid-svg-icons/index'
  import { params } from 'svelte-spa-router'
  import ChatMenuItem from './ChatMenuItem.svelte'
  import Fa from 'svelte-fa/src/fa.svelte'
  import ChatOptionMenu from './ChatOptionMenu.svelte'
  import logo from '../assets/logo.svg'
  import { clickOutside } from 'svelte-use-click-outside'
  import { chatSortOptions } from './Settings.svelte'
    import { faStickyNote } from '@fortawesome/free-regular-svg-icons';
    import { faEvernote } from '@fortawesome/free-brands-svg-icons';
  import { openModal } from 'svelte-modals'
  import PromptConfirm from './PromptConfirm.svelte'


  const dummy: Chat = { id:0, name:'Example chat', created:1741112473000, lastUse:1741115038000, lastAccess:1741115036000, messages:[0,0,0,0], isFavorite:false };

  $: sortedChats = $chatsStorage.sort(getChatSortOption().sortFn)
  $: activeChatId = $params && $params.chatId ? parseInt($params.chatId) : undefined

  let sortOption = getChatSortOption()

  const onStateChange = (...args:any) => {
    sortOption = getChatSortOption()
    sortedChats = $chatsStorage.sort(sortOption.sortFn)
    hasModels = hasActiveModels()
  }

  $: onStateChange($checkStateChange)

  let showSortMenu = false


  $: apiKey = $apiKeyStorage
  const openAiEndpoint = $globalStorage.openAiEndpoint || ''
  let showPetalsSettings = $globalStorage.enablePetals
  let pedalsEndpoint = $globalStorage.pedalsEndpoint
  let hasModels = hasActiveModels()
  let apiError: string = ''

  onMount(() => {
    if (!$started) {
      $started = true
      if (hasActiveModels() && getChat($lastChatId)) {
        const chatId = $lastChatId
        $lastChatId = 0
        replace(`/chat/${chatId}`)
      }
    }
    $lastChatId = 0
  })

  afterUpdate(() => {
    hasModels = hasActiveModels()
    pedalsEndpoint = $globalStorage.pedalsEndpoint
    $checkStateChange++
  })

  const setPetalsEnabled = (event: Event) => {
    const el = (event.target as HTMLInputElement)
    setGlobalSettingValueByKey('enablePetals', !!el.checked)
    showPetalsSettings = $globalStorage.enablePetals
    hasModels = hasActiveModels()
  }

  async function testApiEndpoint (baseUri: string): Promise<boolean> {
    try {
      const response = await fetch(`${baseUri}/v1/models`, {
        headers: { Authorization: `Bearer ${get(apiKeyStorage)}` }
      })
      if (!response.ok) {
        apiError = `There was an error connecting to this endpoint: ${response.statusText}`
        return false
      }
      apiError = ''
      return true
    } catch (error) {
      console.error('Failed to connect:', error)
      apiError = `There was an error connecting to this endpoint: ${error.message}`
      return false
    }
  }
  const resetEverything = () => {
  close()
  openModal(PromptConfirm, {
    title: 'Reset Everything',
    message: 'Are you sure you want to completely reset all your data? This cannot be undone.',
    class: 'is-danger',
    confirmButtonClass: 'is-danger',
    confirmButton: 'Reset All',
    onConfirm: () => {
      localStorage.clear()
      window.location.href = '/'
    }
  })
  }

</script>
<section class="section" style="padding-top: 0;">
  <article class="message is-success">
    <div class="message-header">
      <p>Chats</p>
    </div>
    <div class="message-body">
      
      <ul class="menu-list menu-expansion-list">
        {#if sortedChats.length === 0}
        {:else}
          {#key $checkStateChange}
          {#each sortedChats as chat, i}
          {#key chat.id}
          <ChatMenuItem activeChatId={activeChatId} chat={chat} prevChat={sortedChats[i - 1]} nextChat={sortedChats[i + 1]} showDetails={true}/>
          {/key}
          {/each}
          {/key}
        {/if}
      </ul>
      {#if sortedChats.length === 0}
      <p class="mb-4">
        Currently, there are no chats available. But don't worry, you can easily start a new one. Just click the <a href="#/chat/new">New Chat</a> button to begin a conversation and make the most of your chat experience.
      </p>
      {:else}
      <p class="mb-4">
        <strong>Detailed chat information</strong> lets you view key details about all your chats, such as their creation date, last activity, and other relevant information. It’s a handy tool for those who want to stay on top of their chats and quickly find the information they need.
      </p>
      {/if}
    </div>
  </article>
  <article class="message is-link">
    <div class="message-header">
      <p>Tweaks</p>
    </div>
    <div class="message-body" >
      <p><strong>Here you can switch tweaks!</strong> Click to change the settings.</p>
      <p style="margin-top: 1rem;"><strong>Customize the Navbar</strong></p>
      <label class="checkbox" style="margin-top: 1rem;">
        <input type="checkbox" bind:checked={$globalStorage.hideTitleInNavbar}>
        Hide Title in Navbar
      </label>
      <label class="checkbox" class:is-disabled={$globalStorage.hideTitleInNavbar}>
        <input type="checkbox" bind:checked={$globalStorage.showClockInNavbar}>
        Show Clock in Navbar
      </label>
      <label class="checkbox">
        <input type="checkbox" bind:checked={$globalStorage.hideSystemPromptInChat}>
        Hide System Prompt in Chat
      </label>
      <p style="margin-top: 1rem;"><strong>Customize the action menu</strong></p>
      <ul>
        <ChatMenuItem
          chat={dummy}
          activeChatId={undefined}
          prevChat={undefined}
          nextChat={undefined}
          showExample={true}
        />
      </ul>
      <label class="checkbox" style="margin-top: 1rem;">
        <input type="checkbox" bind:checked={$globalStorage.showDetailedChatsInfo}>
        Show detailed information
      </label>
      <label class="checkbox">
        <input type="checkbox" bind:checked={$globalStorage.hideMessagesCountOnChat}>
        Hide messages count
      </label>
      <label class="checkbox">
        <input type="checkbox" bind:checked={$globalStorage.hideChatRenameButton}>
        Hide Rename Button
      </label>
      <label class="checkbox">
        <input type="checkbox" bind:checked={$globalStorage.hideChatFavoriteButton}>
        Hide Favorite Button
      </label>
      <label class="checkbox">
        <input type="checkbox" bind:checked={$globalStorage.hideChatDeleteButton}>
        Hide Delete Button
      </label>
      <p style="margin-top: 1rem;"><strong>(WIP) Customize the chat</strong></p>
      <label class="checkbox" style="margin-top: 1rem;">
        <input type="checkbox" bind:checked={$globalStorage.allowEditAssistantMessage}>
        Allow Edit Assistant Message
      </label>
      <label class="checkbox">
        <input type="checkbox" bind:checked={$globalStorage.showTimestampOnMessages}>
        Show Timestamp on Message
      </label>
      <label class="checkbox" class:is-disabled={!$globalStorage.showTimestampOnMessages}>
        <input type="checkbox" bind:checked={$globalStorage.showSecondOnMessagesTimestamp}>
        Show Seconds on Message Timestamp
      </label> 
    </div>
  </article>
  <article class="message is-danger">
    <div class="message-header">
      <p>Danger Zone</p>
    </div>
    <div class="message-body">
      <div class="content">
        <p><strong>Reset Application Data</strong></p>
        <p>This action will completely erase all stored data, including chats, settings, and profiles. 
           <br>Once you reset, it cannot be undone.</p>
      </div>
      <div style="margin-top: 1rem;">
        <button class="button is-danger" on:click={resetEverything}>
          <Fa icon={faEraser} class="mr-1"/>
          Reset Everything
        </button>
      </div>
    </div>
  </article>  
</section>