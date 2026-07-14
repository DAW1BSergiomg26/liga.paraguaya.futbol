from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.dependencies import get_current_admin, get_db
from backend.app.schemas.transferencia import (
    EstadisticasTransferencias,
    TransferenciaCreate,
    TransferenciaOut,
    TransferenciaUpdate,
    TransferenciasPaginatedResponse,
)
from backend.app.services.transferencia_service import TransferenciaService

router = APIRouter(prefix="/api/v1/transferencias", tags=["transferencias"])


class SyncResponse(BaseModel):
    created: int
    skipped: int
    errors: list[str]


@router.get("", response_model=TransferenciasPaginatedResponse)
async def list_transferencias(
    club_id: str | None = Query(None),
    tipo: str | None = Query(None),
    estado: str | None = Query(None),
    fecha_desde: date | None = Query(None),
    fecha_hasta: date | None = Query(None),
    jugador: str | None = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
):
    svc = TransferenciaService(db)
    return await svc.get_all(
        club_id=club_id, tipo=tipo, estado=estado,
        fecha_desde=fecha_desde, fecha_hasta=fecha_hasta,
        jugador=jugador, page=page, per_page=per_page,
    )


@router.get("/mercado", response_model=list[TransferenciaOut])
async def mercado_transferencias(
    dias: int = Query(30, ge=1, le=90),
    db: AsyncSession = Depends(get_db),
):
    svc = TransferenciaService(db)
    return await svc.get_mercado(dias=dias)


@router.get("/estadisticas", response_model=EstadisticasTransferencias)
async def estadisticas_transferencias(db: AsyncSession = Depends(get_db)):
    svc = TransferenciaService(db)
    return await svc.get_estadisticas()


@router.get("/historial/{club_id}", response_model=list[TransferenciaOut])
async def historial_club(club_id: str, db: AsyncSession = Depends(get_db)):
    svc = TransferenciaService(db)
    return await svc.get_historial(club_id)


@router.get("/{transferencia_id}", response_model=TransferenciaOut)
async def get_transferencia(transferencia_id: str, db: AsyncSession = Depends(get_db)):
    svc = TransferenciaService(db)
    t = await svc.get_by_id(transferencia_id)
    if not t:
        raise HTTPException(status_code=404, detail="Transferencia no encontrada")
    return t


@router.post("", response_model=TransferenciaOut, status_code=status.HTTP_201_CREATED)
async def create_transferencia(
    body: TransferenciaCreate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    if body.club_origen_id and body.club_origen_id == body.club_destino_id:
        raise HTTPException(status_code=400, detail="Club origen y destino no pueden ser el mismo")
    svc = TransferenciaService(db)
    return await svc.create(body)


@router.put("/{transferencia_id}", response_model=TransferenciaOut)
async def update_transferencia(
    transferencia_id: str,
    body: TransferenciaUpdate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    svc = TransferenciaService(db)
    t = await svc.update(transferencia_id, body)
    if not t:
        raise HTTPException(status_code=404, detail="Transferencia no encontrada")
    return t


@router.delete("/{transferencia_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transferencia(
    transferencia_id: str,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    svc = TransferenciaService(db)
    deleted = await svc.delete(transferencia_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Transferencia no encontrada")
