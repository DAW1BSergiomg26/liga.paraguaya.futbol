from datetime import date, datetime
from pydantic import BaseModel, Field


class TransferenciaCreate(BaseModel):
    jugador_nombre: str = Field(..., min_length=1, max_length=200)
    jugador_posicion: str | None = Field(None, max_length=50)
    club_origen_id: str | None = None
    club_destino_id: str = Field(..., min_length=1)
    fecha: date
    tipo: str = Field("confirmada", pattern="^(compra|prestamo|libre|cesion|refuerzo)$")
    estado: str = Field("confirmada", pattern="^(confirmada|rumor|oficial|desmentida)$")
    monto: float | None = Field(None, ge=0)
    duracion_meses: int | None = Field(None, ge=1)
    fuente_url: str | None = Field(None, max_length=1000)
    fuente_nombre: str | None = Field(None, max_length=100)
    verification_level: int = Field(3, ge=1, le=5)
    is_active: bool = True


class TransferenciaUpdate(BaseModel):
    jugador_nombre: str | None = Field(None, min_length=1, max_length=200)
    jugador_posicion: str | None = None
    club_origen_id: str | None = None
    club_destino_id: str | None = None
    fecha: date | None = None
    tipo: str | None = Field(None, pattern="^(compra|prestamo|libre|cesion|refuerzo)$")
    estado: str | None = Field(None, pattern="^(confirmada|rumor|oficial|desmentida)$")
    monto: float | None = None
    duracion_meses: int | None = None
    fuente_url: str | None = None
    fuente_nombre: str | None = None
    verification_level: int | None = Field(None, ge=1, le=5)
    is_active: bool | None = None


class TransferenciaOut(BaseModel):
    id: str
    jugador_nombre: str
    jugador_posicion: str | None
    club_origen_id: str | None
    club_destino_id: str
    fecha: date
    tipo: str
    estado: str
    monto: float | None
    duracion_meses: int | None
    fuente_url: str | None
    fuente_nombre: str | None
    verification_level: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    club_origen_nombre: str | None = None
    club_origen_escudo: str | None = None
    club_destino_nombre: str | None = None
    club_destino_escudo: str | None = None

    model_config = {"from_attributes": True}


class TransferenciasPaginatedResponse(BaseModel):
    transferencias: list[TransferenciaOut]
    total: int
    page: int
    total_pages: int


class GastoPorClub(BaseModel):
    club_id: str
    club_nombre: str
    total_gastado: float
    total_recibido: float


class EstadisticasTransferencias(BaseModel):
    total_transferencias: int
    gasto_total_por_club: list[GastoPorClub]
    top_compras: list[TransferenciaOut]
    distribucion_posiciones: dict[str, int]
    distribucion_tipos: dict[str, int]
