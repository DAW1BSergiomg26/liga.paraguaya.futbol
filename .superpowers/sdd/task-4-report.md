# Task 4 Report: Push Service + Subscription Endpoints

## What I Implemented
- Added `pywebpush>=1.0.0` to `backend/requirements.txt`
- Added VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, and VAPID_CLAIM_EMAIL to Settings class in `backend/app/core/config.py`
- Created `backend/app/schemas/push_subscription.py` with `PushSubscriptionCreate` schema (endpoint, p256dh, auth)
- Created `backend/app/services/push_service.py` with `PushService` class:
  - `suscribir` / `desuscribir` methods for managing push subscriptions
  - `_enviar` internal method using pywebpush (try/except guard)
  - `enviar_a_partido` to notify all users who predicted a match
  - `enviar_a_usuario` to notify a specific user
  - `obtener_recordatorios` to find matches within next 30 minutes
- Overwrote `backend/app/api/notificaciones.py` with full implementation:
  - `POST /suscribir` — save a push subscription
  - `DELETE /suscribir` — remove a push subscription
  - `GET /vapid-public-key` — expose VAPID public key to clients

## Test Results
All 18 existing tests pass:
```
18 passed in 0.56s
```

## Files Changed
- `backend/requirements.txt` — appended pywebpush dep
- `backend/app/core/config.py` — added 3 VAPID fields
- `backend/app/schemas/push_subscription.py` — new file (schema)
- `backend/app/services/push_service.py` — new file (service logic)
- `backend/app/api/notificaciones.py` — overwrite stub with full impl

## Self-Review Findings
- ✅ Code matches brief exactly — no deviations
- ✅ pywebpush import is guarded with try/except (graceful degradation when not installed)
- ✅ Subscription id pattern matches spec: `f"sub_{uuid.uuid4().hex[:12]}"`
- ✅ Token auth via `get_current_user` dependency on all protected endpoints
- ✅ Follows existing service patterns (static methods, async session)
- ✅ All 18 existing tests still pass

## Concerns
None.
