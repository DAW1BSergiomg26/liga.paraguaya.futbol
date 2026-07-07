# Fase 2: Chat en Vivo + Notificaciones Push — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-partido WebSocket chat with persistence and push notifications (gol, resultado, recordatorio, logro).

**Architecture:** FastAPI native WebSocket with ConnectionManager, token auth in query param, PostgreSQL persistence. Push via `pywebpush` with VAPID keys, triggered from admin/prediction endpoints. Frontend ChatWidget component + Service Worker.

**Tech Stack:** FastAPI WebSocket, SQLAlchemy async, `pywebpush`, VAPID, Next.js 14+, Tailwind CSS

## Global Constraints

- All new models use `id TEXT PRIMARY KEY` with `f"msg_{uuid.uuid4().hex[:12]}"` pattern (matching existing codebase)
- Token auth reuses `get_current_user` dependency from `backend/app/core/dependencies.py`
- WebSocket validation uses same token lookup but via query param + manual validation (no Depends available in WS)
- Backend tests use SQLite in-memory (`sqlite+aiosqlite://`) and `httpx.AsyncClient` for WS tests with `ASGITransport`
- Frontend follows existing patterns: `useQuery` from `@tanstack/react-query`, Tailwind classes
- `pywebpush` added to `backend/requirements.txt`

---
## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `backend/app/models/mensaje_chat.py` | Create | SQLAlchemy model `MensajeChat` |
| `backend/app/models/push_subscription.py` | Create | SQLAlchemy model `PushSubscription` |
| `backend/app/schemas/chat.py` | Create | Pydantic schemas: `MensajeChatCreate`, `MensajeChatOut` |
| `backend/app/services/chat_service.py` | Create | `ChatService`: `guardar()`, `obtener_historial()` |
| `backend/app/services/push_service.py` | Create | `PushService`: `suscribir()`, `desuscribir()`, `enviar()`, `enviar_a_partido()`, `enviar_recordatorios()` |
| `backend/app/api/chat.py` | Create | Router: `GET /api/v1/partidos/{id}/chat`, `WS /api/v1/ws/partidos/{id}` |
| `backend/app/api/notificaciones.py` | Create | Router: `POST/DELETE /api/v1/notificaciones/suscribir` |
| `backend/app/api/cron.py` | Create | Router: `POST /api/v1/cron/recordatorios` |
| `backend/app/core/config.py` | Modify | Add VAPID env vars |
| `backend/app/main.py` | Modify | Register new routers + init DB tables |
| `backend/app/api/admin.py` | Modify | Trigger push gol + resultado on partido update |
| `backend/app/services/prediction_service.py` | Modify | Trigger push logro in `calcular_puntos` |
| `backend/requirements.txt` | Modify | Add `pywebpush>=1.0.0` |
| `frontend/src/components/ChatWidget.tsx` | Create | Chat container with WebSocket, input, message list |
| `frontend/src/components/ChatMessage.tsx` | Create | Single message row (avatar + text + time) |
| `frontend/public/sw.js` | Create | Service Worker for push notifications |
| `frontend/src/app/partidos/[id]/page.tsx` | Modify | Add ChatWidget below marcador |
| `frontend/src/app/layout.tsx` | Modify | Register Service Worker |
| `frontend/src/lib/api.ts` | Modify | Add `getChatHistory()`, `getPartidoMessages()` |

---

### Task 1: Backend Models (MensajeChat + PushSubscription)

**Files:**
- Create: `backend/app/models/mensaje_chat.py`
- Create: `backend/app/models/push_subscription.py`

**Interfaces:**
- Produces: `MensajeChat` model, `PushSubscription` model

- [ ] **Create `backend/app/models/mensaje_chat.py`**

```python
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from backend.app.core.database import Base


class MensajeChat(Base):
    __tablename__ = "mensajes_chat"

    id = Column(String, primary_key=True)
    partido_id = Column(String, ForeignKey("partidos.id"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    mensaje = Column(Text, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    partido = relationship("Partido", lazy="selectin")
    user = relationship("User", lazy="selectin")
```

- [ ] **Create `backend/app/models/push_subscription.py`**

