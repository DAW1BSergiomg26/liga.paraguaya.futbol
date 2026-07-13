from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.club import Club
from backend.app.models.goleador import Goleador
from backend.app.schemas.goleador import GoleadorOut, GoleadoresListOut


class GoleadorService:

    @staticmethod
    async def get_all(
        db: AsyncSession,
        torneo: Optional[str] = None,
        limit: int = 20,
    ) -> GoleadoresListOut:
        stmt = (
            select(Goleador, Club.nombre.label("club_nombre"))
            .join(Club, Goleador.club_id == Club.id)
        )
        if torneo:
            stmt = stmt.where(Goleador.torneo == torneo)
        stmt = stmt.order_by(Goleador.goles.desc()).limit(limit)
        result = await db.execute(stmt)
        goleadores = [
            GoleadorOut(
                id=g[0].id,
                nombre=g[0].nombre,
                club_id=g[0].club_id,
                club_nombre=g[1] or "",
                goles=g[0].goles,
                asistencias=g[0].asistencias,
                torneo=g[0].torneo,
                temporada=g[0].temporada,
            )
            for g in result.all()
        ]
        return GoleadoresListOut(
            goleadores=goleadores,
            total=len(goleadores),
        )
