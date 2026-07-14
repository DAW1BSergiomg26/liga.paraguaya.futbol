# Spec: Módulo de Noticias — liga.paraguaya.futbol

**Fecha:** 2026-07-13
**Estado:** Aprobado
**Alcance:** Sistema completo editorial + RSS unificado

---

## 1. Resumen

Módulo de noticias que combina artículos editoriales propios con sindicación RSS de medios paraguayos. Un solo modelo de datos, una sola feed pública, filtros por origen/fuente, paginación, y administración vía API con JWT.

## 2. Decisiones de Diseño

| Decisión | Elección | Razón |
|----------|----------|-------|
| Alcance | Sistema completo editorial + RSS | Contenido propio + variedad de fuentes |
| Admin | Solo usuario admin (sin roles) | Proyecto personal, mantenimiento mínimo |
| Tipo de contenido | Artículos + imagen destacada + video YouTube opcional | Simple, cubre 90% de casos |
| Fuentes RSS | ABC Color, APF, Sport8, La Nación Deportes, ESPN Paraguay, Telefuturo | Variedad máxima |
| Gestión | Solo por API (sin panel admin) | Rápido de implementar |
| Arquitectura | Sistema unificado con bandera de origen | Arquitectura limpia, una sola feed |

## 3. Modelo de Datos

```sql
CREATE TABLE noticias (
    id TEXT PRIMARY KEY,
    titulo TEXT NOT NULL,
    resumen TEXT,
    contenido TEXT,
    imagen_url TEXT,
    video_url TEXT,
    fuente TEXT NOT NULL,
    origen TEXT NOT NULL DEFAULT 'editorial',
    url_original TEXT,
    pub_date DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_published BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_noticias_pub_date ON noticias(pub_date);
CREATE INDEX idx_noticias_origen ON noticias(origen);
CREATE INDEX idx_noticias_fuente ON noticias(fuente);
```

**Reglas de integridad:**
- `origen = "editorial"` → `contenido` obligatorio, `url_original` NULL
- `origen = "rss"` → `url_original` obligatorio, `contenido` es el resumen del feed
- `video_url` siempre opcional
- `imagen_url` obligatorio para editorial, opcional para RSS

## 4. API Endpoints

### Públicos (sin auth)

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/noticias` | Lista paginada con filtros |
| GET | `/api/v1/noticias/{id}` | Detalle de noticia |

**Query params para GET /noticias:**
- `page=1` — página (default 1)
- `limit=12` — items por página (default 12, max 50)
- `fuente=editorial` — filtrar por fuente/origen
- `search=apertura` — buscar por título

**Respuesta:**
```json
{
  "noticias": [
    {
      "id": "uuid",
      "titulo": "Olimpia golea en la Apertura",
      "resumen": "Resumen del artículo...",
      "contenido": "Cuerpo del artículo...",
      "imagen_url": "https://...",
      "video_url": "https://youtube.com/watch?v=...",
      "fuente": "ABC Color",
      "origen": "rss",
      "url_original": "https://abc.com.py/...",
      "pub_date": "2026-07-13T10:00:00Z",
      "created_at": "2026-07-13T10:00:00Z",
      "is_published": true
    }
  ],
  "total": 48,
  "page": 1,
  "total_pages": 4
}
```

### Protegidos (requieren JWT admin)

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/v1/noticias` | Crear noticia editorial |
| PUT | `/api/v1/noticias/{id}` | Editar noticia |
| DELETE | `/api/v1/noticias/{id}` | Borrar noticia |
| POST | `/api/v1/noticias/sync-rss` | Forzar sync RSS |

## 5. RSS Sync

**Fuentes configuradas:**

| Fuente | URL Feed |
|--------|----------|
| ABC Color | `https://www.abc.com.py/arc/outboundfeeds/rss/deportes/futbol/` |
| APF | `https://apf.org.py/rss/` |
| Sport8 | `https://sport8.com.py/feed/` |
| La Nación Deportes | `https://www.lanacion.com.py/deportes/feed/` |
| ESPN Paraguay | `https://www.espn.com.py/rss/` |
| Telefuturo | `https://telefuturo.com.py/rss/` |

**Flujo de sync:**
1. Cada 10 min (cron existente) o POST manual
2. Fetch de cada feed con httpx (timeout 10s)
3. Para cada item: verificar duplicado por `url_original`
4. Si es nuevo → insertar con `origen = "rss"`
5. Extraer imagen del feed si está disponible
6. Limpiar noticias RSS mayores a 30 días

**Caché:**
- RSS se almacena en DB (no en memoria)
- Endpoint público lee de DB con índices
- Sin cache in-memory

## 6. Frontend

### Página `/noticias`

**Layout:**
- Header con título "NOTICIAS"
- Filtros: Todas | Editorial | RSS + barra de búsqueda
- Grid responsivo: noticia destacada (grande) + tarjetas (medianas/pequeñas)
- Paginación inferior

**Tarjeta de noticia:**
- Imagen destacada (si tiene)
- Badge de fuente (color según origen)
- Título (click → detalle)
- Resumen (2 líneas, truncate)
- Fecha relativa ("Hace 2h")
- Icono play si tiene video

### Página `/noticias/[id]`

- Imagen grande arriba
- Título + metadata (fuente, fecha)
- Cuerpo del artículo (HTML/markdown renderizado)
- Si tiene `video_url` → iframe YouTube embebido
- Botón "Volver a noticias"

### Componentes

```
components/noticias/
  NoticiaCard.tsx       — tarjeta individual
  NoticiaGrid.tsx       — grid responsivo
  NoticiaDetalle.tsx    — vista de detalle
  FiltrosNoticias.tsx   — filtros + búsqueda
```

## 7. Autenticación

- Campo `is_admin` en tabla `users` (nuevo, default FALSE)
- Primer usuario registrado es admin automáticamente
- `get_current_user` existente + chequeo `is_admin`
- Endpoints de escritura requieren JWT + admin

## 8. Migración

```
006_add_noticias_table.py — crear tabla noticias + índices
007_add_user_admin.py — agregar campo is_admin a users
```

## 9. Testing

| Test | Cobertura |
|------|-----------|
| `test_noticias_api.py` | CRUD, permisos, paginación, filtros, búsqueda |
| `test_rss_sync.py` | Sync feed, deduplicación, limpieza, error handling |

## 10. Archivos a Crear/Modificar

### Backend (nuevos)
- `backend/app/models/noticia.py`
- `backend/app/schemas/noticia.py`
- `backend/app/services/noticia_service.py`
- `backend/app/services/rss_sync.py`
- `backend/alembic/versions/006_add_noticias_table.py`
- `backend/alembic/versions/007_add_user_admin.py`
- `backend/tests/test_noticias_api.py`
- `backend/tests/test_rss_sync.py`

### Backend (modificar)
- `backend/app/api/noticias.py` — reescribir completamente
- `backend/app/main.py` — incluir nuevo router
- `backend/app/models/user.py` — agregar is_admin

### Frontend (nuevos)
- `frontend/src/app/noticias/page.tsx`
- `frontend/src/app/noticias/[id]/page.tsx`
- `frontend/src/components/noticias/NoticiaCard.tsx`
- `frontend/src/components/noticias/NoticiaGrid.tsx`
- `frontend/src/components/noticias/NoticiaDetalle.tsx`
- `frontend/src/components/noticias/FiltrosNoticias.tsx`

### Frontend (modificar)
- `frontend/src/lib/api.ts` — agregar endpoints
- `frontend/src/types/index.ts` — actualizar tipos
- `frontend/src/components/layout/Navbar.tsx` — agregar link Noticias
