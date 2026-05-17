<template>
  <div class="private-window">
    <!-- Header -->
    <div class="priv-header">
      <img :src="peer.avatar" class="priv-avatar" :alt="peer.name" />
      <div class="priv-info">
        <span class="priv-name">{{ peer.name }}</span>
        <span class="priv-status">{{ peer.status || 'En línea' }}</span>
      </div>
      <button class="btn-close" @click="$emit('close')">✕</button>
    </div>

    <!-- Messages -->
    <div class="priv-messages" ref="msgList">
      <ChatMessage
        v-for="msg in messages"
        :key="msg.id"
        :msg="msg"
        :isOwn="msg.senderId === myId"
        :backendUrl="backendUrl"
      />
      <div v-if="typingState" class="typing-indicator">
        <span class="dot"></span><span class="dot"></span><span class="dot"></span>
        <small>{{ peer.name }} está escribiendo</small>
      </div>
    </div>

    <!-- Input -->
    <ChatInput
      :placeholder="`Mensaje a ${peer.name}...`"
      :backendUrl="backendUrl"
      @send="onSend"
      @typing="$emit('typing', peer.id)"
      @stopTyping="$emit('stopTyping', peer.id)"
    />
  </div>
</template>

<script setup>
import { ref, nextTick, watch } from 'vue'
import ChatMessage from './ChatMessage.vue'
import ChatInput from './ChatInput.vue'

const props = defineProps({
  peer: { type: Object, required: true },
  myId: { type: String, required: true },
  messages: { type: Array, default: () => [] },
  typingState: { type: Boolean, default: false },
  backendUrl: { type: String, default: '' },
})
const emit = defineEmits(['send', 'close', 'typing', 'stopTyping'])
const msgList = ref(null)

watch(() => props.messages.length, async () => {
  await nextTick()
  if (msgList.value) msgList.value.scrollTop = msgList.value.scrollHeight
})

function onSend(payload) {
  emit('send', { toId: props.peer.id, ...payload })
}
</script>

<style scoped>
.private-window {
  display: flex; flex-direction: column;
  background: #0b141a; height: 100%;
}
.priv-header {
  display: flex; align-items: center; gap: 12px;
  background: #202c33; padding: 10px 16px; flex-shrink: 0;
}
.priv-avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
.priv-info { flex: 1; }
.priv-name { display: block; color: #e9edef; font-weight: 600; font-size: .95rem; }
.priv-status { font-size: .78rem; color: #8696a0; }
.btn-close {
  background: none; border: none; color: #8696a0;
  font-size: 1.1rem; cursor: pointer; padding: 4px 8px; border-radius: 4px;
}
.btn-close:hover { color: #e9edef; background: #2a3942; }
.priv-messages {
  flex: 1; overflow-y: auto; padding: 12px 16px; display: flex; flex-direction: column; gap: 2px;
}
.typing-indicator {
  display: flex; align-items: center; gap: 4px; color: #8696a0; font-size: .8rem; padding: 4px 0;
}
.dot {
  width: 6px; height: 6px; background: #8696a0; border-radius: 50%;
  animation: bounce 1.2s infinite;
}
.dot:nth-child(2) { animation-delay: .2s; }
.dot:nth-child(3) { animation-delay: .4s; }
@keyframes bounce {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-6px); }
}
</style>
