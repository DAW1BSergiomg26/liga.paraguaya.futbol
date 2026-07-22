# Reporte - Task 4: Wire real stats to homepage hero

## Estado: DONE

## Resumen

Se implementó un nuevo endpoint `GET /api/v1/stats/global` en el backend FastAPI que
devuelve conteos reales desde la base de datos, y se cableó el frontend (Server Component
`page.tsx`) para consumirlo, con fallback a los valores por defecto (348 / 892 / 19) si el
fetch falla.

## Pasos completados

1. **Test fallido** (`backend/tests/test_stats_endpoint.py`): escrito y verificado que falla
   con 404 (endpoint inexistente).
2. **Endpoint** (`backend/app/api/stats.py`): creado con lógica:
   - `total_clubes` = `count(Club.id)`
   - `total_partidos` = `sum(TablaPosicion.pj) // 2` (cada partido cuenta para 2 equipos)
   - `total_goles` = `sum(TablaPosicion.gf)`
3. **Registro del router** en `backend/app/main.py` con prefix `/api/v1/stats`.
4. **Test en verde**: 200 + campos correctos.
5. **Suite completa backend**: 195 tests pasan (≥190 requeridos).
6. **Frontend**:
   - `frontend/src/components/hero/CinematicHero.tsx`: acepta prop `stats` opcional y usa
     fallback a los defaults; valores ya no están hardcodeados en el render.
   - `frontend/src/lib/api.ts`: agregada `getGlobalStats()`.
   - `frontend/src/app/page.tsx`: fetch en paralelo vía `safeFetch`, pasa `stats` al
     `CinematicHero` con fallback, e incluye `errStats` en `hasErrors`.
7. **Build frontend**: limpio (`npm run build` OK, todas las rutas compilan).
8. **Suite backend re-ejecutada**: 195 pasan.
9. **Commit** (mensaje en español).

## Adaptaciones al brief

El brief asume que `safeFetch<T>(url)` acepta una URL string, pero el código real usa
`safeFetch(fn, fallback)` con una función. Se adaptó usando `getGlobalStats()` envuelto en
`() => getGlobalStats()` con fallback, manteniendo el comportamiento (fallback a defaults).
También se agregó `frontend/src/lib/api.ts` al commit (requerido para la implementación y no
listado explícitamente en el comando de commit del brief, pero necesario). El snippet del
brief para `CinematicHero` usaba `statsItems` con `suffix`, pero el archivo real usa un array
`stats` con `value`; se respetó la estructura existente.

## Commits

- `ec3ad8b` feat: conectar estadísticas reales de la base de datos al hero de la homepage

## Resumen de tests

Backend: 195 passed (incluido `test_stats_global_returns_200`). Frontend: build limpio sin
errores de TypeScript.

## Preocupaciones

- **Significado de `total_partidos`**: el brief define `total_partidos` como
  `sum(TablaPosicion.pj) // 2`. Esto asume que la tabla tiene una fila por club por torneo y
  que `pj` (partidos jugados) cuenta partidos por equipo. Si en algún torneo un equipo tiene
  `pj` impar (raro), el `// 2` truncaría. Es coherente con la intención del brief, pero
  depende de la integridad de los datos de `tabla_posiciones`. Si en el futuro se quiere el
  conteo exacto de partidos, sería mejor `count(Partido.id)` donde `estado='finalizado'`.
- **`HeroStats.tsx`** quedó sin cambios (no se modificó en los pasos 7-8 del brief); sus
  conteos (Clubes / Partidos / Equipos en tabla) siguen viniendo de otros fetches, lo cual es
  correcto y consistente.
- El endpoint no está detrás de autenticación ni rate-limit de API key (igual que
  `/api/v1/clubes` y otros GET públicos), lo cual es correcto para datos del hero.
