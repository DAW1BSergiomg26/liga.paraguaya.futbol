from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.dependencies import get_db
from backend.app.models.club import Club
from backend.app.models.partido import Partido
from backend.app.models.tabla import TablaPosicion

router = APIRouter()


@router.get("/global")
async def get_global_stats(db: AsyncSession = Depends(get_db)):
    """Retorna estadísticas globales para el hero."""
    clubes_result = await db.execute(select(func.count(Club.id)))
    total_clubes = clubes_result.scalar() or 0

    partidos_result = await db.execute(select(func.sum(TablaPosicion.pj)))
    total_pj = partidos_result.scalar() or 0
    total_partidos = total_pj // 2

    goles_result = await db.execute(select(func.sum(TablaPosicion.gf)))
    total_goles = goles_result.scalar() or 0

    return {
        "total_partidos": total_partidos,
        "total_goles": total_goles,
        "total_clubes": total_clubes,
    }
