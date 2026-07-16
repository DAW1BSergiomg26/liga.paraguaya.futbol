# Cerezo Digital Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Cerezo Digital — an AI assistant that answers questions about Paraguayan football using real data + tiny local LLM.

**Architecture:** 5 backend services (IntentClassifier, EntityExtractor, DataFetcher, PredictionEngine, ResponseGenerator) wired through a single `/api/v1/cerezo/ask` endpoint. Frontend page `/cerezo` with chat UI. No external API — everything runs locally via ONNX + Llama 3.2 1B GGUF.

**Tech Stack:** FastAPI, SQLAlchemy async, ONNX Runtime (MiniLM-L6-v2), llama-cpp-python (Llama 3.2 1B GGUF), Next.js 16, TanStack Query.

## Global Constraints

- Tiny LLM must be optional — fallback to templates if model fails to load
- All data must come from real DB queries, never from model generation
- Classifier uses existing ONNX embedding infra (no new training pipelines)
- Tests use in-memory SQLite (same as existing test pattern)
- New cerezo folder in `backend/app/services/cerezo/` — one file per component
- New cerezo folder in `frontend/src/components/cerezo/` — one file per component

---

### Task 1: IntentClassifier

**Files:**
- Create: `backend/app/services/cerezo/__init__.py`
- Create: `backend/app/services/cerezo/classifier.py`
- Create: `backend/tests/test_cerezo_classifier.py`

**Interfaces:**
- Produces: `CerezoIntentClassifier.classify(message: str) -> { intent: str, confidence: float, entities: dict }`
  - intent is one of: club_info, match_result, head_to_head, table_position, prediction, top_scorer, greeting, unknown
  - confidence is 0.0–1.0

- [ ] **Step 1: Write `__init__.py`**

```python
```

Empty file — just makes `cerezo` a package.

- [ ] **Step 2: Write the failing test**

```python
import pytest
from backend.app.services.cerezo.classifier import CerezoIntentClassifier


@pytest.mark.asyncio
async def test_classify_greeting():
    result = await CerezoIntentClassifier.classify("Hola Cerezo")
    assert result["intent"] == "greeting"
    assert result["confidence"] >= 0.5


@pytest.mark.asyncio
async def test_classify_club_info():
    result = await CerezoIntentClassifier.classify("Datos de Olimpia")
    assert result["intent"] == "club_info"
    assert result["confidence"] >= 0.5


@pytest.mark.asyncio
async def test_classify_table_position():
    result = await CerezoIntentClassifier.classify("Cómo viene la tabla")
    assert result["intent"] == "table_position"


@pytest.mark.asyncio
async def test_classify_prediction():
    result = await CerezoIntentClassifier.classify("Quién gana el próximo partido")
    assert result["intent"] == "prediction"


@pytest.mark.asyncio
async def test_classify_unknown():
    result = await CerezoIntentClassifier.classify("xyzzy flurbo garplax")
    assert result["intent"] == "unknown"
```

- [ ] **Step 3: Run test to verify it fails**

Run:
```bash
cd backend
$env:PYTHONPATH=".."
python -m pytest tests/test_cerezo_classifier.py -v
```
Expected: FAIL (ModuleNotFoundError: no module named classifier)

- [ ] **Step 4: Write minimal implementation**

```python
import numpy as np
from numpy.linalg import norm

# Embedding cache: one example per intent
_INTENT_EXAMPLES: dict[str, list[str]] = {
    "club_info": [
        "Datos de Olimpia", "Información de Cerro Porteño",
        "Cómo es el club Libertad", "Historia de Guaraní",
    ],
    "match_result": [
        "Quién ganó el último clásico", "Resultado de Olimpia vs Cerro",
        "Cómo quedó el partido", "Quién ganó ayer",
    ],
    "head_to_head": [
        "Cómo le fue a Libertad contra Guaraní",
        "Historial entre Olimpia y Cerro",
        "Quién ganó más clásicos",
    ],
    "table_position": [
        "Cómo viene la tabla", "Quién lidera el torneo",
        "Posiciones del campeonato", "Tabla de posiciones",
    ],
    "prediction": [
        "Quién gana el próximo partido", "Pronóstico de la fecha",
        "Cerezo quién va a ganar", "Predicción del clásico",
    ],
    "top_scorer": [
        "Máximo goleador del torneo", "Quién es el goleador",
        "Tabla de goleadores", "Artillero del campeonato",
    ],
    "greeting": [
        "Hola Cerezo", "Buenas tardes", "Hola", "Cómo estás",
        "Buen día",
    ],
}

_INTENT_EMBEDDINGS: dict[str, np.ndarray] | None = None


def _lazy_load_embeddings():
    global _INTENT_EMBEDDINGS
    if _INTENT_EMBEDDINGS is not None:
        return
    try:
        from backend.app.core.embeddings import get_embedding
        _INTENT_EMBEDDINGS = {}
        for intent, examples in _INTENT_EXAMPLES.items():
            emb = get_embedding(" ".join(examples))
            _INTENT_EMBEDDINGS[intent] = emb / (norm(emb) + 1e-12)
    except ImportError:
        _INTENT_EMBEDDINGS = {}


def _cosine_similarity(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b) / (norm(a) * norm(b) + 1e-12))


class CerezoIntentClassifier:

    @staticmethod
    async def classify(message: str) -> dict:
        _lazy_load_embeddings()
        if not _INTENT_EMBEDDINGS:
            return {"intent": "unknown", "confidence": 0.0, "entities": {}}

        try:
            from backend.app.core.embeddings import get_embedding
            msg_emb = get_embedding(message)
            msg_emb = msg_emb / (norm(msg_emb) + 1e-12)
        except Exception:
            return {"intent": "unknown", "confidence": 0.0, "entities": {}}

        best_intent = "unknown"
        best_score = 0.0
        for intent, emb in _INTENT_EMBEDDINGS.items():
            score = _cosine_similarity(msg_emb, emb)
            if score > best_score:
                best_score = score
                best_intent = intent

        if best_score < 0.4:
            best_intent = "unknown"

        return {"intent": best_intent, "confidence": round(best_score, 4), "entities": {}}
```

