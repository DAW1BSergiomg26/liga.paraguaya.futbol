from datetime import date
from typing import Optional

from pydantic import BaseModel


class PartidoOut(BaseModel):
    id: str
    torneo: str
    fecha: date
    jornada: int
    temporada: str = "2026"
    local_id: str
    visitante_id: str
    goles_local: Optional[int] = None
    goles_visitante: Optional[int] = None
    estado: str

    model_config = {"from_attributes": True}


class PartidoDetailOut(PartidoOut):
    local_nombre: str = ""
    visitante_nombre: str = ""


class PartidoPage(BaseModel):
    data: list[PartidoOut]
    total: int
    page: int
    per_page: int
    total_pages: int


class PartidoUpdate(BaseModel):
    goles_local: Optional[int] = None
    goles_visitante: Optional[int] = None
    estado: Optional[str] = None


class ClubResumen(BaseModel):
    id: str
    nombre: str
    escudo: str


class MayorGoleada(BaseModel):
    goles: int
    fecha: str
    goles_recibidos: int


class H2HPartidoItem(BaseModel):
    id: str
    torneo: str
    jornada: int
    fecha: str
    estado: str
    goles_local: Optional[int] = None
    goles_visitante: Optional[int] = None
    local_id: str
    visitante_id: str


class ResumenOut(BaseModel):
    pj: int = 0
    victorias_a: int = 0
    empates: int = 0
    victorias_b: int = 0
    goles_a: int = 0
    goles_b: int = 0
    mayor_goleada_a: Optional[MayorGoleada] = None
    mayor_goleada_b: Optional[MayorGoleada] = None


class H2HOut(BaseModel):
    club_a: ClubResumen
    club_b: ClubResumen
    resumen: ResumenOut
    partidos: list[H2HPartidoItem]
