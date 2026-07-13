from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.core.dependencies import get_db, get_current_user
from backend.app.schemas.user import UserRegister, UserLogin, TokenResponse, UserOut
from backend.app.services.user_service import UserService
from backend.app.models.user import User

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse, status_code=201)
async def register(body: UserRegister, db: AsyncSession = Depends(get_db)):
    svc = UserService(db)
    try:
        result = await svc.register(body.email, body.name, body.password)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    user: User = result["user"]
    return TokenResponse(
        access_token=result["token"],
        user=UserOut(
            id=user.id, email=user.email, name=user.name, image=user.image,
            username=user.username, puntos=user.puntos,
        ),
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: UserLogin, db: AsyncSession = Depends(get_db)):
    svc = UserService(db)
    try:
        result = await svc.login(body.email, body.password)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))
    user: User = result["user"]
    return TokenResponse(
        access_token=result["token"],
        user=UserOut(
            id=user.id, email=user.email, name=user.name, image=user.image,
            username=user.username, puntos=user.puntos,
        ),
    )


@router.get("/me", response_model=UserOut)
async def me(current_user: User = Depends(get_current_user)):
    return UserOut(
        id=current_user.id, email=current_user.email, name=current_user.name,
        image=current_user.image, username=current_user.username, puntos=current_user.puntos,
    )
