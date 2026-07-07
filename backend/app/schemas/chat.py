from datetime import datetime

from pydantic import BaseModel, Field


class MensajeChatCreate(BaseModel):
    contenido: str = Field(..., min_length=1, max_length=500)


class MensajeChatOut(BaseModel):
    id: str
    partido_id: str
    user_id: str
    username: str = ""
    nombre: str = ""
    imagen: str = ""
    mensaje: str
    created_at: datetime

    model_config = {"from_attributes": True}
