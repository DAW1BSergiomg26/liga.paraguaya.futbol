# Design Spec — Fase 3B: Voronoi Táctico de Formación

**Fecha:** 2026-07-20
**Alcance:** Voronoi MATEMÁTICO REAL calculado sobre posiciones de formación teórica (no datos de tracking real).
**Regla de honestidad:** Disclaimer visible siempre que la capa Voronoi esté activa: "Distribución teórica según formación — no representa el movimiento real de un partido."

## Contexto

El módulo táctico actual (`/tactico`) es un prototipo UI con datos 100% mock. No existen MatchEvent, TacticalAnalysis, ni datos de tracking. El alcance de Fase 3B es un Voronoi genuino calculado sobre las posiciones de formación teórica que ya existen en `FORMACIONES_POSICIONES` (6 formaciones × 11 jugadores, coordenadas x/y 0-1).

## Decisiones de implementación

### Librería: d3-delaunay (ya instalado, v6.0.4)

- Incluido como dependencia de `3d-force-graph` (~12KB)
- API: `Delaunay.from(points)` → `.voronoi([xmin, ymin, xmax, ymax])` → `.renderCell(i)` retorna path SVG string
- No instalar dependencias nuevas

### Estructura: Modificar TacticalField.tsx existente

- Agregar `useState<boolean>` para toggle Voronoi
- Calcular celdas con `d3-delaunay` en `useMemo`
- Renderizar `<svg>` como overlay CSS `absolute inset-0 pointer-events-none` sobre el campo existente
- No crear componente separado ni duplicar el dibujo de la cancha

### Ubicación del toggle

- Botón "Zonas de cobertura" en la barra de FormationSelector (misma línea)
- Toggle visible cuando hay ≥11 jugadores

### Animación: GSAP

- Mismo patrón que RadarComparativo (Fase 3A)
- Cuando cambia `formacion`, recalcular centroides y animar `d` attributes de paths SVG
- 0.4s, ease `power2.out`

## Paleta

| Elemento | Color | Opacidad |
|----------|-------|----------|
| Celdas equipo A | #CC001C (rojo APF) | 0.20 fill, 0.6 stroke |
| Celdas equipo B | #00619E (azul APF) | 0.20 fill, 0.6 stroke |
| Líneas divisorias | #FFCC00 (dorado APF) | 0.4 stroke |
| Disclaimer | Texto claro sobre fondo oscuro | Siempre visible |

## Contextos de uso

1. **Equipo individual** (`/tactico/equipo/[id]`): 11 jugadores, Voronoi muestra zonas de cobertura teórica de una formación
2. **Partido** (`/tactico/partido/[id]`): 22 jugadores (2 TacticalFields), cada uno con su propio toggle Voronoi

## Componentes afectados

| Archivo | Cambio |
|---------|--------|
| `frontend/src/components/tactico/TacticalField.tsx` | Agregar toggle + SVG overlay Voronoi + animación GSAP |
| `frontend/src/components/tactico/__tests__/voronoi.test.ts` | Tests unitarios del cálculo Voronoi |
| `frontend/e2e/voronoi-tactico.spec.ts` | Tests E2E Playwright |
