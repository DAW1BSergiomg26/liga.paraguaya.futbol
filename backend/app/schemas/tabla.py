from pydantic import BaseModel


class TablaRowOut(BaseModel):
    posicion: int
    club_id: str
    club: str
    pj: int
    pg: int
    pe: int
    pp: int
    gf: int
    gc: int
    dg: int
    puntos: int

    model_config = {"from_attributes": True}
