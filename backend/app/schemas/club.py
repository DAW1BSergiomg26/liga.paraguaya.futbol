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

    model_config = {"from_attributes": True}


class ClubDetailOut(ClubOut):
    direccion: str
    camiseta: str
