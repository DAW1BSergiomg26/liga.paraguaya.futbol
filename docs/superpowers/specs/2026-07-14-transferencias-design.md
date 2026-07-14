# Design Spec: Módulo Transferencias

**Fecha:** 2026-07-14
**Estado:** Aprobado
**Versión:** 1.0

---

## 1. Resumen

Módulo completo de transferencias de jugadores para la Primera División paraguaya. Incluye transferencias confirmadas, rumores con nivel de verificación, mercado de pases, historial por club y estadísticas de gasto. Los datos provienen de API externa (Football-Data.org), ingreso manual por admin, y scraping automático de feeds RSS paraguayos.

## 2. Decisiones de Diseño

| Decisión | Elección | Razón |
|----------|----------|-------|
| Modelo de jugador | String en Transferencia (sin tabla separada) | Simple, suficiente para el 90% de casos. Historial se agrupa por nombre. |
| Fuentes de datos | API + Admin + RSS | Cobertura máxima, datos enriquecidos |
| Visual | Estilo Transfermarkt con paleta APF | Familiar para usuarios de fútbol, identidad propia |
| Base | Enfoque directo (FK a clubes, nombre como string) | Rápido de construir, menos joins |

## 3. Modelo de Datos

### 3.1 Tabla `transferencias`

```sql
CREATE TABLE transferencias (
    id TEXT PRIMARY KEY,                          -- UUID
    jugador_nombre TEXT NOT NULL,                 -- "Juan Pérez"
    jugador_posicion TEXT,                        -- "Delantero", "Mediocampista", etc.
    club_origen_id TEXT,                          -- FK → clubes.id (NULL si refuerzo nuevo)
    club_destino_id TEXT NOT NULL,                -- FK → clubes.id
    fecha DATE NOT NULL,                          -- Fecha de la transferencia
    tipo TEXT NOT NULL DEFAULT 'confirmada',      -- compra|prestamo|libre|cesion|refuerzo
    estado TEXT NOT NULL DEFAULT 'confirmada',    -- confirmada|rumor|oficial|desmentida
    monto REAL,                                   -- En millones USD (NULL si no aplica)
    duracion_meses INTEGER,                       -- Solo para préstamos
    fuente_url TEXT,                              -- Link a noticia original
    fuente_nombre TEXT,                           -- "ABC Color", "APF", "Football-Data"
    verification_level INTEGER DEFAULT 3,         -- 1-5 (número de fuentes que confirman)
    is_active BOOLEAN DEFAULT 1,                  -- True si está activo en su club actual
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (club_origen_id) REFERENCES clubes(id),
    FOREIGN KEY (club_destino_id) REFERENCES clubes(id)
);
```

### 3.2 Enums

**Tipo de transferencia:**
- `compra` — Transferencia definitiva con monto
- `prestamo` — Préstamo temporal con duración
- `libre` — Libre, sin monto
- `cesion` — Cesión temporal
- `refuerzo` — Refuerzo de corto plazo (torneo corto)

**Estado:**
- `confirmada` — Transferencia cerrada y confirmada oficialmente
- `rumor` — Rumor no confirmado
- `oficial` — Anuncio oficial del club
- `desmentida` — Rumor desmentido

**Posiciones de jugador:**
- `Portero`
- `Defensor`
- `Mediocampista`
- `Delantero`

### 3.3 Relaciones

```
clubes (1) ──< (N) transferencias [club_origen_id]
clubes (1) ──< (N) transferencias [club_destino_id]
```

## 4. API Endpoints

### 4.1 Listar Transferencias

```
GET /api/v1/transferencias
```

**Query params:**
- `club_id` (str) — Filtrar por club (origen o destino)
- `tipo` (str) — compra|prestamo|libre|cesion|refuerzo
- `estado` (str) — confirmada|rumor|oficial|desmentida
- `fecha_desde` (str) — Fecha inicio (YYYY-MM-DD)
- `fecha_hasta` (str) — Fecha fin (YYYY-MM-DD)
- `jugador` (str) — Buscar por nombre (substring match)
- `page` (int) — Página (default: 1)
- `per_page` (int) — Items por página (default: 20)

**Response:**
```json
{
  "transferencias": [...],
  "total": 150,
  "page": 1,
  "total_pages": 8
}
```

### 4.2 Detalle

```
GET /api/v1/transferencias/{id}
```

### 4.3 Crear (Admin)

```
POST /api/v1/transferencias
```

**Body:**
```json
{
  "jugador_nombre": "Juan Pérez",
  "jugador_posicion": "Delantero",
  "club_origen_id": "cerro-porteno",
  "club_destino_id": "olimpia",
  "fecha": "2026-07-14",
  "tipo": "compra",
  "estado": "confirmada",
  "monto": 1.5,
  "duracion_meses": null,
  "fuente_url": "https://abc.com.py/noticia/...",
  "fuente_nombre": "ABC Color",
  "verification_level": 4
}
```

### 4.4 Actualizar (Admin)

```
PUT /api/v1/transferencias/{id}
```

### 4.5 Eliminar (Admin)

```
DELETE /api/v1/transferencias/{id}
```

