import pytest
import importlib

import backend.app.models.mensaje_chat  # noqa: F401 — register table
import backend.app.models.push_subscription  # noqa: F401 — register table

from backend.tests.conftest import seed_test_data, seed_test_user


@pytest.mark.asyncio
async def test_chat_get_empty(client, db_session):
    await seed_test_data(db_session)
    resp = await client.get("/api/v1/partidos/p001/chat")
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_chat_get_nonexistent_partido(client, db_session):
    resp = await client.get("/api/v1/partidos/no-existe/chat")
    assert resp.status_code == 200
    assert resp.json() == []


@pytest.mark.asyncio
async def test_chat_get_with_messages(client, db_session):
    await seed_test_data(db_session)
    await seed_test_user(db_session)
    from backend.app.schemas.chat import MensajeChatCreate
    from backend.app.services.chat_service import ChatService
    await ChatService.guardar(db_session, "p001", "test_user", MensajeChatCreate(contenido="Hola!"))
    await ChatService.guardar(db_session, "p001", "test_user", MensajeChatCreate(contenido="Segundo msg"))

    resp = await client.get("/api/v1/partidos/p001/chat")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2
    assert data[0]["mensaje"] == "Hola!"
    assert data[1]["mensaje"] == "Segundo msg"


@pytest.mark.asyncio
async def test_chat_pagination(client, db_session):
    await seed_test_data(db_session)
    await seed_test_user(db_session)
    from backend.app.schemas.chat import MensajeChatCreate
    from backend.app.services.chat_service import ChatService
    for i in range(5):
        await ChatService.guardar(db_session, "p001", "test_user", MensajeChatCreate(contenido=f"msg {i}"))

    resp = await client.get("/api/v1/partidos/p001/chat?limit=2&offset=0")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 2
    assert data[0]["mensaje"] == "msg 3"
    assert data[1]["mensaje"] == "msg 4"


@pytest.mark.asyncio
async def test_vapid_key_endpoint(client, db_session):
    resp = await client.get("/api/v1/notificaciones/vapid-public-key")
    assert resp.status_code == 200
    assert "publicKey" in resp.json()


@pytest.mark.asyncio
async def test_push_subscribe_without_auth(client, db_session):
    resp = await client.post(
        "/api/v1/notificaciones/suscribir",
        json={"endpoint": "https://example.com/push", "keys": {"p256dh": "abc", "auth": "def"}},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_push_subscribe_with_auth(client, db_session):
    await seed_test_user(db_session)
    resp = await client.post(
        "/api/v1/notificaciones/suscribir",
        json={"endpoint": "https://example.com/push", "keys": {"p256dh": "abc", "auth": "def"}},
        headers={"Authorization": "Bearer test_token_123"},
    )
    assert resp.status_code == 200
    assert resp.json() == {"ok": True}


@pytest.mark.asyncio
async def test_push_unsubscribe_with_auth(client, db_session):
    await seed_test_user(db_session)
    await client.post(
        "/api/v1/notificaciones/suscribir",
        json={"endpoint": "https://example.com/push", "keys": {"p256dh": "abc", "auth": "def"}},
        headers={"Authorization": "Bearer test_token_123"},
    )
    resp = await client.delete(
        "/api/v1/notificaciones/suscribir",
        params={"endpoint": "https://example.com/push"},
        headers={"Authorization": "Bearer test_token_123"},
    )
    assert resp.status_code == 200
    assert resp.json() == {"ok": True}
