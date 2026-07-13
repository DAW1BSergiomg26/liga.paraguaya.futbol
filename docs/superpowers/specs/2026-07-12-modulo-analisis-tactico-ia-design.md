# Módulo de Análisis Táctico IA - Design Spec

## Visión General

Módulo disruptivo de análisis táctico que posiciona a liga.paraguaya.futbol como la web de referencia del fútbol paraguayo. Ofrece visualización interactiva de formaciones, estadísticas avanzadas (xG, posesión, etc.), y análisis de tendencias con IA — funcionalidades que NINGUNA otra web de liga paraguaya ofrece actualmente.

## Objetivos

1. **Diferenciación:** Ser la primera web paraguaya con análisis táctico visual interactivo
2. **Engagement:** Mantener a los fans más tiempo en la plataforma con datos que no encuentran en otro lado
3. **Credibilidad:** Establecer la web como fuente de análisis serio, no solo resultados

## Arquitectura de Rutas

```
/tactico                    → Dashboard principal (lista de equipos + análisis recientes)
/tactico/[equipo]           → Análisis completo de un equipo (formación, stats, tendencias)
/tactico/[partido]          → Análisis pre-partido y en vivo de un enfrentamiento específico
```

**Navegación:** Enlace "Análisis Táctico" en el sidebar y menú principal.

## Componentes Principales

### 1. Campo de Fútbol Interactivo (`TacticalField`)

**Funcionalidad:**
- Campo de fútbol 2D renderizado con CSS/SVG
- 11 jugadores por equipo posicionados en su formación (4-3-3, 4-4-2, etc.)
- Click en jugador → Tooltip con nombre, posición, rating del partido
- Hover → Resalta la zona del jugador
- Dropdown de formación → Cambia visualmente la posición de los jugadores
- Responsivo: se adapta a desktop, tablet y móvil

