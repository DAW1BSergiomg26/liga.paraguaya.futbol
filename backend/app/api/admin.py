from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.config import settings
from backend.app.core.dependencies import get_db
from backend.app.models.partido import Partido
from backend.app.schemas.partido import PartidoDetailOut, PartidoUpdate
from backend.app.services.partido_service import PartidoService

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


async def verify_admin_key(x_api_key: str = Header(None)):
    if x_api_key != settings.admin_api_key:
        raise HTTPException(status_code=403, detail="API Key inválida")
    return True


@router.put("/partidos/{partido_id}", response_model=PartidoDetailOut)
async def actualizar_partido(
    partido_id: str,
    data: PartidoUpdate,
    _: bool = Depends(verify_admin_key),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Partido).where(Partido.id == partido_id))
    partido = result.scalar_one_or_none()
    if not partido:
        raise HTTPException(status_code=404, detail="Partido no encontrado")

    if data.goles_local is not None:
        partido.goles_local = data.goles_local
    if data.goles_visitante is not None:
        partido.goles_visitante = data.goles_visitante
    if data.estado is not None:
        partido.estado = data.estado

    was_finalized = partido.estado == "finalizado"

    await db.commit()

    if was_finalized:
        from backend.app.services.prediction_service import PredictionService
        await PredictionService.calcular_puntos(db, partido_id)
        from backend.app.models.prediction import Prediction
        result = await db.execute(
            select(Prediction.user_id).where(Prediction.partido_id == partido_id).distinct()
        )
        user_ids = [r[0] for r in result.all()]
        for uid in user_ids:
            await PredictionService.recalcular_totales_usuario(db, uid)
        await db.commit()
    await db.refresh(partido)
    return await PartidoService.get_by_id(db, partido_id)
