# VoiceLink — PTT Inteligente con IA

> **Habla. Transcribe. Actúa.**

Push-to-Talk inteligente con transcripción IA en tiempo real, geolocalización e integraciones multi-app. Android, iOS y Web.

Recreado como aplicación web completa (Next.js 16) a partir de la app móvil original de VoiceLink, con todas las funciones operativas: PTT con transcripción Whisper, detección de intención con LLM, mapa interactivo en tiempo real, canales, integraciones y panel administrativo.

---

## ✨ Características

### Comunicación PTT con IA
- **Push-to-Talk** — mantén presionado el botón (o la tecla `Espacio`) para grabar audio
- **Transcripción en tiempo real** con Whisper (ASR) + transcripción en vivo es-CL (Web Speech API) como respaldo en español
- **Detección de intención con LLM** — analiza cada transcripción y sugiere acciones automáticas (alertas, compartir por WhatsApp/Email/Telegram/Slack, compartir ubicación, generar reportes)
- **Reproducción de mensajes** con waveform interactivo y seek

### Canales
- Canales preconfigurados: general, supervisor, guardias, logística, ejecutivo
- **Crear / renombrar / eliminar** canales (menú de acciones por canal)
- **Asignar usuarios** a cada canal
- Los cambios se reflejan en tiempo real en la barra lateral, topbar y panel admin

### Mapa interactivo en tiempo real
- **Pan** (arrastrar con mouse/dedo), **zoom** (rueda del mouse / pinch / botones +/−)
- Marcadores del equipo con sector, batería y rol
- Geolocalización real (GPS/watchPosition) + botón "Ubicar mi posición"
- Click en miembro del equipo → centra el mapa en su ubicación
- Radar animado alrededor de tu posición

### Integraciones
- WhatsApp, Email, Telegram, Slack, Webhook
- Web Share API nativa en móvil/iPhone
- Detección automática de integración según el contenido del mensaje

### Panel administrativo
- Dashboard con métricas: mensajes hoy, acciones ejecutadas, canales activos, usuarios en línea
- Gráfico de actividad (12h) con Recharts
- Sistema IA: latencia Whisper, precisión, CPU
- Gestión de canales y usuarios

### Planes
- **Básico** (gratis) — 5 usuarios, 50 transcripciones/mes
- **Profesional** ($29/mes) — 25 usuarios, transcripción ilimitada, integraciones
- **Empresarial** (custom) — usuarios ilimitados, panel admin, SLA

### Diseño
- Tema oscuro (`#0e0f14`) con acentos azul→púrpura
- Fuente DM Sans, logo de micrófono con gradiente y animación "breathing"
- 100% responsive: escritorio, tablet, smartphone, iPhone
- Interfaz en español (Chile)

---

## 🛠️ Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 16 (App Router) |
| Lenguaje | TypeScript 5 |
| Estilos | Tailwind CSS 4 + shadcn/ui |
| Base de datos | Prisma ORM (SQLite) |
| Estado | Zustand (cliente) |
| Gráficos | Recharts |
| Animaciones | Framer Motion |
| IA | z-ai-web-dev-sdk (ASR Whisper + LLM) |

---

## 🚀 Instalación

### Requisitos
- Node.js 18+ o Bun
- npm / bun

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/<tu-usuario>/voicelink.git
cd voicelink

# 2. Instalar dependencias
bun install
# o: npm install

# 3. Configurar variables de entorno
cp .env.example .env

# 4. Crear la base de datos (SQLite)
bun run db:push
# o: npx prisma db push

# 5. Iniciar el servidor de desarrollo
bun run dev
# o: npm run dev
```

La app estará disponible en `http://localhost:3000`.

---

## 👤 Cuentas de acceso

### Cuenta demo
- **Email:** `demo@voicelink.app`
- **Contraseña:** `voicelink`
- **Rol:** Administrador

### Cuenta de administrador autorizada
- **Email:** `veltrixintegra@gmail.com`
- **Contraseña:** `voicelink`
- **Rol:** Administrador (plan Empresarial)

> Al primer inicio, la base de datos se siembra automáticamente con canales, usuarios demo y la cuenta de administrador.

### Crear una cuenta nueva
1. En la pantalla de login, selecciona **"Crear cuenta"**
2. Completa nombre, email y contraseña
3. Elige un plan (Básico o Profesional)
4. ¡Listo! Tu cuenta se crea como operador

---

## 📁 Estructura del proyecto

```
voicelink/
├── prisma/
│   └── schema.prisma          # Modelos: User, Channel, Message, IntentLog
├── src/
│   ├── app/
│   │   ├── api/               # Rutas API (auth, channels, messages, transcribe, intent…)
│   │   ├── globals.css        # Tokens de diseño VoiceLink
│   │   ├── layout.tsx         # Layout raíz + metadatos
│   │   └── page.tsx           # Pantalla de auth / app shell
│   ├── components/
│   │   ├── ui/                # Componentes shadcn/ui
│   │   └── voicelink/         # Componentes de la app
│   │       ├── views/         # ChannelsView, MapView, HistoryView, AdminView…
│   │       ├── auth-screen.tsx
│   │       ├── app-shell.tsx
│   │       ├── sidebar.tsx
│   │       ├── use-ptt.ts     # Hook Push-to-Talk (grabación + speech)
│   │       └── use-pan-zoom.ts # Hook de mapa interactivo
│   ├── lib/
│   │   ├── constants.ts       # Tokens, planes, canales, integraciones, ADMIN_EMAIL
│   │   ├── types.ts           # Tipos compartidos
│   │   ├── auth.ts            # Helpers de auth + seeding
│   │   ├── api.ts             # Cliente fetch
│   │   └── db.ts              # Prisma client
│   └── store/
│       └── use-voicelink.ts   # Estado global (Zustand)
├── public/
│   ├── voicelink-icon.svg     # Favicon SVG (gradiente + micrófono)
│   ├── voicelink-icon.png     # Favicon PNG (512×512)
│   └── apple-touch-icon.png   # Icono iOS (180×180)
├── .env.example
└── package.json
```

---

## 🔌 API endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/auth/login` | Iniciar sesión |
| `POST` | `/api/auth/register` | Crear cuenta (auto-admin para email autorizado) |
| `GET` | `/api/channels` | Listar canales |
| `POST` | `/api/channels` | Crear canal |
| `PUT` | `/api/channels` | Renombrar / asignar miembros |
| `DELETE` | `/api/channels?id=` | Eliminar canal |
| `GET` | `/api/messages?channelId=` | Mensajes de un canal |
| `POST` | `/api/messages` | Crear mensaje (voz/texto) |
| `GET` | `/api/users` | Listar usuarios del equipo |
| `PUT` | `/api/users` | Actualizar ubicación/presencia |
| `GET` | `/api/stats` | Métricas para el panel admin |
| `POST` | `/api/transcribe` | Transcripción ASR (Whisper) |
| `POST` | `/api/intent` | Detección de intención (LLM) |
| `POST` | `/api/seed` | Sembrar datos demo |

---

## ⌨️ Atajos

| Atajo | Acción |
|-------|--------|
| `Espacio` (mantener) | Hablar (PTT) |
| Clic / Toque (mantener) | Botón PTT |
| Arrastrar mapa | Mover (pan) |
| Rueda del mouse | Zoom en el mapa |
| Pinch (dos dedos) | Zoom en móvil |

---

## 📝 Licencia

MIT — ver [LICENSE](./LICENSE).

---

**VoiceLink** · Android, iOS & Web · v1.0
