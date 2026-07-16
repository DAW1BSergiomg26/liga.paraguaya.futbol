from datetime import datetime
from pydantic import BaseModel, Field


class NoticiaCreate(BaseModel):
    titulo: str = Field(max_length=500)
    resumen: str | None = None
    contenido: str | None = None
    imagen_url: str | None = None
    video_url: str | None = None
    fuente: str = "editorial"
    origen: str = "editorial"
    url_original: str | None = None
    pub_date: datetime
    is_published: bool = True


class NoticiaUpdate(BaseModel):
    titulo: str | None = None
    resumen: str | None = None
    contenido: str | None = None
    imagen_url: str | None = None
    video_url: str | None = None
    is_published: bool | None = None


class NoticiaOut(BaseModel):
    id: str
    titulo: str
    resumen: str | None
    contenido: str | None
    imagen_url: str | None
    video_url: str | None
    fuente: str
    origen: str
    url_original: str | None
    pub_date: datetime
    created_at: datetime
    is_published: bool

    model_config = {"from_attributes": True}


class NoticiasPaginatedResponse(BaseModel):
    noticias: list[NoticiaOut]
    total: int
    page: int
    total_pages: int
