from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class PredictionCreate(BaseModel):
    partido_id: str
    goles_local: int
    goles_visitante: int


class PredictionOut(BaseModel):
    id: str
    user_id: str
    partido_id: str
    goles_local: int
    goles_visitante: int
    puntos: int
    created_at: datetime

    model_config = {"from_attributes": True}


class PredictionDetail(PredictionOut):
    torneo: str = ""
    jornada: int = 0
    local_id: str = ""
    visitante_id: str = ""
    local_nombre: str = ""
    visitante_nombre: str = ""
    goles_real_local: Optional[int] = None
    goles_real_visitante: Optional[int] = None
    estado: str = ""


class LeaderboardEntry(BaseModel):
    username: str
    name: str
    image: str
    puntos: int
    aciertos: int
    predicciones: int
