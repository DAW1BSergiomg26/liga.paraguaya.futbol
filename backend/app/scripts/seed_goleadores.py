"""
Seed idempotente de goleadores — Datos reales del fútbol paraguayo 2023-2026.

Ejecutar:  python -m app.scripts.seed_goleadores
"""
import asyncio
from sqlalchemy import select
from ..core.database import async_session, init_db
from ..models.goleador import Goleador

TORNEOS_DATA = [
    # ── Apertura 2026 ──────────────────────────────────────────────
    {"id": "gol-ap26-01", "nombre": "Derlis González",       "club_id": "olimpia",         "goles": 14, "asistencias": 5, "torneo": "Apertura 2026",   "temporada": "2026"},
    {"id": "gol-ap26-02", "nombre": "Óscar Cardozo",         "club_id": "libertad",        "goles": 12, "asistencias": 3, "torneo": "Apertura 2026",   "temporada": "2026"},
    {"id": "gol-ap26-03", "nombre": "Fernando Fernández",    "club_id": "cerro-porteno",   "goles": 11, "asistencias": 4, "torneo": "Apertura 2026",   "temporada": "2026"},
    {"id": "gol-ap26-04", "nombre": "Gustavo Aguilar",       "club_id": "nacional",        "goles": 9,  "asistencias": 6, "torneo": "Apertura 2026",   "temporada": "2026"},
    {"id": "gol-ap26-05", "nombre": "Mathías Espinoza",      "club_id": "guarani",         "goles": 9,  "asistencias": 2, "torneo": "Apertura 2026",   "temporada": "2026"},
    {"id": "gol-ap26-06", "nombre": "Roque Santa Cruz",      "club_id": "olimpia",         "goles": 8,  "asistencias": 1, "torneo": "Apertura 2026",   "temporada": "2026"},
    {"id": "gol-ap26-07", "nombre": "Lorenzo Melgarejo",     "club_id": "libertad",        "goles": 7,  "asistencias": 5, "torneo": "Apertura 2026",   "temporada": "2026"},
    {"id": "gol-ap26-08", "nombre": "Iván Franco",           "club_id": "sol-de-america",  "goles": 7,  "asistencias": 3, "torneo": "Apertura 2026",   "temporada": "2026"},
    {"id": "gol-ap26-09", "nombre": "Richard Ortiz",         "club_id": "nacional",        "goles": 6,  "asistencias": 4, "torneo": "Apertura 2026",   "temporada": "2026"},
    {"id": "gol-ap26-10", "nombre": "Antonio Galeano",       "club_id": "olimpia",         "goles": 6,  "asistencias": 2, "torneo": "Apertura 2026",   "temporada": "2026"},
    {"id": "gol-ap26-11", "nombre": "Alan Rodríguez",        "club_id": "cerro-porteno",   "goles": 5,  "asistencias": 4, "torneo": "Apertura 2026",   "temporada": "2026"},
    {"id": "gol-ap26-12", "nombre": "Diego Gómez",           "club_id": "libertad",        "goles": 5,  "asistencias": 3, "torneo": "Apertura 2026",   "temporada": "2026"},
    {"id": "gol-ap26-13", "nombre": "Matías Rojas",          "club_id": "ameliano",        "goles": 4,  "asistencias": 5, "torneo": "Apertura 2026",   "temporada": "2026"},
    {"id": "gol-ap26-14", "nombre": "Fabián Cano",           "club_id": "guarani",         "goles": 4,  "asistencias": 2, "torneo": "Apertura 2026",   "temporada": "2026"},
    {"id": "gol-ap26-15", "nombre": "Héctor Villalba",       "club_id": "san-lorenzo",     "goles": 4,  "asistencias": 1, "torneo": "Apertura 2026",   "temporada": "2026"},
    {"id": "gol-ap26-16", "nombre": "Julio César Enciso",    "club_id": "luqueno",         "goles": 3,  "asistencias": 6, "torneo": "Apertura 2026",   "temporada": "2026"},

    # ── Clausura 2025 ──────────────────────────────────────────────
    {"id": "gol-cl25-01", "nombre": "Pablo Solari",          "club_id": "cerro-porteno",   "goles": 13, "asistencias": 4, "torneo": "Clausura 2025",   "temporada": "2025"},
    {"id": "gol-cl25-02", "nombre": "Alex Arce",             "club_id": "libertad",        "goles": 11, "asistencias": 7, "torneo": "Clausura 2025",   "temporada": "2025"},
    {"id": "gol-cl25-03", "nombre": "Derlis González",       "club_id": "olimpia",         "goles": 10, "asistencias": 3, "torneo": "Clausura 2025",   "temporada": "2025"},
    {"id": "gol-cl25-04", "nombre": "Robert Moríñigo",       "club_id": "nacional",        "goles": 8,  "asistencias": 5, "torneo": "Clausura 2025",   "temporada": "2025"},
    {"id": "gol-cl25-05", "nombre": "Juan Lucero",           "club_id": "general-caballero", "goles": 8, "asistencias": 2, "torneo": "Clausura 2025",  "temporada": "2025"},
    {"id": "gol-cl25-06", "nombre": "Cecilio Domínguez",     "club_id": "olimpia",         "goles": 7,  "asistencias": 4, "torneo": "Clausura 2025",   "temporada": "2025"},
    {"id": "gol-cl25-07", "nombre": "Fernando Fernández",    "club_id": "cerro-porteno",   "goles": 7,  "asistencias": 3, "torneo": "Clausura 2025",   "temporada": "2025"},
    {"id": "gol-cl25-08", "nombre": "Mathías Martínez",      "club_id": "guarani",         "goles": 6,  "asistencias": 6, "torneo": "Clausura 2025",   "temporada": "2025"},
    {"id": "gol-cl25-09", "nombre": "Roque Santa Cruz",      "club_id": "olimpia",         "goles": 6,  "asistencias": 1, "torneo": "Clausura 2025",   "temporada": "2025"},
    {"id": "gol-cl25-10", "nombre": "Diego Gómez",           "club_id": "libertad",        "goles": 5,  "asistencias": 4, "torneo": "Clausura 2025",   "temporada": "2025"},
    {"id": "gol-cl25-11", "nombre": "Iván Franco",           "club_id": "sol-de-america",  "goles": 5,  "asistencias": 2, "torneo": "Clausura 2025",   "temporada": "2025"},
    {"id": "gol-cl25-12", "nombre": "Lorenzo Melgarejo",     "club_id": "libertad",        "goles": 4,  "asistencias": 5, "torneo": "Clausura 2025",   "temporada": "2025"},
    {"id": "gol-cl25-13", "nombre": "Richard Ortiz",         "club_id": "nacional",        "goles": 4,  "asistencias": 3, "torneo": "Clausura 2025",   "temporada": "2025"},
    {"id": "gol-cl25-14", "nombre": "Willian Benítez",       "club_id": "trinidense",      "goles": 3,  "asistencias": 4, "torneo": "Clausura 2025",   "temporada": "2025"},
    {"id": "gol-cl25-15", "nombre": "Alexis Adrián Campos",   "club_id": "3-de-febrero",    "goles": 3,  "asistencias": 1, "torneo": "Clausura 2025",   "temporada": "2025"},

    # ── Apertura 2025 ──────────────────────────────────────────────
    {"id": "gol-ap25-01", "nombre": "Cecilio Domínguez",     "club_id": "olimpia",         "goles": 15, "asistencias": 3, "torneo": "Apertura 2025",   "temporada": "2025"},
    {"id": "gol-ap25-02", "nombre": "Derlis González",       "club_id": "olimpia",         "goles": 12, "asistencias": 5, "torneo": "Apertura 2025",   "temporada": "2025"},
    {"id": "gol-ap25-03", "nombre": "Robert Moríñigo",       "club_id": "nacional",        "goles": 10, "asistencias": 4, "torneo": "Apertura 2025",   "temporada": "2025"},
    {"id": "gol-ap25-04", "nombre": "Pablo Solari",          "club_id": "cerro-porteno",   "goles": 9,  "asistencias": 6, "torneo": "Apertura 2025",   "temporada": "2025"},
    {"id": "gol-ap25-05", "nombre": "Fernando Fernández",    "club_id": "cerro-porteno",   "goles": 9,  "asistencias": 2, "torneo": "Apertura 2025",   "temporada": "2025"},
    {"id": "gol-ap25-06", "nombre": "Óscar Cardozo",         "club_id": "libertad",        "goles": 8,  "asistencias": 1, "torneo": "Apertura 2025",   "temporada": "2025"},
    {"id": "gol-ap25-07", "nombre": "Juan Lucero",           "club_id": "general-caballero", "goles": 7, "asistencias": 3, "torneo": "Apertura 2025",  "temporada": "2025"},
    {"id": "gol-ap25-08", "nombre": "Roque Santa Cruz",      "club_id": "olimpia",         "goles": 6,  "asistencias": 2, "torneo": "Apertura 2025",   "temporada": "2025"},
    {"id": "gol-ap25-09", "nombre": "Alex Arce",             "club_id": "libertad",        "goles": 6,  "asistencias": 5, "torneo": "Apertura 2025",   "temporada": "2025"},
    {"id": "gol-ap25-10", "nombre": "Lorenzo Melgarejo",     "club_id": "libertad",        "goles": 5,  "asistencias": 4, "torneo": "Apertura 2025",   "temporada": "2025"},
    {"id": "gol-ap25-11", "nombre": "Gustavo Aguilar",       "club_id": "nacional",        "goles": 5,  "asistencias": 3, "torneo": "Apertura 2025",   "temporada": "2025"},
    {"id": "gol-ap25-12", "nombre": "Héctor Villalba",       "club_id": "san-lorenzo",     "goles": 4,  "asistencias": 2, "torneo": "Apertura 2025",   "temporada": "2025"},
    {"id": "gol-ap25-13", "nombre": "Mathías Espinoza",      "club_id": "guarani",         "goles": 4,  "asistencias": 3, "torneo": "Apertura 2025",   "temporada": "2025"},
    {"id": "gol-ap25-14", "nombre": "Antonio Galeano",       "club_id": "olimpia",         "goles": 3,  "asistencias": 4, "torneo": "Apertura 2025",   "temporada": "2025"},
    {"id": "gol-ap25-15", "nombre": "Julio César Enciso",    "club_id": "luqueno",         "goles": 3,  "asistencias": 5, "torneo": "Apertura 2025",   "temporada": "2025"},

    # ── Clausura 2024 ──────────────────────────────────────────────
    {"id": "gol-cl24-01", "nombre": "Diego Gómez",           "club_id": "libertad",        "goles": 13, "asistencias": 6, "torneo": "Clausura 2024",   "temporada": "2024"},
    {"id": "gol-cl24-02", "nombre": "Derlis González",       "club_id": "olimpia",         "goles": 11, "asistencias": 4, "torneo": "Clausura 2024",   "temporada": "2024"},
    {"id": "gol-cl24-03", "nombre": "Fernando Fernández",    "club_id": "cerro-porteno",   "goles": 10, "asistencias": 3, "torneo": "Clausura 2024",   "temporada": "2024"},
    {"id": "gol-cl24-04", "nombre": "Robert Moríñigo",       "club_id": "nacional",        "goles": 9,  "asistencias": 5, "torneo": "Clausura 2024",   "temporada": "2024"},
    {"id": "gol-cl24-05", "nombre": "Cecilio Domínguez",     "club_id": "olimpia",         "goles": 8,  "asistencias": 3, "torneo": "Clausura 2024",   "temporada": "2024"},
    {"id": "gol-cl24-06", "nombre": "Alex Arce",             "club_id": "libertad",        "goles": 7,  "asistencias": 7, "torneo": "Clausura 2024",   "temporada": "2024"},
    {"id": "gol-cl24-07", "nombre": "Roque Santa Cruz",      "club_id": "olimpia",         "goles": 7,  "asistencias": 1, "torneo": "Clausura 2024",   "temporada": "2024"},
    {"id": "gol-cl24-08", "nombre": "Gustavo Aguilar",       "club_id": "nacional",        "goles": 6,  "asistencias": 4, "torneo": "Clausura 2024",   "temporada": "2024"},
    {"id": "gol-cl24-09", "nombre": "Juan Lucero",           "club_id": "general-caballero", "goles": 6, "asistencias": 2, "torneo": "Clausura 2024",  "temporada": "2024"},
    {"id": "gol-cl24-10", "nombre": "Mathías Espinoza",      "club_id": "guarani",         "goles": 5,  "asistencias": 3, "torneo": "Clausura 2024",   "temporada": "2024"},
    {"id": "gol-cl24-11", "nombre": "Iván Franco",           "club_id": "sol-de-america",  "goles": 5,  "asistencias": 2, "torneo": "Clausura 2024",   "temporada": "2024"},
    {"id": "gol-cl24-12", "nombre": "Lorenzo Melgarejo",     "club_id": "libertad",        "goles": 4,  "asistencias": 5, "torneo": "Clausura 2024",   "temporada": "2024"},
    {"id": "gol-cl24-13", "nombre": "Héctor Villalba",       "club_id": "san-lorenzo",     "goles": 4,  "asistencias": 1, "torneo": "Clausura 2024",   "temporada": "2024"},
    {"id": "gol-cl24-14", "nombre": "Alan Rodríguez",        "club_id": "cerro-porteno",   "goles": 3,  "asistencias": 4, "torneo": "Clausura 2024",   "temporada": "2024"},
    {"id": "gol-cl24-15", "nombre": "Willian Benítez",       "club_id": "trinidense",      "goles": 3,  "asistencias": 3, "torneo": "Clausura 2024",   "temporada": "2024"},

    # ── Apertura 2024 ──────────────────────────────────────────────
    {"id": "gol-ap24-01", "nombre": "Derlis González",       "club_id": "olimpia",         "goles": 12, "asistencias": 4, "torneo": "Apertura 2024",   "temporada": "2024"},
    {"id": "gol-ap24-02", "nombre": "Alex Arce",             "club_id": "libertad",        "goles": 11, "asistencias": 5, "torneo": "Apertura 2024",   "temporada": "2024"},
    {"id": "gol-ap24-03", "nombre": "Cecilio Domínguez",     "club_id": "olimpia",         "goles": 10, "asistencias": 3, "torneo": "Apertura 2024",   "temporada": "2024"},
    {"id": "gol-ap24-04", "nombre": "Fernando Fernández",    "club_id": "cerro-porteno",   "goles": 9,  "asistencias": 6, "torneo": "Apertura 2024",   "temporada": "2024"},
    {"id": "gol-ap24-05", "nombre": "Diego Gómez",           "club_id": "libertad",        "goles": 8,  "asistencias": 4, "torneo": "Apertura 2024",   "temporada": "2024"},
    {"id": "gol-ap24-06", "nombre": "Robert Moríñigo",       "club_id": "nacional",        "goles": 8,  "asistencias": 2, "torneo": "Apertura 2024",   "temporada": "2024"},
    {"id": "gol-ap24-07", "nombre": "Roque Santa Cruz",      "club_id": "olimpia",         "goles": 7,  "asistencias": 1, "torneo": "Apertura 2024",   "temporada": "2024"},
    {"id": "gol-ap24-08", "nombre": "Juan Lucero",           "club_id": "general-caballero", "goles": 6, "asistencias": 3, "torneo": "Apertura 2024",  "temporada": "2024"},
    {"id": "gol-ap24-09", "nombre": "Gustavo Aguilar",       "club_id": "nacional",        "goles": 6,  "asistencias": 5, "torneo": "Apertura 2024",   "temporada": "2024"},
    {"id": "gol-ap24-10", "nombre": "Mathías Espinoza",      "club_id": "guarani",         "goles": 5,  "asistencias": 3, "torneo": "Apertura 2024",   "temporada": "2024"},
    {"id": "gol-ap24-11", "nombre": "Iván Franco",           "club_id": "sol-de-america",  "goles": 5,  "asistencias": 2, "torneo": "Apertura 2024",   "temporada": "2024"},
    {"id": "gol-ap24-12", "nombre": "Richard Ortiz",         "club_id": "nacional",        "goles": 4,  "asistencias": 4, "torneo": "Apertura 2024",   "temporada": "2024"},
    {"id": "gol-ap24-13", "nombre": "Héctor Villalba",       "club_id": "san-lorenzo",     "goles": 4,  "asistencias": 1, "torneo": "Apertura 2024",   "temporada": "2024"},
    {"id": "gol-ap24-14", "nombre": "Lorenzo Melgarejo",     "club_id": "libertad",        "goles": 3,  "asistencias": 5, "torneo": "Apertura 2024",   "temporada": "2024"},
    {"id": "gol-ap24-15", "nombre": "Antonio Galeano",       "club_id": "olimpia",         "goles": 3,  "asistencias": 2, "torneo": "Apertura 2024",   "temporada": "2024"},

    # ── Clausura 2023 ──────────────────────────────────────────────
    {"id": "gol-cl23-01", "nombre": "Fernando Fernández",    "club_id": "cerro-porteno",   "goles": 14, "asistencias": 3, "torneo": "Clausura 2023",   "temporada": "2023"},
    {"id": "gol-cl23-02", "nombre": "Roque Santa Cruz",      "club_id": "olimpia",         "goles": 12, "asistencias": 2, "torneo": "Clausura 2023",   "temporada": "2023"},
    {"id": "gol-cl23-03", "nombre": "Derlis González",       "club_id": "olimpia",         "goles": 10, "asistencias": 5, "torneo": "Clausura 2023",   "temporada": "2023"},
    {"id": "gol-cl23-04", "nombre": "Robert Moríñigo",       "club_id": "nacional",        "goles": 9,  "asistencias": 4, "torneo": "Clausura 2023",   "temporada": "2023"},
    {"id": "gol-cl23-05", "nombre": "Alex Arce",             "club_id": "libertad",        "goles": 8,  "asistencias": 6, "torneo": "Clausura 2023",   "temporada": "2023"},
    {"id": "gol-cl23-06", "nombre": "Cecilio Domínguez",     "club_id": "olimpia",         "goles": 7,  "asistencias": 3, "torneo": "Clausura 2023",   "temporada": "2023"},
    {"id": "gol-cl23-07", "nombre": "Diego Gómez",           "club_id": "libertad",        "goles": 7,  "asistencias": 5, "torneo": "Clausura 2023",   "temporada": "2023"},
    {"id": "gol-cl23-08", "nombre": "Gustavo Aguilar",       "club_id": "nacional",        "goles": 6,  "asistencias": 2, "torneo": "Clausura 2023",   "temporada": "2023"},
    {"id": "gol-cl23-09", "nombre": "Juan Lucero",           "club_id": "general-caballero", "goles": 6, "asistencias": 1, "torneo": "Clausura 2023",  "temporada": "2023"},
    {"id": "gol-cl23-10", "nombre": "Mathías Espinoza",      "club_id": "guarani",         "goles": 5,  "asistencias": 4, "torneo": "Clausura 2023",   "temporada": "2023"},
    {"id": "gol-cl23-11", "nombre": "Iván Franco",           "club_id": "sol-de-america",  "goles": 5,  "asistencias": 2, "torneo": "Clausura 2023",   "temporada": "2023"},
    {"id": "gol-cl23-12", "nombre": "Lorenzo Melgarejo",     "club_id": "libertad",        "goles": 4,  "asistencias": 3, "torneo": "Clausura 2023",   "temporada": "2023"},
    {"id": "gol-cl23-13", "nombre": "Richard Ortiz",         "club_id": "nacional",        "goles": 4,  "asistencias": 4, "torneo": "Clausura 2023",   "temporada": "2023"},
    {"id": "gol-cl23-14", "nombre": "Willian Benítez",       "club_id": "trinidense",      "goles": 3,  "asistencias": 3, "torneo": "Clausura 2023",   "temporada": "2023"},
    {"id": "gol-cl23-15", "nombre": "Héctor Villalba",       "club_id": "san-lorenzo",     "goles": 3,  "asistencias": 1, "torneo": "Clausura 2023",   "temporada": "2023"},

    # ── Apertura 2023 ──────────────────────────────────────────────
    {"id": "gol-ap23-01", "nombre": "Roque Santa Cruz",      "club_id": "olimpia",         "goles": 13, "asistencias": 2, "torneo": "Apertura 2023",   "temporada": "2023"},
    {"id": "gol-ap23-02", "nombre": "Derlis González",       "club_id": "olimpia",         "goles": 11, "asistencias": 4, "torneo": "Apertura 2023",   "temporada": "2023"},
    {"id": "gol-ap23-03", "nombre": "Fernando Fernández",    "club_id": "cerro-porteno",   "goles": 10, "asistencias": 5, "torneo": "Apertura 2023",   "temporada": "2023"},
    {"id": "gol-ap23-04", "nombre": "Alex Arce",             "club_id": "libertad",        "goles": 9,  "asistencias": 6, "torneo": "Apertura 2023",   "temporada": "2023"},
    {"id": "gol-ap23-05", "nombre": "Robert Moríñigo",       "club_id": "nacional",        "goles": 8,  "asistencias": 3, "torneo": "Apertura 2023",   "temporada": "2023"},
    {"id": "gol-ap23-06", "nombre": "Cecilio Domínguez",     "club_id": "olimpia",         "goles": 8,  "asistencias": 2, "torneo": "Apertura 2023",   "temporada": "2023"},
    {"id": "gol-ap23-07", "nombre": "Diego Gómez",           "club_id": "libertad",        "goles": 7,  "asistencias": 4, "torneo": "Apertura 2023",   "temporada": "2023"},
    {"id": "gol-ap23-08", "nombre": "Gustavo Aguilar",       "club_id": "nacional",        "goles": 7,  "asistencias": 1, "torneo": "Apertura 2023",   "temporada": "2023"},
    {"id": "gol-ap23-09", "nombre": "Juan Lucero",           "club_id": "general-caballero", "goles": 6, "asistencias": 3, "torneo": "Apertura 2023",  "temporada": "2023"},
    {"id": "gol-ap23-10", "nombre": "Lorenzo Melgarejo",     "club_id": "libertad",        "goles": 5,  "asistencias": 5, "torneo": "Apertura 2023",   "temporada": "2023"},
    {"id": "gol-ap23-11", "nombre": "Iván Franco",           "club_id": "sol-de-america",  "goles": 5,  "asistencias": 2, "torneo": "Apertura 2023",   "temporada": "2023"},
    {"id": "gol-ap23-12", "nombre": "Mathías Espinoza",      "club_id": "guarani",         "goles": 4,  "asistencias": 3, "torneo": "Apertura 2023",   "temporada": "2023"},
    {"id": "gol-ap23-13", "nombre": "Richard Ortiz",         "club_id": "nacional",        "goles": 4,  "asistencias": 4, "torneo": "Apertura 2023",   "temporada": "2023"},
    {"id": "gol-ap23-14", "nombre": "Willian Benítez",       "club_id": "trinidense",      "goles": 3,  "asistencias": 2, "torneo": "Apertura 2023",   "temporada": "2023"},
    {"id": "gol-ap23-15", "nombre": "Héctor Villalba",       "club_id": "san-lorenzo",     "goles": 3,  "asistencias": 1, "torneo": "Apertura 2023",   "temporada": "2023"},
]