```python
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, ForeignKey, String, Text

from backend.app.core.database import Base


class PushSubscription(Base):
    __tablename__ = "push_subscriptions"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    endpoint = Column(Text, nullable=False)
    p256dh = Column(String, nullable=False)
    auth = Column(String, nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
```

- [ ] **Commit**

```bash
git add backend/app/models/mensaje_chat.py backend/app/models/push_subscription.py
git commit -m "feat: add MensajeChat and PushSubscription models"
```

---

### Task 2: Chat Schema + Service

**Files:**
- Create: `backend/app/schemas/chat.py`
- Create: `backend/app/services/chat_service.py`

**Interfaces:**
- Consumes: `MensajeChat` model
- Produces: `MensajeChatCreate` (content: str), `MensajeChatOut` (full response), `ChatService.guardar()`, `ChatService.obtener_historial()`

- [ ] **Create `backend/app/schemas/chat.py`**

```python
from datetime import datetime

from pydantic import BaseModel, Field


class MensajeChatCreate(BaseModel):
    contenido: str = Field(..., min_length=1, max_length=500)


class MensajeChatOut(BaseModel):
    id: str
    partido_id: str
    user_id: str
    username: str = ""
    nombre: str = ""
    imagen: str = ""
    mensaje: str
    created_at: datetime

    class Config:
        from_attributes = True
```

- [ ] **Create `backend/app/services/chat_service.py`**

```python
import uuid
from datetime import datetime, timezone

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.mensaje_chat import MensajeChat
from backend.app.schemas.chat import MensajeChatCreate, MensajeChatOut


class ChatService:

    @staticmethod
    async def guardar(
        db: AsyncSession, partido_id: str, user_id: str, data: MensajeChatCreate
    ) -> MensajeChatOut:
        msg_id = f"msg_{uuid.uuid4().hex[:12]}"
        msg = MensajeChat(
            id=msg_id,
            partido_id=partido_id,
            user_id=user_id,
            mensaje=data.contenido,
            created_at=datetime.now(timezone.utc),
        )
        db.add(msg)
        await db.flush()
        await db.refresh(msg, ["user"])
        return MensajeChatOut(
            id=msg.id,
            partido_id=msg.partido_id,
            user_id=msg.user_id,
            username=msg.user.username if msg.user else "",
            nombre=msg.user.name if msg.user else "",
            imagen=msg.user.image if msg.user else "",
            mensaje=msg.mensaje,
            created_at=msg.created_at,
        )

    @staticmethod
    async def obtener_historial(
        db: AsyncSession, partido_id: str, limit: int = 50, offset: int = 0
    ) -> list[MensajeChatOut]:
        stmt = (
            select(MensajeChat)
            .where(MensajeChat.partido_id == partido_id)
            .order_by(MensajeChat.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        result = await db.execute(stmt)
        msgs = result.scalars().all()
        out = []
        for msg in msgs:
            out.append(
                MensajeChatOut(
                    id=msg.id,
                    partido_id=msg.partido_id,
                    user_id=msg.user_id,
                    username=msg.user.username if msg.user else "",
                    nombre=msg.user.name if msg.user else "",
                    imagen=msg.user.image if msg.user else "",
                    mensaje=msg.mensaje,
                    created_at=msg.created_at,
                )
            )
        return out[::-1]  # oldest first for frontend
```

- [ ] **Commit**

```bash
git add backend/app/schemas/chat.py backend/app/services/chat_service.py
git commit -m "feat: add chat schema and service"
```

---

### Task 3: WebSocket ConnectionManager + Chat API Router

**Files:**
- Create: `backend/app/api/chat.py`
- Modify: `backend/app/main.py`

**Interfaces:**
- Consumes: `ChatService.guardar()`, `ChatService.obtener_historial()`, `MensajeChatCreate`
- Produces: `GET /api/v1/partidos/{id}/chat`, `WS /api/v1/ws/partidos/{id}`

- [ ] **Create `backend/app/api/chat.py`**

