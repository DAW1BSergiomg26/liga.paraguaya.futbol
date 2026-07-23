from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import relationship

from ..core.database import Base


class MensajeChat(Base):
    __tablename__ = "mensajes_chat"

    id = Column(String, primary_key=True)
    partido_id = Column(String, ForeignKey("partidos.id"), nullable=False, index=True)
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    mensaje = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    partido = relationship("Partido", lazy="selectin")
    user = relationship("User", lazy="selectin")
