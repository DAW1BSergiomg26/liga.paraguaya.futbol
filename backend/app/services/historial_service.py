import re
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.club import Club
from backend.app.models.tabla import TablaPosicion
from backend.app.schemas.historial import (
    CampeonOut,
    ClubTemporadaOut,
    RankingClubOut,
)


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