- [ ] **Step 5: Run test to verify it passes**

Run:
```bash
cd backend
$env:PYTHONPATH=".."
python -m pytest tests/test_cerezo_classifier.py -v
```
Expected: 5 PASS

- [ ] **Step 6: Commit**

```bash
git add backend/app/services/cerezo/__init__.py backend/app/services/cerezo/classifier.py backend/tests/test_cerezo_classifier.py
git commit -m "feat: Cerezo IntentClassifier — ONNX embedding-based intent classification"
```

---

### Task 2: EntityExtractor

**Files:**
- Create: `backend/app/services/cerezo/entity_extractor.py`
- Create: `backend/tests/test_cerezo_entity_extractor.py`

**Interfaces:**
- Produces: `CerezoEntityExtractor.extract(text: str, intent: str) -> dict`
  - Returns: `{ clubes: list[str], fecha: str | None, torneo: str | None }`
- Consumes: None (standalone)

- [ ] **Step 1: Write the failing test**

```python
import pytest
from backend.app.services.cerezo.entity_extractor import CerezoEntityExtractor


@pytest.mark.asyncio
async def test_extract_club_by_name():
    result = await CerezoEntityExtractor.extract("Datos de Olimpia", "club_info")
    assert "olimpia" in result["clubes"]


@pytest.mark.asyncio
async def test_extract_club_by_alias():
    result = await CerezoEntityExtractor.extract("Cómo le fue al Ciclón", "head_to_head")
    assert "cerro-porteno" in result["clubes"]


@pytest.mark.asyncio
async def test_extract_two_clubs():
    result = await CerezoEntityExtractor.extract("Olimpia vs Cerro Porteño", "match_result")
    assert "olimpia" in result["clubes"]
    assert "cerro-porteno" in result["clubes"]


@pytest.mark.asyncio
async def test_extract_fecha_keyword():
    result = await CerezoEntityExtractor.extract("Quién ganó el último partido", "match_result")
    assert result["fecha"] == "ultimo"


@pytest.mark.asyncio
async def test_extract_no_clubes():
    result = await CerezoEntityExtractor.extract("Cómo viene la tabla", "table_position")
    assert result["clubes"] == []
```

- [ ] **Step 2: Run to verify it fails**

Run:
```bash
cd backend
$env:PYTHONPATH=".."
python -m pytest tests/test_cerezo_entity_extractor.py -v
```
Expected: FAIL

- [ ] **Step 3: Write implementation**

```python
_CLUB_ALIASES: dict[str, str] = {
    "olimpia": "olimpia",
    "el decano": "olimpia",
    "decano": "olimpia",
    "cerro porteño": "cerro-porteno",
    "cerro porteno": "cerro-porteno",
    "cerro": "cerro-porteno",
    "el ciclón": "cerro-porteno",
    "el ciclon": "cerro-porteno",
    "ciclón": "cerro-porteno",
    "ciclon": "cerro-porteno",
    "libertad": "libertad",
    "gumarelo": "libertad",
    "guaraní": "guarani",
    "guarani": "guarani",
    "el aborigen": "guarani",
    "aborigen": "guarani",
    "nacional": "nacional",
    "tricolor": "nacional",
    "sol de américa": "sol-de-america",
    "sol de america": "sol-de-america",
    "sol": "sol-de-america",
    "luqueño": "sportivo-luqueno",
    "sportivo luqueño": "sportivo-luqueno",
    "sportivo luqueno": "sportivo-luqueno",
    "luque": "sportivo-luqueno",
    "capiatá": "deportivo-capiat",
    "deportivo capiatá": "deportivo-capiat",
    "tacuary": "tacuary",
    "tacua": "tacuary",
}

_FECHA_KEYWORDS: dict[str, str] = {
    "último": "ultimo",
    "ultimo": "ultimo",
    "última": "ultimo",
    "ultima": "ultimo",
    "próximo": "proximo",
    "proximo": "proximo",
    "próxima": "proximo",
    "proxima": "proximo",
    "ayer": "ayer",
    "pasado": "ultimo",
    "anterior": "ultimo",
}


class CerezoEntityExtractor:

    @staticmethod
    async def extract(text: str, intent: str) -> dict:
        text_lower = text.lower()
        clubes = []
        for alias, club_id in _CLUB_ALIASES.items():
            if alias in text_lower and club_id not in clubes:
                clubes.append(club_id)

        fecha = None
        for keyword, value in _FECHA_KEYWORDS.items():
            if keyword in text_lower:
                fecha = value
                break

        torneo = None
        for t in ["apertura", "clausura"]:
            if t in text_lower:
                # Find year like "apertura 2025"
                import re
                match = re.search(rf"{t}\s*(\d{{4}})?", text_lower)
                if match:
                    year = match.group(1) or ""
                    torneo = f"{t.capitalize()} {year}".strip()

        return {"clubes": clubes, "fecha": fecha, "torneo": torneo}
```

