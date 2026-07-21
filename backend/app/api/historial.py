from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.schemas.historial import (
    CampeonOut,
    ClubTemporadaOut,
    ComparacionClubOut,
    RankingClubOut,
)
from app.services.historial_service import HistorialService

router = APIRouter(prefix="/api/v1/historial", tags=["historial"])


@router.get("/campeones", response_model=list[CampeonOut])
async def campeones(db: AsyncSession = Depends(get_db)):
    return await HistorialService(db).get_campeones()


@router.get("/ranking-clubes", response_model=list[RankingClubOut])
async def ranking_clubes(db: AsyncSession = Depends(get_db)):
    return await HistorialService(db).get_ranking_clubes()


@router.get("/club/{club_id}", response_model=list[ClubTemporadaOut])
async def club_historial(club_id: str, db: AsyncSession = Depends(get_db)):
    return await HistorialService(db).get_club_historial(club_id)


@router.get("/comparar", response_model=ComparacionClubOut)
async def comparar_clubes(
    club_a: str,
    club_b: str,
    db: AsyncSession = Depends(get_db),
):
    return await HistorialService(db).comparar_clubes(club_a, club_b)
