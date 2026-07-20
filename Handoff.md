# HANDOFF.md — liga.paraguaya.futbol

> **Versión del documento:** 2.0 — Julio 2026
> **Última actualización:** 2026-07-19 (commit `22b524f`, rama `main`)
> **Propósito:** Documento maestro para que cualquier IA o desarrollador pueda entender el proyecto completo y continuar el trabajo desde cero en cualquier plataforma.

---

## 1. Descripción del Proyecto

**liga.paraguaya.futbol** es una plataforma web integral para el seguimiento de la **Primera División paraguaya de fútbol** (Liga APF). Ofrece datos en vivo, predicciones gamificadas, chat por partido, noticias con RSS, análisis táctico con IA, un motor de simulación probabilística, transferencias con verificación de fuentes, estadísticas históricas desde 2020, y una red de rivalidades 2D/3D.

### Contexto
- **Proyecto académico** del equipo DAW1BSergiomg26 (desarrollado con IA como co-piloto).
- **Presupuesto:** $0 — sin planes de pago en hosting, servicios gratuitos.
- **Idioma de la interfaz:** Español paraguayo.
- **Idioma del código:** Nomenclatura e identificadores en inglés, comentarios en español.
- **Comunicación del usuario:** Siempre en castellano (sin excepción).

### URLs de Producción
| Servicio | URL |
|----------|-----|
| Frontend (Vercel) | `https://ligaparaguayafutbol-ebbsksgys-daw1bsergiomg26s-projects.vercel.app` |
| Frontend (alias) | `https://frontend-ten-swart-85.vercel.app` |
| Backend (Render) | `https://liga-paraguaya-futbol.onrender.com` |
| Repo (GitHub) | `https://github.com/DAW1BSergiomg26/liga.paraguaya.futbol` |

---

## 2. Alcance del Proyecto

### 2.1 Lo que YA ESTÁ desarrollado (producción activa)

| Módulo | Estado | Descripción |
|--------|--------|-------------|
| **Tabla de Posiciones** | ✅ Producción | Tabla en tiempo real con 19 clubes, paginación, ordenamiento |
| **Clubes** | ✅ Producción | Listado + detalle enriquecido (escudo, estadio, historia, títulos) |
| **Partidos** | ✅ Producción | Listado paginado, detalle, marcadores en vivo, H2H |
| **Predicciones** | ✅ Producción | Sistema gamificado (3 pts exacto, 2 tendencia, 1 cercano), leaderboard |
| **Autenticación JWT** | ✅ Producción | Registro/login con email+contraseña, tokens de 7 días, roles admin |
| **Chat en Vivo** | ✅ Producción | WebSocket por partido, historial paginado |
| **Notificaciones Push** | ✅ Producción | Service Worker + VAPID, suscripción/desuscripción |
| **Goleadores** | ✅ Producción | Ranking por torneo + ranking histórico acumulado, podio animado |
| **Noticias** | ✅ Producción | CRUD + sync RSS (6 fuentes), filtros, búsqueda, grid responsive |
| **Transferencias** | ✅ Producción | CRUD + RSS sync (5 fuentes), mercado, historial por club, estadísticas |
| **Historial** | ✅ Producción | Campeones por torneo, ranking all-time, rendimiento por club (2020-2026) |
| **Cerezo Digital (IA)** | ✅ Producción | Chatbot con clasificación de intents, extracción de entidades, templates + tiny LLM opcional |
| **Análisis Táctico IA** | ✅ Producción | Formaciones, stats comparativas, predicciones IA (datos mock para 18 equipos) |
| **Simulador Probabilístico** | ✅ Producción | Motor Poisson, layout Visual VS, modal selector, top 3 resultados exactos |
| **Red de Clubes 3D** | ✅ Producción | Grafo híbrido 2D/3D con 19 nodos, rivalidades, mercado de fichajes, tooltips |
| **SEO + PWA** | ✅ Producción | Meta tags completos, OpenGraph, manifest, service worker, theme-color |
| **Error Boundaries** | ✅ Producción | Error global + 404 amigable |
| **Lazy Loading** | ✅ Producción | Imágenes optimizadas con `next/image` |
| **GSAP Experience** | ✅ Producción | Hero cinematográfico, ScrollReveal, CountUp, TiltCard, page transitions |
| **API Pública** | ✅ Producción | API Keys con rate limiting (100 req/60s) |
| **Admin Panel** | ✅ Producción | Gestión de resultados, API keys, noticias, transferencias |
| **Football-Data.org** | ✅ Producción | Sync automático cada 600s (competicion PA1), fallback a datos demo |

### 2.2 Lo que NO está en alcance (descartado explícitamente)

| Elemento | Razón de descarte |
|----------|-------------------|
| **Planes de pago** | El usuario no quiere gastar dinero en hosting |
| **Railway** | Descartado definitivamente (sin free tier útil) |
| **Koyeb** | Descartado (cambios en plataforma) |
| **OAuth social (Google/GitHub login)** | No implementado; solo email+password |
| **App móvil nativa** | PWA alcanza; no hay plan para React Native/Flutter |
| **Video análisis real** | El módulo táctico usa datos mock, no video processing |
| **Pagos/marketplace** | No hay componente económico en la plataforma |
| **Multi-idioma (i18n)** | Solo español; no hay sistema de traducción |
| **Tests E2E completos** | Playwright configurado pero no hay suite E2E exhaustiva |
| **CDN de imágenes propias** | Se usan imágenes de fuentes externas (Wikimedia, ABC, etc.) |
| **Dominio propio** | Se usa el subdominio de Vercel; no hay dominio custom |
| **Monitoreo/APM** | No hay Datadog, Sentry, o similar configurado |

### 2.3 Nice-to-have (deseable pero no bloqueante)

| Feature | Prioridad | Notas |
|---------|-----------|-------|
| Dominio personalizado (`liga.paraguaya.futbol`) | Media | Requiere compra de dominio |
| Dark/Light mode toggle | Baja | Actualmente solo dark mode |
| PWA install prompt personalizado | Baja | El browser lo maneja nativamente |
| Optimización Lighthouse 90+ | Media | Actualmente ~70-80 estimado |
| Social share cards individuales por partido | Baja | OG image dinámica |
| Filtrado avanzado de noticias por categoría | Baja | Solo filtrado por fuente y búsqueda |
| Test coverage frontend > 80% | Media | Actualmente bajo |
| WebSocket para partidos en vivo (no solo chat) | Alta | Actualmente polling por HTTP |

---

## 3. Limitaciones Técnicas y de Diseño

### 3.1 Limitaciones de Infraestructura
- **Vercel Free Tier:** Build time limitado, serverless functions con cold start.
- **Render Free Tier:** El backend se "duerme" tras 15 min de inactividad; primer request toma ~30s.
- **Neon Postgres Free Tier:** 0.5 GB de almacenamiento, compute suspendido por inactividad.
- **Sin WebSocket persistente en Render:** El chat usa WebSocket pero Render no garantiza persistencia de conexiones.

### 3.2 Limitaciones de Datos
- **Football-Data.org:** Free tier limita a ~10 requests/minuto; el sync cada 600s es conservador.
- **Datos tácticos MOCK:** El módulo de análisis táctico usa datos hardcoded, no datos reales de jugadores.
- **Goleadores:** Datos seedeados desde JSON local; no hay sync automático desde API externa.
- **Transferencias:** RSS sync captura "rumores" sin verificación automática; requiere revisión manual.
- **Historial:** Solo tablas finales por temporada (2020-2026), no resultados fecha por fecha.

