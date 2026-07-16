from pydantic import BaseModel, Field


class UserOAuth(BaseModel):
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


class UserRegister(BaseModel):
    email: str
    name: str
    password: str = Field(min_length=6)


class UserLogin(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserOut"
