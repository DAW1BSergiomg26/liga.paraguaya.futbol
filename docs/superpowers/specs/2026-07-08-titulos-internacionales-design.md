# Títulos Internacionales de Clubes

## Problema

La página de detalle de club solo muestra títulos nacionales (`titulos_liga` con desglose en `titulos_info`). No hay visibilidad de los títulos internacionales (Copa Libertadores, Copa Sudamericana, Recopa) que los clubes paraguayos han ganado históricamente.

## Solución

Agregar un campo `titulos_internacionales` separado del existente `titulos_info`. Se renderiza en una sección destacada en la página de detalle del club.

## Cambios por capa

### Backend — Modelo (`models/club.py`)

```python
titulos_internacionales: Mapped[list] = mapped_column(JSON, default=list)
```

Columna JSON, misma estructura que `titulos_info`:

```json
[
  { "torneo": "Copa Libertadores", "cantidad": 3 },
  { "torneo": "Recopa Sudamericana", "cantidad": 1 }
]
```

### Backend — Schema (`schemas/club.py`)

```python
class ClubOut(BaseModel):
    ...
    titulos_internacionales: list = []
```

### Backend — DB init (`database.py`)

Agregar en el CREATE TABLE manual:

```python
("titulos_internacionales", "JSON NOT NULL DEFAULT '[]'"),
```

No requiere migración Alembic — es additive (nueva columna nullable → NOT NULL con default).

### Seed data (`data/clubes_paraguay.json`)

Poblado manual verificando datos históricos reales:

| Club | Libertadores | Sudamericana | Recopa | Otros |
|------|-------------|-------------|--------|-------|
| Olimpia | 3 (1979, 1990, 2002) | 0 | 1 (2003) | Supercopa 1, Intercontinental 1 |
| Cerro Porteño | 0 | 0 | 0 | — |
| Libertad | 0 | 0 | 0 | — |
| Guaraní | 0 | 0 | 0 | — |
| Resto | 0 | 0 | 0 | — |

### Seed script (`scripts/seed.py`)

Agregar lectura de `titulos_internacionales` del JSON:

```python
titulos_internacionales=item.get("titulos_internacionales", []),
```

### Frontend — Types (`types/index.ts`)

```typescript
export interface Club {
  ...
  titulos_internacionales: { torneo: string; cantidad: number }[];
}
```

### Frontend — Detail page (`clubes/[id]/page.tsx`)

Nueva sección "Títulos Internacionales" después de la grilla de datos, con estilo visual distinto:

- Fondo con un sutil acento dorado/amarillo para diferenciarlo de la sección nacional
- Cada título listado con nombre del torneo + cantidad
- Para Olimpia que tiene varios, se muestra un listado completo
- Si el club no tiene títulos internacionales, la sección no se renderiza

## Data histórica verificada

Solo **Olimpia** tiene títulos internacionales relevantes entre los clubes paraguayos actuales de Primera:

| Título | Cantidad | Años |
|--------|----------|------|
| Copa Libertadores | 3 | 1979, 1990, 2002 |
| Supercopa Sudamericana | 1 | 1990 |
| Recopa Sudamericana | 1 | 2003 |
| Copa Intercontinental | 1 | 1979 |
| Copa Interamericana | 2 | 1979, 1990 |

Cerro Porteño, Libertad, Guaraní, Nacional y el resto no tienen títulos CONMEBOL oficiales.

## No hace falta migración Alembic

La nueva columna se agrega en el CREATE TABLE condicional de `database.py`. Como es additive (nueva columna con default), no hay riesgo de romper datos existentes.

## Checklist de implementación

1. [ ] Agregar `titulos_internacionales` al modelo Club
2. [ ] Agregar al schema `ClubOut` y `ClubDetailOut`
3. [ ] Agregar al CREATE TABLE en `database.py`
4. [ ] Actualizar `scripts/seed.py`
5. [ ] Poblar `data/clubes_paraguay.json` con datos reales de Olimpia
6. [ ] Actualizar tipos TypeScript
7. [ ] Renderizar en página de detalle de club
8. [ ] Build frontend + tests backend pasando
