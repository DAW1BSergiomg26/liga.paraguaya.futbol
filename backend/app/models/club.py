from sqlalchemy import JSON, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Club(Base):
    __tablename__ = "clubes"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100))
    ciudad: Mapped[str] = mapped_column(String(100))
    apodo: Mapped[str] = mapped_column(String(100))
    colores: Mapped[list[str]] = mapped_column(JSON, default=list)
    estadio: Mapped[str] = mapped_column(String(150))
    capacidad: Mapped[int] = mapped_column(Integer, default=0)
    fundacion: Mapped[int] = mapped_column(Integer, default=1900)
    direccion: Mapped[str] = mapped_column(String(200), default="")
    escudo: Mapped[str] = mapped_column(String(500), default="")
    camiseta: Mapped[str] = mapped_column(String(500), default="")
    sitio_web: Mapped[str] = mapped_column(String(500), default="")
    descripcion: Mapped[str] = mapped_column(String(2000), default="")
    titulos_liga: Mapped[int] = mapped_column(Integer, default=0)
    titulos_info: Mapped[list] = mapped_column(JSON, default=list)
    titulos_internacionales: Mapped[list] = mapped_column(JSON, default=list)