### 3.3 Limitaciones de Seguridad
- **JWT secret efímero:** Si no se setea `JWT_SECRET` en env, se genera uno random al cada restart (tokens invalidados).
- **API Key middleware opcional:** Si no se envía `X-API-Key`, la request pasa igual.
- **Sin rate limiting por IP:** Solo rate limiting por API key.
- **Sin CORS strict:** El middleware CORS refleja dinámicamente cualquier `*.vercel.app`.

### 3.4 Limitaciones de Diseño
- **Solo dark mode:** No hay light mode ni toggle.
- **Mobile-first incompleto:** Algunas pantallas (táctico, admin) no están optimizadas para móvil.
- **Sin sistema de diseño formal:** No hay Storybook, ni tokens de diseño documentados como design tokens.
- **Sin accesibilidad auditada:** Solo básicos `aria-label` en el simulador; no hay auditoría WCAG completa.
- **Fuentes limitadas:** Solo Inter + Barlow Condensed (no hay flexibilidad tipográfica).

---

## 4. Requisitos Obligatorios vs. Nice-to-Have

### 4.1 Requisitos Obligatorios (Must-Have)
| # | Requisito | Estado |
|---|-----------|--------|
| R1 | Frontend desplegado y accesible públicamente | ✅ |
| R2 | Backend con API REST funcional y documentada | ✅ |
| R3 | Base de datos con datos reales de la liga paraguaya | ✅ |
| R4 | Autenticación de usuarios (registro + login) | ✅ |
| R5 | Sistema de predicciones gamificado | ✅ |
| R6 | Tabla de posiciones en tiempo real | ✅ |
| R7 | Información de clubes (19 equipos) | ✅ |
| R8 | Resultados de partidos | ✅ |
| R9 | HTTPS en frontend y backend | ✅ |
| R10 | Responsive design (funcional en móvil y desktop) | ✅ Parcial |
| R11 | SEO básico (meta tags, OG, sitemap) | ✅ |
| R12 | Error handling graceful (no errores 500 visibles) | ✅ |

### 4.2 Nice-to-Have (deseable)
| # | Feature | Estado |
|---|---------|--------|
| N1 | Chat en vivo por partido | ✅ Implementado |
| N2 | Notificaciones push | ✅ Implementado |
| N3 | Noticias con sync RSS | ✅ Implementado |
| N4 | Transferencias con verificación | ✅ Implementado |
| N5 | Estadísticas históricas | ✅ Implementado |
| N6 | Análisis táctico con IA | ✅ Implementado (mock) |
| N7 | Simulador probabilístico | ✅ Implementado |
| N8 | Red de rivalidades 3D | ✅ Implementado |
| N9 | PWA (instalable) | ✅ Implementado |
| N10 | Animaciones cinematográficas (GSAP) | ✅ Implementado |
| N11 | API pública con keys | ✅ Implementado |
| N12 | Chatbot IA (Cerezo) | ✅ Implementado |

---

## 5. User Journeys y Flujos

### 5.1 Flujo Principal — Usuario Casual
```
Landing Page (/)
  → Explora clubes (/clubes)
  → Ve tabla de posiciones (/tabla)
  → Revisa partidos (/partidos)
  → Ve goleadores (/goleadores)
  → Lee noticias (/noticias)
```

### 5.2 Flujo — Usuario Registrado
```
Login (/login)
  → Crea predicciones (/predicciones)
  → Ve leaderboard (/leaderboard)
  → Chatea en partido (/partidos/[id])
  → Recibe notificaciones push
  → Ve perfil (/perfil)
```

### 5.3 Flujo — Explorador de Datos
```
Home → Red 3D (/red3d)
  → Explora rivalidades (modo Rivalidades)
  → Explora fichajes (modo Mercado)
  → Click en nodo → detalle de club

Home → Simulador (/simulador)
  → Selecciona 2 clubes
  → Ve probabilidades Poisson
  → Ve top 3 resultados exactos

Home → Historial (/historial)
  → Tablas por año (2020-2026)
  → Ranking agregado
  → Rendimiento por club
```

### 5.4 Flujo — Analista Táctico
```
Táctico (/tactico)
  → Selecciona equipo
  → Ve formación, jugadores, stats
  → Analiza tendencias e insights
  → Compara con rival (partido específico)
```

### 5.5 Flujo — Transferencias
```
Transferencias (/transferencias)
  → Filtros por club, tipo, estado, fechas
  → Click en transferencia → detalle
  → Mercado reciente (/transferencias/mercado)
  → Historial por club (/transferencias/historial)
  → Estadísticas con gráficos (/transferencias/estadisticas)
```

### 5.6 Flujo — Admin
```
Admin (/admin)
  → Actualiza resultados de partidos
  → Gestiona API keys
  → Crea/edita/borra noticias
  → Crea/edita/borra transferencias
  → Trigger de sync RSS
```

---

## 6. Sistema de Diseño

### 6.1 Paleta de Colores

#### Colores Principales — Bandera Paraguaya
| Token | Variable CSS | Hex | Uso |
|-------|-------------|-----|-----|
| `py-rojo` | `--color-py-rojo` | `#D52B1E` | Rojo paraguayo, acentos primarios |
| `py-rojo-oscuro` | `--color-py-rojo-oscuro` | `#A11D14` | Rojo hover/active states |
| `py-azul` | `--color-py-azul` | `#0038A8` | Azul paraguayo, links, info |
| `py-azul-oscuro` | `--color-py-azul-oscuro` | `#001F5C` | Azul hover/oscuro |
| `py-blanco` | `--color-py-blanco` | `#FFFFFF` | Texto sobre oscuro |

#### Colores de Fondo (Dark Mode)
| Token | Hex | Uso |
|-------|-----|-----|
| `bg-primario` | `#0A0E1A` | Fondo principal de página |
| `bg-secundario` | `#10162B` | Cards, paneles, superficies elevadas |
| `bg-terciario` | `#1A2140` | Hover states, elementos interactivos |
| `bg-noche` | `#05070F` | Fondo más oscuro (footer, modales) |

#### Colores de Texto
| Token | Hex | Uso |
|-------|-----|-----|
| `texto-principal` | `#F5F6FA` | Texto principal, títulos |
| `texto-secundario` | `#9AA3C0` | Texto secundario, descripciones |
| `texto-apagado` | `#5C6690` | Labels, placeholders, texto deshabilitado |

#### Semáforo de Resultados
| Token | Hex | Uso |
|-------|-----|-----|
| `victoria` | `#16C784` | Victoria, positivo, éxito |
| `empate` | `#F2B90C` | Empate, advertencia, neutral |
| `derrota` | `#E5484D` | Derrota, error, negativo |

#### Acentos
| Token | Hex | Uso |
|-------|-----|-----|
| `dorado-medalla` | `#D4AF37` | Podio de goleadores, logros, títulos |

#### Bordes
| Token | Valor | Uso |
|-------|-------|-----|
| `borde-sutil` | `rgba(255, 255, 255, 0.08)` | Bordes de cards, separadores |
| `borde-marca` | `rgba(213, 43, 30, 0.35)` | Bordes de acento rojo |

#### Colores Adicionales (Hero/APF)
| Color | Hex | Uso |
|-------|-----|-----|
| APF Gold | `#FFCC00` | Dorado APF en hero |
| APF Red | `#CC001C` | Rojo APF (theme-color PWA) |

### 6.2 Tipografías

| Familia | Pesos | Uso | Variable CSS |
|---------|-------|-----|-------------|
| **Inter** | 400, 500, 600 | Body text, UI, párrafos | Fuente por defecto (sans-serif) |
| **Barlow Condensed** | 400, 600, 700 | Títulos, headlines, display | `--font-barlow-condensed` |

