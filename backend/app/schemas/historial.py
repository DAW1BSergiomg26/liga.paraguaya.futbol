# backend/app/schemas/historial.py
from pydantic import BaseModel


class CampeonOut(BaseModel):
    ano: int
    torneo: str
    club_id: str
    club: str
    escudo: str | None = None
    puntos: int


class RankingClubOut(BaseModel):
    club_id: str
    club: str
    escudo: str | None = None
    pj: int
    pg: int
    pe: int
    pp: int
    gf: int
    gc: int
    dg: int
    puntos: int
    titulos: int
    torneos_jugados: int


class ClubTemporadaOut(BaseModel):
    ano: int
    torneo: str
    posicion: int
    puntos: int
    dg: int
