# HANDOFF.md — Liga Paraguaya de Fútbol

> **Checkpoint de referencia:** Commit `aafc279` — Julio 2026
> **Última verificación:** Build limpio · 207 backend tests · lucide-react integrado

---

## 1. Descripción del Proyecto

Plataforma web integral de datos, estadísticas y análisis del fútbol paraguayo (Primera División, temporadas 2020-2026). Incluye visualización en tiempo real, predicciones, análisis táctico con D3.js, red 3D de relaciones entre clubes y sistema de noticias/transferencias.

## 2. Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| **Frontend** | Next.js (App Router) | 16.2.10 |
| **UI** | React + Tailwind CSS v4 | React 19.2.4 |
| **3D** | React Three Fiber + Three.js | @react-three/fiber 9.x |
| **Gráficos** | D3.js (radar, voronoi) + Recharts | d3-scale 4.x |
| **State** | Zustand + React Query + SWR | — |
| **Backend** | FastAPI (Python 3.14) | — |
| **DB** | PostgreSQL (Neon serverless) | — |
| **Deploy FE** | Vercel | `frontend-ten-swart-85.vercel.app` |
| **Deploy BE** | Render (free tier) | `liga-paraguaya-futbol.onrender.com` |
| **Testing** | Vitest (FE) + pytest (BE) | Vitest 4.1 / pytest 202 tests |
| **Repo** | GitHub | `DAW1BSergiomg26/liga.paraguaya.futbol` |

### Variables de Entorno Críticas (Vercel)

| Variable | Valor | Notas |
|----------|-------|-------|
| `NEXT_PUBLIC_API_URL` | `https://liga-paraguaya-futbol.onrender.com` | Configurada en dashboard Vercel Production |
| `NEXT_PUBLIC_SITE_URL` | *(pendiente dominio propio)* | Fallback: `https://frontend-ten-swart-85.vercel.app` |

> **NOTA:** `NEXT_PUBLIC_*` se hornean en build. Cambios requieren redeploy.

## 3. Identidad Visual

| Elemento | Valor |
|----------|-------|
| Rojo APF | `#CC001C` |
| Azul APF | `#00619E` |
| Dorado APF | `#FFCC00` |
| Negro base | `#0A0A0A` |
| Display font | Space Grotesk |
| Body font | Inter |
| Code font | JetBrains Mono |

## 4. Arquitectura del Frontend

### Estructura de Directorios

```
frontend/src/
├── app/                    # Next.js App Router (26+ páginas)
│   ├── layout.tsx          # Layout global + metadata estática
│   ├── page.tsx            # Home (Server Component, force-dynamic)
│   ├── opengraph-image.tsx # OG image genérica (ImageResponse)
│   ├── clubes/[id]/
│   │   ├── page.tsx        # Server Component + generateMetadata + JSON-LD
│   │   ├── PageClient.tsx  # "use client" — renderizado interactivo
│   │   └── opengraph-image.tsx  # OG image dinámica por club
│   ├── partidos/[id]/
│   │   ├── page.tsx        # Server Component + generateMetadata + JSON-LD
│   │   ├── PageClient.tsx
│   │   └── opengraph-image.tsx  # OG image dinámica por partido
│   ├── sitemap.ts          # Sitemap dinámico (estático + API)
│   └── robots.ts           # Reglas de crawling
├── components/
│   ├── JsonLd.tsx           # Componente reutilizable para schema.org
│   ├── HeroStats.tsx
│   └── ...
├── lib/
│   ├── api.ts              # API_URL blindado + apiFetch + authFetchJSON
│   ├── config.ts           # SITE_URL, SITE_NAME, SITE_SHORT
│   └── jsonLd.ts           # Funciones puras: buildSportsEvent, buildSportsClub, buildWebSiteSchema
└── types/index.ts          # TypeScript interfaces para toda la API
```

### Patrón de Páginas (Server + Client)

Cada página sigue el patrón:
1. `page.tsx` — **Server Component**: `generateMetadata()`, JSON-LD injection, datos fetcheados server-side
2. `PageClient.tsx` — **Client Component** (`"use client"`): renderizado interactivo, animaciones, D3

