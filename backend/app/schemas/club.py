from pydantic import BaseModel


class ClubOut(BaseModel):
    id: str
    nombre: str
    ciudad: str
    apodo: str
    colores: list[str]
    estadio: str

    model_config = {"from_attributes": True}


class ClubDetailOut(ClubOut):
    pass
