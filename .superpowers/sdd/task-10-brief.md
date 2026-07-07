# Task 10: Tests Backend para Chat y Push

## Files
- Create: `backend/tests/test_chat_push.py`

## Test Coverage

### Chat REST (`GET /api/v1/partidos/{id}/chat`)
- Sin autenticación → 200 (endpoint público, no usa auth)
- Partido no existe → 200 con lista vacía
- Chat vacío para partido existente → lista vacía
- Con mensajes guardados → devuelve mensajes ordenados DESC por created_at
- Paginación (limit, offset)

### Chat WebSocket (`ws /api/v1/ws/partidos/{id}?token=...`)
- Token inválido → close code 4001
- Partido no existe → close code 4004
- Token válido + partido existe → conexión exitosa, envía mensaje, recibe broadcast
- Test with `pytest-asyncio` + `httpx` WS transport (the test infra already uses `httpx.AsyncClient`)

**Note**: WebSocket tests with httpx + pytest-asyncio require careful setup. Use `client.ws_connect()`. The existing `client` fixture creates an AsyncClient — we need to use `httpx.AsyncClient` directly for WS tests or use the `app` to create WS connections.

Actually, httpx AsyncClient doesn't support websocket connect directly in the same way. For FastAPI WebSocket tests:
```python
from fastapi.testclient import TestClient
# OR
from httpx import AsyncClient, ASGITransport
```
But httpx's AsyncClient with ASGITransport should support websocket via the `upgrade` mechanism. Let's use `httpx`'s WS support or fall back to FastAPI's TestClient for WS tests.

Actually for simplicity, let's test Chat REST (GET history) thoroughly and only do basic WS tests. We can use `httpx` with `ASGITransport` for the REST tests. For WebSocket, we can use FastAPI's TestClient since httpx's websocket support is limited.

Let me write a practical test file.

### Push Endpoints (`POST/DELETE /api/v1/notificaciones/suscribir`, `GET /api/v1/notificaciones/vapid-public-key`)
- `GET /vapid-public-key` → 200 con `{"publicKey": ""}` (vacío por defecto en test)
- `POST /suscribir` sin auth → 401/403
- `POST /suscribir` con auth → 200 con `{"ok": True}`
- `DELETE /suscribir` con auth → 200
- `DELETE /suscribir` sin auth → 401/403

## Important Notes
- The `conftest.py` has `seed_test_user(db)` which creates user with token `test_token_123`
- Auth headers: `Authorization: Bearer test_token_123`
- VAPID keys vacíos por defecto (config default)
- For chat messages, the test can call `ChatService.guardar()` directly via db_session
- WebSocket tests: use `httpx.AsyncClient` with `ws_connect` or fall back to `fastapi.testclient.TestClient`

## Dependencies
pytest-asyncio is already installed (existing tests use it). httpx is also installed.

## Expected Count
Add at least 5-8 tests covering: chat GET empty, chat GET with data, chat auth, push vapid key, push subscribe with/without auth, push unsubscribe.

## Verify
```bash
cd backend && python -m pytest tests/ -v
```

## Commit
```bash
git add backend/tests/test_chat_push.py
git commit -m "test: add chat and push notification tests"
```

## Report File
`.superpowers/sdd/task-10-report.md`