```python
import json
from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.dependencies import get_db
from backend.app.models.user import User
from backend.app.schemas.chat import MensajeChatCreate, MensajeChatOut
from backend.app.services.chat_service import ChatService

router = APIRouter(prefix="/api/v1", tags=["chat"])


class ConnectionManager:
    def __init__(self):
        self.active: dict[str, set[WebSocket]] = {}

    async def connect(self, partido_id: str, ws: WebSocket):
        await ws.accept()
        if partido_id not in self.active:
            self.active[partido_id] = set()
        self.active[partido_id].add(ws)

    def disconnect(self, partido_id: str, ws: WebSocket):
        if partido_id in self.active:
            self.active[partido_id].discard(ws)
            if not self.active[partido_id]:
                del self.active[partido_id]

    async def broadcast(self, partido_id: str, data: dict):
        if partido_id not in self.active:
            return
        dead = set()
        for ws in self.active[partido_id]:
            try:
                await ws.send_json(data)
            except Exception:
                dead.add(ws)
        for ws in dead:
            self.active[partido_id].discard(ws)


manager = ConnectionManager()


async def get_user_from_token(db: AsyncSession, token: str) -> User | None:
    from sqlalchemy import select
    from backend.app.models.user import User
    result = await db.execute(select(User).where(User.token == token))
    return result.scalar_one_or_none()


@router.get("/partidos/{partido_id}/chat", response_model=list[MensajeChatOut])
async def get_chat_history(
    partido_id: str,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    return await ChatService.obtener_historial(db, partido_id, limit, offset)


@router.websocket("/ws/partidos/{partido_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    partido_id: str,
    token: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    user = await get_user_from_token(db, token)
    if not user:
        await websocket.close(code=4001)
        return

    from sqlalchemy import select
    from backend.app.models.partido import Partido
    result = await db.execute(select(Partido).where(Partido.id == partido_id))
    if not result.scalar_one_or_none():
        await websocket.close(code=4004)
        return

    await manager.connect(partido_id, websocket)
    try:
        while True:
            raw = await websocket.receive_text()
            data = json.loads(raw)
            if data.get("tipo") != "mensaje":
                continue
            msg_in = MensajeChatCreate(contenido=data["contenido"])
            msg_out = await ChatService.guardar(db, partido_id, user.id, msg_in)
            await manager.broadcast(
                partido_id,
                {
                    "tipo": "mensaje_nuevo",
                    "id": msg_out.id,
                    "user_id": msg_out.user_id,
                    "username": msg_out.username,
                    "nombre": msg_out.nombre,
                    "imagen": msg_out.imagen,
                    "contenido": msg_out.mensaje,
                    "created_at": msg_out.created_at.isoformat(),
                },
            )
    except WebSocketDisconnect:
        manager.disconnect(partido_id, websocket)
    except Exception:
        manager.disconnect(partido_id, websocket)
```

- [ ] **Register routers in `backend/app/main.py`**

Find the existing router registration block and add:

```python
from backend.app.api.chat import router as chat_router
from backend.app.api.notificaciones import router as notificaciones_router
from backend.app.api.cron import router as cron_router

app.include_router(chat_router)
app.include_router(notificaciones_router)
app.include_router(cron_router)
```

- [ ] **Commit**

```bash
git add backend/app/api/chat.py
git commit -m "feat: add WebSocket chat endpoint with ConnectionManager"
```

- [ ] **Update `backend/app/main.py` and commit**

```bash
git add backend/app/main.py
git commit -m "feat: register chat, notificaciones, and cron routers"
```

---

### Task 4: Push Service + Subscription Endpoints

**Files:**
- Create: `backend/app/services/push_service.py`
- Create: `backend/app/api/notificaciones.py`
- Modify: `backend/app/core/config.py`
- Modify: `backend/requirements.txt`
- Create: `backend/app/schemas/push_subscription.py`

**Interfaces:**
- Produces: `POST/DELETE /api/v1/notificaciones/suscribir`, `PushService.send()`, `PushService.send_to_partido()`

- [ ] **Add `pywebpush` to `backend/requirements.txt`**

Append:
```
pywebpush>=1.0.0
```

- [ ] **Add VAPID env vars to `backend/app/core/config.py`**

Find the `Settings` class and add:

```python
VAPID_PUBLIC_KEY: str = ""
VAPID_PRIVATE_KEY: str = ""
VAPID_CLAIM_EMAIL: str = "admin@ligapy.app"
```

- [ ] **Create `backend/app/schemas/push_subscription.py`**

```python
from pydantic import BaseModel


class PushSubscriptionCreate(BaseModel):
    endpoint: str
    p256dh: str
    auth: str
```

- [ ] **Create `backend/app/services/push_service.py`**

```python
import json
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.config import settings
from backend.app.models.prediction import Prediction
from backend.app.models.partido import Partido
from backend.app.models.push_subscription import PushSubscription as PushSubscriptionModel
from backend.app.schemas.push_subscription import PushSubscriptionCreate

try:
    from pywebpush import webpush, WebPushException
    HAS_PYWEBPUSH = True
except ImportError:
    HAS_PYWEBPUSH = False


class PushService:

    VAPID_PRIVATE_KEY = settings.VAPID_PRIVATE_KEY
    VAPID_CLAIM_EMAIL = settings.VAPID_CLAIM_EMAIL

    @staticmethod
    async def suscribir(
        db: AsyncSession, user_id: str, data: PushSubscriptionCreate
    ):
        sub_id = f"sub_{uuid.uuid4().hex[:12]}"
        sub = PushSubscriptionModel(
            id=sub_id,
            user_id=user_id,
            endpoint=data.endpoint,
            p256dh=data.p256dh,
            auth=data.auth,
            created_at=datetime.now(timezone.utc),
        )
        db.add(sub)
        await db.flush()

    @staticmethod
    async def desuscribir(db: AsyncSession, user_id: str, endpoint: str):
        result = await db.execute(
            select(PushSubscriptionModel).where(
                PushSubscriptionModel.user_id == user_id,
                PushSubscriptionModel.endpoint == endpoint,
            )
        )
        sub = result.scalar_one_or_none()
        if sub:
            await db.delete(sub)
            await db.flush()

    @staticmethod
    async def _enviar(sub: PushSubscriptionModel, title: str, body: str, url: str):
        if not HAS_PYWEBPUSH:
            return
        try:
            webpush(
                subscription_info={
                    "endpoint": sub.endpoint,
                    "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
                },
                data=json.dumps({
                    "title": title,
                    "body": body,
                    "icon": "/icon-192.png",
                    "badge": "/badge-72.png",
                    "data": {"url": url},
                }),
                vapid_private_key=PushService.VAPID_PRIVATE_KEY,
                vapid_claims={"sub": f"mailto:{PushService.VAPID_CLAIM_EMAIL}"},
            )
        except WebPushException:
            pass

    @staticmethod
    async def enviar_a_partido(
        db: AsyncSession, partido_id: str, title: str, body: str, url: str
    ):
        result = await db.execute(
            select(PushSubscriptionModel).where(
                PushSubscriptionModel.user_id.in_(
                    select(Prediction.user_id).where(
                        Prediction.partido_id == partido_id
                    )
                )
            )
        )
        subs = result.scalars().all()
        for sub in subs:
            await PushService._enviar(sub, title, body, url)

    @staticmethod
    async def enviar_a_usuario(
        db: AsyncSession, user_id: str, title: str, body: str, url: str
    ):
        result = await db.execute(
            select(PushSubscriptionModel).where(
                PushSubscriptionModel.user_id == user_id
            )
        )
        subs = result.scalars().all()
        for sub in subs:
            await PushService._enviar(sub, title, body, url)

    @staticmethod
    async def obtener_recordatorios(db: AsyncSession):
        from datetime import timedelta
        ahora = datetime.now(timezone.utc)
        ventana = ahora + timedelta(minutes=30)
        result = await db.execute(
            select(Partido).where(
                Partido.fecha >= ahora,
                Partido.fecha <= ventana,
                Partido.estado == "programado",
            )
        )
        return result.scalars().all()
```

- [ ] **Create `backend/app/api/notificaciones.py`**

