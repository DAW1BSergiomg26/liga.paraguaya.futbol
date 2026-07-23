# Fase 3A — Radar de Stats Comparativo (D3.js)

## Objetivo
Agregar un tab "Comparar Clubes" en la página de Estadísticas Históricas que permita seleccionar 2 clubes y mostrar un radar hexagonal (D3.js puro, SVG) con 6 métricas normalizadas.

## 1. Backend: Endpoint `GET /api/v1/historial/comparar`

### Query params
- `club_a: str` (required) — ID del club A
- `club_b: str` (required) — ID del club B

### Response schema (`ComparacionClubOut`)
```python
class MetricaRadar(BaseModel):
    ataque: float       # 0-100
    defensa: float      # 0-100
    rendimiento: float  # 0-100
    palmares: float     # 0-100
    gol_individual: float  # 0-100
    actividad_mercado: float  # 0-100

class ClubRadar(BaseModel):
    club_id: str
    nombre: str
    escudo: str | None
    metricas: MetricaRadar

class ComparacionClubOut(BaseModel):
    club_a: ClubRadar
    club_b: ClubRadar
```

### Fórmulas de normalización (todas escala 0-100)

Todas las fórmulas usan el patrón `valor / max_liga * 100` con `min(100, ...)` como cap.

1. **Ataque**: `gf_club / pj_club / max(gf_i / pj_i for all clubs) * 100`
   - Fuente: `TablaPosicion` agregada por club_id
   - Edge: pj=0 → ataque=0

2. **Defensa**: `max(0, (1 - gc_club/pj_club) / max(1 - gc_i/pj_i) * 100)`
   - Menos goles recibidos = mejor defensa
   - Edge: pj=0 → defensa=0

3. **Rendimiento**: `puntos_club / (pj_club * 3) * 100`
   - Ya es 0-100 por naturaleza (ratio puntos/puntos_posibles)
   - Edge: pj=0 → rendimiento=0

4. **Palmarés**: `titulos_club / max(titulos_i) * 100`
   - Fuente: `TablaPosicion` donde `posicion=1`, contado por club_id
   - Edge: sin títulos → palmares=0

5. **Gol Individual**: `sum(goles_jugadores_club) / max(sum(goles_i)) * 100`
   - Fuente: `Goleador` filtrado por club_id, sumado `goles`
   - Edge: sin goleadores → gol_individual=0

6. **Actividad de Mercado**: `sum(monto_transferencias_club) / max(sum(monto_i)) * 100`
   - Fuente: `Transferencia` donde `club_origen_id=club_id OR club_destino_id=club_id`
   - Solo transferencias con `monto IS NOT NULL` y `estado IN ('confirmada', 'oficial')`
   - Edge: sin transferencias → actividad_mercado=0

### Cache
- In-memory TTL cache con `time.time()` check
- TTL = 30 segundos (MVP, un solo usuario simultáneo)
- Cache key = tuple sorted de club_ids
- Invalidación automática al expirar

### Ubicación
- Schema: `backend/app/schemas/historial.py` — agregar `MetricaRadar`, `ClubRadar`, `ComparacionClubOut`
- Service: `backend/app/services/historial_service.py` — agregar método `comparar_clubes()`
- Router: `backend/app/api/historial.py` — agregar endpoint `GET /comparar`

## 2. Backend: Tests TDD

**Archivo**: `backend/tests/test_historial_comparar.py`

Tests a crear ANTES de implementar:
1. `test_comparar_clubes_normalizacion` — Verificar que las 6 métricas están en 0-100
2. `test_comparar_clubes_diferentes` — Dos clubes con stats distintos → métricas diferentes
3. `test_comparar_clubes_sin_goleadores` — Club sin goleadores → gol_individual=0
4. `test_comparar_clubes_sin_transferencias` — Club sin transferencias → actividad_mercado=0
5. `test_comparar_clubes_pj_zero` — Club con 0 partidos → ataque=defensa=rendimiento=0
6. `test_comparar_clubes_endpoint` — Test HTTP del endpoint (status 200, response shape)
7. `test_comparar_clubes_endpoint_missing_param` — Sin club_a → 422

## 3. Frontend: Componente `RadarComparativo.tsx`

### Estructura SVG
- ViewBox: `0 0 500 500` (cuadrado)
- Centro: `(250, 250)`
- Radio max: `200`
- 5 hexágonos concéntricos: 20, 40, 60, 80, 100 (radio proporcional)
- 6 ejes equiespaciados a 60° cada uno (desde arriba, en sentido horario):
  - 0° (top): Ataque
  - 60° (top-right): Defensa
  - 120° (bottom-right): Rendimiento
  - 180° (bottom): Palmarés
  - 240° (bottom-left): Gol Individual
  - 300° (top-left): Actividad de Mercado

