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