**Estilo visual:**
- Campo verde (#2d5a27) con líneas blancas
- Jugadores representados como círculos con número y color del club
- Animación suave al cambiar formación
- Tooltip con glassmorphism (fondo blur)

### 2. Panel de Estadísticas Avanzadas (`StatsPanel`)

Dashboard con 6 tarjetas de stats:

| Stat | Tipo Visual | Descripción |
|------|-------------|-------------|
| xG (Goles Esperados) | Barra comparativa | Local vs visitante, color por valor |
| Posesión | Gráfico circular | Porcentaje con animación |
| Tiros a puerta | Barras horizontales | Comparativa lado a lado |
| Pases completados | Barra de progreso | Porcentaje con tendencia |
| Duelos ganados | Comparativa visual | Barras superpuestas |
| Corners | Número simple | Con indicador de tendencia ↑↓ |

Cada stat tiene un **indicador de tendencia** (sube/baja vs promedio de temporada).

### 3. Panel de Tendencias IA (`InsightsPanel`)

Panel que muestra 3-5 insights generados por análisis estadístico:

**Formato de cada insight:**
- Icono de tendencia (📈📉⚽📊)
- Texto del insight en lenguaje natural
- Métrica que lo respalda (ej: "68% de goles en segundo tiempo")

**Ejemplos de insights:**
- "Olimpia marca el 68% de sus goles en el segundo tiempo"
- "Cerro tiene el mejor pressing alto: recupera el balón en 4.2 segundos promedio"
- "Libertad no ha perdido en 8 partidos como local"
- "Cerro promedia 2.3 goles por partido en los últimos 5"

**Implementación:**
- Backend calcula estadísticas de la BD
- Pre-calcula insights y los almacena en caché
- Frontend los muestra con formato atractivo
- No se necesita LLM en tiempo real

## Backend

### Nuevos Endpoints

#### `GET /api/v1/tactico/equipo/{equipo_id}`

**Respuesta:**
```json
{
  "equipo_id": "cerro",
  "nombre": "Cerro Porteño",
  "escudo": "url",
  "formacion_principal": "4-3-3",
  "formaciones_disponibles": ["4-3-3", "4-4-2", "3-5-2"],
  "jugadores": [
    {
      "id": "jugador_1",
      "nombre": "Nombre Jugador",
      "posicion": "DC",
      "numero": 9,
      "rating": 7.8,
      "x": 0.5,
      "y": 0.2
    }
  ],
  "stats": {
    "xg": 1.85,
    "posesion": 54.2,
    "tiros_puerta": 5.2,
    "pases_completados": 82.1,
    "duelos_ganados": 58.4,
    "corners": 6.1
  },
  "tendencias": [
    "Marca el 68% de sus goles en el segundo tiempo",
    "Mejor pressing alto de la liga: 4.2 segundos promedio",
    "Invicto en 8 partidos como local"
  ],
  "ultimos_partidos": [
    {
      "fecha": "2026-07-10",
      "rival": "Olimpia",
      "resultado": "2-1",
      "formacion": "4-3-3"
    }
  ]
}
```

#### `GET /api/v1/tactico/partido/{partido_id}`

**Respuesta:**
```json
{
  "partido_id": "match_123",
  "local": {
    "equipo_id": "cerro",
    "nombre": "Cerro Porteño",
    "formacion": "4-3-3",
    "jugadores": [...]
  },
  "visitante": {
    "equipo_id": "olimpi",
    "nombre": "Olimpia",
    "formacion": "4-4-2",
    "jugadores": [...]
  },
  "stats": {
    "local": { "xg": 1.85, "posesion": 54.2, ... },
    "visitante": { "xg": 1.23, "posesion": 45.8, ... }
  },
  "prediccion_ia": {
    "gana_local": 0.45,
    "empate": 0.28,
    "gana_visitante": 0.27,
    "confianza": "media"
  }
}
```

### Modelo de Datos (SQLAlchemy)

```python
class AnalisisTactico(Base):
    __tablename__ = "analisis_tactico"
    
    id = Column(String, primary_key=True)
    equipo_id = Column(String, ForeignKey("clubes.id"))
    partido_id = Column(String, ForeignKey("partidos.id"), nullable=True)
    formacion = Column(String)  # "4-3-3"
    stats = Column(JSON)  # {xg: 1.85, posesion: 54.2, ...}
    jugadores = Column(JSON)  # [{id, nombre, posicion, numero, x, y}]
    tendencias = Column(JSON)  # ["insight 1", "insight 2"]
    created_at = Column(DateTime)
    updated_at = Column(DateTime)
```

## Frontend

### Estructura de Archivos

```
frontend/src/app/tactico/
├── page.tsx                    # Dashboard principal
├── [equipo]/
│   └── page.tsx               # Análisis por equipo
└── [partido]/
    └── page.tsx               # Análisis por partido

frontend/src/components/tactico/
├── TacticalField.tsx           # Campo interactivo 2D
├── PlayerDot.tsx               # Jugador en el campo
├── FormationSelector.tsx       # Selector de formación
├── StatsPanel.tsx              # Panel de estadísticas
├── StatCard.tsx                # Tarjeta individual de stat
├── InsightsPanel.tsx           # Panel de tendencias IA
├── InsightCard.tsx             # Tarjeta individual de insight
└── MatchAnalysis.tsx           # Análisis completo de partido
```

### Hooks

```typescript
useTactico(equipoId: string)    # Datos tácticos de un equipo
useTacticoPartido(id: string)   # Análisis de un partido
```

### Estilos

- Colores del tema existente: `bg-bg-secundario`, `border-borde-sutil`, `text-texto-principal`
- Campo verde: `#2d5a27` con líneas blancas `#ffffff`
- Animaciones suaves con `transition-all duration-300`
- Tooltips con `backdrop-blur` para glassmorphism

## Fuentes de Datos

### APIs Externas (Scraping)

1. **FBref** (https://fbref.com) — Estadísticas detalladas de la liga paraguaya
2. **SofaScore** (https://sofascore.com) — Formaciones y ratings de jugadores

### Estrategia de Caché

- **Cache en BD:** 1 hora para stats de partidos finalizados
- **Cache en memoria:** 5 minutos para datos en vivo
- **Fallback:** Si no hay datos disponibles, mostrar "Análisis no disponible para este partido"

### Servicio de Scraping

```python
class TacticoService:
    async def get_estadisticas_equipo(equipo_id: str) -> dict:
        # 1. Buscar en caché BD
        # 2. Si no existe o expiró, scrappear de FBref
        # 3. Guardar en caché
        # 4. Retornar datos
    
    async def get_analisis_partido(partido_id: str) -> dict:
        # 1. Buscar en caché
        # 2. Scrappear formaciones de SofaScore
        # 3. Scrappear stats de FBref
        # 4. Calcular tendencias con IA (pre-calculado)
        # 5. Guardar y retornar
```

## IA / Tendencias

### Cálculo de Insights

No usamos LLM en tiempo real. En su lugar:

1. **Pre-calculamos insights** cuando se scrappean los datos
2. **Almacenamos insights** como strings en la BD
3. **Reglas simples:**
   - "% de goles en primer/segundo tiempo"
   - "Racha de partidos sin perder/ganando"
   - "Mejor/peor en cada stat de la liga"
   - "Comparación con promedio de liga"

### Ejemplo de Cálculo

```python
def calcular_tendencias(equipo_id: str, stats_historial: list) -> list[str]:
    insights = []
    
    # Goles por tiempo
    goles_primer = sum(s['goles_primer_tiempo'] for s in stats_historial)
    goles_total = sum(s['goles'] for s in stats_historial)
    if goles_total > 0:
        pct = (goles_primer / goles_total) * 100
        if pct > 60:
            insights.append(f"Marca el {pct:.0f} de sus goles en el primer tiempo")
        elif pct < 40:
            insights.append(f"Marca el {100-pct:.0f} de sus goles en el segundo tiempo")
    
    # Racha
    ultimos = stats_historial[-5:]
    victorias = sum(1 for s in ultimos if s['resultado'] == 'v')
    if victorias >= 4:
        insights.append(f"Invicto en los últimos {len(ultimos)} partidos")
    
    return insights[:5]  # Max 5 insights
```

## MVP Scope (Lo que implementamos primero)

### Fase 1 (MVP)
- [ ] Rutas `/tactico` y `/tactico/[equipo]`
- [ ] Campo interactivo básico (formaciones estáticas)
- [ ] Panel de stats (6 métricas con datos mock)
- [ ] Panel de tendencias (insights mock)
- [ ] Backend con datos mock bien diseñados
- [ ] Integración con sidebar existente

### Fase 2 (Post-MVP)
- [ ] Conexión con APIs reales (FBref/SofaScore)
- [ ] Scraping y caché en BD
- [ ] Análisis por partido (`/tactico/[partido]`)
- [ ] Comparador táctico club vs club
- [ ] Mapa de calor zonal

## No incluido (explícitamente)

- Chat en vivo táctico (ya tenemos chat de partidos)
- Predicciones de IA en tiempo real (requiere LLM, es scope separado)
- Video/análisis de jugadas (requiere datos de video)

## Métricas de Éxito

1. **Uso:** >30% de usuarios visitan `/tactico` en el primer mes
2. **Engagement:** Tiempo promedio >3 minutos en la página
3. **Retorno:** >20% de usuarios regresan a ver análisis de otros equipos
4. **Feedback:** >80% de encuesta de satisfacción "útil" o "muy útil"

## Dependencias

- **Frontend:** React, Tailwind CSS, hooks existentes
- **Backend:** FastAPI, SQLAlchemy, aiohttp (para scraping)
- **Datos:** FBref (gratis), SofaScore (gratis con límites)
- **Infra:** Caché en SQLite existente, sin nuevos servicios
