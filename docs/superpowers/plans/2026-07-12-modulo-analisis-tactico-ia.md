# Módulo de Análisis Táctico IA - Plan de Implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar un módulo de análisis táctico interactivo con campo 2D, estadísticas avanzadas (xG, posesión, etc.), y tendencias de IA para la liga paraguaya.

**Arquitectura:** Backend FastAPI con datos mock realistas + scraping futuro de FBref/SofaScore. Frontend Next.js con campo interactivo CSS/SVG, paneles de stats, y hooks de datos.

**Tech Stack:** Python 3.11+, FastAPI, SQLAlchemy, aiohttp, Next.js 14+, React, Tailwind CSS, @tanstack/react-query

---

## Archivos a Crear

### Backend
- `backend/app/api/tactico.py` — Router de endpoints tácticos
- `backend/app/services/tactico_service.py` — Servicio de datos tácticos
- `backend/app/schemas/tactico.py` — Modelos Pydantic
- `backend/tests/test_tactico.py` — Tests del endpoint

### Frontend
- `frontend/src/app/tactico/page.tsx` — Dashboard principal
- `frontend/src/app/tactico/[equipo]/page.tsx` — Análisis por equipo
- `frontend/src/app/tactico/[partido]/page.tsx` — Análisis por partido
- `frontend/src/components/tactico/TacticalField.tsx` — Campo interactivo 2D
- `frontend/src/components/tactico/PlayerDot.tsx` — Jugador en el campo
- `frontend/src/components/tactico/FormationSelector.tsx` — Selector de formación
- `frontend/src/components/tactico/StatsPanel.tsx` — Panel de estadísticas
- `frontend/src/components/tactico/StatCard.tsx` — Tarjeta individual de stat
- `frontend/src/components/tactico/InsightsPanel.tsx` — Panel de tendencias IA
- `frontend/src/components/tactico/InsightCard.tsx` — Tarjeta individual de insight
- `frontend/src/components/tactico/MatchAnalysis.tsx` — Análisis completo de partido
- `frontend/src/hooks/useTactico.ts` — Hook para datos de equipo
- `frontend/src/hooks/useTacticoPartido.ts` — Hook para datos de partido

## Archivos a Modificar

- `backend/app/main.py:50-60` — Agregar router de tactico
- `frontend/src/lib/api.ts` — Agregar funciones API
- `frontend/src/types/index.ts` — Agregar tipos TypeScript
- `frontend/src/components/sidebar/index.tsx` — Agregar enlace de navegación

---

## Task 1: Modelos Pydantic del Backend

**Files:**
- Create: `backend/app/schemas/tactico.py`
- Test: `backend/tests/test_tactico.py`

**Interfaces:**
- Consumes: None (primer task)
- Produces: `EstadisticasEquipo`, `EstadisticasPartido`, `JugadorTactico`, `InsightTactico`

- [ ] **Step 1: Crear el archivo de schemas**

```python
# backend/app/schemas/tactico.py
from pydantic import BaseModel


class JugadorTactico(BaseModel):
    id: str
    nombre: str
    posicion: str
    numero: int
    rating: float
    x: float  # Posición en el campo (0-1)
    y: float  # Posición en el campo (0-1)


class EstadisticasEquipo(BaseModel):
    xg: float
    posesion: float
    tiros_puerta: float
    pases_completados: float
    duelos_ganados: float
    corners: float


class InsightTactico(BaseModel):
    icono: str
    texto: str
    metrica: str | None = None


class PartidoResumen(BaseModel):
    fecha: str
    rival: str
    resultado: str
    formacion: str


class EquipoTactico(BaseModel):
    equipo_id: str
    nombre: str
    escudo: str
    formacion_principal: str
    formaciones_disponibles: list[str]
    jugadores: list[JugadorTactico]
    stats: EstadisticasEquipo
    tendencias: list[InsightTactico]
    ultimos_partidos: list[PartidoResumen]


class EquipoPartidoTactico(BaseModel):
    equipo_id: str
    nombre: str
    formacion: str
    jugadores: list[JugadorTactico]


class StatsComparativa(BaseModel):
    local: EstadisticasEquipo
    visitante: EstadisticasEquipo


class PrediccionIA(BaseModel):
    gana_local: float
    empate: float
    gana_visitante: float
    confianza: str


class AnalisisPartido(BaseModel):
    partido_id: str
    local: EquipoPartidoTactico
    visitante: EquipoPartidoTactico
    stats: StatsComparativa
    prediccion_ia: PrediccionIA
```

- [ ] **Step 2: Crear test mínimo**

```python
# backend/tests/test_tactico.py
from fastapi.testclient import TestClient
from backend.app.main import app


client = TestClient(app)


def test_tactico_equipo_returns_200():
    response = client.get("/api/v1/tactico/equipo/cerro")
    assert response.status_code == 200


def test_tactico_equipo_returns_expected_fields():
    response = client.get("/api/v1/tactico/equipo/cerro")
    data = response.json()
    assert "equipo_id" in data
    assert "nombre" in data
    assert "formacion_principal" in data
    assert "jugadores" in data
    assert "stats" in data
    assert "tendencias" in data


def test_tactico_equipo_jugadores_count():
    response = client.get("/api/v1/tactico/equipo/cerro")
    data = response.json()
    assert len(data["jugadores"]) == 11


def test_tactico_equipo_stats_fields():
    response = client.get("/api/v1/tactico/equipo/cerro")
    stats = response.json()["stats"]
    required_fields = ["xg", "posesion", "tiros_puerta", "pases_completados", "duelos_ganados", "corners"]
    for field in required_fields:
        assert field in stats


def test_tactico_equipo_invalid_id_returns_404():
    response = client.get("/api/v1/tactico/equipo/equipo_inexistente")
    assert response.status_code == 404
```

- [ ] **Step 3: Ejecutar test para verificar que falla**

Run: `cd backend && python -m pytest tests/test_tactico.py -v`
Expected: FAIL con "ImportError" o "ModuleNotFoundError" (el endpoint no existe aún)

- [ ] **Step 4: Commit**

```bash
git add backend/app/schemas/tactico.py backend/tests/test_tactico.py
git commit -m "feat(tactico): add Pydantic schemas and failing tests"
```

---

## Task 2: Servicio de Datos Mock

**Files:**
- Create: `backend/app/services/tactico_service.py`
- Modify: None (servicio independiente)

**Interfaces:**
- Consumes: `schemas.tactico.EquipoTactico`, `schemas.tactico.AnalisisPartido`
- Produces: `TacticoService.get_equipo()`, `TacticoService.get_partido()`

- [ ] **Step 1: Crear el servicio con datos mock**

