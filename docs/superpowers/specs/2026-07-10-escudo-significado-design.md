# Sección "Significado del Escudo" en página de detalle de club

## Objetivo

Agregar una sección informativa en cada página de detalle de club (`/clubes/[id]`) que muestre el significado, origen y simbolismo del escudo del club, usando datos extraídos de footylogos.com.

## Datos

### Fuente

10 páginas de footylogos.com con información textual del significado de cada escudo, más la página de la competición Primera División de Paraguay.

### Imágenes

14 archivos PNG en `C:\Users\astur\Desktop\liga.paraguaya.futbol\img\` con escudos descargados de footylogos.com (formato: `{slug}-logo-footylogos.png`).

### Mapeo club → datos

Archivo `src/data/escudos.ts` con un objeto `ESCUDOS_DATA` que mapea cada club (por nombre canónico) a:
- `texto`: el párrafo del significado del escudo (castellano)
- `imagen`: ruta del PNG local
- `detalles`: colores, año fundación, apodos clave

Mapeo de nombres:

| Club (API) | Slug footylogos |
|---|---|
| Cerro Porteño | cerro-porteno |
| Libertad | club-libertad |
| Olimpia | olimpia |
| Guaraní | guarani-paraguay |
| Nacional | nacional-paraguay |
| Sportivo Luqueño | sportivo-luqueno |
| Sportivo Trinidense | sportivo-trinidense |
| General Caballero JLM | general-caballero-jlm |
| Club Sportivo 2 de Mayo | club-sportivo-2-de-mayo |
| Club Atlético Tembetary | club-atletico-tembetary |

## Ubicación en la página

Dentro de la tarjeta principal (`div.rounded-2xl`), después de la grilla de información (ciudad, estadio, títulos...) y antes de la sección de Títulos Internacionales.

## Diseño visual

- Fondo: tarjeta con borde sutil (`border-borde-sutil`), mismo estilo que la tarjeta principal
- Watermark: el PNG del escudo footylogos centrado con opacidad ~10% como `background-image`
- Encabezado: "Significado del Escudo" con un escudo decorativo SVG pequeño
- Texto: párrafo en gris claro (`text-gray-400`) con la explicación del significado
- Detalles extra: badges con los colores del club, año de fundación, apodo
- El watermark NO debe interferir con la legibilidad del texto

## Assets

Las imágenes PNG se copiarán a `public/img/` para servirlas estáticamente desde Next.js.

## No incluido (fuera de alcance)

- La página de competición (primera division paraguay) no se integra en este cambio
- No se modifican las tarjetas de la lista de clubes (`ClubCard`)
- No se modifican otras páginas (tabla, h2h, etc.)
