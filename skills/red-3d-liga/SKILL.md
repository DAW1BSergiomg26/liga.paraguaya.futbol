---
name: red-3d-liga-paraguaya
description: Usa este skill para diseñar, generar o integrar visualizaciones de red 3D (grafos de fuerza en 3D) en el proyecto liga.paraguaya.futbol usando la librería "3d-force-graph" (ThreeJS + d3-force-3d). Actívalo cuando Sergio pida cosas como "red de clubes", "mapa de rivalidades", "grafo 3D", "visualización 3D de la liga", "conexiones entre equipos", "red de enfrentamientos", "mapa interactivo de la liga", "árbol de campeones", o cualquier feature que muestre clubes/jugadores/temporadas como nodos conectados en un espacio 3D navegable. También aplica si se pide mejorar la sección de clubes con una vista alternativa "modo red" o "modo constelación", o si se menciona 3d-force-graph explícitamente.
---

# Red 3D de la Liga Paraguaya (3d-force-graph)

## Qué es esto y por qué le sirve a este proyecto

`3d-force-graph` es una librería JS (ThreeJS + WebGL, motor de físicas d3-force-3d) que dibuja
un grafo de nodos y enlaces en un espacio 3D navegable con el mouse (rotar, zoom, arrastrar).
No requiere backend ni build complejo: se puede importar por CDN.

Para `liga.paraguaya.futbol` esto habilita, sin reescribir nada del stack actual, features como:

- **Red de Rivalidades**: los clubes de Primera División como nodos (esfera = tamaño según
  títulos/puntos), unidos por líneas cuyo grosor representa cantidad de clásicos/enfrentamientos
  históricos. Al hacer click en un nodo, la cámara vuelve hacia ese club y muestra su ficha.
- **Constelación de Campeones**: nodos = temporadas o clubes campeones, enlaces = continuidad
  o rivalidad directa por el título.
- **Mapa de Traspasos/Jugadores** (si en el futuro hay datos de plantillas): nodos = jugadores y
  clubes, enlaces = pases entre clubes.
- **Árbol de Ascensos/Descensos** usando `dagMode` (top-down) para mostrar el flujo entre
  Primera y Divisiones Intermedias por temporada.

Esto complementa (no reemplaza) el sistema de diseño "albirroja" ya existente (parallax, tilt 3D,
flip-cards): es una vista adicional/alternativa dentro de la sección de clubes, no un rediseño.

## Cuándo NO usar esto

- Si el pedido es solo un fix visual de CSS en las flip-cards o el parallax existente → no hace
  falta esta librería, seguir con el sistema de diseño actual.
- Si es una tabla de posiciones o estadísticas tabulares → usar HTML/Cnormal, esto es solo
  para relaciones tipo grafo (nodos-enlaces).
- No usar para gráficos de barras/líneas de estadísticas (para eso, Chart.js o similar es mejor).

## Instalación rápida

### Vía CDN (sin build tools)
En el HTML de la página que tendrá la red:
```html
<script src="https://cdn.jsdelivr.net/npm/3d-force-graph"></script>
```

### Vía npm (si el proyecto ya usa bundler como Next.js)
```bash
npm install 3d-force-graph --save
```
```js
import ForceGraph3D from '3d-force-graph';
```

No requiere Node/backend para funcionar: es 100% client-side.

## Flujo de trabajo recomendado

1. **Leer `references/api-cheatsheet.md`** para repasar los métodos exactos antes de escribir
   código (no inventar nombres de propiedades).
2. **Construir el dataset en JSON separado** (ej. `data/red-clubes.json`), nunca hardcodear los
   datos dentro del HTML. Reusar el JSON de escudos/clubes que ya existe para poblar `name`,
   `val`, `color`, tooltips.
3. **Adaptar la paleta APF** ya definida en el design system:
   - Azul `#00619E`, Amarillo `#FFCC00`, Rojo `#CC001C`
   - Fondo del grafo (`backgroundColor`) en un azul-noche muy oscuro (ej. `#020a14`)
4. **Copiar `assets/red-clubes-ejemplo.html`** como punto de partida real y funcional.
5. **Integrar** en la sección de clubes como una pestaña/toggle "Vista Red 3D" junto a la vista
   de tarjetas (flip-cards) existente, sin tocar el resto del layout ni el backend.
6. **Verificar rendimiento**: con ~12-19 nodos no hay problema, pero si se agregan jugadores
   (cientos de nodos) hay que bajar `nodeResolution`, `linkResolution`.

## Patrón de dataset esperado (`data/red-clubes.json`)

```json
{
  "nodes": [
    { "id": "cerro-porteno", "name": "Club Cerro Porteño", "val": 35, "color": "#003399" },
    { "id": "olimpia", "name": "Club Olimpia", "val": 48, "color": "#000000" }
  ],
  "links": [
    { "source": "cerro-porteno", "target": "olimpia", "value": 187, "name": "Clásico del Fútbol Paraguayo" }
  ]
}
```

- `val` en nodos → cantidad de títulos (afecta el tamaño de la esfera).
- `value`/grosor en links → cantidad histórica de enfrentamientos.

## Snippet mínimo de integración

```js
const Graph = new ForceGraph3D(document.getElementById('red-clubes'))
  .backgroundColor('#020a14')
  .jsonUrl('data/red-clubes.json')
  .nodeLabel('name')
  .nodeVal('val')
  .nodeColor('color')
  .linkColor(() => 'rgba(255,204,0,0.35)')
  .linkWidth(link => Math.max(1, link.value / 60))
  .linkDirectionalParticles(2)
  .linkDirectionalParticleColor(() => '#CC001C')
  .onNodeClick(node => {
    const distance = 120;
    const ratio = 1 + distance / Math.hypot(node.x, node.y, node.z || 1);
    Graph.cameraPosition(
      { x: node.x * ratio, y: node.y * ratio, z: (node.z || 1) * ratio },
      node,
      1500
    );
  });
```

## Notas de rendimiento

- Con 12-19 nodos (clubes de Primera) el rendimiento es excelente sin ajustes.
- Si se agregan jugadores/temporadas históricas (cientos de nodos), bajar `nodeResolution` y
  `linkResolution`, y evaluar `enablePointerInteraction(false)` para ganar FPS.
- Los valores de `linkWidth` se redondean al decimal más cercano por temas de indexado interno.