```python
# backend/app/services/tactico_service.py
from backend.app.schemas.tactico import (
    EquipoTactico,
    EquipoPartidoTactico,
    JugadorTactico,
    EstadisticasEquipo,
    InsightTactico,
    PartidoResumen,
    AnalisisPartido,
    StatsComparativa,
    PrediccionIA,
)


# Datos mock realistas para los 12 clubes de la liga paraguaya
EQUIPOS_MOCK = {
    "cerro": {
        "nombre": "Cerro Porteño",
        "escudo": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Escudo_del_Cerro_Porteño.svg/100px-Escudo_del_Cerro_Porteño.svg.png",
        "formacion_principal": "4-3-3",
        "formaciones_disponibles": ["4-3-3", "4-4-2", "3-5-2"],
        "jugadores": [
            JugadorTactico(id="cerro_1", nombre="Anthony Silva", posicion="POR", numero=1, rating=7.2, x=0.5, y=0.95),
            JugadorTactico(id="cerro_2", nombre="Jorge Moreira", posicion="LD", numero=2, rating=7.0, x=0.85, y=0.75),
            JugadorTactico(id="cerro_3", nombre="Juan Patiño", posicion="DFC", numero=3, rating=7.3, x=0.65, y=0.8),
            JugadorTactico(id="cerro_4", nombre="César Benítez", posicion="DFC", numero=4, rating=7.1, x=0.35, y=0.8),
            JugadorTactico(id="cerro_5", nombre="Ayrton Cougo", posicion="LI", numero=6, rating=6.9, x=0.15, y=0.75),
            JugadorTactico(id="cerro_6", nombre="Francisco da Costa", posicion="MCD", numero=5, rating=7.4, x=0.5, y=0.6),
            JugadorTactico(id="cerro_7", nombre="Ricardo Mazacote", posicion="MC", numero=8, rating=7.2, x=0.65, y=0.5),
            JugadorTactico(id="cerro_8", nombre="Lucas Barrios", posicion="MC", numero=10, rating=7.8, x=0.35, y=0.5),
            JugadorTactico(id="cerro_9", nombre="Robert Morales", posicion="ED", numero=7, rating=7.5, x=0.85, y=0.35),
            JugadorTactico(id="cerro_10", nombre="Juan Lucero", posicion="DC", numero=9, rating=7.9, x=0.5, y=0.25),
            JugadorTactico(id="cerro_11", nombre="Braian Samudio", posicion="EI", numero=11, rating=7.3, x=0.15, y=0.35),
        ],
        "stats": EstadisticasEquipo(xg=1.85, posesion=54.2, tiros_puerta=5.2, pases_completados=82.1, duelos_ganados=58.4, corners=6.1),
        "tendencias": [
            InsightTactico(icono="⚽", texto="Marca el 68% de sus goles en el segundo tiempo", metrica="68%"),
            InsightTactico(icono="🔥", texto="Invicto en 8 partidos como local", metrica="8 partidos"),
            InsightTactico(icono="📊", texto="Mejor pressing alto de la liga: recupera en 4.2s", metrica="4.2s"),
        ],
        "ultimos_partidos": [
            PartidoResumen(fecha="2026-07-10", rival="Olimpia", resultado="2-1", formacion="4-3-3"),
            PartidoResumen(fecha="2026-07-05", rival="Libertad", resultado="1-0", formacion="4-3-3"),
            PartidoResumen(fecha="2026-06-28", rival="Guaraní", resultado="3-2", formacion="4-4-2"),
        ],
    },
    "olimpi": {
        "nombre": "Olimpia",
        "escudo": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6a/Escudo_del_Club_Olimpia.svg/100px-Escudo_del_Club_Olimpia.svg.png",
        "formacion_principal": "4-4-2",
        "formaciones_disponibles": ["4-4-2", "4-3-3", "3-4-3"],
        "jugadores": [
            JugadorTactico(id="olimpi_1", nombre="Gastón Guruceaga", posicion="POR", numero=1, rating=7.0, x=0.5, y=0.95),
            JugadorTactico(id="olimpi_2", nombre="Fernando Amorebieta", posicion="LD", numero=2, rating=7.1, x=0.85, y=0.75),
            JugadorTactico(id="olimpi_3", nombre="David Mendieta", posicion="DFC", numero=3, rating=7.2, x=0.65, y=0.8),
            JugadorTactico(id="olimpi_4", nombre="Julio César Casserres", posicion="DFC", numero=4, rating=7.0, x=0.35, y=0.8),
            JugadorTactico(id="olimpi_5", nombre="Blas Riveros", posicion="LI", numero=6, rating=7.3, x=0.15, y=0.75),
            JugadorTactico(id="olimpi_6", nombre="Marcos Gamarra", posicion="MC", numero=5, rating=7.1, x=0.7, y=0.55),
            JugadorTactico(id="olimpi_7", nombre="Jorge Recalde", posicion="MD", numero=8, rating=7.0, x=0.5, y=0.6),
            JugadorTactico(id="olimpi_8", nombre="Derlis González", posicion="MI", numero=10, rating=7.6, x=0.3, y=0.55),
            JugadorTactico(id="olimpi_9", nombre="Rodrigo Amaral", posicion="MD", numero=7, rating=7.4, x=0.85, y=0.4),
            JugadorTactico(id="olimpi_10", nombre="Bruno Valdez", posicion="DC", numero=9, rating=7.7, x=0.55, y=0.25),
            JugadorTactico(id="olimpi_11", nombre="William Mendieta", posicion="MI", numero=11, rating=7.2, x=0.15, y=0.4),
        ],
        "stats": EstadisticasEquipo(xg=1.62, posesion=51.8, tiros_puerta=4.8, pases_completados=79.5, duelos_ganados=55.2, corners=5.4),
        "tendencias": [
            InsightTactico(icono="📈", texto="Marca el 62% de sus goles en el primer tiempo", metrica="62%"),
            InsightTactico(icono="🏟️", texto="No pierde en 5 visitas consecutivas", metrica="5 partidos"),
            InsightTactico(icono="🎯", texto="Promedia 2.1 goles por partido en últimos 10", metrica="2.1 goles"),
        ],
        "ultimos_partidos": [
            PartidoResumen(fecha="2026-07-10", rival="Cerro", resultado="1-2", formacion="4-4-2"),
            PartidoResumen(fecha="2026-07-03", rival="Nacional", resultado="3-0", formacion="4-4-2"),
            PartidoResumen(fecha="2026-06-29", rival="Cerro", resultado="0-0", formacion="4-3-3"),
        ],
    },
    "libert": {
        "nombre": "Libertad",
        "escudo": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Escudo_del_Club_Libertad.svg/100px-Escudo_del_Club_Libertad.svg.png",
        "formacion_principal": "4-2-3-1",
        "formaciones_disponibles": ["4-2-3-1", "4-3-3", "4-4-1-1"],
        "jugadores": [
            JugadorTactico(id="libert_1", nombre="Martín Silva", posicion="POR", numero=1, rating=7.3, x=0.5, y=0.95),
            JugadorTactico(id="libert_2", nombre="Iván Piris", posicion="LD", numero=2, rating=7.0, x=0.85, y=0.75),
            JugadorTactico(id="libert_3", nombre="Paulo da Silva", posicion="DFC", numero=3, rating=7.5, x=0.65, y=0.8),
            JugadorTactico(id="libert_4", nombre="Diego Viera", posicion="DFC", numero=4, rating=7.2, x=0.35, y=0.8),
            JugadorTactico(id="libert_5", nombre="Santiago Arzamendia", posicion="LI", numero=6, rating=7.1, x=0.15, y=0.75),
            JugadorTactico(id="libert_6", nombre="Lucas Sanabria", posicion="MCD", numero=5, rating=7.0, x=0.5, y=0.6),
            JugadorTactico(id="libert_7", nombre="Matías Espinoza", posicion="MCD", numero=8, rating=7.1, x=0.5, y=0.55),
            JugadorTactico(id="libert_8", nombre="Óscar Ruiz", posicion="MCO", numero=10, rating=7.6, x=0.5, y=0.4),
            JugadorTactico(id="libert_9", nombre="Néstor Camacho", posicion="MD", numero=7, rating=7.3, x=0.85, y=0.35),
            JugadorTactico(id="libert_10", nombre="Luis Amarilla", posicion="DC", numero=9, rating=7.8, x=0.5, y=0.2),
            JugadorTactico(id="libert_11", nombre="Óscar Caceres", posicion="MI", numero=11, rating=7.2, x=0.15, y=0.35),
        ],
        "stats": EstadisticasEquipo(xg=1.92, posesion=56.3, tiros_puerta=5.8, pases_completados=84.2, duelos_ganados=60.1, corners=6.8),
        "tendencias": [
            InsightTactico(icono="🏆", texto="Líder de la tabla con 35 puntos", metrica="1ro"),
            InsightTactico(icono="🔥", texto="12 victorias en 15 partidos (80%)", metrica="80%"),
            InsightTactico(icono="⚽", texto="Mejor ataque: 2.4 goles por partido", metrica="2.4 goles"),
        ],
        "ultimos_partidos": [
            PartidoResumen(fecha="2026-07-09", rival="Guaraní", resultado="2-0", formacion="4-2-3-1"),
            PartidoResumen(fecha="2026-07-05", rival="Cerro", resultado="0-1", formacion="4-2-3-1"),
            PartidoResumen(fecha="2026-06-30", rival="Sportivo Luqueño", resultado="3-1", formacion="4-3-3"),
        ],
    },
    "guaran": {
        "nombre": "Guaraní",
        "escudo": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Escudo_del_Club_Guaran%C3%AD.svg/100px-Escudo_del_Club_Guaran%C3%AD.svg.png",
        "formacion_principal": "4-3-3",
        "formaciones_disponibles": ["4-3-3", "4-4-2"],
        "jugadores": [
            JugadorTactico(id="guaran_1", nombre="Pedro Fernández", posicion="POR", numero=1, rating=7.1, x=0.5, y=0.95),
            JugadorTactico(id="guaran_2", nombre="Marcelo Torales", posicion="LD", numero=2, rating=6.9, x=0.85, y=0.75),
            JugadorTactico(id="guaran_3", nombre="Enzo Giménez", posicion="DFC", numero=3, rating=7.0, x=0.65, y=0.8),
            JugadorTactico(id="guaran_4", nombre="Luis Fariña", posicion="DFC", numero=4, rating=6.8, x=0.35, y=0.8),
            JugadorTactico(id="guaran_5", nombre="Alfredo Aguilar", posicion="LI", numero=6, rating=7.0, x=0.15, y=0.75),
            JugadorTactico(id="guaran_6", nombre="Jorge Mendoza", posicion="MC", numero=5, rating=7.2, x=0.5, y=0.6),
            JugadorTactico(id="guaran_7", nombre="Richard Prieto", posicion="MC", numero=8, rating=7.1, x=0.65, y=0.55),
            JugadorTactico(id="guaran_8", nombre="Fernando Fernández", posicion="MC", numero=10, rating=7.4, x=0.35, y=0.55),
            JugadorTactico(id="guaran_9", nombre="Thomas Gamarra", posicion="ED", numero=7, rating=7.2, x=0.85, y=0.35),
            JugadorTactico(id="guaran_10", nombre="Cecilio Domínguez", posicion="DC", numero=9, rating=7.6, x=0.5, y=0.25),
            JugadorTactico(id="guaran_11", nombre="Rodrigo Fleitas", posicion="EI", numero=11, rating=7.0, x=0.15, y=0.35),
        ],
        "stats": EstadisticasEquipo(xg=1.45, posesion=48.5, tiros_puerta=4.2, pases_completados=76.8, duelos_ganados=52.3, corners=4.9),
        "tendencias": [
            InsightTactico(icono="💪", texto="Gana el 70% de duelos aéreos", metrica="70%"),
            InsightTactico(icono="🎯", texto="Cecilio Domínguez: goleador con 8 tantos", metrica="8 goles"),
            InsightTactico(icono="📊", texto="Promedia 4.2 tiros a puerta por partido", metrica="4.2 tiros"),
        ],
        "ultimos_partidos": [
            PartidoResumen(fecha="2026-07-09", rival="Libertad", resultado="0-2", formacion="4-3-3"),
            PartidoResumen(fecha="2026-07-02", rival="Nacional", resultado="2-1", formacion="4-3-3"),
            PartidoResumen(fecha="2026-06-28", rival="Cerro", resultado="2-3", formacion="4-4-2"),
        ],
    },
    "nacion": {
        "nombre": "Nacional",
        "escudo": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Escudo_del_Club_Nacional.svg/100px-Escudo_del_Club_Nacional.svg.png",
        "formacion_principal": "4-4-2",
        "formaciones_disponibles": ["4-4-2", "4-3-3", "5-3-2"],
        "jugadores": [
            JugadorTactico(id="nacion_1", nombre="Rodrigo Muñoz", posicion="POR", numero=1, rating=7.4, x=0.5, y=0.95),
            JugadorTactico(id="nacion_2", nombre="Carlos Bonet", posicion="LD", numero=2, rating=7.0, x=0.85, y=0.75),
            JugadorTactico(id="nacion_3", nombre="Alberto Contreras", posicion="DFC", numero=3, rating=7.2, x=0.65, y=0.8),
            JugadorTactico(id="nacion_4", nombre="Marcelo Peralta", posicion="DFC", numero=4, rating=7.1, x=0.35, y=0.8),
            JugadorTactico(id="nacion_5", nombre="Fernando Benítez", posicion="LI", numero=6, rating=6.9, x=0.15, y=0.75),
            JugadorTactico(id="nacion_6", nombre="Hugo Fernández", posicion="MC", numero=5, rating=7.3, x=0.7, y=0.55),
            JugadorTactico(id="nacion_7", nombre="Guido Vinti", posicion="MC", numero=8, rating=7.0, x=0.3, y=0.55),
            JugadorTactico(id="nacion_8", nombre="Alejandro Paiva", posicion="MD", numero=7, rating=7.2, x=0.85, y=0.4),
            JugadorTactico(id="nacion_9", nombre="Julio Irrazábal", posicion="MI", numero=11, rating=7.1, x=0.15, y=0.4),
            JugadorTactico(id="nacion_10", nombre="Tomás Caceres", posicion="DC", numero=9, rating=7.5, x=0.55, y=0.25),
            JugadorTactico(id="nacion_11", nombre="Adrián Martínez", posicion="DC", numero=10, rating=7.3, x=0.45, y=0.25),
        ],
        "stats": EstadisticasEquipo(xg=1.38, posesion=47.2, tiros_puerta=4.0, pases_completados=75.3, duelos_ganados=54.8, corners=4.5),
        "tendencias": [
            InsightTactico(icono="🛡️", texto="Defensa sólida: solo 0.8 goles recibidos por partido", metrica="0.8 goles"),
            InsightTactico(icono="⚡", texto="Contragolpe letal: 45% de sus goles son de contra", metrica="45%"),
            InsightTactico(icono="🏟️", texto="Invicto en 4 partidos en el Arsenio Erico", metrica="4 partidos"),
        ],
        "ultimos_partidos": [
            PartidoResumen(fecha="2026-07-03", rival="Olimpia", resultado="0-3", formacion="4-4-2"),
            PartidoResumen(fecha="2026-07-02", rival="Guaraní", resultado="1-2", formacion="4-4-2"),
            PartidoResumen(fecha="2026-06-25", rival="Sportivo Luqueño", resultado="1-0", formacion="5-3-2"),
        ],
    },
    "spoluq": {
        "nombre": "Sportivo Luqueño",
        "escudo": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Escudo_del_Sportivo_Luque%C3%B1o.svg/100px-Escudo_del_Sportivo_Luque%C3%B1o.svg.png",
        "formacion_principal": "4-3-3",
        "formaciones_disponibles": ["4-3-3", "4-4-2"],
        "jugadores": [
            JugadorTactico(id="spoluq_1", nombre="Diego Barreto", posicion="POR", numero=1, rating=6.9, x=0.5, y=0.95),
            JugadorTactico(id="spoluq_2", nombre="Héctor Villalba", posicion="LD", numero=2, rating=7.0, x=0.85, y=0.75),
            JugadorTactico(id="spoluq_3", nombre="Pedro Sarabia", posicion="DFC", numero=3, rating=7.1, x=0.65, y=0.8),
            JugadorTactico(id="spoluq_4", nombre="Walter Bogado", posicion="DFC", numero=4, rating=6.8, x=0.35, y=0.8),
            JugadorTactico(id="spoluq_5", nombre="Fabián Caballero", posicion="LI", numero=6, rating=6.7, x=0.15, y=0.75),
            JugadorTactico(id="spoluq_6", nombre="Osvaldo Hinzpeter", posicion="MC", numero=5, rating=7.0, x=0.5, y=0.6),
            JugadorTactico(id="spoluq_7", nombre="Matías Vera", posicion="MC", numero=8, rating=7.2, x=0.65, y=0.55),
            JugadorTactico(id="spoluq_8", nombre="David Mendoza", posicion="MC", numero=10, rating=7.3, x=0.35, y=0.55),
            JugadorTactico(id="spoluq_9", nombre="Basilio Florentín", posicion="ED", numero=7, rating=7.1, x=0.85, y=0.35),
            JugadorTactico(id="spoluq_10", nombre="Nelson Haedo Parra", posicion="DC", numero=9, rating=7.4, x=0.5, y=0.25),
            JugadorTactico(id="spoluq_11", nombre="Luis Ovelar", posicion="EI", numero=11, rating=6.9, x=0.15, y=0.35),
        ],
        "stats": EstadisticasEquipo(xg=1.32, posesion=46.8, tiros_puerta=3.9, pases_completados=74.2, duelos_ganados=51.5, corners=4.2),
        "tendencias": [
            InsightTactico(icono="📈", texto="Mejoría notable: 4 victorias en últimos 6", metrica="4 victorias"),
            InsightTactico(icono="🎯", texto="Nelson Haedo Parra: 6 goles en temporada", metrica="6 goles"),
            InsightTactico(icono="🏟️", texto="Récord de asistencia: 12,000 vs Olimpia", metrica="12k"),
        ],
        "ultimos_partidos": [
            PartidoResumen(fecha="2026-07-06", rival="General Díaz", resultado="2-0", formacion="4-3-3"),
            PartidoResumen(fecha="2026-06-30", rival="Libertad", resultado="1-3", formacion="4-3-3"),
            PartidoResumen(fecha="2026-06-25", rival="Nacional", resultado="0-1", formacion="4-4-2"),
        ],
    },
    "gendi": {
        "nombre": "General Díaz",
        "escudo": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Escudo_del_General_D%C3%ADaz.svg/100px-Escudo_del_General_D%C3%ADaz.svg.png",
        "formacion_principal": "5-3-2",
        "formaciones_disponibles": ["5-3-2", "4-4-2", "3-5-2"],
        "jugadores": [
            JugadorTactico(id="gendi_1", nombre="Alfredo Aguilar", posicion="POR", numero=1, rating=7.0, x=0.5, y=0.95),
            JugadorTactico(id="gendi_2", nombre="Juan Aguilar", posicion="DFD", numero=2, rating=6.8, x=0.9, y=0.75),
            JugadorTactico(id="gendi_3", nombre="Marcos Caceres", posicion="DFC", numero=3, rating=7.1, x=0.7, y=0.8),
            JugadorTactico(id="gendi_4", nombre="Paulo Carvallo", posicion="DFC", numero=4, rating=7.0, x=0.5, y=0.82),
            JugadorTactico(id="gendi_5", nombre="Julio Baez", posicion="DFC", numero=5, rating=6.9, x=0.3, y=0.8),
            JugadorTactico(id="gendi_6", nombre="Sergio Aquino", posicion="DFI", numero=6, rating=6.7, x=0.1, y=0.75),
            JugadorTactico(id="gendi_7", nombre="Mauro Bogado", posicion="MC", numero=7, rating=7.0, x=0.65, y=0.55),
            JugadorTactico(id="gendi_8", nombre="Jorge González", posicion="MC", numero=8, rating=6.9, x=0.5, y=0.6),
            JugadorTactico(id="gendi_9", nombre="Cristian Sosa", posicion="MC", numero=10, rating=7.1, x=0.35, y=0.55),
            JugadorTactico(id="gendi_10", nombre="Franco Vera", posicion="DC", numero=9, rating=7.3, x=0.55, y=0.25),
            JugadorTactico(id="gendi_11", nombre="Arnaldo Castillo", posicion="DC", numero=11, rating=7.2, x=0.45, y=0.25),
        ],
        "stats": EstadisticasEquipo(xg=1.15, posesion=44.5, tiros_puerta=3.5, pases_completados=72.8, duelos_ganados=53.2, corners=3.8),
        "tendencias": [
            InsightTactico(icono="🛡️", texto="Defensa impenetrable: 0.6 goles recibidos por partido", metrica="0.6 goles"),
            InsightTactico(icono="⚔️", texto="Duo letal: Franco Vera y Arnoldo Castillo suman 12 goles", metrica="12 goles"),
            InsightTactico(icono="📊", texto="Promedia 5.2 duelos ganados por jugador", metrica="5.2"),
        ],
        "ultimos_partidos": [
            PartidoResumen(fecha="2026-07-06", rival="Sportivo Luqueño", resultado="0-2", formacion="5-3-2"),
            PartidoResumen(fecha="2026-06-29", rival="Deportivo Capiatá", resultado="1-1", formacion="5-3-2"),
            PartidoResumen(fecha="2026-06-22", rival="Sol de América", resultado="2-0", formacion="4-4-2"),
        ],
    },
    "depcai": {
        "nombre": "Deportivo Capiatá",
        "escudo": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Escudo_del_Deportivo_Capiat%C3%A1.svg/100px-Escudo_del_Deportivo_Capiat%C3%A1.svg.png",
        "formacion_principal": "4-4-2",
        "formaciones_disponibles": ["4-4-2", "4-3-3"],
        "jugadores": [
            JugadorTactico(id="depcai_1", nombre="Carlos Servín", posicion="POR", numero=1, rating=6.8, x=0.5, y=0.95),
            JugadorTactico(id="depcai_2", nombre="Alexis Villalba", posicion="LD", numero=2, rating=6.7, x=0.85, y=0.75),
            JugadorTactico(id="depcai_3", nombre="Oscar Benítez", posicion="DFC", numero=3, rating=6.9, x=0.65, y=0.8),
            JugadorTactico(id="depcai_4", nombre="Francisco Franco", posicion="DFC", numero=4, rating=6.8, x=0.35, y=0.8),
            JugadorTactico(id="depcai_5", nombre="Jorge Paredes", posicion="LI", numero=6, rating=6.6, x=0.15, y=0.75),
            JugadorTactico(id="depcai_6", nombre="Paulo Santos", posicion="MC", numero=5, rating=6.9, x=0.7, y=0.55),
            JugadorTactico(id="depcai_7", nombre="Luis de la Cruz", posicion="MC", numero=8, rating=6.8, x=0.3, y=0.55),
            JugadorTactico(id="depcai_8", nombre="Fernando Battiste", posicion="MD", numero=7, rating=7.0, x=0.85, y=0.4),
            JugadorTactico(id="depcai_9", nombre="Brian Montenegro", posicion="MI", numero=11, rating=7.1, x=0.15, y=0.4),
            JugadorTactico(id="depcai_10", nombre="Richard Salcedo", posicion="DC", numero=9, rating=7.2, x=0.55, y=0.25),
            JugadorTactico(id="depcai_11", nombre="Víctor Ávalos", posicion="DC", numero=10, rating=7.0, x=0.45, y=0.25),
        ],
        "stats": EstadisticasEquipo(xg=1.22, posesion=45.8, tiros_puerta=3.8, pases_completados=73.5, duelos_ganados=50.8, corners=4.0),
        "tendencias": [
            InsightTactico(icono="⚡", texto="Rápida transición: promedia 3.2 segundos de contra", metrica="3.2s"),
            InsightTactico(icono="🎯", texto="Richard Salcedo: 5 goles en últimos 8 partidos", metrica="5 goles"),
            InsightTactico(icono="📊", texto="Mejor porcentaje de duelos aéreos: 62%", metrica="62%"),
        ],
        "ultimos_partidos": [
            PartidoResumen(fecha="2026-06-29", rival="General Díaz", resultado="1-1", formacion="4-4-2"),
            PartidoResumen(fecha="2026-06-22", rival="Nacional", resultado="0-2", formacion="4-4-2"),
            PartidoResumen(fecha="2026-06-15", rival="3 de Febrero", resultado="2-1", formacion="4-3-3"),
        ],
    },
    "trifeb": {
        "nombre": "3 de Febrero",
        "escudo": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Escudo_del_3_de_Febrero.svg/100px-Escudo_del_3_de_Febrero.svg.png",
        "formacion_principal": "4-3-3",
        "formaciones_disponibles": ["4-3-3", "4-4-2", "3-4-3"],
        "jugadores": [
            JugadorTactico(id="trifeb_1", nombre="José Caravali", posicion="POR", numero=1, rating=6.7, x=0.5, y=0.95),
            JugadorTactico(id="trifeb_2", nombre="Pedro Riveros", posicion="LD", numero=2, rating=6.6, x=0.85, y=0.75),
            JugadorTactico(id="trifeb_3", nombre="Rodrigo López", posicion="DFC", numero=3, rating=6.8, x=0.65, y=0.8),
            JugadorTactico(id="trifeb_4", nombre="Marcos Duré", posicion="DFC", numero=4, rating=6.7, x=0.35, y=0.8),
            JugadorTactico(id="trifeb_5", nombre="Juan Torales", posicion="LI", numero=6, rating=6.5, x=0.15, y=0.75),
            JugadorTactico(id="trifeb_6", nombre="Carlos González", posicion="MCD", numero=5, rating=6.9, x=0.5, y=0.6),
            JugadorTactico(id="trifeb_7", nombre="Hernán López", posicion="MC", numero=8, rating=7.0, x=0.65, y=0.55),
            JugadorTactico(id="trifeb_8", nombre="Matías Barreto", posicion="MC", numero=10, rating=7.1, x=0.35, y=0.55),
            JugadorTactico(id="trifeb_9", nombre="Santiago Salcedo", posicion="ED", numero=7, rating=7.3, x=0.85, y=0.35),
            JugadorTactico(id="trifeb_10", nombre="Enrique Díaz", posicion="DC", numero=9, rating=7.0, x=0.5, y=0.25),
            JugadorTactico(id="trifeb_11", nombre="Bautista Merlini", posicion="EI", numero=11, rating=6.8, x=0.15, y=0.35),
        ],
        "stats": EstadisticasEquipo(xg=1.08, posesion=43.2, tiros_puerta=3.2, pases_completados=71.5, duelos_ganados=49.2, corners=3.5),
        "tendencias": [
            InsightTactico(icono="🌟", texto="Santiago Salcedo: ídolo con 150+ goles en su carrera", metrica="150+ goles"),
            InsightTactico(icono="📊", texto="Promedio más bajo de la liga: 1.08 xG", metrica="1.08 xG"),
            InsightTactico(icono="💪", texto="Lucha por la permanencia: 3 victorias en últimos 10", metrica="3 victorias"),
        ],
        "ultimos_partidos": [
            PartidoResumen(fecha="2026-06-22", rival="Sol de América", resultado="1-0", formacion="4-3-3"),
            PartidoResumen(fecha="2026-06-15", rival="Deportivo Capiatá", resultado="1-2", formacion="4-3-3"),
            PartidoResumen(fecha="2026-06-08", rival="Sportivo Ameliano", resultado="0-1", formacion="4-4-2"),
        ],
    },
    "solame": {
        "nombre": "Sol de América",
        "escudo": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Escudo_del_Sol_de_Am%C3%A9rica.svg/100px-Escudo_del_Sol_de_Am%C3%A9rica.svg.png",
        "formacion_principal": "4-4-2",
        "formaciones_disponibles": ["4-4-2", "4-3-3", "5-3-2"],
        "jugadores": [
            JugadorTactico(id="solame_1", nombre="Roberto Ramírez", posicion="POR", numero=1, rating=6.6, x=0.5, y=0.95),
            JugadorTactico(id="solame_2", nombre="Dante López", posicion="LD", numero=2, rating=6.5, x=0.85, y=0.75),
            JugadorTactico(id="solame_3", nombre="Manuel Balbuena", posicion="DFC", numero=3, rating=6.7, x=0.65, y=0.8),
            JugadorTactico(id="solame_4", nombre="Eduardo Aranda", posicion="DFC", numero=4, rating=6.6, x=0.35, y=0.8),
            JugadorTactico(id="solame_5", nombre="Marcelo Paredes", posicion="LI", numero=6, rating=6.4, x=0.15, y=0.75),
            JugadorTactico(id="solame_6", nombre="Ángel Ruiz", posicion="MC", numero=5, rating=6.8, x=0.7, y=0.55),
            JugadorTactico(id="solame_7", nombre="Jorge Scolari", posicion="MC", numero=8, rating=6.7, x=0.3, y=0.55),
            JugadorTactico(id="solame_8", nombre="Lucas Barrios Jr", posicion="MD", numero=7, rating=6.9, x=0.85, y=0.4),
            JugadorTactico(id="solame_9", nombre="Fernando Arias", posicion="MI", numero=11, rating=6.8, x=0.15, y=0.4),
            JugadorTactico(id="solame_10", nombre="Cristian Riveros", posicion="DC", numero=9, rating=7.1, x=0.55, y=0.25),
            JugadorTactico(id="solame_11", nombre="José Ortigoza", posicion="DC", numero=10, rating=7.3, x=0.45, y=0.25),
        ],
        "stats": EstadisticasEquipo(xg=1.18, posesion=46.2, tiros_puerta=3.6, pases_completados=74.0, duelos_ganados=51.0, corners=4.1),
        "tendencias": [
            InsightTactico(icono="🎯", texto="José Ortigoza: goleador histórico con 200+ tantos", metrica="200+ goles"),
            InsightTactico(icono="📊", texto="Balanced: ni muy atacante ni muy defensivo", metrica="Balanceado"),
            InsightTactico(icono="🏟️", texto="Buena racha en casa: 3 victorias en últimos 4", metrica="3 victorias"),
        ],
        "ultimos_partidos": [
            PartidoResumen(fecha="2026-06-22", rival="3 de Febrero", resultado="0-1", formacion="4-4-2"),
            PartidoResumen(fecha="2026-06-15", rival="General Díaz", resultado="0-2", formacion="4-4-2"),
            PartidoResumen(fecha="2026-06-08", rival="Nacional", resultado="1-1", formacion="4-3-3"),
        ],
    },
    "spamel": {
        "nombre": "Sportivo Ameliano",
        "escudo": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/57/Escudo_del_Sportivo_Ameliano.svg/100px-Escudo_del_Sportivo_Ameliano.svg.png",
        "formacion_principal": "4-3-3",
        "formaciones_disponibles": ["4-3-3", "4-4-2"],
        "jugadores": [
            JugadorTactico(id="spamel_1", nombre="Pedro Acuña", posicion="POR", numero=1, rating=6.7, x=0.5, y=0.95),
            JugadorTactico(id="spamel_2", nombre="Walter González", posicion="LD", numero=2, rating=6.6, x=0.85, y=0.75),
            JugadorTactico(id="spamel_3", nombre="Rodrigo Amaral", posicion="DFC", numero=3, rating=6.8, x=0.65, y=0.8),
            JugadorTactico(id="spamel_4", nombre="Fernando Fernández Jr", posicion="DFC", numero=4, rating=6.7, x=0.35, y=0.8),
            JugadorTactico(id="spamel_5", nombre="Néstor Camacho Jr", posicion="LI", numero=6, rating=6.5, x=0.15, y=0.75),
            JugadorTactico(id="spamel_6", nombre="Richard Prieto Jr", posicion="MC", numero=5, rating=6.9, x=0.5, y=0.6),
            JugadorTactico(id="spamel_7", nombre="Juan Iturbe", posicion="MC", numero=8, rating=7.2, x=0.65, y=0.55),
            JugadorTactico(id="spamel_8", nombre="Fabián Espinoza", posicion="MC", numero=10, rating=7.0, x=0.35, y=0.55),
            JugadorTactico(id="spamel_9", nombre="Alexis Domínguez", posicion="ED", numero=7, rating=6.8, x=0.85, y=0.35),
            JugadorTactico(id="spamel_10", nombre="Brian Giménez", posicion="DC", numero=9, rating=7.1, x=0.5, y=0.25),
            JugadorTactico(id="spamel_11", nombre="Cecilio Domínguez Jr", posicion="EI", numero=11, rating=6.9, x=0.15, y=0.35),
        ],
        "stats": EstadisticasEquipo(xg=1.25, posesion=47.5, tiros_puerta=4.0, pases_completados=75.2, duelos_ganados=52.8, corners=4.3),
        "tendencias": [
            InsightTactico(icono="🌟", texto="Juan Iturbe: ex-Paraguay con calidad sudamericana", metrica="7.2 rating"),
            InsightTactico(icono="⚡", texto="Juego ofensivo: promedia 4.0 tiros a puerta", metrica="4.0 tiros"),
            InsightTactico(icono="📊", texto="Mejor porcentaje de posesión vs rivales directos", metrica="48.5%"),
        ],
        "ultimos_partidos": [
            PartidoResumen(fecha="2026-06-08", rival="3 de Febrero", resultado="1-0", formacion="4-3-3"),
            PartidoResumen(fecha="2026-06-01", rival="Guaraní", resultado="1-2", formacion="4-3-3"),
            PartidoResumen(fecha="2026-05-25", rival="Deportivo Capiatá", resultado="0-0", formacion="4-4-2"),
        ],
    },
}


# Datos mock para análisis de partidos
PARTIDOS_MOCK = {
    "match_123": {
        "local": {
            "equipo_id": "cerro",
            "nombre": "Cerro Porteño",
            "formacion": "4-3-3",
            "jugadores": EQUIPOS_MOCK["cerro"]["jugadores"],
        },
        "visitante": {
            "equipo_id": "olimpi",
            "nombre": "Olimpia",
            "formacion": "4-4-2",
            "jugadores": EQUIPOS_MOCK["olimpi"]["jugadores"],
        },
        "stats": StatsComparativa(
            local=EQUIPOS_MOCK["cerro"]["stats"],
            visitante=EQUIPOS_MOCK["olimpi"]["stats"],
        ),
        "prediccion_ia": PrediccionIA(
            gana_local=0.45,
            empate=0.28,
            gana_visitante=0.27,
            confianza="media",
        ),
    },
    "match_124": {
        "local": {
            "equipo_id": "libert",
            "nombre": "Libertad",
            "formacion": "4-2-3-1",
            "jugadores": EQUIPOS_MOCK["libert"]["jugadores"],
        },
        "visitante": {
            "equipo_id": "guaran",
            "nombre": "Guaraní",
            "formacion": "4-3-3",
            "jugadores": EQUIPOS_MOCK["guaran"]["jugadores"],
        },
        "stats": StatsComparativa(
            local=EQUIPOS_MOCK["libert"]["stats"],
            visitante=EQUIPOS_MOCK["guaran"]["stats"],
        ),
        "prediccion_ia": PrediccionIA(
            gana_local=0.52,
            empate=0.25,
            gana_visitante=0.23,
            confianza="alta",
        ),
    },
}


class TacticoService:
    @staticmethod
    async def get_equipo(equipo_id: str) -> EquipoTactico | None:
        if equipo_id not in EQUIPOS_MOCK:
            return None
        data = EQUIPOS_MOCK[equipo_id]
        return EquipoTactico(
            equipo_id=equipo_id,
            nombre=data["nombre"],
            escudo=data["escudo"],
            formacion_principal=data["formacion_principal"],
            formaciones_disponibles=data["formaciones_disponibles"],
            jugadores=data["jugadores"],
            stats=data["stats"],
            tendencias=data["tendencias"],
            ultimos_partidos=data["ultimos_partidos"],
        )

    @staticmethod
    async def get_partido(partido_id: str) -> AnalisisPartido | None:
        if partido_id not in PARTIDOS_MOCK:
            return None
        data = PARTIDOS_MOCK[partido_id]
        return AnalisisPartido(
            partido_id=partido_id,
            local=EquipoPartidoTactico(**data["local"]),
            visitante=EquipoPartidoTactico(**data["visitante"]),
            stats=data["stats"],
            prediccion_ia=data["prediccion_ia"],
        )

    @staticmethod
    async def get_equipos_disponibles() -> list[dict]:
        return [
            {
                "id": eid,
                "nombre": data["nombre"],
                "escudo": data["escudo"],
                "formacion": data["formacion_principal"],
            }
            for eid, data in EQUIPOS_MOCK.items()
        ]
```

