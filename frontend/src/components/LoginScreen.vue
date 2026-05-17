<template>
  <div class="login-overlay">
    <div class="login-card">
      <!-- Logo -->
      <div class="login-logo">
        <svg viewBox="0 0 55 55" fill="none" xmlns="http://www.w3.org/2000/svg" width="64" height="64">
          <circle cx="27.5" cy="27.5" r="27.5" fill="#25D366"/>
          <path d="M27.5 10C18.4 10 11 17.4 11 26.5c0 3.6 1.1 7 3.1 9.8L11 45l9-2.9c2.7 1.7 5.9 2.7 9.2 2.7 9.1 0 16.5-7.4 16.5-16.5S36.6 10 27.5 10zm8.2 22.5c-.4.9-2 1.7-2.7 1.8-.7.1-1.4.2-4.5-1C25 32 22 29 21.2 27.8c-.8-1.2-1.3-2.5-1.3-3.8 0-1.3.5-2.4 1.4-3.3.3-.3.7-.5 1.1-.5h.7c.4 0 .6.1.9.8l1.2 2.9c.1.3.1.6-.1.8l-.6.8c-.2.3-.2.5 0 .8.8 1.3 1.8 2.3 3.2 3 1.3.7 1.8.6 2.2.2l.6-.9c.3-.4.6-.5 1-.3l3 1.4c.4.2.6.4.6.9 0 .4-.1.8-.5 1.1z" fill="white"/>
        </svg>
        <h1>WhatsApp <span>Web Clone</span></h1>
      </div>

      <p class="login-subtitle">Introduce tus datos para continuar</p>

      <div class="form-group">
        <label>Nombre</label>
        <input
          v-model="name"
          type="text"
          placeholder="Tu nombre..."
          maxlength="30"
          @keyup.enter="tryLogin"
        />
      </div>

      <div class="form-group">
        <label>Estado</label>
        <input
          v-model="status"
          type="text"
          placeholder="Disponible"
          maxlength="60"
          @keyup.enter="tryLogin"
        />
      </div>

      <!-- Avatar selector -->
      <div class="form-group">
        <label>Avatar</label>
        <div class="avatar-grid">
          <div
            v-for="av in avatars"
            :key="av.id"
            class="avatar-option"
            :class="{ selected: selectedAvatar === av.url }"
            @click="selectedAvatar = av.url"
          >
            <img :src="av.url" :alt="av.id" />
          </div>
        </div>
      </div>

      <!-- Custom avatar upload -->
      <div class="form-group custom-upload">
        <label>O sube tu propia imagen</label>
        <div class="upload-area" @click="$refs.fileInput.click()">
          <img v-if="customAvatarPreview" :src="customAvatarPreview" class="custom-preview" />
          <span v-else>📁 Haz clic para subir imagen</span>
          <input ref="fileInput" type="file" accept="image/*" @change="handleCustomAvatar" hidden />
        </div>
      </div>

      <p v-if="error" class="login-error">{{ error }}</p>

      <button class="btn-login" @click="tryLogin" :disabled="!name.trim()">
        Entrar al chat
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { AVATARS } from '../avatars.js'

const emit = defineEmits(['login'])

const name = ref('')
const status = ref('Disponible')
const selectedAvatar = ref(AVATARS[0].url)
const customAvatarPreview = ref(null)
const error = ref('')
const avatars = AVATARS

function handleCustomAvatar(e) {
  const file = e.target.files[0]
  if (!file) return
  if (!file.type.startsWith('image/')) {
    error.value = 'Solo se permiten imágenes.'
    return
  }
  const reader = new FileReader()
  reader.onload = (ev) => {
    customAvatarPreview.value = ev.target.result
    selectedAvatar.value = ev.target.result
  }
  reader.readAsDataURL(file)
}

function tryLogin() {
  error.value = ''
  if (!name.value.trim()) {
    error.value = 'El nombre es obligatorio.'
    return
  }
  emit('login', {
    name: name.value.trim(),
    status: status.value.trim() || 'Disponible',
    avatar: selectedAvatar.value,
  })
}
</script>

<style scoped>
.login-overlay {
  position: fixed; inset: 0;
  background: #111b21;
  display: flex; align-items: center; justify-content: center;
  z-index: 9999;
}
.login-card {
  background: #202c33;
  border-radius: 16px;
  padding: 2rem 2.5rem;
  width: 420px;
  max-width: 95vw;
  max-height: 92vh;
  overflow-y: auto;
  box-shadow: 0 8px 40px rgba(0,0,0,.5);
}
.login-logo {
  display: flex; align-items: center; gap: 1rem;
  margin-bottom: .5rem;
}
.login-logo h1 {
  font-size: 1.5rem; font-weight: 700; color: #e9edef; margin: 0;
}
.login-logo h1 span { color: #25D366; }
.login-subtitle {
  color: #8696a0; font-size: .9rem; margin-bottom: 1.5rem;
}
.form-group { margin-bottom: 1.2rem; }
.form-group label {
  display: block; color: #8696a0; font-size: .8rem;
  text-transform: uppercase; letter-spacing: .05em; margin-bottom: .5rem;
}
.form-group input {
  width: 100%; box-sizing: border-box;
  background: #2a3942; border: none; border-bottom: 2px solid #25D366;
  color: #e9edef; padding: .6rem .8rem; border-radius: 6px 6px 0 0;
  font-size: 1rem; outline: none;
}
.form-group input::placeholder { color: #546570; }
.avatar-grid {
  display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px;
}
.avatar-option {
  width: 52px; height: 52px; border-radius: 50%; overflow: hidden;
  cursor: pointer; border: 3px solid transparent; transition: border-color .2s;
}
.avatar-option img { width: 100%; height: 100%; object-fit: cover; }
.avatar-option.selected { border-color: #25D366; }
.avatar-option:hover { border-color: #128C7E; }
.upload-area {
  background: #2a3942; border: 2px dashed #3b4a54;
  border-radius: 8px; padding: 1rem; cursor: pointer;
  text-align: center; color: #8696a0; min-height: 60px;
  display: flex; align-items: center; justify-content: center;
  transition: border-color .2s;
}
.upload-area:hover { border-color: #25D366; }
.custom-preview { width: 56px; height: 56px; border-radius: 50%; object-fit: cover; }
.login-error { color: #f15c6d; font-size: .85rem; margin-bottom: .8rem; }
.btn-login {
  width: 100%; padding: .85rem;
  background: #25D366; color: #fff; border: none;
  border-radius: 24px; font-size: 1rem; font-weight: 600;
  cursor: pointer; transition: background .2s;
}
.btn-login:hover:not(:disabled) { background: #20bc59; }
.btn-login:disabled { background: #3b4a54; cursor: not-allowed; }
</style>
