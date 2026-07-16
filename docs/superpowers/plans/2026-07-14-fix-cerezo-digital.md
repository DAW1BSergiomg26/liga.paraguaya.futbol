# Plan: Fix Cerezo Digital — Corrección Integral del Asistente

## Problemas Identificados (Root Cause Analysis)

| # | Síntoma | Causa Raíz | Archivo |
|---|---------|-----------|---------|
| 1 | "Hola que día es hoy" → saludo genérico | No existe intent para preguntas generales/fecha. Gana `greeting` por keyword "hola" | `classifier.py` |
| 2 | "En qué posición está Cerro Porteño" → "Mirá la tabla general" | `table_position` nunca renderiza la posición del club. `data_fetcher` retorna tabla completa sin filtrar. `response_generator` no tiene template para este intent | `data_fetcher.py`, `response_generator.py` |
| 3 | "Cerro" → "No entendí bien" | Classifier solo matchea keywords de intent, no entidades sueltas. No hay fallback para "solo club sin intención" | `cerezo.py`, `classifier.py` |
| 4 | "Tabla de posicio" → cortado | LLM truncado (`max_tokens=100`) o template falla al formatear | `response_generator.py` |
| 5 | `structured_data` nunca llega al frontend | Backend no retorna `structured_data` en `CerezoResponse`, frontend lo espera | `cerezo.py` |
| 6 | Contexto compartido entre usuarios | `_cerezo_context` es dict global, no por sesión | `cerezo.py` |
| 7 | "fecha" en dos intents | Keyword "fecha" aparece en `match_result` Y `next_match` | `classifier.py` |
| 8 | Sin fallback cuando hay entidades pero no intent | Si se extrae club pero no hay keyword de intent, retorna `unknown` | `cerezo.py` |

## Soluciones

### Fix 1: Agregar intent `general_question` al classifier

**Archivo:** `backend/app/services/cerezo/classifier.py`

- Agregar keyword list `"general_question"` con keywords: "qué día", "que dia", "qué hora", "que hora", "cuánto falta", "cuanto falta", "quién es el presidente", "quien es el presidente", "dónde queda", "donde queda", "cuántos equipos", "cuantos equipos", "cómo se llama", "como se llama", "cuántos goles", "cuantos goles", "me contás", "me contas", "contame", "conta me", "sabés", "sabes"
- Renombrar `head_to_head` → `head_to_head` (sin cambios, solo verificar que no hay conflicto)

### Fix 2: Entity-only fallback — club name solo → `club_info`

**Archivo:** `backend/app/api/cerezo.py`

Cuando `intent == "unknown"` pero `entities["clubes"]` no está vacío:
- Cambiar intent a `club_info`
- Continuar con el flujo normal (fetch + generate)

### Fix 3: `table_position` filtra club específico y renderiza posición

**Archivos:** `backend/app/services/cerezo/data_fetcher.py`, `backend/app/services/cerezo/response_generator.py`

**data_fetcher.py:**
```python
if intent == "table_position":
    tabla = await TablaService.get_table(db)
    tabla_data = [t.model_dump() for t in tabla]
    # Si se mencionó un club, filtrar su posición
    club_posicion = None
    if entities.get("clubes"):
        club_id = entities["clubes"][0]
        for i, row in enumerate(tabla_data):
            if row.get("club_id") == club_id or row.get("id") == club_id:
                club_posicion = {"posicion": i + 1, **row}
                break
    return {"tabla": tabla_data, "club_posicion": club_posicion}
```

**response_generator.py** — Agregar bloque en `_render_template`:
```python
if intent == "table_position":
    if data.get("club_posicion"):
        cp = data["club_posicion"]
        ctx["club_nombre"] = cp.get("nombre", "El club")
        ctx["posicion"] = cp["posicion"]
        ctx["puntos"] = cp.get("puntos", 0)
        ctx["partidos"] = cp.get("partidos_jugados", cp.get("pj", 0))
        template = "{club_nombre} está en el puesto {posicion}° con {puntos} puntos en {partidos} partidos."
    else:
        template = random.choice(templates)
```

### Fix 4: Template `table_position` con datos reales

**Archivo:** `backend/app/services/cerezo/response_generator.py`

Agregar template específico:
```python
"table_position": [
    "{club_nombre} está en el puesto {posicion}° con {puntos} puntos.",
    "En la tabla, {club_nombre} va {posicion}° con {puntos} puntos en {partidos} partidos.",
    "Acá va la tabla. Consultame por algún club en particular para más detalles.",
    "Mirá la tabla general. Decime un club para saber su posición exacta.",
],
```

### Fix 5: Agregar `structured_data` al backend response

**Archivo:** `backend/app/api/cerezo.py`

El modelo `CerezoResponse` necesita un campo `structured_data`:
```python
class CerezoResponse(BaseModel):
    message: str
    intent: str
    data: dict
    prediction: dict | None
    entities: dict
    structured_data: dict | None = None
```

Y en el endpoint, generar `structured_data` según el intent:
- `table_position`: `{"type": "table", "rows": data.get("tabla", [])}`
- `club_info`: `{"type": "club", "club": data.get("club")}`
- `prediction`: `{"type": "prediction", ...}`
- `head_to_head`: `{"type": "h2h", "matches": data.get("head_to_head", [])}`

### Fix 6: Contexto por sesión (no global)

**Archivo:** `backend/app/api/cerezo.py`

Cambiar `_cerezo_context` de dict global a dict por sesión usando un header o session ID:
```python
# Opción simple: usar un session_id en el request body
class CerezoRequest(BaseModel):
    message: str
    session_id: str | None = None

_cerezo_sessions: dict[str, dict] = {}

# En el endpoint:
session_id = body.session_id or "default"
if session_id not in _cerezo_sessions:
    _cerezo_sessions[session_id] = {"last_club_id": None, ...}
ctx = _cerezo_sessions[session_id]
```

### Fix 7: Remover "fecha" de `match_result`

**Archivo:** `backend/app/services/cerezo/classifier.py`

Remover "fecha" de `match_result` (solo queda en `next_match`):
```python
"match_result": ["ganó", "gano", "resultado", "cómo quedó", ... sin "fecha"],
```

### Fix 8: Agregar keywords de intención a "cerro" type queries

**Archivo:** `backend/app/services/cerezo/classifier.py`

O alternativamente, en `cerezo.py`, agregar lógica post-classificación:
```python
# Si no hay intent pero hay clubes extraídos, inferir intención
if intent == "unknown" and entities.get("clubes"):
    intent = "club_info"
    classifier_result["intent"] = "club_info"
    classifier_result["confidence"] = 0.4
```

## Archivos a Modificar

1. `backend/app/services/cerezo/classifier.py` — Fix 1, 7
2. `backend/app/services/cerezo/data_fetcher.py` — Fix 3
3. `backend/app/services/cerezo/response_generator.py` — Fix 3, 4
4. `backend/app/api/cerezo.py` — Fix 2, 5, 6, 8

## Verificación

1. Tests existentes: `cd backend && $env:PYTHONPATH=".." && python -m pytest tests/test_cerezo_*.py -v`
2. Test manual con el servidor corriendo:
   - "Hola que día es hoy" → respuesta sobre fecha (o "no tengo acceso al calendario" pero NO saludo)
   - "En qué posición está Cerro Porteño" → posición real del club
   - "Cerro" → info del club o tabla
   - "Tabla de posiciones" → tabla con datos reales
   - "Olimpia vs Libertad" → predicción H2H
