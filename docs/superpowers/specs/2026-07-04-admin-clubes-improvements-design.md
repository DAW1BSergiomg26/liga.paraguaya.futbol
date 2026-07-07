# Admin Panel + Clubes Data — Design Doc

## 1. Admin Panel — Paginación y Feedback Visual

### Backend
- Nuevo query params en `GET /api/v1/partidos`: `page` (default 1), `per_page` (default 25)
- Response: `{ data: PartidoDetailOut[], total: number, page: number, per_page: number, total_pages: number }`
- El endpoint `GET /api/v1/partidos` actual se modifica para soportar paginación
- El endpoint admin `PUT /api/v1/admin/partidos/{id}` no cambia

### Frontend — `admin/partidos/page.tsx`
- Reemplazar `.slice(0, 50)` por paginación real conectada al backend
- Navegación: `< Anterior [1] [2] [3] ... [N] Siguiente >`
- Inputs numéricos con validación (min 0, enteros)
- Toast de éxito verde "Partido actualizado ✓" con auto-dismiss 3s
- Fila editada se resalta verde tenue por 2s
- Toast de error rojo (ya existe, mantener estilo)

### Nuevo componente — `Pagination.tsx`
- Props: `page, totalPages, onPageChange`
- Renderiza botones de página + anterior/siguiente
- Deshabilita botones en extremos

## 2. Clubes — Completar Datos

### Datos
- Buscar URLs de escudos y camisetas desde Wikipedia Commons para los clubes faltantes
- Actualizar `data/clubes_paraguay.json` para todos los 12 clubes (poblar `escudo` y `camiseta`)
- El auto-seed del backend ya lee este archivo, no requiere cambios
- `ClubOut` schema del backend ya devuelve `escudo`; `ClubDetailOut` también devuelve `camiseta`
- No se modifica el type `Club` del frontend (no incluye `camiseta` por diseño)

## No Scope
- No se agregan batch operations (editar múltiples partidos)
- No se agrega autenticación más compleja que API Key
- No se modifican colores ni branding existente