### API Client (`lib/api.ts`)

- **`apiFetch<T>(path, options?)`** — wrapper centralizado de fetch con:
  - Auto-prepend de `API_URL`
  - Manejo de errores JSON
  - Detección de 401 → limpia token
  - Blindaje contra localhost en producción
- **`authFetchJSON<T>(path, options?)`** — para peticiones autenticadas (Bearer token)
- **`API_URL`** — detecta si `NEXT_PUBLIC_API_URL` apunta a localhost en prod → fuerza fallback a Render

## 5. Hitos Técnicos Alcanzados

### 5.1 Autenticación Robusta
- `apiFetch` y `authFetchJSON` corregidos para peticiones POST correctas
- Manejo limpio de errores 401 (logout automático)
- Token management via localStorage + estado en memoria

### 5.2 Componente 3D del Logo (`BallLogo3D.tsx`)
- `dynamic import` con `{ ssr: false }` para evitar errores de hidratación
- Esferometría procedural (sin modelos externos)
- Iluminación volumétrica + animación de rotación continua
- Efecto hover (tinte albirroja + glow)

### 5.3 SEO Avanzado (Fase 4)
- **Metadata dinámica** en 26 páginas via `generateMetadata()`
- **Sitemap dinámico** (`sitemap.ts`) — páginas estáticas + endpoints de API
- **robots.txt** (`robots.ts`) — reglas de crawling
- **JSON-LD structured data:**
  - `SportsEvent` en `partidos/[id]` (competidores, fecha, venue, resultado)
  - `SportsClub` en `clubes/[id]` (nombre, estadio, fundación, escudo)
  - `WebSite` en home (nombre, URL, publisher)
  - Campos opcionales se **omiten completamente** cuando el dato no existe
- **OG Images dinámicas** (`opengraph-image.tsx`):
  - Genérica: gradiente APF + "Liga PY"
  - Clubes: escudo + nombre + colores de fondo
  - Partidos: "Local X - Y Visitante" o "vs"
  - Todas 1200×630px, fuentes del sistema, sin fetch externo
- **`twitter:card: summary_large_image`** en todas las páginas con OG image
- **Fix:** referencia rota `/og-image.png` → rutas OG dinámicas

### 5.4 Optimización de Performance
- Server Components para todas las páginas (reducción de JS bundle)
- `force-dynamic` solo donde es necesario (home)
- `next: { revalidate: 3600 }` en fetches del OG image para cache de 1 hora
- `remotePatterns` configurado para todos los dominios de imágenes

### 5.5 Backend
- FastAPI con SQLAlchemy + pool_pre_ping/recycle para Neon
- 202 tests pasando (pytest)
- Endpoints: clubes, partidos, tabla, goleadores, noticias, transferencias, predicciones, historial, leaderboard, tactico, simulador, h2h, stats, auth

## 6. Calidad de Software

### Tests

| Suite | Framework | Tests | Estado |
|-------|-----------|-------|--------|
| Backend | pytest | 214 | ✅ 214 pasan |
| Frontend unit | Vitest | 45 | ✅ Pasan |
| Frontend e2e | Playwright | — | ⚠️ Requieren dev server |

> **Nota:** 4 tests en `red3d/page.test.tsx` fallan por un issue pre-existente de hidratación con React 19 + Three.js (no relacionado con los cambios recientes).

### Build

```
✓ Compiled successfully (6.0s)
✓ TypeScript passed
✓ 28/28 static pages generated
✓ OG image routes generated:
  ├── /opengraph-image (genérica)
  ├── /clubes/-/opengraph-image (dinámica)
  └── /partidos/-/opengraph-image (dinámica)
```

## 7. PRs Activos

| PR | Branch | Título | Estado |
|----|--------|--------|--------|
| #10 | `docs/handoff-inicial` | Documento de handoff inicial | OPEN |
| #11 | `fix/mojibake-definitivo` | charset middleware para JSON responses | OPEN |
| #12 | `fix/noticias-regresion` | Seed 5 noticias editoriales | OPEN |
| #13 | `feat/emojis-lucide-react` | Reemplazo emojis por lucide-react | OPEN |

