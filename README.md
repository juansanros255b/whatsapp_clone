# 💬 WhatsApp Web Clone

Clon de la interfaz web de WhatsApp construido con **Node.js + Socket.IO** en el backend y **Vue 3 + Vite** en el frontend, con la arquitectura completamente separada.

> 🌐 **Versión en producción:** _[URL aquí tras el despliegue]_

---

## 📁 Estructura del proyecto

```
whatsapp-clone/
├── backend/          ← API REST + WebSocket (Node.js, Express, Socket.IO)
│   ├── server.js
│   ├── package.json
│   └── uploads/      ← Archivos subidos (generado automáticamente)
│
├── frontend/         ← SPA Vue 3 + Vite
│   ├── src/
│   │   ├── App.vue               ← Layout principal
│   │   ├── main.js
│   │   ├── socket.js             ← Servicio Socket.IO
│   │   ├── avatars.js            ← Lista de avatares predefinidos
│   │   └── components/
│   │       ├── LoginScreen.vue   ← Pantalla de identificación
│   │       ├── RoomChat.vue      ← Chat de sala
│   │       ├── PrivateChat.vue   ← Chat privado
│   │       ├── ChatMessage.vue   ← Componente de mensaje
│   │       └── ChatInput.vue     ← Barra de entrada con adjuntos
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
└── package.json      ← Scripts raíz para arrancar todo
```

---

## ✅ Funcionalidades implementadas

### Mínimos (5 pts)
- **Identificación previa:** pantalla de login con nombre, estado e imagen de avatar; acceso bloqueado sin identificarse.
- **Lista de usuarios conectados** en el panel izquierdo.
- **Sala de chat común** (`#General`) accesible para todos.
- **Mensajes del sistema** cuando alguien entra o sale del chat.
- **Indicador de escritura** en tiempo real («Alguien está escribiendo…»).

### Mejoras implementadas
- ✅ **(3 pts) Chat privado:** panel de conversación privada con cada usuario, accesible desde el listado de usuarios.
- ✅ **(1,5 pts) Avatar propio:** el usuario puede subir su propia imagen de avatar en el formulario de login.
- ✅ **(1,5 pts) Salas múltiples:** 6 salas temáticas; los usuarios pueden unirse y abandonar salas independientes.
- ✅ **(2 pts) Compartir archivos:** adjuntar archivos en cualquier chat; las imágenes se muestran en línea con opción de descarga, otros formatos sólo permiten descarga.
- ✅ **(2 pts) Frontend con Vue 3 y componentes:** toda la capa cliente está construida en Vue 3 con componentes reutilizables.

---

## 🚀 Instalación y arranque en local

### Requisitos
- Node.js ≥ 18
- npm

### 1. Clonar el repositorio
```bash
git clone https://github.com/TU_USUARIO/whatsapp-clone.git
cd whatsapp-clone
```

### 2. Instalar dependencias
```bash
npm run install:all
```

### 3. Configurar variables de entorno

**Backend** (`backend/.env`):
```env
PORT=3001
FRONTEND_URL=http://localhost:5173
```

**Frontend** (`frontend/.env`):
```env
VITE_BACKEND_URL=http://localhost:3001
```

### 4. Arrancar en desarrollo (dos terminales)

```bash
# Terminal 1 – Backend
npm run dev:backend

# Terminal 2 – Frontend
npm run dev:frontend
```

Abre **http://localhost:5173** en el navegador.

---

## 🏗️ Despliegue en producción

### Backend (Railway / Render / Fly.io)
1. Sube la carpeta `backend/` como proyecto independiente.
2. Variable de entorno: `PORT` (la plataforma la asigna) y `FRONTEND_URL` con la URL del frontend desplegado.
3. Comando de inicio: `node server.js`.

### Frontend (Vercel / Netlify / GitHub Pages)
1. Sube la carpeta `frontend/` como proyecto independiente.
2. Variable de entorno: `VITE_BACKEND_URL=https://tu-backend.railway.app`
3. Comando de build: `npm run build`; directorio de salida: `dist/`.

---

## 🛠️ Tecnologías utilizadas

| Capa | Tecnología |
|------|-----------|
| Backend | Node.js, Express 5, Socket.IO 4 |
| Frontend | Vue 3, Vite 6, Socket.IO-client |
| Subida de archivos | Multer |
| Avatares | DiceBear API (open-source) |

---

## 📡 API del servidor WebSocket

| Evento (cliente→servidor) | Descripción |
|--------------------------|-------------|
| `register` | Registra el usuario con nombre, estado y avatar |
| `roomMessage` | Envía mensaje a una sala |
| `privateMessage` | Envía mensaje privado a un usuario |
| `joinRoom` | Unirse a una sala |
| `leaveRoom` | Abandonar una sala |
| `typing` | Indica escritura en sala |
| `typingPrivate` | Indica escritura en privado |

| Evento (servidor→cliente) | Descripción |
|--------------------------|-------------|
| `userList` | Lista actualizada de usuarios |
| `roomList` | Lista de salas con contadores |
| `joinedRoom` / `leftRoom` | Confirmación de join/leave |
| `systemMessage` | Mensaje del sistema en sala |
| `roomMessage` | Nuevo mensaje en sala |
| `privateMessage` | Nuevo mensaje privado |
| `typing` / `typingPrivate` | Estado de escritura |
