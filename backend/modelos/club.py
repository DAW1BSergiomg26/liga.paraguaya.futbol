from pydantic import BaseModel
from typing import List


class Club(BaseModel):
    id: str
    nombre: str
    ciudad: str
    apodo: str
    colores: List[str]
    estadio: str
