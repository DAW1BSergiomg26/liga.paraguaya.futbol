# HANDOFF — liga.paraguaya.futbol

Última actualización: 2026-07-23 01:00 (AST)

---

## 1. Estado general del proyecto

Plataforma full-stack de la Liga Paraguaya de Fútbol: Next.js 15 + TypeScript (frontend en Vercel) + FastAPI + Neon Postgres (backend en Render free tier). El proyecto está en **fase de maduración post-despliegue**: las fases principales (Dockerfile, imports, esquema DB, mojibake) están cerradas. Producción está **operativa y estable**. El próximo hito activo es la **eliminación total de emojis Unicode** (reemplazo por lucide-react SVG), que está en FASE 0 (mapeo completo presentado, esperando decisión del usuario en 2 puntos antes de implementar). Hay un PR abierto (#9) de mojibake que necesita merge.

---

## 2. Fases completadas (checklist histórico)

| # | Fecha | Fase | PR/Commit | Estado |
|---|-------|------|-----------|--------|
| 1 | 2026-07-03 | Deploy inicial (Railway + Vercel) | PR #1 `feature/frontend-react-v1` | MERGED |
| 2 | 2026-07-07 | Fix CORS + deploy Koyeb | PR #4, #7 | MERGED |
| 3 | 2026-07-16 | Fix Vercel framework config | PR #5 `fix/vercel-framework-config` | MERGED |
| 4 | 2026-07-16 | Fix red3d graph loading | PR #3 `fix/red3d-graph-loading` | MERGED |
| 5 | 2026-07-16 | Remover dependencias Supabase muertas | PR #6 `chore/remove-dead-supabase-deps` | ABIERTO (stale) |
| 6 | 2026-07-19 | Backup nivel pro | Branch `backup-nivel-pro-2026-07-19` | Local |
| 7 | 2026-07-22 | Fix Dockerfile definitivo (WORKDIR/CMD/port) | Commits `db4f419`→`479c4ad` | En main |
| 8 | 2026-07-22 | Convertir imports absolutos a relativos | Commit `bb2a8f1` | En main |
| 9 | 2026-07-22 | SQLite path absoluto + import roto | Commit `e8df96c` | En main |
| 10 | 2026-07-22 | Health endpoint `/api/v1/health` | Commit `02c95ee` | En main |
| 11 | 2026-07-22 | Seed goleadores reales APF 2023-2026 | Commit `68098e5` | En main |
| 12 | 2026-07-22 | Sonner toasts + ball animado | Commit `c85f197` | En main |
| 13 | 2026-07-22 | Fix esquema Postgres (lifespan + seeds) | PR #8 `fix/sync-postgres-schema` | MERGED |
| 14 | 2026-07-22 | Fix mojibake UTF-8 (23 archivos backend) | PR #9 `fix/utf8-mojibake` | **ABIERTO** |

---

## 3. Activo ahora mismo

### Tarea: Reemplazo emojis → lucide-react SVG

- **Rama actual:** `fix/utf8-mojibake` (checkout, no main)
- **FASE 0 completada:** Script de barrido ejecutado, tabla de mapeo completa presentada al usuario (14 categorías, ~85 instancias en código de producción).
- **lucide-react NO instalado** — prerequisito: `npm install lucide-react` en `/frontend`
- **2 preguntas pendientes de decisión del usuario** (copiadas textualmente):

> **Pregunta 1:** "Flags de país (`ligas.ts`): ¿Reemplazar con siglas de texto (`PY`, `AR`, `ES`...) o eliminar el campo `icono` para las ligas?"

> **Pregunta 2:** "Emojis en `leaguesData.json` (contenido de noticias): ¿Reemplazar o dejar como contenido editorial?"

- **Archivos de debug temporales sin commitear** (en working tree de `fix/utf8-mojibake`):
  - `_emoji_scan_results.txt`
  - `scan_emojis.py`
  - `backend/app/services/tactico_service.py.fixed`
  - `AGENTS.md` (NUEVO — recién creado, necesita commit)

---

## 4. Bloqueado / pendiente de decisión

| # | Tarea | Bloqueado por | Acción requerida |
|---|-------|---------------|------------------|
| 1 | FASE 1 implementación emojis→lucide-react | Respuesta del usuario a las 2 preguntas de la sección 3 | Usuario confirma mapeo de flags y contenido editorial |
| 2 | PR #9 mojibake (merge a main) | Pendiente de revisión/merge por el usuario | Usuario hace merge del PR |
| 3 | PR #6 remove-dead-supabase-deps | Stale desde 2026-07-16 | Decidir si cerrar o reactivar |
| 4 | Migración Alembic real | Requiere decisión de infraestructura | Ver sección 5 (deuda técnica) |

---

## 5. Deuda técnica conocida

| # | Descripción | Ubicación | Gravedad | Solución definitiva |
|---|-------------|-----------|----------|-------------------|
| 1 | **`_ensure_schema_postgres()`** — parche temporal que agrega columnas faltantes con `ALTER TABLE` en el lifespan. `create_all()` NO modifica columnas existentes. | `backend/app/core/database.py:160` | Alta | Migrar a `alembic upgrade head` real. La función tiene TODO explícito en línea 163. |
| 2 | **Emojis Unicode en código** — 85+ instancias en backend y frontend causan mojibake, inconsistencia visual, y dependen de encoding del servidor. | Múltiples archivos (ver FASE 0) | Alta | Reemplazar por lucide-react SVG (tarea activa) |
| 3 | **`tactico_service.py.fixed`** — archivo temporal de debug sin limpiar. | Raíz del proyecto | Baja | Eliminar |
| 4 | **`scan_emojis.py` + `_emoji_scan_results.txt`** — herramienta de barrido temporal. | Raíz del proyecto | Baja | Eliminar o mover a `scripts/` si se reutiliza |
| 5 | **PR #6 stale** — remove-dead-supabase-deps sin merge desde 2026-07-16. | GitHub PR | Baja | Cerrar si Supabase ya no se usa, o reactivar |

---

## 6. Convenciones y datos operativos clave

### URLs de deploy
| Servicio | URL | Dashboard |
|----------|-----|-----------|
| Frontend (Vercel) | `https://frontend-ten-swart-85.vercel.app` | Vercel dashboard |
| Backend (Render) | `https://liga-paraguaya-futbol.onrender.com` | Render dashboard |
| Repo | `https://github.com/DAW1BSergiomg26/liga.paraguaya.futbol` | GitHub |

### Variables de entorno críticas
| Variable | Ubicación | Notas |
|----------|-----------|-------|
| `DATABASE_URL` | Render dashboard (NO en .env local) | Neon Postgres |
| `ADMIN_API_KEY` | Render dashboard | Acceso a `/admin` |
| `NEXT_PUBLIC_API_URL` | Vercel dashboard | Horneada en build |
| `API_URL` | Vercel dashboard | Frontend → Backend |

### Credenciales de servicio (nombres, NO valores)
| Servicio | Usuario/Campo | Notas |
|----------|--------------|-------|
| Admin seed | `menu2informatico@gmail.com` | Password: `Rufi14` |
| Neon Postgres | Variable `DATABASE_URL` | Solo en Render |

### Comandos de verificación estándar
```bash
# Backend tests (212 tests, 207 pasan, 5 pre-existentes)
cd backend && python -m pytest tests/ -v

# Frontend build (debe ser limpio, sin warnings TS ni hidratación)
cd frontend && npm run build

# Healthcheck backend
curl https://liga-paraguaya-futbol.onrender.com/api/v1/health

# Git status antes de commit
git status && git diff
```

### Estructura de ramas
- `main` — rama de producción (NUNCA commitear directo)
- `fix/*` — bugs y fixes
- `feat/*` — nuevas features
- `docs/*` — documentación
- `chore/*` — mantenimiento
- `refactor/*` — refactors sin cambio de comportamiento

---

## 7. Archivos relevantes por área

### Backend — API y rutas
| Archivo | Descripción |
|---------|-------------|
| `backend/app/main.py` | FastAPI app + lifespan (init_db, seeds, _ensure_schema_postgres) |
| `backend/app/api/admin.py` | Endpoints de admin (CRUD, notificaciones con emojis) |
| `backend/app/api/cron.py` | Cron jobs (recordatorios con emojis) |
| `backend/app/core/database.py` | Engine, session, _ensure_schema_postgres (DEUDA TÉCNICA #1) |

### Backend — Servicios
| Archivo | Descripción |
|---------|-------------|
| `backend/app/services/tactico_service.py` | 60 InsightTactico con emojis en `icono` (mayor fuente de emojis) |
| `backend/app/services/cerezo/` | Chatbot IA (classifier, response_generator) |

### Frontend — Componentes con emojis
| Archivo | Emojis | Reemplazo |
|---------|--------|-----------|
| `frontend/src/app/status/PageClient.tsx` | ✅⚠️❌🔄⏳ | statusIcon() → lucide |
| `frontend/src/app/error.tsx` | ⚽ | CircleDot |
| `frontend/src/app/not-found.tsx` | 🏟️ | Landmark |
| `frontend/src/app/clubes/error.tsx` | ⚽ | CircleDot |
| `frontend/src/app/clubes/[id]/PageClient.tsx` | 🏆 | Trophy |
| `frontend/src/app/historial/error.tsx` | ⚽ | CircleDot |
| `frontend/src/app/transferencias/error.tsx` | ⚽ | CircleDot |
| `frontend/src/app/tactico/error.tsx` | ⚽ | CircleDot |
| `frontend/src/app/simulador/error.tsx` | ⚽ | CircleDot |
| `frontend/src/app/predicciones/PageClient.tsx` | 🏆 | Trophy |
| `frontend/src/app/partidos/PageClient.tsx` | 🔮 | Sparkles |
| `frontend/src/app/partidos/[id]/PageClient.tsx` | 🏟️🔮 | Landmark, Sparkles |
| `frontend/src/app/red3d/PageClient.tsx` | 🖱🔍⚡ | MousePointer, Search, Zap |
| `frontend/src/components/tactico/InsightsPanel.tsx` | (passthrough) | Recibe icono de backend |
| `frontend/src/components/sidebar/NavegadorLigas.tsx` | (passthrough) | Recibe icono de ligas.ts |
| `frontend/src/data/ligas.ts` | 🏆⭐ + flags | Decidir (Pregunta 1) |
| `frontend/src/components/PredictionModal.tsx` | 🔮 | Sparkles |

### Frontend — Tipos
| Archivo | Interface relevante |
|---------|-------------------|
| `frontend/src/types/index.ts:259` | `InsightTactico { icono: string, texto, metrica }` |

### Infraestructura
| Archivo | Descripción |
|---------|-------------|
| `Dockerfile` | Backend Docker (Render): `ENV PORT=10000`, `CMD uvicorn` |
| `.dockerignore` | Excluye frontend, node_modules, .git |

---

## 8. Próximos pasos priorizados

| # | Prioridad | Tarea | Depende de |
|---|-----------|-------|------------|
| 1 | **Crítico** | Responder 2 preguntas de la FASE 0 emojis (sección 3) | Usuario |
| 2 | **Crítico** | Merge PR #9 mojibake a main | Usuario |
| 3 | **Alta** | Instalar lucide-react + crear `lib/iconMap.ts` | Respuesta Preguntas 1-2 |
| 4 | **Alta** | FASE 1: Implementar reemplazos emojis→lucide-react | Instalación lucide-react |
| 5 | **Alta** | FASE 2: Tests + build verification | FASE 1 completada |
| 6 | **Alta** | FASE 3: Commit, PR, documentar ICONOGRAPHY.md | FASE 2 pasó |
| 7 | **Media** | Migrar `_ensure_schema_postgres()` a Alembic real | Decisión de infraestructura |
| 8 | **Media** | Evaluar/prorratear PR #6 stale (Supabase deps) | N/A |
| 9 | **Baja** | Limpiar archivos temporales (`scan_emojis.py`, `.fixed`, `_emoji_scan_results.txt`) | FASE 0 completada |
| 10 | **Nice-to-have** | Seed de noticias (no hay `noticias_demo.json`) | Decisión del usuario |

---

*Este archivo se actualiza en CADA sesión donde se complete, bloquee, o modifique el estado de una tarea. Al inicio de cada sesión nueva, OpenCode debe leerlo completo y confirmar un resumen de 3-4 líneas antes de proceder.*
