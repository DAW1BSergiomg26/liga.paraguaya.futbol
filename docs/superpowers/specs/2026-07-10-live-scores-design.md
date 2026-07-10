# Live Scores — Marcadores en vivo en la lista de partidos

## Resumen

Agregar un endpoint batch `/api/v1/partidos/marcadores` que devuelve scores + minuto de todos los partidos `en_vivo` en una sola request. Conectar la lista de partidos (`/partidos`) para mostrar scores y minuto en vivo sin N requests individuales.

## Backend

### Endpoint nuevo

```
GET /api/v1/partidos/marcadores
```

### Schema de respuesta

```json
{
  "<partido_id>": { "goles_local": 2, "goles_visitante": 1, "minuto": 67 },
  "<partido_id>": { "goles_local": 0, "goles_visitante": 0, "minuto": 23 }
}
```

Solo incluye partidos con `estado == "en_vivo"`. Si no hay partidos en vivo, devuelve `{}` vacío.

### Servicio

- `PartidoService.get_en_vivo(db)` — query filtrado por `estado == "en_vivo"`, reusa cálculo de minuto de `marcador_partido`

## Frontend

### Hook `useLiveScores()`

- Nuevo `hooks/useLiveScores.ts`
- Polling cada 30s a `/api/v1/partidos/marcadores`
- Devuelve `Record<string, LiveScore>` con `{goles_local, goles_visitante, minuto}`
- Reusable para otras páginas

### Cambios en `partidos/page.tsx`

- Agregar `useLiveScores()` al componente
- En filas con `estado == "en_vivo"`: reemplazar "vs" por el score del hook, mostrar minuto debajo
- Ordenar filas: `en_vivo` primero, luego `programado`, luego `finalizado`
- Badge "En vivo" animado (pulse) en la columna Estado para partidos en vivo

### Re-orden de columnas (opcional)

Sin cambios en el layout existente — solo se actualiza contenido de celdas existentes.

## No incluye

- WebSocket (polling es suficiente para 30s)
- Badge global en navbar (scope separado)
- Sonido/notificaciones
