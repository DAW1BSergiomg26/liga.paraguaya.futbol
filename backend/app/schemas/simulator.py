from pydantic import BaseModel


class SimulationInput(BaseModel):
    """ValidaciÃ³n de entrada para la simulaciÃ³n de un partido."""
    home_club_id: str
    away_club_id: str


class ExactScore(BaseModel):
    """Un resultado exacto con su probabilidad asociada."""
    goles_local: int
    goles_visitante: int
    probabilidad: float


class SimulationResultOut(BaseModel):
    """Resultado completo de la simulaciÃ³n probabilÃ­stica."""
    home_club_id: str
    home_club_name: str
    away_club_id: str
    away_club_name: str
    probabilidad_local: float
    probabilidad_empate: float
    probabilidad_visitante: float
    lambda_local: float
    lambda_visitante: float
    resultados_mas_probables: list[ExactScore]
