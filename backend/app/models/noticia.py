import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, DateTime, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.core.database import Base


class Noticia(Base):
    __tablename__ = "noticias"

    id: Mapped[str] = mapped_column(String(50), primary_key=True, default=lambda: str(uuid.uuid4()))
    titulo: Mapped[str] = mapped_column(String(500), nullable=False)
    resumen: Mapped[str | None] = mapped_column(Text, nullable=True)
    contenido: Mapped[str | None] = mapped_column(Text, nullable=True)
    imagen_url: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    video_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    fuente: Mapped[str] = mapped_column(String(100), nullable=False)
    origen: Mapped[str] = mapped_column(String(20), nullable=False, default="editorial")
    url_original: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    pub_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    is_published: Mapped[bool] = mapped_column(Boolean, default=True)

    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}
