from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.dependencies import get_db
from backend.app.services.cerezo.classifier import CerezoIntentClassifier
from backend.app.services.cerezo.entity_extractor import CerezoEntityExtractor
from backend.app.services.cerezo.data_fetcher import CerezoDataFetcher
from backend.app.services.cerezo.prediction_engine import CerezoPredictionEngine
from backend.app.services.cerezo.response_generator import CerezoResponseGenerator

_cerezo_context: dict = {
    "last_club_id": None,
    "last_club_nombre": None,
    "last_intent": None,
}

router = APIRouter(prefix="/api/v1/cerezo", tags=["cerezo"])


class CerezoRequest(BaseModel):
    message: str


class CerezoResponse(BaseModel):
    message: str
    intent: str
    data: dict
    prediction: dict | None
    entities: dict


@router.post("/ask", response_model=CerezoResponse)
async def ask_cerezo(body: CerezoRequest, db: AsyncSession = Depends(get_db)):
    global _cerezo_context
    message = body.message.strip()
    classifier_result = await CerezoIntentClassifier.classify(message)
    intent = classifier_result["intent"]

    if intent == "unknown":
        text_lower = message.lower()
        followup_words = ["y", "él", "ella", "cuándo juega", "cuando juega", "próximo partido", "proximo partido", "próximo", "proximo", "horario", "fecha", "día juega", "dia juega", "se enfrenta", "partido de"]
        if _cerezo_context.get("last_club_id") and any(w in text_lower for w in followup_words):
            intent = "next_match"
            classifier_result["intent"] = "next_match"
            classifier_result["confidence"] = 0.5
            entities = {"clubes": [_cerezo_context["last_club_id"]], "fecha": "proximo", "torneo": None}
        else:
            entities = await CerezoEntityExtractor.extract(message, intent)
            data = {}
            prediction = None
            answer = await CerezoResponseGenerator.generate(intent, data, prediction, message)
            return CerezoResponse(message=answer, intent=intent, data=data, prediction=prediction, entities=entities)
    else:
        entities = await CerezoEntityExtractor.extract(message, intent)

    data = await CerezoDataFetcher.fetch(intent, entities, db)
    prediction = await CerezoPredictionEngine.predict(db, entities) if intent in ("prediction", "head_to_head") else None
    answer = await CerezoResponseGenerator.generate(intent, data, prediction, message)

    if data.get("club"):
        _cerezo_context["last_club_id"] = data["club"]["id"]
        _cerezo_context["last_club_nombre"] = data["club"]["nombre"]
    elif data.get("club_a"):
        _cerezo_context["last_club_id"] = data["club_a"]["id"]
        _cerezo_context["last_club_nombre"] = data["club_a"]["nombre"]
    elif data.get("proximos"):
        club_id = entities.get("clubes", [None])[0] if entities.get("clubes") else None
        _cerezo_context["last_club_id"] = club_id
    _cerezo_context["last_intent"] = intent

    return CerezoResponse(message=answer, intent=intent, data=data, prediction=prediction, entities=entities)
