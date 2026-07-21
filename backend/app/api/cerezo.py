from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_db
from app.services.cerezo.classifier import CerezoIntentClassifier
from app.services.cerezo.entity_extractor import CerezoEntityExtractor
from app.services.cerezo.data_fetcher import CerezoDataFetcher
from app.services.cerezo.prediction_engine import CerezoPredictionEngine
from app.services.cerezo.response_generator import CerezoResponseGenerator

_cerezo_sessions: dict[str, dict] = {}

router = APIRouter(prefix="/api/v1/cerezo", tags=["cerezo"])


class CerezoRequest(BaseModel):
    message: str
    session_id: str | None = None


class CerezoResponse(BaseModel):
    message: str
    intent: str
    data: dict
    prediction: dict | None
    entities: dict
    structured_data: dict | None = None


def _build_structured_data(intent: str, data: dict, prediction: dict | None) -> dict | None:
    if intent == "table_position" and data.get("tabla"):
        return {"type": "table", "rows": data["tabla"], "highlight": data.get("club_posicion")}
    if intent == "club_info" and data.get("club"):
        return {"type": "club", "club": data["club"]}
    if intent == "prediction" and prediction:
        return {"type": "prediction", "prediction": prediction}
    if intent == "head_to_head" and data.get("head_to_head"):
        return {"type": "h2h", "matches": data["head_to_head"]}
    if intent == "next_match" and data.get("proximos"):
        return {"type": "next_match", "matches": data["proximos"]}
    if intent == "match_result" and data.get("forma"):
        return {"type": "forma", "forma": data["forma"], "partidos": data.get("partidos", [])}
    if intent == "club_comparison" and data.get("club_a"):
        return {"type": "comparison", "club_a": data["club_a"], "club_b": data.get("club_b"), "comparison": data.get("comparison")}
    return None


@router.post("/ask", response_model=CerezoResponse)
async def ask_cerezo(body: CerezoRequest, db: AsyncSession = Depends(get_db)):
    session_id = body.session_id or "default"
    if session_id not in _cerezo_sessions:
        _cerezo_sessions[session_id] = {"last_club_id": None, "last_club_nombre": None, "last_intent": None}
    ctx = _cerezo_sessions[session_id]

    message = body.message.strip()
    classifier_result = await CerezoIntentClassifier.classify(message)
    intent = classifier_result["intent"]

    if intent == "unknown":
        text_lower = message.lower()
        followup_words = ["y", "Ã©l", "ella", "cuÃ¡ndo juega", "cuando juega", "prÃ³ximo partido", "proximo partido", "prÃ³ximo", "proximo", "horario", "fecha", "dÃ­a juega", "dia juega", "se enfrenta", "partido de"]
        if ctx.get("last_club_id") and any(w in text_lower for w in followup_words):
            intent = "next_match"
            classifier_result["intent"] = "next_match"
            classifier_result["confidence"] = 0.5
            entities = {"clubes": [ctx["last_club_id"]], "fecha": "proximo", "torneo": None}
        else:
            entities = await CerezoEntityExtractor.extract(message, intent)
            if intent == "unknown" and entities.get("clubes"):
                intent = "club_info"
                classifier_result["intent"] = "club_info"
                classifier_result["confidence"] = 0.4
            else:
                data = {}
                prediction = None
                answer = await CerezoResponseGenerator.generate(intent, data, prediction, message)
                return CerezoResponse(message=answer, intent=intent, data=data, prediction=prediction, entities=entities, structured_data=None)
    else:
        entities = await CerezoEntityExtractor.extract(message, intent)

    data = await CerezoDataFetcher.fetch(intent, entities, db)
    prediction = await CerezoPredictionEngine.predict(db, entities) if intent in ("prediction", "head_to_head") else None
    answer = await CerezoResponseGenerator.generate(intent, data, prediction, message)
    structured = _build_structured_data(intent, data, prediction)

    if data.get("club"):
        ctx["last_club_id"] = data["club"]["id"]
        ctx["last_club_nombre"] = data["club"]["nombre"]
    elif data.get("club_a"):
        ctx["last_club_id"] = data["club_a"]["id"]
        ctx["last_club_nombre"] = data["club_a"]["nombre"]
    elif data.get("proximos"):
        club_id = entities.get("clubes", [None])[0] if entities.get("clubes") else None
        ctx["last_club_id"] = club_id
    elif data.get("club_posicion"):
        ctx["last_club_id"] = entities.get("clubes", [None])[0] if entities.get("clubes") else None
        ctx["last_club_nombre"] = data["club_posicion"].get("nombre", data["club_posicion"].get("club_nombre"))
    ctx["last_intent"] = intent

    return CerezoResponse(message=answer, intent=intent, data=data, prediction=prediction, entities=entities, structured_data=structured)
