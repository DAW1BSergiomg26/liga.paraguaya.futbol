# GSAP Experience Design — liga.paraguaya.futbol

**Objetivo:** Activar las librerías de animación ya instaladas (GSAP, ScrollTrigger, SplitType, sparticles, canvas-confetti, Framer Motion) para crear una experiencia visual cinematográfica que haga del sitio la mejor web deportiva del mundo.

**Fecha:** 2026-07-14
**Estado:** Aprobado

---

## 1. Hero Cinematográfico

**Página:** `/` (home)
**Componente:** `components/hero/CinematicHero.tsx`

### Comportamiento
1. Pantalla completa (100vh) con fondo de gradiente oscuro (#0A0A0A → #0A0E1A)
2. Título "LIGA PARAGUAYA DE FÚTBOL" se revela carácter por carácter con SplitType + GSAP
3. Subtítulo con fade-in escalonado
4. Tres contadores numéricos animados (partidos, goles, equipos) con efecto slot machine
5. Partículas de fondo con sparticles (puntos blancos/dorados como focos de estadio)
6. Al hacer scroll, el hero hace zoom out suave revelando el contenido debajo

### Efecto de scroll
- `position: fixed` durante los primeros 100vh de scroll
- Transform: scale(1) → scale(0.95) + opacity(1) → opacity(0)
- Contenido debajo aparece con clip-path reveal

### Datos mockeados para contadores
```typescript
const stats = [
  { label: "PARTIDOS", value: 348, suffix: "" },
  { label: "GOLES", value: 892, suffix: "" },
  { label: "EQUIPOS", value: 19, suffix: "" },
];
```

### Dependencias
- `gsap` (ya instalado)
- `split-type` (ya instalado)
- `sparticles` (ya instalado)

---

## 2. Scroll Reveal System

**Componente reusable:** `components/ui/ScrollReveal.tsx`

### Comportamiento
- Wrapper que detecta cuándo el elemento entra en el viewport
- Aplica animación GSAP con ScrollTrigger
- Soporta diferentes variantes: `from-left`, `from-right`, `from-bottom`, `scale-up`, `clip-reveal`

### Variantes
| Variante | Animación | Uso |
|----------|-----------|-----|
| `from-left` | x: -30 → 0, opacity: 0 → 1 | Filas de tabla, listas |
| `from-right` | x: 30 → 0, opacity: 0 → 1 | Cards alternas |
| `from-bottom` | y: 40 → 0, opacity: 0 → 1 | Secciones generales |
| `scale-up` | scale: 0.9 → 1, opacity: 0 → 1 | Cards destacadas |
| `clip-reveal` | clipPath: inset(100% 0 0 0) → inset(0) | Headers, heroes |

### Stagger
- Cuando el wrapper contiene múltiples hijos, aplica stagger automático
- Delay configurable (default: 50ms entre hijos)
- Solo se anima una vez (once: true)

### Uso
```tsx
<ScrollReveal variant="from-left" stagger={0.05}>
  {equipos.map(equipo => <StandingsRow key={equipo.id} {...equipo} />)}
</ScrollReveal>
```

---

## 3. Parallax Albirroja

**Componente:** `components/ui/ParallaxStripes.tsx`

### Comportamiento
- Fondo del sitio tiene rayas diagonales rojas/blancas (ya existe en `StripesBackground.tsx`)
- Con GSAP ScrollTrigger, las rayas se mueven a diferentes velocidades
- Capa roja: velocidad 1.2x del scroll
- Capa blanca: velocidad 0.8x del scroll
- Efecto: profundidad 3D sin WebGL

### Integración
- Modificar `StripesBackground.tsx` existente
- Agregar `useGSAP` hook de @gsap/react
- ScrollTrigger con `scrub: true` para movimiento suave

### Configuración
```typescript
// Rayas rojas se mueven más rápido = sensación de profundidad
gsap.to(".stripe-red", {
  yPercent: -30,
  ease: "none",
  scrollTrigger: { scrub: true }
});
gsap.to(".stripe-white", {
  yPercent: -15,
  ease: "none",
  scrollTrigger: { scrub: true }
});
```

---

## 4. Efectos Interactivos

### 4.1 3D Tilt en escudos
**Componente:** `components/ui/TiltCard.tsx`
- Al hacer hover, el card se inclina 3D (max 10°)
- Efecto de luz que sigue al cursor
- Usar gsap.quickTo para performance

### 4.2 Glow pulsante en líder
**Clase CSS:** `.glow-lider`
- Box-shadow animado en dorado #FFCC00
- Solo aplica al equipo en posición 1 de la tabla
- Animación CSS keyframe (no GSAP) para mejor performance

### 4.3 Text Split en headlines
**Uso:** Solo en títulos principales (hero, headers de sección)
- SplitType divide el texto en caracteres
- GSAP revela cada carácter con delay progresivo
- Efecto typewriter moderno

### 4.4 Contadores numéricos animados
**Componente:** `components/ui/CountUp.tsx`
- Recibe número final y duración
- GSAP tweens de 0 al valor final
- Efecto slot machine (números cambian rápido al inicio, desaceleran)

---

## 5. Page Transitions

**Integración:** Layout + Framer Motion

### Comportamiento
- Al navegar entre páginas, el contenido actual hace fade-out
- El nuevo contenido hace fade-in con ligero slide-up
- Duración: 300ms ease-out
- No bloquea la navegación (progressive enhancement)

### Implementación
- `AnimatePresence` en el layout de pages
- `motion.div` envolviendo el contenido de cada página
- Transiciones más suaves en rutas relacionadas (partidos → detalle)

---

## 6. Micro-animaciones

### 6.1 Gol celebration
- `canvas-confetti` se dispara cuando se detecta un gol
- Colores: rojo #CC001C, azul #00619E, dorado #FFCC00, blanco
- Explosión desde ambos lados de la pantalla

### 6.2 Live badge pulsante
- CSS puro (sin GSAP) para performance
- Punto rojo que pulsa cada 1.2s
- Ya existe como referencia en el Handoff

### 6.3 Skeleton loading
- Shimmer animation en skeletons mientras cargan datos
- CSS gradient animation (ya parcialmente existe)

---

## 7. Performance

### Reglas no negociables
- GSAP `will-change: transform` solo en elementos animados
- ScrollTrigger: `fastScrollEnd: true` para evitar lag
- `useGSAP` hook de @gsap/react para cleanup automático
- Lazy initialization de sparticles (solo en hero)
- `prefers-reduced-motion`: desactivar todas las animaciones
- Medir Lighthouse antes y después de implementar

### Bundle impact
- GSAP core: ~30KB gzipped (ya instalado)
- SplitType: ~5KB gzipped (ya instalado)
- sparticles: ~8KB gzipped (ya instalado)
- Framer Motion: ~30KB gzipped (ya instalado)
- **Impacto neto: 0KB** (todas las librerías ya están en package.json)

---

## 8. Archivos a crear/modificar

### Crear
- `frontend/src/components/hero/CinematicHero.tsx`
- `frontend/src/components/ui/ScrollReveal.tsx`
- `frontend/src/components/ui/ParallaxStripes.tsx` (o modificar existente)
- `frontend/src/components/ui/TiltCard.tsx`
- `frontend/src/components/ui/CountUp.tsx`
- `frontend/src/lib/gsap.ts` (configuración central de GSAP)

### Modificar
- `frontend/src/app/page.tsx` — integrar CinematicHero
- `frontend/src/app/globals.css` — agregar estilos de glow, shimmer
- `frontend/src/components/layout/StripesBackground.tsx` — integrar parallax
- `frontend/src/app/layout.tsx` — integrar page transitions

---

## 9. Fuera de alcance (esta fase)

- Three.js StadiumHero (fase futura)
- D3 visualizaciones (fase futura)
- Recharts dashboard (fase futura)
- Supabase Realtime (ya tenemos FastAPI)
- Shadcn/ui (ya tenemos componentes propios)

---

*Spec generado via brainstorming · 2026-07-14*
*liga.paraguaya.futbol · GSAP Experience Design*
