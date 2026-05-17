<template>
  <div class="msg-wrapper" :class="{ own: isOwn, system: msg.type === 'system' }">
    <!-- System message -->
    <div v-if="msg.type === 'system'" class="msg-system">{{ msg.text }}</div>

    <!-- Normal message -->
    <template v-else>
      <img v-if="!isOwn" :src="msg.senderAvatar" class="msg-avatar" :alt="msg.senderName" />
      <div class="msg-bubble" :class="{ own: isOwn }">
        <div v-if="!isOwn" class="msg-author">{{ msg.senderName }}</div>
        <p v-if="msg.text" class="msg-text">{{ msg.text }}</p>
        <!-- File attachment -->
        <div v-if="msg.file" class="msg-file">
          <template v-if="msg.file.isImage">
            <a :href="backendUrl + msg.file.url" target="_blank" :download="msg.file.originalname">
              <img :src="backendUrl + msg.file.url" class="msg-img" :alt="msg.file.originalname" />
            </a>
          </template>
          <template v-else>
            <a :href="backendUrl + msg.file.url" :download="msg.file.originalname" class="file-download">
              📎 {{ msg.file.originalname }}
            </a>
          </template>
        </div>
        <span class="msg-time">{{ formatTime(msg.timestamp) }}</span>
      </div>
    </template>
  </div>
</template>

<script setup>
const props = defineProps({
  msg: { type: Object, required: true },
  isOwn: { type: Boolean, default: false },
  backendUrl: { type: String, default: '' },
})

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.msg-wrapper {
  display: flex; align-items: flex-end; gap: 8px; margin-bottom: 4px;
}
.msg-wrapper.own { flex-direction: row-reverse; }
.msg-wrapper.system { justify-content: center; }
.msg-system {
  background: rgba(17,27,33,.85); color: #8696a0;
  font-size: .76rem; padding: 4px 12px; border-radius: 8px;
  text-align: center; max-width: 80%;
}
.msg-avatar {
  width: 30px; height: 30px; border-radius: 50%; object-fit: cover; flex-shrink: 0;
}
.msg-bubble {
  max-width: 65%; background: #202c33; border-radius: 8px 8px 8px 0;
  padding: 6px 10px 4px; position: relative;
}
.msg-bubble.own {
  background: #005c4b; border-radius: 8px 8px 0 8px;
}
.msg-author { font-size: .75rem; color: #25D366; font-weight: 600; margin-bottom: 2px; }
.msg-text { margin: 0 0 2px; color: #e9edef; font-size: .93rem; white-space: pre-wrap; word-break: break-word; }
.msg-time { font-size: .7rem; color: #8696a0; float: right; margin-left: 8px; margin-top: 2px; }
.msg-img { max-width: 240px; max-height: 200px; border-radius: 6px; display: block; cursor: pointer; }
.file-download {
  color: #25D366; text-decoration: none; font-size: .85rem; display: flex; align-items: center; gap: 4px;
}
.file-download:hover { text-decoration: underline; }
</style>
