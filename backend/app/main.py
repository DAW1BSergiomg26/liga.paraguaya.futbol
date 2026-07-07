from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from backend.app.api import admin, auth, clubes, health, leaderboard, partidos, predicciones, tabla
from backend.app.api.chat import router as chat_router
from backend.app.api.notificaciones import router as notificaciones_router
from backend.app.api.cron import router as cron_router
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
