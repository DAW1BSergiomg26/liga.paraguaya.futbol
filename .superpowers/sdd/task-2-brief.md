# Task 2: Chat Schema + Service

## Files to Create
- `backend/app/schemas/chat.py`
- `backend/app/services/chat_service.py`

## Exact Code

### backend/app/schemas/chat.py
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

### backend/app/services/chat_service.py
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

## Global Constraints
- `id` pattern: `f"msg_{uuid.uuid4().hex[:12]}"`
- Token auth reuses `get_current_user` dependency from `backend/app/core/dependencies.py`
- Follow existing service patterns in `backend/app/services/`

## Commit
```bash
git add backend/app/schemas/chat.py backend/app/services/chat_service.py
git commit -m "feat: add chat schema and service"
```

## Report File
`.superpowers/sdd/task-2-report.md`
