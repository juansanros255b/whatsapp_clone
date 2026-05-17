<template>
  <div id="app-root">
    <!-- LOGIN SCREEN -->
    <LoginScreen v-if="!me" @login="handleLogin" />

    <!-- MAIN CHAT UI -->
    <div v-else class="wa-shell">

      <!-- ── LEFT SIDEBAR ──────────────────────────────────────────── -->
      <aside class="sidebar">
        <!-- My profile -->
        <div class="sidebar-header">
          <img :src="me.avatar" class="my-avatar" />
          <div class="my-info">
            <span class="my-name">{{ me.name }}</span>
            <span class="my-status">{{ me.status }}</span>
          </div>
          <button class="btn-logout" @click="logout" title="Salir">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 13v-2H7V8l-5 4 5 4v-3zm4-9h-8c-1.1 0-2 .9-2 2v4h2V6h8v12h-8v-4H8v4c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"/>
            </svg>
          </button>
        </div>

        <!-- Search -->
        <div class="sidebar-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="#8696a0">
            <path d="M15.5 14h-.79l-.28-.27A6.47 6.47 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <input v-model="search" placeholder="Buscar o empezar chat..." />
        </div>

        <!-- Tabs -->
        <div class="sidebar-tabs">
          <button :class="{ active: activeTab === 'chats' }" @click="activeTab = 'chats'">Chats</button>
          <button :class="{ active: activeTab === 'rooms' }" @click="activeTab = 'rooms'">Salas</button>
        </div>

        <!-- USERS list (chats tab) -->
        <div v-if="activeTab === 'chats'" class="sidebar-list">
          <div
            v-for="user in filteredUsers"
            :key="user.id"
            class="user-item"
            :class="{ active: activeChat && activeChat.type === 'private' && activeChat.id === user.id }"
            @click="openPrivate(user)"
          >
            <img :src="user.avatar" class="user-avatar" />
            <div class="user-meta">
              <span class="user-name">{{ user.name }}</span>
              <span class="user-status">{{ user.status }}</span>
            </div>
            <span v-if="unreadPrivate[user.id]" class="unread-badge">{{ unreadPrivate[user.id] }}</span>
          </div>
          <div v-if="filteredUsers.length === 0" class="empty-hint">No hay otros usuarios</div>
        </div>

        <!-- ROOMS list (rooms tab) -->
        <div v-if="activeTab === 'rooms'" class="sidebar-list">
          <div
            v-for="r in roomList"
            :key="r.name"
            class="room-item"
            :class="{ active: activeChat && activeChat.type === 'room' && activeChat.id === r.name, joined: joinedRooms.has(r.name) }"
            @click="openRoom(r.name)"
          >
            <div class="room-icon">#</div>
            <div class="room-meta">
              <span class="room-name">{{ r.name }}</span>
              <span class="room-count">{{ r.count }} online</span>
            </div>
            <span v-if="!joinedRooms.has(r.name)" class="badge-join">Unirse</span>
            <span v-else-if="unreadRoom[r.name]" class="unread-badge">{{ unreadRoom[r.name] }}</span>
          </div>
        </div>
      </aside>

      <!-- ── CENTER: ACTIVE CHAT ─────────────────────────────────── -->
      <main class="chat-area">
        <!-- Welcome screen -->
        <div v-if="!activeChat" class="welcome-screen">
          <div class="welcome-content">
            <svg width="80" height="80" viewBox="0 0 55 55" fill="none">
              <circle cx="27.5" cy="27.5" r="27.5" fill="#25D366" opacity=".15"/>
              <path d="M27.5 10C18.4 10 11 17.4 11 26.5c0 3.6 1.1 7 3.1 9.8L11 45l9-2.9c2.7 1.7 5.9 2.7 9.2 2.7 9.1 0 16.5-7.4 16.5-16.5S36.6 10 27.5 10z" fill="#25D366" opacity=".4"/>
            </svg>
            <h2>WhatsApp Web Clone</h2>
            <p>Selecciona un chat o sala del panel izquierdo para empezar.</p>
          </div>
        </div>

        <!-- Room chat -->
        <RoomChat
          v-else-if="activeChat.type === 'room'"
          :room="activeChat.id"
          :myId="mySocketId"
          :messages="roomMessages[activeChat.id] || []"
          :typers="roomTypers[activeChat.id] || {}"
          :backendUrl="BACKEND_URL"
          @send="sendRoom"
          @leave="leaveRoom"
          @typing="emitTyping"
          @stopTyping="emitStopTyping"
        />

        <!-- Private chat -->
        <PrivateChat
          v-else-if="activeChat.type === 'private'"
          :peer="activeChat.peer"
          :myId="mySocketId"
          :messages="privateMessages[activeChat.id] || []"
          :typingState="privateTyping[activeChat.id] || false"
          :backendUrl="BACKEND_URL"
          @send="sendPrivate"
          @close="activeChat = null"
          @typing="emitTypingPrivate"
          @stopTyping="emitStopTypingPrivate"
        />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onUnmounted, watch } from 'vue'