- [ ] **Step 2: Commit**

```bash
git add backend/app/services/tactico_service.py
git commit -m "feat(tactico): add mock data service for 12 Paraguayan clubs"
```

---

## Task 3: Endpoint del Backend

**Files:**
- Create: `backend/app/api/tactico.py`
- Modify: `backend/app/main.py:50-60`

**Interfaces:**
- Consumes: `TacticoService`, `schemas.tactico`
- Produces: `GET /api/v1/tactico/equipo/{equipo_id}`, `GET /api/v1/tactico/partido/{partido_id}`, `GET /api/v1/tactico/equipos`

- [ ] **Step 1: Crear el router**

```python
# backend/app/api/tactico.py
from fastapi import APIRouter, HTTPException

from backend.app.schemas.tactico import EquipoTactico, AnalisisPartido
from backend.app.services.tactico_service import TacticoService


router = APIRouter(prefix="/api/v1/tactico", tags=["tactico"])


@router.get("/equipos")
async def get_equipos():
    """Lista todos los equipos disponibles para análisis táctico."""
    return await TacticoService.get_equipos_disponibles()


@router.get("/equipo/{equipo_id}", response_model=EquipoTactico)
async def get_analisis_equipo(equipo_id: str):
    """Obtiene el análisis táctico completo de un equipo."""
    equipo = await TacticoService.get_equipo(equipo_id)
    if not equipo:
        raise HTTPException(status_code=404, detail=f"Equipo '{equipo_id}' no encontrado")
    return equipo


@router.get("/partido/{partido_id}", response_model=AnalisisPartido)
async def get_analisis_partido(partido_id: str):
    """Obtiene el análisis táctico de un partido específico."""
    partido = await TacticoService.get_partido(partido_id)
    if not partido:
        raise HTTPException(status_code=404, detail=f"Partido '{partido_id}' no encontrado")
    return partido
```