- [ ] **Step 4: Run to verify it passes**

Run:
```bash
cd backend
$env:PYTHONPATH=".."
python -m pytest tests/test_cerezo_entity_extractor.py -v
```
Expected: 5 PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/cerezo/entity_extractor.py backend/tests/test_cerezo_entity_extractor.py
git commit -m "feat: Cerezo EntityExtractor — club alias matching + fecha parsing"
```

---

### Task 3: DataFetcher

**Files:**
- Create: `backend/app/services/cerezo/data_fetcher.py`
- Create: `backend/tests/test_cerezo_data_fetcher.py`

**Interfaces:**
- Produces: `CerezoDataFetcher.fetch(intent: str, entities: dict, db: AsyncSession) -> dict`
  - Returns data relevant to the intent (club detail, match results, table, etc.)
- Consumes: ClubService, PartidoService, TablaService

- [ ] **Step 1: Write the failing test**

```python
import pytest
from backend.app.services.cerezo.data_fetcher import CerezoDataFetcher
from backend.tests.conftest import seed_test_data


@pytest.mark.asyncio
async def test_fetch_club_info(db_session):
    await seed_test_data(db_session)
    result = await CerezoDataFetcher.fetch(
        "club_info", {"clubes": ["olimpia"], "fecha": None, "torneo": None}, db_session
    )
    assert result is not None
    assert result.get("club") is not None
    assert result["club"]["nombre"] == "Club Olimpia"


@pytest.mark.asyncio
async def test_fetch_table_position(db_session):
    await seed_test_data(db_session)
    result = await CerezoDataFetcher.fetch(
        "table_position", {"clubes": [], "fecha": None, "torneo": None}, db_session
    )
    assert result is not None
    assert "tabla" in result


@pytest.mark.asyncio
async def test_fetch_unknown_intent(db_session):
    result = await CerezoDataFetcher.fetch(
        "greeting", {"clubes": [], "fecha": None, "torneo": None}, db_session
    )
    assert result == {}
```

- [ ] **Step 2: Run to verify it fails**

Run:
```bash
cd backend
$env:PYTHONPATH=".."
python -m pytest tests/test_cerezo_data_fetcher.py -v
```
Expected: FAIL

- [ ] **Step 3: Write implementation**

```python
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.services.club_service import ClubService
from backend.app.services.partido_service import PartidoService
from backend.app.services.tabla_service import TablaService


class CerezoDataFetcher:

    @staticmethod
    async def fetch(intent: str, entities: dict, db: AsyncSession) -> dict:
        if intent == "club_info" and entities.get("clubes"):
            club_id = entities["clubes"][0]
            club = await ClubService.get_by_id(db, club_id)
            return {"club": club.model_dump() if club else None}

        if intent == "match_result" and entities.get("clubes"):
            clubes = entities["clubes"]
            local_id = clubes[0]
            visitante_id = clubes[1] if len(clubes) > 1 else None
            service = PartidoService()
            partidos = await service.get_all(db)
            # Find matches involving the requested clubs
            matches = [
                p.model_dump() for p in partidos
                if (p.local_id == local_id or p.visitante_id == local_id)
            ]
            return {"partidos": matches}

        if intent == "head_to_head" and len(entities.get("clubes", [])) >= 2:
            club_a, club_b = entities["clubes"][0], entities["clubes"][1]
            service = PartidoService()
            partidos = await service.get_all(db)
            h2h = [
                p.model_dump() for p in partidos
                if (p.local_id == club_a and p.visitante_id == club_b)
                or (p.local_id == club_b and p.visitante_id == club_a)
            ]
            return {"head_to_head": h2h}

        if intent == "table_position":
            service = TablaService()
            tabla = await service.get_all(db)
            return {"tabla": [t.model_dump() for t in tabla]}

        if intent == "prediction" and entities.get("clubes"):
            clubes_ids = entities["clubes"]
            service = PartidoService()
            partidos = await service.get_all(db)
            upcoming = [
                p for p in partidos
                if p.estado == "programado"
                and (not clubes_ids or p.local_id in clubes_ids or p.visitante_id in clubes_ids)
            ]
            return {"proximos": [p.model_dump() for p in upcoming]}

        return {}