### 4.6 Mercado de Pases

```
GET /api/v1/transferencias/mercado
```

Retorna transferencias de la ventana de pases activa (últimos 30 días por defecto, configurable).

### 4.7 Historial por Club

```
GET /api/v1/transferencias/historial/{club_id}
```

Retorna todas las transferencias de un club, agrupadas por temporada.

### 4.8 Estadísticas

```
GET /api/v1/transferencias/estadisticas
```

**Response:**
```json
{
  "total_transferencias": 150,
  "gasto_total_por_club": [
    {"club_id": "olimpia", "club_nombre": "Olimpia", "total_gastado": 12.5, "total_recibido": 8.3},
    ...
  ],
  "top_compras": [...],
  "distribucion_posiciones": {"Delantero": 45, "Mediocampista": 38, ...},
  "distribucion_tipos": {"compra": 60, "prestamo": 35, ...}
}
```

### 4.9 Sync RSS

```
POST /api/v1/transferencias/sync-rss
```

Admin only. Fuerza sync de feeds RSS configurados.

## 5. RSS Feeds Configurados

Para transferencias, se configuran feeds específicos:

| Fuente | URL | Notas |
|--------|-----|-------|
| ABC Color Deportes | `https://www.abc.com.py/deportes/` | Noticias generales de deporte |
| APF | `https://www.apf.org.py` | Comunicados oficiales |
| ESPN Paraguay | `https://www.espn.com.py/futbol/` | Noticias internacionales con filtro Paraguay |
| Diario Popular | `https://www.popular.com.py/deportes/` | Noticias de fútbol |
| 1000 Noticias | `https://1000noticias.com/deportes/` | Noticias regionales |

**Scraping strategy:**
- Buscar keywords: "fichaje", "transferencia", "refuerzo", "se desvincula", "firma", "préstamo", "cesión"
- Extraer: nombre del jugador, club origen/destino, tipo de movimiento
- Crear transferencia automáticamente con estado `rumor` y verification_level 1
- Marcar como `confirmada` cuando 3+ fuentes reporten lo mismo

## 6. Football-Data.org Integration

El servicio existente `FootballDataSyncService` ya sincroniza partidos. Se extiende para:

- Obtener transfers del endpoint `/v4/competitions/PA1/transfers` (si disponible)
- Mapear clubes de Football-Data a IDs internos
- Sincronizar cada 30 minutos (menos frecuente que partidos)

**Nota:** Football-Data.org free tier puede no tener endpoint de transfers. En ese caso, se usa solo para datos de partidos y el módulo funciona con admin + RSS.

## 7. Frontend Pages

### 7.1 `/transferencias` — Listado Principal

**Layout:**
- Header con título "Mercado de Fichajes" + badge de temporada activa
- Tabs: Confirmadas | Rumores | Mercado | Histórico
- Barra de filtros: Club (select), Tipo (select), Fecha (rango), Buscador de jugador
- Grid de tarjetas estilo Transfermarkt:
  - Foto del jugador (placeholder si no hay)
  - Nombre + posición
  - Flecha: Club Origen → Club Destino (con escudos)
  - Badge de tipo (compra: verde, préstamo: azul, libre: gris)
  - Badge de verification level (1-5 puntos)
  - Monto si aplica
  - Fecha
- Paginación
- GSAP: ScrollReveal stagger en las cards

### 7.2 `/transferencias/[id]` — Detalle

**Layout:**
- Hero con jugador nombre + posición
- Card principal con:
  - Escudos de club origen y destino (lado a lado)
  - Flecha animada entre escudos
  - Tipo de transferencia
  - Monto (si aplica)
  - Fecha
  - Verification level visual
  - Fuente original (link)
- Timeline de la transferencia (si hay historial de cambios de estado)
- Transferencias relacionadas del mismo jugador

### 7.3 `/transferencias/mercado` — Mercado de Pases

**Layout:**
- Timeline visual de la ventana de transferencias
- Fichajes confirmados en orden cronológico
- Rumores activos con barra de verificación
- Estadísticas rápidas: total fichajes, monto total movido, club más activo

### 7.4 `/transferencias/historial` — Historial por Club

**Layout:**
- Selector de club
- Timeline vertical con todas las transferencias agrupadas por temporada
- Bajas y altas separadas visualmente
- Gráfico de barras: entradas vs salidas por temporada

### 7.5 `/transferencias/estadisticas` — Dashboard

**Layout:**
- Cards resumen: Total transferencias, monto total, promedio por fichaje
- Gráfico de torta: Distribución por tipo
- Gráfico de barras: Gasto por club (top 10)
- Gráfico de torta: Distribución por posición
- Tabla: Top 10 transferencias más caras

## 8. Componentes Frontend

| Componente | Descripción |
|-----------|-------------|
| `TransferCard` | Tarjeta de transferencia con escudos, jugador, tipo, verification |
| `TransferDetail` | Vista detallada de una transferencia |
| `MercadoTimeline` | Timeline visual de la ventana de pases |
| `ClubHistorial` | Historial de transferencias por club |
| `EstadisticasDashboard` | Dashboard con gráficos Recharts |
| `FiltrosTransferencias` | Barra de filtros con búsqueda |
| `VerificationBadge` | Badge visual de 1-5 puntos |
| `TipoBadge` | Badge de color por tipo de transferencia |
| `TransferFilters` | Filtros avanzados (club, tipo, fecha, estado) |

