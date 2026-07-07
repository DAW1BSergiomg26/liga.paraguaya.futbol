# Task 4: Push Service + Subscription Endpoints

## Files
- Modify: `backend/requirements.txt` (add pywebpush)
- Modify: `backend/app/core/config.py` (add VAPID env vars)
- Create: `backend/app/schemas/push_subscription.py`
- Create: `backend/app/services/push_service.py`
- Create: `backend/app/api/notificaciones.py` (overwrite existing stub)

## Exact Code

### backend/requirements.txt — Append
```
pywebpush>=1.0.0
```

### backend/app/core/config.py — Add to Settings class
```python
    VAPID_PUBLIC_KEY: str = ""
    VAPID_PRIVATE_KEY: str = ""
    VAPID_CLAIM_EMAIL: str = "admin@ligapy.app"
```

### backend/app/schemas/push_subscription.py
```python
from pydantic import BaseModel


class PushSubscriptionCreate(BaseModel):
    endpoint: str
    p256dh: str
    auth: str
```

### backend/app/services/push_service.py
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

### backend/app/api/notificaciones.py
```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.config import settings
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


@router.get("/vapid-public-key")
async def get_vapid_public_key():
    return {"publicKey": settings.VAPID_PUBLIC_KEY}
```

## Global Constraints
- `pywebpush` imported with try/except guard (graceful if not installed)
- Subscription id pattern: `f"sub_{uuid.uuid4().hex[:12]}"`
- Token auth via `get_current_user` dependency
- Follow existing service patterns

## Commit
```bash
git add backend/requirements.txt backend/app/core/config.py backend/app/schemas/push_subscription.py backend/app/services/push_service.py backend/app/api/notificaciones.py
git commit -m "feat: add push notification service and subscription endpoints"
```

## Report File
`.superpowers/sdd/task-4-report.md`
