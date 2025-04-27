<script lang="ts">
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
  $: lastAccessTime   = fmt(chat.lastAccess, optsShort)
  $: createdShort     = fmt(chat.created, optsDate)
  $: count            = chat.messages.length > 99 ? '99+ Messages' : `${chat.messages.length} Messages`

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
  {#if editing}
    <input
      bind:this={inputEl}
      bind:value={draft}
      on:blur={saveEdit}
      on:keydown={(e) => e.key === 'Enter' && saveEdit()}
    />
  {:else}
    <div
      class="chat-menu-item"
      class:is-active={activeChatId === chat.id}
      class:is-disabled={!hasActiveModels()}
      on:click|preventDefault={() => {
        if (!showDetails) {
          $pinMainMenu = false
          replace(`#/chat/${chat.id}`)
        }
      }}
    >
      <div class="chat-text-group">
        <span class="chat-item-name">
          <Fa class="chat-icon" size="xs" icon={faMessage} />
          <span class="chat-text">{chat.name}</span>
        </span>
        {#if showDetails}
          <span class="chat-info">Created: {createdDetail}</span>
          <span class="chat-info">Last use: {lastUseDetail}</span>
          <span class="chat-info">Last access: {lastAccessDetail}</span>
          <span class="chat-info">{count}</span>
        {:else if $globalStorage.showDetailedChatsInfo}
          <span class="chat-info">Created: {createdTime}</span>
          <span class="chat-info">Last use: {lastUseTime}</span>
          <span class="chat-info">Last access: {lastAccessTime}</span>
          <span class="chat-info">{count}</span>
        {:else}
          <span class="chat-info">{createdShort} • {count}</span>
        {/if}
      </div>
      <div class="action-buttons" class:is-disabled={showDetails}>
        {#if !$globalStorage.hideChatRenameButton}
          <button class="icon-button" disabled={showDetails} on:click|stopPropagation={startEdit}>
            <Fa icon={faPencil} />
          </button>
        {/if}
        {#if !$globalStorage.hideChatFavoriteButton}
          <button class="icon-button" disabled={showDetails} on:click|stopPropagation={toggleFavorite}>
            <Fa icon={chat.isFavorite ? faStarSolid : faStarRegular} />
          </button>
        {/if}
        {#if !$globalStorage.hideChatDeleteButton}
          <button class="icon-button" disabled={showDetails} on:click|stopPropagation={delChat}>
            <Fa icon={faTrash} />
          </button>
        {/if}
      </div>
    </div>
  {/if}
</li>
