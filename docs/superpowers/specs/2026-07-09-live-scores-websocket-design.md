# Live Scores via WebSocket — Diseño

## Resumen
Sistema de scores en tiempo real para la Liga Paraguaya. Broadcasting automático cuando el admin actualiza un score + simulación de goles para partidos marcados como "en_vivo".

## Arquitectura

```
Admin panel                    Usuarios
  (PUT score)                      |
      |                            |
      v                            v
  Admin PUT → PartidoService       |
      |                            |
      v                            v
  ConnectionManager.broadcast() ───► WebSocket Sala partido_{id}
      |                            |
      v                            v
  SimulacionGolesTask       useLiveScore(partidoId)
  (asyncio, cada 60s si     actualiza React Query cache
   estado=en_vivo)           → UI re-renderiza
```

## Componentes

### Backend

1. **Mover `ConnectionManager`** de `api/chat.py` a `core/ws_manager.py` (compartido entre chat y scores)

2. **Nuevo método `broadcast_score(partido_id, data)`:**
   - Envía evento `tipo: "score_update"` a todos los clients en `partido_id`
   - Payload: `{goles_local, goles_visitante, estado, minuto, timestamp}`

3. **Modificar `admin.py`** (`PUT /api/v1/admin/partidos/{id}`):
   - Después de `PartidoService.update()`, llamar `ws_manager.broadcast_score()`
   - El minuto se calcula desde que el partido se puso `en_vivo`

4. **Nuevo `services/simulacion_goles.py`:**
   - Tarea asíncrona: cada 60s revisa partidos con `estado = "en_vivo"`
   - Calcula probabilidad de gol basada en fuerza relativa de clubes (usando `TablaPosiciones`)
   - Si hay gol: actualiza DB, llama `broadcast_score()`
   - Cada ~10 min reales (3-5 ciclos) incrementa `minuto` del partido

5. **`main.py`:** agregar `asyncio.create_task(simular_goles_background())` en startup

### Frontend

6. **Nuevo hook `useLiveScore(partidoId)`:**
   - Se conecta al mismo WebSocket que ChatWidget (comparte conexión)
   - Escucha eventos `tipo === "score_update"` y `"partido_finalizado"`
   - Actualiza cache vía `queryClient.setQueryData(["partido", partidoId], data)`
   - Invalida `["partidos"]` para refrescar lista

7. **Modificar `ChatWidget.tsx`:**
   - Exportar o compartir la instancia WS para que `useLiveScore` la reutilice
   - Pasar callback `onScoreUpdate` opcional

8. **Modificar detalle partido (`/partidos/[id]/page.tsx`):**
   - Integrar `useLiveScore` → score y badge se actualizan solos desde el cache

9. **Modificar lista partidos (`/partidos/page.tsx`):**
   - Filas de partidos `en_vivo` actualizan score sin recargar página

### Protocolo WebSocket

**Server → Client (broadcast):**
```json
{
  "tipo": "score_update",
  "partido_id": "olimpia-vs-cerro-porteno-2026-04-12",
  "goles_local": 2,
  "goles_visitante": 1,
  "estado": "en_vivo",
  "minuto": 73,
  "timestamp": "2026-07-09T17:30:00Z"
}
```

```json
{
  "tipo": "partido_finalizado",
  "partido_id": "olimpia-vs-cerro-porteno-2026-04-12",
  "goles_local": 2,
  "goles_visitante": 1,
  "minuto": 90
}
```

## Lo que NO cambia
- `ChatWidget` sigue funcionando igual
- Modelo `Partido` sin cambios (ya tiene estado y goles)
- Admin PUT existente sin cambios de interfaz
- Se reusa mismo WebSocket, misma autenticación

## Testing
- Test `broadcast_score()` en WS manager
- Test `admin.py` POST → broadcast llamado
- Test tarea simulación con partido `en_vivo` mockeado
- Test frontend: mockear WS y verificar que cache se actualiza

## Seguridad
- Solo admin autenticado via `X-API-Key` puede actualizar scores (ya existente)
- WebSocket autenticado via token (ya existente)
- Simulación solo modifica partidos `en_vivo`, no programados ni finalizados
