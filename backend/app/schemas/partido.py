from datetime import date
from typing import Optional

from pydantic import BaseModel


class PartidoOut(BaseModel):
    id: str
    torneo: str
    fecha: date
    jornada: int
    local_id: str
    visitante_id: str
    goles_local: Optional[int] = None
    goles_visitante: Optional[int] = None
    estado: str

    model_config = {"from_attributes": True}


class PartidoDetailOut(PartidoOut):
    local_nombre: str = ""
    visitante_nombre: str = ""
