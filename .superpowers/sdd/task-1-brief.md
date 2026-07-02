### Task 1: Backend — Core (config, database, dependencies)

**Files:**
- Create: `backend/app/__init__.py`
- Create: `backend/app/core/__init__.py`
- Create: `backend/app/core/config.py`
- Create: `backend/app/core/database.py`
- Create: `backend/app/core/dependencies.py`
- Modify: `backend/requirements.txt`

**Interfaces:**
- Consumes: nothing (first task)
- Produces:
  - `Settings` class (from `core.config`)
  - `engine` (AsyncEngine), `async_session` (async_sessionmaker) (from `core.database`)
  - `get_db()` -> AsyncIterator[AsyncSession] (from `core.dependencies`)
  - `Base` declarative base (from `core.database`)

- [ ] **Step 1: Update requirements.txt**

```txt
# backend/requirements.txt
fastapi>=0.115.0
uvicorn[standard]>=0.30.0
sqlalchemy[asyncio]>=2.0.0
aiosqlite>=0.20.0
pydantic>=2.0.0
pydantic-settings>=2.0.0
alembic>=1.13.0
httpx>=0.27.0
pytest>=8.0.0
pytest-asyncio>=0.24.0
```

- [ ] **Step 2: Create `backend/app/__init__.py`** (empty file)

- [ ] **Step 3: Create `backend/app/core/__init__.py`** (empty file)

- [ ] **Step 4: Create `backend/app/core/config.py`**

```python
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "liga.paraguaya.futbol API"
    app_version: str = "0.6.0"
    debug: bool = True

    database_url: str = "sqlite+aiosqlite:///./data/liga.db"
    cors_origins: str = "http://localhost:3000,http://localhost:5173"

    api_football_key: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
```

- [ ] **Step 5: Create `backend/app/core/database.py`**

```python
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from backend.app.core.config import settings

engine = create_async_engine(settings.database_url, echo=settings.debug)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_connection():
    async with engine.begin() as conn:
        yield conn


async def init_db():
    async with engine.begin() as conn:
        from backend.app.models import club, partido, tabla
        await conn.run_sync(Base.metadata.create_all)
```

- [ ] **Step 6: Create `backend/app/core/dependencies.py`**

```python
from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.database import async_session


async def get_db() -> AsyncIterator[AsyncSession]:
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
```

- [ ] **Step 7: Verify imports work**

```powershell
cd backend
python -c "from backend.app.core.config import settings; print(settings.app_name)"
```

Expected output: `liga.paraguaya.futbol API`

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat(backend): core config, database and dependencies"
```

---


