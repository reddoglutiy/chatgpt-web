<script lang="ts">
  import * as bulmaToast from 'bulma-toast';
  import { replace } from 'svelte-spa-router'
  import type { Chat } from './Types.svelte'
  import { deleteChat, globalStorage, pinMainMenu, saveChatStore } from './Storage.svelte'
  import Fa from 'svelte-fa/src/fa.svelte'
  import { faTrash, faPencil, faStar as faStarSolid } from '@fortawesome/free-solid-svg-icons'
  import { faMessage, faStar as faStarRegular } from '@fortawesome/free-regular-svg-icons'
  import { onMount, tick } from 'svelte'
  import { hasActiveModels } from './Models.svelte'

  export let chat: Chat
  export let activeChatId: number | undefined
  export let prevChat: Chat | undefined
  export let nextChat: Chat | undefined
  export let showDetails: boolean
  export let showExample: boolean

  let editing = false
  let draft = ''
  let inputEl: HTMLInputElement

  onMount(() => {
    if (!chat.name) chat.name = `Chat ${chat.id}`
    draft = chat.name
  })

  const optsDate = { year: 'numeric', month: 'short', day: 'numeric' }
  const optsShort = { year: '2-digit', month: '2-digit', day: '2-digit' }
  const optsWithTime = { year: '2-digit', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }
  const optsDetail = { ...optsWithTime, second: '2-digit' }
  const fmt = (ts: number, opts: Intl.DateTimeFormatOptions) => new Date(ts).toLocaleDateString('en-US', opts)

  $: createdDetail    = fmt(chat.created, optsDetail)
  $: lastUseDetail    = fmt(chat.lastUse, optsDetail)
  $: lastAccessDetail = fmt(chat.lastAccess, optsDetail)
  $: createdTime      = fmt(chat.created, optsWithTime)
  $: lastUseTime      = fmt(chat.lastUse, optsWithTime)
  $: lastAccessTime   = fmt(chat.lastAccess, optsWithTime)
  $: createdShort     = fmt(chat.created, optsDate)
  $: count = (() => {
    if (!chat.messages || !Array.isArray(chat.messages)) return '0 Messages';

    const visibleMessages = showDetails
      ? chat.messages
      : $globalStorage.hideSystemPromptInChat
        ? chat.messages.filter(msg => msg.role !== 'system')
        : chat.messages;

    if (!showDetails && $globalStorage.hideMessagesCountOnChat) return '';

    const msgCount = visibleMessages.length;
    return msgCount > 99 ? '99+ Messages' : `${msgCount} Messages`;
  })();

  function showDelChatToast(chatname: string) {
    bulmaToast.toast({
      message: `<strong>${chatname}</strong> Deleted`,
      type: 'is-danger',
      duration: 3000,
      position: 'bottom-center',
      dismissible: false,
      pauseOnHover: false,
      animate: { in: 'fadeInUp', out: 'fadeOutDown' },
      opacity: 0.8,
    });
  }
  
  async function startEdit() {
    draft = chat.name
    editing = true
    await tick()
    inputEl.focus()
  }

  function saveEdit() {
    if (draft.trim()) {
      chat.name = draft.trim()
      saveChatStore()
    }
    editing = false
  }

  const toggleFavorite = () => {
    chat.isFavorite = !chat.isFavorite
    saveChatStore()
  }

  function delChat() {
    if (window.confirm(`Delete chat “${chat.name}”?`)) {
      showDelChatToast(chat.name)
      if (activeChatId === chat.id) {
        const n = nextChat || prevChat
        replace(n ? `/chat/${n.id}` : '/').then(() => deleteChat(chat.id))
      } else {
        deleteChat(chat.id)
      }
    }
  }
</script>

<li class="chat-list-item">
  <div
    class="chat-menu-item"
    class:is-active={activeChatId === chat.id}
    on:click|preventDefault={() => {
      if (!showDetails && !showExample) {
        $pinMainMenu = false;
        replace(`#/chat/${chat.id}`);
      }
    }}
  >
    <div class="chat-text-group">
      <span class="chat-item-name">
        <Fa class="chat-icon" size="xs" icon={faMessage} />
        {#if editing}
          <input
            class="edit-input"
            placeholder={chat.name}
            bind:this={inputEl}
            bind:value={draft}
            on:blur={saveEdit}
            on:keydown={(e) => e.key === 'Enter' && saveEdit()}
          />
        {:else}
          <span class="chat-text">{chat.name}</span>
        {/if}
      </span>

      {#if showDetails}
        <span class="chat-info">Created: {createdDetail}</span>
        <span class="chat-info">Last use: {lastUseDetail}</span>
        <span class="chat-info">Last access: {lastAccessDetail}</span>
        <span class="chat-info">{count}</span>
      {:else if $globalStorage.showDetailedChatsInfo}
        <span class="chat-info">Created: {createdTime}</span>
        <span class="chat-info">Used: {lastUseTime}</span>
        <span class="chat-info">Accessed: {lastAccessTime}</span>      
        <span class="chat-info">{count}</span>
      {:else}
        <span class="chat-info">
          {createdShort}
          {#if !$globalStorage.hideMessagesCountOnChat && !showDetails}
            • {count}
          {/if}
        </span>
      {/if}
    </div>

    <div class="action-buttons" class:is-disabled-no-opacity={showExample}>
      {#if !$globalStorage.hideChatRenameButton}
        <button
          class="icon-button"
          hidden={showDetails}
          on:click|stopPropagation={startEdit}
        >
          <Fa icon={faPencil} />
        </button>
      {/if}
      {#if !$globalStorage.hideChatFavoriteButton}
        <button
          class="icon-button"
          hidden={showDetails}
          on:click|stopPropagation={toggleFavorite}
        >
          <Fa icon={chat.isFavorite ? faStarSolid : faStarRegular} />
        </button>
      {/if}
      {#if !$globalStorage.hideChatDeleteButton}
        <button class="icon-button" on:click|stopPropagation={delChat}>
          <Fa icon={faTrash} />
        </button>
      {/if}
    </div>
  </div>
</li>
