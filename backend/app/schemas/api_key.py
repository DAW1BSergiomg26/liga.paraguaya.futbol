from datetime import datetime

from pydantic import BaseModel


class APIKeyCreate(BaseModel):
    owner: str
    email: str


class APIKeyOut(BaseModel):
    key: str
    owner: str
    email: str
    is_active: bool
    requests_count: int
    created_at: datetime
    last_used_at: datetime | None

    model_config = {"from_attributes": True}
