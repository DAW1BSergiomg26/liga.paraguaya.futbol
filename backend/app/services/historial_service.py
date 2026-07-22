import re
import time

from sqlalchemy import and_, case, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.club import Club
from ..models.goleador import Goleador
from ..models.tabla import TablaPosicion
from ..models.transferencia import Transferencia
from ..schemas.historial import (
    CampeonOut,
    ClubRadar,
    ClubTemporadaOut,
    ComparacionClubOut,
    MetricaRadar,
    RankingClubOut,
)

_CACHE: dict[tuple[str, str], tuple[float, ComparacionClubOut]] = {}
_CACHE_TTL = 30  # seconds


def _parse_ano(torneo: str) -> int:
    m = re.search(r"(\d{4})", torneo)
    return int(m.group(1)) if m else 0


def _order(torneo: str) -> int:
    low = torneo.lower()
    if "apertura" in low:
        return 0
    if "regular" in low:
        return 1
    if "clausura" in low:
        return 2
    return 3


def _sort_key(torneo: str):
    return (_parse_ano(torneo), _order(torneo))


class HistorialService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_campeones(self) -> list[CampeonOut]:
        subq = (
            select(
                TablaPosicion.torneo,
                func.min(TablaPosicion.posicion).label("min_pos"),
            )
            .where(TablaPosicion.jornada == 0)
            .group_by(TablaPosicion.torneo)
            .subquery()
        )

        stmt = (
            select(
                TablaPosicion.torneo,
                TablaPosicion.club_id,
                TablaPosicion.puntos,
            )
            .join(
                subq,
                and_(
                    TablaPosicion.torneo == subq.c.torneo,
                    TablaPosicion.posicion == subq.c.min_pos,
                ),
            )
            .where(TablaPosicion.jornada == 0)
        )

        result = await self.db.execute(stmt)
        rows = result.all()

        club_rows = (await self.db.execute(select(Club))).scalars().all()
        club_map = {c.id: c for c in club_rows}

        campeones = []
        for torneo, club_id, puntos in rows:
            c = club_map.get(club_id)
            campeones.append(CampeonOut(
                ano=_parse_ano(torneo),
                torneo=torneo,
                club_id=club_id,
                club=c.nombre if c else club_id,
                escudo=c.escudo if c else None,
                puntos=puntos,
            ))
        campeones.sort(key=lambda c: _sort_key(c.torneo))
        campeones.reverse()
        return campeones

    async def get_ranking_clubes(self) -> list[RankingClubOut]:
        stmt = (
            select(
                TablaPosicion.club_id,
                func.sum(TablaPosicion.pj).label("pj"),
                func.sum(TablaPosicion.pg).label("pg"),
                func.sum(TablaPosicion.pe).label("pe"),
                func.sum(TablaPosicion.pp).label("pp"),
                func.sum(TablaPosicion.gf).label("gf"),
                func.sum(TablaPosicion.gc).label("gc"),
                func.sum(TablaPosicion.dg).label("dg"),
                func.sum(TablaPosicion.puntos).label("puntos"),
                func.count().label("torneos_jugados"),
                func.sum(case((TablaPosicion.posicion == 1, 1), else_=0)).label("titulos"),
            )
            .group_by(TablaPosicion.club_id)
        )

        result = await self.db.execute(stmt)
        rows = result.all()

        club_rows = (await self.db.execute(select(Club))).scalars().all()
        club_map = {c.id: c for c in club_rows}

        out = []
        for row in rows:
            c = club_map.get(row.club_id)
            out.append(RankingClubOut(
                club_id=row.club_id,
                club=c.nombre if c else row.club_id,
                escudo=c.escudo if c else None,
                pj=row.pj, pg=row.pg, pe=row.pe, pp=row.pp,
                gf=row.gf, gc=row.gc, dg=row.dg, puntos=row.puntos,
                titulos=row.titulos,
                torneos_jugados=row.torneos_jugados,
            ))
        out.sort(key=lambda r: (r.puntos, r.titulos), reverse=True)
        return out

    async def get_club_historial(self, club_id: str) -> list[ClubTemporadaOut]:
        result = await self.db.execute(
            select(TablaPosicion)
            .where(TablaPosicion.club_id == club_id)
        )
        rows = result.scalars().all()
        out = [
            ClubTemporadaOut(
                ano=_parse_ano(t.torneo),
                torneo=t.torneo,
                posicion=t.posicion,
                puntos=t.puntos,
                dg=t.dg,
            )
            for t in rows
        ]
        out.sort(key=lambda r: _sort_key(r.torneo))
        out.reverse()
        return out

    async def comparar_clubes(self, club_a_id: str, club_b_id: str) -> ComparacionClubOut:
        cache_key = tuple(sorted([club_a_id, club_b_id]))
        now = time.time()
        if cache_key in _CACHE:
            cached_time, cached_result = _CACHE[cache_key]
            if now - cached_time < _CACHE_TTL:
                return cached_result

        # 1. Aggregated tabla stats per club
        result = await self.db.execute(select(TablaPosicion))
        rows = result.scalars().all()

        agg: dict[str, dict] = {}
        titulos: dict[str, int] = {}
        for t in rows:
            a = agg.setdefault(t.club_id, {"pj": 0, "gf": 0, "gc": 0, "puntos": 0})
            a["pj"] += t.pj
            a["gf"] += t.gf
            a["gc"] += t.gc
            a["puntos"] += t.puntos
            if t.posicion == 1:
                titulos[t.club_id] = titulos.get(t.club_id, 0) + 1

        # 2. Goals per player aggregated by club
        goleadores_result = await self.db.execute(select(Goleador))
        goleadores = goleadores_result.scalars().all()
        goles_por_club: dict[str, int] = {}
        for g in goleadores:
            goles_por_club[g.club_id] = goles_por_club.get(g.club_id, 0) + g.goles

        # 3. Transfer spending per club
        transfer_result = await self.db.execute(
            select(Transferencia).where(
                Transferencia.monto.isnot(None),
                Transferencia.estado.in_(["confirmada", "oficial"]),
            )
        )
        transferencias = transfer_result.scalars().all()
        monto_por_club: dict[str, float] = {}
        for t in transferencias:
            if t.club_destino_id:
                monto_por_club[t.club_destino_id] = monto_por_club.get(t.club_destino_id, 0) + (t.monto or 0)
            if t.club_origen_id:
                monto_por_club[t.club_origen_id] = monto_por_club.get(t.club_origen_id, 0) + (t.monto or 0)

        # 4. Compute league maximums for normalization
        all_club_ids = set(agg.keys()) | set(goles_por_club.keys()) | set(monto_por_club.keys()) | set(titulos.keys())
        max_ataque = 0.0
        max_titulos = max(titulos.values()) if titulos else 1
        max_goles = max(goles_por_club.values()) if goles_por_club else 1
        max_monto = max(monto_por_club.values()) if monto_por_club else 1

        for cid in all_club_ids:
            a = agg.get(cid, {"pj": 0, "gf": 0, "gc": 0, "puntos": 0})
            pj = a["pj"]
            if pj > 0:
                ataque_rate = a["gf"] / pj
                if ataque_rate > max_ataque:
                    max_ataque = ataque_rate

        # Avoid division by zero
        if max_ataque == 0:
            max_ataque = 1
        if max_titulos == 0:
            max_titulos = 1
        if max_goles == 0:
            max_goles = 1
        if max_monto == 0:
            max_monto = 1

        def _build_metricas(club_id: str) -> MetricaRadar:
            a = agg.get(club_id, {"pj": 0, "gf": 0, "gc": 0, "puntos": 0})
            pj = a["pj"]
            if pj > 0:
                ataque = min(100.0, (a["gf"] / pj) / max_ataque * 100)
                gc_per_pj = a["gc"] / pj
                defensa = min(100.0, 100.0 * (1.0 / max(1.0, gc_per_pj)))
                rendimiento = min(100.0, a["puntos"] / (pj * 3) * 100)
            else:
                ataque = defensa = rendimiento = 0.0

            palmares = min(100.0, titulos.get(club_id, 0) / max_titulos * 100)
            gol_ind = min(100.0, goles_por_club.get(club_id, 0) / max_goles * 100)
            merc = min(100.0, monto_por_club.get(club_id, 0) / max_monto * 100)

            return MetricaRadar(
                ataque=round(ataque, 2),
                defensa=round(defensa, 2),
                rendimiento=round(rendimiento, 2),
                palmares=round(palmares, 2),
                gol_individual=round(gol_ind, 2),
                actividad_mercado=round(merc, 2),
            )

        club_rows = (await self.db.execute(select(Club))).scalars().all()
        club_map = {c.id: c for c in club_rows}

        def _build_club(club_id: str) -> ClubRadar:
            c = club_map.get(club_id)
            return ClubRadar(
                club_id=club_id,
                nombre=c.nombre if c else club_id,
                escudo=c.escudo if c else None,
                metricas=_build_metricas(club_id),
            )

        comparison = ComparacionClubOut(
            club_a=_build_club(club_a_id),
            club_b=_build_club(club_b_id),
        )

        _CACHE[cache_key] = (now, comparison)
        return comparison
