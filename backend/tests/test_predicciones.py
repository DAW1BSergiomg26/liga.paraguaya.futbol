import pytest

from backend.tests.conftest import seed_test_data, seed_test_user


async def _register(client, email, name, password):
    resp = await client.post("/api/v1/auth/register", json={
        "email": email, "name": name, "password": password,
    })
    return resp


@pytest.mark.asyncio
async def test_login_creates_user(client, db_session):
    response = await _register(client, "test@example.com", "Test User", "password123")
    assert response.status_code == 201
    data = response.json()
    assert data["access_token"] != ""
    assert data["user"]["email"] == "test@example.com"


@pytest.mark.asyncio
async def test_login_returns_same_user(client, db_session):
    r1 = await _register(client, "same@example.com", "User", "password123")
    token1 = r1.json()["access_token"]
    r2 = await client.post("/api/v1/auth/login", json={
        "email": "same@example.com", "password": "password123",
    })
    assert r2.status_code == 200
    assert r2.json()["access_token"] != token1


@pytest.mark.asyncio
async def test_crear_prediccion(client, db_session):
    await seed_test_data(db_session)
    await seed_test_user(db_session)

    r = await _register(client, "pred@test.com", "Pred User", "password123")
    token = r.json()["access_token"]

    response = await client.post(
        "/api/v1/predicciones",
        json={"partido_id": "p001", "goles_local": 2, "goles_visitante": 1},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["partido_id"] == "p001"
    assert data["goles_local"] == 2


@pytest.mark.asyncio
async def test_mis_predicciones(client, db_session):
    await seed_test_data(db_session)
    await seed_test_user(db_session)

    r = await _register(client, "list@test.com", "List User", "password123")
    token = r.json()["access_token"]

    await client.post(
        "/api/v1/predicciones",
        json={"partido_id": "p001", "goles_local": 1, "goles_visitante": 1},
        headers={"Authorization": f"Bearer {token}"},
    )

    response = await client.get(
        "/api/v1/predicciones/mis",
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1


@pytest.mark.asyncio
async def test_leaderboard(client, db_session):
    await seed_test_data(db_session)
    await seed_test_user(db_session)

    r = await _register(client, "lb@test.com", "LB User", "password123")
    token = r.json()["access_token"]

    await client.post(
        "/api/v1/predicciones",
        json={"partido_id": "p001", "goles_local": 0, "goles_visitante": 0},
        headers={"Authorization": f"Bearer {token}"},
    )

    response = await client.get("/api/v1/leaderboard")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1


@pytest.mark.asyncio
async def test_prediccion_sin_auth(client, db_session):
    await seed_test_data(db_session)
    response = await client.post(
        "/api/v1/predicciones",
        json={"partido_id": "p001", "goles_local": 2, "goles_visitante": 1},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_calcular_puntos_exacto(client, db_session):
    from sqlalchemy import select
    from backend.app.models.partido import Partido
    from backend.app.models.prediction import Prediction
    from backend.app.services.prediction_service import PredictionService

    await seed_test_data(db_session)
    await seed_test_user(db_session)

    r = await _register(client, "exact@test.com", "Exact", "password123")
    token = r.json()["access_token"]

    await client.post(
        "/api/v1/predicciones",
        json={"partido_id": "p001", "goles_local": 2, "goles_visitante": 1},
        headers={"Authorization": f"Bearer {token}"},
    )

    partido_result = await db_session.execute(
        select(Partido).where(Partido.id == "p001")
    )
    partido = partido_result.scalar_one()
    partido.goles_local = 2
    partido.goles_visitante = 1
    partido.estado = "finalizado"
    await db_session.flush()

    await PredictionService.calcular_puntos(db_session, "p001")
    result = await db_session.execute(
        select(Prediction).where(Prediction.partido_id == "p001")
    )
    pred = result.scalar_one()
    assert pred.puntos == 3
