# Task 5: ResponseGenerator (Tiny LLM + Templates)

## Files
- Create: `backend/app/services/cerezo/response_generator.py`
- Create: `backend/tests/test_cerezo_response_generator.py`

## Interface
- `CerezoResponseGenerator.generate(intent: str, data: dict, prediction: dict | None, message: str) -> str`
  - Tries tiny LLM first, falls back to templates

## Test Code

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

## Implementation

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

## Steps

1. Write test file
2. Run: `cd backend && $env:PYTHONPATH=".." && python -m pytest tests/test_cerezo_response_generator.py -v`
   Expected: FAIL (module not found)
3. Write implementation
4. Run test again — Expected: 3 PASS (without llama-cpp-python, it falls back to templates)
5. Commit:
```bash
git add backend/app/services/cerezo/response_generator.py backend/tests/test_cerezo_response_generator.py
git commit -m "feat: Cerezo ResponseGenerator — tiny LLM + template fallback"
```
