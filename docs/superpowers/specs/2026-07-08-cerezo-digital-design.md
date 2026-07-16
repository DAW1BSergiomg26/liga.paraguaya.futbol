# Cerezo Digital — Asistente Inteligente de Fútbol Paraguayo

## Problema

La plataforma tiene muchos datos (clubes, partidos históricos 2020-2026, tabla, predicciones humanas) pero no hay una interfaz conversacional que los unifique. El usuario tiene que navegar entre páginas para encontrar respuestas simples como "¿cuántos títulos tiene Olimpia?" o "¿quién ganó el último clásico?". Tampoco hay predicciones automáticas generadas por el sistema.

## Solución

**Cerezo Digital**, un asistente conversacional en página dedicada `/cerezo` que entiende preguntas en lenguaje natural y responde con datos reales de la plataforma + predicciones estadísticas. Corre 100% local — sin API externa.

## Arquitectura

```
Usuario → /cerezo → POST /api/v1/cerezo/ask → Backend FastAPI
                                                         │
                                  ┌──────────────────────┤
                                  ↓                      ↓
                     IntentClassifier              EntityExtractor
                     (ONNX MiniLM → intent)        (clubes, fechas)
                                  ↓                      ↓
                            DataFetcher ←───────────────┘
                                  ↓
                            Tiny LLM (Llama 3.2 1B GGUF)
                            prompt = contexto datos + pregunta
                                  ↓
                     { intent, answer, data?, prediction? }
```

## Backend — Componentes

### 1. CerezoIntentClassifier (`app/services/cerezo/classifier.py`)

Clasifica el mensaje del usuario en una de 8 intenciones usando MiniLM-L6-v2 via ONNX (misma infraestructura de embeddings existente):

| Intención | Ejemplo | Acción |
|-----------|---------|--------|
| `club_info` | "Datos de Olimpia" | Club detalle |
| `match_result` | "Quién ganó Cerro vs Olimpia" | Partido por local/visitante |
| `head_to_head` | "Cómo le fue a Libertad vs Guaraní" | Historial H2H |
| `table_position` | "Cómo viene la tabla" | Tabla actual |
| `prediction` | "Quién gana la próxima fecha" | Predicción estadística |
| `top_scorer` | "Máximo goleador" | Stats de goleadores |
| `greeting` | "Hola Cerezo" | Saludo |
| `unknown` | cualquier otra cosa | "No entendí, reformulá" |

- Clasificador one-shot: embedding del mensaje → cosine similarity contra embeddings de ejemplos por intent
- Sin entrenamiento fino, sin labels
- Retorna `{ intent, confidence, entities }`

### 2. CerezoEntityExtractor (`app/services/cerezo/entity_extractor.py`)

Extrae entidades del texto original según el intent:

- **Clubes**: match contra lista oficial de 16 + alias (Cerro/Ciclón, Olimpia/Decano, etc.)
- **Fechas**: palabras clave como *último*, *próximo*, *ayer*, *fecha 5*, *2025*
- **Torneo**: *Apertura*, *Clausura*, *2024*
- Retorna `{ clubes: [], fecha: {}, torneo: "" }`

### 3. CerezoDataFetcher (`app/services/cerezo/data_fetcher.py`)

Toma `{ intent, entities }` y llama a servicios existentes (`club_service`, `partido_service`, `tabla_service`). No duplica lógica de negocio.

Retorna `{ data }` con lo necesario para responder.

### 4. CerezoPredictionEngine (`app/services/cerezo/prediction_engine.py`)

Predice resultados de partidos usando estadísticas reales:

1. Historial H2H — últimos 5 partidos entre ambos clubes
2. Forma reciente — últimos 5 partidos de cada club
3. Factor localía — rendimiento como local/visitante
4. Promedio de goles anotados/recibidos
5. Score ponderado → `{ local_win_pct, draw_pct, visitor_win_pct, confidence }`

Entrada: `fecha_id` o `partido_id`. Salida: objeto con porcentajes + nivel de confianza.

### 5. Tiny LLM — Respuesta final (`app/services/cerezo/response_generator.py`)

Usa **Llama 3.2 1B** cuantizado (Q4_K_M, ~780 MB) via `llama-cpp-python` para generar la respuesta final en lenguaje natural.

**Prompt:**
```
Contexto real:
{json_con_datos}

Instrucción: Respondé como un hincha paraguayo de fútbol, natural, con vocabulario local. Máximo 2 oraciones. No inventes datos.

Pregunta: {mensaje}
Respuesta:
```

El modelo solo formatea — los datos vienen verificados de la DB. Velocidad estimada: ~40 tok/s en CPU, respuesta en 1-3 segundos.

