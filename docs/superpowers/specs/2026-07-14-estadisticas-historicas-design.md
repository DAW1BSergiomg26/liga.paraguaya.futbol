# Estadísticas Históricas — Design Spec

> Fecha: 2026-07-14
> Módulo del roadmap del usuario: item 5 — "Estadísticas históricas"

## Resumen

Agregar un módulo de **Estadísticas Históricas** que explota los datos ya existentes en
`TablaPosicion` (tablas finales por torneo/año, temporadas 2020–2026). El módulo se expone
en una nueva sección `/historial` con 3 pestañas:

1. **Tablas por año** — explorador de la tabla final de cualquier torneo histórico.
2. **Ranking agregado** — campeones por año, tabla all-time y títulos por club.
3. **Rendimiento por club** — historial temporada a temporada de un club elegido.

No se crean nuevos modelos de DB; todo se computa en capa de servicio sobre `TablaPosicion`.

## Contexto de datos existentes

- `TablaPosicion` (modelo SQLAlchemy) con campos: `torneo, jornada, club_id, posicion, pj, pg, pe, pp, gf, gc, dg, puntos`.
- Los datos históricos se cargan en el seed desde `data/partidos_historicos/temporada_YYYY.json`
  (solo standing final, `jornada = 0`). 7 temporadas: 2020–2026.
- Cada año tiene 1–2 torneos:
  - 2020: `Torneo Apertura 2020`, `Regular Stage`
  - 2021–2025: `Torneo Apertura XXXX` + `Torneo Clausura XXXX`
  - 2026: `Torneo Apertura 2026` (temporada actual, parcial — 10 filas)
- Endpoints ya existentes (reutilizables):
  - `GET /api/v1/tabla?torneo=<torneo>` → `list[TablaRowOut]`
  - `GET /api/v1/tabla/torneos` → `list[str]` (torneos distintos)
- `Club` model tiene `nombre` y `escudo` para enriquecer con join.

## Fuera de alcance (datos inexistentes)

- **Resultados fecha por fecha** de cada temporada: los JSON históricos solo traen la tabla
  final, no los partidos por ronda. Requiere nuevo scraping. Se documenta como pendiente.
- **Goleadores históricos**: no existe `goleadores_historico.json` ni datos de goleadores por
  temporada histórica. La vista de ranking NO incluye goleadores; queda pendiente de scraping.

## Arquitectura

### Backend — `HistorialService`

Nuevo archivo `backend/app/services/historial_service.py` con 3 métodos (todos `AsyncSession`):

- `async def get_campeones(db) -> list[CampeonOut]`
  - Agrupa `TablaPosicion` por `torneo`, toma la fila con `posicion == 1`.
  - Devuelve: `año` (parseado del torneo), `torneo`, `club_id`, `club` (nombre), `escudo`, `puntos`.
  - Ordenado por año descendente, luego Apertura antes que Clausura.
- `async def get_ranking_clubes(db) -> list[RankingClubOut]`
  - Agrupa por `club_id`, suma `pj, pg, pe, pp, gf, gc, dg, puntos`; cuenta títulos = nº de torneos
    donde ese club fue `posicion == 1`.
  - Enriquecido con `club` (nombre) y `escudo` vía join a `Club`.
  - Ordenado por `puntos` desc, luego `titulos` desc.
- `async def get_club_historial(db, club_id) -> list[ClubTemporadaOut]`
  - Filtra `TablaPosicion` por `club_id`, devuelve por cada torneo: `año, torneo, posicion, puntos, dg`.
  - Ordenado por año descendente.

### Backend — esquemas

Nuevo archivo `backend/app/schemas/historial.py`:

```python
class CampeonOut(BaseModel):
    ano: int
    torneo: str
    club_id: str
    club: str
    escudo: str | None
    puntos: int

class RankingClubOut(BaseModel):
    club_id: str
    club: str
    escudo: str | None
    pj: int
    pg: int
    pe: int
    pp: int
    gf: int
    gc: int
    dg: int
    puntos: int
    titulos: int
    torneos_jugados: int

class ClubTemporadaOut(BaseModel):
    ano: int
    torneo: str
    posicion: int
    puntos: int
    dg: int
```

### Backend — API

Nuevo router `backend/app/api/historial.py` (prefijo `/api/v1/historial`):