- [ ] **Step 2: Registrar el router en main.py**

```python
# backend/app/main.py
# Agregar después de la línea existente de otros routers
from backend.app.api.tactico import router as tactico_router

app.include_router(tactico_router)
```

- [ ] **Step 3: Ejecutar tests**

Run: `cd backend && python -m pytest tests/test_tactico.py -v`
Expected: PASS con 5 tests pasando

- [ ] **Step 4: Commit**

```bash
git add backend/app/api/tactico.py backend/app/main.py
git commit -m "feat(tactico): add tactical analysis endpoints"
```

---

## Task 4: Tipos TypeScript del Frontend

**Files:**
- Modify: `frontend/src/types/index.ts`
- Modify: `frontend/src/lib/api.ts`

**Interfaces:**
- Consumes: Backend endpoints existentes
- Produces: Tipos `EquipoTactico`, `AnalisisPartido`, `EstadisticasEquipo`, `InsightTactico`, funciones `getTacticoEquipo()`, `getTacticoPartido()`, `getTacticoEquipos()`

- [ ] **Step 1: Agregar tipos al archivo existente**

```typescript
// frontend/src/types/index.ts
// Agregar al final del archivo

export interface JugadorTactico {
  id: string;
  nombre: string;
  posicion: string;
  numero: number;
  rating: number;
  x: number;
  y: number;
}

export interface EstadisticasEquipo {
  xg: number;
  posesion: number;
  tiros_puerta: number;
  pases_completados: number;
  duelos_ganados: number;
  corners: number;
}

export interface InsightTactico {
  icono: string;
  texto: string;
  metrica: string | null;
}

export interface PartidoResumenTactico {
  fecha: string;
  rival: string;
  resultado: string;
  formacion: string;
}

export interface EquipoTactico {
  equipo_id: string;
  nombre: string;
  escudo: string;
  formacion_principal: string;
  formaciones_disponibles: string[];
  jugadores: JugadorTactico[];
  stats: EstadisticasEquipo;
  tendencias: InsightTactico[];
  ultimos_partidos: PartidoResumenTactico[];
}

export interface EquipoPartidoTactico {
  equipo_id: string;
  nombre: string;
  formacion: string;
  jugadores: JugadorTactico[];
}

export interface StatsComparativa {
  local: EstadisticasEquipo;
  visitante: EstadisticasEquipo;
}

export interface PrediccionIA {
  gana_local: number;
  empate: number;
  gana_visitante: number;
  confianza: string;
}

export interface AnalisisPartido {
  partido_id: string;
  local: EquipoPartidoTactico;
  visitante: EquipoPartidoTactico;
  stats: StatsComparativa;
  prediccion_ia: PrediccionIA;
}

export interface EquipoResumen {
  id: string;
  nombre: string;
  escudo: string;
  formacion: string;
}
```

