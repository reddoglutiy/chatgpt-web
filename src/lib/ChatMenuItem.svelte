<script lang="ts">
  import { replace } from 'svelte-spa-router'
  import type { Chat } from './Types.svelte'
  import { deleteChat, pinMainMenu, saveChatStore } from './Storage.svelte'
  import Fa from 'svelte-fa/src/fa.svelte'
  import { faTrash, faCircleCheck, faPencil } from '@fortawesome/free-solid-svg-icons/index'
  import { faMessage } from '@fortawesome/free-regular-svg-icons/index'
  import { onMount } from 'svelte'
  import { hasActiveModels } from './Models.svelte'

  export let chat: Chat
  export let activeChatId: number | undefined
  export let prevChat: Chat | undefined
  export let nextChat: Chat | undefined

  let editing = false
  let original = ''
  let waitingForConfirm: any = 0

  onMount(() => {
    if (!chat.name) {
      chat.name = `Chat ${chat.id}`
    }
  })

  function formatDate(ts: number): string {
    const d = new Date(ts)
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const keydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      chat.name = original
      editing = false
    }
    if (event.key === 'Tab' || event.key === 'Enter') {
      event.preventDefault()
      update()
    }
  }

  const update = () => {
    editing = false
    if (!chat.name.trim()) {
      chat.name = original
      return
    }
    saveChatStore()
  }

  const delChat = () => {
    if (activeChatId === chat.id) {
      const newChat = nextChat || prevChat
      replace(newChat ? `/chat/${newChat.id}` : '/').then(() => deleteChat(chat.id))
    } else {
      deleteChat(chat.id)
    }
  }

  const edit = () => {
    original = chat.name
    editing = true
    setTimeout(() => {
      document.getElementById(`chat-menu-item-${chat.id}`)?.focus()
    }, 10)
  }
</script>

<li class="chat-list-item">
  {#if editing}
    <div
      id="chat-menu-item-{chat.id}"
      class="chat-name-editor"
      contenteditable
      bind:innerText={chat.name}
      on:blur={update}
      on:keydown={keydown}
    />
  {:else}
    <div
      class="chat-menu-item"
      class:is-active={activeChatId === chat.id}
      class:is-disabled={!hasActiveModels()}
      on:click={() => { $pinMainMenu = false; replace(`#/chat/${chat.id}`) }}
    >
      <div class="chat-text-group">
        <span class="chat-item-name">
          <Fa class="chat-icon" size="xs" icon={faMessage} />
          <span class="chat-text">{chat.name}</span>
        </span>
        <span class="chat-date">{formatDate(chat.created)}</span>
      </div>

      <div class="action-buttons">
        {#if waitingForConfirm}
          <button class="icon-button" on:click|stopPropagation={() => delChat()}>
            <Fa icon={faCircleCheck} />
          </button>
        {:else}
          <button class="icon-button" on:click|stopPropagation={() => edit()}>
            <Fa icon={faPencil} />
          </button>
          <button class="icon-button" on:click|stopPropagation={() => delChat()}>
            <Fa icon={faTrash} />
          </button>
        {/if}
      </div>
    </div>
  {/if}
</li>

<style>
  .chat-list-item {
    padding: 0.5rem 1rem;
    border-bottom: 1px solid rgba(128, 128, 128, 0.1);
  }

  .chat-menu-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    user-select: none;
    padding: 0.4rem 0;
    gap: 0.5rem;
  }

  .chat-menu-item.is-disabled {
    opacity: 0.5;
    pointer-events: none;
  }

  .chat-menu-item.is-active {
    background-color: rgba(0, 0, 0, 0.05);
  }

  .chat-name-editor {
    padding: 0.4rem 0.5rem;
    border: 1px solid #aaa;
    border-radius: 5px;
    width: 100%;
    font-size: 1rem;
    outline: none;
  }

  .chat-text-group {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-width: 0;
    flex: 1;
  }

  .chat-item-name {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    color: inherit;
  }

  .chat-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .chat-date {
    font-size: 0.75rem;
    color: #888;
    margin-top: 0.1rem;
    white-space: nowrap;
  }

  .chat-icon {
    flex-shrink: 0;
    color: inherit !important;
    fill: currentColor !important;
    pointer-events: none;
  }

  .action-buttons {
    display: flex;
    gap: 0.4rem;
    flex-shrink: 0;
  }

  .icon-button {
    background: none;
    border: none;
    padding: 0.5rem;
    cursor: pointer;
    opacity: 0.6;
    transition: opacity 0.2s;
    color: inherit;
  }

  .icon-button:hover {
    opacity: 1;
  }

  @media (hover: none) {
    .icon-button {
      opacity: 1;
    }
  }

  /* Fix Safari tap highlight */
  .chat-menu-item,
  .icon-button,
  .chat-item-name,
  .chat-text {
    -webkit-tap-highlight-color: transparent;
  }

  button:focus,
  a:focus {
    outline: none;
  }

  svg,
  path {
    color: inherit !important;
    fill: currentColor !important;
  }
</style>
