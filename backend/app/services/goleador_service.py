from typing import Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.club import Club
from app.models.goleador import Goleador
from app.schemas.goleador import GoleadorOut, GoleadoresListOut


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

    @staticmethod
    async def get_historial(
        db: AsyncSession,
        limit: int = 20,
    ) -> GoleadoresListOut:
        """Ranking historico acumulado por jugador (suma goles/asistencias)."""
        stmt = (
            select(
                Goleador.nombre,
                Goleador.club_id,
                Club.nombre.label("club_nombre"),
                func.sum(Goleador.goles).label("goles"),
                func.sum(Goleador.asistencias).label("asistencias"),
                func.count(Goleador.id).label("torneos"),
            )
            .join(Club, Goleador.club_id == Club.id)
            .group_by(Goleador.nombre, Goleador.club_id, Club.nombre)
            .order_by(func.sum(Goleador.goles).desc())
            .limit(limit)
        )
        result = await db.execute(stmt)
        goleadores = [
            GoleadorOut(
                id=f"hist-{r.nombre}".lower().replace(" ", "-"),
                nombre=r.nombre,
                club_id=r.club_id,
                club_nombre=r.club_nombre or "",
                goles=int(r.goles or 0),
                asistencias=int(r.asistencias or 0),
                torneo=f"{int(r.torneos)} torneo(s)",
                temporada="HistÃ³rico",
            )
            for r in result.all()
        ]
        return GoleadoresListOut(
            goleadores=goleadores,
            total=len(goleadores),
        )
