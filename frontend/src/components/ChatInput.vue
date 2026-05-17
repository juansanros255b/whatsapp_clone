<template>
  <div class="input-bar">
    <!-- Attach button -->
    <button class="btn-icon" @click="$refs.fileInput.click()" title="Adjuntar archivo">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
    <input ref="fileInput" type="file" hidden @change="handleFile" />

    <!-- File preview badge -->
    <div v-if="pendingFile" class="file-badge">
      <span>📎 {{ pendingFile.name }}</span>
      <button @click="pendingFile = null">✕</button>
    </div>

    <input
      v-model="text"
      class="msg-input"
      type="text"
      :placeholder="placeholder"
      @keydown="onKeydown"
      @keyup.enter="send"
    />
    <button class="btn-send" @click="send" :disabled="!text.trim() && !pendingFile">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
      </svg>
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  placeholder: { type: String, default: 'Escribe un mensaje...' },
  backendUrl: { type: String, default: '' },
})
const emit = defineEmits(['send', 'typing', 'stopTyping'])

const text = ref('')
const pendingFile = ref(null)
let typingTimeout = null

function handleFile(e) {
  const file = e.target.files[0]
  if (file) pendingFile.value = file
  e.target.value = ''
}

function onKeydown(e) {
  if (e.key === 'Enter') return
  emit('typing')
  clearTimeout(typingTimeout)
  typingTimeout = setTimeout(() => emit('stopTyping'), 1500)
}

async function send() {
  const t = text.value.trim()
  if (!t && !pendingFile.value) return

  let fileData = null
  if (pendingFile.value) {
    const formData = new FormData()
    formData.append('file', pendingFile.value)
    try {
      const res = await fetch(`${props.backendUrl}/api/upload`, { method: 'POST', body: formData })
      fileData = await res.json()
    } catch (err) {
      console.error('Upload failed', err)
    }
  }

  emit('send', { text: t || null, file: fileData })
  text.value = ''
  pendingFile.value = null
  clearTimeout(typingTimeout)
  emit('stopTyping')
}
</script>

<style scoped>
.input-bar {
  display: flex; align-items: center; gap: 8px;
  background: #202c33; padding: 10px 16px; flex-shrink: 0;
}
.btn-icon {
  background: none; border: none; color: #8696a0; cursor: pointer;
  padding: 6px; border-radius: 50%; display: flex; align-items: center;
  transition: color .2s;
}
.btn-icon:hover { color: #e9edef; }
.msg-input {
  flex: 1; background: #2a3942; border: none; border-radius: 8px;
  color: #e9edef; padding: 9px 14px; font-size: .93rem; outline: none;
}
.msg-input::placeholder { color: #546570; }
.btn-send {
  background: #25D366; border: none; color: #fff;
  width: 40px; height: 40px; border-radius: 50%; cursor: pointer;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  transition: background .2s;
}
.btn-send:hover:not(:disabled) { background: #20bc59; }
.btn-send:disabled { background: #3b4a54; cursor: not-allowed; }
.file-badge {
  background: #2a3942; border-radius: 6px; padding: 4px 10px;
  display: flex; align-items: center; gap: 6px;
  font-size: .8rem; color: #e9edef; max-width: 180px;
}
.file-badge button {
  background: none; border: none; color: #8696a0; cursor: pointer; font-size: .9rem;
}
</style>