import { socket } from './socket.js'
import LoginScreen from './components/LoginScreen.vue'
import RoomChat from './components/RoomChat.vue'
import PrivateChat from './components/PrivateChat.vue'

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'

// ── State ────────────────────────────────────────────────────────────────────
const me = ref(null)
const mySocketId = ref('')
const users = ref([])           // other users online
const roomList = ref([])        // all available rooms + counts
const joinedRooms = ref(new Set())

const activeTab = ref('rooms')
const activeChat = ref(null)    // { type: 'room'|'private', id, peer? }
const search = ref('')

const roomMessages = reactive({})   // roomName → msg[]
const privateMessages = reactive({}) // peerId → msg[]

const roomTypers = reactive({})     // roomName → { userId: userName }
const privateTyping = reactive({})  // peerId → bool

const unreadRoom = reactive({})
const unreadPrivate = reactive({})

// ── Computed ─────────────────────────────────────────────────────────────────
const filteredUsers = computed(() =>
  users.value.filter(u =>
    u.name.toLowerCase().includes(search.value.toLowerCase())
  )
)

// ── Socket events ─────────────────────────────────────────────────────────────
function setupSocket() {
  socket.on('connect', () => {
    mySocketId.value = socket.id
    socket.emit('register', { name: me.value.name, status: me.value.status, avatar: me.value.avatar })
  })

  socket.on('userList', (list) => {
    users.value = list.filter(u => u.id !== socket.id)
  })

  socket.on('roomList', (list) => {
    roomList.value = list
  })

  socket.on('joinedRoom', (room) => {
    joinedRooms.value = new Set([...joinedRooms.value, room])
    if (!roomMessages[room]) roomMessages[room] = []
    // auto-open General on first join
    if (room === 'General' && !activeChat.value) {
      activeChat.value = { type: 'room', id: 'General' }
    }
  })

  socket.on('leftRoom', (room) => {
    const s = new Set(joinedRooms.value)
    s.delete(room)
    joinedRooms.value = s
    if (activeChat.value?.id === room) activeChat.value = null
  })

  socket.on('systemMessage', ({ room, text, timestamp }) => {
    if (!roomMessages[room]) roomMessages[room] = []
    roomMessages[room].push({ id: Date.now() + Math.random(), type: 'system', text, timestamp })
    bumpRoomUnread(room)
  })

  socket.on('roomMessage', (msg) => {
    if (!roomMessages[msg.room]) roomMessages[msg.room] = []
    roomMessages[msg.room].push(msg)
    bumpRoomUnread(msg.room)
  })

  socket.on('privateMessage', (msg) => {
    const peerId = msg.senderId === socket.id ? msg.toId : msg.senderId
    if (!privateMessages[peerId]) privateMessages[peerId] = []
    privateMessages[peerId].push(msg)
    if (msg.senderId !== socket.id) {
      bumpPrivateUnread(msg.senderId)
    }
  })

  socket.on('typing', ({ room, userId, userName, isTyping }) => {
    if (!roomTypers[room]) roomTypers[room] = {}
    if (isTyping) roomTypers[room][userId] = userName
    else delete roomTypers[room][userId]
  })

  socket.on('typingPrivate', ({ fromId, fromName, isTyping }) => {
    privateTyping[fromId] = isTyping
  })
}

function bumpRoomUnread(room) {
  if (!activeChat.value || activeChat.value.id !== room) {
    unreadRoom[room] = (unreadRoom[room] || 0) + 1
  }
}
function bumpPrivateUnread(peerId) {
  if (!activeChat.value || activeChat.value.id !== peerId) {
    unreadPrivate[peerId] = (unreadPrivate[peerId] || 0) + 1
  }
}

// ── Login / Logout ────────────────────────────────────────────────────────────
function handleLogin(userData) {
  me.value = userData
  setupSocket()
  socket.connect()
}

function logout() {
  socket.disconnect()
  me.value = null
  mySocketId.value = ''
  users.value = []
  roomList.value = []
  joinedRooms.value = new Set()
  activeChat.value = null
  Object.keys(roomMessages).forEach(k => delete roomMessages[k])
  Object.keys(privateMessages).forEach(k => delete privateMessages[k])
}

// ── Navigation ────────────────────────────────────────────────────────────────
function openRoom(roomName) {
  if (!joinedRooms.value.has(roomName)) {
    socket.emit('joinRoom', roomName)
  }
  activeChat.value = { type: 'room', id: roomName }
  unreadRoom[roomName] = 0
}

