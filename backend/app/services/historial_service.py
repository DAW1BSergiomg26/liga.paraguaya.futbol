import re
import time

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.club import Club
from backend.app.models.goleador import Goleador
from backend.app.models.tabla import TablaPosicion
from backend.app.models.transferencia import Transferencia
from backend.app.schemas.historial import (
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
        result = await self.db.execute(select(TablaPosicion.torneo).distinct())
        torneos = result.scalars().all()
        campeones = []
        for torneo in torneos:
            row = await self.db.execute(
                select(TablaPosicion)
                .where(TablaPosicion.torneo == torneo)
                .where(TablaPosicion.posicion == 1)
                .order_by(TablaPosicion.puntos.desc())
                .limit(1)
            )
            t = row.scalar_one_or_none()
            if not t:
                continue
            club = (await self.db.execute(select(Club).where(Club.id == t.club_id))).scalar_one_or_none()
            campeones.append(CampeonOut(
                ano=_parse_ano(torneo),
                torneo=torneo,
                club_id=t.club_id,
                club=club.nombre if club else t.club_id,
                escudo=club.escudo if club else None,
                puntos=t.puntos,
            ))
        campeones.sort(key=lambda c: _sort_key(c.torneo))
        campeones.reverse()
        return campeones

    async def get_ranking_clubes(self) -> list[RankingClubOut]:
        result = await self.db.execute(select(TablaPosicion))
        rows = result.scalars().all()

        agg: dict[str, dict] = {}
        titulos: dict[str, int] = {}
        for t in rows:
            a = agg.setdefault(t.club_id, {
                "pj": 0, "pg": 0, "pe": 0, "pp": 0,
                "gf": 0, "gc": 0, "dg": 0, "puntos": 0, "torneos_jugados": 0,
            })
            a["pj"] += t.pj
            a["pg"] += t.pg
            a["pe"] += t.pe
            a["pp"] += t.pp
            a["gf"] += t.gf
            a["gc"] += t.gc
            a["dg"] += t.dg
            a["puntos"] += t.puntos
            a["torneos_jugados"] += 1
            if t.posicion == 1:
                titulos[t.club_id] = titulos.get(t.club_id, 0) + 1

        club_rows = (await self.db.execute(select(Club))).scalars().all()
        club_map = {c.id: c for c in club_rows}

        out = []
        for club_id, a in agg.items():
            c = club_map.get(club_id)
            out.append(RankingClubOut(
                club_id=club_id,
                club=c.nombre if c else club_id,
                escudo=c.escudo if c else None,
                pj=a["pj"], pg=a["pg"], pe=a["pe"], pp=a["pp"],
                gf=a["gf"], gc=a["gc"], dg=a["dg"], puntos=a["puntos"],
                titulos=titulos.get(club_id, 0),
                torneos_jugados=a["torneos_jugados"],
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
        max_defensa_inv = 0.0
        max_titulos = max(titulos.values()) if titulos else 1
        max_goles = max(goles_por_club.values()) if goles_por_club else 1
        max_monto = max(monto_por_club.values()) if monto_por_club else 1

        for cid in all_club_ids:
            a = agg.get(cid, {"pj": 0, "gf": 0, "gc": 0, "puntos": 0})
            pj = a["pj"]
            if pj > 0:
                ataque_rate = a["gf"] / pj
                defensa_inv = 1 - (a["gc"] / pj)
                if ataque_rate > max_ataque:
                    max_ataque = ataque_rate
                if defensa_inv > max_defensa_inv:
                    max_defensa_inv = defensa_inv

        # Avoid division by zero
        if max_ataque == 0:
            max_ataque = 1
        if max_defensa_inv == 0:
            max_defensa_inv = 1
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
                defensa = min(100.0, max(0, (1 - a["gc"] / pj)) / max_defensa_inv * 100)
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