- [ ] **Step 2: Agregar funciones API**

```typescript
// frontend/src/lib/api.ts
// Agregar al final del archivo

import type { EquipoTactico, AnalisisPartido, EquipoResumen } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function getTacticoEquipos(): Promise<EquipoResumen[]> {
  const res = await fetch(`${API_BASE}/api/v1/tactico/equipos`);
  if (!res.ok) throw new Error("Error al cargar equipos tácticos");
  return res.json();
}

export async function getTacticoEquipo(equipoId: string): Promise<EquipoTactico> {
  const res = await fetch(`${API_BASE}/api/v1/tactico/equipo/${equipoId}`);
  if (!res.ok) throw new Error("Error al cargar análisis táctico");
  return res.json();
}

export async function getTacticoPartido(partidoId: string): Promise<AnalisisPartido> {
  const res = await fetch(`${API_BASE}/api/v1/tactico/partido/${partidoId}`);
  if (!res.ok) throw new Error("Error al cargar análisis del partido");
  return res.json();
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/types/index.ts frontend/src/lib/api.ts
git commit -m "feat(tactico): add TypeScript types and API functions"
```

---

## Task 5: Componente TacticalField (Campo Interactivo)

**Files:**
- Create: `frontend/src/components/tactico/TacticalField.tsx`
- Create: `frontend/src/components/tactico/PlayerDot.tsx`
- Create: `frontend/src/components/tactico/FormationSelector.tsx`

