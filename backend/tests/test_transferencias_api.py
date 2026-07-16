import pytest


@pytest.fixture
async def seed_clubs(db_session):
    from backend.app.models.club import Club
    clubs = [
        Club(id="olimpia", nombre="Club Olimpia", ciudad="Asunción", apodo="El Decano", colores=["blanco", "negro"], estadio="Manuel Ferreira"),
        Club(id="cerro-porteno", nombre="Club Cerro Porteño", ciudad="Asunción", apodo="El Ciclón", colores=["azul", "rojo"], estadio="General Pablo Rojas"),
        Club(id="libertad", nombre="Club Libertad", ciudad="Asunción", apodo="Gumarelo", colores=["negro", "blanco"], estadio="Dr. Nicolás Leoz"),
    ]
    for c in clubs:
        db_session.add(c)
    await db_session.flush()


@pytest.fixture
async def admin_token(db_session):
    from backend.app.models.user import User
    user = User(id="admin1", email="admin@test.com", name="Admin", username="admin", token="admin_token_123", is_admin=True, hashed_password="x")
    db_session.add(user)
    await db_session.flush()
    return "admin_token_123"


@pytest.fixture
async def user_token(db_session):
    from backend.app.models.user import User
    user = User(id="user1", email="user@test.com", name="User", username="user1", token="user_token_123", is_admin=False, hashed_password="x")
    db_session.add(user)
    await db_session.flush()
    return "user_token_123"


@pytest.mark.asyncio
async def test_list_transferencias_empty(client, db_session):
    response = await client.get("/api/v1/transferencias")
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert data["transferencias"] == []


@pytest.mark.asyncio
async def test_create_transferencia_as_admin(client, db_session, seed_clubs, admin_token):
    response = await client.post(
        "/api/v1/transferencias",
        json={
            "jugador_nombre": "Juan Pérez",
            "jugador_posicion": "Delantero",
            "club_origen_id": "cerro-porteno",
            "club_destino_id": "olimpia",
            "fecha": "2026-07-14",
            "tipo": "compra",
            "estado": "confirmada",
            "monto": 1.5,
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["jugador_nombre"] == "Juan Pérez"
    assert data["club_origen_nombre"] == "Club Cerro Porteño"
    assert data["club_destino_nombre"] == "Club Olimpia"


@pytest.mark.asyncio
async def test_create_transferencia_requires_admin(client, db_session, seed_clubs, user_token):
    response = await client.post(
        "/api/v1/transferencias",
        json={
            "jugador_nombre": "Test",
            "club_destino_id": "olimpia",
            "fecha": "2026-07-14",
        },
        headers={"Authorization": f"Bearer {user_token}"},
    )
    assert response.status_code == 403


@pytest.mark.asyncio
async def test_create_transferencia_same_club_fails(client, db_session, seed_clubs, admin_token):
    response = await client.post(
        "/api/v1/transferencias",
        json={
            "jugador_nombre": "Test",
            "club_origen_id": "olimpia",
            "club_destino_id": "olimpia",
            "fecha": "2026-07-14",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_get_transferencia_by_id(client, db_session, seed_clubs, admin_token):
    create_resp = await client.post(
        "/api/v1/transferencias",
        json={
            "jugador_nombre": "María López",
            "club_destino_id": "libertad",
            "fecha": "2026-07-10",
            "tipo": "libre",
        },
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    tid = create_resp.json()["id"]
    response = await client.get(f"/api/v1/transferencias/{tid}")
    assert response.status_code == 200
    assert response.json()["jugador_nombre"] == "María López"


@pytest.mark.asyncio
async def test_filter_by_tipo(client, db_session, seed_clubs, admin_token):
    for tipo in ["compra", "prestamo", "libre"]:
        await client.post(
            "/api/v1/transferencias",
            json={"jugador_nombre": f"Jugador {tipo}", "club_destino_id": "olimpia", "fecha": "2026-07-14", "tipo": tipo},
            headers={"Authorization": f"Bearer {admin_token}"},
        )
    resp = await client.get("/api/v1/transferencias?tipo=compra")
    assert resp.status_code == 200
    assert resp.json()["total"] == 1


@pytest.mark.asyncio
async def test_filter_by_jugador(client, db_session, seed_clubs, admin_token):
    await client.post(
        "/api/v1/transferencias",
        json={"jugador_nombre": "Carlos González", "club_destino_id": "olimpia", "fecha": "2026-07-14"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    resp = await client.get("/api/v1/transferencias?jugador=Carlos")
    assert resp.status_code == 200
    assert resp.json()["total"] == 1


@pytest.mark.asyncio
async def test_mercado_endpoint(client, db_session, seed_clubs, admin_token):
    resp = await client.get("/api/v1/transferencias/mercado")
    assert resp.status_code == 200
    assert isinstance(resp.json(), list)


@pytest.mark.asyncio
async def test_estadisticas_endpoint(client, db_session, seed_clubs, admin_token):
    resp = await client.get("/api/v1/transferencias/estadisticas")
    assert resp.status_code == 200
    data = resp.json()
    assert "total_transferencias" in data
    assert "gasto_total_por_club" in data


@pytest.mark.asyncio
async def test_historial_endpoint(client, db_session, seed_clubs, admin_token):
    await client.post(
        "/api/v1/transferencias",
        json={"jugador_nombre": "Hist Player", "club_destino_id": "olimpia", "fecha": "2026-07-14"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    resp = await client.get("/api/v1/transferencias/historial/olimpia")
    assert resp.status_code == 200
    assert len(resp.json()) >= 1


@pytest.mark.asyncio
async def test_delete_transferencia(client, db_session, seed_clubs, admin_token):
    create_resp = await client.post(
        "/api/v1/transferencias",
        json={"jugador_nombre": "To Delete", "club_destino_id": "olimpia", "fecha": "2026-07-14"},
        headers={"Authorization": f"Bearer {admin_token}"},
    )
    tid = create_resp.json()["id"]
    resp = await client.delete(f"/api/v1/transferencias/{tid}", headers={"Authorization": f"Bearer {admin_token}"})
    assert resp.status_code == 204
    get_resp = await client.get(f"/api/v1/transferencias/{tid}")
    assert get_resp.status_code == 404
