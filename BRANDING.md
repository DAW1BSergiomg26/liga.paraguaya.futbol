# Liga Paraguaya de Fútbol — Branding Identity System

## Paleta de Colores

| Token | Hex | Uso |
|-------|-----|-----|
| `--brand-white` | `#FFFFFF` | Texto principal, balón |
| `--brand-blue` | `#0057B8` | Acento primario, paneles del balón |
| `--brand-blue-deep` | `#0B1D3A` | Fondo principal |
| `--brand-red` | `#D52B1E` | Acento secundario, bandera |
| `--brand-gold` | `#F4C542` | Destacados, texto APF |
| `--brand-silver` | `#AEB8C5` | Costuras del balón, texto apagado |
| `--brand-gray` | `#6F7A88` | Bordes sutiles |

## Tipografía

- **Display:** Space Grotesk / Inter (bold, uppercase para títulos)
- **Body:** Inter (regular, para texto general)
- **Monospace:** JetBrains Mono (código, datos numéricos)

## Activos SVG

Directorio: `frontend/src/assets/branding/`

| Archivo | Descripción | Tamaño viewBox |
|---------|-------------|----------------|
| `ball-guayra.svg` | Balón principal con paneles ñandutí | 120×120 |
| `shield.svg` | Escudo APF completo | 200×240 |
| `logo-horizontal.svg` | Balón + wordmark horizontal | 400×100 |
| `logo-vertical.svg` | Balón + wordmark vertical | 200×320 |
| `logo-icon.svg` | Solo balón (para iconos) | 120×120 |
| `loader.svg` | Balón con arco de carga | 80×80 |
| `social-avatar.svg` | Avatar para redes sociales | 200×200 |

### Archivos públicos

| Archivo | Uso |
|---------|-----|
| `public/favicon.svg` | Favicon del navegador (reemplazado) |
| `public/app-icon.svg` | Icono PWA (512×512) |

## Componentes React

Directorio: `frontend/src/components/branding/`

### `<BallLogo />`

Balón animado 3D con paneles ñandutí.

```tsx
import BallLogo from '@/components/branding/BallLogo';

<BallLogo size={48} animated className="brand-glow" />
```

**Props:**
- `size?: number` — Tamaño en px (default: 48)
- `animated?: boolean` — Activa rotación 3D (default: true)
- `className?: string` — Clases CSS adicionales
- `onClick?: () => void` — Handler de click (agrega cursor pointer)

### `<Shield />`

Escudo APF con balón, texto y estrellas.

```tsx
import Shield from '@/components/branding/Shield';

<Shield size={64} />
```

**Props:**
- `size?: number` — Ancho en px (alto se calcula proporcionalmente)
- `className?: string`

### `<Logo />`

Logo combinado (balón + wordmark). Soporta 3 variantes.

```tsx
import Logo from '@/components/branding/Logo';

// Horizontal (default)
<Logo variant="horizontal" size={40} />

// Vertical
<Logo variant="vertical" size={64} />

// Solo icono
<Logo variant="icon" size={32} />
```

**Props:**
- `variant?: 'horizontal' | 'vertical' | 'icon'` (default: 'horizontal')
- `size?: number` — Tamaño del balón (default: 48)
- `className?: string`
- `onClick?: () => void`

### `<Loader />`

Indicador de carga con balón estático y arco giratorio.

```tsx
import Loader from '@/components/branding/Loader';

<Loader size={80} text="Cargando datos..." />
```

**Props:**
- `size?: number` (default: 80)
- `text?: string` — Texto debajo del loader (default: 'Cargando...')
- `className?: string`

### `<Favicon />`

Actualiza el favicon del navegador dinámicamente.

```tsx
import Favicon from '@/components/branding/Favicon';

<Favicon href="/favicon.svg" />
```

## CSS — Animaciones y Utilidades

Archivo: `frontend/src/app/branding.css` (importado en `globals.css`)

### Keyframes

| Animación | Descripción |
|-----------|-------------|
| `brand-float` | Flotación vertical suave (±3px, 3s) |
| `brand-breathe` | Respiración de escala (1→1.015, 4s) |
| `brand-glow-pulse` | Pulso de glow azul (3s) |
| `brand-glow-red` | Pulso de glow rojo (3s) |
| `brand-gold-shimmer` | Shimmer dorado lineal (3s) |

### Clases de utilidad

| Clase | Efecto |
|-------|--------|
| `brand-logo` | Hover: scale 1.08 + rotate 15° + glow azul |
| `brand-float` | Animación de flotación |
| `brand-breathe` | Animación de respiración |
| `brand-glow` | Pulso de glow azul |
| `brand-glow-red` | Pulso de glow rojo |
| `brand-shimmer` | Texto con shimmer dorado |
| `brand-shadow-ball` | Sombra para balones |
| `brand-shadow-shield` | Sombra para escudos |
| `brand-accent-line` | Línea trimotor (rojo/azul/dorado) |
| `brand-card` | Tarjeta con borde accent hover |

### Variables CSS (glow/shadow)

```css
--glow-blue    /* Glow azul para hover */
--glow-red     /* Glow rojo para alertas */
--glow-gold    /* Glow dorado para highlights */
--shadow-ball  /* Sombra base del balón */
--shadow-ball-hover /* Sombra hover */
--shadow-shield /* Sombra del escudo */
```

## Integración en Navbar

El Navbar usa `<Logo variant="horizontal" size={40} />` envuelto en un `<Link href="/">`. El logo anterior (`MagicSoccerLogo`) fue reemplazado completamente.

## Preferencias de Movimiento

Todas las animaciones respetan `prefers-reduced-motion: reduce`. Si el usuario tiene activada esta preferencia del sistema, las animaciones se desactivan automáticamente.

## Fichero de Cambios

- **v1.0** — MagicSoccerLogo (balón negro con pentágono)
- **v2.0** — Branding Identity System completo (balón Guayrá, escudo, wordmark, loader, componentes React, CSS)