**Interfaces:**
- Consumes: `JugadorTactico[]`, `formacion`, `formaciones_disponibles`
- Produces: Componente `TacticalField` renderizable

- [ ] **Step 1: Crear PlayerDot**

```tsx
// frontend/src/components/tactico/PlayerDot.tsx
"use client";

interface PlayerDotProps {
  id: string;
  nombre: string;
  posicion: string;
  numero: number;
  x: number;
  y: number;
  color: string;
  onClick?: (id: string) => void;
}

export default function PlayerDot({ nombre, posicion, numero, x, y, color, onClick }: PlayerDotProps) {
  return (
    <div
      className="absolute flex flex-col items-center cursor-pointer transition-all duration-300 hover:scale-110 group"
      style={{
        left: `${x * 100}%`,
        top: `${y * 100}%`,
        transform: "translate(-50%, -50%)",
      }}
      onClick={() => onClick?.(nombre)}
    >
      {/* Tooltip */}
      <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
        <div className="bg-black/90 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap shadow-xl">
          <div className="font-bold">{nombre}</div>
          <div className="text-gray-400">{posicion} • #{numero}</div>
        </div>
      </div>

      {/* Círculo del jugador */}
      <div
        className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg border-2 border-white/30"
        style={{ backgroundColor: color }}
      >
        {numero}
      </div>

      {/* Nombre abreviado */}
      <div className="text-[10px] text-white mt-1 bg-black/50 px-1 rounded">
        {nombre.split(" ").pop()}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Crear FormationSelector**

```tsx
// frontend/src/components/tactico/FormationSelector.tsx
"use client";

interface FormationSelectorProps {
  formaciones: string[];
  actual: string;
  onChange: (formacion: string) => void;
}

export default function FormationSelector({ formaciones, actual, onChange }: FormationSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-400">Formación:</span>
      <select
        value={actual}
        onChange={(e) => onChange(e.target.value)}
        className="bg-bg-terciario border border-borde-sutil text-white text-sm rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-apf-rojo"
      >
        {formaciones.map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>
    </div>
  );
}
```

- [ ] **Step 3: Crear TacticalField**

```tsx
// frontend/src/components/tactico/TacticalField.tsx
"use client";

import { useState } from "react";
import PlayerDot from "./PlayerDot";
import FormationSelector from "./FormationSelector";
import type { JugadorTactico } from "@/types";

interface TacticalFieldProps {
  jugadores: JugadorTactico[];
  formacionPrincipal: string;
  formacionesDisponibles: string[];
  colorLocal?: string;
  colorVisitante?: string;
  titulo?: string;
}

// Posiciones predefinidas para cada formación (simplificado)
const FORMACIONES_POSICIONES: Record<string, { x: number; y: number }[]> = {
  "4-3-3": [
    { x: 0.5, y: 0.95 },   // POR
    { x: 0.85, y: 0.75 },  // LD
    { x: 0.65, y: 0.8 },   // DFC
    { x: 0.35, y: 0.8 },   // DFC
    { x: 0.15, y: 0.75 },  // LI
    { x: 0.65, y: 0.55 },  // MC
    { x: 0.5, y: 0.6 },    // MC
    { x: 0.35, y: 0.55 },  // MC
    { x: 0.85, y: 0.35 },  // ED
    { x: 0.5, y: 0.25 },   // DC
    { x: 0.15, y: 0.35 },  // EI
  ],
  "4-4-2": [
    { x: 0.5, y: 0.95 },   // POR
    { x: 0.85, y: 0.75 },  // LD
    { x: 0.65, y: 0.8 },   // DFC
    { x: 0.35, y: 0.8 },   // DFC
    { x: 0.15, y: 0.75 },  // LI
    { x: 0.85, y: 0.5 },   // MD
    { x: 0.65, y: 0.55 },  // MC
    { x: 0.35, y: 0.55 },  // MC
    { x: 0.15, y: 0.5 },   // MI
    { x: 0.55, y: 0.25 },  // DC
    { x: 0.45, y: 0.25 },  // DC
  ],
  "4-2-3-1": [
    { x: 0.5, y: 0.95 },   // POR
    { x: 0.85, y: 0.75 },  // LD
    { x: 0.65, y: 0.8 },   // DFC
    { x: 0.35, y: 0.8 },   // DFC
    { x: 0.15, y: 0.75 },  // LI
    { x: 0.5, y: 0.6 },    // MCD
    { x: 0.5, y: 0.55 },   // MCD
    { x: 0.85, y: 0.4 },   // MD
    { x: 0.5, y: 0.4 },    // MCO
    { x: 0.15, y: 0.4 },   // MI
    { x: 0.5, y: 0.2 },    // DC
  ],
  "3-5-2": [
    { x: 0.5, y: 0.95 },   // POR
    { x: 0.7, y: 0.8 },    // DFC
    { x: 0.5, y: 0.82 },   // DFC
    { x: 0.3, y: 0.8 },    // DFC
    { x: 0.9, y: 0.55 },   // MD
    { x: 0.65, y: 0.6 },   // MC
    { x: 0.5, y: 0.62 },   // MC
    { x: 0.35, y: 0.6 },   // MC
    { x: 0.1, y: 0.55 },   // MI
    { x: 0.55, y: 0.25 },  // DC
    { x: 0.45, y: 0.25 },  // DC
  ],
  "3-4-3": [
    { x: 0.5, y: 0.95 },   // POR
    { x: 0.7, y: 0.8 },    // DFC
    { x: 0.5, y: 0.82 },   // DFC
    { x: 0.3, y: 0.8 },    // DFC
    { x: 0.85, y: 0.5 },   // MD
    { x: 0.65, y: 0.55 },  // MC
    { x: 0.35, y: 0.55 },  // MC
    { x: 0.15, y: 0.5 },   // MI
    { x: 0.85, y: 0.3 },   // ED
    { x: 0.5, y: 0.2 },    // DC
    { x: 0.15, y: 0.3 },   // EI
  ],
  "5-3-2": [
    { x: 0.5, y: 0.95 },   // POR
    { x: 0.9, y: 0.7 },    // DFD
    { x: 0.7, y: 0.78 },   // DFC
    { x: 0.5, y: 0.8 },    // DFC
    { x: 0.3, y: 0.78 },   // DFC
    { x: 0.1, y: 0.7 },    // DFI
    { x: 0.65, y: 0.55 },  // MC
    { x: 0.5, y: 0.58 },   // MC
    { x: 0.35, y: 0.55 },  // MC
    { x: 0.55, y: 0.25 },  // DC
    { x: 0.45, y: 0.25 },  // DC
  ],
};