**Jerarquía tipográfica:**
- `text-4xl/5xl font-barlow` → Títulos de página (hero)
- `text-2xl/3xl font-barlow` → Subtítulos de sección
- `text-xl font-semibold` → Títulos de card
- `text-base` → Párrafos, contenido
- `text-sm` → Labels, metadata
- `text-xs` → Badges, timestamps

### 6.3 Espaciados y Layout

- **Container principal:** `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
- **Grid de cards:** `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
- **Espaciado entre secciones:** `py-12 md:py-20`
- **Padding de cards:** `p-6`
- **Border radius de cards:** `rounded-xl` (12px)
- **Border radius de badges:** `rounded-full`
- **Border radius de botones:** `rounded-lg` (8px)

### 6.4 Estados de Componentes

#### Botones
| Estado | Estilo |
|--------|--------|
| Default | `bg-py-rojo text-white hover:bg-py-rojo-oscuro` |
| Disabled | `opacity-50 cursor-not-allowed` |
| Loading | Spinner + texto "Cargando..." |
| Ghost | `bg-transparent border border-borde-sutil hover:bg-bg-terciario` |

#### Cards
| Estado | Estilo |
|--------|--------|
| Default | `bg-bg-secundario border border-borde-sutil rounded-xl` |
| Hover | `hover:border-borde-marca hover:shadow-lg` (TiltCard en desktop) |
| Loading | Skeleton con `animate-pulse bg-bg-terciario` |
| Error | `border-derrota/50 bg-derrota/5` |

#### Inputs
| Estado | Estilo |
|--------|--------|
| Default | `bg-bg-terciario border border-borde-sutil text-texto-principal` |
| Focus | `focus:border-py-rojo focus:ring-1 focus:ring-py-rojo` |
| Error | `border-derrota focus:border-derrota` |
| Disabled | `opacity-50 bg-bg-secundario` |

### 6.5 Animaciones y Transiciones

| Animación | Tecnología | Uso |
|-----------|------------|-----|
| ScrollReveal | GSAP ScrollTrigger | Entrada de elementos al hacer scroll |
| CountUp | GSAP ScrollTrigger | Números animados (stats, goleadores) |
| TiltCard | GSAP + mousemove | Efecto 3D hover en cards (desktop) |
| Page Transitions | Framer Motion | Fade + slide entre páginas |
| Pulse Líder | CSS keyframes | Brillo dorado en fila de líder de tabla |
| Shine | CSS keyframes | Efecto de brillo en badges |
| Ball Orbit | CSS keyframes | Animación de balón en hero |
| Trophy Float | CSS keyframes | Trofeo flotante en hero |
| Ambient Glow | CSS keyframes | Glow ambiental en secciones |
| Hero Gold Flicker | CSS keyframes | Parpadeo dorado en hero |

### 6.6 Componentes UI Existentes

| Componente | Archivo | Descripción |
|------------|---------|-------------|
| `ScrollReveal` | `components/ui/ScrollReveal.tsx` | Wrapper con animación de entrada (5 variantes: fadeUp, fadeIn, slideLeft, slideRight, scale) |
| `CountUp` | `components/ui/CountUp.tsx` | Número animado de 0 a valor final con ScrollTrigger |
| `TiltCard` | `components/ui/TiltCard.tsx` | Card con efecto 3D perspective al hacer hover |
| `ClubCard` | `components/ui/ClubCard.tsx` | Card de club con escudo, nombre, ciudad |
| `Skeleton` | `components/ui/Skeleton.tsx` | Placeholder de carga con animate-pulse |
| `LoadingSpinner` | `components/ui/LoadingSpinner.tsx` | Spinner de carga centrado |
| `ErrorMessage` | `components/ui/ErrorMessage.tsx` | Banner de error con retry |
| `PageHeader` | `components/ui/PageHeader.tsx` | Encabezado de página con título y descripción |
| `SmartImage` | `components/ui/SmartImage.tsx` | Wrapper de `next/image` con fallback |
| `Navbar` | `components/layout/Navbar.tsx` | Navegación responsive con menú hamburguesa |
| `Footer` | `components/layout/Footer.tsx` | Pie de página |
| `StripesBackground` | `components/layout/StripesBackground.tsx` | Rayas paraguayas animadas con GSAP |
| `CinematicHero` | `components/hero/CinematicHero.tsx` | Hero full-screen con SplitType + sparticles |

---

## 7. Pantallas — Estado Actual y Diseño Futuro

### 7.1 Home `/`
**Estado actual:**
- Hero cinematográfico full-screen con GSAP SplitType reveal, sparticles, contadores animados (clubes, partidos, goleadores)
- Sección de estadísticas con CountUp
- Links de navegación a secciones principales

**Diseño futuro (Nivel Pro):**
- Hero con video background de goles destacados
- Carrusel de partidos próximos con countdown
- Widget de predicción del día
- Feed de noticias destacadas en home
- Tabla de posiciones mini (top 5) embebida

### 7.2 Clubes `/clubes` y `/clubes/[id]`
**Estado actual:**
- Grid responsive de 19 clubes con TiltCard + ScrollReveal
- Escudos reales locales (19 PNGs)
- Página de detalle con toda la info (estadio, fundación, títulos, descripción)

**Diseño futuro (Nivel Pro):**
- Galería de fotos del estadio
- Historial de títulos interactivo (timeline)
- Comparador de 2 clubes lado a lado
- Stats en vivo del club (goles, posicionamiento)

### 7.3 Partidos `/partidos` y `/partidos/[id]`
**Estado actual:**
- Lista paginada de partidos con filtro por torneo y estado
- Detalle con marcador, equipos, fecha, jornada
- Chat en vivo por partido (WebSocket)
- H2H entre dos clubes

**Diseño futuro (Nivel Pro):**
- Vista de calendario (no solo lista)
- Timeline de eventos del partido (goles, tarjetas, cambios)
- Live commentary con actualizaciones en tiempo real
- Comparación pre-partido con stats de ambos equipos

### 7.4 Tabla de Posiciones `/tabla`
**Estado actual:**
- Tabla completa con 19 clubes, PJ/PG/PE/PP/GF/GC/DG/Pts
- Filtro por torneo
- Animación de entrada por fila, glow dorado para el líder
- Datos reales de Neon (133 filas históricas)

**Diseño futuro (Nivel Pro):**
- Gráfico de evolución de posiciones (line chart por jornada)
- Forma reciente (W/D/L) por equipo
- Comparación de stats avanzadas (xG, posesión, etc.)

### 7.5 Goleadores `/goleadores`
**Estado actual:**
- Tabs: "Por torneo" / "Ranking histórico"
- Podio top-3 con animación dorada (🥇🥈🥉 + glow)
- Barras de progreso animadas con CountUp
- Filtro por torneo

**Diseño futuro (Nivel Pro):**
- Gráfico de evolución de goles por jornada
- Comparación goleador vs goleador
- Filtros por posición, club, rango de goles
- Top asistentes separado

### 7.6 Predicciones `/predicciones`
**Estado actual:**
- Formulario de predicción (goles local/visitante)
- Lista de mis predicciones con resultado real
- Sistema de puntos (3 exacto, 2 tendencia, 1 cercano)

**Diseño futuro (Nivel Pro):**
- Predicción con un click (resultado: local/empate/visitante)
- Predicción avanzada (goles exactos) como opción
- Historial de predicciones con gráfico de aciertos
- Predicciones de la comunidad (consenso)

### 7.7 Leaderboard `/leaderboard`
**Estado actual:**
- Ranking global de usuarios por puntos
- Muestra: username, nombre, imagen, puntos, aciertos, predicciones

