from pydantic import BaseModel


class UserLogin(BaseModel):
    email: str
    name: str
    image: str = ""
    provider: str = "google"
    provider_id: str = ""


class UserOut(BaseModel):
    id: str
    email: str
    name: str
    image: str
    username: str
    puntos: int
    token: str

    model_config = {"from_attributes": True}
