import pytest

from backend.tests.conftest import seed_test_data, seed_test_user


@pytest.mark.asyncio
async def test_login_creates_user(client, db_session):
    response = await client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "name": "Test User",
        "provider": "google",
        "provider_id": "google_123",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["token"] != ""
    assert data["username"] != ""


@pytest.mark.asyncio
async def test_login_returns_same_user(client, db_session):
    r1 = await client.post("/api/v1/auth/login", json={
        "email": "same@example.com", "name": "User", "provider": "google", "provider_id": "g1",
    })
    token1 = r1.json()["token"]
    r2 = await client.post("/api/v1/auth/login", json={
        "email": "same@example.com", "name": "User Updated", "provider": "google", "provider_id": "g1",
    })
    assert r2.status_code == 200
    assert r2.json()["token"] != token1


@pytest.mark.asyncio
async def test_crear_prediccion(client, db_session):
    await seed_test_data(db_session)
    await seed_test_user(db_session)

    r = await client.post("/api/v1/auth/login", json={
        "email": "pred@test.com", "name": "Pred User", "provider": "google", "provider_id": "gp1",
    })
    token = r.json()["token"]

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

    r = await client.post("/api/v1/auth/login", json={
        "email": "list@test.com", "name": "List User", "provider": "google", "provider_id": "gl1",
    })
    token = r.json()["token"]

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

    r = await client.post("/api/v1/auth/login", json={
        "email": "lb@test.com", "name": "LB User", "provider": "google", "provider_id": "glb1",
    })
    token = r.json()["token"]

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

    r = await client.post("/api/v1/auth/login", json={
        "email": "exact@test.com", "name": "Exact", "provider": "google", "provider_id": "ge1",
    })
    token = r.json()["token"]

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