**Diseño futuro (Nivel Pro):**
- Tabla animada con cambio de posiciones
- Badges de logros (10 predicciones exactas, racha de 5, etc.)
- Filtro por temporada
- Perfil público de usuario

### 7.8 Noticias `/noticias` y `/noticias/[id]`
**Estado actual:**
- Grid responsive de noticias con NoticiaCard
- Filtros por fuente y búsqueda por título
- Sync RSS automático (6 fuentes paraguayas)
- Detalle de noticia con imagen, contenido, fuente

**Diseño futuro (Nivel Pro):**
- Categorías: Fútbol, Transferencias, Opinión, Internacional
- News feed en tiempo real
- Noticias destacadas fijas en home
- Comentarios en noticias

### 7.9 Transferencias `/transferencias`
**Estado actual:**
- CRUD completo con filtros avanzados (club, tipo, estado, fechas, jugador)
- Mercado reciente (últimos 30 días)
- Historial por club
- Estadísticas con gráficos Recharts (pie por tipo/posición, bar por club)
- RSS sync (5 fuentes) con verificación de nivel

**Diseño futuro (Nivel Pro):**
- Timeline de mercado de fichajes
- Mapa de calor de movimientos por club
- Alertas de nuevas transferencias
- Comparación de inversión por club vs rendimiento

### 7.10 Historial `/historial`
**Estado actual:**
- 3 tabs: Tablas por año (2020-2026), Ranking agregado, Rendimiento por club
- Recharts: bar chart de títulos, line chart de posición por temporada
- Datos de 7 temporadas con seed automático

**Diseño futuro (Nivel Pro):**
- Timeline interactivo de campeones
- Comparación de rendimiento entre eras
- Estadísticas avanzadas por década

### 7.11 Red de Clubes `/red3d`
**Estado actual:**
- Grafo híbrido 2D/3D con detección automática de dispositivo
- Modo Rivalidades (clásicos, grosor = historia)
- Modo Mercado de Fichajes (pases, grosor = inversión)
- Tooltips con títulos, intl, conexiones
- Auto-centrado, botón "Centrar todo", panel detalles
- ErrorBoundary3D con auto-revert a 2D
- WebGL detection

**Diseño futuro (Nivel Pro):**
- Modo tercero: "Flujo de jugadores" (transferencias entre clubes)
- Animación de nodos al cambiar de modo
- Click en arista → detalle de rivalidad/fichaje
- Filtro por temporada

### 7.12 Simulador `/simulador`
**Estado actual:**
- Layout Visual VS (paneles enfrentados Local/VS/Visitante)
- Modal selector de clubes con grilla 19 clubes + buscador
- Motor Poisson PMF con matrix 7×7
- Barras de probabilidad animadas
- Top 3 resultados exactos con probabilidad
- Accesibilidad: aria-label, role=dialog, focus trap, Escape

**Diseño futuro (Nivel Pro):**
- Simulación de temporada completa (todas las jornadas)
- Monte Carlo con 1000 iteraciones
- Gráfico de distribución de goles
- Comparación de simulaciones (equipo A vs B en 10 partidos)

### 7.13 Cerezo Digital `/cerezo`
**Estado actual:**
- Chat UI con burbujas de mensajes
- Clasificación de intents por keywords (10 intents)
- Extracción de entidades (clubes, fechas, torneos)
- Respuestas basadas en datos reales de la DB
- Predicciones H2H
- Template-based responses + tiny LLM opcional (Llama 3.2 1B)

**Diseño futuro (Nivel Pro):**
- Integración con LLM más potente (GPT-4, Claude)
- Sugerencias rápidas ("¿Quién juega hoy?", "¿Cómo va Olimpia?")
- Respuestas con gráficos embebidos
- Historial de conversaciones

### 7.14 Táctico `/tactico`
**Estado actual:**
- Selección de equipo con formaciones disponibles
- Campo táctico con posiciones de jugadores (SVG)
- Panel de stats comparativas
- Insights tácticos con iconos
- Análisis de partido (local vs visitante)
- Predicción IA del resultado

**Diseño futuro (Nivel Pro):**
- Datos reales de jugadores (no mock)
- Animación de jugadas tácticas
- Heatmap de posesión
- Análisis en tiempo real durante el partido

### 7.15 Login `/login`
**Estado actual:**
- Formulario email + contraseña
- Registro y login
- JWT token en localStorage (`user_token`)

**Diseño futuro (Nivel Pro):**
- OAuth social (Google)
- Recuperación de contraseña
- Verificación de email

### 7.16 Admin `/admin`
**Estado actual:**
- Gestión de resultados de partidos (PUT)
- CRUD de API keys
- Acceso protegido por admin API key

**Diseño futuro (Nivel Pro):**
- Dashboard con métricas (usuarios activos, predicciones, etc.)
- Gestión de noticias desde UI
- Gestión de transferencias desde UI
- Gestión de clubes desde UI
- Logs de actividad

---

## 8. Assets Exportables

### 8.1 Escudos de Clubes (`frontend/public/escudos/`)
19 PNGs mapeados 1:1 en `src/lib/escudos.ts` → `ESCUDOS_LOCALES`:

| Archivo | Club |
|---------|------|
| `olimpia.png` | Club Olimpia |
| `cerro-porteno.png` | Cerro Porteño |
| `libertad.png` | Club Libertad |
| `guarani.png` | Club Guaraní |
| `nacional.png` | Club Nacional |
| `sol-de-america.png` | Sol de América |
| `luqueno.png` | Sportivo Luqueño |
| `ameliano.png` | Sportivo Ameliano |
| `2-de-mayo-logo-footylogos.png` | 2 de Mayo |
| `san-lorenzo.png` | San Lorenzo |
| `general-caballero.png` | General Caballero JLM |
| `colegiales.png` | Colegiales |
| `recoleta.png` | Recoleta |
| `rubio-nu.png` | Rubio Ñú |
| `tembetary.png` | Atlético Tembetary |
| `trinidense.png` | Sportivo Trinidense |
| `general-diaz.png` | General Díaz |
| `capiata.png` | Deportivo Capiatá |
| `3-de-febrero.png` | 3 de Febrero |

**Uso en código:** `import { escudoUrl } from '@/lib/escudos'` → `<Image src={escudoUrl(club.id)} />`

### 8.2 Imágenes Públicas (`frontend/public/`)
| Archivo | Descripción | Uso |
|---------|-------------|-----|
| `favicon.svg` | Favicon SVG | `<link rel="icon">` |
| `manifest.json` | PWA manifest | Instalación PWA |
| `sw.js` | Service Worker | Push notifications + caché |
| `fondoweb.png` | Fondo de web | Backgrounds |
| `albirroparaguay.png` | Imagen Albirroja | Decorativa |
| `MaparaParaguayAlbirroja.svg` | SVG Albirroja | Decorativa |
| `ParaguayAlbirroja.svg` | SVG Albirroja | Decorativa |
| `data/red-clubes.json` | Datos de red | Grafo 2D/3D (19 nodos, 24 links) |

### 8.3 Datos Exportables (`data/`)
| Archivo | Contenido | Uso |
|---------|-----------|-----|
| `clubes_paraguay.json` | 19 clubes con datos enriquecidos | Seed de clubes |
| `partidos_demo.json` | Partidos demo | Seed de partidos |
| `tabla_posiciones_demo.json` | Tabla de posiciones | Seed de standings |
| `goleadores_demo.json` | Goleadores | Seed de goleadores |
| `transferencias_demo.json` | Transferencias | Seed de transferencias |
| `partidos_historicos/temporada_2020-2026.json` | 7 temporadas históricas | Seed de historial |
| `export/*.json` | 10 archivos exportados de SQLite | Migración a Neon |

