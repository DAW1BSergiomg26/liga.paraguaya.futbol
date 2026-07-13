from pydantic import BaseModel


class JugadorTactico(BaseModel):
    id: str
    nombre: str
    posicion: str
    numero: int
    rating: float
    x: float  # Posición en el campo (0-1)
    y: float  # Posición en el campo (0-1)


class EstadisticasEquipo(BaseModel):
    xg: float
    posesion: float
    tiros_puerta: float
    pases_completados: float
    duelos_ganados: float
    corners: float


class InsightTactico(BaseModel):
    icono: str
    texto: str
    metrica: str | None = None


class PartidoResumen(BaseModel):
    fecha: str
    rival: str
    resultado: str
    formacion: str


class EquipoTactico(BaseModel):
    equipo_id: str
    nombre: str
    escudo: str
    formacion_principal: str
    formaciones_disponibles: list[str]
    jugadores: list[JugadorTactico]
    stats: EstadisticasEquipo
    tendencias: list[InsightTactico]
    ultimos_partidos: list[PartidoResumen]


class EquipoPartidoTactico(BaseModel):
    equipo_id: str
    nombre: str
    formacion: str
    jugadores: list[JugadorTactico]


class StatsComparativa(BaseModel):
    local: EstadisticasEquipo
    visitante: EstadisticasEquipo


class PrediccionIA(BaseModel):
    gana_local: float
    empate: float
    gana_visitante: float
    confianza: str


class AnalisisPartido(BaseModel):
    partido_id: str
    local: EquipoPartidoTactico
    visitante: EquipoPartidoTactico
    stats: StatsComparativa
    prediccion_ia: PrediccionIA
