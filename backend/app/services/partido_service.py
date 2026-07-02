from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.app.models.partido import Partido
from backend.app.schemas.partido import PartidoDetailOut, PartidoOut


class PartidoService:

    @staticmethod
    async def get_all(
        db: AsyncSession,
        torneo: Optional[str] = None,
        estado: Optional[str] = None,
    ) -> list[PartidoOut]:
        stmt = select(Partido)
        if torneo:
            stmt = stmt.where(Partido.torneo == torneo)
        if estado:
            stmt = stmt.where(Partido.estado == estado)
        stmt = stmt.order_by(Partido.fecha.desc())
        result = await db.execute(stmt)
        partidos = result.scalars().all()
        return [PartidoOut.model_validate(p) for p in partidos]

    @staticmethod
    async def get_by_id(db: AsyncSession, partido_id: str) -> Optional[PartidoDetailOut]:
        stmt = (
            select(Partido)
            .where(Partido.id == partido_id)
            .options(selectinload(Partido.local), selectinload(Partido.visitante))
        )
        result = await db.execute(stmt)
        partido = result.scalar_one_or_none()
        if not partido:
            return None
        return PartidoDetailOut(
            id=partido.id,
            torneo=partido.torneo,
            fecha=partido.fecha,
            jornada=partido.jornada,
            local_id=partido.local_id,
            visitante_id=partido.visitante_id,
            goles_local=partido.goles_local,
            goles_visitante=partido.goles_visitante,
            estado=partido.estado,
            local_nombre=partido.local.nombre if partido.local else "",
            visitante_nombre=partido.visitante.nombre if partido.visitante else "",
        )
