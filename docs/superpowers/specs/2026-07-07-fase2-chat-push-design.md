# Fase 2: Chat en Vivo + Notificaciones Push — Design Doc

**Fecha:** 2026-07-07
**Proyecto:** Liga Paraguaya de Fútbol
**Base:** Design doc original `docs/superpowers/specs/2026-07-04-futbol-total-ecosystem-design.md`

---

## Resumen

Agregar chat en vivo por partido (WebSocket) y notificaciones push (Web Push API) a la plataforma. Cada partido tiene su propia sala de chat persistente. Las notificaciones cubren goles en vivo, recordatorios de predicción, resultados y logros.

---

## Stack

| Componente | Tecnología |
|------------|-----------|
| WebSocket | FastAPI nativo (`WebSocket` + `WebSocketDisconnect`) |
| Notificaciones push | `pywebpush` (Python) + VAPID keys |
| Service Worker | Vanilla JS (~50 líneas) |
| Cron recordatorios | GitHub Actions (reusar keep-alive workflow) |
| DB | PostgreSQL (misma instancia) |

Sin nuevas dependencias pesadas. Sin Redis por ahora (YAGNI — Railway single-instance).

---

## 1. Modelo de Datos

### `mensajes_chat`

```sql
CREATE TABLE mensajes_chat (
    id TEXT PRIMARY KEY,
    partido_id TEXT NOT NULL REFERENCES partidos(id),
    user_id TEXT NOT NULL REFERENCES users(id),
    mensaje TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_mensajes_partido ON mensajes_chat(partido_id, created_at);
```

### `push_subscriptions`

```sql
CREATE TABLE push_subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 2. API — Chat

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/partidos/{id}/chat?limit=50&offset=0` | Historial paginado (REST) |
| WS | `/api/v1/ws/partidos/{id}?token=xxx` | WebSocket tiempo real |

### WebSocket Protocolo

**Handshake:**
- Token en query param (`?token=xxx`)
- Backend valida token → busca user, rechaza 4001 si inválido
- Rechaza 4004 si partido no existe
- Conectado: usuario unido a sala del partido

**Formato mensajes (JSON, bidireccional):**

```jsonc
// Cliente → Servidor
{"tipo": "mensaje", "contenido": "Vamos Olimpia!"}

// Servidor → Clientes (broadcast)
{"tipo": "mensaje_nuevo", "id": "msg_abc123", "user_id": "google_xxx",
 "username": "sergio", "nombre": "Sergio", "imagen": "...",
 "contenido": "Vamos Olimpia!", "created_at": "2026-07-07T09:00:00Z"}

// Servidor → Clientes (eventos de partido)
{"tipo": "gol", "mensaje": "⚽ Gol de Olimpia! (Derlis González 23')"}
{"tipo": "estado", "mensaje": "Partido finalizado: Olimpia 2-1 Cerro"}
```

### Gestión de Conexiones

- `ConnectionManager` class con dict `{partido_id: set[WebSocket]}`
- Broadcast solo a los sockets en la sala del partido
- Al desconectar: remover del set, broadcast de desconexión
- Sin límite de conexiones por sala (YAGNI — pocos usuarios concurrentes)

---

