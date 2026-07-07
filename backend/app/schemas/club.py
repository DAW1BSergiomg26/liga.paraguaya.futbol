from pydantic import BaseModel


class ClubOut(BaseModel):
    id: str
    nombre: str
    ciudad: str
    apodo: str
    colores: list[str]
    estadio: str
    capacidad: int
    fundacion: int
    escudo: str
    sitio_web: str = ""
    descripcion: str = ""
    titulos_liga: int = 0
    titulos_info: list = []

    model_config = {"from_attributes": True}


class ClubDetailOut(ClubOut):
    direccion: str
    camiseta: str
