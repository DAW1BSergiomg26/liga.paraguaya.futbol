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
