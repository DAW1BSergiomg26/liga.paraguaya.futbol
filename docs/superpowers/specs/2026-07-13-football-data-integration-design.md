# Design Spec: Integración Football-Data.org

**Fecha:** 2026-07-13
**Estado:** Aprobado
**Autor:** opencode

## Resumen

Integrar datos reales de la liga paraguaya desde Football-Data.org para reemplazar los datos mock actuales. El sistema sincronizará partidos, tabla de posiciones y goleadores automáticamente cada 10 minutos, con fallback a datos mock si la API falla.

## Decisiones Clave

| Decisión | Elección | Razón |
|----------|----------|-------|
| Fuente de datos | Football-Data.org | Gratis, API estable, cubre liga paraguaya |
| Datos prioritarios | Partidos + tabla + goleadores | Lo más visible para usuarios |
| Frecuencia de sync | Cron cada 10 min | Balance entre frescura y rate limits |
| Almacenamiento | DB + fallback a mock | Persistencia + resiliencia |
| Enfoque | Servicio directo | Simple, suficiente para empezar |

## Arquitectura

### Componentes

```
backend/app/services/
├── football_data_service.py    # Servicio principal
├── football_config.py          # Configuración y mapeos
└── football_mapper.py          # Transformación de datos API → modelos locales
```

### Flujo de Datos

```
Football-Data.org API
        │
        ▼ (httpx)
FootballDataService
  ├── fetch_partidos()
  ├── fetch_tabla()
  └── fetch_goleadores()
        │
        ▼ (upsert)
    DB SQLite
  ├── partidos (existente)
  ├── tabla_posiciones (existente)
  └── goleadores (nuevo)
        │
        ▼ (lectura)
  API Endpoints FastAPI
  ├── GET /partidos
  ├── GET /tabla
  └── GET /goleadores
        │
        ▼
    Frontend Next.js
```

## Endpoints de la API

Football-Data.org free tier (10 req/min):
- `GET /v4/competitions/PA1/matches` → Partidos de la Primera División paraguaya
- `GET /v4/competitions/PA1/standings` → Tabla de posiciones
- `GET /v4/competitions/PA1/scorers` → Goleadores

**Nota:** El competition code `PA1` es el de la liga paraguaya. Verificar que existe en el tier免费.

## Mapeo de IDs

```python
TEAM_MAP = {
    "Club Olimpia": "olimpia",
    "Cerro Porteño": "cerro-porteno",
    "Club Libertad": "libertad",
    "Club Guaraní": "guarani",
    "Club Nacional": "nacional",
    "Sportivo Luqueño": "luqueno",
    "Club Sportivo San Lorenzo": "san-lorenzo",
    "Deportivo Santaní": "santani",
    "Sportivo Trinidense": "trinidense",
    "General Díaz": "general-diaz",
    "Deportivo Capiatá": "deportivo-capiata",
    "Ameliano": "ameliano",
}
```

## Tablas Nuevas

### goleadores
```sql
CREATE TABLE goleadores (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    club_id TEXT REFERENCES clubes(id),
    goles INTEGER DEFAULT 0,
    asistencias INTEGER DEFAULT 0,
    torneo TEXT NOT NULL,
    temporada TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### api_sync_log
```sql
CREATE TABLE api_sync_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint TEXT NOT NULL,
    status TEXT NOT NULL,
    records_updated INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Manejo de Errores

```python
class FootballDataError(Exception):
    """Error base para el servicio"""
    pass

class RateLimitError(FootballDataError):
    """Rate limit excedido (10 req/min en free tier)"""
    pass

class DataNotFoundError(FootballDataError):
    """No hay datos para el torneo/competición solicitada"""
    pass
```

**Fallback automático:**
1. Si la API falla → usar datos de la DB (que ya tienen los mock)
2. Si la DB está vacía → usar archivos JSON mock
3. Loguear cada fallback para debugging

## Cron Job

```python
# En main.py o como background task
@app.on_event("startup")
async def start_sync_cron():
    asyncio.create_task(sync_loop())

async def sync_loop():
    while True:
        try:
            await football_service.sync_all()
        except Exception as e:
            logger.error(f"Sync failed: {e}")
        await asyncio.sleep(600)  # 10 minutos
```

## Testing

- Tests unitarios con `respx` (mock de httpx)
- Test de mapeo: datos API → modelos locales
- Test de fallback: simular error de API → verificar que usa DB
- Test de rate limiting: verificar que no se excede 10 req/min

## Endpoints Nuevos

```
GET /api/goleadores?torneo=Apertura+2026
GET /api/sync/status  (último sync log)
POST /api/sync/force  (forzar sync manual, admin only)
```

## Orden de Implementación

1. Configuración y mapeo (`football_config.py`)
2. Servicio principal (`football_data_service.py`)
3. Mapper de datos (`football_mapper.py`)
4. Modelo de goleadores
5. Endpoints API
6. Cron job de sincronización
7. Tests
8. Frontend: componente de goleadores