### 8.4 Imágenes Externas (referenciadas vía `next/image` remotePatterns)
Dominios permitidos en `next.config.ts`:
- `upload.wikimedia.org` — logos de clubes
- `abc.com.py`, `apf.org.py` — noticias
- `espn.com.py`, `lanacion.com.py`, `telefuturo.com.py` — noticias
- `ui-avatars.com` — avatares de usuarios
- `img.lega.it`, `images.unsplash.com` — decorativas
- Y más (ver `next.config.ts` para lista completa)

---

## 9. Stack Tecnológico Completo

### 9.1 Frontend
| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | Next.js (App Router) | 16.2.10 |
| UI Library | React | 19.2.4 |
| Language | TypeScript | ^5 |
| CSS | Tailwind CSS v4 | ^4 (CSS-based config, sin `tailwind.config.*`) |
| State Management | TanStack Query | ^5.101.2 |
| Global State | Zustand | ^5.0.14 |
| Forms | React Hook Form + Zod | ^7.81.0 / ^4.4.3 |
| Animations | GSAP + Framer Motion | ^3.15.0 / ^12.42.2 |
| 3D | Three.js + React Three Fiber + 3d-force-graph | ^0.185.1 / ^9.6.1 / ^1.80.0 |
| Charts | Recharts + D3 | ^3.9.2 / ^3.2.4 |
| Scroll | Lenis | ^1.3.25 |
| Testing | Vitest + Testing Library + Playwright | ^4.1.10 / ^16.3.2 / ^1.61.1 |
| Linting | ESLint + Biome | ^9 / ^2.5.3 |

### 9.2 Backend
| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | FastAPI | >=0.115.0 |
| Server | Uvicorn | >=0.30.0 |
| ORM | SQLAlchemy (async) | >=2.0.0 |
| Validation | Pydantic v2 | >=2.0.0 |
| DB Driver (dev) | aiosqlite | >=0.20.0 |
| DB Driver (prod) | asyncpg | >=0.30.0 |
| Migrations | Alembic | >=1.13.0 |
| Auth | python-jose + passlib + bcrypt | JWT + bcrypt |
| HTTP Client | httpx | >=0.27.0 |
| RSS | feedparser | >=6.0.0 |
| Push | pywebpush | >=1.0.0 |
| HTML Parse | selectolax | >=0.3.0 |
| Testing | pytest + pytest-asyncio + respx | >=8.0.0 |
| Language | Python | 3.12 (Docker) |

### 9.3 Infraestructura
| Servicio | Proveedor | Configuración |
|----------|-----------|---------------|
| Frontend Hosting | Vercel | Free tier, auto-deploy desde `main` |
| Backend Hosting | Render | Free tier, Docker, Web Service |
| Base de Datos | Neon Postgres | Free tier, 0.5 GB, us-east-1 |
| Repositorio | GitHub | `DAW1BSergiomg26/liga.paraguaya.futbol` |
| CI/CD | Vercel (frontend) + Render (backend) | Auto-deploy on push to `main` |

### 9.4 Docker
```dockerfile
# Backend (Dockerfile.backend)
FROM python:3.12-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8001
CMD uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8001}

# Frontend (Dockerfile.frontend) — multi-stage
FROM node:20-slim AS builder
# ... build stage
FROM node:20-slim AS runner
# ... production stage con .next standalone
```

---

## 10. Estructura del Proyecto

```
liga.paraguaya.futbol/
├── backend/
│   ├── alembic/                    # 8 migraciones (001-008)
│   │   ├── versions/
│   │   │   ├── e89293bef80c_initial_tables.py
│   │   │   ├── 6fbc92ce284a_add_club_fields_and_temporada.py
│   │   │   ├── 003_add_api_keys.py
│   │   │   ├── 004_add_goleadores.py
│   │   │   ├── 005_add_user_password.py
│   │   │   ├── 006_add_noticias_table.py
│   │   │   ├── 007_add_user_admin.py
│   │   │   └── 008_add_transferencias.py
│   │   └── env.py
│   ├── app/
│   │   ├── api/                    # 18 routers FastAPI
│   │   │   ├── admin.py            # CRUD resultados + API keys
│   │   │   ├── auth.py             # Register + Login + Me
│   │   │   ├── cerezo.py           # Chatbot IA
│   │   │   ├── chat.py             # WebSocket chat por partido
│   │   │   ├── clubes.py           # Listado + detalle
│   │   │   ├── cron.py             # Recordatorios push
│   │   │   ├── goleadores.py       # Ranking + historial
│   │   │   ├── health.py           # Health check
│   │   │   ├── historial.py        # Estadísticas históricas
│   │   │   ├── leaderboard.py      # Ranking usuarios
│   │   │   ├── noticias.py         # CRUD + RSS sync
│   │   │   ├── notificaciones.py   # Push subscribe/unsubscribe
│   │   │   ├── partidos.py         # CRUD + H2H + marcadores
│   │   │   ├── predicciones.py     # Crear + listar predicciones
│   │   │   ├── simulator.py        # Simulación Poisson
│   │   │   ├── tabla.py            # Posiciones + torneos
│   │   │   ├── tactico.py          # Análisis táctico
│   │   │   └── transferencias.py   # CRUD + mercado + stats
│   │   ├── core/
│   │   │   ├── api_key.py          # Rate limiter por API key
│   │   │   ├── config.py           # Settings (Pydantic BaseSettings)
│   │   │   ├── database.py         # Engine async + Alembic + init_db
│   │   │   ├── dependencies.py     # get_db, get_current_user, get_current_admin
│   │   │   └── security.py         # JWT + bcrypt
│   │   ├── models/                 # 11 SQLAlchemy models
│   │   │   ├── club.py             # Club (19 registros)
│   │   │   ├── goleador.py         # Goleador
│   │   │   ├── mensaje_chat.py     # MensajeChat
│   │   │   ├── noticia.py          # Noticia
│   │   │   ├── partido.py          # Partido
│   │   │   ├── prediction.py       # Prediction
│   │   │   ├── push_subscription.py # PushSubscription
│   │   │   ├── tabla.py            # TablaPosicion
│   │   │   ├── transferencia.py    # Transferencia
│   │   │   ├── user.py             # User
│   │   │   └── api_key.py          # APIKey
│   │   ├── schemas/                # 14 archivos Pydantic v2
│   │   ├── scripts/
│   │   │   └── seed.py             # Seed automático al startup
│   │   ├── services/               # 18 servicios + 5 Cerezo sub-services
│   │   │   ├── cerezo/             # AI chatbot (classifier, extractor, fetcher, predictor, generator)
│   │   │   ├── chat_service.py
│   │   │   ├── club_service.py
│   │   │   ├── football_config.py
│   │   │   ├── football_data_service.py
│   │   │   ├── football_mapper.py
│   │   │   ├── goleador_service.py
│   │   │   ├── historial_service.py
│   │   │   ├── noticia_service.py
│   │   │   ├── partido_service.py
│   │   │   ├── prediction_service.py
│   │   │   ├── push_service.py
│   │   │   ├── rss_sync.py
│   │   │   ├── simulator_service.py
│   │   │   ├── tabla_service.py
│   │   │   ├── tactico_service.py
│   │   │   ├── transferencia_rss_sync.py
│   │   │   ├── transferencia_service.py
│   │   │   └── user_service.py
│   │   └── main.py                 # Entry point + lifespan + routers
│   ├── scripts/                    # Scrapers (Wikipedia, RSSSF)
│   ├── tests/                      # 39 archivos, 140+ tests
│   ├── Dockerfile
│   ├── requirements.txt
│   └── requirements-optional.txt
├── frontend/
│   ├── public/
│   │   ├── escudos/                # 19 PNGs de escudos
│   │   ├── data/red-clubes.json    # Grafo de rivalidades
│   │   ├── manifest.json           # PWA manifest
│   │   └── sw.js                   # Service Worker
│   ├── src/
│   │   ├── app/                    # 29 páginas/rutas
│   │   │   ├── layout.tsx          # Root layout + metadata SEO + PWA
│   │   │   ├── page.tsx            # Home (CinematicHero)
│   │   │   ├── template.tsx        # Page transitions (Framer Motion)
│   │   │   ├── error.tsx           # Error Boundary global
│   │   │   ├── not-found.tsx       # 404 amigable
│   │   │   ├── loading.tsx         # Loading global
│   │   │   ├── providers.tsx       # TanStack Query provider
│   │   │   ├── globals.css         # Tailwind v4 @theme + CSS vars + keyframes
│   │   │   ├── admin/              # Admin panel
│   │   │   ├── cerezo/             # Chatbot IA
│   │   │   ├── clubes/             # Listado + [id]
│   │   │   ├── goleadores/         # Ranking
│   │   │   ├── h2h/                # Head to Head
│   │   │   ├── historial/          # Estadísticas históricas
│   │   │   ├── leaderboard/        # Ranking usuarios
│   │   │   ├── login/              # Auth
│   │   │   ├── noticias/           # Listado + [id]
│   │   │   ├── partidos/           # Listado + [id]
│   │   │   ├── perfil/             # Perfil usuario
│   │   │   ├── predicciones/       # Predicciones
│   │   │   ├── red3d/              # Red 2D/3D
│   │   │   ├── simulador/          # Simulador Poisson
│   │   │   ├── tabla/              # Posiciones
│   │   │   ├── tactico/            # Análisis táctico + [equipo] + [partido]
│   │   │   └── transferencias/     # Listado + [id] + mercado + historial + estadísticas
│   │   ├── components/             # 56 componentes
│   │   │   ├── hero/CinematicHero.tsx
│   │   │   ├── layout/ (Navbar, Footer, StripesBackground)
│   │   │   ├── ui/ (ScrollReveal, CountUp, TiltCard, ClubCard, Skeleton, etc.)
│   │   │   ├── noticia/ (NoticiaCard, NoticiaGrid, FiltrosNoticias)
│   │   │   ├── sidebar/ (Sidebar, FeedNoticias, NavegadorLigas)
│   │   │   ├── red3d/ (Graph3D, Red2DFallback)
│   │   │   ├── tactico/ (TacticalField, StatsPanel, StatCard, PlayerDot, InsightsPanel, FormationSelector)
│   │   │   ├── transferencia/ (TransferCard, VerificationBadge, TipoBadge, FiltrosTransferencias, MercadoStats, EstadisticasDashboard)
│   │   │   ├── cerezo/ (ClubCard, ComparisonCard, H2HCard, MatchFormCard, MiniTableCard, NextMatchCard, PredictionCard, RichCardRouter)
│   │   │   ├── historial/ (HistorialTabs, TablaPorAnio, RankingAgregado, RendimientoClub)
│   │   │   └── (ChatWidget, ChatMessage, PredictionModal, PushSetup, Pagination, HeroStats, GoleadoresList, GoleadoresHistorial)
│   │   ├── hooks/ (useIsMobile, useLiveScore, useLiveScores, useTactico, useTacticoPartido)
│   │   ├── lib/ (api.ts, escudos.ts, gsap.ts, html.ts)
│   │   ├── types/index.ts
│   │   └── data/ligas.ts
│   ├── package.json
│   ├── next.config.ts
│   ├── tsconfig.json
│   ├── postcss.config.mjs
│   ├── vercel.json
│   └── vitest.config.ts
├── data/                           # Datos seed y exports
├── docs/superpowers/               # Specs y planes de diseño
├── img/                            # Imágenes de referencia
├── scripts/                        # Scripts auxiliares
├── docker-compose.yml              # Dev: backend + frontend
├── Dockerfile.backend
├── Dockerfile.frontend
├── render.yaml                     # Blueprint Render
├── Handoff.md                      # Este documento
└── README.md
```

