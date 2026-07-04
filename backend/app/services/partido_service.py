from typing import Optional

from sqlalchemy import func, select
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

    @staticmethod
    async def get_all_paginated(
        db: AsyncSession,
        torneo: Optional[str] = None,
        estado: Optional[str] = None,
        page: int = 1,
        per_page: int = 25,
    ) -> tuple[list[PartidoOut], int]:
        base = select(Partido)
        if torneo:
            base = base.where(Partido.torneo == torneo)
        if estado:
            base = base.where(Partido.estado == estado)

        count_stmt = select(func.count()).select_from(base.subquery())
        total = (await db.execute(count_stmt)).scalar() or 0

        stmt = base.order_by(Partido.fecha.desc()).offset((page - 1) * per_page).limit(per_page)
        result = await db.execute(stmt)
        partidos = result.scalars().all()
        return [PartidoOut.model_validate(p) for p in partidos], total