```

- [ ] **Step 4: Run to verify it passes**

Run:
```bash
cd backend
$env:PYTHONPATH=".."
python -m pytest tests/test_cerezo_data_fetcher.py -v
```
Expected: 3 PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/cerezo/data_fetcher.py backend/tests/test_cerezo_data_fetcher.py
git commit -m "feat: Cerezo DataFetcher — integrate club/partido/tabla services"
```

---

### Task 4: PredictionEngine

**Files:**
- Create: `backend/app/services/cerezo/prediction_engine.py`
- Create: `backend/tests/test_cerezo_prediction_engine.py`

**Interfaces:**
- Produces: `CerezoPredictionEngine.predict(db: AsyncSession, entities: dict) -> dict`
  - Returns: `{ local_win_pct: float, draw_pct: float, visitor_win_pct: float, confidence: str }`

- [ ] **Step 1: Write the failing test**

```python
import pytest
from backend.app.services.cerezo.prediction_engine import CerezoPredictionEngine
from backend.tests.conftest import seed_test_data


@pytest.mark.asyncio
async def test_predict_with_entities(db_session):
    await seed_test_data(db_session)
    result = await CerezoPredictionEngine.predict(
        db_session, {"clubes": ["olimpia", "cerro-porteno"], "fecha": None, "torneo": None}
    )
    assert "local_win_pct" in result
    assert "draw_pct" in result
    assert "visitor_win_pct" in result
    assert result["confidence"] in ("alta", "media", "baja")


@pytest.mark.asyncio
async def test_predict_no_data_returns_low_confidence(db_session):
    result = await CerezoPredictionEngine.predict(
        db_session, {"clubes": ["olimpia"], "fecha": None, "torneo": None}
    )
    assert result["confidence"] == "baja"


@pytest.mark.asyncio
async def test_predict_sums_to_100(db_session):
    await seed_test_data(db_session)
    result = await CerezoPredictionEngine.predict(
        db_session, {"clubes": ["olimpia", "cerro-porteno"], "fecha": None, "torneo": None}
    )
    total = result["local_win_pct"] + result["draw_pct"] + result["visitor_win_pct"]
    assert abs(total - 100) < 1
```

- [ ] **Step 2: Run to verify it fails**

Run:
```bash
cd backend
$env:PYTHONPATH=".."
python -m pytest tests/test_cerezo_prediction_engine.py -v
```
Expected: FAIL

- [ ] **Step 3: Write implementation**

```python
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.models.partido import Partido


class CerezoPredictionEngine:

    @staticmethod
    async def predict(db: AsyncSession, entities: dict) -> dict:
        clubes = entities.get("clubes", [])
        if len(clubes) < 2:
            return {"local_win_pct": 33.3, "draw_pct": 33.3, "visitor_win_pct": 33.3, "confidence": "baja"}

        local_id, visitante_id = clubes[0], clubes[1]

        # Get H2H matches
        result = await db.execute(
            select(Partido).where(
                Partido.estado == "finalizado",
                (
                    (Partido.local_id == local_id) & (Partido.visitante_id == visitante_id)
                ) | (
                    (Partido.local_id == visitante_id) & (Partido.visitante_id == local_id)
                ),
            ).order_by(Partido.fecha.desc()).limit(5)
        )
        h2h = result.scalars().all()

        if not h2h:
            return {"local_win_pct": 33.3, "draw_pct": 33.3, "visitor_win_pct": 33.3, "confidence": "baja"}

        local_wins = 0
        visitor_wins = 0
        draws = 0

        for p in h2h:
            if p.goles_local is None or p.goles_visitante is None:
                continue
            if p.goles_local > p.goles_visitante:
                if p.local_id == local_id:
                    local_wins += 1
                else:
                    visitor_wins += 1
            elif p.goles_visitante > p.goles_local:
                if p.visitante_id == visitante_id:
                    visitor_wins += 1
                else:
                    local_wins += 1
            else:
                draws += 1

        total = local_wins + visitor_wins + draws
        if total == 0:
            return {"local_win_pct": 33.3, "draw_pct": 33.3, "visitor_win_pct": 33.3, "confidence": "baja"}

        local_pct = round((local_wins / total) * 100, 1)
        draw_pct = round((draws / total) * 100, 1)
        visitor_pct = round((visitor_wins / total) * 100, 1)

        if total >= 5:
            confidence = "alta"
        elif total >= 3:
            confidence = "media"
        else:
            confidence = "baja"

        return {
            "local_win_pct": local_pct,
            "draw_pct": draw_pct,
            "visitor_win_pct": visitor_pct,
            "confidence": confidence,
            "total_partidos": total,
        }
```

