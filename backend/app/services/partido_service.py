from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..models.club import Club
from ..models.partido import Partido
from ..schemas.partido import (
    ClubResumen,
    H2HOut,
    H2HPartidoItem,
    MayorGoleada,
    PartidoDetailOut,
    PartidoOut,
)


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

    @staticmethod
    async def get_en_vivo(db: AsyncSession) -> list[Partido]:
        stmt = select(Partido).where(Partido.estado == "en_vivo")
        result = await db.execute(stmt)
        return list(result.scalars().all())

    @staticmethod
    async def get_h2h(
        db: AsyncSession,
        club_a: str,
        club_b: str,
    ) -> H2HOut:
        club_a_obj = await db.get(Club, club_a)
        club_b_obj = await db.get(Club, club_b)

        stmt = (
            select(Partido)
            .where(
                ((Partido.local_id == club_a) & (Partido.visitante_id == club_b)) |
                ((Partido.local_id == club_b) & (Partido.visitante_id == club_a))
            )
            .order_by(Partido.fecha.desc())
        )
        result = await db.execute(stmt)
        partidos = result.scalars().all()

        items = []
        for p in partidos:
            items.append(H2HPartidoItem(
                id=p.id,
                torneo=p.torneo,
                jornada=p.jornada,
                fecha=p.fecha.isoformat() if p.fecha else "",
                estado=p.estado,
                goles_local=p.goles_local,
                goles_visitante=p.goles_visitante,
                local_id=p.local_id,
                visitante_id=p.visitante_id,
            ))

        victorias_a = 0
        victorias_b = 0
        empates = 0
        goles_a = 0
        goles_b = 0
        mayor_a_goles = 0
        mayor_a_recibidos = 0
        mayor_a_fecha = ""
        mayor_b_goles = 0
        mayor_b_recibidos = 0
        mayor_b_fecha = ""

        for p in partidos:
            if p.goles_local is None or p.goles_visitante is None:
                continue
            if p.estado != "finalizado":
                continue

            if p.local_id == club_a:
                ga, gb = p.goles_local, p.goles_visitante
            else:
                ga, gb = p.goles_visitante, p.goles_local

            goles_a += ga
            goles_b += gb

            if ga > gb:
                victorias_a += 1
                if ga > mayor_a_goles:
                    mayor_a_goles = ga
                    mayor_a_recibidos = gb
                    mayor_a_fecha = p.fecha.isoformat() if p.fecha else ""
            elif gb > ga:
                victorias_b += 1
                if gb > mayor_b_goles:
                    mayor_b_goles = gb
                    mayor_b_recibidos = ga
                    mayor_b_fecha = p.fecha.isoformat() if p.fecha else ""
            else:
                empates += 1

        mayor_goleada_a = None
        if mayor_a_goles > 0:
            mayor_goleada_a = MayorGoleada(goles=mayor_a_goles, fecha=mayor_a_fecha, goles_recibidos=mayor_a_recibidos)

        mayor_goleada_b = None
        if mayor_b_goles > 0:
            mayor_goleada_b = MayorGoleada(goles=mayor_b_goles, fecha=mayor_b_fecha, goles_recibidos=mayor_b_recibidos)

        from ..schemas.partido import ResumenOut

        resumen = ResumenOut(
            pj=victorias_a + empates + victorias_b,
            victorias_a=victorias_a,
            empates=empates,
            victorias_b=victorias_b,
            goles_a=goles_a,
            goles_b=goles_b,
            mayor_goleada_a=mayor_goleada_a,
            mayor_goleada_b=mayor_goleada_b,
        )

        return H2HOut(
            club_a=ClubResumen(id=club_a, nombre=club_a_obj.nombre if club_a_obj else club_a, escudo=club_a_obj.escudo if club_a_obj else ""),
            club_b=ClubResumen(id=club_b, nombre=club_b_obj.nombre if club_b_obj else club_b, escudo=club_b_obj.escudo if club_b_obj else ""),
            resumen=resumen,
            partidos=items,
        )
