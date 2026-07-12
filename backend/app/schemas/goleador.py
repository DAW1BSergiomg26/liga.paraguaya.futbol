from pydantic import BaseModel, ConfigDict

class GoleadorOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    nombre: str
    club_id: str
    club_nombre: str = ""
    goles: int = 0
    asistencias: int = 0
    torneo: str
    temporada: str

class GoleadoresListOut(BaseModel):
    goleadores: list[GoleadorOut]
    total: int