- [ ] **Step 4: Run to verify it passes**

Run:
```bash
cd backend
$env:PYTHONPATH=".."
python -m pytest tests/test_cerezo_prediction_engine.py -v
```
Expected: 3 PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/cerezo/prediction_engine.py backend/tests/test_cerezo_prediction_engine.py
git commit -m "feat: Cerezo PredictionEngine — H2H statistical predictions"
```

---

### Task 5: ResponseGenerator (Tiny LLM + Templates)

**Files:**
- Create: `backend/app/services/cerezo/response_generator.py`
- Create: `backend/tests/test_cerezo_response_generator.py`

**Interfaces:**
- Produces: `CerezoResponseGenerator.generate(intent: str, data: dict, prediction: dict | None, message: str) -> str`
  - Tries tiny LLM first, falls back to templates

- [ ] **Step 1: Write the failing test**

```python
import pytest
from backend.app.services.cerezo.response_generator import CerezoResponseGenerator


@pytest.mark.asyncio
async def test_generate_greeting():
    answer = await CerezoResponseGenerator.generate("greeting", {}, None, "Hola")
    assert isinstance(answer, str)
    assert len(answer) > 0


@pytest.mark.asyncio
async def test_generate_club_info():
    data = {
        "club": {
            "nombre": "Club Olimpia",
            "fundacion": "1902",
            "titulos_liga": 46,
            "titulos_internacionales": [{"torneo": "Copa Libertadores", "cantidad": 3}],
        }
    }
    answer = await CerezoResponseGenerator.generate("club_info", data, None, "Datos de Olimpia")
    assert "Olimpia" in answer
    assert "46" in answer or "1902" in answer


@pytest.mark.asyncio
async def test_generate_prediction():
    data = {"proximos": [{"local_id": "olimpia", "visitante_id": "cerro-porteno"}]}
    prediction = {"local_win_pct": 55.0, "draw_pct": 25.0, "visitor_win_pct": 20.0, "confidence": "media"}
    answer = await CerezoResponseGenerator.generate("prediction", data, prediction, "Quién gana")
    assert isinstance(answer, str)
    assert len(answer) > 0
```

- [ ] **Step 2: Run to verify it fails**

Run:
```bash
cd backend
$env:PYTHONPATH=".."
python -m pytest tests/test_cerezo_response_generator.py -v
```
Expected: FAIL

- [ ] **Step 3: Write implementation**

```python
import json
import logging

logger = logging.getLogger(__name__)

_TEMPLATES: dict[str, list[str]] = {
    "greeting": [
        "¡Hola! Soy Cerezo Digital. Preguntame sobre clubes, partidos, la tabla, o pedime predicciones.",
        "¡Hola, hincha! Estoy acá para responder todo sobre la liga paraguaya. ¿Qué querés saber?",
    ],
    "club_info": [
        "{club[nombre]} fue fundado en {club[fundacion]}. Tiene {club[titulos_liga]} títulos de liga y {total_intl} títulos internacionales.",
        "{club[nombre]} juega en {club[estadio]}, fundado en {club[fundacion]}. {titulos_resumen}",
    ],
    "table_position": [
        "Acá va la tabla: {tabla_resumen}.",
        "Mirá cómo viene la cosa: {tabla_resumen}.",
    ],
    "prediction": [
        "Según los datos, {local} tiene {local_pct}% de ganar, {draw_pct}% empate, {visitante_pct}% {visitante}. Confianza: {confidence}.",
        "Cerezo dice: {local} {local_pct}% — {draw_pct}% empate — {visitante} {visitante_pct}%. Basado en {total_h2h} partidos históricos.",
    ],
    "head_to_head": [
        "En los últimos {total} partidos: {local_nombre} ganó {local_wins}, {visitante_nombre} ganó {vis_wins}, {draws} empates.",
    ],
    "match_result": [
        "Los últimos partidos: {resumen_partidos}",
    ],
    "top_scorer": [
        "Todavía no tengo datos de goleadores actualizados al instante. Preguntame sobre clubes o partidos.",
    ],
    "unknown": [
        "No entendí bien. Probá preguntar: datos de un club, quién ganó un partido, cómo viene la tabla, o quién va a ganar.",
        "No estoy seguro de lo que preguntás. Decime algo como: 'Datos de Olimpia', 'Quién ganó el clásico', o 'Quién lidera la tabla'.",
    ],
}

_LLM_AVAILABLE: bool | None = None
_LLM = None


def _get_llm():
    global _LLM, _LLM_AVAILABLE
    if _LLM_AVAILABLE is False:
        return None
    if _LLM is not None:
        return _LLM
    try:
        from llama_cpp import Llama
        import os
        model_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
            "models",
            "Llama-3.2-1B-Instruct-Q4_K_M.gguf",
        )
        if not os.path.exists(model_path):
            logger.warning("Tiny LLM model not found at %s", model_path)
            _LLM_AVAILABLE = False
            return None
        _LLM = Llama(model_path, n_ctx=512, verbose=False)
        _LLM_AVAILABLE = True
        return _LLM
    except Exception as e:
        logger.warning("Failed to load tiny LLM: %s", e)
        _LLM_AVAILABLE = False
        return None