---

## 11. API Endpoints (53 totales)

### 11.1 Health
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/health` | Health check |

### 11.2 Clubes
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/v1/clubes` | Listar todos (filtro por ciudad) |
| `GET` | `/api/v1/clubes/{club_id}` | Detalle de club |

### 11.3 Partidos
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/v1/partidos` | Listar (paginado, filtro torneo/estado) |
| `GET` | `/api/v1/partidos/marcadores` | Marcadores en vivo |
| `GET` | `/api/v1/partidos/h2h` | Head to head (query: club_a, club_b) |
| `GET` | `/api/v1/partidos/{partido_id}` | Detalle de partido |
| `GET` | `/api/v1/partidos/{partido_id}/marcador` | Marcador de un partido |

### 11.4 Tabla
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/v1/tabla` | Tabla de posiciones |
| `GET` | `/api/v1/tabla/torneos` | Lista de torneos |

### 11.5 Auth
| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/v1/auth/register` | Registrar usuario |
| `POST` | `/api/v1/auth/login` | Login |
| `GET` | `/api/v1/auth/me` | Perfil del usuario actual |

### 11.6 Predicciones
| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/v1/predicciones` | Crear predicción (auth) |
| `GET` | `/api/v1/predicciones/mis` | Mis predicciones (auth) |

### 11.7 Leaderboard
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/v1/leaderboard` | Ranking de usuarios |

### 11.8 Goleadores
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/v1/goleadores` | Goleadores por torneo |
| `GET` | `/api/v1/goleadores/historial` | Ranking histórico |

### 11.9 Historial
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/v1/historial/campeones` | Campeones por torneo |
| `GET` | `/api/v1/historial/ranking-clubes` | Ranking all-time |
| `GET` | `/api/v1/historial/club/{club_id}` | Historial de un club |

### 11.10 Transferencias
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/v1/transferencias` | Listar (filtros avanzados, paginado) |
| `GET` | `/api/v1/transferencias/mercado` | Mercado reciente |
| `GET` | `/api/v1/transferencias/estadisticas` | Estadísticas |
| `GET` | `/api/v1/transferencias/historial/{club_id}` | Historial por club |
| `GET` | `/api/v1/transferencias/{id}` | Detalle |
| `POST` | `/api/v1/transferencias` | Crear (admin) |
| `PUT` | `/api/v1/transferencias/{id}` | Actualizar (admin) |
| `DELETE` | `/api/v1/transferencias/{id}` | Eliminar (admin) |
| `POST` | `/api/v1/transferencias/sync-rss` | Sync RSS (admin) |

### 11.11 Noticias
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/v1/noticias` | Listar (paginado, filtro fuente, búsqueda) |
| `GET` | `/api/v1/noticias/{id}` | Detalle |
| `POST` | `/api/v1/noticias` | Crear (admin) |
| `PUT` | `/api/v1/noticias/{id}` | Actualizar (admin) |
| `DELETE` | `/api/v1/noticias/{id}` | Eliminar (admin) |
| `POST` | `/api/v1/noticias/sync-rss` | Sync RSS (admin) |

### 11.12 Cerezo (Chatbot IA)
| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/v1/cerezo/ask` | Preguntar al chatbot |

### 11.13 Táctico
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/v1/tactico/equipos` | Listar equipos |
| `GET` | `/api/v1/tactico/equipo/{equipo_id}` | Análisis táctico de equipo |
| `GET` | `/api/v1/tactico/partido/{partido_id}` | Análisis de partido |

### 11.14 Chat
| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/v1/partidos/{partido_id}/chat` | Historial de chat |
| `WS` | `/api/v1/ws/partidos/{partido_id}` | WebSocket chat |

