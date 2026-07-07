from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.app.core.dependencies import get_db
from backend.app.schemas.user import UserLogin, UserOut
from backend.app.services.user_service import UserService

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/login", response_model=UserOut)
async def login(body: UserLogin, db: AsyncSession = Depends(get_db)):
    if not body.email or not body.name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="email and name required")
    return await UserService.upsert(db, body)