def _render_template(intent: str, data: dict, prediction: dict | None) -> str:
    import random
    templates = _TEMPLATES.get(intent, _TEMPLATES["unknown"])
    template = random.choice(templates)

    ctx = {}

    if intent == "club_info" and data.get("club"):
        club = data["club"]
        ctx["club"] = club
        total_intl = sum(t["cantidad"] for t in club.get("titulos_internacionales", []))
        ctx["total_intl"] = total_intl
        ctx["titulos_resumen"] = f"Tiene {club['titulos_liga']} ligas y {total_intl} títulos internacionales." if total_intl else f"Tiene {club['titulos_liga']} títulos de liga."
        if "estadio" in club:
            ctx["club"]["estadio"] = club["estadio"]

    if intent == "prediction" and prediction:
        ctx["local_pct"] = prediction["local_win_pct"]
        ctx["draw_pct"] = prediction["draw_pct"]
        ctx["visitante_pct"] = prediction["visitor_win_pct"]
        ctx["local"] = "Local"
        ctx["visitante"] = "Visitante"
        ctx["confidence"] = prediction["confidence"]
        ctx["total_h2h"] = prediction.get("total_partidos", 0)

    if intent == "head_to_head" and data.get("head_to_head"):
        h2h = data["head_to_head"]
        ctx["total"] = len(h2h)
        ctx["local_wins"] = sum(1 for p in h2h if p["goles_local"] is not None and p["goles_local"] > p["goles_visitante"])
        ctx["vis_wins"] = sum(1 for p in h2h if p["goles_visitante"] is not None and p["goles_visitante"] > p["goles_local"])
        ctx["draws"] = sum(1 for p in h2h if p.get("goles_local") == p.get("goles_visitante"))
        ctx["local_nombre"] = "Local"
        ctx["visitante_nombre"] = "Visitante"

    return template.format(**ctx) if ctx else template


class CerezoResponseGenerator:

    @staticmethod
    async def generate(intent: str, data: dict, prediction: dict | None, message: str) -> str:
        llm = _get_llm()
        if llm is not None:
            try:
                context = json.dumps(data, ensure_ascii=False, default=str)
                prompt = f"""Contexto real:
{context}

Instrucción: Respondé como un hincha paraguayo de fútbol, natural, con vocabulario local. Máximo 2 oraciones. No inventes datos.

Pregunta: {message}
Respuesta:"""
                response = llm(prompt, max_tokens=100, temperature=0.5, stop=["\n\n"])
                text = response["choices"][0]["text"].strip()
                if text:
                    return text
            except Exception as e:
                logger.warning("Tiny LLM response failed, falling back to template: %s", e)

        return _render_template(intent, data, prediction)
```

- [ ] **Step 4: Run to verify it passes**

Run:
```bash
cd backend
$env:PYTHONPATH=".."
python -m pytest tests/test_cerezo_response_generator.py -v
```
Expected: 3 PASS

- [ ] **Step 5: Commit**

```bash
git add backend/app/services/cerezo/response_generator.py backend/tests/test_cerezo_response_generator.py
git commit -m "feat: Cerezo ResponseGenerator — tiny LLM + template fallback"
```

---

### Task 6: Router + Wiring

**Files:**
- Create: `backend/app/api/cerezo.py`
- Modify: `backend/app/main.py` (import + register router, add to root endpoint list)
- Modify: `backend/requirements.txt` (add llama-cpp-python)
- Create: `backend/tests/test_cerezo_api.py`

**Interfaces:**
- Consumes: All 5 Cerezo services
- Produces: `POST /api/v1/cerezo/ask` endpoint

- [ ] **Step 1: Write the failing test**

```python
import pytest
from backend.tests.conftest import seed_test_data


@pytest.mark.asyncio
async def test_cerezo_ask_greeting(client):
    response = await client.post("/api/v1/cerezo/ask", json={"message": "Hola cerezo"})
    assert response.status_code == 200
    data = response.json()
    assert data["intent"] == "greeting"
    assert len(data["answer"]) > 0


@pytest.mark.asyncio
async def test_cerezo_ask_club_info(client, db_session):
    await seed_test_data(db_session)
    response = await client.post("/api/v1/cerezo/ask", json={"message": "Datos de Olimpia"})
    assert response.status_code == 200
    data = response.json()
    assert data["intent"] == "club_info"
    assert "Olimpia" in data["answer"]


@pytest.mark.asyncio
async def test_cerezo_ask_empty_message(client):
    response = await client.post("/api/v1/cerezo/ask", json={"message": ""})
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_cerezo_ask_invalid_body(client):
    response = await client.post("/api/v1/cerezo/ask", json={})
    assert response.status_code == 422
