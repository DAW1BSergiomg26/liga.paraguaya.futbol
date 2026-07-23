from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..core.database import Base


class Prediction(Base):
    __tablename__ = "predictions"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    user_id: Mapped[str] = mapped_column(String(50), ForeignKey("users.id"))
    partido_id: Mapped[str] = mapped_column(String(50), ForeignKey("partidos.id"))
    goles_local: Mapped[int] = mapped_column(Integer)
    goles_visitante: Mapped[int] = mapped_column(Integer)
    puntos: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="predicciones")
    partido = relationship("Partido", back_populates="predicciones", lazy="selectin")

    __table_args__ = (UniqueConstraint("user_id", "partido_id", name="uq_user_partido"),)