### 6. API Endpoint

```
POST /api/v1/cerezo/ask
Body: { message: string }
Response: {
  intent: string,
  answer: string,
  confidence: float,
  data?: object,
  prediction?: { local_win_pct, draw_pct, visitor_win_pct, confidence }
}

POST /api/v1/cerezo/reset
Body: {}
Response: { status: "ok" }
```

Sin streaming. Request/respuesta simple.

## Frontend — Página `/cerezo`

### Componentes nuevos

- **Página `/cerezo/page.tsx`** — layout del chat con historial de mensajes
- **ChatBubble** — mensaje del usuario / respuesta de Cerezo
- **PredictionCard** — renderiza visualmente la predicción (barra de porcentajes)
- **TypingIndicator** — "Cerezo está pensando..."

### Integración

- Usa TanStack Query para el fetch
- `POST /api/v1/cerezo/ask` con la pregunta
- Loading state mientras procesa
- Historial en memoria (componente state, no DB)

## Infraestructura — Tiny LLM

| Componente | Detalle |
|-----------|---------|
| Librería | `llama-cpp-python` |
| Modelo | `Llama-3.2-1B-Instruct-Q4_K_M.gguf` |
| Descarga | Automática al iniciar backend o vía Dockerfile |
| RAM | ~1.2 GB adicional |
| Cache | Modelo cargado en singleton, lazy loading |
| Fallback | Si el modelo no carga, usa templates planos |

### Dockerfile update

```dockerfile
# Descargar modelo al build
RUN pip install llama-cpp-python
RUN wget -P /app/models https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf
```

## Archivos nuevos

### Backend
- `backend/app/services/cerezo/__init__.py`
- `backend/app/services/cerezo/classifier.py` — IntentClassifier
- `backend/app/services/cerezo/entity_extractor.py` — EntityExtractor
- `backend/app/services/cerezo/data_fetcher.py` — DataFetcher
- `backend/app/services/cerezo/prediction_engine.py` — PredictionEngine
- `backend/app/services/cerezo/response_generator.py` — ResponseGenerator (tiny LLM)
- `backend/app/api/v1/cerezo.py` — router con endpoints
- `backend/tests/test_cerezo_classifier.py`
- `backend/tests/test_cerezo_entity_extractor.py`
- `backend/tests/test_cerezo_prediction_engine.py`
- `backend/tests/test_cerezo_response_generator.py`
- `backend/tests/test_cerezo_api.py`

### Frontend
- `frontend/src/app/cerezo/page.tsx`
- `frontend/src/components/cerezo/ChatBubble.tsx`
- `frontend/src/components/cerezo/PredictionCard.tsx`
- `frontend/src/components/cerezo/TypingIndicator.tsx`

## Tests

| Archivo | Tests | Qué cubre |
|---------|-------|-----------|
| `test_cerezo_classifier.py` | 5 | Cada intent con 3+ variantes, unknown |
| `test_cerezo_entity_extractor.py` | 5 | Clubes por nombre/alias, fechas, edge cases |
| `test_cerezo_prediction_engine.py` | 4 | Predicción con datos conocidos, sin datos, empate |
| `test_cerezo_response_generator.py` | 3 | Template rendering, tiny LLM fallback |
| `test_cerezo_api.py` | 4 | POST /ask feliz, mensaje vacío, error handling |

Total estimado: ~21 tests nuevos.

## Consideraciones

- **Modelo se descarga una vez** — cacheado en `app/models/`. Si falla la descarga, fallback a templates.
- **Sin WebSocket** — request/respuesta simple, el tiny LLM responde rápido.
- **El modelo no alucina datos** — solo formatea la respuesta. Los datos vienen de la DB.
- **Rendimiento** en CPU: clasificador <50ms, entity extractor <10ms, data fetcher ~50ms, tiny LLM 1-3s. Total <4s por request.

## Checklist de implementación

1. [ ] Backend: IntentClassifier con ONNX MiniLM
2. [ ] Backend: EntityExtractor (alias de clubes, fechas)
3. [ ] Backend: DataFetcher (integra servicios existentes)
4. [ ] Backend: PredictionEngine (estadístico)
5. [ ] Backend: ResponseGenerator con Llama 3.2 1B GGUF + fallback a templates
6. [ ] Backend: Router `/api/v1/cerezo/ask`
7. [ ] Frontend: Página `/cerezo` + ChatBubble + PredictionCard + TypingIndicator
8. [ ] Tests: 21 tests nuevos
9. [ ] Verificar: todos los tests existentes siguen pasando
10. [ ] Actualizar Handoff.md