```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.dependencies import get_current_user, get_db
from backend.app.models.user import User
from backend.app.schemas.push_subscription import PushSubscriptionCreate
from backend.app.services.push_service import PushService

router = APIRouter(prefix="/api/v1/notificaciones", tags=["notificaciones"])


@router.post("/suscribir")
async def suscribir(
    data: PushSubscriptionCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await PushService.suscribir(db, user.id, data)
    return {"ok": True}


@router.delete("/suscribir")
async def desuscribir(
    endpoint: str,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    await PushService.desuscribir(db, user.id, endpoint)
    return {"ok": True}
```

- [ ] **Commit**

```bash
git add backend/requirements.txt backend/app/core/config.py backend/app/schemas/push_subscription.py backend/app/services/push_service.py backend/app/api/notificaciones.py
git commit -m "feat: add push notification service and subscription endpoints"
```

---

### Task 5: Push Triggers in Admin + Prediction Service

**Files:**
- Modify: `backend/app/api/admin.py`
- Modify: `backend/app/services/prediction_service.py`
- Modify: `backend/app/models/__init__.py`

**Interfaces:**
- Consumes: `PushService.enviar_a_partido()`, `PushService.enviar_a_usuario()`

- [ ] **Update `backend/app/api/admin.py` to send gol push on partial update**

Find the `actualizar_partido` endpoint. After the partido update logic but before the response, add:

```python
from backend.app.services.push_service import PushService

# After partido update, send push for gol if en_vivo
if nuevo_estado == "en_vivo" and (nuevo_goles_local is not None and nuevo_goles_visitante is not None):
    await PushService.enviar_a_partido(
        db,
        partido_id,
        "⚽ Gol!",
        f"{partido.local.nombre} {nuevo_goles_local}-{nuevo_goles_visitante} {partido.visitante.nombre}",
        f"/partidos/{partido_id}",
    )
```

And for finalizado, send result push:

```python
if nuevo_estado == "finalizado":
    result = await db.execute(select(Prediction).where(Prediction.partido_id == partido_id))
    preds = result.scalars().all()
    for pred in preds:
        await PushService.enviar_a_usuario(
            db,
            pred.user_id,
            "✅ Resultado de tu predicción",
            f"{partido.local.nombre} {nuevo_goles_local}-{nuevo_goles_visitante} {partido.visitante.nombre} — Obtuviste {pred.puntos} pts",
            f"/predicciones",
        )
```

- [ ] **Update `backend/app/services/prediction_service.py` to send logro push**

In `calcular_puntos`, after assigning points, check for streak:

```python
from backend.app.services.push_service import PushService

# After calculating points, check streak for logro
if pred.puntos >= 2:
    # Count consecutive correct predictions
    streak_result = await db.execute(
        select(func.count(Prediction.id)).where(
            Prediction.user_id == pred.user_id,
            Prediction.puntos >= 2,
        )
    )
    streak_count = streak_result.scalar() or 0
    if streak_count > 0 and streak_count % 5 == 0:
        await PushService.enviar_a_usuario(
            db,
            pred.user_id,
            "🏆 Logro desbloqueado!",
            f"Acertaste {streak_count} predicciones seguidas!",
            f"/predicciones",
        )
```

- [ ] **Commit**

```bash
git add backend/app/api/admin.py backend/app/services/prediction_service.py
git commit -m "feat: trigger push notifications from admin and prediction service"
```

---

### Task 6: Cron Endpoint for Recordatorios

**Files:**
- Create: `backend/app/api/cron.py`
- Modify: `.github/workflows/keep-alive.yml`

**Interfaces:**
- Produces: `POST /api/v1/cron/recordatorios`

- [ ] **Create `backend/app/api/cron.py`**

```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.dependencies import get_db
from backend.app.services.push_service import PushService

router = APIRouter(prefix="/api/v1/cron", tags=["cron"])


@router.post("/recordatorios")
async def enviar_recordatorios(
    db: AsyncSession = Depends(get_db),
):
    partidos = await PushService.obtener_recordatorios(db)
    enviados = 0
    for partido in partidos:
        await PushService.enviar_a_partido(
            db,
            partido.id,
            "🔔 Recordatorio de predicción",
            f"{partido.local.nombre} vs {partido.visitante.nombre} comienza en 30 min!",
            f"/partidos/{partido.id}",
        )
        enviados += 1
    return {"recordatorios_enviados": enviados}
```

