import json
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.models.prediction import Prediction
from app.models.partido import Partido
from app.models.push_subscription import PushSubscription as PushSubscriptionModel
from app.schemas.push_subscription import PushSubscriptionCreate

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
            p256dh=data.keys.p256dh,
            auth=data.keys.auth,
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
