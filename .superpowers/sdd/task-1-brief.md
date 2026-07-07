# Task 1: Backend User model + auth endpoint

**Files:**
- Create: `backend/app/models/user.py`
- Create: `backend/app/schemas/user.py`
- Create: `backend/app/services/user_service.py`
- Create: `backend/app/api/auth.py`
- Modify: `backend/app/core/dependencies.py`
- Modify: `backend/app/models/__init__.py`
- Modify: `backend/app/main.py`

**Interfaces:**
- Produces: `User` model, `UserOut` schema, `UserService.upsert()`, `get_current_user` dependency, `POST /api/v1/auth/login`

## Steps

- [ ] **Create `backend/app/models/user.py`**

```python
import secrets
from datetime import datetime

from sqlalchemy import DateTime, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from backend.app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    email: Mapped[str] = mapped_column(String(200), unique=True)
    name: Mapped[str] = mapped_column(String(200))
    image: Mapped[str] = mapped_column(String(500), default="")
    username: Mapped[str] = mapped_column(String(100), unique=True)
    provider: Mapped[str] = mapped_column(String(50), default="google")
    provider_id: Mapped[str] = mapped_column(String(200), default="")
    token: Mapped[str] = mapped_column(String(100), default="")
    puntos: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    def generate_token(self):
        self.token = secrets.token_urlsafe(48)

    def to_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns}
```

- [ ] **Create `backend/app/schemas/user.py`**

```python
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
```

- [ ] **Create `backend/app/services/user_service.py`**

```python
import re
import secrets
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.user import User
from backend.app.schemas.user import UserLogin, UserOut


class UserService:

    @staticmethod
    def _generate_username(email: str) -> str:
        base = email.split("@")[0].lower()
        base = re.sub(r"[^a-z0-9]", "", base)[:20]
        return f"{base}_{secrets.token_hex(3)}"

    @staticmethod
    async def upsert(db: AsyncSession, data: UserLogin) -> UserOut:
        result = await db.execute(select(User).where(User.email == data.email))
        user = result.scalar_one_or_none()
        if user:
            user.name = data.name
            user.image = data.image
            user.generate_token()
        else:
            user_id = f"{data.provider}_{data.provider_id or data.email.split('@')[0]}"
            user = User(
                id=user_id,
                email=data.email,
                name=data.name,
                image=data.image,
                username=UserService._generate_username(data.email),
                provider=data.provider,
                provider_id=data.provider_id,
            )
            user.generate_token()
            db.add(user)
        await db.flush()
        return UserOut.model_validate(user)

    @staticmethod
    async def get_by_token(db: AsyncSession, token: str) -> Optional[User]:
        result = await db.execute(select(User).where(User.token == token))
        return result.scalar_one_or_none()
```

- [ ] **Create `backend/app/api/auth.py`**

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.dependencies import get_db
from backend.app.schemas.user import UserLogin, UserOut
from backend.app.services.user_service import UserService

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/login", response_model=UserOut)
async def login(body: UserLogin, db: AsyncSession = Depends(get_db)):
    if not body.email or not body.name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="email and name required")
    return await UserService.upsert(db, body)
```

- [ ] **Modify `backend/app/core/dependencies.py`** — add `get_current_user`

```python
from fastapi import Depends, HTTPException, Header, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.user import User
from backend.app.services.user_service import UserService


async def get_current_user(
    authorization: str = Header(""),
    db: AsyncSession = Depends(get_db),
) -> User:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing Bearer token")
    token = authorization[7:]
    user = await UserService.get_by_token(db, token)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return user
```

- [ ] **Modify `backend/app/models/__init__.py`** — add imports

```python
from backend.app.models.club import Club
from backend.app.models.partido import Partido
from backend.app.models.tabla import TablaPosicion
from backend.app.models.user import User
from backend.app.models.prediction import Prediction

__all__ = ["Club", "Partido", "TablaPosicion", "User", "Prediction"]
```

- [ ] **Modify `backend/app/core/database.py`** — add models to init_db

```python
from backend.app.models import club, partido, tabla, user, prediction
```

- [ ] **Modify `backend/app/main.py`** — register auth router

```python
from backend.app.api import auth, clubes, partidos, predicciones, leaderboard, tabla, admin
```

Add router registration:

```python
app.include_router(auth.router)
```

- [ ] **Run existing tests to verify nothing is broken**

```bash
cd backend && python -m pytest tests/ -v
```
Expected: all existing tests pass

- [ ] **Commit**

```bash
git add backend/app/models/user.py backend/app/schemas/user.py backend/app/services/user_service.py backend/app/api/auth.py backend/app/core/dependencies.py backend/app/models/__init__.py backend/app/core/database.py backend/app/main.py
git commit -m "feat: add User model and auth endpoint"
```
