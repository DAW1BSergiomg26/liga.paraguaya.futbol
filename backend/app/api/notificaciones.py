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