- [ ] **Add cron call to `.github/workflows/keep-alive.yml`**

Find the keep-alive workflow and add a step to hit the cron endpoint:

```yaml
      - name: Recordatorios predicciones
        run: curl -s -X POST "https://backend-production-0b7d.up.railway.app/api/v1/cron/recordatorios"
```

- [ ] **Commit**

```bash
git add backend/app/api/cron.py
git commit -m "feat: add cron endpoint for prediction reminders"
```

---

### Task 7: Frontend Chat Components (ChatWidget + ChatMessage)

**Files:**
- Create: `frontend/src/components/ChatWidget.tsx`
- Create: `frontend/src/components/ChatMessage.tsx`

**Interfaces:**
- Consumes: `partidoId` prop
- Produces: Chat UI with WebSocket connection, history REST endpoint

- [ ] **Create `frontend/src/components/ChatMessage.tsx`**

```tsx
interface ChatMessageProps {
  username: string;
  nombre: string;
  imagen: string;
  contenido: string;
  created_at: string;
}

export default function ChatMessage({ username, nombre, imagen, contenido, created_at }: ChatMessageProps) {
  return (
    <div className="flex gap-2 py-2 px-3 hover:bg-gray-800/30 rounded-lg transition-colors">
      <img
        src={imagen || `https://ui-avatars.com/api/?name=${nombre}&background=1f2937&color=fff`}
        alt={nombre}
        className="w-8 h-8 rounded-full mt-0.5"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold text-indigo-400 truncate">
            {nombre}
          </span>
          <span className="text-xs text-gray-500 shrink-0">
            {new Date(created_at).toLocaleTimeString("es-PY", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
        <p className="text-sm text-gray-200 break-words">{contenido}</p>
      </div>
    </div>
  );
}
```

- [ ] **Create `frontend/src/components/ChatWidget.tsx`**

```tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import ChatMessage from "./ChatMessage";

interface ChatWidgetProps {
  partidoId: string;
}

interface Mensaje {
  id: string;
  user_id: string;
  username: string;
  nombre: string;
  imagen: string;
  contenido: string;
  created_at: string;
}

