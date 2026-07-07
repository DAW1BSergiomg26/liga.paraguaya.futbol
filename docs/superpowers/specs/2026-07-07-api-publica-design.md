# API Pública — Spec de Diseño

## Resumen

API REST pública con documentación interactiva, autenticación via API Key, rate limiting, caching y CORS. Expone los datos de la Liga Paraguaya de Fútbol a terceros desarrolladores.

## Endpoints

Todas las rutas bajo el prefijo `/api/v1/`. El middleware de API Key solo se aplica a este prefijo; las rutas internas (`/api/`, `/api/admin/`) no se ven afectadas.

| Método | Ruta | Descripción | Paginación |
|--------|------|-------------|------------|
| GET | `/clubes` | Lista todos los clubes | No |
| GET | `/clubes/{id}` | Detalle de un club | No |
| GET | `/tabla` | Tabla de posiciones actual | No |
| GET | `/tabla/historico` | Tabla congelada por temporada | No |
| GET | `/partidos` | Calendario con filtros | Sí (50/page) |
| GET | `/partidos/{id}` | Detalle de partido | No |
| GET | `/partidos/{id}/predicciones` | Predicciones de la comunidad | Sí (20/page) |
| GET | `/predicciones/leaderboard` | Top predictores | No |

### Parámetros

- `/partidos?temporada=2026&jornada=5&club_id=cerro&page=1&per_page=50`
- `/tabla/historico?temporada=2025`
- `/partidos/{id}/predicciones?page=1&per_page=20`

## Autenticación

### API Key

- Header: `X-API-Key: <uuid-v4>`
- Cada key tiene owner, email, is_active, requests_count, created_at, last_used_at
- Keys inválidas o desactivadas → `401 INVALID_API_KEY`
- Solo el admin autenticado (Google OAuth) puede crear/gestionar keys

### Rate Limiting

