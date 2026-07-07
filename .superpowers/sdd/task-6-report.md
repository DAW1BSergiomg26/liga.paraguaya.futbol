# Task 6: Cron Endpoint for Recordatorios

## Status: ✅ Complete

## Changes
- **`backend/app/api/cron.py`**: Overwritten stub with full `POST /api/v1/cron/recordatorios` endpoint that fetches pending reminders via `PushService.obtener_recordatorios` and sends push notifications via `PushService.enviar_a_partido`
- **`.github/workflows/keep-alive.yml`**: Added `Recordatorios predicciones` step that hits the new cron endpoint every 14 minutes

## Verification
- All 18 tests passed (`python -m pytest backend/tests/ -v`)
- Committed: `b99852d` — `feat: add cron endpoint for prediction reminders`