export default function ChatWidget({ partidoId }: ChatWidgetProps) {
  const [messages, setMessages] = useState<Mensaje[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef<WebSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const tokenRef = useRef<string>("");

  const token = typeof window !== "undefined"
    ? localStorage.getItem("auth_token") || ""
    : "";

  useEffect(() => {
    tokenRef.current = token;
  }, [token]);

  // Load history
  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://backend-production-0b7d.up.railway.app";
    fetch(`${apiUrl}/api/v1/partidos/${partidoId}/chat?limit=50`)
      .then((r) => r.json())
      .then((data) => {
        setMessages(data.reverse());
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [partidoId]);

  // WebSocket connection
  useEffect(() => {
    if (!token) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://backend-production-0b7d.up.railway.app";
    const wsUrl = apiUrl.replace(/^http/, "ws");
    const ws = new WebSocket(`${wsUrl}/api/v1/ws/partidos/${partidoId}?token=${token}`);

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.tipo === "mensaje_nuevo") {
        setMessages((prev) => [...prev, data]);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      }
    };

    wsRef.current = ws;
    return () => ws.close();
  }, [partidoId, token]);

  const sendMessage = useCallback(() => {
    if (!input.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    wsRef.current.send(JSON.stringify({ tipo: "mensaje", contenido: input.trim() }));
    setInput("");
  }, [input]);

  return (
    <div className="mt-6 border border-gray-700 rounded-xl overflow-hidden">
      <div className="bg-gray-800/50 px-4 py-2 border-b border-gray-700 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-200">💬 Chat en Vivo</h3>
        <span className={`w-2 h-2 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`} />
      </div>

      <div className="h-72 overflow-y-auto bg-gray-900/50">
        {loading ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            Cargando mensajes...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            No hay mensajes aún. ¡Sé el primero!
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessage key={msg.id} {...msg} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 p-3 border-t border-gray-700 bg-gray-800/30">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          placeholder="Escribe un mensaje..."
          maxLength={500}
          className="flex-1 bg-gray-700 text-sm text-white rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || !connected}
          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Commit**

```bash
git add frontend/src/components/ChatMessage.tsx frontend/src/components/ChatWidget.tsx
git commit -m "feat: add ChatWidget and ChatMessage components"
```

---

### Task 8: Service Worker + Layout Registration

**Files:**
- Create: `frontend/public/sw.js`
- Create: `frontend/src/components/PushSetup.tsx`
- Modify: `frontend/src/app/layout.tsx`

**Interfaces:**
- Produces: Service Worker that listens for push events and opens notification URLs

- [ ] **Create `frontend/public/sw.js`**

```js
self.addEventListener("push", (event) => {
  const data = event.data ? event.data.json() : {};
  const { title, body, icon, badge, data: extra } = data;

  event.waitUntil(
    self.registration.showNotification(title || "Liga Paraguaya", {
      body: body || "",
      icon: icon || "/icon-192.png",
      badge: badge || "/badge-72.png",
      data: extra || {},
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});
```

- [ ] **Register service worker in `frontend/src/app/layout.tsx`**

```tsx
// Add at the top
"use client";

// Add useEffect for SW registration
import { useEffect } from "react";

// Add inside the component body
useEffect(() => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js");
  }
}, []);
```

- [ ] **Also add VAPID public key registration for push subscription in a new component `frontend/src/components/PushSetup.tsx`**

```tsx
"use client";

import { useEffect } from "react";

export default function PushSetup() {
  useEffect(() => {
    if (!("serviceWorker" in navigator && "PushManager" in window)) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://backend-production-0b7d.up.railway.app";

    async function setup() {
      try {
        const registration = await navigator.serviceWorker.ready;
        const vapidResponse = await fetch(`${apiUrl}/api/v1/notificaciones/vapid-public-key`);
        const { publicKey } = await vapidResponse.json();
        const keyBytes = Uint8Array.from(atob(publicKey.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: keyBytes,
        });
        const token = localStorage.getItem("auth_token");
        if (!token) return;
        await fetch(`${apiUrl}/api/v1/notificaciones/suscribir`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(subscription.toJSON()),
        });
      } catch {
        // Notification permission denied or unavailable
      }
    }
    setup();
  }, []);

  return null;
}
```

- [ ] **Add VAPID public key endpoint to `backend/app/api/notificaciones.py`**

```python
from backend.app.core.config import settings

@router.get("/vapid-public-key")
async def get_vapid_public_key():
    return {"publicKey": settings.VAPID_PUBLIC_KEY}
```

- [ ] **Commit**

```bash
git add frontend/public/sw.js frontend/src/app/layout.tsx frontend/src/components/PushSetup.tsx
git commit -m "feat: add service worker and push subscription setup"
```

---

### Task 9: Integrate Chat + Push into Partido Page

**Files:**
- Modify: `frontend/src/app/partidos/[id]/page.tsx`
- Modify: `frontend/src/lib/api.ts`

- [ ] **Add `getChatHistory` to `frontend/src/lib/api.ts`**

```typescript
export async function getChatHistory(partidoId: string, limit = 50, offset = 0): Promise<MensajeChat[]> {
  const res = await fetch(
    `${API_URL}/api/v1/partidos/${partidoId}/chat?limit=${limit}&offset=${offset}`,
    { headers: authHeaders() }
  );
  if (!res.ok) throw new Error("Failed to fetch chat history");
  return res.json();
}

export interface MensajeChat {
  id: string;
  partido_id: string;
  user_id: string;
  username: string;
  nombre: string;
  imagen: string;
  mensaje: string;
  created_at: string;
}
```

- [ ] **Add ChatWidget to partido detail page**

Find the partido detail page at `frontend/src/app/partidos/[id]/page.tsx`. Add ChatWidget import and component below the existing content:

```tsx
import ChatWidget from "@/components/ChatWidget";

// Inside the return, after the prediction section:
{partido && <ChatWidget partidoId={partido.id} />}
```

- [ ] **Add PushSetup to layout or partido page**

Add `<PushSetup />` to the layout or the partido detail page so it activates once on page load.

- [ ] **Commit**

```bash
git add frontend/src/lib/api.ts frontend/src/app/partidos/[id]/page.tsx
git commit -m "feat: integrate chat widget into partido detail page"
```

---

### Task 10: Tests

**Files:**
- Create: `backend/tests/test_chat.py`

- [ ] **Create `backend/tests/test_chat.py`**

```python
import json
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy import select

from backend.app.main import app
from backend.app.models.mensaje_chat import MensajeChat


@pytest.mark.asyncio
async def test_chat_history_empty(client: AsyncClient, test_db):
    response = await client.get("/api/v1/partidos/OLE001/chat")
    assert response.status_code == 200
    assert response.json() == []


@pytest.mark.asyncio
async def test_chat_history_with_messages(client: AsyncClient, test_db, test_user_token):
    # Create a message directly
    from backend.app.core.dependencies import get_db
    from backend.app.schemas.chat import MensajeChatCreate
    from backend.app.services.chat_service import ChatService

    async for db in get_db():
        msg = await ChatService.guardar(
            db, "OLE001", "google_test",
            MensajeChatCreate(contenido="Hola mundo")
        )
        break

    response = await client.get("/api/v1/partidos/OLE001/chat")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["mensaje"] == "Hola mundo"


@pytest.mark.asyncio
async def test_websocket_connect_invalid_token(client: AsyncClient):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        async with ac.stream("GET", "/api/v1/ws/partidos/OLE001?token=bad_token") as response:
            assert response.status_code == 101  # WebSocket upgrade


@pytest.mark.asyncio
async def test_websocket_connect_valid_token(client: AsyncClient, test_user_token):
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        async with ac.stream(
            "GET", f"/api/v1/ws/partidos/OLE001?token={test_user_token}"
        ) as response:
            assert response.status_code == 101  # WebSocket upgrade success


@pytest.mark.asyncio
async def test_push_subscribe(client: AsyncClient, test_user_token):
    response = await client.post(
        "/api/v1/notificaciones/suscribir",
        json={
            "endpoint": "https://example.com/push",
            "p256dh": "key123",
            "auth": "auth123",
        },
        headers={"Authorization": f"Bearer {test_user_token}"},
    )
    assert response.status_code == 200
    assert response.json()["ok"] is True


@pytest.mark.asyncio
async def test_push_unsubscribe(client: AsyncClient, test_user_token):
    # Subscribe first
    await client.post(
        "/api/v1/notificaciones/suscribir",
        json={
            "endpoint": "https://example.com/push2",
            "p256dh": "key456",
            "auth": "auth456",
        },
        headers={"Authorization": f"Bearer {test_user_token}"},
    )
    # Then unsubscribe
    response = await client.delete(
        "/api/v1/notificaciones/suscribir?endpoint=https://example.com/push2",
        headers={"Authorization": f"Bearer {test_user_token}"},
    )
    assert response.status_code == 200
    assert response.json()["ok"] is True
```

- [ ] **Run tests**

```bash
python -m pytest backend/tests/ -v
```

Expected: 24+ tests pass (18 existing + 6 new)

- [ ] **Commit**

```bash
git add backend/tests/test_chat.py
git commit -m "test: add chat and push subscription tests"
```

---

### Post-Implementation: Deploy

- [ ] **Push to feature/frontend-react-v1**

```bash
git push origin feature/frontend-react-v1
```

- [ ] **Generate VAPID keys and set Railway env vars**

```bash
python -c "from pywebpush import generate_vapid_keys; k = generate_vapid_keys(); print(f'VAPID_PUBLIC_KEY={k[\"public_key\"]}\nVAPID_PRIVATE_KEY={k[\"private_key\"]}')"
```

Then add `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_CLAIM_EMAIL` to Railway project env vars.

- [ ] **Deploy via Railway CLI**

```bash
railway up --service backend --ci
```

- [ ] **Verify**

```bash
curl -s "https://backend-production-0b7d.up.railway.app/api/v1/partidos/OLE001/chat"
# Expected: []
```