## 3. API — Notificaciones Push

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/notificaciones/suscribir` | Guardar PushSubscription |
| DELETE | `/api/v1/notificaciones/suscribir` | Desuscribir |
| POST | `/api/v1/cron/recordatorios` | Endpoint llamado por GH Actions, envía recordatorios |

### Eventos y Disparadores

| Evento | Disparador | Destinatarios |
|--------|-----------|---------------|
| ⚽ Gol | Admin actualiza resultado parcial con estado != finalizado | Usuarios con predicción en ese partido |
| ✅ Resultado | Admin marca partido como finalizado → trigger `calcular_puntos` | Usuario que predijo (puntos obtenidos) |
| 🔔 Recordatorio | Cron cada hora, partidos en 30 min | Usuarios sin predicción en ese partido |
| 🏆 Logro 5+ streak | Al calcular puntos en `calcular_puntos` | Usuario que alcanzó el streak |

### Formato Push

```jsonc
{
  "title": "⚽ Gol!",
  "body": "Olimpia 1-0 Cerro (Derlis González 23')",
  "icon": "/icon-192.png",
  "badge": "/badge-72.png",
  "data": { "url": "/partidos/OLE001" }
}
```

---

## 4. Frontend — Chat

### Componentes

1. **`ChatWidget.tsx`** — Contenedor principal del chat
   - Props: `partidoId`
   - Conexión WebSocket al montar, desconexión al desmontar
   - Scroll infinito hacia arriba (carga mensajes antiguos vía REST)
   - Input + botón enviar abajo

2. **`ChatMessage.tsx`** — Mensaje individual
   - Avatar + username + timestamp + contenido
   - Sin acciones (editar/borrar) por ahora

### Ubicación

Dentro de `/partidos/[id]`, debajo del marcador y predicción:
```
┌──────────────────────┐
│  Marcador + Predecir  │  ← existente
├──────────────────────┤
│  💬 Chat en Vivo      │  ← nuevo
│  sergio: Vamos Olim! │
│  ana: Grande Cerro!  │
│  ...                  │
│ [______________] ▶    │
└──────────────────────┘
```

### Service Worker

- Archivo: `public/sw.js`
- Escucha `push` event, muestra notificación con options
- Escucha `notificationclick`, abre/enfoca la URL del partido
- Se registra en el layout raíz

---

## 5. Backend — Estructura

### Archivos nuevos

| Archivo | Propósito |
|---------|-----------|
| `backend/app/services/chat_service.py` | ChatService: guardar mensaje, obtener historial |
| `backend/app/services/push_service.py` | PushService: suscribir, desuscribir, enviar push |
| `backend/app/api/chat.py` | Router: GET historial, WS endpoint |
| `backend/app/api/notificaciones.py` | Router: suscribir/desuscribir push |
| `backend/app/api/cron.py` | Router: endpoint de recordatorios |
| `backend/app/models/mensaje_chat.py` | SQLAlchemy model |
| `backend/app/models/push_subscription.py` | SQLAlchemy model |

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `backend/app/api/admin.py` | Disparar push de gol y resultado al actualizar partido |
| `backend/app/services/prediction_service.py` | Disparar push de logro en `calcular_puntos` |
| `backend/app/schemas/chat.py` (nuevo) | Schemas Pydantic para chat |

---

## 6. Testing

### Tests nuevos (8 aprox)

| Test | Tipo |
|------|------|
| WebSocket connect con token válido/inválido | Backend |
| WebSocket enviar y recibir mensaje | Backend |
| Broadcast a múltiples clientes | Backend |
| Historial REST paginado | Backend |
| Suscribir/desuscribir push | Backend |
| PushService.send() con mock | Backend |
| ChatWidget render y conexión | Frontend |
| Service Worker registrado | Frontend |

Tests existentes (18) deben seguir pasando sin cambios.

---

## 7. Configuración

### Variables de entorno nuevas

| Variable | Descripción |
|----------|-------------|
| `VAPID_PUBLIC_KEY` | Clave pública VAPID |
| `VAPID_PRIVATE_KEY` | Clave privada VAPID |
| `VAPID_CLAIM_EMAIL` | Email para VAPID (`mailto:admin@ejemplo.com`) |

### VAPID Keys

Generar con `pywebpush`:
```python
from pywebpush import generate_vapid_keys
keys = generate_vapid_keys()
```

O una sola vez con CLI y guardar en Railway env vars.

---

## No Scope

- Edit/delete mensajes
- Redis para escalar WebSockets (multi-instancia)
- Emojis reacciones
- Chat privado entre usuarios
- Moderation/denuncias
- Notificaciones email/SMS