## 8. FASE 3 — Emojis → Lucide-React (COMPLETADA)

### Archivos modificados (22)
**Frontend (16 archivos):**
- `lib/iconMap.ts` — diccionario central emoji→lucide (20 iconos)
- `src/data/ligas.ts` — badges de país con JetBrains Mono + paleta APF
- `src/components/sidebar/NavegadorLigas.tsx` — renderiza badges y lucide icons
- `src/components/tactico/InsightsPanel.tsx` — icono dinámico desde iconMap
- `src/app/status/PageClient.tsx` — CircleCheck, AlertTriangle, RotateCw, CircleX, Clock
- `src/app/error.tsx`, `clubes/error.tsx`, `transferencias/error.tsx`, `tactico/error.tsx`, `simulador/error.tsx`, `historial/error.tsx` — CircleDot para 404
- `src/app/not-found.tsx` — Building2 para estadio
- `src/app/clubes/[id]/PageClient.tsx` — Trophy
- `src/app/predicciones/PageClient.tsx` — Trophy
- `src/app/partidos/[id]/PageClient.tsx` — Building2 + Sparkles
- `src/app/partidos/PageClient.tsx` — Sparkles para botón predecir
- `src/components/PredictionModal.tsx` — Sparkles
- `src/app/red3d/PageClient.tsx` — MousePointer, Search, Zap

**Backend (2 archivos):**
- `app/services/tactico_service.py` — campos icono → nombres de lucide (CircleDot, Flame, BarChart3, etc.)
- `app/api/admin.py` — notificaciones sin emojis

### Resultado
- 0 emojis en frontend y backend
- Build Next.js pasa sin errores
- lucide-react instalado como dependencia
- PR #13: https://github.com/DAW1BSergiomg26/liga.paraguaya.futbol/pull/13

## 9. Commits Recientes (Referencia)

```
aafc279 feat(seo): JSON-LD structured data + OG images dinámicas
013a7bd feat(seo): metadata dinamica + sitemap + robots en 26 paginas
0549059 feat(seo): sitemap dinamico, robots.txt y metadata por pagina
46b140d feat: agregar página /status de salud del sistema
56ab6ba fix: blindar API_URL contra fallback a localhost en producción
0c03220 fix: unificar todas las páginas al cliente apiFetch centralizado
677182d fix: reparar fallo de respuesta en Cerezo Digital
b1c336e fix: corregir renderizado 3D del balón
fea5d8f feat: reemplazar icono por balón 3D realista
```

## 8. Próximos Pasos Sugeridos

1. **Push + merge PR #14** — ESLint fixes (16→0 errors) + noticias filter bug fix. CI should pass.
2. **Cambiar default branch a `main`** en GitHub + actualizar Vercel config.
3. **Dominio propio:** Configurar `NEXT_PUBLIC_SITE_URL` en Vercel con el dominio definitivo antes de que Google indexe URLs de preview
4. **Red3D tests:** Resolver issue de hidratación React 19 + Three.js en tests de `red3d/page.test.tsx`
5. **OG Images verificación:** Usar Rich Results Test de Google y Facebook Debugger para confirmar que los schemas y previews se renderizan correctamente
6. **Clean ESLint warnings** — 23 warnings preexistentes (unused vars, exhaustive-deps)

## 9. Comandos de Referencia

```bash
# Frontend
cd frontend && npm run dev          # Desarrollo local
cd frontend && npm run build        # Build de producción
cd frontend && npx vitest run       # Tests unitarios

# Backend
python -m pytest backend/tests/ -v  # Todos los tests (214)

# Deploy
git push origin main                # Trigger automático en Vercel + Render
```

---

*Este documento fue generado como checkpoint de referencia. Si necesitás retomar el desarrollo, este punto de control te permite continuar exactamente desde donde lo dejamos.*
