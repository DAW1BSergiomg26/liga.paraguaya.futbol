import uuid
from datetime import date, datetime, timezone

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.core.database import Base


class Transferencia(Base):
    __tablename__ = "transferencias"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, default=lambda: str(uuid.uuid4()))
    jugador_nombre: Mapped[str] = mapped_column(String(200), nullable=False)
    jugador_posicion: Mapped[str | None] = mapped_column(String(50), nullable=True)
    club_origen_id: Mapped[str | None] = mapped_column(String(50), ForeignKey("clubes.id"), nullable=True)
    club_destino_id: Mapped[str] = mapped_column(String(50), ForeignKey("clubes.id"), nullable=False)
    fecha: Mapped[date] = mapped_column(Date, nullable=False)
    tipo: Mapped[str] = mapped_column(String(20), nullable=False, default="confirmada")
    estado: Mapped[str] = mapped_column(String(20), nullable=False, default="confirmada")
    monto: Mapped[float | None] = mapped_column(Float, nullable=True)
    duracion_meses: Mapped[int | None] = mapped_column(Integer, nullable=True)
    fuente_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    fuente_nombre: Mapped[str | None] = mapped_column(String(100), nullable=True)
    verification_level: Mapped[int] = mapped_column(Integer, default=3)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}