- Implementación: diccionario en memoria con ventana fija de 60 segundos
- Límite: 100 requests por ventana por key
- No persiste entre reinicios del servidor (aceptable para MVP)
- Headers de respuesta: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`
- Límite excedido → `429 RATE_LIMIT_EXCEEDED`

## Formato de respuesta

### Éxito (recurso único)

```json
{
  "success": true,
  "data": { ... }
}
```

### Éxito (lista)

```json
{
  "success": true,
  "data": [ ... ],
  "meta": { "page": 1, "per_page": 50, "total": 120 }
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Límite de requests excedido. Esperá 42 segundos.",
    "status": 429
  }
}
```

### Códigos de error

| Código | HTTP | Causa |
|--------|------|-------|
| `INVALID_API_KEY` | 401 | Key no existe o inactiva |
| `RATE_LIMIT_EXCEEDED` | 429 | Límite alcanzado |
| `NOT_FOUND` | 404 | Recurso no encontrado |
| `INVALID_PARAMS` | 422 | Parámetros inválidos |
| `INTERNAL_ERROR` | 500 | Error interno del servidor |

## CORS

- Orígenes permitidos: `*` (la API es pública)
- Headers permitidos: `X-API-Key`, `Content-Type`, `Authorization`
- Métodos: `GET`, `OPTIONS`

## Cache

| Endpoint | Cache-Control | ETag |
|----------|---------------|------|
| `/clubes` | `public, max-age=3600` | hash del JSON de clubes |
| `/tabla` | `public, max-age=300` | hash del JSON de tabla |
| `/partidos` | `public, max-age=120` | hash del JSON de partidos |
| `/predicciones/*` | `public, max-age=60` | hash del JSON |

Los clientes pueden enviar `If-None-Match` y recibir `304 Not Modified`.

## Modelos de datos expuestos

### Club

```json
{
  "id": "olimpia",
  "nombre": "Club Olimpia",
  "escudo": "https://...",
  "estadio": "Estadio Manuel Ferreira",
  "capacidad": 25000,
  "fundacion": 1902,
  "titulos_liga": 46,
  "titulos_info": [{"torneo": "Primera División", "anios": ["2022", "2023"]}],
  "descripcion": "...",
  "sitio_web": "https://..."
}
```

### Tabla

```json
{
  "torneo": "Primera División 2026",
  "jornada": 22,
  "posiciones": [
    {
      "posicion": 1,
      "club_id": "olimpia",
      "club_nombre": "Club Olimpia",
      "club_escudo": "https://...",
      "pj": 22, "pg": 16, "pe": 4, "pp": 2,
      "gf": 45, "gc": 12, "dg": 33, "puntos": 52,
      "racha": ["G", "G", "E", "G", "G"]
    }
  ]
}
```

`racha` se computa en el servicio de tabla desde los últimos 5 partidos del club (G = ganó, E = empató, P = perdió).

### Partido

```json
{
  "id": 101,
  "torneo": "Apertura 2026",
  "fecha": "2026-03-15",
  "jornada": 5,
  "temporada": "2026",
  "local": {"id": "cerro", "nombre": "Cerro Porteño", "escudo": "..."},
  "visitante": {"id": "olimpia", "nombre": "Club Olimpia", "escudo": "..."},
  "goles_local": 2,
  "goles_visitante": 1,
  "estado": "finalizado"
}
```

`estado` es computado: `"finalizado"` si `goles_local IS NOT NULL`, `"pendiente"` si es `null`.

### Predicciones por partido

```json
{
  "partido_id": 101,
  "total_predicciones": 142,
  "distribucion": {"local": 68, "empate": 30, "visitante": 44},
  "porcentaje": {"local": 47.9, "empate": 21.1, "visitante": 31.0},
  "predicciones": [
    {"usuario": "futbolfan42", "prediccion": "local", "acertado": true}
  ]
}
```

### Leaderboard

```json
{
  "leaderboard": [
    {
      "posicion": 1,
      "usuario": "maestro42",
      "aciertos": 45,
      "total": 60,
      "precision": 0.75
    }
  ]
}
```

## Middleware de API Key

1. Si la ruta NO empieza con `/api/v1/`, pasa sin validación
2. Extraer `X-API-Key` del header
3. Si no hay key → `401 INVALID_API_KEY`
4. Buscar key en DB (con cache en memoria TTL 5 min)
5. Si no existe o `is_active = false` → `401 INVALID_API_KEY`
6. Consultar contador de requests en ventana actual (diccionario en memoria)
7. Si excede el límite → `429 RATE_LIMIT_EXCEEDED`
8. Actualizar `last_used_at` en DB (asincrónico, no bloqueante)
9. Setear headers `X-RateLimit-*` en la respuesta
10. Pasar al endpoint

## Endpoints de gestión (protegidos con OAuth admin)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/admin/api-keys` | Crear API Key (genera UUID v4) |
| GET | `/api/admin/api-keys` | Listar keys con stats |
| PATCH | `/api/admin/api-keys/{key}/toggle` | Activar/desactivar |
| DELETE | `/api/admin/api-keys/{key}` | Eliminar key |

## Documentación OpenAPI

- Los endpoints públicos se agrupan bajo el tag `API Pública`
- El tag incluye descripción: "Endpoints públicos de la Liga Paraguaya. Requieren API Key via header X-API-Key."
- Swagger UI en `/docs` muestra ambos tags: `API Pública` y `Admin`
- Cada endpoint incluye ejemplos de request y response, códigos de error documentados

## Testing

- Autenticación: key válida → 200, key inválida → 401, key desactivada → 401, sin key → 401
- Rate limiting: 101 requests en 60s → 429 en la 101
- Cada endpoint público: status 200, estructura de respuesta correcta, filtros funcionan
- Endpoints de gestión: requieren sesión OAuth admin
- Cache: verificar headers `Cache-Control` y `ETag` presentes

## Archivos a crear

| Archivo | Propósito |
|---------|-----------|
| `backend/app/api/public.py` | Router con los endpoints `/api/v1/*` |
| `backend/app/models/api_key.py` | Modelo SQLAlchemy `APIKey` |
| `backend/app/schemas/api_key.py` | Schemas Pydantic `APIKeyOut`, `APIKeyCreate` |
| `backend/app/core/api_key.py` | Middleware de validación + rate limiter |

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `backend/app/main.py` | Registrar router público, agregar middleware |
| `backend/app/core/database.py` | `init_db` debe incluir el modelo `APIKey` |
