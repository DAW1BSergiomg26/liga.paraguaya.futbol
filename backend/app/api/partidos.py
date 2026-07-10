from datetime import date, datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.dependencies import get_db
from backend.app.schemas.partido import H2HOut, PartidoDetailOut, PartidoOut, PartidoPage
from backend.app.services.partido_service import PartidoService

router = APIRouter(prefix="/api/v1/partidos", tags=["partidos"])


class MarcadorOut(BaseModel):
    goles_local: Optional[int] = None
    goles_visitante: Optional[int] = None
    minuto: int = 0


@router.get("/marcadores", response_model=dict[str, MarcadorOut])
async def marcadores_en_vivo(db: AsyncSession = Depends(get_db)):
    partidos = await PartidoService.get_en_vivo(db)
    now = datetime.now(timezone.utc)
    result = {}
    for p in partidos:
        minuto = 0
        if isinstance(p.fecha, date):
            match_start = datetime.combine(p.fecha, datetime.min.time(), tzinfo=timezone.utc)
            delta = now - match_start
            minuto = min(max(int(delta.total_seconds() // 60), 0), 120)
        result[p.id] = MarcadorOut(
            goles_local=p.goles_local,
            goles_visitante=p.goles_visitante,
            minuto=minuto,
        )
    return result


@router.get("/h2h", response_model=H2HOut)
async def h2h_partidos(
    club_a: str = Query(...),
    club_b: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    if club_a == club_b:
        raise HTTPException(status_code=400, detail="club_a and club_b must be different")

    from backend.app.models.club import Club

    club_a_obj = await db.get(Club, club_a)
    club_b_obj = await db.get(Club, club_b)
    if not club_a_obj:
        raise HTTPException(status_code=404, detail=f"Club '{club_a}' not found")
    if not club_b_obj:
        raise HTTPException(status_code=404, detail=f"Club '{club_b}' not found")

    return await PartidoService.get_h2h(db, club_a, club_b)


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


@router.get("/{partido_id}/marcador", response_model=MarcadorOut)
async def marcador_partido(
    partido_id: str,
    db: AsyncSession = Depends(get_db),
):
    partido = await PartidoService.get_by_id(db, partido_id)
    if not partido:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontró el partido con id: {partido_id}",
        )
    minuto = 0
    if partido.estado == "finalizado":
        minuto = 90
    elif partido.estado == "en_vivo" and isinstance(partido.fecha, date):
        match_start = datetime.combine(partido.fecha, datetime.min.time(), tzinfo=timezone.utc)
        delta = datetime.now(timezone.utc) - match_start
        minuto = min(max(int(delta.total_seconds() // 60), 0), 120)
    return MarcadorOut(
        goles_local=partido.goles_local,
        goles_visitante=partido.goles_visitante,
        minuto=minuto,
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
