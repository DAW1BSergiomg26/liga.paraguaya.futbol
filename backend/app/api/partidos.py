from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.dependencies import get_db
from backend.app.schemas.partido import PartidoDetailOut, PartidoOut
from backend.app.services.partido_service import PartidoService

router = APIRouter(prefix="/api/v1/partidos", tags=["partidos"])


@router.get("", response_model=list[PartidoOut])
async def listar_partidos(
    torneo: Optional[str] = None,
    estado: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    return await PartidoService.get_all(db, torneo=torneo, estado=estado)


@router.get("/{partido_id}", response_model=PartidoDetailOut)
async def detalle_partido(
    partido_id: str,
    db: AsyncSession = Depends(get_db),
):
    partido = await PartidoService.get_by_id(db, partido_id)
    if not partido:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró el partido con id: {partido_id}",
        )
    return partido
