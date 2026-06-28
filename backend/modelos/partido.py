from pydantic import BaseModel
from typing import Optional


class Partido(BaseModel):
    id: str
    torneo: str
    fecha: str
    local: str
    visitante: str
    goles_local: Optional[int] = None
    goles_visitante: Optional[int] = None
    estado: str