function openPrivate(user) {
  activeChat.value = { type: 'private', id: user.id, peer: user }
  unreadPrivate[user.id] = 0
  activeTab.value = 'chats'
}

function leaveRoom(room) {
  socket.emit('leaveRoom', room)
}

// ── Send messages ─────────────────────────────────────────────────────────────
function sendRoom({ room, text, file }) {
  socket.emit('roomMessage', { room, text, file })
}

function sendPrivate({ toId, text, file }) {
  socket.emit('privateMessage', { toId, text, file })
}

// ── Typing ───────────────────────────────────────────────────────────────────
function emitTyping(room) { socket.emit('typing', { room, isTyping: true }) }
function emitStopTyping(room) { socket.emit('typing', { room, isTyping: false }) }
function emitTypingPrivate(peerId) { socket.emit('typingPrivate', { toId: peerId, isTyping: true }) }
function emitStopTypingPrivate(peerId) { socket.emit('typingPrivate', { toId: peerId, isTyping: false }) }

onUnmounted(() => { socket.disconnect() })
</script>

<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #111b21; font-family: 'Segoe UI', system-ui, sans-serif; overflow: hidden; }
::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: #3b4a54; border-radius: 3px; }

#app-root { height: 100vh; display: flex; }

.wa-shell {
  display: flex; width: 100%; height: 100vh; background: #111b21;
}

/* ── SIDEBAR ── */
.sidebar {
  width: 380px; flex-shrink: 0; border-right: 1px solid #2a3942;
  display: flex; flex-direction: column; background: #111b21;
}
.sidebar-header {
  display: flex; align-items: center; gap: 10px;
  background: #202c33; padding: 10px 16px; min-height: 60px; flex-shrink: 0;
}
.my-avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
.my-info { flex: 1; min-width: 0; }
.my-name { display: block; color: #e9edef; font-weight: 600; font-size: .9rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.my-status { font-size: .75rem; color: #8696a0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.btn-logout {
  background: none; border: none; color: #8696a0; cursor: pointer;
  padding: 6px; border-radius: 50%; display: flex; align-items: center;
}
.btn-logout:hover { color: #e9edef; background: #2a3942; }

.sidebar-search {
  display: flex; align-items: center; gap: 8px;
  background: #111b21; padding: 8px 16px; flex-shrink: 0;
}
.sidebar-search input {
  flex: 1; background: #2a3942; border: none; border-radius: 8px;
  color: #e9edef; padding: 7px 12px; font-size: .85rem; outline: none;
}
.sidebar-search input::placeholder { color: #546570; }

.sidebar-tabs {
  display: flex; border-bottom: 1px solid #2a3942; flex-shrink: 0;
}
.sidebar-tabs button {
  flex: 1; background: none; border: none; color: #8696a0;
  padding: 10px 0; font-size: .85rem; cursor: pointer; border-bottom: 2px solid transparent;
  transition: all .2s;
}
.sidebar-tabs button.active { color: #25D366; border-bottom-color: #25D366; }

.sidebar-list { flex: 1; overflow-y: auto; }

.user-item, .room-item {
  display: flex; align-items: center; gap: 12px; padding: 10px 16px;
  cursor: pointer; border-bottom: 1px solid #1f2c33; transition: background .15s;
}
.user-item:hover, .room-item:hover { background: #2a3942; }
.user-item.active, .room-item.active { background: #2a3942; }

.user-avatar { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
.user-meta, .room-meta { flex: 1; min-width: 0; }
.user-name, .room-name { display: block; color: #e9edef; font-weight: 500; font-size: .9rem; }
.user-status, .room-count { font-size: .78rem; color: #8696a0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.room-icon {
  width: 48px; height: 48px; border-radius: 50%; background: #2a3942;
  color: #25D366; font-size: 1.4rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.room-item.joined .room-icon { background: #005c4b; }

.badge-join {
  font-size: .72rem; color: #25D366; background: rgba(37,211,102,.12);
  border-radius: 10px; padding: 2px 8px; flex-shrink: 0;
}
.unread-badge {
  background: #25D366; color: #fff; border-radius: 50%;
  width: 20px; height: 20px; font-size: .72rem; font-weight: 700;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.empty-hint { color: #546570; font-size: .85rem; text-align: center; padding: 2rem 1rem; }

/* ── CHAT AREA ── */
.chat-area { flex: 1; display: flex; flex-direction: column; min-width: 0; }

.welcome-screen {
  flex: 1; display: flex; align-items: center; justify-content: center;
  background: #222e35; border-left: 1px solid #2a3942;
}
.welcome-content {
  text-align: center; color: #8696a0; display: flex; flex-direction: column; align-items: center; gap: 16px;
}
.welcome-content h2 { color: #e9edef; font-size: 1.6rem; font-weight: 300; }
.welcome-content p { font-size: .9rem; max-width: 340px; }
</style>
