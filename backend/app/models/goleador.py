from datetime import datetime
from typing import Optional
from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from ..core.database import Base

class Goleador(Base):
    __tablename__ = "goleadores"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100))
    club_id: Mapped[str] = mapped_column(ForeignKey("clubes.id"))
    goles: Mapped[int] = mapped_column(Integer, default=0)
    asistencias: Mapped[int] = mapped_column(Integer, default=0)
    torneo: Mapped[str] = mapped_column(String(100))
    temporada: Mapped[str] = mapped_column(String(20))
    updated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )
