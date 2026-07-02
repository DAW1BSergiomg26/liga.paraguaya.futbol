from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.core.database import Base


class TablaPosicion(Base):
    __tablename__ = "tabla_posiciones"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    torneo: Mapped[str] = mapped_column(String(100))
    jornada: Mapped[int] = mapped_column(Integer, default=1)
    club_id: Mapped[str] = mapped_column(ForeignKey("clubes.id"))
    posicion: Mapped[int] = mapped_column(Integer)
    pj: Mapped[int] = mapped_column(Integer, default=0)
    pg: Mapped[int] = mapped_column(Integer, default=0)
    pe: Mapped[int] = mapped_column(Integer, default=0)
    pp: Mapped[int] = mapped_column(Integer, default=0)
    gf: Mapped[int] = mapped_column(Integer, default=0)
    gc: Mapped[int] = mapped_column(Integer, default=0)
    dg: Mapped[int] = mapped_column(Integer, default=0)
    puntos: Mapped[int] = mapped_column(Integer, default=0)
