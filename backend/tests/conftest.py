from datetime import date

import pytest
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from backend.app.core.database import Base
from backend.app.core.dependencies import get_db
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


from backend.app.models.club import Club
from backend.app.models.partido import Partido
from backend.app.models.prediction import Prediction
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


async def seed_test_user(db: AsyncSession):
    from backend.app.models.user import User
    user = User(
        id="test_user",
        email="test@test.com",
        name="Test",
        username="tester",
        token="test_token_123",
    )
    db.add(user)
    await db.flush()
