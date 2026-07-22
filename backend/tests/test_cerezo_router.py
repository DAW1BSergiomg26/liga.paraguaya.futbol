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


@pytest.mark.asyncio
async def test_ask_cerezo_follow_up(client, db_session):
    from backend.app.api.cerezo import _cerezo_sessions
    _cerezo_sessions.clear()
    session_id = "test-followup"
    payload = {"message": "Datos de Olimpia", "session_id": session_id}
    resp = await client.post("/api/v1/cerezo/ask", json=payload)
    assert resp.status_code == 200
    body = resp.json()
    assert body["intent"] == "club_info"
    payload2 = {"message": "Cuándo juega", "session_id": session_id}
    resp2 = await client.post("/api/v1/cerezo/ask", json=payload2)
    body2 = resp2.json()
    assert body2["intent"] == "next_match"


@pytest.mark.asyncio
async def test_ask_cerezo_response_structure_matches_frontend(client, db_session):
    """Verify response has all fields the frontend ChatMessage expects."""
    response = await client.post("/api/v1/cerezo/ask", json={"message": "Hola"})
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data["message"], str) and len(data["message"]) > 0
    assert isinstance(data["intent"], str)
    assert "structured_data" in data


@pytest.mark.asyncio
async def test_ask_cerezo_empty_message_returns_422(client, db_session):
    response = await client.post("/api/v1/cerezo/ask", json={})
    assert response.status_code == 422
