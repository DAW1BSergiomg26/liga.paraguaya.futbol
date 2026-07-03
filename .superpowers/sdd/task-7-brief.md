### Task 7: Backend — Tests

**Files:**
- Create: `backend/tests/__init__.py`
- Create: `backend/tests/conftest.py`
- Create: `backend/tests/test_clubes.py`
- Create: `backend/tests/test_partidos.py`
- Create: `backend/tests/test_tabla.py`

**Interfaces:**
- Consumes: FastAPI `app`, services, models
- Produces: Test suite (pytest)

- [ ] **Step 1: Create `backend/tests/__init__.py`** (empty)

- [ ] **Step 2: Create `backend/tests/conftest.py`**

```python
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from backend.app.core.database import Base, get_db
from backend.app.main import app

TEST_DB_URL = "sqlite+aiosqlite://"


@pytest.fixture(scope="session")
def engine():
    return create_async_engine(TEST_DB_URL, echo=False)


@pytest.fixture(scope="function")
async def db_session(engine):
    session_local = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    async with session_local() as session:
        yield session
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest.fixture
async def client(db_session):
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()
```

- [ ] **Step 3: Create seed helper — add to conftest.py**

Append to `backend/tests/conftest.py`:

```python
import json

from backend.app.models.club import Club
from backend.app.models.partido import Partido
from backend.app.models.tabla import TablaPosicion


async def seed_test_data(db: AsyncSession):
    clubs = [
        Club(id="olimpia", nombre="Club Olimpia", ciudad="Asunción", apodo="El Decano", colores=["blanco", "negro"], estadio="Manuel Ferreira"),
        Club(id="cerro-porteno", nombre="Club Cerro Porteño", ciudad="Asunción", apodo="El Ciclón", colores=["azul", "rojo"], estadio="General Pablo Rojas"),
    ]
    for c in clubs:
        db.add(c)
    await db.flush()

    partidos = [
        Partido(id="p001", torneo="Apertura 2026", fecha=date(2026, 2, 1), jornada=1, local_id="olimpia", visitante_id="cerro-porteno", estado="programado"),
    ]
    for p in partidos:
        db.add(p)
    await db.flush()

    tabla = [
        TablaPosicion(torneo="Apertura 2026", jornada=1, club_id="olimpia", posicion=1, pj=1, pg=1, pe=0, pp=0, gf=2, gc=0, dg=2, puntos=3),
    ]
    for t in tabla:
        db.add(t)
    await db.flush()
```

- [ ] **Step 4: Create `backend/tests/test_clubes.py`**

```python
import pytest

from backend.tests.conftest import seed_test_data


@pytest.mark.asyncio
async def test_listar_clubes(client):
    response = await client.get("/api/v1/clubes")
    assert response.status_code == 200
    assert isinstance(response.json(), list)


@pytest.mark.asyncio
async def test_listar_clubes_con_datos(client, db_session):
    await seed_test_data(db_session)
    response = await client.get("/api/v1/clubes")
    data = response.json()
    assert len(data) == 2
    assert data[0]["nombre"] == "Club Olimpia"


@pytest.mark.asyncio
async def test_detalle_club_existente(client, db_session):
    await seed_test_data(db_session)
    response = await client.get("/api/v1/clubes/olimpia")
    assert response.status_code == 200
    assert response.json()["nombre"] == "Club Olimpia"


@pytest.mark.asyncio
async def test_detalle_club_no_existente(client):
    response = await client.get("/api/v1/clubes/no-existe")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_filtrar_por_ciudad(client, db_session):
    await seed_test_data(db_session)
    response = await client.get("/api/v1/clubes?ciudad=Asunción")
    assert response.status_code == 200
    assert len(response.json()) == 2
```

- [ ] **Step 5: Create `backend/tests/test_partidos.py`**

```python
import pytest

from backend.tests.conftest import seed_test_data


@pytest.mark.asyncio
async def test_listar_partidos(client, db_session):
    await seed_test_data(db_session)
    response = await client.get("/api/v1/partidos")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1


@pytest.mark.asyncio
async def test_detalle_partido(client, db_session):
    await seed_test_data(db_session)
    response = await client.get("/api/v1/partidos/p001")
    assert response.status_code == 200
    data = response.json()
    assert data["local_id"] == "olimpia"


@pytest.mark.asyncio
async def test_detalle_partido_no_existente(client):
    response = await client.get("/api/v1/partidos/no-existe")
    assert response.status_code == 404
```

- [ ] **Step 6: Create `backend/tests/test_tabla.py`**

```python
import pytest

from backend.tests.conftest import seed_test_data


@pytest.mark.asyncio
async def test_obtener_tabla(client, db_session):
    await seed_test_data(db_session)
    response = await client.get("/api/v1/tabla")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["club_id"] == "olimpia"
```

- [ ] **Step 7: Run tests**

```powershell
cd backend
pytest tests/ -v
```

Expected: All tests pass.

- [ ] **Step 8: Commit**

```bash
git add -A && git commit -m "feat(backend): test suite"
```

---


