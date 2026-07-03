from sqlalchemy import JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.core.database import Base


class Club(Base):
    __tablename__ = "clubes"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100))
    ciudad: Mapped[str] = mapped_column(String(100))
    apodo: Mapped[str] = mapped_column(String(100))
    colores: Mapped[list[str]] = mapped_column(JSON, default=list)
    estadio: Mapped[str] = mapped_column(String(150))
