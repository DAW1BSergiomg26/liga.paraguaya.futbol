import secrets
from datetime import datetime

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    email: Mapped[str] = mapped_column(String(200), unique=True)
    name: Mapped[str] = mapped_column(String(200))
    image: Mapped[str] = mapped_column(String(500), default="")
    username: Mapped[str] = mapped_column(String(100), unique=True)
    provider: Mapped[str] = mapped_column(String(50), default="google")
    provider_id: Mapped[str] = mapped_column(String(200), default="")
    token: Mapped[str] = mapped_column(String(100), default="")
    puntos: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def generate_token(self):
        self.token = secrets.token_urlsafe(48)

    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}