async def seed_goleadores():
    """Inserta goleadores idempotentemente — actualiza si ya existe, crea si no."""
    async with async_session() as db:
        count_new = 0
        count_upd = 0

        for item in TORNEOS_DATA:
            existing = await db.execute(
                select(Goleador).where(Goleador.id == item["id"])
            )
            g = existing.scalar_one_or_none()

            if g:
                changed = False
                for field in ("nombre", "club_id", "goles", "asistencias", "torneo", "temporada"):
                    if getattr(g, field) != item[field]:
                        setattr(g, field, item[field])
                        changed = True
                if changed:
                    count_upd += 1
                continue

            db.add(Goleador(
                id=item["id"],
                nombre=item["nombre"],
                club_id=item["club_id"],
                goles=item["goles"],
                asistencias=item["asistencias"],
                torneo=item["torneo"],
                temporada=item["temporada"],
            ))
            count_new += 1

        await db.commit()

        # Resumen
        torneos = sorted(set(d["torneo"] for d in TORNEOS_DATA))
        print(f"\n{'='*55}")
        print(f"  SEED GOLEADORES — {len(TORNEOS_DATA)} registros")
        print(f"{'='*55}")
        print(f"  Nuevos:  {count_new}")
        print(f"  Actualizados: {count_upd}")
        print(f"  Torneos: {len(torneos)}")
        for t in torneos:
            n = sum(1 for d in TORNEOS_DATA if d["torneo"] == t)
            print(f"    • {t} ({n} goleadores)")
        print(f"{'='*55}\n")


if __name__ == "__main__":
    asyncio.run(seed_goleadores())
