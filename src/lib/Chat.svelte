<script lang="ts">
  import * as bulmaToast from 'bulma-toast';

  import {
    saveChatStore,
    chatsStorage,
    addMessage,
    updateChatSettings,
    checkStateChange,
    showSetChatSettings,
    submitExitingPromptsNow,
    continueMessage,
    getMessage,
    currentChatMessages,
    setCurrentChat,
    currentChatId
  } from './Storage.svelte'
  import {
    type Message,
    type Chat
  } from './Types.svelte'
  import Prompts from './Prompts.svelte'
  import Messages from './Messages.svelte'
  import { restartProfile } from './Profiles.svelte'
  import { afterUpdate, onMount, onDestroy } from 'svelte'
  import Fa from 'svelte-fa/src/fa.svelte'
  import {
    faArrowUpFromBracket,
    faPaperPlane,
    faGear,
    faPenToSquare,
    faMicrophone,
    faLightbulb,
    faCommentSlash,
    faCircleCheck,
    faSeedling,
    faPaperclip,
    faLocationArrow,
    faArrowRight,
    faClose
  } from '@fortawesome/free-solid-svg-icons/index'
  import { v4 as uuidv4 } from 'uuid'
  import { getPrice } from './Stats.svelte'
  import { autoGrowInputOnEvent, scrollToBottom, sizeTextElements } from './Util.svelte'
  import ChatSettingsModal from './ChatSettingsModal.svelte'
  import Footer from './Footer.svelte'
  import { openModal } from 'svelte-modals'
  import PromptInput from './PromptInput.svelte'
  import { ChatRequest } from './ChatRequest.svelte'
  import { getModelDetail } from './Models.svelte'
    import { faHandPaper } from '@fortawesome/free-regular-svg-icons';

  export let params = { chatId: '' }
  const chatId: number = parseInt(params.chatId)

  let chatRequest = new ChatRequest()
  let input: HTMLTextAreaElement
  let recognition: any = null
  let recording = false
  let lastSubmitRecorded = false

  $: chat = $chatsStorage.find((chat) => chat.id === chatId) as Chat
  $: chatSettings = chat?.settings
  let showSettingsModal
  
  let scDelay
  let isDark = false;

  onMount(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    isDark = prefersDark;
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      isDark = e.matches;
    });
  });
  const onStateChange = async (...args:any) => {
    if (!chat) return
    clearTimeout(scDelay)
    setTimeout(async () => {
      if (chat.startSession) {
        await restartProfile(chatId)
        if (chat.startSession) {
          chat.startSession = false
          saveChatStore()
          // Auto start the session
          submitForm(false, true)
        }
      }
      if ($showSetChatSettings) {
        $showSetChatSettings = false
        showSettingsModal()
      }
      if ($submitExitingPromptsNow) {
        $submitExitingPromptsNow = false
        submitForm(false, true)
      }
      if ($continueMessage) {
        const message = getMessage(chatId, $continueMessage)
        $continueMessage = ''
        if (message && $currentChatMessages.indexOf(message) === ($currentChatMessages.length - 1)) {
          submitForm(lastSubmitRecorded, true, message)
        }
      }
    })
  }
  
  $: onStateChange($checkStateChange, $showSetChatSettings, $submitExitingPromptsNow, $continueMessage)

  const afterChatLoad = (...args:any) => {
    scrollToBottom()
  }

  $: afterChatLoad($currentChatId)

  setCurrentChat(0)
  // Make sure chat object is ready to go
  updateChatSettings(chatId)

  onDestroy(async () => {
    // clean up
    // abort any pending requests.
    chatRequest.controller.abort()
    ttsStop()
  })

  onMount(async () => {
    if (!chat) return

    setCurrentChat(chatId)

    chatRequest = new ChatRequest()
    await chatRequest.setChat(chat)

    chat.lastAccess = Date.now()
    saveChatStore()
    $checkStateChange++

    // Focus the input on mount
    focusInput()

    // Try to detect speech recognition support
    if ('SpeechRecognition' in window) {
      // @ts-ignore
      recognition = new window.SpeechRecognition()
    } else if ('webkitSpeechRecognition' in window) {
      // @ts-ignore
      recognition = new window.webkitSpeechRecognition() // eslint-disable-line new-cap
    }

    if (recognition) {
      recognition.interimResults = false
      recognition.onstart = () => {
        recording = true
      }
      recognition.onresult = (event) => {
        // Stop speech recognition, submit the form and remove the pulse
        const last = event.results.length - 1
        const text = event.results[last][0].transcript
        input.value = text
        recognition.stop()
        recording = false
        submitForm(true)
      }
    } else {
      console.log('Speech recognition not supported')
    }
    if (chat.startSession) {
      await restartProfile(chatId)
      if (chat.startSession) {
        chat.startSession = false
        saveChatStore()
        // Auto start the session
        setTimeout(() => { submitForm(false, true) }, 0)
      }
    }
  })

  // Scroll to the bottom of the chat on update
  afterUpdate(() => {
    sizeTextElements()
    // Scroll to the bottom of the page after any updates to the messages array
    // focusInput()
  })

  // Scroll to the bottom of the chat on update
  const focusInput = () => {
    input.focus()
    scrollToBottom()
  }

  function showToast() {
    bulmaToast.toast({
      message: 'Test message',
      type: 'is-info',
      duration: 3000,
      position: 'bottom-center',
      dismissible: false,
      pauseOnHover: false,
      animate: { in: 'fadeInDown', out: 'flipOutX' },
    });
  }

  const addNewMessage = () => {
    if (chatRequest.updating) return
    let inputMessage: Message
    const lastMessage = $currentChatMessages[$currentChatMessages.length - 1]
    const uuid = uuidv4()
    if ($currentChatMessages.length === 0) {
      inputMessage = { role: 'system', content: input.value, uuid }
    } else if (lastMessage && lastMessage.role === 'user') {
      inputMessage = { role: 'assistant', content: input.value, uuid }
    } else {
      inputMessage = { role: 'user', content: input.value, uuid }
    }
    addMessage(chatId, inputMessage)

    // Clear the input value
    input.value = ''
    // input.blur()
    focusInput()
  }

  const ttsStart = (text:string, recorded:boolean) => {
    // Use TTS to read the response, if query was recorded
    if (recorded && 'SpeechSynthesisUtterance' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      window.speechSynthesis.speak(utterance)
    }
  }

  const ttsStop = () => {
    if ('SpeechSynthesisUtterance' in window) {
      window.speechSynthesis.cancel()
    }
  }

  let waitingForCancel:any = 0

  const cancelRequest = () => {
    if (!waitingForCancel) {
      // wait a second for another click to avoid accidental cancel
      waitingForCancel = setTimeout(() => { waitingForCancel = 0 }, 1000)
      return
    }
    clearTimeout(waitingForCancel); waitingForCancel = 0
    chatRequest.controller.abort()
  }

  const submitForm = async (recorded: boolean = false, skipInput: boolean = false, fillMessage: Message|undefined = undefined): Promise<void> => {
    // Compose the system prompt message if there are no messages yet - disabled for now
    if (chatRequest.updating) return

    lastSubmitRecorded = recorded
  
    if (!skipInput) {
      chat.sessionStarted = true
      saveChatStore()
      if (input.value !== '') {
        // Compose the input message
        const inputMessage: Message = { role: 'user', content: input.value, uuid: uuidv4() }
        addMessage(chatId, inputMessage)
      } else if (!fillMessage && $currentChatMessages.length &&
        $currentChatMessages[$currentChatMessages.length - 1].role === 'assistant') {
        fillMessage = $currentChatMessages[$currentChatMessages.length - 1]
      }
  
      // Clear the input value
      input.value = ''
      input.blur()
  
      // Resize back to single line height
      input.style.height = 'auto'
    }
    focusInput()

    chatRequest.updating = true
    chatRequest.updatingMessage = ''

    let doScroll = true
    let didScroll = false

    const checkUserScroll = (e: Event) => {
      const el = e.target as HTMLElement
      if (el && e.isTrusted && didScroll) {
        // from user
        doScroll = (window.innerHeight + window.scrollY + 10) >= document.body.offsetHeight
      }
    }

    window.addEventListener('scroll', checkUserScroll)

    try {
      const response = await chatRequest.sendRequest($currentChatMessages, {
        chat,
        autoAddMessages: true, // Auto-add and update messages in array
        streaming: chatSettings.stream,
        fillMessage,
        onMessageChange: (messages) => {
          if (doScroll) scrollToBottom(true)
          didScroll = !!messages[0]?.content
        }
      })
      await response.promiseToFinish()
      const message = response.getMessages()[0]
      if (message) {
        ttsStart(message.content, recorded)
      }
    } catch (e) {
      console.error(e)
    }
  
    window.removeEventListener('scroll', checkUserScroll)

    chatRequest.updating = false
    chatRequest.updatingMessage = ''

    focusInput()
  }

  const suggestName = async (): Promise<void> => {
    const suggestMessage: Message = {
      role: 'user',
      content: "Using appropriate language, please tell me a short 6 word summary of this conversation's topic for use as a book title. Only respond with the summary.",
      uuid: uuidv4()
    }

    const suggestMessages = $currentChatMessages.slice(0, 10) // limit to first 10 messages
    suggestMessages.push(suggestMessage)

    chatRequest.updating = true
    chatRequest.updatingMessage = 'Getting suggestion for chat name...'
    const response = await chatRequest.sendRequest(suggestMessages, {
      chat,
      autoAddMessages: false,
      streaming: false,
      summaryRequest: true
    })

    try {
      await response.promiseToFinish()
    } catch (e) {
      console.error('Error generating name suggestion', e, e.stack)
    }
    chatRequest.updating = false
    chatRequest.updatingMessage = ''
    if (response.hasError()) {
      addMessage(chatId, {
        role: 'error',
        content: `Unable to get suggested name: ${response.getError()}`,
        uuid: uuidv4()
      })
    } else {
      response.getMessages().forEach(m => {
        const name = m.content.split(/\s+/).slice(0, 8).join(' ').replace(/^[^a-z0-9!?]+|[^a-z0-9!?]+$/gi, '').trim()
        if (name) chat.name = name
      })
      saveChatStore()
    }
  }

  function promptRename () {
    openModal(PromptInput, {
      title: 'Enter Name for Chat',
      label: 'Name',
      value: chat.name,
      class: 'is-info',
      onSubmit: (value) => {
        chat.name = (value || '').trim() || chat.name
        saveChatStore()
        $checkStateChange++
      }
    })
  }

  const recordToggle = () => {
    ttsStop()
    if (chatRequest.updating) return
    // Check if already recording - if so, stop - else start
    if (recording) {
      recognition?.stop()
      recording = false
    } else {
      recognition?.start()
    }
  }

