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
  import { faSquarePlus } from '@fortawesome/free-solid-svg-icons/index'
  import { params } from 'svelte-spa-router'
  import ChatMenuItem from './ChatMenuItem.svelte'
  import Fa from 'svelte-fa/src/fa.svelte'
  import ChatOptionMenu from './ChatOptionMenu.svelte'
  import logo from '../assets/logo.svg'
  import { clickOutside } from 'svelte-use-click-outside'
  import { chatSortOptions } from './Settings.svelte'
    import { faStickyNote } from '@fortawesome/free-regular-svg-icons';
    import { faEvernote } from '@fortawesome/free-brands-svg-icons';

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
</script>
<style>
  html, body {
    overscroll-behavior: none;
  }
</style>
<section class="section" style="padding-top: 0;">
  <article class="message is-success">
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
    <div class="message-body" >
      <p><strong>Here you can switch tweaks!</strong> Click to change the settings.</p>
      <label class="checkbox" class:is-disabled={$globalStorage.hideTitleInNavbar} style="margin-top: 1rem;">
        <input type="checkbox" bind:checked={$globalStorage.showClockInNavbar}>
        Show Clock in Navbar
      </label>
      <label class="checkbox">
        <input type="checkbox" bind:checked={$globalStorage.hideTitleInNavbar}>
        Hide Title in Navbar
      </label>
      <label class="checkbox">
        <input type="checkbox" bind:checked={$globalStorage.showDetailedChatsInfo}>
        Show detailed information on chats
      </label>
      <p style="margin-top: 1rem;"><strong>Customize the action menu</strong></p>
      <label class="checkbox" class:is-disabled={$globalStorage.hideTitleInNavbar} style="margin-top: 1rem;">
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
    </div>
  </article>

  <!-- <article class="message" class:is-danger={!hasModels || apiError} class:is-warning={!openAiEndpoint} class:is-info={openAiEndpoint && !apiError}>
    <div class="message-body">
      Set the API BASE URI for alternative OpenAI-compatible endpoints:
      <form
        class="field has-addons has-addons-right"
        on:submit|preventDefault={async (event) => {
          let val = ''
          if (event.target && event.target[0].value) {
            val = (event.target[0].value).trim()
          }
          if (await testApiEndpoint(val)) {
            setGlobalSettingValueByKey('openAiEndpoint', val)
          }
        }}
      >
        <p class="control is-expanded">
          <input
            aria-label="API BASE URI"
            type="text"
            class="input"
            class:is-danger={apiError}
            placeholder="https://api.openai.com"
            value={openAiEndpoint}
          />
        </p>
        <p class="control">
          <button class="button is-info" type="submit">Save</button>
        </p>
      </form>
      {#if apiError}
        <p class:is-danger={apiError}>{apiError}</p>
      {/if}
    </div>
  </article>

  <article class="message" class:is-danger={!hasModels} class:is-warning={!showPetalsSettings} class:is-info={showPetalsSettings}>
    <div class="message-body">
      <label class="label" for="enablePetals">
        <input 
          type="checkbox"
          class="checkbox" 
          id="enablePetals"
          checked={!!$globalStorage.enablePetals} 
          on:click={setPetalsEnabled}
        >
        Use Petals API and Models (Llama 2)
      </label>
      {#if showPetalsSettings}
        <p>Set Petals API Endpoint:</p>
        <form
          class="field has-addons has-addons-right"
          on:submit|preventDefault={(event) => {
            if (event.target && event.target[0].value) {
              const v = event.target[0].value.trim()
              const v2 = v.replace(/^https:/i, 'wss:').replace(/(^wss:\/\/[^/]+)\/*$/i, '$1' + getPetalsWebsocket())
              setGlobalSettingValueByKey('pedalsEndpoint', v2)
              event.target[0].value = v2
            } else {
              setGlobalSettingValueByKey('pedalsEndpoint', '')
            }
          }}
        >
          <p class="control is-expanded">
            <input
              aria-label="PetalsAPI Endpoint"
              type="text"
              class="input"
              placeholder={getPetalsBase() + getPetalsWebsocket()}
              value={$globalStorage.pedalsEndpoint || ''}
            />
          </p>
          <p class="control">
            <button class="button is-info" type="submit">Save</button>
          </p>

          
        </form>
        
        {#if !pedalsEndpoint}
          <p class="help is-warning">
            Please only use the default public API for testing. It's best to <a target="_blank" href="https://github.com/petals-infra/chat.petals.dev">configure a private endpoint</a> and enter it above for connection to the Petals swarm.
          </p>
        {/if}
        <p class="my-4">
          <a target="_blank" href="https://petals.dev/">Petals</a> lets you run large language models at home by connecting to a public swarm, BitTorrent-style, without hefty GPU requirements.
        </p>
        <p class="mb-4">
          You are encouraged to <a target="_blank" href="https://github.com/bigscience-workshop/petals#connect-your-gpu-and-increase-petals-capacity">set up a Petals server to share your GPU resources</a> with the public swarm. Minimum requirements to contribute Llama 2 completions are a GTX&nbsp;1080&nbsp;8GB, but the larger/faster the better.
        </p>
        <p class="mb-4">
          If you're receiving errors while using Petals, <a target="_blank" href="https://health.petals.dev/">check swarm health</a> and consider <a target="_blank" href="https://github.com/bigscience-workshop/petals#connect-your-gpu-and-increase-petals-capacity">adding your GPU to the swarm</a> to help.
        </p>
        <p class="help is-warning">
          Because Petals uses a public swarm, <b>do not send sensitive information</b> when using Petals.
        </p>
      {/if}
    </div>
  </article> -->
  <!-- <div style="display: flex; justify-content: center; margin-top: 1rem;" class:is-disabled={!hasModels}>
    <button class="button is-primary" on:click={() => location.hash = '#/chat/new'}>New Chat</button>
  </div>   -->
</section>