export default function TacticalField({
  jugadores,
  formacionPrincipal,
  formacionesDisponibles,
  colorLocal = "#1e40af",
  titulo,
}: TacticalFieldProps) {
  const [formacion, setFormacion] = useState(formacionPrincipal);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  const posiciones = FORMACIONES_POSICIONES[formacion] || FORMACIONES_POSICIONES["4-3-3"];

  // Asignar posiciones a jugadores según la formación
  const jugadoresConPosicion = jugadores.map((j, i) => ({
    ...j,
    x: posiciones[i]?.x ?? j.x,
    y: posiciones[i]?.y ?? j.y,
  }));

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        {titulo && <h3 className="text-lg font-bold text-white">{titulo}</h3>}
        <FormationSelector
          formaciones={formacionesDisponibles}
          actual={formacion}
          onChange={setFormacion}
        />
      </div>

      {/* Campo */}
      <div className="relative w-full aspect-[2/3] bg-[#2d5a27] rounded-xl border-4 border-white/20 overflow-hidden shadow-2xl">
        {/* Líneas del campo */}
        <div className="absolute inset-0">
          {/* Línea central */}
          <div className="absolute top-1/2 left-0 right-0 h-[2px] bg-white/30" />
          {/* Círculo central */}
          <div className="absolute top-1/2 left-1/2 w-24 h-24 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/30" />
          {/* Área grande superior */}
          <div className="absolute top-0 left-[20%] right-[20%] h-[30%] border-b-2 border-x-2 border-white/30" />
          {/* Área grande inferior */}
          <div className="absolute bottom-0 left-[20%] right-[20%] h-[30%] border-t-2 border-x-2 border-white/30" />
          {/* Área chica superior */}
          <div className="absolute top-0 left-[35%] right-[35%] h-[15%] border-b-2 border-x-2 border-white/30" />
          {/* Área chica inferior */}
          <div className="absolute bottom-0 left-[35%] right-[35%] h-[15%] border-t-2 border-x-2 border-white/30" />
          {/* Arcos */}
          <div className="absolute top-0 left-[42%] right-[42%] h-[5%] border-b-2 border-x-2 border-white/40" />
          <div className="absolute bottom-0 left-[42%] right-[42%] h-[5%] border-t-2 border-x-2 border-white/40" />
        </div>

        {/* Jugadores */}
        {jugadoresConPosicion.map((jugador) => (
          <PlayerDot
            key={jugador.id}
            id={jugador.id}
            nombre={jugador.nombre}
            posicion={jugador.posicion}
            numero={jugador.numero}
            x={jugador.x}
            y={jugador.y}
            color={selectedPlayer === jugador.nombre ? "#ef4444" : colorLocal}
            onClick={setSelectedPlayer}
          />
        ))}
      </div>

      {/* Leyenda */}
      <div className="mt-4 flex flex-wrap gap-2 justify-center">
        {["POR", "DFC", "LD", "LI", "MC", "MCD", "MCO", "MD", "MI", "ED", "EI", "DC"].map((pos) => (
          <span key={pos} className="text-xs px-2 py-1 bg-bg-terciario rounded text-gray-400">
            {pos}
          </span>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/tactico/
git commit -m "feat(tactico): add interactive tactical field component"
```

---

## Task 6: Componente StatsPanel y StatCard

**Files:**
- Create: `frontend/src/components/tactico/StatsPanel.tsx`
- Create: `frontend/src/components/tactico/StatCard.tsx`

**Interfaces:**
- Consumes: `EstadisticasEquipo`
- Produces: Componentes `StatsPanel`, `StatCard`

- [ ] **Step 1: Crear StatCard**

```tsx
// frontend/src/components/tactico/StatCard.tsx
"use client";

interface StatCardProps {
  label: string;
  value: number | string;
  unit?: string;
  color?: string;
  maxValue?: number;
  showBar?: boolean;
}

export default function StatCard({
  label,
  value,
  unit = "",
  color = "text-white",
  maxValue = 100,
  showBar = false,
}: StatCardProps) {
  const numericValue = typeof value === "string" ? parseFloat(value) : value;
  const percentage = showBar ? Math.min((numericValue / maxValue) * 100, 100) : 0;

  return (
    <div className="p-4 rounded-xl bg-bg-terciario border border-borde-sutil">
      <div className="text-sm text-gray-400 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>
        {value}
        {unit && <span className="text-sm font-normal ml-1">{unit}</span>}
      </div>
      {showBar && (
        <div className="mt-2 h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-apf-rojo transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Crear StatsPanel**

```tsx
// frontend/src/components/tactico/StatsPanel.tsx
"use client";

import StatCard from "./StatCard";
import type { EstadisticasEquipo } from "@/types";

interface StatsPanelProps {
  stats: EstadisticasEquipo;
  titulo?: string;
}

export default function StatsPanel({ stats, titulo = "Estadísticas Avanzadas" }: StatsPanelProps) {
  return (
    <div>
      <h3 className="text-lg font-bold text-white mb-4">{titulo}</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard
          label="Goles Esperados (xG)"
          value={stats.xg.toFixed(2)}
          color="text-apf-rojo"
          showBar
          maxValue={3}
        />
        <StatCard
          label="Posesión"
          value={stats.posesion.toFixed(1)}
          unit="%"
          color="text-blue-400"
          showBar
          maxValue={100}
        />
        <StatCard
          label="Tiros a Puerta"
          value={stats.tiros_puerta.toFixed(1)}
          color="text-green-400"
          showBar
          maxValue={10}
        />
        <StatCard
          label="Pases Completados"
          value={stats.pases_completados.toFixed(1)}
          unit="%"
          color="text-purple-400"
          showBar
          maxValue={100}
        />
        <StatCard
          label="Duelos Ganados"
          value={stats.duelos_ganados.toFixed(1)}
          unit="%"
          color="text-yellow-400"
          showBar
          maxValue={100}
        />
        <StatCard
          label="Corners"
          value={stats.corners.toFixed(1)}
          color="text-cyan-400"
          showBar
          maxValue={10}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/tactico/StatCard.tsx frontend/src/components/tactico/StatsPanel.tsx
git commit -m "feat(tactico): add stats panel components"
```

---

## Task 7: Componente InsightsPanel

**Files:**
- Create: `frontend/src/components/tactico/InsightsPanel.tsx`
- Create: `frontend/src/components/tactico/InsightCard.tsx`

**Interfaces:**
- Consumes: `InsightTactico[]`
- Produces: Componentes `InsightsPanel`, `InsightCard`

- [ ] **Step 1: Crear InsightCard**

```tsx
// frontend/src/components/tactico/InsightCard.tsx
"use client";

interface InsightCardProps {
  icono: string;
  texto: string;
  metrica: string | null;
}

export default function InsightCard({ icono, texto, metrica }: InsightCardProps) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-bg-terciario border border-borde-sutil hover:border-apf-rojo/50 transition-colors">
      <span className="text-2xl">{icono}</span>
      <div className="flex-1">
        <p className="text-white text-sm">{texto}</p>
        {metrica && (
          <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-apf-rojo/20 text-apf-rojo">
            {metrica}
          </span>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Crear InsightsPanel**

```tsx
// frontend/src/components/tactico/InsightsPanel.tsx
"use client";

import InsightCard from "./InsightCard";
import type { InsightTactico } from "@/types";

interface InsightsPanelProps {
  insights: InsightTactico[];
  titulo?: string;
}

export default function InsightsPanel({ insights, titulo = "Análisis de IA" }: InsightsPanelProps) {
  if (insights.length === 0) {
    return (
      <div>
        <h3 className="text-lg font-bold text-white mb-4">{titulo}</h3>
        <p className="text-gray-400 text-sm">No hay insights disponibles para este equipo.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-lg font-bold text-white mb-4">{titulo}</h3>
      <div className="space-y-2">
        {insights.map((insight, idx) => (
          <InsightCard
            key={idx}
            icono={insight.icono}
            texto={insight.texto}
            metrica={insight.metrica}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/tactico/InsightCard.tsx frontend/src/components/tactico/InsightsPanel.tsx
git commit -m "feat(tactico): add AI insights panel components"
```

---

## Task 8: Hooks de Datos

**Files:**
- Create: `frontend/src/hooks/useTactico.ts`
- Create: `frontend/src/hooks/useTacticoPartido.ts`

**Interfaces:**
- Consumes: `getTacticoEquipo()`, `getTacticoPartido()`
- Produces: Hooks `useTactico()`, `useTacticoPartido()`

- [ ] **Step 1: Crear useTactico**

```typescript
// frontend/src/hooks/useTactico.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getTacticoEquipo } from "@/lib/api";
import type { EquipoTactico } from "@/types";

export function useTactico(equipoId: string | null) {
  return useQuery<EquipoTactico>({
    queryKey: ["tactico", "equipo", equipoId],
    queryFn: () => getTacticoEquipo(equipoId!),
    enabled: !!equipoId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
```

- [ ] **Step 2: Crear useTacticoPartido**

```typescript
// frontend/src/hooks/useTacticoPartido.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { getTacticoPartido } from "@/lib/api";
import type { AnalisisPartido } from "@/types";

export function useTacticoPartido(partidoId: string | null) {
  return useQuery<AnalisisPartido>({
    queryKey: ["tactico", "partido", partidoId],
    queryFn: () => getTacticoPartido(partidoId!),
    enabled: !!partidoId,
    staleTime: 5 * 60 * 1000,
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/hooks/useTactico.ts frontend/src/hooks/useTacticoPartido.ts
git commit -m "feat(tactico): add React Query hooks for tactical data"
```

---

## Task 9: Páginas del Frontend

**Files:**
- Create: `frontend/src/app/tactico/page.tsx`
- Create: `frontend/src/app/tactico/[equipo]/page.tsx`
- Create: `frontend/src/app/tactico/[partido]/page.tsx`

**Interfaces:**
- Consumes: Hooks, componentes existentes
- Produces: Rutas `/tactico`, `/tactico/[equipo]`, `/tactico/[partido]`

- [ ] **Step 1: Crear página principal `/tactico`**

```tsx
// frontend/src/app/tactico/page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { getTacticoEquipos } from "@/lib/api";
import Link from "next/link";
import type { EquipoResumen } from "@/types";

export default function TacticoPage() {
  const { data: equipos, isLoading, error } = useQuery<EquipoResumen[]>({
    queryKey: ["tactico", "equipos"],
    queryFn: getTacticoEquipos,
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-white mb-8">Análisis Táctico</h1>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-32 bg-white/10 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-white mb-8">Análisis Táctico</h1>
        <div className="text-center py-16 text-gray-400">
          <p>Error al cargar los equipos. Intenta de nuevo más tarde.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Análisis Táctico</h1>
        <p className="text-gray-400">
          Explora formaciones, estadísticas avanzadas y análisis de IA de cada equipo
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {equipos?.map((equipo) => (
          <Link
            key={equipo.id}
            href={`/tactico/${equipo.id}`}
            className="p-6 rounded-xl border border-borde-sutil bg-bg-secundario/60 hover:bg-bg-secundario hover:border-l-apf-rojo transition-all duration-200 border-l-3"
          >
            <div className="flex items-center gap-3 mb-3">
              {equipo.escudo && (
                <img
                  src={equipo.escudo}
                  alt={equipo.nombre}
                  className="w-10 h-10 object-contain"
                />
              )}
              <div>
                <h3 className="font-bold text-white">{equipo.nombre}</h3>
                <span className="text-xs text-gray-400">{equipo.formacion}</span>
              </div>
            </div>
            <div className="text-sm text-gray-400">
              Ver análisis táctico →
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Crear página de equipo `/tactico/[equipo]`**

```tsx
// frontend/src/app/tactico/[equipo]/page.tsx
"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useTactico } from "@/hooks/useTactico";
import TacticalField from "@/components/tactico/TacticalField";
import StatsPanel from "@/components/tactico/StatsPanel";
import InsightsPanel from "@/components/tactico/InsightsPanel";

export default function TacticoEquipoPage() {
  const params = useParams();
  const equipoId = params.equipo as string;

  const { data: equipo, isLoading, error } = useTactico(equipoId);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="h-8 bg-white/10 rounded w-48 mb-8 animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-96 bg-white/10 rounded-xl animate-pulse" />
          <div className="h-96 bg-white/10 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !equipo) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <Link href="/tactico" className="text-sm text-apf-rojo hover:underline mb-6 inline-block">
          ← Volver a análisis táctico
        </Link>
        <div className="text-center py-16 text-gray-400">
          <p>Equipo no encontrado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <Link href="/tactico" className="text-sm text-apf-rojo hover:underline mb-6 inline-block">
        ← Volver a análisis táctico
      </Link>

      {/* Header del equipo */}
      <div className="flex items-center gap-4 mb-8">
        {equipo.escudo && (
          <img src={equipo.escudo} alt={equipo.nombre} className="w-16 h-16 object-contain" />
        )}
        <div>
          <h1 className="text-3xl font-bold text-white">{equipo.nombre}</h1>
          <p className="text-gray-400">Formación: {equipo.formacion_principal}</p>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Campo interactivo */}
        <div className="bg-bg-secundario/60 p-6 rounded-xl border border-borde-sutil">
          <TacticalField
            jugadores={equipo.jugadores}
            formacionPrincipal={equipo.formacion_principal}
            formacionesDisponibles={equipo.formaciones_disponibles}
          />
        </div>

        {/* Panel de stats e insights */}
        <div className="space-y-6">
          <StatsPanel stats={equipo.stats} />
          <InsightsPanel insights={equipo.tendencias} />
        </div>
      </div>

      {/* Últimos partidos */}
      {equipo.ultimos_partidos.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-white mb-4">Últimos Partidos</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {equipo.ultimos_partidos.map((p, idx) => (
              <div
                key={idx}
                className="p-4 rounded-lg bg-bg-terciario border border-borde-sutil"
              >
                <div className="text-sm text-gray-400">{p.fecha}</div>
                <div className="text-white font-medium">vs {p.rival}</div>
                <div className={`text-lg font-bold ${
                  p.resultado.split("-")[0] > p.resultado.split("-")[1]
                    ? "text-green-400"
                    : p.resultado.split("-")[0] < p.resultado.split("-")[1]
                    ? "text-red-400"
                    : "text-yellow-400"
                }`}>
                  {p.resultado}
                </div>
                <div className="text-xs text-gray-500">Formación: {p.formacion}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Crear página de partido `/tactico/[partido]`**

```tsx
// frontend/src/app/tactico/[partido]/page.tsx
"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useTacticoPartido } from "@/hooks/useTacticoPartido";
import TacticalField from "@/components/tactico/TacticalField";
import StatsPanel from "@/components/tactico/StatsPanel";

export default function TacticoPartidoPage() {
  const params = useParams();
  const partidoId = params.partido as string;

  const { data: analisis, isLoading, error } = useTacticoPartido(partidoId);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="h-8 bg-white/10 rounded w-64 mb-8 animate-pulse" />
        <div className="grid grid-cols-2 gap-8">
          <div className="h-96 bg-white/10 rounded-xl animate-pulse" />
          <div className="h-96 bg-white/10 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !analisis) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <Link href="/tactico" className="text-sm text-apf-rojo hover:underline mb-6 inline-block">
          ← Volver a análisis táctico
        </Link>
        <div className="text-center py-16 text-gray-400">
          <p>Partido no encontrado o análisis no disponible.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <Link href="/tactico" className="text-sm text-apf-rojo hover:underline mb-6 inline-block">
        ← Volver a análisis táctico
      </Link>

      {/* Header del partido */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          {analisis.local.nombre} vs {analisis.visitante.nombre}
        </h1>
        <p className="text-gray-400">Análisis Táctico del Partido</p>
      </div>

      {/* Predicción IA */}
      <div className="mb-8 p-6 rounded-xl bg-gradient-to-r from-bg-secundario/80 to-bg-terciario/80 border border-borde-sutil">
        <h2 className="text-xl font-bold text-white mb-4 text-center">Predicción IA</h2>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-3xl font-bold text-green-400">
              {(analisis.prediccion_ia.gana_local * 100).toFixed(0)}%
            </div>
            <div className="text-sm text-gray-400">Gana {analisis.local.nombre.split(" ")[0]}</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-yellow-400">
              {(analisis.prediccion_ia.empate * 100).toFixed(0)}%
            </div>
            <div className="text-sm text-gray-400">Empate</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-400">
              {(analisis.prediccion_ia.gana_visitante * 100).toFixed(0)}%
            </div>
            <div className="text-sm text-gray-400">Gana {analisis.visitante.nombre.split(" ")[0]}</div>
          </div>
        </div>
        <div className="text-center mt-4">
          <span className={`text-xs px-3 py-1 rounded-full ${
            analisis.prediccion_ia.confianza === "alta"
              ? "bg-green-900/30 text-green-300"
              : "bg-yellow-900/30 text-yellow-300"
          }`}>
            Confianza: {analisis.prediccion_ia.confianza}
          </span>
        </div>
      </div>

      {/* Campos de ambos equipos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-bg-secundario/60 p-6 rounded-xl border border-borde-sutil">
          <TacticalField
            jugadores={analisis.local.jugadores}
            formacionPrincipal={analisis.local.formacion}
            formacionesDisponibles={[analisis.local.formacion]}
            colorLocal="#1e40af"
            titulo={analisis.local.nombre}
          />
        </div>
        <div className="bg-bg-secundario/60 p-6 rounded-xl border border-borde-sutil">
          <TacticalField
            jugadores={analisis.visitante.jugadores}
            formacionPrincipal={analisis.visitante.formacion}
            formacionesDisponibles={[analisis.visitante.formacion]}
            colorLocal="#dc2626"
            titulo={analisis.visitante.nombre}
          />
        </div>
      </div>

      {/* Stats comparativas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <StatsPanel stats={analisis.stats.local} titulo={`Stats: ${analisis.local.nombre}`} />
        <StatsPanel stats={analisis.stats.visitante} titulo={`Stats: ${analisis.visitante.nombre}`} />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/tactico/
git commit -m "feat(tactico): add tactical analysis pages"
```

---

## Task 10: Navegación y Estilos

**Files:**
- Modify: `frontend/src/components/sidebar/index.tsx` — Agregar enlace "Análisis Táctico"
- Modify: `frontend/src/app/globals.css` — Agregar estilos del campo si es necesario

**Interfaces:**
- Consumes: Sidebar existente
- Produces: Navegación actualizada

- [ ] **Step 1: Agregar enlace al sidebar**

```tsx
// frontend/src/components/sidebar/index.tsx
// Buscar la sección de links y agregar:
<Link
  href="/tactico"
  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition"
>
  <span>⚽</span>
  <span>Análisis Táctico</span>
</Link>
```

- [ ] **Step 2: Verificar estilos del campo**

Asegurarse de que el campo de fútbol se ve bien en `globals.css`:

```css
/* Agregar al final de globals.css si no existe */
.field-gradient {
  background: linear-gradient(135deg, #2d5a27 0%, #1e4a1e 100%);
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/sidebar/index.tsx frontend/src/app/globals.css
git commit -m "feat(tactico): add navigation link and field styles"
```

---

## Task 11: Verificación Final

**Files:**
- Todos los archivos creados en tasks anteriores

**Interfaces:**
- Consumes: Todos los componentes y páginas
- Produces: Build exitoso y funcionamiento completo

- [ ] **Step 1: Ejecutar tests del backend**

Run: `cd backend && python -m pytest tests/test_tactico.py -v`
Expected: 5 tests PASSED

- [ ] **Step 2: Ejecutar build del frontend**

Run: `cd frontend && npx next build`
Expected: Build exitoso sin errores

- [ ] **Step 3: Probar manualmente el endpoint**

Run: `curl http://localhost:8000/api/v1/tactico/equipos`
Expected: JSON con 12 equipos

- [ ] **Step 4: Probar la UI**

Run: `cd frontend && npm run dev`
Visitar: http://localhost:3000/tactico
Verificar: Dashboard carga, equipos muestran, campo interactivo funciona

- [ ] **Step 5: Commit final**

```bash
git add -A
git commit -m "feat(tactico): complete tactical analysis module MVP"
```

---

## Resumen de Archivos

### Backend (4 archivos)
1. `backend/app/schemas/tactico.py` — Modelos Pydantic
2. `backend/app/services/tactico_service.py` — Datos mock de 12 clubes
3. `backend/app/api/tactico.py` — Router de endpoints
4. `backend/tests/test_tactico.py` — 5 tests

### Frontend (13 archivos)
1. `frontend/src/app/tactico/page.tsx` — Dashboard principal
2. `frontend/src/app/tactico/[equipo]/page.tsx` — Análisis por equipo
3. `frontend/src/app/tactico/[partido]/page.tsx` — Análisis por partido
4. `frontend/src/components/tactico/TacticalField.tsx` — Campo interactivo
5. `frontend/src/components/tactico/PlayerDot.tsx` — Jugador
6. `frontend/src/components/tactico/FormationSelector.tsx` — Selector
7. `frontend/src/components/tactico/StatsPanel.tsx` — Panel de stats
8. `frontend/src/components/tactico/StatCard.tsx` — Tarjeta de stat
9. `frontend/src/components/tactico/InsightsPanel.tsx` — Panel de insights
10. `frontend/src/components/tactico/InsightCard.tsx` — Tarjeta de insight
11. `frontend/src/hooks/useTactico.ts` — Hook para equipo
12. `frontend/src/hooks/useTacticoPartido.ts` — Hook para partido
13. `frontend/src/components/tactico/MatchAnalysis.tsx` — (Opcional, ya cubierto por páginas)

### Archivos modificados (2-3)
1. `backend/app/main.py` — Agregar router
2. `frontend/src/lib/api.ts` — Agregar funciones API
3. `frontend/src/types/index.ts` — Agregar tipos TypeScript

---

## Estimación de Tiempo

- **Task 1-3 (Backend):** ~20 minutos
- **Task 4 (Tipos):** ~10 minutos
- **Task 5-8 (Componentes):** ~30 minutos
- **Task 9 (Páginas):** ~20 minutos
- **Task 10-11 (Integración):** ~15 minutos

**Total:** ~95 minutos de implementación continua