</script>
{#if chat}
<ChatSettingsModal chatId={chatId} bind:show={showSettingsModal} />
<div class="chat-page" style="--running-totals: {Object.entries(chat.usage || {}).length}">
<div class="chat-content">
<!-- <nav class="level chat-header">
  <div class="level-left">
    <div class="level-item">
      <p class="subtitle is-5">
        <span>{chat.name || `Chat ${chat.id}`}</span>
        <a href={'#'} class="greyscale ml-2 is-hidden has-text-weight-bold editbutton" title="Rename chat" on:click|preventDefault={promptRename}><Fa icon={faPenToSquare} /></a>
        <a href={'#'} class="greyscale ml-2 is-hidden has-text-weight-bold editbutton" title="Suggest a chat name" on:click|preventDefault={suggestName}><Fa icon={faLightbulb} /></a>
        <a href={'#'} class="greyscale ml-2 is-hidden has-text-weight-bold editbutton" title="Copy this chat" on:click|preventDefault={() => { copyChat(chatId) }}><Fa icon={faClone} /></a>
        <a href={'#'} class="greyscale ml-2 is-hidden has-text-weight-bold editbutton" title="Delete this chat" on:click|preventDefault={deleteChat}><Fa icon={faTrash} /></a>
      </p>
    </div>
  </div>
  <div class="level-item has-text-centered">
    <div>
      <p class="is-size-6 has-text-weight-semibold mb-2">Welcome to your chat</p>
      <p class="control queue">
        <button title="Chat/Profile Settings" class="button" on:click|preventDefault={showSettingsModal}>
          <span class="icon"><Fa icon={faGear} /></span>
          <span class="ml-2">Settings</span>
        </button>
      </p>
    </div>
  </div>  
  <div class="level-item"><p><strong>{chat.settings.model}</strong></p></div>
</nav> -->
<section class="section is-flex is-justify-content-center" style="align-items: flex-start; padding-top: 3rem;">
  <div class="has-text-centered">
    <span>{chat.name || `Chat ${chat.id}`}</span>
    <p class="is-size-5 has-text-weight-medium mt-5">
      <strong>{chat?.settings?.model || "gpt-3.5-turbo"}</strong>
    </p>
    <div class="mt-4">
      <a on:click|preventDefault={showSettingsModal} class="button is-primary is-medium">
        Settings
      </a>
    </div>
  </div>
</section>


<Messages messages={$currentChatMessages} chatId={chatId} chat={chat} />

{#if chatRequest.updating === true || $currentChatId === 0}
  <article class="message is-success assistant-message">
    <div class="message-body content">
      <span class="is-loading" ></span>
      <span>{chatRequest.updatingMessage}</span>
    </div>
  </article>
{/if}
</div>
<Footer class="prompt-input-container" strongMask={false}>
  <form class="field has-addons has-addons-right is-align-items-flex-end" style="margin-bottom: 2rem; margin-top: 1rem;" on:submit|preventDefault={() => submitForm()}>
    <p class="control is-expanded">
      <textarea
        class="is-info is-focused chat-input auto-size"
        placeholder="Ask anything"
        rows="1"
        on:keydown={e => {
          // Only send if Enter is pressed, not Shift+Enter
          const isDesktop = window.innerWidth > 768;
          if (isDesktop && e.key === 'Enter' && !e.shiftKey) {
            e.stopPropagation()
            submitForm()
            e.preventDefault()
          }
        }}
        on:input={e => autoGrowInputOnEvent(e)}
        bind:this={input}
      />
    </p>
    {#if chatRequest.updating}
    <p class="send">
      <button title="Cancel Response" style="width: 35px; height: 35px;" class="button is-rounded {isDark ? 'is-light' : 'is-dark'}" type="button" on:click={cancelRequest}><span class="icon">
        {#if waitingForCancel}
        <Fa icon={faCircleCheck} />
        {:else}
        <Fa icon={faClose} />
        {/if}
      </span></button>
    </p>
    {:else}
    <p class="send">
      <button title="Send" style="width: 35px; height: 35px;" class="button is-rounded {isDark ? 'is-light' : 'is-dark'}" type="submit"><span class="icon"><Fa icon={faArrowRight} /></span></button>
    </p>
    {/if}
    <!-- <p class="control mic" class:is-hidden={!recognition}>
      <button class="button" class:is-disabled={chatRequest.updating} class:is-pulse={recording} on:click|preventDefault={recordToggle}
        ><span class="icon"><Fa icon={faMicrophone} /></span></button
      >
    </p> -->
    <!-- <p class="control queue">
      <button title="Queue message, don't send yet" class:is-disabled={chatRequest.updating} class="button is-ghost" on:click|preventDefault={addNewMessage}><span class="icon"><Fa icon={faArrowUpFromBracket} /></span></button>
    </p> -->
  </form>
  <!-- a target to scroll to -->
  <!-- <div class="content has-text-centered running-total-container">
    <p class="is-size-7">{(chat?.settings?.model || "gpt-3.5-turbo").toUpperCase()}</p>
    {#each Object.entries(chat.usage || {}) as [model, usage]}
    <p class="is-size-7 running-totals">
      <em>{getModelDetail(model || '').label || model}</em> total <span class="has-text-weight-bold">{usage.total_tokens}</span>
      tokens ~= <span class="has-text-weight-bold">${getPrice(usage, model).toFixed(6)}</span>
    </p>
    {/each} 
  </div> -->
</Footer>
</div>
{/if}