```

- [ ] **Step 2: Run to verify it fails**

Run:
```bash
cd backend
$env:PYTHONPATH=".."
python -m pytest tests/test_cerezo_api.py -v
```
Expected: FAIL (import error — router not registered)

- [ ] **Step 3: Write the router**

```python
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.dependencies import get_db
from backend.app.services.cerezo.classifier import CerezoIntentClassifier
from backend.app.services.cerezo.entity_extractor import CerezoEntityExtractor
from backend.app.services.cerezo.data_fetcher import CerezoDataFetcher
from backend.app.services.cerezo.prediction_engine import CerezoPredictionEngine
from backend.app.services.cerezo.response_generator import CerezoResponseGenerator

router = APIRouter(prefix="/api/v1/cerezo", tags=["cerezo"])


class AskRequest(BaseModel):
    message: str


class AskResponse(BaseModel):
    intent: str
    answer: str
    confidence: float
    data: dict | None = None
    prediction: dict | None = None


@router.post("/ask", response_model=AskResponse)
async def cerezo_ask(body: AskRequest, db: AsyncSession = Depends(get_db)):
    message = body.message.strip()
    if not message:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Mensaje vacío")

    # Pipeline
    classification = await CerezoIntentClassifier.classify(message)
    intent = classification["intent"]
    confidence = classification["confidence"]
    entities = await CerezoEntityExtractor.extract(message, intent)
    data = await CerezoDataFetcher.fetch(intent, entities, db)

    prediction = None
    if intent == "prediction":
        prediction = await CerezoPredictionEngine.predict(db, entities)

    answer = await CerezoResponseGenerator.generate(intent, data, prediction, message)

    return AskResponse(
        intent=intent,
        answer=answer,
        confidence=confidence,
        data=data if data else None,
        prediction=prediction,
    )
```

- [ ] **Step 4: Register router in main.py**

At the top of main.py, add the import below the existing imports:
```python
from backend.app.api.cerezo import router as cerezo_router
```

After `app.include_router(cron_router)`, add:
```python
app.include_router(cerezo_router)
```

Just add at the end of main.py, before the `@app.get("/")`:
```python
from backend.app.api.v1.cerezo import router as cerezo_router
app.include_router(cerezo_router)
```

And add `"/api/v1/cerezo/ask"` to the root endpoint list.

- [ ] **Step 5: Add llama-cpp-python to requirements.txt**

Append to `backend/requirements.txt`:
```
llama-cpp-python>=0.3.0
```

- [ ] **Step 6: Run tests to verify it passes**

Run:
```bash
cd backend
$env:PYTHONPATH=".."
python -m pytest tests/test_cerezo_api.py -v
```
Expected: 4 PASS (note: test_cerezo_ask_club_info requires seed data, might need adjustment)

If test_cerezo_ask_club_info fails because the classifier returns `unknown` for the test's small message, adjust the classifier's threshold or use a message that matches better. The fallback should still return an answer.

- [ ] **Step 7: Commit**

```bash
git add backend/app/api/cerezo.py backend/tests/test_cerezo_api.py backend/app/main.py backend/requirements.txt
git commit -m "feat: Cerezo router + wiring + llama-cpp-python dep"
```

---

### Task 7: Frontend — Página `/cerezo`

**Files:**
- Create: `frontend/src/app/cerezo/page.tsx`
- Create: `frontend/src/components/cerezo/ChatBubble.tsx`
- Create: `frontend/src/components/cerezo/PredictionCard.tsx`
- Create: `frontend/src/components/cerezo/TypingIndicator.tsx`
- Modify: `frontend/src/components/layout/Navbar.tsx` (add Cerezo link)

**Interfaces:**
- Consumes: `POST /api/v1/cerezo/ask` from backend

- [ ] **Step 1: Create TypingIndicator**

`frontend/src/components/cerezo/TypingIndicator.tsx`:
```tsx
export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-2 px-4 py-3">
      <span className="text-sm text-gray-400">Cerezo está pensando</span>
      <span className="flex gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-[#76e4f7] animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-1.5 h-1.5 rounded-full bg-[#76e4f7] animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-1.5 h-1.5 rounded-full bg-[#76e4f7] animate-bounce" style={{ animationDelay: "300ms" }} />
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Create PredictionCard**

`frontend/src/components/cerezo/PredictionCard.tsx`:
```tsx
interface Prediction {
  local_win_pct: number;
  draw_pct: number;
  visitor_win_pct: number;
  confidence: string;
}

export default function PredictionCard({ prediction }: { prediction: Prediction }) {
  const confidenceColor = prediction.confidence === "alta" ? "text-green-400" : prediction.confidence === "media" ? "text-yellow-400" : "text-gray-400";
  return (
    <div className="mt-2 p-3 rounded-lg bg-[#0a1628]/60 border border-white/10">
      <div className="text-xs text-gray-500 mb-2">Predicción de Cerezo</div>
      <div className="flex gap-1 h-6 rounded-full overflow-hidden mb-2">
        <div className="bg-blue-500 text-xs text-white flex items-center justify-center" style={{ width: `${prediction.local_win_pct}%` }}>
          {prediction.local_win_pct > 10 && `${prediction.local_win_pct}%`}
        </div>
        <div className="bg-gray-500 text-xs text-white flex items-center justify-center" style={{ width: `${prediction.draw_pct}%` }}>
          {prediction.draw_pct > 10 && `${prediction.draw_pct}%`}
        </div>
        <div className="bg-red-500 text-xs text-white flex items-center justify-center" style={{ width: `${prediction.visitor_win_pct}%` }}>
          {prediction.visitor_win_pct > 10 && `${prediction.visitor_win_pct}%`}
        </div>
      </div>
      <div className={`text-[10px] ${confidenceColor}`}>Confianza: {prediction.confidence}</div>
    </div>
  );
}
```