### Colores APF
- Club A: `#CC001C` (apf-rojo) con `fill-opacity: 0.25`, `stroke-width: 2`
- Club B: `#00619E` (apf-azul) con `fill-opacity: 0.25`, `stroke-width: 2`
- Hexágonos guía: `stroke: rgba(255,255,255,0.1)`, `fill: none`
- Ejes: `stroke: rgba(255,255,255,0.15)`
- Labels: `fill: var(--color-texto-secundario)`, font-size 12px, font-weight 500
- Labels con escudo del club encima del nombre del eje

### Datos
- Input: `{ clubA: ClubRadar, clubB: ClubRadar }` (del endpoint)
- Polígono: 6 puntos calculados con `Math.sin(angle) * radius * (value/100)`
- Ángulos: `(-PI/2) + (i * PI/3)` para i=0..5 (empieza arriba, sentido horario)

### Animación GSAP
- Polígono inicia como punto central (todos los radios = 0)
- `gsap.to()` anima cada radio a su valor final
- Duración: 0.8s, ease: "power2.out"
- Actualizar el atributo `d` del `<path>` en cada frame via `gsap.quickSetter` o `onUpdate`

### Tooltip
- Hover sobre un eje muestra el valor numérico exacto
- Formato: "Ataque: 85.2"
- Tooltip posicionado con CSS absolute, fondo `bg-bg-terciario`, borde `border-borde-sutil`

## 4. Frontend: Integración en HistorialTabs

### Cambios en `HistorialTabs.tsx`
- Agregar 4to tab: `{ key: "comparar", label: "Comparar Clubes" }`

### Cambios en `historial/page.tsx`
- Importar `CompararClubes` component
- Agregar renderizado: `{tab === "comparar" && <CompararClubes />}`

### Componente `CompararClubes.tsx` (page-level wrapper)
- Dos `<select>` dropdowns para elegir club A y club B
- Cargar clubes via `getClubes()` + `useQuery`
- Botón "Comparar" (o auto-fetch al cambiar selección)
- Loading: `StatsSkeleton` o custom skeleton del radar
- Error: `ErrorMessage` existente
- Resultado: `<RadarComparativo clubA={...} clubB={...} />`

### Selección de clubes (dropdown simple)
- No reusar el modal complejo del simulador (overkill para 2 selects)
- Dos `<select>` con lista de clubes, placeholder "Seleccionar club..."
- Auto-fetch cuando ambos selects tienen valor
- Reuse de `getClubes()` API existente

## 5. Frontend: API y Types

### `src/types/index.ts`
```typescript
export interface MetricaRadar {
  ataque: number;
  defensa: number;
  rendimiento: number;
  palmares: number;
  gol_individual: number;
  actividad_mercado: number;
}

export interface ClubRadar {
  club_id: string;
  nombre: string;
  escudo: string | null;
  metricas: MetricaRadar;
}

export interface ComparacionClubesResponse {
  club_a: ClubRadar;
  club_b: ClubRadar;
}
```

### `src/lib/api.ts`
```typescript
export async function getComparacionClubes(clubA: string, clubB: string): Promise<ComparacionClubesResponse> {
  return apiFetch<ComparacionClubesResponse>(
    `/api/v1/historial/comparar?club_a=${encodeURIComponent(clubA)}&club_b=${encodeURIComponent(clubB)}`
  );
}
```

## 6. E2E Test Playwright

**Archivo**: `frontend/e2e/radar-comparativo.spec.ts`

Tests:
1. **Radar renderiza con 2 clubes** — Navegar al historial, seleccionar tab "Comparar Clubes", elegir 2 clubes, verificar que el SVG del radar tiene `<path>` elements (polígonos)
2. **Cambio de forma** — Cambiar uno de los clubes, verificar que los atributos `d` de los paths cambiaron
3. **Loading state** — Verificar que se muestra skeleton mientras carga

## 7. Archivos a crear/modificar

### Crear
- `backend/tests/test_historial_comparar.py` — Tests TDD (ANTES de implementar)
- `frontend/src/components/historial/RadarComparativo.tsx` — D3 radar SVG
- `frontend/src/components/historial/CompararClubes.tsx` — Wrapper con selects + fetch
- `frontend/e2e/radar-comparativo.spec.ts` — E2E tests

### Modificar
- `backend/app/schemas/historial.py` — Agregar `MetricaRadar`, `ClubRadar`, `ComparacionClubOut`
- `backend/app/services/historial_service.py` — Agregar `comparar_clubes()` + cache
- `backend/app/api/historial.py` — Agregar endpoint `GET /comparar`
- `frontend/src/components/historial/HistorialTabs.tsx` — Agregar tab "comparar"
- `frontend/src/app/historial/page.tsx` — Renderizar `CompararClubes`
- `frontend/src/lib/api.ts` — Agregar `getComparacionClubes()`
- `frontend/src/types/index.ts` — Agregar tipos `MetricaRadar`, `ClubRadar`, `ComparacionClubesResponse`

### No instalar
- No instalar `d3` completo — `d3-scale` (ya instalado) + trigonometría nativa es suficiente para el radar