### 11.15 Notificaciones
| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/v1/notificaciones/suscribir` | Suscribir (auth) |
| `DELETE` | `/api/v1/notificaciones/suscribir` | Desuscribir (auth) |
| `GET` | `/api/v1/notificaciones/vapid-public-key` | Obtener clave pública VAPID |

### 11.16 Simulador
| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/v1/simulador/prediccion` | Simulación Poisson |

### 11.17 Admin
| Método | Ruta | Descripción |
|--------|------|-------------|
| `PUT` | `/api/v1/admin/partidos/{partido_id}` | Actualizar resultado (admin) |
| `POST` | `/api/v1/admin/api-keys` | Crear API key (admin) |
| `GET` | `/api/v1/admin/api-keys` | Listar API keys (admin) |
| `PATCH` | `/api/v1/admin/api-keys/{key_id}/toggle` | Toggle API key (admin) |
| `DELETE` | `/api/v1/admin/api-keys/{key_id}` | Eliminar API key (admin) |

### 11.18 Cron
| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/v1/cron/recordatorios` | Enviar recordatorios push |

---

## 12. Modelos de Datos (SQLAlchemy)

### 12.1 Club (`clubes`)
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | String(50) | **PK** |
| `nombre` | String(100) | |
| `ciudad` | String(100) | |
| `apodo` | String(100) | |
| `colores` | JSON | Lista de strings |
| `estadio` | String(150) | |
| `capacidad` | Integer | default=0 |
| `fundacion` | Integer | default=1900 |
| `direccion` | String(200) | |
| `escudo` | String(500) | URL remota (fallback) |
| `camiseta` | String(500) | URL de camiseta |
| `sitio_web` | String(500) | |
| `descripcion` | String(2000) | |
| `titulos_liga` | Integer | default=0 |
| `titulos_info` | JSON | Lista de info de títulos |
| `titulos_internacionales` | JSON | Lista de títulos internacionales |

### 12.2 Partido (`partidos`)
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | String(50) | **PK** |
| `torneo` | String(100) | |
| `fecha` | Date | |
| `jornada` | Integer | default=1 |
| `temporada` | String(20) | default="2026" |
| `local_id` | String(50) | **FK → clubes.id** |
| `visitante_id` | String(50) | **FK → clubes.id** |
| `goles_local` | Integer | nullable |
| `goles_visitante` | Integer | nullable |
| `estado` | String(20) | "programado" / "en_vivo" / "finalizado" |

### 12.3 User (`users`)
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | String(50) | **PK** |
| `email` | String(200) | **UNIQUE** |
| `name` | String(200) | |
| `image` | String(500) | default="" |
| `username` | String(100) | **UNIQUE** |
| `provider` | String(50) | default="google" |
| `provider_id` | String(200) | |
| `token` | String(100) | Legacy token |
| `hashed_password` | String(256) | nullable |
| `is_admin` | Boolean | default=False |
| `puntos` | Integer | default=0 |
| `created_at` | DateTime | default=UTC now |

### 12.4 Prediction (`predictions`)
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | String(50) | **PK** |
| `user_id` | String(50) | **FK → users.id** |
| `partido_id` | String(50) | **FK → partidos.id** |
| `goles_local` | Integer | |
| `goles_visitante` | Integer | |
| `puntos` | Integer | default=0 |
| `created_at` | DateTime | |

**Constraints:** `Unique(user_id, partido_id)`

### 12.5 TablaPosicion (`tabla_posiciones`)
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | Integer | **PK** (autoincrement) |
| `torneo` | String(100) | |
| `jornada` | Integer | default=1 |
| `club_id` | String(50) | **FK → clubes.id** |
| `posicion` | Integer | |
| `pj`, `pg`, `pe`, `pp` | Integer | Partidos jugados/ganados/empatados/perdidos |
| `gf`, `gc`, `dg` | Integer | Goles a favor/contra/diferencia |
| `puntos` | Integer | |

### 12.6 Noticia (`noticias`)
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | String(50) | **PK** (UUID) |
| `titulo` | String(500) | NOT NULL |
| `resumen` | Text | nullable |
| `contenido` | Text | nullable |
| `imagen_url` | String(1000) | nullable |
| `video_url` | String(500) | nullable |
| `fuente` | String(100) | NOT NULL |
| `origen` | String(20) | "editorial" / "rss" |
| `url_original` | String(1000) | nullable |
| `pub_date` | DateTime | NOT NULL |
| `created_at` | DateTime | |
| `is_published` | Boolean | default=True |

### 12.7 Transferencia (`transferencias`)
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | String(50) | **PK** (UUID) |
| `jugador_nombre` | String(200) | NOT NULL |
| `jugador_posicion` | String(50) | nullable |
| `club_origen_id` | String(50) | **FK → clubes.id**, nullable |
| `club_destino_id` | String(50) | **FK → clubes.id**, NOT NULL |
| `fecha` | Date | NOT NULL |
| `tipo` | String(20) | "compra" / "prestamo" / "libre" / "cesion" / "refuerzo" |
| `estado` | String(20) | "confirmada" / "rumor" / "oficial" / "desmentida" |
| `monto` | Float | nullable |
| `duracion_meses` | Integer | nullable |
| `fuente_url` | String(1000) | nullable |
| `fuente_nombre` | String(100) | nullable |
| `verification_level` | Integer | 1-5, default=3 |
| `is_active` | Boolean | default=True |

### 12.8 Goleador (`goleadores`)
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | String(50) | **PK** |
| `nombre` | String(100) | |
| `club_id` | String(50) | **FK → clubes.id** |
| `goles` | Integer | default=0 |
| `asistencias` | Integer | default=0 |
| `torneo` | String(100) | |
| `temporada` | String(20) | |
| `updated_at` | DateTime | |

### 12.9 MensajeChat (`mensajes_chat`)
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | String | **PK** |
| `partido_id` | String | **FK → partidos.id** (indexed) |
| `user_id` | String | **FK → users.id** |
| `mensaje` | Text | NOT NULL |
| `created_at` | DateTime | |

### 12.10 APIKey (`api_keys`)
| Campo | Tipo | Notas |
|-------|------|-------|
| `key` | String(36) | **PK** (UUID) |
| `owner` | String(255) | |
| `email` | String(255) | |
| `is_active` | Boolean | default=True |
| `requests_count` | Integer | default=0 |
| `created_at` | DateTime | |
| `last_used_at` | DateTime | nullable |

### 12.11 PushSubscription (`push_subscriptions`)
| Campo | Tipo | Notas |
|-------|------|-------|
| `id` | String | **PK** |
| `user_id` | String | **FK → users.id** |
| `endpoint` | Text | NOT NULL |
| `p256dh` | String | NOT NULL |
| `auth` | String | NOT NULL |
| `created_at` | DateTime | |

---

## 13. Variables de Entorno

### 13.1 Backend (Render — secrets en dashboard)
```bash
DATABASE_URL=postgresql://<user>:<pass>@<host>/neondb   # SIN ?sslmode (asyncpg lo rechaza)
JWT_SECRET=<generado en Render>
ADMIN_API_KEY=<seteado en Render>
CORS_ORIGINS=http://localhost:3000,https://frontend-ten-swart-85.vercel.app,https://ligaparaguayafutbol-ebbsksgys-daw1bsergiomg26s-projects.vercel.app
FOOTBALL_DATA_API_KEY=  # Opcional — sin ella el sync es no-op
```

### 13.2 Frontend (Vercel — Environment Variables)
```bash
NEXT_PUBLIC_API_URL=https://liga-paraguaya-futbol.onrender.com
NEXT_PUBLIC_SITE_URL=https://ligaparaguayafutbol-ebbsksgys-daw1bsergiomg26s-projects.vercel.app
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
```

### 13.3 Regla Crítica
> Las variables `NEXT_PUBLIC_*` se **incrustan en el build** de Vercel, NO en runtime. Si se cambia una, hay que hacer **redeploy** (no alcanza con guardarla). Nunca dejar fallback a un backend muerto en el código.

---

## 14. Workflow de Desarrollo

### 14.1 Convenciones
- **Idioma:** El usuario se comunica en castellano. Responder SIEMPRE en español.
- **Código:** Nomenclatura e identificadores en inglés, comentarios en español.
- **TypeScript:** Estricto, sin `any`.
- **Rama:** Todo el trabajo va directo a `main`. No crear branches de feature salvo indicación.
- **Commits:** Mensajes cortos en español. No commitear secrets.
- **Testing:** Backend: `pytest` (140+ tests). Frontend: `npm run build` (TypeScript check).
- **Skills:** Usar `brainstorming` antes de features, `systematic-debugging` antes de bugs.

### 14.2 Reglas de Automatización (aplicar en cada cambio)
1. **SSL/asyncpg:** NO incluir `?sslmode=` ni `ssl=true` en strings de conexión.
2. **Rutas de DB/seed:** Rutas absolutas basadas en `Path(__file__)`.
3. **Handoff:** Mantener actualizado con arquitectura oficial.
4. **Tipos/imports:** Chequeo estricto de imports duplicados y `"use client"` antes de cerrar componentes.

### 14.3 Para Correr Local
```bash
# Backend
cd backend
pip install -r requirements.txt
$env:PYTHONPATH=".."
python -m uvicorn backend.app.main:app --reload --port 8000