- [ ] **Step 3: Create ChatBubble**

`frontend/src/components/cerezo/ChatBubble.tsx`:
```tsx
import PredictionCard from "./PredictionCard";

interface Message {
  role: "user" | "assistant";
  content: string;
  prediction?: {
    local_win_pct: number;
    draw_pct: number;
    visitor_win_pct: number;
    confidence: string;
  } | null;
}

export default function ChatBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[80%] p-4 rounded-2xl ${isUser ? "bg-[#76e4f7]/10 border border-[#76e4f7]/30" : "bg-white/5 border border-white/10"}`}>
        {!isUser && <div className="text-[10px] text-[#76e4f7] font-bold mb-1">Cerezo Digital</div>}
        <p className="text-sm text-gray-200 whitespace-pre-wrap">{message.content}</p>
        {!isUser && message.prediction && <PredictionCard prediction={message.prediction} />}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create page**

`frontend/src/app/cerezo/page.tsx`:
```tsx
"use client";

import { useState, useRef, useEffect } from "react";
import ChatBubble from "@/components/cerezo/ChatBubble";
import TypingIndicator from "@/components/cerezo/TypingIndicator";

interface Message {
  role: "user" | "assistant";
  content: string;
  prediction?: {
    local_win_pct: number;
    draw_pct: number;
    visitor_win_pct: number;
    confidence: string;
  } | null;
}

export default function CerezoPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "¡Hola! Soy Cerezo Digital. Preguntame sobre clubes, partidos, la tabla, o pedime predicciones." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg: Message = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/cerezo/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      if (!res.ok) throw new Error("Error en la respuesta");
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.answer, prediction: data.prediction }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "Hubo un error de conexión. Intentá de nuevo." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold">Cerezo Digital</h1>
        <p className="text-gray-400 mt-1">El asistente inteligente de la liga paraguaya</p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0a1628]/60 h-[60vh] flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <ChatBubble key={i} message={msg} />
          ))}
          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSubmit} className="border-t border-white/10 p-4 flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Preguntale a Cerezo..."
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#76e4f7]/50"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-6 py-3 rounded-xl bg-[#76e4f7] text-black font-semibold text-sm hover:brightness-110 transition disabled:opacity-50"
          >
            {loading ? "..." : "Enviar"}
          </button>
        </form>
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Add Cerezo link to Navbar**

In `frontend/src/components/layout/Navbar.tsx`, add the Cerezo link after the Predicciones link (after line 35):

```tsx
<Link href="/cerezo" onClick={closeMenu} className="hover:text-white transition">Cerezo</Link>
```

- [ ] **Step 6: Build frontend to verify**

Run:
```bash
cd frontend
npm run build
```
Expected: Build succeeds with no type errors.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/app/cerezo/ frontend/src/components/cerezo/ frontend/src/components/layout/Navbar.tsx
git commit -m "feat: Cerezo frontend — page, chat components, Navbar link"
```

---

### Task 8: Docker Model + Final Verification

**Files:**
- Modify: `Dockerfile.backend` (download GGUF model at build time)

- [ ] **Step 1: Update Dockerfile**

Add before the CMD:
```dockerfile
RUN mkdir -p /app/models && \
    apt-get update && apt-get install -y wget && \
    wget -q -O /app/models/Llama-3.2-1B-Instruct-Q4_K_M.gguf \
    https://huggingface.co/bartowski/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q4_K_M.gguf
```

- [ ] **Step 2: Run all backend tests**

```bash
cd backend
$env:PYTHONPATH=".."
python -m pytest tests/ -v
```
Expected: All tests pass (existing 64 + ~21 new = ~85 total)

- [ ] **Step 3: Commit**

```bash
git add Dockerfile.backend
git commit -m "feat: add tiny LLM model download to Dockerfile"
```

---

### Task 9: Update Handoff.md

- [ ] **Step 1: Add Cerezo to Handoff.md**

Run:
```bash
git add Handoff.md
git commit -m "docs: update Handoff with Cerezo Digital feature"
```

- [ ] **Step 2: Final verification**

```bash
cd backend
$env:PYTHONPATH=".."
python -m pytest tests/ -v
cd ../frontend
npm run build
```
Expected: All tests pass, frontend builds.
