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
    message = body.message.strip()
    classifier_result = await CerezoIntentClassifier.classify(message)
    intent = classifier_result["intent"]
    entities = await CerezoEntityExtractor.extract(message, intent)
    data = await CerezoDataFetcher.fetch(intent, entities, db)
    prediction = await CerezoPredictionEngine.predict(db, entities) if intent in ("prediction", "head_to_head") else None
    answer = await CerezoResponseGenerator.generate(intent, data, prediction, message)
    return CerezoResponse(message=answer, intent=intent, data=data, prediction=prediction, entities=entities)
