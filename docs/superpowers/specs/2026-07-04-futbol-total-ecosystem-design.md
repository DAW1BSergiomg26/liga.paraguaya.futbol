# Fútbol Total Ecosystem — Design Doc

**Fecha:** 2026-07-04
**Proyecto:** Liga Paraguaya de Fútbol
**Objetivo:** Transformar el sitio de datos estáticos en una plataforma social, interactiva y extensible alrededor del fútbol paraguayo.

---

## Visión General

Evolución en 4 fases progresivas, cada una construyendo sobre la anterior:

| Fase | Nombre | Valor principal |
|------|--------|----------------|
| 1 | Live Predictions + OAuth | Engagement social inmediato |
| 2 | Chat en Vivo + Notificaciones | Pertenencia y comunidad |
| 3 | API Pública + Analytics IA | Reach externo + diferenciación técnica |
| 4 | Fantasy League + PWA | Retención a largo plazo + producto completo |

---

## Stack Técnico

| Capa | Tecnología | Estado |
|------|-----------|--------|
| Frontend | Next.js 14+ (App Router) | ✅ Existente |
| Backend | FastAPI + SQLAlchemy async | ✅ Existente |
| DB | PostgreSQL (Railway) | ✅ Existente |
| Auth | NextAuth.js (Auth.js) v5 | ➕ Nuevo |
| WebSockets | FastAPI nativos | ➕ Nuevo |
| Push | Web Push API + VAPID | ➕ Nuevo |
| ML | scikit-learn (Python) | ➕ Nuevo (Fase 3) |
| Cache | Redis opcional (para WS scaling) | ➕ Opcional |

---

## Fase 1: Live Predictions + OAuth

### Modelo de Datos

```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    image TEXT DEFAULT '',
    username TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
    puntos INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE predictions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    partido_id TEXT NOT NULL REFERENCES partidos(id),
    goles_local INTEGER NOT NULL,
    goles_visitante INTEGER NOT NULL,
    puntos INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, partido_id)
);
```

### Sistema de Puntuación

| Condición | Puntos |
|-----------|--------|
| Resultado exacto (goles local y visitante correctos) | 3 |
| Ganador correcto (local gana, empate, o visitante gana acertado) | 2 |
| Participación (predijo) | 1 |
| Streak bonus (+1 por cada 5 aciertos consecutivos) | 1 |

El puntaje máximo por partido es 3. Los puntos se asignan cuando el partido pasa a `finalizado`.

### Flujo UX

1. Usuario ingresa con Google/GitHub (OAuth vía NextAuth.js)
2. En `/partidos`, cada partido programado muestra botón "🔮 Predecir"
3. Modal simple: `[Local] [__] vs [__] [Visitante]`
4. En `/perfil` o `/predicciones`: historial, puntos, racha, leaderboard
5. Leaderboard global en `/leaderboard` con tabla: pos, usuario, pts, aciertos, racha

### Endpoints Nuevos

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/v1/predicciones/mis` | Predicciones del usuario actual |
| POST | `/api/v1/predicciones` | Crear/actualizar predicción |
| GET | `/api/v1/leaderboard` | Leaderboard global |
| GET | `/api/v1/leaderboard?torneo=X` | Leaderboard por torneo |

---

## Fase 2: Chat en Vivo + Notificaciones

### WebSockets

```
ws://backend/api/v1/ws/partidos/{partido_id}
```

Autenticación via token JWT en query param. Mensajes broadcast:
- Nuevo mensaje de chat
- Gol / cambio de estado del partido
- Conexión/desconexión de usuarios

### Notificaciones Push

| Evento | Disparador |
|--------|-----------|
| Gol en partido activo | Webhook al actualizar resultado |
| Recordatorio predicción | Cron job 30 min antes del partido |
| Resultado de predicción | Al marcar partido como finalizado |
| Logro/Streak | Al calcular puntos de predicción |
| Leaderboard | Cron semanal |

Backend: `web-push` npm library con VAPID keys. Frontend: Service Worker + Push API.

---

## Fase 3: API Pública + Analytics IA

### API Pública

- Endpoints gratuitos sobre datos existentes + predicciones agregadas
- Autenticación via API Key (generada en `/developers`)
- Docs interactivas generadas automáticamente
- Rate limiting progresivo

### Analytics IA

- Modelo scikit-learn: predice resultados basado en historial, localía, rachas
- Simulador de tabla: "¿qué pasa si...?" recalcula posiciones finales
- Comparador head-to-head de 2 clubes con gráficos

---

## Fase 4: Fantasy League + PWA

### Fantasy League

- Plantilla con presupuesto limitado
- Puntúa por rendimiento real de los clubes
- Mercado de fichajes entre jornadas
- Ligas privadas con amigos

### PWA

- manifest.json + service worker
- Offline: últimas predicciones, leaderboard cacheados
- Instalable en celular

---

## Principios de Diseño

1. **Seguir patrones existentes:** Mismo estilo oscuro, mismo stack
2. **Sin nuevas dependencias pesadas:** NextAuth.js, web-push, scikit-learn. Nada más.
3. **Cada fase es independiente:** Se puede deployar Fase 1 sin esperar Fase 2
4. **Backwards compatible:** La API existente no se rompe
5. **Testing:** Tests existentes siguen pasando; nuevas funcionalidades con nuevos tests

---

## Roadmap de Implementación

1. **Fase 1** (~2 semanas): Auth + predicciones + leaderboard + notificaciones básicas
2. **Fase 2** (~1 semana): Chat WebSocket + push notifications completo
3. **Fase 3** (~1 semana): API pública + analytics ML + simulador
4. **Fase 4** (~2 semanas): Fantasy league + PWA

Cada fase incluye tests backend + typecheck frontend antes de merge.
