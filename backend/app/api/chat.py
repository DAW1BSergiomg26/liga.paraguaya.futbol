import json
from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.models.partido import Partido
from app.models.user import User
from app.schemas.chat import MensajeChatCreate, MensajeChatOut
from app.services.chat_service import ChatService

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
