from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import select

from backend.app.api import admin, auth, clubes, health, leaderboard, partidos, predicciones, tabla
from backend.app.api.chat import router as chat_router
from backend.app.api.notificaciones import router as notificaciones_router
from backend.app.api.cron import router as cron_router
from backend.app.core.api_key import RATE_LIMIT_MAX, rate_limit_info
from backend.app.core.config import settings
from backend.app.core.database import async_session, run_alembic_upgrade
from backend.app.models.club import Club
from backend.app.scripts.seed import seed_clubes, seed_partidos, seed_tabla, seed_tabla_historico


@asynccontextmanager
async def lifespan(app: FastAPI):
    await run_alembic_upgrade()
    async with async_session() as db:
        await seed_clubes(db)
        await seed_partidos(db)
        await seed_tabla(db)
        await seed_tabla_historico(db)
        await db.commit()
    yield


app = FastAPI(
    title=settings.app_name,
    description="API para clubes, partidos, tabla y datos base de la Liga Paraguaya de Fútbol.",
    version=settings.app_version,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def api_key_middleware(request: Request, call_next):
    path = request.url.path
    if not path.startswith("/api/v1/") or path.startswith("/api/v1/admin/"):
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

app.include_router(health.router)
app.include_router(clubes.router)
app.include_router(partidos.router)
app.include_router(tabla.router)
app.include_router(auth.router)
app.include_router(predicciones.router)
app.include_router(leaderboard.router)
app.include_router(admin.router)
app.include_router(chat_router)
app.include_router(notificaciones_router)
app.include_router(cron_router)


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
            "/api/v1/auth/login",
            "/api/v1/predicciones",
            "/api/v1/leaderboard",
        ],
    }
