from datetime import date
from typing import Optional

from sqlalchemy import Date, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Partido(Base):
    __tablename__ = "partidos"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    torneo: Mapped[str] = mapped_column(String(100))
    fecha: Mapped[date] = mapped_column(Date)
    jornada: Mapped[int] = mapped_column(Integer, default=1)
    temporada: Mapped[str] = mapped_column(String(20), default="2026")
    local_id: Mapped[str] = mapped_column(ForeignKey("clubes.id"))
    visitante_id: Mapped[str] = mapped_column(ForeignKey("clubes.id"))
    goles_local: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    goles_visitante: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    estado: Mapped[str] = mapped_column(String(20), default="programado")

    local = relationship("Club", foreign_keys=[local_id])
    visitante = relationship("Club", foreign_keys=[visitante_id])
    predicciones = relationship("Prediction", back_populates="partido", lazy="selectin")
