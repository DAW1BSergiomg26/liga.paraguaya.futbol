import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from starlette.responses import Response
from sqlalchemy import select

from backend.app.api import admin, auth, clubes, goleadores, health, leaderboard, partidos, predicciones, simulator, tabla
from backend.app.api.cerezo import router as cerezo_router
from backend.app.api.chat import router as chat_router
from backend.app.api.notificaciones import router as notificaciones_router
from backend.app.api.cron import router as cron_router
from backend.app.api.noticias import router as noticias_router
from backend.app.api.tactico import router as tactico_router
from backend.app.api.transferencias import router as transferencias_router
from backend.app.api.historial import router as historial_router
from backend.app.core.api_key import RATE_LIMIT_MAX, rate_limit_info
from backend.app.core.config import settings
from backend.app.core.database import async_session, run_alembic_upgrade
from backend.app.models.club import Club
from backend.app.scripts.seed import seed_clubes, seed_partidos, seed_tabla, seed_tabla_historico

logger = logging.getLogger(__name__)


async def sync_loop():
    if not settings.api_football_key:
        logger.info("FOOTBALL_DATA_API_KEY no configurada - sync_loop desactivado")
        return
    while True:
        try:
            from backend.app.services.football_data_service import FootballDataService
            result = FootballDataService.sync_all()
            logger.info(f"Sync result: {result}")
        except Exception as e:
            logger.error(f"Sync failed: {e}")
        await asyncio.sleep(600)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await run_alembic_upgrade()
    async with async_session() as db:
        await seed_clubes(db)
        await seed_partidos(db)
        await seed_tabla(db)
        await seed_tabla_historico(db)
        await db.commit()
    sync_task = asyncio.create_task(sync_loop())
    yield
    sync_task.cancel()


app = FastAPI(
    title=settings.app_name,
    description="API para clubes, partidos, tabla y datos base de la Liga Paraguaya de Fútbol.",
    version=settings.app_version,
    lifespan=lifespan,
)

# CORS se maneja con cors_middleware (abajo) para soportar los dominios
# efimeros de Vercel (cambian por deploy) sin hardcodearlos.


@app.middleware("http")
async def api_key_middleware(request: Request, call_next):
    path = request.url.path
    if not path.startswith("/api/v1/") or path.startswith("/api/v1/admin/"):
        return await call_next(request)

    if request.method == "OPTIONS":
        return await call_next(request)

    x_api_key = request.headers.get("X-API-Key", "")
    if x_api_key:
        info = await rate_limit_info(x_api_key)
        if not info["ok"]:
            headers = {}
            if info.get("reset_in"):
                headers["X-RateLimit-Reset"] = str(info["reset_in"])
            return JSONResponse(status_code=info["status_code"], content=info["body"], headers=headers)

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(RATE_LIMIT_MAX)
        response.headers["X-RateLimit-Remaining"] = str(info["remaining"])
        if info.get("reset_in"):
            response.headers["X-RateLimit-Reset"] = str(info["reset_in"])
        return response
    return await call_next(request)


def _is_allowed_origin(origin: str) -> bool:
    """Valida si un Origin puede acceder a la API.

    Ademas de la lista estatica de config.py, se aceptan los
    dominios efimeros de Vercel (*.vercel.app, que cambian por
    deploy) y localhost en desarrollo. Esto evita el bloqueo CORS
    del browser cuando el frontend se sirve desde un deploy nuevo.
    """
    if not origin:
        return False
    if origin in settings.cors_origin_list:
        return True
    if origin.endswith(".vercel.app"):
        return True
    if origin.startswith("http://localhost:") or origin.startswith("http://127.0.0.1:"):
        return True
    return False


@app.middleware("http")
async def cors_middleware(request: Request, call_next):
    origin = request.headers.get("origin", "")
    allowed = _is_allowed_origin(origin)

    if request.method == "OPTIONS":
        # Preflight: responder directamente sin tocar el endpoint.
        headers = {}
        if allowed:
            headers["Access-Control-Allow-Origin"] = origin
            headers["Access-Control-Allow-Credentials"] = "true"
            headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
            headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-API-Key"
        return Response(content="", status_code=200, headers=headers)

    response = await call_next(request)
    if allowed:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-API-Key"
    return response


app.include_router(health.router)
app.include_router(clubes.router)
app.include_router(partidos.router)
app.include_router(tabla.router)
app.include_router(auth.router)
app.include_router(predicciones.router)
app.include_router(leaderboard.router)
app.include_router(admin.router)
app.include_router(cerezo_router)
app.include_router(chat_router)
app.include_router(notificaciones_router)
app.include_router(cron_router)
app.include_router(noticias_router)
app.include_router(tactico_router)
app.include_router(goleadores.router)
app.include_router(transferencias_router)
app.include_router(historial_router)
app.include_router(simulator.router)


@app.get("/")
async def root():
    return {
        "proyecto": "liga.paraguaya.futbol",
        "estado": "API funcionando",
        "version": settings.app_version,
        "endpoints": [
            "/health",
            "/api/v1/clubes",
            "/api/v1/clubes/{club_id}",
            "/api/v1/partidos",
            "/api/v1/partidos/{partido_id}",
            "/api/v1/tabla",
            "/api/v1/tabla/torneos",
            "/api/v1/auth/login",
            "/api/v1/auth/register",
            "/api/v1/auth/me",
            "/api/v1/predicciones",
            "/api/v1/predicciones/mis",
            "/api/v1/leaderboard",
            "/api/v1/goleadores",
            "/api/v1/goleadores/historial",
            "/api/v1/historial/campeones",
            "/api/v1/historial/ranking-clubes",
            "/api/v1/historial/club/{club_id}",
            "/api/v1/transferencias",
            "/api/v1/transferencias/{transferencia_id}",
            "/api/v1/transferencias/mercado",
            "/api/v1/transferencias/historial",
            "/api/v1/transferencias/estadisticas",
            "/api/v1/noticias",
            "/api/v1/noticias/{noticia_id}",
            "/api/v1/cerezo/ask",
            "/api/v1/tactico/equipos",
            "/api/v1/tactico/equipo/{equipo_id}",
            "/api/v1/tactico/partido/{partido_id}",
            "/api/v1/chat/{partido_id}",
            "/api/v1/simulador/prediccion",
            "/api/v1/admin/partidos/{partido_id}",
        ],
    }
