from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.config import settings
from ..core.dependencies import get_db
from ..models.api_key import APIKey
from ..models.partido import Partido
from ..schemas.api_key import APIKeyCreate, APIKeyOut
from ..schemas.partido import PartidoDetailOut, PartidoUpdate
from ..services.partido_service import PartidoService

router = APIRouter(prefix="/api/v1/admin", tags=["admin"])


async def verify_admin_key(x_api_key: str = Header(None)):
    if x_api_key != settings.admin_api_key:
        raise HTTPException(status_code=403, detail="API Key invÃ¡lida")
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

    if data.estado == "en_vivo" and data.goles_local is not None and data.goles_visitante is not None:
        from ..services.push_service import PushService
        await PushService.enviar_a_partido(
            db,
            partido_id,
            "âš½ Gol!",
            f"{partido.local.nombre} {partido.goles_local}-{partido.goles_visitante} {partido.visitante.nombre}",
            f"/partidos/{partido_id}",
        )

    await db.commit()

    if was_finalized:
        from ..services.prediction_service import PredictionService
        await PredictionService.calcular_puntos(db, partido_id)
        from ..models.prediction import Prediction
        result = await db.execute(
            select(Prediction.user_id).where(Prediction.partido_id == partido_id).distinct()
        )
        user_ids = [r[0] for r in result.all()]
        for uid in user_ids:
            await PredictionService.recalcular_totales_usuario(db, uid)
        from ..services.push_service import PushService
        result = await db.execute(select(Prediction).where(Prediction.partido_id == partido_id))
        preds = result.scalars().all()
        for pred in preds:
            await PushService.enviar_a_usuario(
                db,
                pred.user_id,
                "âœ… Resultado de tu predicciÃ³n",
                f"{partido.local.nombre} {partido.goles_local}-{partido.goles_visitante} {partido.visitante.nombre} â€” Obtuviste {pred.puntos} pts",
                f"/predicciones",
            )
        await db.commit()
    await db.refresh(partido)
    return await PartidoService.get_by_id(db, partido_id)


@router.post("/api-keys", response_model=APIKeyOut, status_code=201)
async def crear_api_key(
    data: APIKeyCreate,
    _: bool = Depends(verify_admin_key),
    db: AsyncSession = Depends(get_db),
):
    key = APIKey(owner=data.owner, email=data.email)
    db.add(key)
    await db.commit()
    await db.refresh(key)
    return key


@router.get("/api-keys", response_model=list[APIKeyOut])
async def listar_api_keys(
    _: bool = Depends(verify_admin_key),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(APIKey).order_by(APIKey.created_at.desc()))
    return result.scalars().all()


@router.patch("/api-keys/{key_id}/toggle", response_model=APIKeyOut)
async def toggle_api_key(
    key_id: str,
    _: bool = Depends(verify_admin_key),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(APIKey).where(APIKey.key == key_id))
    api_key = result.scalar_one_or_none()
    if not api_key:
        raise HTTPException(status_code=404, detail="API Key no encontrada")
    api_key.is_active = not api_key.is_active
    await db.commit()
    await db.refresh(api_key)
    return api_key


@router.delete("/api-keys/{key_id}", status_code=204)
async def eliminar_api_key(
    key_id: str,
    _: bool = Depends(verify_admin_key),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(APIKey).where(APIKey.key == key_id))
    api_key = result.scalar_one_or_none()
    if not api_key:
        raise HTTPException(status_code=404, detail="API Key no encontrada")
    await db.delete(api_key)
    await db.commit()
