# Sidebar de Noticias y Navegador de Ligas

## Problema

Las páginas `/tabla` y `/clubes` muestran su contenido a ancho completo, sin aprovechar el espacio horizontal en desktop. No hay forma de que el usuario descubra noticias del fútbol paraguayo ni navegue rápidamente a otras ligas internacionales. ESPN y otros portales deportivos usan un sidebar informativo que complementa el contenido principal.

## Solución

Agregar un **sidebar derecho** en las páginas `/tabla` y `/clubes` con dos secciones:

1. **Navegador de Ligas** — lista de 20 ligas/competencias internacionales con enlaces rápidos a Resultados, Posiciones y Calendario (estilo ESPN)
2. **Feed de Noticias** — últimas 5 noticias del fútbol paraguayo obtenidas vía RSS desde el backend

## Decisiones Técnicas (con por qué)

### Opción A (elegida): Ligas estáticas + RSS backend

- **Ligas hardcodeadas en JSON**: la lista de ligas internacionales es estable (Premier, LaLiga, etc.). Hardcodearlas evita DB, CRUD y carga innecesaria. Si en el futuro se necesita edición dinámica, migrar a BD es trivial.
- **RSS via feedparser**: ABC Color y Última Hora tienen RSS de deportes. El backend los parsea con `feedparser` y expone `/api/v1/noticias`. Sin scraping complejo, sin schedules, sin dependencias pesadas.
- **Frontend consume endpoint existente**: mismos patrones que el resto de la app (fetch → render). Sin librerías externas.

### No elegidas

- **Opción B (backend completo con BD)**: overkill para datos que cambian una vez por año. Agrega complejidad sin beneficio real.
- **Opción C (frontend-only con API externa)**: dependencia de servicios third-party que pueden rate-limit o desaparecer. RSS vía backend es más controlable.

## Arquitectura

```
Frontend (Next.js)
  ├── /tabla/page.tsx         ← layout con sidebar
  ├── /clubes/page.tsx        ← layout con sidebar
  └── components/sidebar/
      ├── Sidebar.tsx         ← contenedor layout del sidebar
      ├── NavegadorLigas.tsx  ← lista de ligas con links
      └── FeedNoticias.tsx    ← feed de noticias desde API

Backend (FastAPI)
  └── GET /api/v1/noticias    ← parsea RSS y devuelve JSON
```

## Layout Responsivo

| Breakpoint | Disposición |
|------------|-------------|
| ≥1024px (desktop) | `grid grid-cols-[1fr_320px]` — contenido + sidebar fijo 320px |
| 768–1023px (tablet) | sidebar debajo del contenido en 2 columnas |
| <768px (mobile) | sidebar apilada abajo |

## Diseño Visual

### Sidebar (contenedor general)
- `bg-bg-secundario` con `rounded-xl` y `border border-bordes/20`
- Padding interior 16px
- Título de sección en Barlow Condensed semibold, tamaño `text-lg`

### Navegador de Ligas
- Cada liga muestra: icono/bandera (emoji), nombre, 3 links inline: **Resultados · Posiciones · Calendario**
- Separador `hr` entre ligas
- Links a ESPN (o destino configurable)
- Hover color `text-py-rojo`

### Feed de Noticias
- Cada noticia: título en `text-sm`, fuente + timestamp en `text-xs text-texto-secundario`
- Línea decorativa izquierda: `border-l-2 border-py-rojo ml-0 pl-3`
- Links abren en nueva pestaña
- Si no hay noticias: mensaje "No hay noticias disponibles"

## Backend: Endpoint GET /api/v1/noticias

### Fuentes RSS
1. ABC Color Deportes: `https://www.abc.com.py/rss/deportes.xml`
2. Última Hora Deportes: `https://www.ultimahora.com/rss/deportes.xml`

### Response format

```json
{
  "noticias": [
    {
      "titulo": "Olimpia gana el clásico",
      "fuente": "ABC Color",
      "url": "https://...",
      "pub_date": "2026-07-10T14:30:00Z",
      "resumen": "En un partido vibrante..."
    }
  ],
  "fuentes": ["ABC Color", "Última Hora"],
  "actualizado": "2026-07-10T15:00:00Z"
}
```

### Implementación
- `feedparser` parsea los RSS al recibir la request (sin cache inicial)
- Máximo 5 noticias, combinando ambas fuentes, ordenadas por fecha descendente
- Timeout 10s por fuente, si una falla se ignora
- En el futuro se puede agregar caching (Redis o archivo) para no golpear los RSS en cada request

## Componentes Frontend

### Sidebar.tsx
- Componente `"use client"`
- Renderiza `NavegadorLigas` arriba y `FeedNoticias` abajo
- Maneja estado de carga y error del feed

### NavegadorLigas.tsx
- Componente server component (datos estáticos)
- Importa ligas desde `src/data/ligas.ts`
- Renderiza lista responsive con tailwind

### FeedNoticias.tsx
- Componente `"use client"`
- Fetch a `/api/v1/noticias` en `useEffect`
- Estados: loading (Skeleton), error (mensaje), empty (placeholder), data (lista)

## Archivos a modificar/crear

| Archivo | Acción |
|---------|--------|
| `frontend/src/data/ligas.ts` | Crear — lista estática de 20 ligas mundiales |
| `frontend/src/components/sidebar/Sidebar.tsx` | Crear — layout del sidebar |
| `frontend/src/components/sidebar/NavegadorLigas.tsx` | Crear — navegador de ligas |
| `frontend/src/components/sidebar/FeedNoticias.tsx` | Crear — feed de noticias |
| `frontend/src/app/tabla/page.tsx` | Modificar — agregar layout grid con sidebar |
| `frontend/src/app/clubes/page.tsx` | Modificar — agregar layout grid con sidebar |
| `backend/app/api/routes.py` o nuevo `backend/app/api/noticias.py` | Crear/modificar — endpoint GET /api/v1/noticias |
| `backend/requirements.txt` | Modificar — agregar `feedparser` |

## No incluído (futuro)

- Caching de RSS (Redis o file-based)
- Edición de ligas desde admin
- Múltiples fuentes de noticias configurables
- Sidebar en otras páginas (/partidos, /)