- `GET /campeones` → `list[CampeonOut]`
- `GET /ranking-clubes` → `list[RankingClubOut]`
- `GET /club/{club_id}` → `list[ClubTemporadaOut]`

Registrar en `main.py`.

### Frontend — types

Agregar a `frontend/src/types/index.ts`:

```typescript
export interface CampeonHistorico { ano: number; torneo: string; club_id: string; club: string; escudo: string | null; puntos: number; }
export interface RankingClubHistorico { club_id: string; club: string; escudo: string | null; pj: number; pg: number; pe: number; pp: number; gf: number; gc: number; dg: number; puntos: number; titulos: number; torneos_jugados: number; }
export interface ClubTemporadaHistorica { ano: number; torneo: string; posicion: number; puntos: number; dg: number; }
```

### Frontend — página `/historial`

Nueva ruta `frontend/src/app/historial/page.tsx` (Client Component) con estado de tab activo:

- **Tab "Tablas por año":**
  - Selector de año (2020–2026) y selector de torneo (filtrado por año, usando `GET /api/v1/tabla/torneos`).
  - Tabla estilo `/tabla`: pos, club+escudo, PJ/PG/PE/PP/GF/GC/DG/PTS.
  - Envuelta en `ScrollReveal` (`variant="from-bottom"`, `stagger`).
- **Tab "Ranking agregado":**
  - Lista de campeones por año (`GET /api/v1/historial/campeones`).
  - Tabla all-time (`GET /api/v1/historial/ranking-clubes`), top 10.
  - `BarChart` (Recharts) de títulos por club (top 8).
- **Tab "Rendimiento por club":**
  - Selector de club.
  - Grid temporada-a-temporada (`GET /api/v1/historial/club/{id}`).
  - `LineChart` (Recharts) de `posicion` a lo largo de los años (eje Y invertido: 1 arriba).

Componentes auxiliares (en `frontend/src/components/historial/`):
- `HistorialTabs.tsx` — navegación por tabs.
- `TablaPorAnio.tsx` — tabla + selectores.
- `RankingAgregado.tsx` — campeones + all-time + barchart.
- `RendimientoClub.tsx` — selector + grid + linechart.

### Navbar

Agregar `{ label: "Historial", href: "/historial" }` a `frontend/src/components/layout/Navbar.tsx`.

## Manejo de errores

- `GET /api/v1/historial/club/{club_id}` con club inexistente → lista vacía `[]` (no 404), el frontend muestra estado vacío.
- Si no hay datos históricos (DB vacía) → cada endpoint devuelve `[]`; el frontend muestra "Sin datos históricos".
- La tabla por año con torneo sin filas → mensaje de estado vacío.

## Testing

- `backend/tests/test_historial_api.py` (~8 tests):
  - `get_campeones` devuelve 1 campeón por torneo, ordenado.
  - `get_ranking_clubes` suma correctamente y ordena por puntos.
  - `get_club_historial` filtra por club y ordena por año.
  - Conteo de títulos correcto.
  - Club inexistente → `[]`.
  - Parseo de año desde nombre de torneo (`"Torneo Apertura 2024"` → 2024).
  - Endpoints responden 200 con schema válido.
- `cd frontend && npm run build` debe pasar sin errores.

## Dependencias

Sin nuevas dependencias. Recharts ya está instalado (usado en Transferencias). Se reutilizan
`ScrollReveal` y `CountUp` de `components/ui/`.

## Archivos a crear/modificar

**Backend (nuevos):**
- `backend/app/services/historial_service.py`
- `backend/app/schemas/historial.py`
- `backend/app/api/historial.py`
- `backend/tests/test_historial_api.py`

**Backend (modificar):**
- `backend/app/main.py` — registrar router

**Frontend (nuevos):**
- `frontend/src/app/historial/page.tsx`
- `frontend/src/components/historial/HistorialTabs.tsx`
- `frontend/src/components/historial/TablaPorAnio.tsx`
- `frontend/src/components/historial/RankingAgregado.tsx`
- `frontend/src/components/historial/RendimientoClub.tsx`

**Frontend (modificar):**
- `frontend/src/types/index.ts` — nuevos tipos
- `frontend/src/components/layout/Navbar.tsx` — link Historial
