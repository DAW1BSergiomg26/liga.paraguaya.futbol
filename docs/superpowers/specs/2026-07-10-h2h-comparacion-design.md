# H2H — Comparación Head-to-Head entre dos clubes

## Resumen

Página que permite seleccionar dos clubes de la Liga Paraguaya y ver su historial
de enfrentamientos directos: resultado de cada partido, resumen estadístico global,
racha de forma y datos curiosos. Todo se calcula con datos existentes (tabla `partidos`).

## Rutas

| Ruta | Tipo | Descripción |
|------|------|-------------|
| `/h2h` | Static | Página principal con selectores y resultados |
| `/h2h?club_a=X&club_b=Y` | Static | Pre-selecciona los clubes vía query params |

Desde `/clubes/[id]` se agrega un link "Comparar" que apunta a `/h2h?club_a=[id]`.

## Backend

### Endpoint nuevo

```
GET /api/v1/partidos/h2h?club_a=<id>&club_b=<id>
```

### Schema de respuesta

```json
{
  "club_a": { "id": "...", "nombre": "...", "escudo": "..." },
  "club_b": { "id": "...", "nombre": "...", "escudo": "..." },
  "resumen": {
    "pj": 42,
    "victorias_a": 18,
    "empates": 10,
    "victorias_b": 14,
    "goles_a": 55,
    "goles_b": 48,
    "mayor_goleada_a": { "goles": 5, "fecha": "2024-03-10", "goles_b": 1 },
    "mayor_goleada_b": { "goles": 4, "fecha": "2023-08-20", "goles_a": 0 }
  },
  "partidos": [
    {
      "id": "...",
      "torneo": "Torneo Apertura 2026",
      "jornada": 5,
      "fecha": "2026-03-10",
      "estado": "finalizado",
      "goles_local": 2,
      "goles_visitante": 1,
      "local_id": "...",
      "visitante_id": "..."
    }
  ]
}
```

### Implementación

En `backend/app/api/partidos.py` agregar:

```python
@router.get("/h2h", response_model=H2HOut)
async def h2h_partidos(
    club_a: str,
    club_b: str,
    db: AsyncSession = Depends(get_db),
):
    ...
```

- Filtra partidos donde `(local_id = club_a AND visitante_id = club_b) OR viceversa`
- Ordena por fecha descendente
- Calcula resumen en Python (barrido simple de la lista)
- Usa `PartidoService.get_by_club_pair()` si se agrega, o query directa con SQLAlchemy

### Archivos a modificar

- `backend/app/api/partidos.py` — nuevo endpoint + schema `H2HOut`
- `backend/app/schemas/partido.py` — agregar `H2HOut`, `ClubResumen`, `MayorGoleada`

## Frontend

### Página `/h2h`

Componente `"use client"` en `frontend/src/app/h2h/page.tsx`.

### Funcionalidad

1. **Selectores de club** — dos `<select>` (o input con búsqueda) con la lista de todos los clubes.
   - Si llegan `club_a` / `club_b` por query params, pre-seleccionar.
   - Al cambiar cualquier selector, actualizar la URL (sin recargar, vía `useRouter`).

2. **Header comparativo** — escudos lado a lado con nombres, tipo "Olimpia vs Cerro Porteño".

3. **Tarjeta de resumen** — cuadrícula con color-coding:
   - PJ (total)
   - Victorias A (verde) / Empates (amarillo) / Victorias B (rojo)
   - Goles A / Goles B
   - Mayor goleada de cada lado

4. **Tabla de enfrentamientos** — con las mismas animaciones que `tabla/page.tsx`:
   - `animate-row-enter` con observer
   - Fecha, torneo, jornada, resultado con color
   - Enlace al detalle del partido

5. **Racha de forma** (opcional) — mostrar últimos 5 partidos de cada club (no solo entre ellos) como barras W/D/L.

### Consultas

```tsx
const { data: clubes } = useQuery<Club[]>({ queryKey: ["clubes"], queryFn: () => getClubes() });
const { data: h2h, isLoading } = useQuery({
  queryKey: ["h2h", clubA, clubB],
  queryFn: () => getH2H(clubA!, clubB!),
  enabled: !!clubA && !!clubB,
});
```

Las funciones `getH2H` se agregan a `frontend/src/lib/api.ts`.

### Archivos a crear/modificar

- `frontend/src/app/h2h/page.tsx` — página principal
- `frontend/src/lib/api.ts` — agregar `getH2H()`
- `frontend/src/types/index.ts` — agregar tipos `H2HResponse`, `ClubResumen`, `MayorGoleada`
- `frontend/src/components/layout/Navbar.tsx` — agregar link a `/h2h`

## Animaciones y estilo

- Mismas animaciones de tabla que en el resto del sitio (`animate-row-enter`, etc.)
- Escudos con `hover:scale-110 hover:-rotate-3`
- Tarjetas de resumen con fondo semitransparente y border sutil
- Diseño responsive: columnas en mobile, lado a lado en desktop

## Lo que NO incluye (futuro)

- Gráfico de barras comparativo — se puede agregar después con chart library
- Head-to-head en vivo durante un partido — requiere marcador en tiempo real
- Historial por torneo específico — solo muestra el global por ahora
