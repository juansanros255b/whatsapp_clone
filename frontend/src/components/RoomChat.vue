<template>
  <div class="room-chat">
    <!-- Room header -->
    <div class="room-header">
      <div class="room-title">
        <span class="room-hash">#</span>
        <span>{{ room }}</span>
      </div>
      <button v-if="room !== 'General'" class="btn-leave" @click="$emit('leave', room)">
        Salir
      </button>
    </div>

    <!-- Messages area -->
    <div class="messages-area" ref="msgArea">
      <ChatMessage
        v-for="msg in messages"
        :key="msg.id"
        :msg="msg"
        :isOwn="msg.senderId === myId"
        :backendUrl="backendUrl"
      />
      <!-- Typing -->
      <div v-if="typersText" class="typing-indicator">
        <span class="dot"></span><span class="dot"></span><span class="dot"></span>
        <small>{{ typersText }}</small>
      </div>
      <div ref="bottom" />
    </div>

    <!-- Input -->
    <ChatInput
      :placeholder="`Mensaje en #${room}...`"
      :backendUrl="backendUrl"
      @send="onSend"
      @typing="$emit('typing', room)"
      @stopTyping="$emit('stopTyping', room)"
    />
  </div>
</template>

<script setup>
import { ref, nextTick, watch, computed } from 'vue'
import ChatMessage from './ChatMessage.vue'
import ChatInput from './ChatInput.vue'

const props = defineProps({
  room: { type: String, required: true },
  myId: { type: String, required: true },
  messages: { type: Array, default: () => [] },
  typers: { type: Object, default: () => ({}) },   // { userId: userName }
  backendUrl: { type: String, default: '' },
})
const emit = defineEmits(['send', 'leave', 'typing', 'stopTyping'])
const msgArea = ref(null)

watch(() => props.messages.length, async () => {
  await nextTick()
  if (msgArea.value) msgArea.value.scrollTop = msgArea.value.scrollHeight
})

const typersText = computed(() => {
  const names = Object.values(props.typers || {}).filter(Boolean)
  if (!names.length) return ''
  if (names.length === 1) return `${names[0]} está escribiendo...`
  return `${names.slice(0, -1).join(', ')} y ${names.at(-1)} están escribiendo...`
})

function onSend(payload) {
  emit('send', { room: props.room, ...payload })
}
</script>

<style scoped>
.room-chat {
  display: flex; flex-direction: column; height: 100%; background: #0b141a;
}
.room-header {
  display: flex; align-items: center; justify-content: space-between;
  background: #202c33; padding: 10px 20px; flex-shrink: 0; min-height: 56px;
}
.room-title { display: flex; align-items: center; gap: 4px; }
.room-hash { color: #25D366; font-size: 1.2rem; font-weight: 700; }
.room-title span { color: #e9edef; font-size: 1rem; font-weight: 600; }
.btn-leave {
  background: #2a3942; border: none; color: #8696a0;
  border-radius: 6px; padding: 5px 12px; cursor: pointer; font-size: .82rem;
}
.btn-leave:hover { color: #e9edef; background: #3b4a54; }
.messages-area {
  flex: 1; overflow-y: auto; padding: 12px 20px; display: flex; flex-direction: column; gap: 2px;
}
.typing-indicator {
  display: flex; align-items: center; gap: 4px; color: #8696a0; font-size: .8rem; padding: 4px 0;
}
.dot {
  width: 6px; height: 6px; background: #8696a0; border-radius: 50%;
  animation: bounce 1.2s infinite ease-in-out;
}
.dot:nth-child(2) { animation-delay: .2s; }
.dot:nth-child(3) { animation-delay: .4s; }
@keyframes bounce {
  0%, 80%, 100% { transform: translateY(0); }
  40% { transform: translateY(-6px); }
}
</style>
