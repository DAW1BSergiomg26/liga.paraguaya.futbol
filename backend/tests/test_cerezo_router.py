import pytest


@pytest.mark.asyncio
async def test_ask_cerezo_returns_response(client, db_session):
    response = await client.post("/api/v1/cerezo/ask", json={"message": "Hola"})
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "intent" in data
    assert "data" in data
    assert len(data["message"]) > 0


@pytest.mark.asyncio
async def test_ask_cerezo_with_club_info(client, db_session):
    response = await client.post("/api/v1/cerezo/ask", json={"message": "Datos de Olimpia"})
    assert response.status_code == 200
    data = response.json()
    assert data["intent"] in ("club_info", "greeting", "unknown")
    assert "message" in data


@pytest.mark.asyncio
async def test_ask_cerezo_with_prediction(client, db_session):
    response = await client.post("/api/v1/cerezo/ask", json={"message": "Quién gana Olimpia vs Cerro"})
    assert response.status_code == 200
    data = response.json()
    assert "prediction" in data
    assert "intent" in data