# Frontend
cd frontend
npm install
npx next dev

# O ambos con Docker
docker compose up --build
```

### 14.4 Launchers (Windows)
- `iniciar.bat` — Panel CMD que abre backend (:8000) y frontend (:3000)
- `iniciar.ps1` — Igual pero en PowerShell

---

## 15. Tests

### 15.1 Backend (140+ tests)
```bash
cd backend
$env:PYTHONPATH=".."
python -m pytest tests/ -v
```

| Archivo | Tests | Qué cubre |
|---------|-------|-----------|
| `test_clubes.py` | 5 | Listar, detalle, filtrar |
| `test_partidos.py` | 5 | Listar, detalle, paginación |
| `test_tabla.py` | 1 | Obtener tabla |
| `test_predicciones.py` | 7 | Login, predicciones, leaderboard, puntos |
| `test_chat_push.py` | 8 | Chat CRUD, push subscribe/unsubscribe |
| `test_scraper_base.py` | 4 | Fetch, cache, rate limit, HTML parse |
| `test_scraper_clubes.py` | 2 | Parse Wikipedia, enrich JSON |
| `test_scraper_historico.py` | 3 | Parse RSSSF, alias, múltiples tablas |
| `test_seed_historico.py` | 3 | Insert, dedup, sin archivos |
| `test_admin.py` | 5 | Update partido, validación, API Key |
| `test_cron.py` | 2 | Cierre automático de predicciones |
| `test_api_key.py` | 8 | CRUD, rate limiting, admin endpoints |
| `test_cerezo_*.py` | 22 | Chatbot IA completo (6 archivos) |
| `test_noticias_api.py` | 8 | CRUD noticias, filtros, admin |
| `test_rss_sync.py` | 2 | RSS parse + sync |
| `test_tactical_analysis.py` | 5 | Análisis táctico |
| `test_transferencias_api.py` | 11 | CRUD transferencias, filtros, auth, mercado |
| `test_deploy_readiness.py` | 4 | Deploy readiness checks |
| `test_historial_api.py` | — | Estadísticas históricas |
| `test_goleadores_api.py` | 3 | Agrupación histórica |

### 15.2 Frontend
```bash
cd frontend
npm run build          # Verifica TypeScript + build
npx vitest run         # Tests unitarios
npx playwright test    # Tests E2E
```

### 15.3 Deploy Readiness
```bash
cd backend
$env:PYTHONPATH=".."
python -m pytest tests/test_deploy_readiness.py -v
# 4 tests: _async_url, sync_loop no-op, health check
```

---

## 16. Deploy y Despliegue

### 16.1 Arquitectura Oficial en Producción
```
┌─────────────┐     HTTPS      ┌──────────────────┐     asyncpg    ┌──────────────┐
│   Vercel    │ ──────────────→│  Render (Docker) │ ─────────────→│ Neon Postgres │
│  Frontend   │                │    Backend       │                │     DB       │
│  Next.js 16 │                │   FastAPI        │                │  PostgreSQL  │
└─────────────┘                └──────────────────┘                └──────────────┘
     ↑ autosync desde `main`        ↑ Docker build                    ↑ 0.5 GB free
```

### 16.2 Datos en Producción (Neon)
| Tabla | Registros |
|-------|-----------|
| clubes | 19 |
| partidos | 348 |
| tabla_posiciones | 133 |
| goleadores | 16 |
| transferencias | 14 |
| noticias | 30 |
| users | 1 |
| **Total** | **561** |

### 16.3 Incidentes Resueltos (historial)
1. **Render apuntaba a rama equivocada** → Cambiar Settings→Branch a `main`
2. **Vercel sin `NEXT_PUBLIC_API_URL`** → Setear env var + redeploy
3. **`/api/v1/tabla/torneos` 500** → Fix `torneo=NULL` en `TablaService`
4. **CORS bloqueando frontend** → Middleware personalizado que refleja `*.vercel.app`
5. **`datetime` naive/aware** → Migración a `datetime.now(timezone.utc)`

---

## 17. Documentación de Diseño (specs)

Toda en `docs/superpowers/`:

| Spec | Archivo |
|------|---------|
| Arquitectura general | `docs/arquitectura.md` |
| Diseño inicial + rearchitecture | `specs/2026-07-02-liga-paraguaya-rearchitecture-design.md` |
| Deploy Vercel + Railway | `specs/2026-07-03-deploy-vercel-railway-design.md` |
| Admin clubes improvements | `specs/2026-07-04-admin-clubes-improvements-design.md` |
| Fútbol Total ecosystem | `specs/2026-07-04-futbol-total-ecosystem-design.md` |
| Fase 2 chat + push | `specs/2026-07-07-fase2-chat-push-design.md` |
| Scraper engine + DB | `specs/2026-07-07-scraper-engine-database-design.md` |
| API Pública | `specs/2026-07-07-api-publica-design.md` |
| Cerezo Digital | `specs/2026-07-08-cerezo-digital-design.md` |
| Análisis Táctico IA | `specs/2026-07-12-modulo-analisis-tactico-ia-design.md` |
| Football-Data.org | `specs/2026-07-13-football-data-integration-design.md` |
| Noticias | `specs/2026-07-13-noticias-design.md` |
| GSAP Experience | `specs/2026-07-14-gsap-experience-design.md` |

---

## 18. Punto de Restauración

- **Rama de backup:** `backup-nivel-pro-2026-07-19` (commit `23b94f4`)
- **Mensaje:** "checkpoint: versión estable y optimizada antes de transformación disruptiva"
- **Para restaurar:** `git checkout backup-nivel-pro-2026-07-19` o `git reset --hard backup-nivel-pro-2026-07-19`

---

> **Fin del HANDOFF.md** — Este documento es el punto de verdad único del proyecto. Cualquier IA o desarrollador que lea este archivo podrá entender la plataforma completa y continuar el trabajo desde cualquier punto.
