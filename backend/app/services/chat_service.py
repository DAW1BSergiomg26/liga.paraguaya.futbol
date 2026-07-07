import uuid
from datetime import datetime, timezone

from sqlalchemy import select
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
