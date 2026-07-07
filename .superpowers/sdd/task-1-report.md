# Task 1 Report: Backend User Model + Auth Endpoint

## What was implemented

- **`backend/app/models/user.py`** — SQLAlchemy `User` model with `id`, `email`, `name`, `image`, `username`, `provider`, `provider_id`, `token`, `puntos`, `created_at` columns, plus `generate_token()` and `to_dict()` methods.
- **`backend/app/schemas/user.py`** — Pydantic `UserLogin` (request) and `UserOut` (response) schemas.
- **`backend/app/services/user_service.py`** — `UserService` with `upsert()` (create-or-update by email, generates token + username) and `get_by_token()` methods.
- **`backend/app/api/auth.py`** — `POST /api/v1/auth/login` endpoint accepting `UserLogin` body, validating email/name, calling `UserService.upsert()`.
- **Modified `backend/app/core/dependencies.py`** — Added `get_current_user` dependency that extracts Bearer token from `Authorization` header and validates via `UserService.get_by_token()`.
- **Modified `backend/app/models/__init__.py`** — Added `User` to imports and `__all__`.
- **Modified `backend/app/core/database.py`** — Added `user` to the models imported in `init_db()`.
- **Modified `backend/app/main.py`** — Added `auth` router import and registration.

## Test results

All 11 existing tests pass:
- test_clubes: 5/5 passed
- test_partidos: 5/5 passed
- test_tabla: 1/1 passed

## Files changed

| File | Action |
|------|--------|
| `backend/app/models/user.py` | Created |
| `backend/app/schemas/user.py` | Created |
| `backend/app/services/user_service.py` | Created |
| `backend/app/api/auth.py` | Created |
| `backend/app/core/dependencies.py` | Modified (added `get_current_user`) |
| `backend/app/models/__init__.py` | Modified (added `User`) |
| `backend/app/core/database.py` | Modified (added `user` import) |
| `backend/app/main.py` | Modified (added `auth` router) |

## Self-review

- Followed existing patterns (SQLAlchemy async with `Mapped`/`mapped_column`, Pydantic `model_config`, static service class, `APIRouter` with prefix/tags, `Depends(get_db)` injection).
- Did NOT add `Prediction` model references since it doesn't exist yet (Task 2).
- Did NOT add `predicciones`, `leaderboard` routers since they don't exist yet.
- `get_db` was preserved as-is; `get_current_user` was appended.
- `UserOut.model_validate(user)` used (newer Pydantic v2 pattern) consistent with schemas having `from_attributes = True`.
- Test env required `PYTHONPATH` workaround (no package setup). Tests pass after setting it.
