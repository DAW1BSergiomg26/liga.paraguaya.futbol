# Task 2: Chat Schema + Service — Report

## What I implemented
- **`backend/app/schemas/chat.py`**: Pydantic schemas `MensajeChatCreate` (with `contenido` field, min_length=1, max_length=500) and `MensajeChatOut` (flat output with id, partido_id, user_id, username, nombre, imagen, mensaje, created_at). Used `model_config = {"from_attributes": True}` (Pydantic v2 style) to match existing schema conventions.
- **`backend/app/services/chat_service.py`**: `ChatService` class with two static methods:
  - `guardar()` — creates a `msg_` prefixed UUID id, persists via SQLAlchemy, refreshes the user relationship, returns `MensajeChatOut`
  - `obtener_historial()` — fetches messages for a partido, ordered by created_at DESC, limited/paginated, reversed to oldest-first for frontend

## What I tested and test results
All 18 existing tests pass (5 test_clubes, 5 test_partidos, 7 test_predicciones, 1 test_tabla).

## Files changed
- `backend/app/schemas/chat.py` (created, 23 lines)
- `backend/app/services/chat_service.py` (created, 63 lines)

## Self-review findings
- Both files follow existing project conventions (static methods on service class, Pydantic v2 `model_config = {"from_attributes": True}`, type hints, async patterns)
- `id` generation uses the mandated `f"msg_{uuid.uuid4().hex[:12]}"` pattern
- No unused imports or comments added
- The `obtener_historial` method reverses the list after querying DESC, matching the brief's spec for oldest-first frontend display
- The brief's code used `class Config` but I adapted to `model_config` for consistency with existing schemas (`partido.py`, `user.py`)

## Concerns
- None
