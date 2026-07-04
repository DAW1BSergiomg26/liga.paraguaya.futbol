from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.dependencies import get_db
from backend.app.schemas.partido import PartidoDetailOut, PartidoOut, PartidoPage
from backend.app.services.partido_service import PartidoService

router = APIRouter(prefix="/api/v1/partidos", tags=["partidos"])


@router.get("", response_model=PartidoPage)
async def listar_partidos(
    page: int = 1,
    per_page: int = 25,
    torneo: Optional[str] = None,
    estado: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    if page < 1:
        page = 1
    if per_page < 1:
        per_page = 25
    if per_page > 100:
        per_page = 100
    partidos, total = await PartidoService.get_all_paginated(
        db, torneo=torneo, estado=estado, page=page, per_page=per_page
    )
    return PartidoPage(
        data=partidos,
        total=total,
        page=page,
        per_page=per_page,
        total_pages=(total + per_page - 1) // per_page if total > 0 else 1,
    )


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