## 9. Tipos TypeScript

```typescript
export type TipoTransferencia = "compra" | "prestamo" | "libre" | "cesion" | "refuerzo";
export type EstadoTransferencia = "confirmada" | "rumor" | "oficial" | "desmentida";

export interface Transferencia {
  id: string;
  jugador_nombre: string;
  jugador_posicion: string | null;
  club_origen_id: string | null;
  club_destino_id: string;
  fecha: string;
  tipo: TipoTransferencia;
  estado: EstadoTransferencia;
  monto: number | null;
  duracion_meses: number | null;
  fuente_url: string | null;
  fuente_nombre: string | null;
  verification_level: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Populated from joins:
  club_origen_nombre?: string;
  club_origen_escudo?: string;
  club_destino_nombre?: string;
  club_destino_escudo?: string;
}

export interface TransferenciasPaginatedResponse {
  transferencias: Transferencia[];
  total: number;
  page: number;
  total_pages: number;
}

export interface EstadisticasTransferencias {
  total_transferencias: number;
  gasto_total_por_club: {
    club_id: string;
    club_nombre: string;
    total_gastado: number;
    total_recibido: number;
  }[];
  top_compras: Transferencia[];
  distribucion_posiciones: Record<string, number>;
  distribucion_tipos: Record<string, number>;
}
```

## 10. Archivos a Crear/Modificar

### Backend (nuevos)
- `backend/app/models/transferencia.py` — Modelo SQLAlchemy
- `backend/app/schemas/transferencia.py` — Pydantic schemas
- `backend/app/services/transferencia_service.py` — Lógica de negocio
- `backend/app/services/transferencia_rss_sync.py` — RSS scraping para transferencias
- `backend/app/api/transferencias.py` — API endpoints
- `backend/alembic/versions/008_add_transferencias.py` — Migración
- `backend/tests/test_transferencias_api.py` — Tests API
- `backend/tests/test_transferencia_service.py` — Tests servicio

### Backend (modificar)
- `backend/app/main.py` — Registrar router
- `backend/app/services/rss_sync.py` — Agregar feeds de transferencias (opcional)

### Frontend (nuevos)
- `frontend/src/app/transferencias/page.tsx` — Listado principal
- `frontend/src/app/transferencias/[id]/page.tsx` — Detalle
- `frontend/src/app/transferencias/mercado/page.tsx` — Mercado de pases
- `frontend/src/app/transferencias/historial/page.tsx` — Historial por club
- `frontend/src/app/transferencias/estadisticas/page.tsx` — Dashboard
- `frontend/src/components/transferencia/TransferCard.tsx`
- `frontend/src/components/transferencia/TransferDetail.tsx`
- `frontend/src/components/transferencia/FiltrosTransferencias.tsx`
- `frontend/src/components/transferencia/VerificationBadge.tsx`
- `frontend/src/components/transferencia/TipoBadge.tsx`
- `frontend/src/components/transferencia/MercadoTimeline.tsx`
- `frontend/src/components/transferencia/EstadisticasDashboard.tsx`

### Frontend (modificar)
- `frontend/src/types/index.ts` — Agregar tipos de transferencias
- `frontend/src/components/layout/Navbar.tsx` — Agregar link a Transferencias

## 11. GSAP Integration

- `TransferCard`: ScrollReveal con variación `slideUp` + stagger en grid
- `MercadoTimeline`: ScrollReveal con variación `slideRight` secuencial
- `EstadisticasDashboard`: CountUp para números de estadísticas
- `TransferDetail`: Fade-in de elementos al cargar
- `VerificationBadge`: Scale-in animation al aparecer

## 12. Testing

### Backend Tests
- CRUD completo de transferencias
- Filtros por club, tipo, estado, fecha, jugador
- Paginación
- Endpoint mercado de pases
- Endpoint historial por club
- Endpoint estadísticas
- Auth requirement para create/update/delete
- RSS sync (mock HTTP)
- Validaciones: club origen ≠ destino, fechas válidas

### Frontend
- Build verification (TypeScript clean)
- Page renders without errors

## 13. Secuencia de Implementación

1. Modelo + Migración DB
2. Schemas Pydantic
3. Service (CRUD + filtros + stats)
4. API Endpoints
5. RSS Sync Service
6. Tests Backend
7. Frontend Types
8. Navbar update
9. TransferCard component
10. Listado principal page
11. Detalle page
12. Mercado page
13. Historial page
14. Estadisticas page
15. GSAP animations
16. Final verification

## 14. Constraints

- **Sin dependencias nuevas** — usar librerías ya instaladas (Recharts para gráficos, GSAP para animaciones)
- **Sin datos artificiales** — el sistema empieza vacío, se carga vía admin o RSS
- **MVP funcional** — primero CRUD + listado, luego RSS + stats
- **Consistencia** — seguir patrones existentes del proyecto exactamente
